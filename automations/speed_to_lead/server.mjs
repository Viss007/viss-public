import "dotenv/config";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { randomBytes } from "crypto";
import express from "express";
import { readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import {
  buildGoogleAuthUrl,
  exchangeCodeForTokens,
  fetchGmailProfile,
  googleTokenFilePath,
  isGoogleOAuthConfigured,
  loadGoogleTokens,
  refreshAccessToken,
  saveGoogleTokens,
} from "./google_oauth.mjs";
import {
  idempotencyRedis,
  isNotifyProcessed,
  releaseIngressLock,
  tryIngressLock,
  withIngressTimeout,
} from "./idempotency.mjs";
import { avgProcessMsSnapshot } from "./metrics.mjs";
import { createQueue } from "./queue.mjs";
import { resolveIdempotencyKey, stripIdempotencyFields } from "./keys.mjs";
import { emailHealthSlice } from "./email.mjs";
import { sendSmsOut, smsHealthSlice } from "./sms.mjs";
import {
  gmailInboundStatePath,
  gmailPollIntervalMs,
  gmailSearchQuery,
  isGmailInboundEnabled,
  pollGmailInboundOnce,
  startGmailInboundPoller,
} from "./gmail_inbound.mjs";
import { startWorker } from "./worker.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
/** Public runtime: docs_agent :3000, speed-to-lead :3001 — see docs/RUNTIME-3333.md */
const PORT = Number(process.env.PORT) || 3001;

const queue = createQueue();

function loadSchema(name) {
  return JSON.parse(
    readFileSync(join(__dirname, "schema/v1", name), "utf8")
  );
}

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const validateLeadSubmitted = ajv.compile(loadSchema("lead.submitted.schema.json"));
const validateCallCompleted = ajv.compile(loadSchema("call.completed.schema.json"));
const validateAppointmentRequested = ajv.compile(
  loadSchema("appointment.requested.schema.json")
);

const app = express();
app.use(express.json({ limit: "2mb" }));

const OAUTH_STATE_TTL_MS = 15 * 60 * 1000;
const oauthStates = new Map();

function mintOAuthState() {
  const state = randomBytes(24).toString("hex");
  oauthStates.set(state, Date.now());
  return state;
}

function isValidOAuthState(state) {
  if (typeof state !== "string" || !state) return false;
  const t = oauthStates.get(state);
  if (t == null) return false;
  if (Date.now() - t > OAUTH_STATE_TTL_MS) {
    oauthStates.delete(state);
    return false;
  }
  return true;
}

function consumeOAuthState(state) {
  oauthStates.delete(state);
}

setInterval(() => {
  const now = Date.now();
  for (const [s, t] of oauthStates) {
    if (now - t > OAUTH_STATE_TTL_MS) oauthStates.delete(s);
  }
}, 60_000).unref();

app.get("/auth/google", (_req, res) => {
  if (!isGoogleOAuthConfigured()) {
    return res.status(503).type("text/plain").send(
      "Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in .env"
    );
  }
  try {
    const state = mintOAuthState();
    const url = buildGoogleAuthUrl(state);
    res.redirect(302, url);
  } catch (e) {
    res.status(500).type("text/plain").send(String(e?.message ?? e));
  }
});

app.get("/auth/google/callback", async (req, res) => {
  const err = req.query.error;
  if (err) {
    const desc = req.query.error_description ?? "";
    return res.status(400).type("html").send(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Google OAuth</title></head><body><p>Authorization failed: ${String(
        err
      )}</p><p>${String(desc)}</p><p><a href="./">Back</a></p></body></html>`
    );
  }

  const code = req.query.code;
  const state = req.query.state;
  if (typeof code !== "string" || !code) {
    return res.status(400).type("text/plain").send("missing code");
  }
  if (typeof state !== "string" || !isValidOAuthState(state)) {
    return res.status(400).type("text/plain").send("invalid or expired state");
  }
  consumeOAuthState(state);

  try {
    const tokens = await exchangeCodeForTokens(code);
    const prior = loadGoogleTokens();
    const refresh_token = tokens.refresh_token ?? prior?.refresh_token;
    if (!refresh_token) {
      return res.status(502).type("text/plain").send(
        "No refresh_token returned. Revoke app access in Google Account settings and connect again with prompt=consent."
      );
    }

    const access = tokens.access_token;
    const profile = await fetchGmailProfile(access);
    const email = profile.emailAddress ?? null;

    const stored = {
      refresh_token,
      scope: tokens.scope ?? prior?.scope,
      token_type: tokens.token_type ?? "Bearer",
      email,
      updated_at: new Date().toISOString(),
    };
    saveGoogleTokens(stored);

    const wantsJson = req.get("Accept")?.includes("application/json");
    if (wantsJson) {
      return res.status(200).json({
        ok: true,
        email,
        token_file: googleTokenFilePath(),
      });
    }

    return res.status(200).type("html").send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><title>Gmail connected</title>
<link rel="stylesheet" href="styles.css"/></head>
<body><div class="bg-grid" aria-hidden="true"></div>
<main class="layout" style="max-width:520px;margin:2rem auto;">
  <h1 style="font-size:1.25rem;margin-bottom:0.75rem;">Gmail connected</h1>
  <p>${email ? `Signed in as <strong>${email}</strong>.` : "Connected."}</p>
  <p style="opacity:0.85;font-size:0.9rem;">Tokens saved to <code>speed_lead/.google-tokens.json</code> (gitignored).</p>
  <p><a href="./">Back to dashboard</a></p>
</main></body></html>`);
  } catch (e) {
    console.error("[auth/google/callback]", e);
    return res.status(502).type("text/plain").send(String(e?.message ?? e));
  }
});

app.get("/auth/google/test", async (req, res) => {
  if (!isGoogleOAuthConfigured()) {
    return res.status(503).json({
      ok: false,
      error: "Google OAuth not configured",
    });
  }
  const prior = loadGoogleTokens();
  if (!prior?.refresh_token) {
    return res.status(400).json({
      ok: false,
      error: "not connected",
      hint: "Open /auth/google first",
    });
  }
  try {
    const refreshed = await refreshAccessToken(prior.refresh_token);
    const access = refreshed.access_token;
    const profile = await fetchGmailProfile(access);
    return res.status(200).json({
      ok: true,
      email: profile.emailAddress,
      messagesTotal: profile.messagesTotal,
    });
  } catch (e) {
    console.error("[auth/google/test]", e);
    return res.status(502).json({
      ok: false,
      error: String(e?.message ?? e),
    });
  }
});

app.get("/auth/google/poll-once", async (_req, res) => {
  try {
    const out = await pollGmailInboundOnce();
    return res.status(200).json(out);
  } catch (e) {
    console.error("[auth/google/poll-once]", e);
    return res.status(502).json({
      ok: false,
      error: String(e?.message ?? e),
    });
  }
});

function normalizeItems(body) {
  if (body === null || body === undefined) return [];
  if (Array.isArray(body)) return body;
  return [body];
}

function postValidated(path, validate, eventTag) {
  app.post(path, async (req, res) => {
    const items = normalizeItems(req.body);
    if (items.length === 0) {
      return res.status(400).json({ ok: false, error: "empty body" });
    }

    const errors = [];
    for (let i = 0; i < items.length; i++) {
      const ok = validate(items[i]);
      if (!ok) {
        errors.push({ index: i, errors: validate.errors ?? [] });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        ok: false,
        error: "validation failed",
        details: errors,
      });
    }

    const redis = idempotencyRedis();
    const receivedAt = new Date().toISOString();
    const acceptedKeys = [];
    const deduplicatedKeys = [];

    try {
      for (const item of items) {
        let idempotencyKey;
        try {
          idempotencyKey = resolveIdempotencyKey(item, req, items.length === 1);
        } catch (e) {
          return res.status(400).json({
            ok: false,
            error: String(e?.message ?? e),
          });
        }

        let lockHeld = false;
        try {
          if (await isNotifyProcessed(redis, idempotencyKey)) {
            deduplicatedKeys.push(idempotencyKey);
            continue;
          }
          const locked = await tryIngressLock(redis, idempotencyKey);
          if (!locked) {
            deduplicatedKeys.push(idempotencyKey);
            continue;
          }
          lockHeld = true;

          const payload = stripIdempotencyFields(item);
          await withIngressTimeout(
            queue.add("notify", {
              eventType: eventTag,
              payload,
              receivedAt,
              idempotencyKey,
            })
          );
          acceptedKeys.push(idempotencyKey);
        } catch (err) {
          if (lockHeld) {
            await releaseIngressLock(redis, idempotencyKey).catch(() => { });
          }
          throw err;
        }
      }
    } catch (err) {
      return res.status(503).json({
        ok: false,
        error: "queue unavailable",
        detail: String(err?.message ?? err),
      });
    }

    return res.status(200).json({
      ok: true,
      message: "received",
      count: items.length,
      accepted: acceptedKeys.length,
      deduplicated: deduplicatedKeys.length,
      deduplicated_keys:
        deduplicatedKeys.length > 0 ? deduplicatedKeys : undefined,
    });
  });
}

