import fs from 'node:fs';
import path from 'node:path';
const DEFAULT_REL = path.join('data', 'oauth-store.json');
function emptySnapshot() {
    return { pending: {}, connections: [] };
}
export class OAuthFileStore {
    filePath;
    constructor(filePath) {
        this.filePath =
            filePath?.trim() ||
                process.env.LEADFLOW_OAUTH_STORE_PATH?.trim() ||
                path.join(process.cwd(), DEFAULT_REL);
    }
    read() {
        try {
            const raw = fs.readFileSync(this.filePath, 'utf8');
            const j = JSON.parse(raw);
            if (!j || typeof j !== 'object')
                return emptySnapshot();
            return {
                pending: j.pending && typeof j.pending === 'object' ? j.pending : {},
                connections: Array.isArray(j.connections) ? j.connections : [],
            };
        }
        catch {
            return emptySnapshot();
        }
    }
    write(s) {
        const dir = path.dirname(this.filePath);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(this.filePath, JSON.stringify(s, null, 0), 'utf8');
    }
    putPending(row) {
        const s = this.read();
        s.pending[row.state] = row;
        this.write(s);
    }
    takePending(state) {
        const s = this.read();
        const row = s.pending[state];
        if (!row)
            return undefined;
        delete s.pending[state];
        this.write(s);
        return row;
    }
    peekPending(state) {
        return this.read().pending[state];
    }
    removePending(state) {
        const s = this.read();
        if (!s.pending[state])
            return;
        delete s.pending[state];
        this.write(s);
    }
    upsertConnection(c) {
        const s = this.read();
        s.connections = s.connections.filter((x) => !(x.linkKey === c.linkKey && x.provider === c.provider));
        s.connections.push(c);
        this.write(s);
    }
    listForLink(linkKey) {
        const s = this.read();
        return s.connections.filter((c) => c.linkKey === linkKey);
    }
    getConnection(linkKey, provider) {
        const s = this.read();
        return s.connections.find((c) => c.linkKey === linkKey && c.provider === provider);
    }
}
export function isProviderId(s) {
    return s === 'google' || s === 'clickup';
}
