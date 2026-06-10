const SLACK_TIMEOUT_MS = 15000;

export async function sendSlackWebhook(body) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url || String(url).trim() === "") {
    console.log("[notify] SLACK_WEBHOOK_URL unset; skipping Slack");
    return { ok: true, skipped: true };
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), SLACK_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Slack HTTP ${res.status}: ${text.slice(0, 500)}`);
    }
    return { ok: true, skipped: false };
  } finally {
    clearTimeout(t);
  }
}

export function slackIncomingWebhookBody({
  eventType,
  payload,
  receivedAt,
  jobId,
  idempotencyKey,
}) {
  const lines = [
    `*${eventType}*`,
    `job=\`${jobId}\` idempotency=\`${idempotencyKey}\` received=\`${receivedAt}\``,
    "```",
    JSON.stringify(payload, null, 2),
    "```",
  ];
  return { text: lines.join("\n") };
}

export function notifyEventPlainText({
  eventType,
  payload,
  receivedAt,
  jobId,
  idempotencyKey,
}) {
  const lines = [
    eventType,
    `job=${jobId} idempotency=${idempotencyKey} received=${receivedAt}`,
    JSON.stringify(payload, null, 2),
  ];
  return lines.join("\n");
}
