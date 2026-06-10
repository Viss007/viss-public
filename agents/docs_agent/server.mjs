import 'dotenv/config';
import { randomBytes } from 'crypto';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import { extractInvoiceWithVision } from './lib/visionExtract.mjs';
import { buildInvoiceExcelBuffer } from './lib/excelExport.mjs';
import {
  invoiceLog,
  newRequestId,
  approxBase64Bytes,
  truncate,
} from './lib/processLogger.mjs';
import { getClientIp, tryConsumeDemoProcessSlot } from './lib/demoRateLimit.mjs';
import {
  notifyDemoLimitReached,
  notifyProcessStarted,
  notifyVisitIfEnabled,
} from './lib/gmailNotify.mjs';
import {
  buildGoogleAuthUrl,
  exchangeCodeForTokens,
  fetchGmailProfile,
  googleTokenFilePath,
  isGoogleOAuthConfigured,
  loadGoogleTokens,
  saveGoogleTokens,
} from './lib/google_oauth.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_REAL = path.join(__dirname, 'fixtures', 'real_example');
/** Allowlisted demo PDFs for “Try sample” buttons (basename must match on-disk case). */
const SAMPLE_PDF_ALLOWLIST = new Set([
  'TA0073451639.pdf',
  'DGK000286337.PDF',
  'Invoice-EXLNLKTM-0002.pdf',
  'Invoice-KEASNY6E-0005.pdf',
]);
/** Public runtime: docs_agent :3000, speed-to-lead :3001 — see docs/RUNTIME-3333.md */
const PORT = Number(process.env.PORT) || 3000;
const MAX_FILES = Number(process.env.MAX_FILES) || 25;
const MAX_PAGES_PER_FILE = Number(process.env.INVOICE_MAX_PAGES) || 12;
const JSON_LIMIT_MB = Number(process.env.JSON_BODY_LIMIT_MB) || 50;
function readDemoMaxProcessesPerIp() {
  const raw = process.env.INVOICE_DEMO_MAX_PROCESSES_PER_IP;
  if (raw === undefined || raw === '') return 5;
  const n = Number(raw);
  if (Number.isNaN(n)) return 5;
  return n;
}

/** Default 5. Set 0 to disable the cap (e.g. local dev). */
const DEMO_MAX_PROCESSES_PER_IP = readDemoMaxProcessesPerIp();

/** Total successful /api/process completions (any IP). Resets on deploy. Independent of per-IP cap. */
const GLOBAL_MAX_SUCCESSFUL_PROCESSES = 50;
let globalSuccessfulProcessCount = 0;

const app = express();

const OAUTH_STATE_TTL_MS = 15 * 60 * 1000;
const oauthStates = new Map();

function mintOAuthState() {
  const state = randomBytes(24).toString('hex');
  oauthStates.set(state, Date.now());
  return state;
}

function isValidOAuthState(state) {
  if (typeof state !== 'string' || !state) return false;
  const t = oauthStates.get(state);
  if (t == null) return false;
  if (Date.now() - t > OAUTH_STATE_TTL_MS) {
    oauthStates.delete(state);
    return false;
  }
  return true;
}

function consumeOAuthState(state) {
  oauthStates.delete(state);
}

setInterval(() => {
  const now = Date.now();
  for (const [s, t] of oauthStates) {
    if (now - t > OAUTH_STATE_TTL_MS) oauthStates.delete(s);
  }
}, 60_000).unref();

