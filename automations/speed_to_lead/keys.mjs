import { randomUUID } from "crypto";

export function isUuid(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(s).trim()
  );
}

export function stripIdempotencyFields(item) {
  const { idempotency_key, ...rest } = item;
  return rest;
}

export function resolveIdempotencyKey(item, req, singleItem) {
  if (item.idempotency_key != null && String(item.idempotency_key).trim() !== "") {
    const k = String(item.idempotency_key).trim();
    if (!isUuid(k)) {
      throw new Error("invalid idempotency_key (expected UUID)");
    }
    return k;
  }
  if (singleItem) {
    const h = req.get("Idempotency-Key") ?? req.get("idempotency-key");
    if (h != null && String(h).trim() !== "") {
      const v = String(h).trim();
      if (!isUuid(v)) {
        throw new Error("invalid Idempotency-Key header (expected UUID)");
      }
      return v;
    }
  }
  return randomUUID();
}
