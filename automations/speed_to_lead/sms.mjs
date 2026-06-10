/**
 * SMS outbound — this service is the pipe: lead in, qualify, notify. Where SMS
 * actually goes is the buyer's integration (convenience, not lock-in).
 *
 * Default in-repo: stub logs `[sms:stub] to=... message=...` so you can demo
 * without any vendor. Optional Twilio when TWILIO_* + TWILIO_FROM are set
 * (Nexmo/Vonage etc. would be a parallel adapter the buyer swaps in).
 *
 * Buyer-local option (no cloud SMS): a small Python script + USB GSM modem
 * (e.g. Huawei dongle on COM port) using pyserial:
 *   sendSmsPythonLocal(phone, message)
 *   AT+CMGS="+370..." then message then Ctrl+Z (0x1A). No internet bill—just SIM.
 * Wire that from your worker or a subprocess; not implemented here by design.
 *
 * Twilio path: TWILIO_SID or TWILIO_ACCOUNT_SID, TWILIO_TOKEN or TWILIO_AUTH_TOKEN,
 * TWILIO_FROM. SMS_FORCE_STUB=1 forces stub even with creds. Worker SMS is
 * best-effort after Slack (errors logged, no throw from worker path).
 */

import twilio from "twilio";

export function twilioCredentials() {
  const accountSid = String(
    process.env.TWILIO_SID || process.env.TWILIO_ACCOUNT_SID || ""
  ).trim();
  const authToken = String(
    process.env.TWILIO_TOKEN || process.env.TWILIO_AUTH_TOKEN || ""
  ).trim();
  const from = String(process.env.TWILIO_FROM || "").trim();
  return { accountSid, authToken, from };
}

export function isTwilioConfigured() {
  const { accountSid, authToken, from } = twilioCredentials();
  return Boolean(accountSid && authToken && from);
}

export function resolvePhoneFromPayload(payload) {
  if (!payload || typeof payload !== "object") return null;
  const raw = payload.phone ?? payload.caller;
  if (raw == null) return null;
  const s = String(raw).trim();
  return s.length ? s : null;
}

export function buildSmsText({ eventType, payload, receivedAt, jobId }) {
  const head = `[${eventType}] job=${jobId} received=${receivedAt}`;
  let detail = "";
  if (payload && typeof payload === "object") {
    const copy = { ...payload };
    delete copy.idempotency_key;
    detail = "\n" + JSON.stringify(copy);
  }
  const full = head + detail;
  return full.length > 1600 ? full.slice(0, 1597) + "..." : full;
}

export function sendSmsStub({ to, text }) {
  console.log(
    "[sms:stub] to=" + JSON.stringify(to) + " message=" + JSON.stringify(text)
  );
  return { ok: true, stub: true };
}

/**
 * Sends SMS via Twilio when configured; otherwise stub.
 * @throws on Twilio API failure (caller handles for /sms/test)
 */
export async function sendSmsOut({ to, text }) {
  const { accountSid, authToken, from } = twilioCredentials();
  const forceStub = process.env.SMS_FORCE_STUB === "1";
  if (
    !forceStub &&
    accountSid &&
    authToken &&
    from
  ) {
    const client = twilio(accountSid, authToken);
    const msg = await client.messages.create({
      to,
      from,
      body: text,
    });
    console.log("[sms:twilio] sid=" + msg.sid + " to=" + JSON.stringify(to));
    return { ok: true, stub: false, twilio_sid: msg.sid };
  }
  return sendSmsStub({ to, text });
}

export async function maybeSendSmsAfterNotify(ctx) {
  const { eventType, payload, receivedAt, jobId } = ctx;
  if (process.env.SMS_STUB_ENABLED === "0") {
    return { skipped: true, reason: "SMS_STUB_ENABLED=0" };
  }
  const to = resolvePhoneFromPayload(payload);
  if (!to) {
    console.log("[sms] skip (no phone or caller on payload)");
    return { skipped: true, reason: "no_phone" };
  }
  const text = buildSmsText({ eventType, payload, receivedAt, jobId });
  try {
    return await sendSmsOut({ to, text });
  } catch (e) {
    console.error("[sms] twilio error:", e?.message ?? e);
    return { ok: false, error: String(e?.message ?? e) };
  }
}

export function smsHealthSlice() {
  if (process.env.SMS_STUB_ENABLED === "0") {
    return { mode: "disabled", twilio_configured: isTwilioConfigured() };
  }
  if (process.env.SMS_FORCE_STUB === "1") {
    return { mode: "stub_forced", twilio_configured: isTwilioConfigured() };
  }
  if (isTwilioConfigured()) {
    return { mode: "twilio", twilio_configured: true };
  }
  return { mode: "stub", twilio_configured: false };
}
