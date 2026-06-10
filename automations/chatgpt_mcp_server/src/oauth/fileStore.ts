import fs from 'node:fs';
import path from 'node:path';
import type { OAuthConnection, OAuthProviderId, OAuthStoreSnapshot, PendingOAuthState } from './types.js';

const DEFAULT_REL = path.join('data', 'oauth-store.json');

function emptySnapshot(): OAuthStoreSnapshot {
  return { pending: {}, connections: [] };
}

export class OAuthFileStore {
  readonly filePath: string;

  constructor(filePath?: string) {
    this.filePath =
      filePath?.trim() ||
      process.env.LEADFLOW_OAUTH_STORE_PATH?.trim() ||
      path.join(process.cwd(), DEFAULT_REL);
  }

  private read(): OAuthStoreSnapshot {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const j = JSON.parse(raw) as OAuthStoreSnapshot;
      if (!j || typeof j !== 'object') return emptySnapshot();
      return {
        pending: j.pending && typeof j.pending === 'object' ? j.pending : {},
        connections: Array.isArray(j.connections) ? j.connections : [],
      };
    } catch {
      return emptySnapshot();
    }
  }

  private write(s: OAuthStoreSnapshot): void {
    const dir = path.dirname(this.filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(s, null, 0), 'utf8');
  }

  putPending(row: PendingOAuthState): void {
    const s = this.read();
    s.pending[row.state] = row;
    this.write(s);
  }

  takePending(state: string): PendingOAuthState | undefined {
    const s = this.read();
    const row = s.pending[state];
    if (!row) return undefined;
    delete s.pending[state];
    this.write(s);
    return row;
  }

  peekPending(state: string): PendingOAuthState | undefined {
    return this.read().pending[state];
  }

  removePending(state: string): void {
    const s = this.read();
    if (!s.pending[state]) return;
    delete s.pending[state];
    this.write(s);
  }

  upsertConnection(c: OAuthConnection): void {
    const s = this.read();
    s.connections = s.connections.filter(
      (x) => !(x.linkKey === c.linkKey && x.provider === c.provider),
    );
    s.connections.push(c);
    this.write(s);
  }

  listForLink(linkKey: string): OAuthConnection[] {
    const s = this.read();
    return s.connections.filter((c) => c.linkKey === linkKey);
  }

  getConnection(linkKey: string, provider: OAuthProviderId): OAuthConnection | undefined {
    const s = this.read();
    return s.connections.find((c) => c.linkKey === linkKey && c.provider === provider);
  }
}

export function isProviderId(s: string): s is OAuthProviderId {
  return s === 'google' || s === 'clickup';
}
