import { Router, type NextFunction, type Request, type Response as ExpressResponse } from 'express';
import { z } from 'zod';
import { getMetaOAuth, getToolkitPublicUrl } from '../config.js';
import { ConnectionStore } from '../storage/connections.js';
import {
  credentialHintsFromQuery,
  isGoogleOAuthConfiguredFor,
  isMetaOAuthConfiguredFor,
} from '../oauth/credentialProvider.js';

type ConnectionSecrets = NonNullable<ReturnType<ConnectionStore['getSecrets']>>;
type ReqWithId = Request & { reqId?: string };

function rid(req: Request): string {
  return (req as ReqWithId).reqId || 'no-rid';
}

function shortHeader(value: string): string {
  if (!value) return '(missing)';
  if (value.length <= 6) return `${value[0]}***(${value.length})`;
  return `${value.slice(0, 3)}...${value.slice(-2)}(${value.length})`;
}

/** Composio-style envelope for Custom GPT / Actions clients. */
function ok(data: unknown) {
  return { successful: true as const, data };
}

function fail(message: string) {
  return { successful: false as const, error: message };
}

/** Carries HTTP status for the Express response (auth vs upstream vs validation). */
class ToolHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ToolHttpError';
  }
}

function requireApiKey(req: Request, res: ExpressResponse, next: NextFunction): void {
  const expected = process.env.INTERNAL_API_KEY?.trim();
  if (!expected) {
    console.error(`[req:${rid(req)}] auth.fail reason=server-missing-internal-api-key`);
    res.status(500).json(fail('INTERNAL_API_KEY is not configured'));
    return;
  }
  const raw = req.headers['x-api-key'];
  const got = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
  if (got !== expected) {
    console.warn(
      `[req:${rid(req)}] auth.fail reason=bad-x-api-key got=${shortHeader(got)} expected=${shortHeader(expected)}`,
    );
    res.status(401).json(fail('Invalid or missing X-API-Key header'));
    return;
  }
  console.log(`[req:${rid(req)}] auth.ok`);
  next();
}

const cellValue = z.union([z.string(), z.number(), z.boolean(), z.null()]);

/** Composio `GOOGLESHEETS_SPREADSHEETS_VALUES_APPEND` + `user_ref`. */
const sheetsAppendBody = z
  .object({
    user_ref: z.string().min(1),
    spreadsheetId: z.string().min(1),
    range: z.string().min(1),
    values: z.array(z.array(cellValue)).min(1),
    majorDimension: z.enum(['ROWS', 'COLUMNS']).optional(),
    insertDataOption: z.enum(['OVERWRITE', 'INSERT_ROWS']).optional(),
    valueInputOption: z.enum(['RAW', 'USER_ENTERED']),
    includeValuesInResponse: z.boolean().optional(),
    responseValueRenderOption: z.enum(['FORMATTED_VALUE', 'UNFORMATTED_VALUE', 'FORMULA']).optional(),
    responseDateTimeRenderOption: z.enum(['SERIAL_NUMBER', 'FORMATTED_STRING']).optional(),
  })
  .strict();

/** Composio `INSTAGRAM_SEND_TEXT_MESSAGE` + `user_ref`. */
const instagramSendReplyBody = z
  .object({
    user_ref: z.string().min(1),
    text: z.string().min(1).max(1000),
    recipient_id: z.string().min(1),
    ig_user_id: z.string().min(1).optional(),
    graph_api_version: z.string().min(1).optional(),
    reply_to_message_id: z.string().min(1).optional(),
  })
  .strict();

/** Composio `INSTAGRAM_LIST_ALL_CONVERSATIONS` + `user_ref` + `messages_limit`. */
const instagramListRecentBody = z
  .object({
    user_ref: z.string().min(1),
    after: z.string().optional(),
    limit: z.number().int().optional(),
    ig_user_id: z.string().min(1).optional(),
    graph_api_version: z.string().min(1).optional(),
    messages_limit: z.number().int().min(1).max(50).optional(),
  })
  .strict();

function parseBody<T>(schema: z.ZodType<T>, raw: unknown): { ok: true; data: T } | { ok: false; message: string } {
  const r = schema.safeParse(raw);
  if (!r.success) {
    const msg = r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return { ok: false, message: msg || 'Invalid body' };
  }
  return { ok: true, data: r.data };
}

