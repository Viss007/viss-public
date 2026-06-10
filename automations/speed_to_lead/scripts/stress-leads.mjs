/**
 * Fire N POST /lead requests with fixture rows + fresh idempotency_key each time.
 * Waits until BullMQ queue has no waiting/active/delayed jobs (drained).
 *
 * Env: STRESS_BASE (default http://127.0.0.1:3001), STRESS_COUNT (default 200)
 * Tip: SLACK_WEBHOOK_URL= empty speeds worker (Slack HTTP skipped); worker still sleeps 2s/job.
 */
import "dotenv/config";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { QUEUE_NAME } from "../queue.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const base = process.env.STRESS_BASE || "http://127.0.0.1:3001";
const count = Number(process.env.STRESS_COUNT || 200);

const fixturesPath = join(__dirname, "..", "fixtures", "lead_submitted.json");
const leads = JSON.parse(readFileSync(fixturesPath, "utf8"));
if (!Array.isArray(leads) || leads.length === 0) {
  throw new Error("fixtures/lead_submitted.json must be a non-empty array");
}

function redisConn() {
  const url = process.env.REDIS_URL;
  return url
    ? new IORedis(url, { maxRetriesPerRequest: null })
    : new IORedis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
      maxRetriesPerRequest: null,
    });
}

const conn = redisConn();
const q = new Queue(QUEUE_NAME, { connection: conn });

async function snapshot() {
  return q.getJobCounts();
}

const before = await snapshot();
console.log(JSON.stringify({ phase: "before", ...before }));

let accepted = 0;
let deduped = 0;
let httpFail = 0;
const t0 = Date.now();
for (let i = 0; i < count; i++) {
  const row = { ...leads[i % leads.length] };
  row.idempotency_key = randomUUID();
  const r = await fetch(`${base.replace(/\/$/, "")}/lead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(row),
  });
  let j = {};
  try {
    j = await r.json();
  } catch {
    httpFail += 1;
    console.error(JSON.stringify({ i, status: r.status, err: "bad json" }));
    continue;
  }
  if (!j.ok) {
    httpFail += 1;
    console.error(JSON.stringify({ i, status: r.status, j }));
  }
  accepted += j.accepted ?? 0;
  deduped += j.deduplicated ?? 0;
}
const postMs = Date.now() - t0;
console.log(
  JSON.stringify({
    phase: "posted",
    accepted,
    deduped,
    posts: count,
    httpFail,
    ms: postMs,
  })
);

const deadline = Date.now() + 360_000;
while (Date.now() < deadline) {
  const c = await snapshot();
  const pending =
    (c.waiting || 0) + (c.active || 0) + (c.delayed || 0) + (c.paused || 0);
  console.log(JSON.stringify({ phase: "drain", ...c, pending }));
  if (pending === 0) break;
  await new Promise((r) => setTimeout(r, 2000));
}

const after = await snapshot();
console.log(JSON.stringify({ phase: "after", ...after }));
await conn.quit();
