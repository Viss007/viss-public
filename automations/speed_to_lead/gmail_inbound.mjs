import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import {
  fetchGmailProfile,
  isGoogleOAuthConfigured,
  loadGoogleTokens,
  refreshAccessToken,
} from "./google_oauth.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_FILE = join(__dirname, ".gmail-inbound-state.json");
const MAX_PROCESSED_IDS = 2000;

function readBoolEnv(name, defaultValue) {
  const v = process.env[name];
  if (v === undefined || v === "") return defaultValue;
  const s = String(v).trim().toLowerCase();
  if (s === "1" || s === "true" || s === "yes") return true;
  if (s === "0" || s === "false" || s === "no") return false;
  return defaultValue;
}

function inboundVerbose() {
  return readBoolEnv("GMAIL_INBOUND_VERBOSE", true);
}

function logInbound(msg, detail) {
  const line =
    detail !== undefined
      ? `[gmail-inbound] ${msg} ${typeof detail === "string" ? detail : JSON.stringify(detail)}`
      : `[gmail-inbound] ${msg}`;
  console.log(line);
  const logPath = String(process.env.GMAIL_INBOUND_LOG_FILE ?? "").trim();
  if (logPath) {
    try {
      mkdirSync(dirname(logPath), { recursive: true });
      appendFileSync(logPath, `${new Date().toISOString()} ${line}\n`, "utf8");
    } catch (e) {
      console.error("[gmail-inbound] log file write failed:", e?.message ?? e);
    }
  }
}

function vLog(msg, detail) {
  if (inboundVerbose()) logInbound(msg, detail);
}

export function gmailSearchQuery() {
  const q = String(process.env.GMAIL_INBOUND_QUERY ?? "").trim();
  if (q) return q;
  return "is:unread in:inbox";
}

export function isGmailInboundEnabled() {
  return readBoolEnv("GMAIL_INBOUND_ENABLED", true);
}

export function gmailPollIntervalMs() {
  const n = Number(process.env.GMAIL_POLL_INTERVAL_MS);
  if (Number.isFinite(n) && n >= 5000) return Math.floor(n);
  return 30_000;
}

export function gmailAutoReplyText() {
  const t = String(process.env.GMAIL_AUTO_REPLY_TEXT ?? "").trim();
  if (t) return t;
  return (
    "Thanks for your message. This is an automated reply from Speed Lead (dev). " +
    "We received your email and the inbox hook is working."
  );
}

function loadState() {
  if (!existsSync(STATE_FILE)) {
    return { processedIds: [], lastPollAt: null, lastReplySummary: null };
  }
  try {
    const j = JSON.parse(readFileSync(STATE_FILE, "utf8"));
    return {
      processedIds: Array.isArray(j.processedIds) ? j.processedIds : [],
      lastPollAt: j.lastPollAt ?? null,
      lastReplySummary: j.lastReplySummary ?? null,
    };
  } catch {
    return { processedIds: [], lastPollAt: null, lastReplySummary: null };
  }
}

function saveState(state) {
  let ids = state.processedIds;
  if (ids.length > MAX_PROCESSED_IDS) {
    ids = ids.slice(ids.length - MAX_PROCESSED_IDS);
  }
  writeFileSync(
    STATE_FILE,
    JSON.stringify(
      {
        processedIds: ids,
        lastPollAt: state.lastPollAt,
        lastReplySummary: state.lastReplySummary,
      },
      null,
      2
    ),
    "utf8"
  );
}