async function readJsonSafe(res: globalThis.Response): Promise<unknown> {
  const text = await res.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { _non_json_body: text.slice(0, 800) };
  }
}

type GoogleApiErrorShape = { error?: { message?: string; code?: number; status?: string } };
type MetaApiErrorShape = {
  error?: { message?: string; type?: string; code?: number; error_subcode?: number; fbtrace_id?: string };
};

function googleErrorMessage(json: unknown, httpStatus: number): string {
  const o = json as GoogleApiErrorShape;
  if (o.error?.message) return o.error.message;
  return `Google Sheets API error (HTTP ${httpStatus})`;
}

function metaErrorMessage(json: unknown, httpStatus: number): string {
  const o = json as MetaApiErrorShape;
  if (o.error?.message) {
    const code = o.error.code != null ? ` code=${o.error.code}` : '';
    const sub = o.error.error_subcode != null ? ` subcode=${o.error.error_subcode}` : '';
    return `${o.error.message}${code}${sub}`;
  }
  return `Meta Graph API error (HTTP ${httpStatus})`;
}

function metaJsonHasError(json: unknown): boolean {
  if (!json || typeof json !== 'object') return false;
  return 'error' in json && (json as { error?: unknown }).error != null;
}

/** OAuth / session style errors → our 401. */
function metaAuthFailure(json: unknown): boolean {
  const e = (json as MetaApiErrorShape).error;
  if (!e) return false;
  if (e.code === 190 || e.code === 102) return true;
  const m = (e.message || '').toLowerCase();
  return m.includes('invalid oauth') || m.includes('session has expired') || m.includes('invalid access token');
}

function googleAuthFailure(status: number, json: unknown): boolean {
  if (status === 401) return true;
  const o = json as GoogleApiErrorShape;
  const msg = (o.error?.message || '').toLowerCase();
  return msg.includes('invalid credential') || msg.includes('invalid_grant');
}

function mapGoogleUpstreamStatus(status: number, json: unknown): number {
  if (googleAuthFailure(status, json)) return 401;
  return 502;
}

function mapMetaUpstreamStatus(status: number, json: unknown): number {
  if (status === 401 || metaAuthFailure(json)) return 401;
  return 502;
}

function getGoogleSecrets(store: ConnectionStore, user_ref: string): ConnectionSecrets {
  try {
    const s = store.getSecrets(user_ref, 'google');
    if (!s) {
      throw new ToolHttpError(
        'No Google connection for this user_ref. Connect via GET /v1/auth/google?user_ref=...',
        400,
      );
    }
    if (tokenExpired(s.expiresAtMs)) {
      throw new ToolHttpError(
        'Google access token expired or near expiry. Reconnect or refresh using the stored refresh_token.',
        401,
      );
    }
    return s;
  } catch (e) {
    if (e instanceof ToolHttpError) throw e;
    throw new ToolHttpError('Failed to read stored Google connection (decrypt or disk error).', 500);
  }
}

function getInstagramSecrets(store: ConnectionStore, user_ref: string): ConnectionSecrets {
  try {
    const s = store.getSecrets(user_ref, 'instagram');
    if (!s) {
      throw new ToolHttpError(
        'No Instagram connection for this user_ref. Connect via GET /v1/auth/instagram?user_ref=...',
        400,
      );
    }
    if (tokenExpired(s.expiresAtMs)) {
      throw new ToolHttpError('Instagram access token expired or near expiry. Re-authenticate via OAuth.', 401);
    }
    return s;
  } catch (e) {
    if (e instanceof ToolHttpError) throw e;
    throw new ToolHttpError('Failed to read stored Instagram connection (decrypt or disk error).', 500);
  }
}

function tokenExpired(expiresAtMs: number | null): boolean {
  if (expiresAtMs === null) return false;
  return Date.now() > expiresAtMs - 60_000;
}

