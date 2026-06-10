import fs from 'node:fs';
import path from 'node:path';
import { getGoogleOAuth, getMetaOAuth } from '../config.js';

export type ProviderCredentialHints = {
  tenant?: string;
  client?: string;
};

type DynamicGoogleCredentials = {
  clientId: string;
  clientSecret: string;
};

type DynamicInstagramCredentials = {
  appId: string;
  appSecret: string;
  graphVersion?: string;
};

type DynamicStoreShape = {
  version: 1;
  defaults?: {
    google?: DynamicGoogleCredentials;
    instagram?: DynamicInstagramCredentials;
  };
  tenants?: Record<
    string,
    {
      google?: DynamicGoogleCredentials;
      instagram?: DynamicInstagramCredentials;
    }
  >;
};

function looksPlaceholder(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (!v) return true;
  const markers = [
    'example',
    'your-',
    'your_',
    'placeholder',
    'changeme',
    'replace-me',
    'test',
    'demo',
    'tenant-e2e',
  ];
  return markers.some((m) => v.includes(m));
}

function validateGoogle(clientId: string, clientSecret: string): string | null {
  if (!clientId || !clientSecret) return 'missing Google client id/secret';
  if (looksPlaceholder(clientId) || looksPlaceholder(clientSecret)) {
    return 'Google credentials look like placeholders';
  }
  if (!clientId.endsWith('.apps.googleusercontent.com')) {
    return 'Google client id format is invalid';
  }
  if (clientSecret.length < 8) {
    return 'Google client secret format is invalid';
  }
  return null;
}

function validateMeta(appId: string, appSecret: string): string | null {
  if (!appId || !appSecret) return 'missing Meta app id/secret';
  if (looksPlaceholder(appId) || looksPlaceholder(appSecret)) {
    return 'Meta credentials look like placeholders';
  }
  if (!/^\d{6,}$/.test(appId)) {
    return 'Meta app id format is invalid';
  }
  if (!/^[0-9a-fA-F]{16,}$/.test(appSecret)) {
    return 'Meta app secret format is invalid';
  }
  return null;
}

function dynamicStorePath(): string {
  return process.env.TOOLKIT_OAUTH_CREDENTIALS_PATH?.trim() || path.join(process.cwd(), 'data', 'oauth-client-credentials.json');
}