async function gmailFetch(accessToken, path, init = {}) {
  const url = path.startsWith("http")
    ? path
    : `https://gmail.googleapis.com/gmail/v1/users/me${path}`;
  const method = init.method ?? "GET";
  const res = await fetch(url, {
    ...init,
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const snippet = text.length > 800 ? `${text.slice(0, 800)}…` : text;
    logInbound("http_error", {
      method,
      path: String(path).slice(0, 240),
      status: res.status,
      body: snippet,
    });
    throw new Error(
      data.error?.message ||
      data.error ||
      `Gmail API ${res.status}: ${text.slice(0, 200)}`
    );
  }
  return data;
}

export async function getGmailAccessToken() {
  const t = loadGoogleTokens();
  if (!t?.refresh_token) return null;
  const r = await refreshAccessToken(t.refresh_token);
  return r.access_token;
}

function headerMap(message) {
  const headers = message.payload?.headers ?? [];
  const map = {};
  for (const h of headers) {
    map[String(h.name).toLowerCase()] = h.value;
  }
  return map;
}

function parseEmailFromFromHeader(fromHeader) {
  if (!fromHeader || typeof fromHeader !== "string") return null;
  const angle = fromHeader.match(/<([^>]+)>/);
  if (angle) return angle[1].trim().toLowerCase();
  const bare = fromHeader.match(
    /([\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,})/
  );
  return bare ? bare[1].trim().toLowerCase() : null;
}

function buildReplyMime({
  mailboxEmail,
  toAddress,
  subject,
  inReplyTo,
  references,
  bodyText,
}) {
  const subj = /^re:/i.test(String(subject ?? "").trim())
    ? String(subject).trim()
    : `Re: ${subject ?? ""}`.trim();
  const mid = String(inReplyTo ?? "").trim();
  const refsHeader = String(references ?? "").trim();
  const lines = [
    `From: ${mailboxEmail}`,
    `To: ${toAddress}`,
    `Subject: ${subj}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset=UTF-8',
    "Content-Transfer-Encoding: 7bit",
  ];
  if (mid) lines.push(`In-Reply-To: ${mid}`);
  if (refsHeader) lines.push(`References: ${refsHeader}`);
  lines.push("");
  lines.push(bodyText);
  return lines.join("\r\n");
}

function toRawBase64Url(mime) {
  return Buffer.from(mime, "utf8").toString("base64url");
}

let pollInFlight = false;

export async function pollGmailInboundOnce() {
  const t0 = Date.now();
  if (!isGoogleOAuthConfigured()) {
    logInbound("poll_skip", { reason: "not_configured" });
    return { ok: false, skipped: true, reason: "not_configured" };
  }
  if (pollInFlight) {
    vLog("poll_skip", { reason: "already_running" });
    return { ok: true, skipped: true, reason: "already_running" };
  }
  pollInFlight = true;
  const result = { ok: true, checked: 0, replied: [] };
  const searchQ = gmailSearchQuery();
  logInbound("poll_start", {
    query: searchQ,
    verbose: inboundVerbose(),
  });
  try {
    const access = await getGmailAccessToken();
    if (!access) {
      result.ok = false;
      result.reason = "no_tokens";
      logInbound("poll_abort", { reason: "no_tokens", hint: "missing .google-tokens.json or refresh_token" });
      return result;
    }
    vLog("token_ok", { ms: Date.now() - t0 });

    const tokens = loadGoogleTokens();
    let mailboxEmail = String(tokens?.email ?? "").toLowerCase().trim();
    if (!mailboxEmail) {
      vLog("mailbox_from_profile");
      const profile = await fetchGmailProfile(access);
      mailboxEmail = String(profile.emailAddress ?? "").toLowerCase().trim();
    }
    if (!mailboxEmail) {
      result.ok = false;
      result.reason = "no_mailbox_email";
      logInbound("poll_abort", { reason: "no_mailbox_email" });
      return result;
    }
    logInbound("mailbox", { email: mailboxEmail });

    const listPath =
      "/messages?q=" + encodeURIComponent(searchQ) + "&maxResults=15";
    vLog("list_request", { path: listPath });
    const list = await gmailFetch(access, listPath);
    const messages = list.messages ?? [];
    result.checked = messages.length;
    logInbound("list_result", {
      resultSizeEstimate: list.resultSizeEstimate,
      messageCount: messages.length,
      ids: messages.map((x) => x.id),
    });
    if (messages.length === 0) {
      logInbound("hint_zero_messages", {
        query: searchQ,
        tip:
          "If mail arrived but is already read, is:unread matches nothing. Try GMAIL_INBOUND_QUERY=newer_than:1d in:inbox or mark the test mail unread.",
      });
    }

    const state = loadState();
    const processed = new Set(state.processedIds);
    vLog("state", {
      processedCount: processed.size,
      lastPollAt: state.lastPollAt,
    });

    for (const m of messages) {
      const id = m.id;
      if (!id) {
        vLog("skip_bad_id", { raw: m });
        continue;
      }
      if (processed.has(id)) {
        vLog("skip_already_processed", { id });
        continue;
      }

      const full = await gmailFetch(access, `/messages/${id}?format=full`);
      const h = headerMap(full);
      const from = h.from ?? "";
      const sender = parseEmailFromFromHeader(from);
      const labelIds = full.labelIds ?? [];
      vLog("message", {
        id,
        threadId: full.threadId,
        labelIds,
        from,
        sender,
        subject: h.subject,
      });

      if (!sender) {
        logInbound("skip_no_sender", { id, from });
        processed.add(id);
        continue;
      }
      if (sender === mailboxEmail) {
        logInbound("skip_self_from", {
          id,
          sender,
          mailboxEmail,
          tip: "From equals mailbox; no auto-reply to avoid loops",
        });
        processed.add(id);
        continue;
      }

      const subject = h.subject ?? "(no subject)";
      const messageId = h["message-id"] ?? "";
      const references = h.references ?? "";
      const threadId = full.threadId;

      const replyMime = buildReplyMime({
        mailboxEmail,
        toAddress: sender,
        subject,
        inReplyTo: messageId,
        references: references
          ? `${references} ${messageId}`.trim()
          : messageId,
        bodyText: gmailAutoReplyText(),
      });

      logInbound("send_attempt", {
        threadId,
        to: sender,
        subject,
      });
      const sendRes = await gmailFetch(access, "/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          raw: toRawBase64Url(replyMime),
        }),
      });
      vLog("send_raw_response", { id: sendRes.id, threadId: sendRes.threadId });

      processed.add(id);
      const at = new Date().toISOString();
      state.lastReplySummary = {
        at,
        to: sender,
        subject,
        messageId: id,
      };

      result.replied.push({
        repliedTo: sender,
        subject,
        threadId,
      });

      logInbound("auto_reply_sent", {
        to: sender,
        threadId,
        gmailMessageId: sendRes.id,
        ms: Date.now() - t0,
      });
    }

    state.processedIds = [...processed];
    state.lastPollAt = new Date().toISOString();
    saveState(state);
    logInbound("poll_done", {
      ms: Date.now() - t0,
      replied: result.replied.length,
    });
  } catch (e) {
    result.ok = false;
    result.error = String(e?.message ?? e);
    logInbound("poll_error", {
      message: result.error,
      stack: e?.stack ? String(e.stack).slice(0, 1200) : undefined,
    });
    console.error("[gmail-inbound] exception:", e);
  } finally {
    pollInFlight = false;
  }
  return result;
}

export function startGmailInboundPoller() {
  if (!isGmailInboundEnabled()) {
    console.log("[gmail-inbound] poller disabled (GMAIL_INBOUND_ENABLED=0)");
    return;
  }
  const ms = gmailPollIntervalMs();
  const run = () => {
    pollGmailInboundOnce().catch((e) => console.error("[gmail-inbound]", e));
  };
  run();
  const t = setInterval(run, ms);
  t.unref?.();
  console.log(
    `[gmail-inbound] poller every ${ms}ms (inbox unread -> auto-reply)`
  );
}

export function gmailInboundStatePath() {
  return STATE_FILE;
}
