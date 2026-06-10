import { db } from "./db.js";

export function getIdem(scope: string, idemKey?: string) {
  if (!idemKey) return null;
  const row = db
    .prepare(`SELECT response_json FROM idempotency WHERE idem_scope = ? AND idem_key = ?`)
    .get(scope, idemKey) as { response_json: string } | undefined;
  if (!row) return null;
  return JSON.parse(row.response_json) as unknown;
}

export function setIdem(scope: string, idemKey: string | undefined, response: unknown) {
  if (!idemKey) return;
  db.prepare(
    `INSERT OR REPLACE INTO idempotency (idem_scope, idem_key, response_json, created_at) VALUES (?, ?, ?, ?)`
  ).run(scope, idemKey, JSON.stringify(response), new Date().toISOString());
}
