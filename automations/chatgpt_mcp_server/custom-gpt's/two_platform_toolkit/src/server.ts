import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import {
  getToolkitPublicUrl,
  isGoogleOAuthConfigured,
  isMetaOAuthConfigured,
} from './config.js';
import { createOAuthRoutes } from './routes/oauth.js';
import { createToolRoutes } from './routes/tools.js';
import { ConnectionStore } from './storage/connections.js';

const port = Number(process.env.PORT ?? '3040');
const host = process.env.HOST ?? '0.0.0.0';

const logFilePath =
  process.env.TOOLKIT_LOG_FILE?.trim() || path.join(process.cwd(), 'data', 'server-debug.log');
fs.mkdirSync(path.dirname(logFilePath), { recursive: true });

const baseLog = console.log.bind(console);
const baseWarn = console.warn.bind(console);
const baseError = console.error.bind(console);

function mirror(level: 'INFO' | 'WARN' | 'ERROR', args: unknown[]): void {
  const msg = args
    .map((a) => {
      if (typeof a === 'string') return a;
      try {
        return JSON.stringify(a);
      } catch {
        return String(a);
      }
    })
    .join(' ');
  const line = `${new Date().toISOString()} [${level}] ${msg}\n`;
  try {
    fs.appendFileSync(logFilePath, line, 'utf8');
  } catch {
    // Avoid failing requests if disk logging is unavailable.
  }
}

console.log = (...args: unknown[]) => {
  mirror('INFO', args);
  baseLog(...args);
};
console.warn = (...args: unknown[]) => {
  mirror('WARN', args);
  baseWarn(...args);
};
console.error = (...args: unknown[]) => {
  mirror('ERROR', args);
  baseError(...args);
};

const app = express();
app.use(express.json({ limit: '2mb' }));

type ReqWithId = express.Request & { reqId?: string };

function shortHeader(value: string | undefined): string {
  if (!value) return '(missing)';
  if (value.length <= 6) return `${value[0]}***(${value.length})`;
  return `${value.slice(0, 3)}...${value.slice(-2)}(${value.length})`;
}

app.use((req, res, next) => {
  const rid = randomUUID().slice(0, 8);
  (req as ReqWithId).reqId = rid;
  const started = Date.now();
  const xApi = req.header('x-api-key');
  const ua = req.header('user-agent') || '(none)';
  console.log(
    `[req:${rid}] -> ${req.method} ${req.originalUrl} ip=${req.ip} x-api-key=${shortHeader(xApi)} ua=${ua.slice(0, 120)}`,
  );
  res.on('finish', () => {
    console.log(
      `[req:${rid}] <- ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started}ms`,
    );
  });
  next();
});

const connectionStore = new ConnectionStore();
app.use(createOAuthRoutes(connectionStore));

/** Register before tool routes: the tools `Router` uses global `requireApiKey` middleware. */
app.get('/v1/health', (_req, res) => {
  const publicBase = getToolkitPublicUrl();
  const googleUrl =
    publicBase != null
      ? `${publicBase}/v1/auth/google?user_ref=<user_ref>`
      : null;
  const instagramUrl =
    publicBase != null
      ? `${publicBase}/v1/auth/instagram?user_ref=<user_ref>`
      : null;
  res.json({
    ok: true,
    service: 'two_platform_toolkit',
    publicUrlConfigured: Boolean(publicBase),
    publicBase,
    oauth: {
      note:
        'Client secrets stay on this server only. The human must open connectUrlTemplate in a normal browser; ChatGPT cannot finish Google/Meta login inside the chat.',
      google: {
        configured: isGoogleOAuthConfigured(),
        connectUrlTemplate: googleUrl,
      },
      instagram: {
        configured: isMetaOAuthConfigured(),
        connectUrlTemplate: instagramUrl,
      },
      callbackPattern:
        publicBase != null ? `${publicBase}/v1/auth/{google|instagram}/callback` : null,
      connections: 'GET /v1/connections?user_ref=<user_ref> (requires X-API-Key)',
    },
    tools: {
      note: 'GET /v1/oauth/connect_urls and all POST /v1/tools/* require header X-API-Key: INTERNAL_API_KEY',
      oauth_connect_urls: 'GET /v1/oauth/connect_urls?user_ref=...',
      googlesheets_append_row: 'POST /v1/tools/googlesheets_append_row',
      instagram_send_reply: 'POST /v1/tools/instagram_send_reply',
      instagram_list_recent_conversations: 'POST /v1/tools/instagram_list_recent_conversations',
    },
  });
});

/** Public JSON (no API key). Kept on the main app so it cannot be lost behind router wiring. */
app.get('/v1/connections', (req, res) => {
  const userRef = typeof req.query.user_ref === 'string' ? req.query.user_ref.trim() : '';
  if (!userRef) {
    res.status(400).json({
      ok: false,
      error: 'Missing user_ref query parameter',
    });
    return;
  }
  res.json({
    ok: true,
    user_ref: userRef,
    connections: connectionStore.listForUser(userRef),
  });
});

app.use(createToolRoutes(connectionStore));

app.listen(port, host, () => {
  const publicBase = getToolkitPublicUrl();
  console.log(`two_platform_toolkit http://${host}:${port}/v1/health`);
  console.log(
    `[boot] TOOLKIT_PUBLIC_URL=${publicBase ?? '(missing)'} GOOGLE_OAUTH=${isGoogleOAuthConfigured()} META_OAUTH=${isMetaOAuthConfigured()} INTERNAL_API_KEY=${process.env.INTERNAL_API_KEY?.trim() ? 'set' : 'missing'}`,
  );
  console.log(`[boot] log_file=${logFilePath}`);
});
