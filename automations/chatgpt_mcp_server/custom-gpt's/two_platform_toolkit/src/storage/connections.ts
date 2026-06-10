import fs from 'node:fs';
import path from 'node:path';
import { encryptString, decryptString } from '../crypto/vault.js';

export type ConnectionProvider = 'google' | 'instagram';

/** On-disk row: tokens are AES-GCM blobs from `vault` (never plaintext on disk). */
export type StoredConnection = {
  user_ref: string;
  provider: ConnectionProvider;
  encrypted_access_token: string;
  encrypted_refresh_token: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Safe to return from APIs (no ciphertext). */
export type ConnectionMeta = {
  user_ref: string;
  provider: ConnectionProvider;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  has_refresh_token: boolean;
};

type FileShape = {
  version: 1;
  connections: StoredConnection[];
};

const DEFAULT_REL = path.join('data', 'connections.json');

function emptyFile(): FileShape {
  return { version: 1, connections: [] };
}

function nowIso(): string {
  return new Date().toISOString();
}

function isProvider(s: string): s is ConnectionProvider {
  return s === 'google' || s === 'instagram';
}

export class ConnectionStore {
  readonly filePath: string;

  constructor(filePath?: string) {
    this.filePath =
      filePath?.trim() ||
      process.env.TOOLKIT_CONNECTIONS_PATH?.trim() ||
      path.join(process.cwd(), DEFAULT_REL);
  }

  private read(): FileShape {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const j = JSON.parse(raw) as FileShape;
      if (!j || j.version !== 1 || !Array.isArray(j.connections)) {
        return emptyFile();
      }
      return { version: 1, connections: j.connections.filter(isValidRow) };
    } catch {
      return emptyFile();
    }
  }

  private write(data: FileShape): void {
    const dir = path.dirname(this.filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 0), 'utf8');
  }

  /**
   * Insert or replace the connection for `(user_ref, provider)`.
   * Plaintext tokens are encrypted before persistence.
   */
  upsert(input: {
    user_ref: string;
    provider: ConnectionProvider;
    accessToken: string;
    refreshToken?: string | null;
    expiresAtMs?: number | null;
  }): StoredConnection {
    const user_ref = input.user_ref.trim();
    if (!user_ref) throw new Error('user_ref is required');

    const data = this.read();
    const idx = data.connections.findIndex((c) => c.user_ref === user_ref && c.provider === input.provider);
    const prior = idx >= 0 ? data.connections[idx] : undefined;

    const encrypted_access_token = encryptString(input.accessToken);
    let encrypted_refresh_token: string | null;
    if (input.refreshToken !== undefined && input.refreshToken !== null && input.refreshToken !== '') {
      encrypted_refresh_token = encryptString(input.refreshToken);
    } else if (input.refreshToken === null || input.refreshToken === '') {
      encrypted_refresh_token = null;
    } else {
      encrypted_refresh_token = prior?.encrypted_refresh_token ?? null;
    }

    let expires_at: string | null;
    if (input.expiresAtMs === null) {
      expires_at = null;
    } else if (input.expiresAtMs !== undefined) {
      expires_at = new Date(input.expiresAtMs).toISOString();
    } else {
      expires_at = prior?.expires_at ?? null;
    }

    const t = nowIso();
    const created_at = prior?.created_at ?? t;

    const row: StoredConnection = {
      user_ref,
      provider: input.provider,
      encrypted_access_token,
      encrypted_refresh_token,
      expires_at,
      created_at,
      updated_at: t,
    };

    if (idx >= 0) data.connections[idx] = row;
    else data.connections.push(row);
    this.write(data);
    return row;
  }

  /** Raw stored row (still encrypted); undefined if missing. */
  getStored(user_ref: string, provider: ConnectionProvider): StoredConnection | undefined {
    const u = user_ref.trim();
    return this.read().connections.find((c) => c.user_ref === u && c.provider === provider);
  }

  /** Decrypted tokens for API calls. */
  getSecrets(
    user_ref: string,
    provider: ConnectionProvider,
  ): { accessToken: string; refreshToken: string | null; expiresAtMs: number | null } | undefined {
    const row = this.getStored(user_ref, provider);
    if (!row) return undefined;
    const accessToken = decryptString(row.encrypted_access_token);
    const refreshToken = row.encrypted_refresh_token ? decryptString(row.encrypted_refresh_token) : null;
    const expiresAtMs = row.expires_at ? Date.parse(row.expires_at) : null;
    return {
      accessToken,
      refreshToken,
      expiresAtMs: Number.isFinite(expiresAtMs) ? expiresAtMs : null,
    };
  }

  /** All connections for a user (encrypted fields omitted). */
  listForUser(user_ref: string): ConnectionMeta[] {
    const u = user_ref.trim();
    return this.read()
      .connections.filter((c) => c.user_ref === u)
      .map((c) => ({
        user_ref: c.user_ref,
        provider: c.provider,
        expires_at: c.expires_at,
        created_at: c.created_at,
        updated_at: c.updated_at,
        has_refresh_token: Boolean(c.encrypted_refresh_token),
      }));
  }

  delete(user_ref: string, provider: ConnectionProvider): boolean {
    const u = user_ref.trim();
    const data = this.read();
    const before = data.connections.length;
    data.connections = data.connections.filter((c) => !(c.user_ref === u && c.provider === provider));
    if (data.connections.length === before) return false;
    this.write(data);
    return true;
  }
}

function isValidRow(c: unknown): c is StoredConnection {
  if (!c || typeof c !== 'object') return false;
  const o = c as Record<string, unknown>;
  if (typeof o.user_ref !== 'string' || !o.user_ref.trim()) return false;
  if (typeof o.provider !== 'string' || !isProvider(o.provider)) return false;
  if (typeof o.encrypted_access_token !== 'string') return false;
  if (o.encrypted_refresh_token !== null && typeof o.encrypted_refresh_token !== 'string') return false;
  if (o.expires_at !== null && typeof o.expires_at !== 'string') return false;
  if (typeof o.created_at !== 'string' || typeof o.updated_at !== 'string') return false;
  return true;
}
