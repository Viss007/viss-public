function req(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

export function getToolkitPublicUrl(): string | null {
  const u = process.env.TOOLKIT_PUBLIC_URL?.trim();
  if (!u) return null;
  return u.replace(/\/$/, '');
}

export function getInternalApiKey(): string {
  return req('INTERNAL_API_KEY');
}

export function getTokenEncryptionKeyB64(): string {
  return req('TOKEN_ENCRYPTION_KEY');
}

export function getGoogleOAuth(): { clientId: string; clientSecret: string } {
  return {
    clientId: req('GOOGLE_CLIENT_ID'),
    clientSecret: req('GOOGLE_CLIENT_SECRET'),
  };
}

/** True when Google OAuth env is present (secrets never leave the server). */
export function isGoogleOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

/** True when Meta / Instagram OAuth env is present. */
export function isMetaOAuthConfigured(): boolean {
  return Boolean(process.env.META_APP_ID?.trim() && process.env.META_APP_SECRET?.trim());
}

export function getMetaOAuth(): { appId: string; appSecret: string; graphVersion: string } {
  return {
    appId: req('META_APP_ID'),
    appSecret: req('META_APP_SECRET'),
    graphVersion: process.env.META_GRAPH_VERSION?.trim() || 'v21.0',
  };
}

export const GOOGLE_SHEETS_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.readonly',
] as const;