postValidated("/lead", validateLeadSubmitted, "lead.submitted");
postValidated("/call", validateCallCompleted, "call.completed");
postValidated("/appointment", validateAppointmentRequested, "appointment.requested");

app.post("/sms/test", async (req, res) => {
  const body = req.body ?? {};
  const phone = body.phone;
  const message = body.message;
  if (typeof phone !== "string" || !phone.trim()) {
    return res.status(400).json({
      ok: false,
      error: "phone required (non-empty string)",
    });
  }
  if (typeof message !== "string" || !message.length) {
    return res.status(400).json({
      ok: false,
      error: "message required (non-empty string)",
    });
  }
  try {
    const result = await sendSmsOut({
      to: phone.trim(),
      text: message,
    });
    return res.status(200).json({ ok: true, ...result });
  } catch (e) {
    console.error("[sms/test]", e?.message ?? e);
    return res.status(502).json({
      ok: false,
      error: String(e?.message ?? e),
    });
  }
});

app.get("/metrics", async (_req, res) => {
  try {
    const c = await queue.getJobCounts();
    const pending =
      (c.waiting || 0) +
      (c.active || 0) +
      (c.delayed || 0) +
      (c.paused || 0);
    res.status(200).json({
      completed: c.completed ?? 0,
      failed: c.failed ?? 0,
      pending,
      avgProcessMs: avgProcessMsSnapshot(),
    });
  } catch (e) {
    res.status(503).json({
      ok: false,
      error: "queue unavailable",
      detail: String(e?.message ?? e),
    });
  }
});

