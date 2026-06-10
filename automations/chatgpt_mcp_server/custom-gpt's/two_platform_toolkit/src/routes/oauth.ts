import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router, type Request, type Response } from 'express';
import {
  getToolkitPublicUrl,
  GOOGLE_SHEETS_SCOPES,
} from '../config.js';
import { ConnectionStore, type ConnectionProvider } from '../storage/connections.js';
import {
  credentialHintsFromQuery,
  type ProviderCredentialHints,
  resolveGoogleOAuthCredentials,
  resolveMetaOAuthCredentials,
} from '../oauth/credentialProvider.js';

const STATE_TTL_MS = 15 * 60 * 1000;

/** Default Instagram Graph–oriented scopes (comma-separated, no spaces). Override with INSTAGRAM_OAUTH_SCOPES. */
const META_SCOPES_DEFAULT =
  'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,instagram_business_basic,instagram_business_manage_messages';

type PendingRow = {
  user_ref: string;
  provider: ConnectionProvider;
  expires_at_ms: number;
  credential_hints?: ProviderCredentialHints;
};

type PendingFileShape = {
  version: 1;
  pending: Record<string, PendingRow>;
};

const PENDING_REL = path.join('data', 'oauth-pending.json');
type ReqWithId = Request & { reqId?: string };

function rid(req: Request): string {
  return (req as ReqWithId).reqId || 'no-rid';
}

function metaScopes(): string {
  const raw = process.env.INSTAGRAM_OAUTH_SCOPES?.trim();
  if (!raw) return META_SCOPES_DEFAULT;
  return raw.split(/[\s,]+/).filter(Boolean).join(',');
}

function emptyPending(): PendingFileShape {
  return { version: 1, pending: {} };
}

function pendingPath(): string {
  return process.env.TOOLKIT_OAUTH_PENDING_PATH?.trim() || path.join(process.cwd(), PENDING_REL);
}

function readPendingDisk(): PendingFileShape {
  const filePath = pendingPath();
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const j = JSON.parse(raw) as PendingFileShape;
    if (!j || j.version !== 1 || !j.pending || typeof j.pending !== 'object') {
      return emptyPending();
    }
    return j;
  } catch {
    return emptyPending();
  }
}

function writePendingDisk(data: PendingFileShape): void {
  const filePath = pendingPath();
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 0), 'utf8');
}

function putPendingState(state: string, row: PendingRow): void {
  const data = readPendingDisk();
  data.pending[state] = row;
  writePendingDisk(data);
}

function peekPendingState(state: string): PendingRow | undefined {
  return readPendingDisk().pending[state];
}

function removePendingState(state: string): void {
  const data = readPendingDisk();
  if (!data.pending[state]) return;
  delete data.pending[state];
  writePendingDisk(data);
}

function paramString(v: string | string[] | undefined): string {
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  return '';
}

function htmlPage(title: string, body: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${title}</title></head><body>${body}</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function isRouteProvider(s: string): s is ConnectionProvider {
  return s === 'google' || s === 'instagram';
}

function googleAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  scopes: readonly string[];
}): string {
  const u = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  u.searchParams.set('client_id', params.clientId);
  u.searchParams.set('redirect_uri', params.redirectUri);
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('scope', params.scopes.join(' '));
  u.searchParams.set('state', params.state);
  u.searchParams.set('access_type', 'offline');
  u.searchParams.set('prompt', 'consent');
  return u.toString();
}

function metaAuthorizeUrl(params: {
  appId: string;
  redirectUri: string;
  state: string;
  graphVersion: string;
  scope: string;
}): string {
  const u = new URL(`https://www.facebook.com/${params.graphVersion}/dialog/oauth`);
  u.searchParams.set('client_id', params.appId);
  u.searchParams.set('redirect_uri', params.redirectUri);
  u.searchParams.set('state', params.state);
  u.searchParams.set('scope', params.scope);
  return u.toString();
}

async function exchangeGoogleCode(
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string,
): Promise<{ accessToken: string; refreshToken: string | null; expiresAtMs: number | null }> {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const json = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(json.error || `Google token exchange failed (${res.status})`);
  }
  const accessToken = json.access_token;
  if (!accessToken) throw new Error('Google response missing access_token');
  const expiresAtMs =
    typeof json.expires_in === 'number' ? Date.now() + json.expires_in * 1000 : null;
  return {
    accessToken,
    refreshToken: typeof json.refresh_token === 'string' ? json.refresh_token : null,
    expiresAtMs,
  };
}

