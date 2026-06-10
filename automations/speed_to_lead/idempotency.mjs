import { getRedisIngressConnection } from "./queue.mjs";

const LOCK_PREFIX = "speed-lead:lock:";
const PROCESSED_PREFIX = "speed-lead:processed:";
const TTL_SEC = 7 * 24 * 60 * 60;
const LOCK_TTL_SEC = 3600;

export const REDIS_INGRESS_TIMEOUT_MS = Number(
  process.env.REDIS_INGRESS_TIMEOUT_MS || 2000
);

/**
 * Bound `queue.add` (BullMQ uses the main Redis connection, not ingress).
 * Same wall-clock budget as ingress `commandTimeout` by default.
 */
export function withIngressTimeout(promise) {
  const ms =
    Number.isFinite(REDIS_INGRESS_TIMEOUT_MS) && REDIS_INGRESS_TIMEOUT_MS > 0
      ? REDIS_INGRESS_TIMEOUT_MS
      : 2000;
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new Error("redis ingress timeout"));
    }, ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

export function idempotencyRedis() {
  return getRedisIngressConnection();
}

export async function isNotifyProcessed(redis, key) {
  const v = await withIngressTimeout(redis.get(PROCESSED_PREFIX + key));
  return v != null;
}

export async function tryIngressLock(redis, key) {
  const r = await withIngressTimeout(
    redis.set(LOCK_PREFIX + key, "1", "EX", LOCK_TTL_SEC, "NX")
  );
  return r === "OK";
}

export async function releaseIngressLock(redis, key) {
  if (!key) return;
  await redis.del(LOCK_PREFIX + key);
}

export async function markNotifyProcessed(redis, key) {
  if (!key) return;
  await redis.set(PROCESSED_PREFIX + key, "1", "EX", TTL_SEC);
  await redis.del(LOCK_PREFIX + key);
}
