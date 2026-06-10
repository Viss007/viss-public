import Database from "better-sqlite3";

const dbPath = process.env.DB_PATH || "./stl.db";
export const db = new Database(dbPath);

function ensureIdempotencySchema() {
  const exists = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='idempotency'`)
    .get() as { name: string } | undefined;
  if (!exists) {
    db.exec(`
      CREATE TABLE idempotency (
        idem_scope TEXT NOT NULL,
        idem_key TEXT NOT NULL,
        response_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (idem_scope, idem_key)
      );
    `);
    return;
  }
  const cols = db.prepare(`PRAGMA table_info(idempotency)`).all() as { name: string }[];
  if (cols.some((c) => c.name === "idem_scope")) return;

  db.exec(`
    ALTER TABLE idempotency RENAME TO idempotency_legacy;
    CREATE TABLE idempotency (
      idem_scope TEXT NOT NULL,
      idem_key TEXT NOT NULL,
      response_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (idem_scope, idem_key)
    );
    INSERT INTO idempotency (idem_scope, idem_key, response_json, created_at)
    SELECT 'legacy', idem_key, response_json, created_at FROM idempotency_legacy;
    DROP TABLE idempotency_legacy;
  `);
}

export function migrate() {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      message_id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      source TEXT NOT NULL,
      raw_text TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(session_id) REFERENCES sessions(session_id)
    );

    CREATE TABLE IF NOT EXISTS leads (
      lead_id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      message_id TEXT,
      full_name TEXT,
      company TEXT,
      email TEXT,
      need_summary TEXT NOT NULL,
      urgency TEXT NOT NULL,
      next_step TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(session_id) REFERENCES sessions(session_id),
      FOREIGN KEY(message_id) REFERENCES messages(message_id)
    );

    CREATE TABLE IF NOT EXISTS drafts (
      draft_id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      lead_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      template_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(session_id) REFERENCES sessions(session_id),
      FOREIGN KEY(lead_id) REFERENCES leads(lead_id)
    );
  `);

  ensureIdempotencySchema();
}
