import { randomBytes } from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import { exchangeCode } from './exchange.js';
import { OAuthFileStore, isProviderId } from './fileStore.js';
import {
  clickupAuthorizeUrl,
  getProviderConfig,
  getPublicBaseUrl,
  googleAuthorizeUrl,
} from './providers.js';

const STATE_TTL_MS = 15 * 60 * 1000;

const GOOGLE_SCOPES = ['openid', 'email', 'profile'];

function htmlPage(title: string, body: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${title}</title></head><body>${body}</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function paramString(v: string | string[] | undefined): string {
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  return '';
}

export function createOAuthRouter(): Router {
  const r = Router();
  const store = new OAuthFileStore();

  r.get('/auth/:provider', (req: Request, res: Response) => {
    const p = paramString(req.params.provider);
    if (!isProviderId(p)) {
      res.status(404).type('html').send(htmlPage('Unknown provider', '<p>Unknown provider.</p>'));
      return;
    }
    const publicBase = getPublicBaseUrl();
    if (!publicBase) {
      res
        .status(500)
        .type('html')
        .send(
          htmlPage(
            'Configuration',
            '<p>Set <code>LEADFLOW_PUBLIC_URL</code> to your public https origin (ngrok).</p>',
          ),
        );
      return;
    }
    const cfg = getProviderConfig(p);
    if (!cfg) {
      res
        .status(500)
        .type('html')
        .send(
          htmlPage(
            'OAuth',
            `<p>Missing env for <code>${escapeHtml(p)}</code> (client id / secret).</p>`,
          ),
        );
      return;
    }
    const linkRaw = typeof req.query.link === 'string' ? req.query.link.trim() : '';
    const linkKey = linkRaw || null;

    const state = randomBytes(24).toString('hex');
    const now = Date.now();
    store.putPending({
      state,
      provider: p,
      linkKey,
      createdAtMs: now,
      expiresAtMs: now + STATE_TTL_MS,
    });

    const redirectUri = `${publicBase}/auth/${p}/callback`;
    let url: string;
    if (p === 'google') {
      url = googleAuthorizeUrl({
        clientId: cfg.clientId,
        redirectUri,
        state,
        scopes: GOOGLE_SCOPES,
      });
    } else {
      url = clickupAuthorizeUrl({ clientId: cfg.clientId, redirectUri, state });
    }

    res.redirect(302, url);
  });

  r.get('/auth/:provider/callback', async (req: Request, res: Response) => {
    const p = paramString(req.params.provider);
    if (!isProviderId(p)) {
      res.status(404).type('html').send(htmlPage('Unknown provider', '<p>Unknown provider.</p>'));
      return;
    }
    const err = typeof req.query.error === 'string' ? req.query.error : '';
    if (err) {
      res
        .status(400)
        .type('html')
        .send(htmlPage('OAuth error', `<p>Provider error: ${escapeHtml(err)}</p>`));
      return;
    }
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    if (!code || !state) {
      res.status(400).type('html').send(htmlPage('OAuth', '<p>Missing code or state.</p>'));
      return;
    }
    const pending = store.peekPending(state);
    if (!pending || pending.provider !== p) {
      res
        .status(400)
        .type('html')
        .send(
          htmlPage(
            'OAuth',
            `<p>Invalid or expired state. Start again from <code>/auth/${escapeHtml(p)}</code>.</p>`,
          ),
        );
      return;
    }
    if (Date.now() > pending.expiresAtMs) {
      store.removePending(state);
      res.status(400).type('html').send(htmlPage('OAuth', '<p>State expired. Start again.</p>'));
      return;
    }
    const publicBase = getPublicBaseUrl();
    if (!publicBase) {
      res
        .status(500)
        .type('html')
        .send(htmlPage('Configuration', '<p><code>LEADFLOW_PUBLIC_URL</code> not set.</p>'));
      return;
    }
    const cfg = getProviderConfig(p);
    if (!cfg) {
      res.status(500).type('html').send(htmlPage('OAuth', '<p>Provider not configured.</p>'));
      return;
    }
    const redirectUri = `${publicBase}/auth/${p}/callback`;
    try {
      const tokens = await exchangeCode(p, cfg.clientId, cfg.clientSecret, code, redirectUri);
      store.upsertConnection({
        provider: pending.provider,
        subject: tokens.subject,
        linkKey: pending.linkKey,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAtMs: tokens.expiresAtMs,
        updatedAtMs: Date.now(),
      });
      store.removePending(state);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
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
          '<h1>Connection successful</h1><p>You can close this window and return to ChatGPT.</p>',
        ),
      );
  });

  r.get('/auth/status', (req: Request, res: Response) => {
    const linkRaw = typeof req.query.link === 'string' ? req.query.link.trim() : '';
    if (!linkRaw) {
      res.status(400).json({
        ok: false,
        error:
          'Pass ?link= with the same opaque value you used when opening /auth/google?link=... or /auth/clickup?link=...',
      });
      return;
    }
    const list = store.listForLink(linkRaw);
    res.json({
      ok: true,
      link: linkRaw,
      connections: list.map((c) => ({
        provider: c.provider,
        subject: c.subject,
        hasRefreshToken: Boolean(c.refreshToken),
        expiresAt: c.expiresAtMs ? new Date(c.expiresAtMs).toISOString() : null,
        updatedAt: new Date(c.updatedAtMs).toISOString(),
      })),
    });
  });

  return r;
}
