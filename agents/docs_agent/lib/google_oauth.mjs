/**
 * Google OAuth token refresh + Gmail profile (same contract as speed_lead/google_oauth.mjs).
 * Tokens: .google-tokens.json in app root, or GOOGLE_TOKENS_JSON (Railway secret), or GOOGLE_TOKEN_FILE.
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_TOKEN_FILE = join(__dirname, '..', '.google-tokens.json');

export function googleOAuthEnv() {
  const clientId = String(process.env.GOOGLE_CLIENT_ID ?? '').trim();
  const clientSecret = String(process.env.GOOGLE_CLIENT_SECRET ?? '').trim();
  const redirectUri = String(process.env.GOOGLE_REDIRECT_URI ?? '').trim();
  const scopes = String(process.env.GOOGLE_OAUTH_SCOPES ?? '')
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return { clientId, clientSecret, redirectUri, scopes };
}

export function isGoogleOAuthConfigured() {
  const { clientId, clientSecret, redirectUri } = googleOAuthEnv();
  return Boolean(clientId && clientSecret && redirectUri);
}

export function buildGoogleAuthUrl(state) {
  const { clientId, redirectUri, scopes } = googleOAuthEnv();
  if (!scopes.length) {
    throw new Error('GOOGLE_OAUTH_SCOPES is empty');
  }
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
    include_granted_scopes: 'true',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code) {
  const { clientId, clientSecret, redirectUri } = googleOAuthEnv();
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`token exchange failed: HTTP ${res.status} ${text.slice(0, 240)}`);
  }
  if (!res.ok) {
    throw new Error(
      data.error_description || data.error || `token exchange failed: HTTP ${res.status}`,
    );
  }
  return data;
}

/** True when we can refresh tokens and call Gmail (no redirect needed on server). */
export function isGmailSendConfigured() {
  const { clientId, clientSecret } = googleOAuthEnv();
  const t = loadGoogleTokens();
  return Boolean(clientId && clientSecret && t?.refresh_token);
}

export async function refreshAccessToken(refreshToken) {
  const { clientId, clientSecret } = googleOAuthEnv();
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.error || 'refresh failed');
  }
  return data;
}

export async function fetchGmailProfile(accessToken) {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || JSON.stringify(data));
  }
  return data;
}

function tokenFilePath() {
  const p = String(process.env.GOOGLE_TOKEN_FILE ?? '').trim();
  return p || DEFAULT_TOKEN_FILE;
}

export function loadGoogleTokens() {
  const raw = process.env.GOOGLE_TOKENS_JSON?.trim();
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  const path = tokenFilePath();
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

export function saveGoogleTokens(payload) {
  writeFileSync(tokenFilePath(), JSON.stringify(payload, null, 2), 'utf8');
}

export function googleTokenFilePath() {
  return tokenFilePath();
}