async function googleSheetsAppendValues(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  body: {
    values: z.infer<typeof sheetsAppendBody>['values'];
    majorDimension?: 'ROWS' | 'COLUMNS';
    valueInputOption: 'RAW' | 'USER_ENTERED';
    insertDataOption?: 'OVERWRITE' | 'INSERT_ROWS';
    includeValuesInResponse?: boolean;
    responseValueRenderOption?: 'FORMATTED_VALUE' | 'UNFORMATTED_VALUE' | 'FORMULA';
    responseDateTimeRenderOption?: 'SERIAL_NUMBER' | 'FORMATTED_STRING';
  },
): Promise<unknown> {
  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append`,
  );
  url.searchParams.set('valueInputOption', body.valueInputOption);
  if (body.insertDataOption) url.searchParams.set('insertDataOption', body.insertDataOption);
  if (body.includeValuesInResponse !== undefined) {
    url.searchParams.set('includeValuesInResponse', String(body.includeValuesInResponse));
  }
  if (body.responseValueRenderOption) {
    url.searchParams.set('responseValueRenderOption', body.responseValueRenderOption);
  }
  if (body.responseDateTimeRenderOption) {
    url.searchParams.set('responseDateTimeRenderOption', body.responseDateTimeRenderOption);
  }

  const payload: Record<string, unknown> = { values: body.values };
  if (body.majorDimension) payload.majorDimension = body.majorDimension;

  let fetchRes: globalThis.Response;
  try {
    fetchRes = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new ToolHttpError(`Google Sheets request failed (network): ${msg}`, 502);
  }

  const json = await readJsonSafe(fetchRes);
  if (!fetchRes.ok) {
    throw new ToolHttpError(
      googleErrorMessage(json, fetchRes.status),
      mapGoogleUpstreamStatus(fetchRes.status, json),
    );
  }
  return json;
}

async function graphFacebookGet(
  accessToken: string,
  path: string,
  params: Record<string, string | number | undefined>,
  graphVersionOverride?: string,
): Promise<unknown> {
  const { graphVersion } = getMetaOAuth();
  const ver = graphVersionOverride?.trim() || graphVersion;
  const p = path.startsWith('/') ? path : `/${path}`;
  const u = new URL(`https://graph.facebook.com/${ver}${p}`);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    u.searchParams.set(k, String(v));
  }
  u.searchParams.set('access_token', accessToken);

  let fetchRes: globalThis.Response;
  try {
    fetchRes = await fetch(u.toString());
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new ToolHttpError(`Meta Graph request failed (network): ${msg}`, 502);
  }

  const json = await readJsonSafe(fetchRes);
  if (!fetchRes.ok || metaJsonHasError(json)) {
    throw new ToolHttpError(
      metaErrorMessage(json, fetchRes.status),
      mapMetaUpstreamStatus(fetchRes.status, json),
    );
  }
  return json;
}

async function resolveIgUserId(accessToken: string, graphVersionOverride?: string): Promise<string | null> {
  const json = (await graphFacebookGet(
    accessToken,
    '/me',
    { fields: 'instagram_business_account{id}' },
    graphVersionOverride,
  )) as { instagram_business_account?: { id?: string } };
  const id = json.instagram_business_account?.id;
  return typeof id === 'string' ? id : null;
}

async function instagramListConversations(
  accessToken: string,
  igUserId: string,
  limit: number,
  messagesPerConversation: number,
  after: string | undefined,
  graphVersionOverride?: string,
): Promise<unknown> {
  const fields = [
    'id',
    'updated_time',
    `messages.limit(${messagesPerConversation}){id,message,created_time,from{id,username,name}}`,
  ].join(',');
  const params: Record<string, string | number | undefined> = {
    fields,
    limit,
  };
  if (after) params.after = after;
  return graphFacebookGet(accessToken, `/${igUserId}/conversations`, params, graphVersionOverride);
}

