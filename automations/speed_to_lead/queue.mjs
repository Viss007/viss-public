import { Queue } from "bullmq";
import IORedis from "ioredis";

export const QUEUE_NAME = "speed-lead-events";

let shared = null;
let ingress = null;

/**
 * Dedicated Redis client for idempotency keys (GET/SET/DEL). Bounded with
 * `commandTimeout` (default 2000ms via `REDIS_INGRESS_TIMEOUT_MS`) so slow or
 * stuck Redis commands fail instead of hanging. BullMQ still uses
 * `getRedisConnection()`.
 */
export function getRedisIngressConnection() {
  if (!ingress) {
    const ms = Number(process.env.REDIS_INGRESS_TIMEOUT_MS || 2000);
    const commandTimeout =
      Number.isFinite(ms) && ms > 0 ? ms : 2000;
    const opts = {
      maxRetriesPerRequest: 1,
      commandTimeout,
      connectTimeout: Math.min(commandTimeout * 5, 10000),
    };
    const url = process.env.REDIS_URL;
    ingress = url
      ? new IORedis(url, opts)
      : new IORedis({
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: Number(process.env.REDIS_PORT) || 6379,
        ...opts,
      });
  }
  return ingress;
}

export function getRedisConnection() {
  if (!shared) {
    const url = process.env.REDIS_URL;
    shared = url
      ? new IORedis(url, { maxRetriesPerRequest: null })
      : new IORedis({
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: Number(process.env.REDIS_PORT) || 6379,
        maxRetriesPerRequest: null,
      });
  }
  return shared;
}

export function createQueue() {
  return new Queue(QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: "fixed", delay: 1000 },
    },
  });
}