function parseNonEmpty(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function parseDynamicStore(raw: unknown): DynamicStoreShape | null {
  if (!raw || typeof raw !== 'object') return null;
  const cast = raw as DynamicStoreShape;
  if (cast.version !== 1) return null;
  return cast;
}

function loadDynamicStore(): DynamicStoreShape | null {
  const filePath = dynamicStorePath();
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf8');
    return parseDynamicStore(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

function providerLookupKeys(hints: ProviderCredentialHints, userRef: string): string[] {
  const keys: string[] = [];
  const push = (v: string | undefined) => {
    const s = parseNonEmpty(v);
    if (!s) return;
    if (!keys.includes(s)) keys.push(s);
  };
  push(hints.tenant);
  push(hints.client);
  push(userRef);
  return keys;
}

function selectDynamicGoogle(
  store: DynamicStoreShape,
  keys: string[],
): { creds: DynamicGoogleCredentials; key: string } | null {
  for (const key of keys) {
    const creds = store.tenants?.[key]?.google;
    if (creds?.clientId?.trim() && creds?.clientSecret?.trim()) return { creds, key };
  }
  const fallback = store.defaults?.google;
  if (fallback?.clientId?.trim() && fallback?.clientSecret?.trim()) {
    return { creds: fallback, key: 'defaults' };
  }
  return null;
}

function selectDynamicInstagram(
  store: DynamicStoreShape,
  keys: string[],
): { creds: DynamicInstagramCredentials; key: string } | null {
  for (const key of keys) {
    const creds = store.tenants?.[key]?.instagram;
    if (creds?.appId?.trim() && creds?.appSecret?.trim()) return { creds, key };
  }
  const fallback = store.defaults?.instagram;
  if (fallback?.appId?.trim() && fallback?.appSecret?.trim()) {
    return { creds: fallback, key: 'defaults' };
  }
  return null;
}

export function credentialHintsFromQuery(query: Record<string, unknown>): ProviderCredentialHints {
  const tenant =
    parseNonEmpty(query.tenant) ||
    parseNonEmpty(query.tenant_ref) ||
    parseNonEmpty(query.workspace);
  const client =
    parseNonEmpty(query.client) ||
    parseNonEmpty(query.client_ref) ||
    parseNonEmpty(query.client_id);
  return { tenant: tenant ?? undefined, client: client ?? undefined };
}

export function resolveGoogleOAuthCredentials(
  userRef: string,
  hints: ProviderCredentialHints,
): { clientId: string; clientSecret: string; source: 'dynamic' | 'env'; key: string } {
  const keys = providerLookupKeys(hints, userRef);
  const dynamic = loadDynamicStore();
  if (dynamic) {
    const selected = selectDynamicGoogle(dynamic, keys);
    if (selected) {
      const clientId = selected.creds.clientId.trim();
      const clientSecret = selected.creds.clientSecret.trim();
      const invalid = validateGoogle(clientId, clientSecret);
      if (invalid) {
        throw new Error(`Invalid Google OAuth config for key "${selected.key}" (${invalid})`);
      }
      return {
        clientId,
        clientSecret,
        source: 'dynamic',
        key: selected.key,
      };
    }
  }

  const env = getGoogleOAuth();
  const invalid = validateGoogle(env.clientId, env.clientSecret);
  if (invalid) {
    throw new Error(`Invalid Google OAuth config for key "env" (${invalid})`);
  }
  return {
    clientId: env.clientId,
    clientSecret: env.clientSecret,
    source: 'env',
    key: 'env',
  };
}

export function resolveMetaOAuthCredentials(
  userRef: string,
  hints: ProviderCredentialHints,
): { appId: string; appSecret: string; graphVersion: string; source: 'dynamic' | 'env'; key: string } {
  const keys = providerLookupKeys(hints, userRef);
  const dynamic = loadDynamicStore();
  if (dynamic) {
    const selected = selectDynamicInstagram(dynamic, keys);
    if (selected) {
      const appId = selected.creds.appId.trim();
      const appSecret = selected.creds.appSecret.trim();
      const invalid = validateMeta(appId, appSecret);
      if (invalid) {
        throw new Error(`Invalid Instagram OAuth config for key "${selected.key}" (${invalid})`);
      }
      return {
        appId,
        appSecret,
        graphVersion: parseNonEmpty(selected.creds.graphVersion) || process.env.META_GRAPH_VERSION?.trim() || 'v21.0',
        source: 'dynamic',
        key: selected.key,
      };
    }
  }

  const env = getMetaOAuth();
  const invalid = validateMeta(env.appId, env.appSecret);
  if (invalid) {
    throw new Error(`Invalid Instagram OAuth config for key "env" (${invalid})`);
  }
  return {
    appId: env.appId,
    appSecret: env.appSecret,
    graphVersion: env.graphVersion,
    source: 'env',
    key: 'env',
  };
}

export function isGoogleOAuthConfiguredFor(userRef: string, hints: ProviderCredentialHints): boolean {
  try {
    const google = resolveGoogleOAuthCredentials(userRef, hints);
    return Boolean(google.clientId && google.clientSecret);
  } catch {
    return false;
  }
}

export function isMetaOAuthConfiguredFor(userRef: string, hints: ProviderCredentialHints): boolean {
  try {
    const meta = resolveMetaOAuthCredentials(userRef, hints);
    return Boolean(meta.appId && meta.appSecret);
  } catch {
    return false;
  }
}
