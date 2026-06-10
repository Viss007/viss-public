/**
 * Two parallel POST /lead with the same idempotency_key and body.
 * Expect one accepted and one deduplicated (order not guaranteed).
 *
 * Env: STRESS_BASE (default http://127.0.0.1:3001)
 */
import "dotenv/config";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const base = process.env.STRESS_BASE || "http://127.0.0.1:3001";
const fixturesPath = join(__dirname, "..", "fixtures", "lead_submitted.json");
const leads = JSON.parse(readFileSync(fixturesPath, "utf8"));
const key = randomUUID();
const row = { ...leads[0], idempotency_key: key };
const body = JSON.stringify(row);
const url = `${base.replace(/\/$/, "")}/lead`;

const [a, b] = await Promise.all([
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  }),
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  }),
]);
const ja = await a.json();
const jb = await b.json();
const sumAccepted = (ja.accepted || 0) + (jb.accepted || 0);
const sumDedup = (ja.deduplicated || 0) + (jb.deduplicated || 0);
console.log(
  JSON.stringify({
    idempotency_key: key,
    a: { status: a.status, ...ja },
    b: { status: b.status, ...jb },
    sumAccepted,
    sumDedup,
    ok:
      sumAccepted === 1 &&
      sumDedup === 1 &&
      ja.ok &&
      jb.ok,
  })
);
