/**
 * BullMQ queue counts for speed-lead-events (same Redis as server).
 * Usage: node scripts/queue-snapshot.mjs
 */
import "dotenv/config";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { QUEUE_NAME } from "../queue.mjs";

const conn = new IORedis(
  process.env.REDIS_URL
    ? process.env.REDIS_URL
    : {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
      maxRetriesPerRequest: null,
    }
);
const q = new Queue(QUEUE_NAME, { connection: conn });
const counts = await q.getJobCounts();
console.log(JSON.stringify({ queue: QUEUE_NAME, ...counts }, null, 2));
await conn.quit();
