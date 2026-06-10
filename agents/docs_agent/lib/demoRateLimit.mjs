/**
 * In-memory per-IP lifetime cap for POST /api/process.
 * Clears only on process restart. Set INVOICE_DEMO_MAX_PROCESSES_PER_IP=0 to disable.
 */

/** @type {Map<string, { count: number }>} */
const buckets = new Map();

/**
 * Express / proxy: first hop in X-Forwarded-For when trust proxy is set.
 * @param {import('express').Request} req
 */
export function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    return xff.split(',')[0].trim() || 'unknown';
  }
  const rip = req.ip || req.socket?.remoteAddress;
  return typeof rip === 'string' && rip ? rip : 'unknown';
}

/**
 * @param {string} ip
 * @param {number} maxLifetime - <= 0 means unlimited
 * @returns {{ allowed: true } | { allowed: false }}
 */
export function tryConsumeDemoProcessSlot(ip, maxLifetime) {
  if (maxLifetime == null || maxLifetime <= 0 || Number.isNaN(maxLifetime)) {
    return { allowed: true };
  }
  let rec = buckets.get(ip);
  if (!rec) {
    rec = { count: 0 };
  }
  if (rec.count >= maxLifetime) {
    return { allowed: false };
  }
  rec.count += 1;
  buckets.set(ip, rec);
  return { allowed: true };
}
