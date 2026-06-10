import express from "express";
import cors from "cors";
import { nanoid } from "nanoid";
import { z } from "zod";
import { migrate, db } from "./db.js";
import { getIdem, setIdem } from "./idempotency.js";
import { renderSpeedToLeadV1 } from "./templates.js";

migrate();

const IDEM_SCOPE = {
  start_session: "start_session",
  ingest_message: "ingest_message",
  create_crm_lead: "create_crm_lead",
  create_email_draft: "create_email_draft",
} as const;

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const prefix = issue.path.length ? `${issue.path.join(".")}: ` : "";
      return `${prefix}${issue.message}`;
    })
    .join("; ");
}

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));

app.get("/health", (_req, res) => res.json({ ok: true }));

const StartSessionReq = z.object({
  idempotency_key: z.string().optional(),
});

app.post("/start_session", (req, res) => {
  const parsed = StartSessionReq.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: formatZodError(parsed.error) });
  }

  const idem = getIdem(IDEM_SCOPE.start_session, parsed.data.idempotency_key);
  if (idem) return res.json(idem);

  const session_id = `sess_${nanoid(10)}`;
  db.prepare(`INSERT INTO sessions (session_id, created_at) VALUES (?, ?)`).run(
    session_id,
    new Date().toISOString()
  );

  const response = { ok: true as const, session_id, demo_mode: true };
  setIdem(IDEM_SCOPE.start_session, parsed.data.idempotency_key, response);
  res.json(response);
});

const IngestReq = z.object({
  session_id: z.string(),
  raw_text: z.string().min(1),
  source: z.string().default("dm"),
  idempotency_key: z.string().optional(),
});

app.post("/ingest_message", (req, res) => {
  const parsed = IngestReq.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: formatZodError(parsed.error) });
  }

  const idem = getIdem(IDEM_SCOPE.ingest_message, parsed.data.idempotency_key);
  if (idem) return res.json(idem);

  const { session_id, raw_text, source } = parsed.data;
  const sess = db.prepare(`SELECT 1 FROM sessions WHERE session_id = ?`).get(session_id);
  if (!sess) return res.status(404).json({ ok: false, error: "Session not found." });

  const message_id = `msg_${nanoid(10)}`;

  db.prepare(
    `INSERT INTO messages (message_id, session_id, source, raw_text, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(message_id, session_id, source, raw_text, new Date().toISOString());

  const response = {
    ok: true as const,
    session_id,
    message_id,
    next_suggested_action: "create_crm_lead" as const,
  };
  setIdem(IDEM_SCOPE.ingest_message, parsed.data.idempotency_key, response);
  res.json(response);
});

const nullableStr = z.union([z.string(), z.null()]);
const LeadFields = z.object({
  full_name: nullableStr.optional().default(null),
  company: nullableStr.optional().default(null),
  email: z.union([z.string().email(), z.null()]).optional().default(null),
  need_summary: z.string().min(1),
  urgency: z.enum(["low", "medium", "high"]),
  next_step: z.enum(["call", "demo", "info", "pricing", "support"]),
});

const CreateLeadReq = z.object({
  session_id: z.string(),
  message_id: z.string().optional(),
  lead_fields: LeadFields,
  idempotency_key: z.string().optional(),
});

app.post("/create_crm_lead", (req, res) => {
  const parsed = CreateLeadReq.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: formatZodError(parsed.error) });
  }

  const idem = getIdem(IDEM_SCOPE.create_crm_lead, parsed.data.idempotency_key);
  if (idem) return res.json(idem);

  const { session_id, message_id, lead_fields } = parsed.data;
  const sess = db.prepare(`SELECT 1 FROM sessions WHERE session_id = ?`).get(session_id);
  if (!sess) return res.status(404).json({ ok: false, error: "Session not found." });

  if (message_id) {
    const msg = db
      .prepare(`SELECT 1 FROM messages WHERE message_id = ? AND session_id = ?`)
      .get(message_id, session_id);
    if (!msg) {
      return res.status(404).json({ ok: false, error: "Message not found for session." });
    }
  }

  const lead_id = `lead_${nanoid(10)}`;

  db.prepare(
    `INSERT INTO leads
    (lead_id, session_id, message_id, full_name, company, email, need_summary, urgency, next_step, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    lead_id,
    session_id,
    message_id ?? null,
    lead_fields.full_name ?? null,
    lead_fields.company ?? null,
    lead_fields.email ?? null,
    lead_fields.need_summary,
    lead_fields.urgency,
    lead_fields.next_step,
    "New",
    new Date().toISOString()
  );

  const response = {
    ok: true as const,
    session_id,
    lead_id,
    next_suggested_action: "create_email_draft" as const,
  };
  setIdem(IDEM_SCOPE.create_crm_lead, parsed.data.idempotency_key, response);
  res.json(response);
});

const CreateDraftReq = z.object({
  session_id: z.string(),
  lead_id: z.string(),
  template_id: z.string().default("speed_to_lead_v1"),
  idempotency_key: z.string().optional(),
});

type LeadRow = {
  full_name: string | null;
  company: string | null;
  email: string | null;
  need_summary: string;
  urgency: string;
  next_step: string;
};

app.post("/create_email_draft", (req, res) => {
  const parsed = CreateDraftReq.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: formatZodError(parsed.error) });
  }

  const idem = getIdem(IDEM_SCOPE.create_email_draft, parsed.data.idempotency_key);
  if (idem) return res.json(idem);

  const { session_id, lead_id, template_id } = parsed.data;
  if (template_id !== "speed_to_lead_v1") {
    return res.status(400).json({ ok: false, error: "Unknown template_id." });
  }

  const lead = db
    .prepare(`SELECT * FROM leads WHERE lead_id = ? AND session_id = ?`)
    .get(lead_id, session_id) as LeadRow | undefined;
  if (!lead) return res.status(404).json({ ok: false, error: "Lead not found for session." });

  const rendered = renderSpeedToLeadV1({
    full_name: lead.full_name,
    company: lead.company,
    email: lead.email,
    need_summary: lead.need_summary,
    urgency: lead.urgency as "low" | "medium" | "high",
    next_step: lead.next_step as "call" | "demo" | "info" | "pricing" | "support",
  });

  const draft_id = `draft_${nanoid(10)}`;
  db.prepare(
    `INSERT INTO drafts (draft_id, session_id, lead_id, subject, body, template_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(draft_id, session_id, lead_id, rendered.subject, rendered.body, template_id, new Date().toISOString());

  const response = {
    ok: true as const,
    session_id,
    lead_id,
    draft_id,
    subject: rendered.subject,
    body: rendered.body,
  };
  setIdem(IDEM_SCOPE.create_email_draft, parsed.data.idempotency_key, response);
  res.json(response);
});

app.get("/session/:session_id", (req, res) => {
  const session_id = req.params.session_id;
  const session = db.prepare(`SELECT * FROM sessions WHERE session_id = ?`).get(session_id);
  if (!session) return res.status(404).json({ ok: false, error: "Session not found." });

  const messages = db
    .prepare(`SELECT * FROM messages WHERE session_id = ? ORDER BY created_at DESC`)
    .all(session_id);
  const leads = db.prepare(`SELECT * FROM leads WHERE session_id = ? ORDER BY created_at DESC`).all(session_id);
  const drafts = db.prepare(`SELECT * FROM drafts WHERE session_id = ? ORDER BY created_at DESC`).all(session_id);

  res.json({ ok: true, session, messages, leads, drafts });
});

const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || "127.0.0.1";
app.listen(port, host, () => {
  console.log(`Speed-to-lead v2 API listening on http://${host}:${port}`);
});
