import type { OAuthProviderId } from './types.js';

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  id_token?: string;
};

type ClickUpTokenResponse = {
  access_token?: string;
};

function decodeJwtPayload(idToken: string): Record<string, unknown> | null {
  const parts = idToken.split('.');
  if (parts.length < 2) return null;
  try {
    const json = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function exchangeGoogleCode(
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string,
): Promise<{ subject: string; accessToken: string; refreshToken: string | null; expiresAtMs: number | null }> {
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
  const json = (await res.json()) as GoogleTokenResponse & { error?: string };
  if (!res.ok) {
    throw new Error(json.error || `Google token exchange failed (${res.status})`);
  }
  const accessToken = json.access_token;
  if (!accessToken) throw new Error('Google token response missing access_token');
  let subject = 'unknown';
  if (json.id_token) {
    const payload = decodeJwtPayload(json.id_token);
    const sub = payload?.sub;
    if (typeof sub === 'string' && sub) subject = sub;
  }
  const expiresAtMs =
    typeof json.expires_in === 'number' ? Date.now() + json.expires_in * 1000 : null;
  return {
    subject,
    accessToken,
    refreshToken: typeof json.refresh_token === 'string' ? json.refresh_token : null,
    expiresAtMs,
  };
}

export async function exchangeClickUpCode(
  clientId: string,
  clientSecret: string,
  code: string,
): Promise<{ subject: string; accessToken: string; refreshToken: null; expiresAtMs: null }> {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
  });
  const res = await fetch('https://api.clickup.com/api/v2/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const json = (await res.json()) as ClickUpTokenResponse & { error?: string; user?: { id?: number } };
  if (!res.ok) {
    throw new Error(json.error || `ClickUp token exchange failed (${res.status})`);
  }
  const accessToken = json.access_token;
  if (!accessToken) throw new Error('ClickUp token response missing access_token');
  let subject = 'unknown';
  if (json.user && typeof json.user.id === 'number') {
    subject = String(json.user.id);
  } else {
    const me = await fetch('https://api.clickup.com/api/v2/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (me.ok) {
      const u = (await me.json()) as { user?: { id?: string | number } };
      if (u.user?.id !== undefined) subject = String(u.user.id);
    }
  }
  return { subject, accessToken, refreshToken: null, expiresAtMs: null };
}

export async function exchangeCode(
  provider: OAuthProviderId,
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string,
): Promise<{ subject: string; accessToken: string; refreshToken: string | null; expiresAtMs: number | null }> {
  if (provider === 'google') {
    return exchangeGoogleCode(clientId, clientSecret, code, redirectUri);
  }
  const cu = await exchangeClickUpCode(clientId, clientSecret, code);
  return { ...cu, refreshToken: cu.refreshToken };
}