app.get("/health", (_req, res) => {
  const slack = Boolean(
    process.env.SLACK_WEBHOOK_URL && String(process.env.SLACK_WEBHOOK_URL).trim()
  );
  const sms = smsHealthSlice();
  const email = emailHealthSlice();
  const googleTokens = loadGoogleTokens();
  res.status(200).json({
    ok: true,
    service: "speed-lead",
    queue: "speed-lead-events",
    notify: {
      slack_webhook_configured: slack,
      sms_mode: sms.mode,
      twilio_configured: sms.twilio_configured,
      email_configured: email.configured,
      email_mode: email.mode,
      google_oauth_configured: isGoogleOAuthConfigured(),
      gmail_connected: Boolean(googleTokens?.refresh_token),
      gmail_email: googleTokens?.email ?? null,
      gmail_inbound_enabled: isGmailInboundEnabled(),
      gmail_poll_interval_ms: gmailPollIntervalMs(),
      gmail_search_query: gmailSearchQuery(),
    },
    routes: [
      "GET /",
      "GET /auth/google",
      "GET /auth/google/callback",
      "GET /auth/google/test",
      "GET /auth/google/poll-once",
      "POST /lead",
      "POST /call",
      "POST /appointment",
      "POST /sms/test",
      "GET /health",
      "GET /metrics",
    ],
  });
});

app.use(express.static(join(__dirname, "public"), { index: "index.html" }));

export function startSpeedToLeadBackground() {
  startGmailInboundPoller();
  startWorker();
}

export { app };

const isDirectRun =
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  app.listen(PORT, process.env.HOST || '127.0.0.1', () => {
    console.log(`speed-lead internal ${PORT} (via :3333 /automations/speed-to-lead)`);
    console.log(`gmail inbound state: ${gmailInboundStatePath()}`);
  });
  startSpeedToLeadBackground();
}