if (process.env.INVOICE_TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

invoiceLog('boot', '=== saskaitos-i-excel starting ===', {
  PORT,
  MAX_FILES,
  MAX_PAGES_PER_FILE,
  JSON_LIMIT_MB,
  OPENAI_VISION_MODEL: process.env.OPENAI_VISION_MODEL || 'gpt-4o',
  logFile: process.env.INVOICE_LOG_FILE || '(default logs/invoices-app.log)',
  demoMaxProcessesPerIp:
    DEMO_MAX_PROCESSES_PER_IP > 0 ? DEMO_MAX_PROCESSES_PER_IP : 'off',
  globalMaxSuccessfulProcesses: GLOBAL_MAX_SUCCESSFUL_PROCESSES,
  trustProxy: process.env.INVOICE_TRUST_PROXY === '1',
});
app.use((req, res, next) => {
  const rid = newRequestId();
  req.invoiceReqId = rid;
  const started = Date.now();
  invoiceLog('http', `[${rid}] --> ${req.method} ${req.path}`, {
    ip: req.ip,
    ua: truncate(req.get('user-agent') || '', 80),
  });
  res.on('finish', () => {
    invoiceLog('http', `[${rid}] <-- ${res.statusCode} ${req.method} ${req.path}`, {
      ms: Date.now() - started,
    });
  });
  next();
});
app.use(express.json({ limit: `${JSON_LIMIT_MB}mb` }));
app.use((err, _req, res, next) => {
  if (err?.type === 'entity.too.large' || err?.status === 413) {
    invoiceLog('error', 'body too large (413)', { type: err?.type });
    return res.status(413).json({
      error:
        'Payload too large. Try fewer files or shorter documents.',
    });
  }
  next(err);
});

function requireApiKey(_req, res, next) {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    invoiceLog('error', 'missing OPENAI_API_KEY');
    return res.status(503).json({
      error:
        'Service is unavailable. Contact the administrator.',
    });
  }
  next();
}

/** Lazily construct — OpenAI SDK throws at construction when apiKey is empty; demo must boot without a key (UI + /health). */
let openaiSingleton = null;
function openaiClient() {
  const k = process.env.OPENAI_API_KEY?.trim();
  if (!k) return null;
  if (!openaiSingleton) openaiSingleton = new OpenAI({ apiKey: k });
  return openaiSingleton;
}

app.get('/health', (_req, res) => {
  const t = loadGoogleTokens();
  res.json({
    ok: true,
    service: 'saskaitos-i-excel',
    vision: Boolean(process.env.OPENAI_API_KEY?.trim()),
    pdfRenderer: 'client',
    mode: 'vision-only',
    demoMaxProcessesPerIp:
      DEMO_MAX_PROCESSES_PER_IP > 0 ? DEMO_MAX_PROCESSES_PER_IP : null,
    gmail: {
      oauthConfigured: isGoogleOAuthConfigured(),
      hasRefreshToken: Boolean(t?.refresh_token),
      notifyEmailSet: Boolean(process.env.INVOICE_NOTIFY_EMAIL?.trim()),
    },
  });
});

app.get('/auth/google', (_req, res) => {
  if (!isGoogleOAuthConfigured()) {
    return res.status(503).type('text/plain').send(
      'Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in .env',
    );
  }
  try {
    const state = mintOAuthState();
    const url = buildGoogleAuthUrl(state);
    res.redirect(302, url);
  } catch (e) {
    res.status(500).type('text/plain').send(String(e?.message ?? e));
  }
});