async function exchangeMetaShortLived(
  appId: string,
  appSecret: string,
  code: string,
  redirectUri: string,
  graphVersion: string,
): Promise<{ accessToken: string; expiresAtMs: number | null }> {
  const u = new URL(`https://graph.facebook.com/${graphVersion}/oauth/access_token`);
  u.searchParams.set('client_id', appId);
  u.searchParams.set('client_secret', appSecret);
  u.searchParams.set('redirect_uri', redirectUri);
  u.searchParams.set('code', code);
  const res = await fetch(u.toString());
  const json = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message?: string };
  };
  if (!res.ok) {
    const msg = json.error?.message || `Meta token exchange failed (${res.status})`;
    throw new Error(msg);
  }
  const accessToken = json.access_token;
  if (!accessToken) throw new Error('Meta response missing access_token');
  const expiresAtMs =
    typeof json.expires_in === 'number' ? Date.now() + json.expires_in * 1000 : null;
  return { accessToken, expiresAtMs };
}

async function exchangeMetaLongLived(
  appId: string,
  appSecret: string,
  shortLivedToken: string,
  graphVersion: string,
): Promise<{ accessToken: string; expiresAtMs: number | null }> {
  const u = new URL(`https://graph.facebook.com/${graphVersion}/oauth/access_token`);
  u.searchParams.set('grant_type', 'fb_exchange_token');
  u.searchParams.set('client_id', appId);
  u.searchParams.set('client_secret', appSecret);
  u.searchParams.set('fb_exchange_token', shortLivedToken);
  const res = await fetch(u.toString());
  const json = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message?: string };
  };
  if (!res.ok) {
    const msg = json.error?.message || `Meta long-lived exchange failed (${res.status})`;
    throw new Error(msg);
  }
  const accessToken = json.access_token;
  if (!accessToken) throw new Error('Meta long-lived response missing access_token');
  const expiresAtMs =
    typeof json.expires_in === 'number' ? Date.now() + json.expires_in * 1000 : null;
  return { accessToken, expiresAtMs };
}