async function instagramSendTextDm(
  accessToken: string,
  igUserId: string,
  recipientId: string,
  text: string,
  opts?: { graphVersion?: string; replyToMessageId?: string },
): Promise<unknown> {
  const { graphVersion } = getMetaOAuth();
  const ver = opts?.graphVersion?.trim() || graphVersion;
  const host =
    process.env.META_IG_MESSAGES_HOST?.trim().replace(/\/$/, '') || 'https://graph.instagram.com';
  const url = `${host}/${ver}/${encodeURIComponent(igUserId)}/messages`;
  const message: Record<string, unknown> = { text };
  if (opts?.replyToMessageId) {
    message.reply_to = { mid: opts.replyToMessageId };
  }

  let fetchRes: globalThis.Response;
  try {
    fetchRes = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message,
      }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new ToolHttpError(`Instagram Send API request failed (network): ${msg}`, 502);
  }

  const json = await readJsonSafe(fetchRes);
  if (!fetchRes.ok || metaJsonHasError(json)) {
    throw new ToolHttpError(
      metaErrorMessage(json, fetchRes.status),
      mapMetaUpstreamStatus(fetchRes.status, json),
    );
  }
  return json;
}

function sendToolError(res: ExpressResponse, e: unknown): void {
  if (e instanceof ToolHttpError) {
    console.error(`[tools] handled-error status=${e.status} message=${e.message}`);
    res.status(e.status).json(fail(e.message));
    return;
  }
  console.error(`[tools] unhandled-error`, e);
  res.status(500).json(fail(e instanceof Error ? e.message : 'Internal server error'));
}

