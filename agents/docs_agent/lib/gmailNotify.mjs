/**
 * Notify via Gmail API (users/me/messages/send) using refresh_token + GOOGLE_CLIENT_*.
 * Same Google Cloud OAuth client as speed_lead works if scopes include gmail.send.
 */

import { getClientIp } from './demoRateLimit.mjs';
import { invoiceLog, truncate } from './processLogger.mjs';
import {
  fetchGmailProfile,
  isGmailSendConfigured,
  loadGoogleTokens,
  refreshAccessToken,
} from './google_oauth.mjs';

/** client IP -> UTC calendar day (YYYY-MM-DD) when we last emailed "Demo opened" (in-memory; resets on deploy) */
const lastVisitNotifyUtcDayByIp = new Map();

function utcCalendarDay() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * @param {import('express').Request} req
 */
function clientSummary(req) {
  const ip = getClientIp(req);
  const ua = truncate(req.get('user-agent') || '', 200);
  const xf = req.headers['x-forwarded-for'];
  const xff = typeof xf === 'string' ? truncate(xf, 120) : '';
  return { ip, ua, xForwardedFor: xff };
}

function toRawBase64Url(mime) {
  return Buffer.from(mime, 'utf8').toString('base64url');
}

/**
 * @param {string} fromMailbox
 * @param {string} toAddress
 * @param {string} subject
 * @param {string} bodyText
 */
function buildNewMessageMime(fromMailbox, toAddress, subject, bodyText) {
  const subjB64 = Buffer.from(subject, 'utf8').toString('base64');
  const bodyB64 = Buffer.from(bodyText, 'utf8').toString('base64');
  const folded = bodyB64.match(/.{1,76}/g)?.join('\r\n') ?? bodyB64;
  const lines = [
    `From: ${fromMailbox}`,
    `To: ${toAddress}`,
    `Subject: =?UTF-8?B?${subjB64}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    folded,
  ];
  return lines.join('\r\n');
}

async function getGmailAccessToken() {
  const t = loadGoogleTokens();
  if (!t?.refresh_token) return null;
  const r = await refreshAccessToken(t.refresh_token);
  return r.access_token;
}

/**
 * @param {string} accessToken
 * @param {string} rawRfc2822Base64Url
 */
async function gmailSendRaw(accessToken, rawRfc2822Base64Url) {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: rawRfc2822Base64Url }),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const snippet = text.length > 500 ? `${text.slice(0, 500)}…` : text;
    throw new Error(data.error?.message || data.error || `Gmail send ${res.status}: ${snippet}`);
  }
  return data;
}

async function sendNotifyEmail(to, subject, text) {
  if (!isGmailSendConfigured()) {
    invoiceLog('warn', 'gmail notify: set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_TOKENS_JSON (or token file)', {});
    return;
  }
  const notifyTo = String(to ?? '').trim();
  if (!notifyTo) {
    invoiceLog('warn', 'gmail notify: INVOICE_NOTIFY_EMAIL empty', {});
    return;
  }

  const access = await getGmailAccessToken();
  if (!access) {
    invoiceLog('warn', 'gmail notify: no access token (missing refresh_token in tokens)', {});
    return;
  }

  const tokens = loadGoogleTokens();
  let fromMailbox = String(tokens?.email ?? '').toLowerCase().trim();
  if (!fromMailbox) {
    const profile = await fetchGmailProfile(access);
    fromMailbox = String(profile.emailAddress ?? '').toLowerCase().trim();
  }
  if (!fromMailbox) {
    invoiceLog('warn', 'gmail notify: could not resolve sender mailbox', {});
    return;
  }

  const mime = buildNewMessageMime(fromMailbox, notifyTo, subject, text);
  const raw = toRawBase64Url(mime);
  await gmailSendRaw(access, raw);
  invoiceLog('notify', 'gmail sent', { to: notifyTo });
}

/**
 * @param {import('express').Request} req
 * @param {{ rid: string, fileCount: number, names: string[] }} info
 */
export function notifyProcessStarted(req, info) {
  const to = process.env.INVOICE_NOTIFY_EMAIL?.trim();
  if (!to) return;

  const { ip, ua, xForwardedFor } = clientSummary(req);

  const names = info.names?.length ? info.names.join(', ') : '—';
  const subject = `Demo used • ${info.fileCount} file${info.fileCount === 1 ? '' : 's'} • ${truncate(ip, 45)}`;
  const text = [
    `They ran processing („Apdoroti“) — not just the homepage.`,
    ``,
    `Request: ${info.rid}`,
    `Files (${info.fileCount}): ${names}`,
    `IP: ${ip}`,
    xForwardedFor ? `X-Forwarded-For: ${xForwardedFor}` : null,
    `UA: ${ua || '—'}`,
    ``,
    `UTC: ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join('\n');

  void sendNotifyEmail(to, subject, text).catch((e) => {
    invoiceLog('warn', 'gmail notify process failed', { message: e?.message });
  });
}

/**
 * Demo lifetime limit reached (429) — same IP tried again after exhausting slots.
 * @param {import('express').Request} req
 * @param {{ rid: string, fileCount: number, names: string[] }} info
 */
export function notifyDemoLimitReached(req, info) {
  const to = process.env.INVOICE_NOTIFY_EMAIL?.trim();
  if (!to) return;

  const { ip, ua, xForwardedFor } = clientSummary(req);
  const names = info.names?.length ? info.names.join(', ') : '—';
  const subject = `Demo blocked • limit reached • ${truncate(ip, 45)}`;
  const text = [
    `Processing was rejected: demo attempt limit already used for this IP.`,
    ``,
    `Request: ${info.rid}`,
    `Would have processed (${info.fileCount}): ${names}`,
    `IP: ${ip}`,
    xForwardedFor ? `X-Forwarded-For: ${xForwardedFor}` : null,
    `UA: ${ua || '—'}`,
    ``,
    `UTC: ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join('\n');

  void sendNotifyEmail(to, subject, text).catch((e) => {
    invoiceLog('warn', 'gmail notify limit failed', { message: e?.message });
  });
}

/**
 * @param {import('express').Request} req
 */
export function notifyVisitIfEnabled(req) {
  if (process.env.INVOICE_NOTIFY_VISIT !== '1') return;

  const to = process.env.INVOICE_NOTIFY_EMAIL?.trim();
  if (!to) return;

  const { ip, ua, xForwardedFor } = clientSummary(req);
  const day = utcCalendarDay();
  if (lastVisitNotifyUtcDayByIp.get(ip) === day) {
    return;
  }

  const subject = `Demo opened • ${truncate(ip, 45)}`;
  const text = [
    `Homepage load only — no processing yet.`,
    ``,
    `IP: ${ip}`,
    xForwardedFor ? `X-Forwarded-For: ${xForwardedFor}` : null,
    `UA: ${ua || '—'}`,
    ``,
    `UTC: ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join('\n');

  void sendNotifyEmail(to, subject, text)
    .then(() => {
      lastVisitNotifyUtcDayByIp.set(ip, day);
    })
    .catch((e) => {
      invoiceLog('warn', 'gmail notify visit failed', { message: e?.message });
    });
}