export function createOAuthRoutes(store: ConnectionStore): Router {
  const r = Router();

  r.get('/v1/auth/:provider', (req: Request, res: Response) => {
    console.log(`[req:${rid(req)}] route=/v1/auth/:provider`);
    const provider = paramString(req.params.provider);
    if (!isRouteProvider(provider)) {
      console.warn(`[req:${rid(req)}] oauth.start unknown-provider=${provider}`);
      res.status(404).type('html').send(htmlPage('Not found', '<p>Unknown provider.</p>'));
      return;
    }

    const userRefRaw = typeof req.query.user_ref === 'string' ? req.query.user_ref.trim() : '';
    if (!userRefRaw) {
      console.warn(`[req:${rid(req)}] oauth.start missing user_ref provider=${provider}`);
      res
        .status(400)
        .type('html')
        .send(htmlPage('Bad request', '<p>Missing <code>user_ref</code> query parameter.</p>'));
      return;
    }

    const publicBase = getToolkitPublicUrl();
    if (!publicBase) {
      console.error(`[req:${rid(req)}] oauth.start missing TOOLKIT_PUBLIC_URL provider=${provider}`);
      res
        .status(500)
        .type('html')
        .send(
          htmlPage(
            'Configuration',
            '<p>Set <code>TOOLKIT_PUBLIC_URL</code> to your public https origin.</p>',
          ),
        );
      return;
    }

    const credentialHints = credentialHintsFromQuery(req.query as Record<string, unknown>);

    let google: ReturnType<typeof resolveGoogleOAuthCredentials> | null = null;
    let meta: ReturnType<typeof resolveMetaOAuthCredentials> | null = null;
    try {
      if (provider === 'google') {
        google = resolveGoogleOAuthCredentials(userRefRaw, credentialHints);
      } else {
        meta = resolveMetaOAuthCredentials(userRefRaw, credentialHints);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[req:${rid(req)}] oauth.start config-error provider=${provider} msg=${msg}`);
      res
        .status(503)
        .type('html')
        .send(htmlPage('OAuth config', `<p>${escapeHtml(msg)}</p>`));
      return;
    }

    const state = randomBytes(24).toString('hex');
    const now = Date.now();
    putPendingState(state, {
      user_ref: userRefRaw,
      provider,
      expires_at_ms: now + STATE_TTL_MS,
      credential_hints: credentialHints,
    });

    const redirectUri = `${publicBase}/v1/auth/${provider}/callback`;
    let url: string;
    if (provider === 'google' && google) {
      url = googleAuthorizeUrl({
        clientId: google.clientId,
        redirectUri,
        state,
        scopes: GOOGLE_SHEETS_SCOPES,
      });
    } else if (provider === 'instagram' && meta) {
      url = metaAuthorizeUrl({
        appId: meta.appId,
        redirectUri,
        state,
        graphVersion: meta.graphVersion,
        scope: metaScopes(),
      });
    } else {
      console.error(`[req:${rid(req)}] oauth.start provider-config-error provider=${provider}`);
      res.status(500).type('html').send(htmlPage('OAuth', '<p>Provider configuration error.</p>'));
      return;
    }

    console.log(
      `[req:${rid(req)}] oauth.start redirect provider=${provider} user_ref=${userRefRaw} creds_source=${provider === 'google' ? google?.source : meta?.source} creds_key=${provider === 'google' ? google?.key : meta?.key} state=${state.slice(0, 8)}...`,
    );
    res.redirect(302, url);
  });

  r.get('/v1/auth/:provider/callback', async (req: Request, res: Response) => {
    console.log(`[req:${rid(req)}] route=/v1/auth/:provider/callback`);
    const provider = paramString(req.params.provider);
    if (!isRouteProvider(provider)) {
      console.warn(`[req:${rid(req)}] oauth.callback unknown-provider=${provider}`);
      res.status(404).type('html').send(htmlPage('Not found', '<p>Unknown provider.</p>'));
      return;
    }

    const oauthError = typeof req.query.error === 'string' ? req.query.error : '';
    if (oauthError) {
      console.warn(`[req:${rid(req)}] oauth.callback provider=${provider} oauth-error=${oauthError}`);
      res
        .status(400)
        .type('html')
        .send(htmlPage('OAuth error', `<p>${escapeHtml(oauthError)}</p>`));
      return;
    }

    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    if (!code || !state) {
      console.warn(`[req:${rid(req)}] oauth.callback provider=${provider} missing code/state`);
      res.status(400).type('html').send(htmlPage('OAuth', '<p>Missing <code>code</code> or <code>state</code>.</p>'));
      return;
    }

    const pending = peekPendingState(state);
    if (!pending || pending.provider !== provider) {
      console.warn(`[req:${rid(req)}] oauth.callback provider=${provider} bad-state=${state.slice(0, 8)}...`);
      res
        .status(400)
        .type('html')
        .send(
          htmlPage(
            'OAuth',
            `<p>Invalid or unknown <code>state</code>. Start again from <code>/v1/auth/${escapeHtml(provider)}?user_ref=...</code></p>`,
          ),
        );
      return;
    }
    if (Date.now() > pending.expires_at_ms) {
      console.warn(`[req:${rid(req)}] oauth.callback provider=${provider} expired-state=${state.slice(0, 8)}...`);
      removePendingState(state);
      res.status(400).type('html').send(htmlPage('OAuth', '<p>State expired. Start again.</p>'));
      return;
    }

    const publicBase = getToolkitPublicUrl();
    if (!publicBase) {
      console.error(`[req:${rid(req)}] oauth.callback missing TOOLKIT_PUBLIC_URL provider=${provider}`);
      res
        .status(500)
        .type('html')
        .send(htmlPage('Configuration', '<p><code>TOOLKIT_PUBLIC_URL</code> not set.</p>'));
      return;
    }

    const redirectUri = `${publicBase}/v1/auth/${provider}/callback`;

    try {
      if (provider === 'google') {
        const { clientId, clientSecret, source, key } = resolveGoogleOAuthCredentials(
          pending.user_ref,
          pending.credential_hints || {},
        );
        const tokens = await exchangeGoogleCode(clientId, clientSecret, code, redirectUri);
        store.upsert({
          user_ref: pending.user_ref,
          provider: 'google',
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAtMs: tokens.expiresAtMs,
        });
        console.log(
          `[req:${rid(req)}] oauth.callback resolved-creds provider=google source=${source} key=${key}`,
        );
      } else {
        const { appId, appSecret, graphVersion, source, key } = resolveMetaOAuthCredentials(
          pending.user_ref,
          pending.credential_hints || {},
        );
        const short = await exchangeMetaShortLived(appId, appSecret, code, redirectUri, graphVersion);
        let accessToken = short.accessToken;
        let expiresAtMs = short.expiresAtMs;
        try {
          const long = await exchangeMetaLongLived(appId, appSecret, short.accessToken, graphVersion);
          accessToken = long.accessToken;
          expiresAtMs = long.expiresAtMs;
        } catch {
          // Long-lived exchange optional for some app configs; keep short-lived
        }
        store.upsert({
          user_ref: pending.user_ref,
          provider: 'instagram',
          accessToken,
          refreshToken: null,
          expiresAtMs,
        });
        console.log(
          `[req:${rid(req)}] oauth.callback resolved-creds provider=instagram source=${source} key=${key}`,
        );
      }
      removePendingState(state);
      console.log(
        `[req:${rid(req)}] oauth.callback success provider=${provider} user_ref=${pending.user_ref} state=${state.slice(0, 8)}...`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[req:${rid(req)}] oauth.callback exchange-fail provider=${provider} msg=${msg}`);
      res
        .status(500)
        .type('html')
        .send(htmlPage('Token exchange', `<p>${escapeHtml(msg)}</p>`));
      return;
    }

    res
      .status(200)
      .type('html')
      .send(
        htmlPage(
          'Connected',
          '<h1>Connection successful</h1><p>You can close this window and return to the app.</p>',
        ),
      );
  });

  return r;
}