app.get('/auth/google/callback', async (req, res) => {
  const err = req.query.error;
  if (err) {
    const desc = req.query.error_description ?? '';
    return res.status(400).type('html').send(
      `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>OAuth</title></head><body><p>Authorization failed: ${String(
        err,
      )}</p><p>${String(desc)}</p><p><a href="/">Home</a></p></body></html>`,
    );
  }

  const code = req.query.code;
  const state = req.query.state;
  if (typeof code !== 'string' || !code) {
    return res.status(400).type('text/plain').send('missing code');
  }
  if (typeof state !== 'string' || !isValidOAuthState(state)) {
    return res.status(400).type('text/plain').send('invalid or expired state');
  }
  consumeOAuthState(state);

  try {
    const tokens = await exchangeCodeForTokens(code);
    const prior = loadGoogleTokens();
    const refresh_token = tokens.refresh_token ?? prior?.refresh_token;
    if (!refresh_token) {
      return res.status(502).type('text/plain').send(
        'No refresh_token returned. Revoke app access in Google Account settings and connect again with prompt=consent.',
      );
    }

    const access = tokens.access_token;
    let email = null;
    try {
      const profile = await fetchGmailProfile(access);
      email = profile.emailAddress ?? null;
    } catch (e) {
      invoiceLog(
        'warn',
        'auth/google/callback: profile skipped (add gmail.metadata or gmail.readonly to GOOGLE_OAUTH_SCOPES and re-auth)',
        { message: e?.message },
      );
    }

    const stored = {
      refresh_token,
      scope: tokens.scope ?? prior?.scope,
      token_type: tokens.token_type ?? 'Bearer',
      email,
      updated_at: new Date().toISOString(),
    };
    saveGoogleTokens(stored);

    return res.status(200).type('html').send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><title>Gmail connected</title></head>
<body style="font-family:system-ui,sans-serif;max-width:520px;margin:2rem auto;padding:0 1rem;">
  <h1 style="font-size:1.25rem;">Gmail connected</h1>
  <p>${email ? `Signed in as <strong>${email}</strong>.` : 'Connected.'}</p>
  <p style="opacity:0.85;font-size:0.9rem;">Tokens saved to <code>${googleTokenFilePath()}</code></p>
  <p><a href="/">Back to demo</a></p>
</body></html>`);
  } catch (e) {
    invoiceLog('error', 'auth/google/callback', { message: e?.message });
    return res.status(502).type('text/plain').send(String(e?.message ?? e));
  }
});

app.get('/api/config', (_req, res) => {
  res.json({
    maxFiles: MAX_FILES,
    maxPagesPerFile: MAX_PAGES_PER_FILE,
    jsonBodyLimitMb: JSON_LIMIT_MB,
    demoMaxProcessesPerIp:
      DEMO_MAX_PROCESSES_PER_IP > 0 ? DEMO_MAX_PROCESSES_PER_IP : null,
  });
});

app.get('/samples/:basename', (req, res) => {
  const raw = req.params.basename ?? '';
  const basename = path.basename(raw);
  if (!SAMPLE_PDF_ALLOWLIST.has(basename)) {
    return res.status(404).type('text/plain').send('Not found');
  }
  const full = path.join(FIXTURES_REAL, basename);
  const resolved = path.resolve(full);
  if (!resolved.startsWith(path.resolve(FIXTURES_REAL))) {
    return res.status(404).end();
  }
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(resolved, (err) => {
    if (err && !res.headersSent) {
      invoiceLog('warn', 'samples sendFile', { basename, message: err.message });
      res.status(404).end();
    }
  });
});

/**
 * @param {string} s
 */
function normalizeBase64Image(s) {
  if (typeof s !== 'string') return '';
  const t = s.trim();
  const m = t.match(/^data:image\/(?:png|jpeg|webp);base64,(.+)$/i);
  return m ? m[1] : t.replace(/\s/g, '');
}

/**
 * @param {string} failas
 * @param {Record<string, string>} extracted
 */
function mapExtractedToRow(failas, extracted) {
  return {
    failas,
    data: extracted.data || '',
    saskaitosNumeris: extracted.saskaitos_nr || '',
    pardavejas: extracted.pardavejas || '',
    pirkejas: extracted.pirkejas || '',
    sumaBePvm: extracted.suma_be_pvm || '',
    pvmSuma: extracted.pvm_suma || '',
    sumaSuPvm: extracted.suma_su_pvm || '',
    pastaba: extracted.pastaba || '',
  };
}

function emptyRow(failas, message) {
  return {
    failas,
    data: '',
    saskaitosNumeris: '',
    pardavejas: '',
    pirkejas: '',
    sumaBePvm: '',
    pvmSuma: '',
    sumaSuPvm: '',
    pastaba: '',
    _error: message,
  };
}

/**
 * NDJSON: client sends { files: [{ name, pages: string[] base64 PNG }] }
 */
app.post('/api/process', requireApiKey, async (req, res) => {
  const rid = req.invoiceReqId || newRequestId();
  const { files } = req.body || {};

  let bodyApprox = 0;
  try {
    bodyApprox = Buffer.byteLength(JSON.stringify(req.body || {}), 'utf8');
  } catch {
    bodyApprox = -1;
  }
  invoiceLog('process', `[${rid}] POST /api/process body`, {
    fileCount: Array.isArray(files) ? files.length : 0,
    approxBodyBytes: bodyApprox,
    approxBodyMB: bodyApprox > 0 ? (bodyApprox / (1024 * 1024)).toFixed(2) : null,
  });

  if (!Array.isArray(files) || !files.length) {
    invoiceLog('warn', `[${rid}] reject: no files`);
    return res.status(400).json({ error: 'No upload data. Please try again.' });
  }
  if (files.length > MAX_FILES) {
    invoiceLog('warn', `[${rid}] reject: too many files`, { count: files.length, MAX_FILES });
    return res.status(400).json({ error: `Maximum ${MAX_FILES} files allowed.` });
  }

  if (globalSuccessfulProcessCount >= GLOBAL_MAX_SUCCESSFUL_PROCESSES) {
    invoiceLog('warn', `[${rid}] global process limit`, {
      globalSuccessfulProcessCount,
      GLOBAL_MAX_SUCCESSFUL_PROCESSES,
    });
    return res.status(429).json({ error: 'Your demo attempt limit is used up.' });
  }

  const demoIp = getClientIp(req);
  const demoSlot = tryConsumeDemoProcessSlot(demoIp, DEMO_MAX_PROCESSES_PER_IP);
  if (!demoSlot.allowed) {
    invoiceLog('warn', `[${rid}] demo limit`, { ip: truncate(demoIp, 64) });
    const fileNamesBlocked = files.map((f) =>
      typeof f?.name === 'string' && f.name.trim() ? f.name.trim() : '',
    );
    notifyDemoLimitReached(req, {
      rid,
      fileCount: files.length,
      names: fileNamesBlocked.filter(Boolean),
    });
    return res.status(429).json({ error: 'Your demo attempt limit is used up.' });
  }

  const fileNames = files.map((f) =>
    typeof f?.name === 'string' && f.name.trim() ? f.name.trim() : '',
  );
  notifyProcessStarted(req, {
    rid,
    fileCount: files.length,
    names: fileNames.filter(Boolean),
  });

  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.flushHeaders?.();

  const write = (obj) => {
    res.write(`${JSON.stringify(obj)}\n`);
  };

  write({ event: 'queue', total: files.length });

  const rows = [];
  const processStarted = Date.now();

  for (let i = 0; i < files.length; i++) {
    const item = files[i];
    const name = typeof item?.name === 'string' && item.name.trim()
      ? item.name.trim()
      : `failas-${i + 1}.pdf`;
    const rawPages = Array.isArray(item?.pages) ? item.pages : [];

    invoiceLog('process', `[${rid}] file[${i}]`, {
      name,
      rawPageSlots: rawPages.length,
    });

    if (!rawPages.length) {
      const row = emptyRow(name, 'Could not prepare pages. Try another file.');
      rows.push(row);
      invoiceLog('warn', `[${rid}] file[${i}] skip: no pages`, { name });
      write({ event: 'file_error', index: i, name, message: row._error, row });
      continue;
    }

    const base64Pages = rawPages.map(normalizeBase64Image).filter(Boolean);
    const perPageBytes = rawPages.map((p) => approxBase64Bytes(normalizeBase64Image(p)));
    const totalImageBytes = perPageBytes.reduce((a, b) => a + b, 0);

    if (!base64Pages.length) {
      const row = emptyRow(name, 'Could not read file. Try again.');
      rows.push(row);
      invoiceLog('warn', `[${rid}] file[${i}] skip: bad base64`, { name });
      write({ event: 'file_error', index: i, name, message: row._error, row });
      continue;
    }

    const pageCount = rawPages.length;
    const truncated = base64Pages.length > MAX_PAGES_PER_FILE;
    const pagesForApi = truncated ? base64Pages.slice(0, MAX_PAGES_PER_FILE) : base64Pages;

    invoiceLog('process', `[${rid}] file[${i}] ready for vision`, {
      name,
      pageCount,
      pagesToModel: pagesForApi.length,
      truncated,
      approxImageBytesTotal: totalImageBytes,
      perPageApproxBytes: perPageBytes.slice(0, MAX_PAGES_PER_FILE),
    });

    write({
      event: 'file_start',
      index: i,
      name,
      total: files.length,
      pagesSent: pagesForApi.length,
      pageCount,
      truncated,
    });

    try {
      write({
        event: 'vision',
        index: i,
        name,
        stage: 'Extracting invoice data…',
      });
      const fileT0 = Date.now();
      const extracted = await extractInvoiceWithVision(openaiClient(), pagesForApi, name, { reqId: `${rid}:${i}` });
      invoiceLog('process', `[${rid}] file[${i}] vision OK`, {
        name,
        visionMs: Date.now() - fileT0,
      });
      const row = mapExtractedToRow(name, extracted);
      if (truncated) {
        row.pastaba = [row.pastaba, `Only first ${pagesForApi.length} of ${pageCount} pages included.`]
          .filter(Boolean)
          .join(' ');
      }
      rows.push(row);
      invoiceLog('process', `[${rid}] file[${i}] row`, {
        name,
        data: row.data,
        saskaitosNumeris: truncate(row.saskaitosNumeris, 60),
        sumaSuPvm: row.sumaSuPvm,
        hasError: Boolean(row._error),
      });
      write({ event: 'file_done', index: i, name, row });
    } catch (e) {
      const msg = e?.message || String(e);
      invoiceLog('error', `[${rid}] file[${i}] vision FAILED`, {
        name,
        message: msg,
        stack: e?.stack ? truncate(e.stack, 500) : undefined,
      });
      const row = emptyRow(name, msg);
      rows.push(row);
      write({ event: 'file_error', index: i, name, message: msg, row });
    }
  }

  const processed = rows.filter((r) => !r._error).length;
  const failed = rows.filter((r) => r._error).length;
  invoiceLog('process', `[${rid}] complete`, {
    totalMs: Date.now() - processStarted,
    files: files.length,
    processed,
    failed,
  });

  write({
    event: 'complete',
    rows,
    processed,
    failed,
  });
  globalSuccessfulProcessCount += 1;
  res.end();
});

app.post('/api/export', async (req, res) => {
  const rid = req.invoiceReqId || newRequestId();
  const { rows } = req.body || {};
  const n = Array.isArray(rows) ? rows.length : 0;
  invoiceLog('export', `[${rid}] POST /api/export`, { rowCount: n });

  if (!Array.isArray(rows) || !rows.length) {
    invoiceLog('warn', `[${rid}] export reject: no rows`);
    return res.status(400).json({ error: 'Nothing to download.' });
  }

  const clean = rows.map((r) => {
    const { _error, _warning, ...rest } = r;
    return rest;
  });

  try {
    const t0 = Date.now();
    const buf = await buildInvoiceExcelBuffer(clean);
    const filename = `saskaitos-${new Date().toISOString().slice(0, 10)}.xlsx`;
    invoiceLog('export', `[${rid}] xlsx built`, {
      bytes: buf.length,
      ms: Date.now() - t0,
      filename,
    });
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buf);
  } catch (e) {
    invoiceLog('error', `[${rid}] export error`, {
      message: e?.message,
      stack: e?.stack ? truncate(e.stack, 400) : undefined,
    });
    res.status(500).json({ error: 'Could not create file.' });
  }
});

app.use((req, res, next) => {
  if (req.method === 'GET' && req.path === '/') {
    notifyVisitIfEnabled(req);
  }
  next();
});
/** Same-origin pdf.js (avoids esm.sh CDN hangs in iframe / strict contexts). */
app.use(
  '/pdfjs',
  express.static(path.join(__dirname, 'node_modules', 'pdfjs-dist', 'build'), {
    setHeaders(res, filePath) {
      if (filePath.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      }
    },
  }),
);
/** CMaps + standard fonts: getDocument() fetches these; must not rely on blocked CDNs. */
app.use(
  '/pdfjs-assets/cmaps',
  express.static(path.join(__dirname, 'node_modules', 'pdfjs-dist', 'cmaps')),
);
app.use(
  '/pdfjs-assets/standard_fonts',
  express.static(path.join(__dirname, 'node_modules', 'pdfjs-dist', 'standard_fonts')),
);
app.use(express.static(path.join(__dirname, 'public')));

export { app };

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  app.listen(PORT, process.env.HOST || '127.0.0.1', () => {
    invoiceLog('boot', `listening on ${PORT}`, {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'set' : 'MISSING',
      logHint: 'Verbose logs: stdout + logs/invoices-app.log (see INVOICE_LOG_*)',
    });
  });
}