export function createToolRoutes(store: ConnectionStore): Router {
  const r = Router();
  r.use(requireApiKey);

  /** API-key protected diagnostics for GPT debugging (no secrets). */
  r.get('/v1/debug/config', (req, res) => {
    const publicBase = getToolkitPublicUrl();
    const userRef = typeof req.query.user_ref === 'string' ? req.query.user_ref.trim() : '';
    const hints = credentialHintsFromQuery(req.query as Record<string, unknown>);
    const resolvedGoogleConfigured = userRef ? isGoogleOAuthConfiguredFor(userRef, hints) : false;
    const resolvedInstagramConfigured = userRef ? isMetaOAuthConfiguredFor(userRef, hints) : false;
    res.json({
      ok: true,
      service: 'two_platform_toolkit',
      checks: {
        apiKeyConfigured: Boolean(process.env.INTERNAL_API_KEY?.trim()),
        toolkitPublicUrlConfigured: Boolean(publicBase),
        googleOAuthConfigured: resolvedGoogleConfigured,
        instagramOAuthConfigured: resolvedInstagramConfigured,
      },
      context: {
        user_ref: userRef || null,
        tenant: hints.tenant || null,
        client: hints.client || null,
      },
      publicBase,
      next: [
        'If toolkitPublicUrlConfigured=false, set TOOLKIT_PUBLIC_URL and restart.',
        'If apiKeyConfigured=false, set INTERNAL_API_KEY and restart.',
        'If OAuth flags are false, ensure tenant/client-specific OAuth credentials are present and valid (not placeholders).',
        'Debug this with the same user_ref and tenant/client you pass to getOAuthConnectUrls.',
      ],
    });
  });

  /** JSON Action for Custom GPT: real connect URLs for the human's browser (not the redirect endpoints themselves). */
  r.get('/v1/oauth/connect_urls', (req, res) => {
    console.log(`[req:${rid(req)}] route=getOAuthConnectUrls`);
    const userRef = typeof req.query.user_ref === 'string' ? req.query.user_ref.trim() : '';
    if (!userRef) {
      console.warn(`[req:${rid(req)}] getOAuthConnectUrls missing user_ref`);
      res.status(400).json({ ok: false, error: 'Missing user_ref query parameter' });
      return;
    }
    const publicBase = getToolkitPublicUrl();
    if (!publicBase) {
      console.error(`[req:${rid(req)}] getOAuthConnectUrls missing TOOLKIT_PUBLIC_URL`);
      res.status(503).json({
        ok: false,
        error: 'Server TOOLKIT_PUBLIC_URL is not set; cannot build OAuth links.',
      });
      return;
    }
    const hints = credentialHintsFromQuery(req.query as Record<string, unknown>);
    const googleConfigured = isGoogleOAuthConfiguredFor(userRef, hints);
    const instagramConfigured = isMetaOAuthConfiguredFor(userRef, hints);
    const q = new URLSearchParams({ user_ref: userRef });
    if (hints.tenant) q.set('tenant', hints.tenant);
    if (hints.client) q.set('client', hints.client);
    res.json({
      ok: true,
      user_ref: userRef,
      publicBase,
      note:
        'Paste connectUrl into a normal browser for the human. Do not invoke those URLs via Actions (they redirect to Google/Meta).',
      google: {
        configured: googleConfigured,
        connectUrl: googleConfigured ? `${publicBase}/v1/auth/google?${q.toString()}` : null,
      },
      instagram: {
        configured: instagramConfigured,
        connectUrl: instagramConfigured ? `${publicBase}/v1/auth/instagram?${q.toString()}` : null,
      },
    });
  });

  r.post('/v1/tools/googlesheets_append_row', async (req, res) => {
    console.log(`[req:${rid(req)}] route=googlesheets_append_row`);
    const parsed = parseBody(sheetsAppendBody, req.body);
    if (!parsed.ok) {
      console.warn(`[req:${rid(req)}] googlesheets_append_row bad-body ${parsed.message}`);
      res.status(400).json(fail(parsed.message));
      return;
    }
    const b = parsed.data;
    try {
      const secrets = getGoogleSecrets(store, b.user_ref);
      const result = await googleSheetsAppendValues(secrets.accessToken, b.spreadsheetId, b.range, {
        values: b.values,
        majorDimension: b.majorDimension,
        valueInputOption: b.valueInputOption,
        insertDataOption: b.insertDataOption,
        includeValuesInResponse: b.includeValuesInResponse,
        responseValueRenderOption: b.responseValueRenderOption,
        responseDateTimeRenderOption: b.responseDateTimeRenderOption,
      });
      res.json(ok(result));
    } catch (e) {
      console.error(`[req:${rid(req)}] googlesheets_append_row failed`);
      sendToolError(res, e);
    }
  });

  r.post('/v1/tools/instagram_send_reply', async (req, res) => {
    console.log(`[req:${rid(req)}] route=instagram_send_reply`);
    const parsed = parseBody(instagramSendReplyBody, req.body);
    if (!parsed.ok) {
      console.warn(`[req:${rid(req)}] instagram_send_reply bad-body ${parsed.message}`);
      res.status(400).json(fail(parsed.message));
      return;
    }
    const b = parsed.data;
    try {
      const secrets = getInstagramSecrets(store, b.user_ref);
      const igId = b.ig_user_id ?? (await resolveIgUserId(secrets.accessToken, b.graph_api_version));
      if (!igId) {
        res
          .status(400)
          .json(
            fail(
              'Could not resolve instagram_business_account from token. Pass ig_user_id explicitly (Graph API).',
            ),
          );
        return;
      }
      const result = await instagramSendTextDm(secrets.accessToken, igId, b.recipient_id, b.text, {
        graphVersion: b.graph_api_version,
        replyToMessageId: b.reply_to_message_id,
      });
      res.json(ok(result));
    } catch (e) {
      console.error(`[req:${rid(req)}] instagram_send_reply failed`);
      sendToolError(res, e);
    }
  });

  r.post('/v1/tools/instagram_list_recent_conversations', async (req, res) => {
    console.log(`[req:${rid(req)}] route=instagram_list_recent_conversations`);
    const parsed = parseBody(instagramListRecentBody, req.body);
    if (!parsed.ok) {
      console.warn(`[req:${rid(req)}] instagram_list_recent_conversations bad-body ${parsed.message}`);
      res.status(400).json(fail(parsed.message));
      return;
    }
    const b = parsed.data;
    const convLimit = b.limit ?? 10;
    const msgLimit = b.messages_limit ?? 8;
    try {
      const secrets = getInstagramSecrets(store, b.user_ref);
      const igId = b.ig_user_id ?? (await resolveIgUserId(secrets.accessToken, b.graph_api_version));
      if (!igId) {
        res
          .status(400)
          .json(
            fail(
              'Could not resolve instagram_business_account from token. Pass ig_user_id explicitly (Graph API).',
            ),
          );
        return;
      }
      const data = await instagramListConversations(
        secrets.accessToken,
        igId,
        convLimit,
        msgLimit,
        b.after,
        b.graph_api_version,
      );
      res.json(ok({ ig_user_id: igId, conversations: data }));
    } catch (e) {
      console.error(`[req:${rid(req)}] instagram_list_recent_conversations failed`);
      sendToolError(res, e);
    }
  });

  return r;
}
