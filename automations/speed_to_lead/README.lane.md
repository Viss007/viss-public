# Lane contract (agent-readable copy)

When a matching file exists, Cursor may load **`.cursor/rules/web_*.mdc`** for globs. Paths below are relative to the workspace root.

---

## 1. Speed to lead (`vissai_platform/product_demos/speed_lead/`)

**Hard scope:** Product code, contracts, and simulation for this track live under **`vissai_platform/product_demos/speed_lead/`**. Do **not** autostart the **dimensional memory** operator stack, tunnels, or other long-lived **operator** sidecars when Viss only scoped docs or design — see **Process boundary** below.

### What this lane is for

- **North-star buyer (product story):** **Solo SMB** — trades, shops, consultants — who use a **business email** (anchor: **Gmail / Google Workspace**) and text. **Clients** contact **them**; they want **clients** to get **fast, useful replies** and **calendar** to fill while they are **not** on the phone (under a sink, driving, on a job). **True speed to lead** = the **customer** gets the first response — not merely an internal Slack ping the owner still has to act on.
- **Do not sell the repo as “dev webhooks only.”** The **engine** underneath is HTTP ingress → queue → worker → notify; the **roadmap product** is **Connect Gmail** (OAuth), **inbound** client mail, qualify/reply/book — **in-browser setup**, not “paste twelve Railway variables.” **`vissai_platform/product_demos/speed_lead/public/`** copy should stay **honest**: what ships today vs what is **roadmap**.
- **Endgame (technical):** Reliable **server-side** automation — queues, workers, idempotency, optional adapters — so buyers do **not** need the local operator stack (memory/embed sidecars are operator-only, not the public product).
- **Problem statement (business):** **`docs/5_AI_workflows.md`** — § **1. Speed to lead** (capture → qualify → route → **acknowledgment to the prospect** → internal handoff). Internal notify is a **side channel**, not the definition of “speed to lead” for the plumber ICP.
- **Along the way:** **Simulate** realistic **business traffic** (rate, burstiness, payload diversity, idempotency stress) using a **chosen vertical/load profile**. Use **synthetic** company names in tests; **do not** impersonate real brands (**workflow-level** parity only — same stance as **`/portfolio`** lead strategy on IP).

#### Product gate — v1 **OAuth / Connect-first** (sticky)

**Operator decision:** The **first** shippable product surface for this track is **Connect-style onboarding only** — the buyer **authorizes in your app** (OAuth where the platform provides it, or vendor **embedded signup** / hosted flows that **feel** like “Sign in with …” to the buyer). **If a channel cannot be delivered that way for v1, skip it** as a **customer-facing** module; do not anchor the sale on per-tenant API keys, “open your own CPaaS account,” or host-dashboard secret pastes.

- **Counts as “full OAuth product” for the buyer:** Google **Connect Gmail**; Slack **OAuth app** (when productized); Meta **WhatsApp Embedded Signup** / Business Platform flows (not the same protocol as Google OAuth, same **UX bar**: no raw keys for the SMB).
- **Does not count for v1 buyer story:** Twilio/Nexmo **BYOK** SMS/voice with **`TWILIO_*` in `.env` per customer**, “you pay the carrier,” or **Slack Incoming Webhook** URL as the **primary** “you are done” setup — fine for **engine / integrator** demos, **not** the **solo ICP** headline.
- **SMS / native voice:** Treat as **deferred** or **operator-only** until there is a **hosted Connect path** (or an explicit **power tier**). Do **not** block **portfolio** demos on full universal product; **Railway deploy** is **last** after the demo story is honest.

---

### Canonical workspace

| Role | Path |
|------|------|
| **Product notes, contracts, future server code** for this track | **`vissai_platform/product_demos/speed_lead/`** — start with **`vissai_platform/product_demos/speed_lead/README.md`** |
| **Public CV + try-me demos** (static hub, thin demo backends) | **`portfolio/`** — **`/portfolio`** |
| **Five workflows doc** (context for #1) | **`docs/5_AI_workflows.md`** |

**Agent rule:** Implementation files for the standalone service grow under **`vissai_platform/product_demos/speed_lead/`** (or a named subfolder Viss chooses) unless Viss explicitly scopes **`portfolio/`** or another tree.

---

### Product vision (build target — client-first, self-serve)

**Two layers — do not conflate them:**

| Layer | What it is | Buyer |
|--------|------------|--------|
| **Roadmap product** | **Connect inbox** (Gmail first), read **inbound** client messages, fast **client-facing** reply + booking + calendar. **Secrets in your app** (encrypted), **no** per-customer Railway env for twelve keys. | **Solo business** — plumber-style; no dev team. |
| **Engine + dev inbox (today in repo)** | **A)** **HTTP POST** (`POST /lead`, etc.) → **queue** → worker → **Slack** / **SMTP operator copy** / **SMS** (Twilio or stub). **B)** **Gmail:** OAuth (**`/auth/google`** …), token storage, **inbound poll**, **auto-reply** (dev — see **`vissai_platform/product_demos/speed_lead/README.md`**). **Not** production multi-tenant inbox product yet; **portfolio** demo stance, full **universal** product **parked** until ICP fit. | **Integrators** + operators today; **roadmap** solo ICP when Connect + persistence ships. |

#### The buyer journey (sticky — one beat)

This is the **whole idea** in plain language; agents should not drift back to “dev webhooks” as the headline.

1. **They get a website** — a **hosted** URL (e.g. Railway) that runs **their** deployment: **their** engine process, **their** product surface. (Multi-tenant SaaS is a **later** packaging choice; **per-customer deploy** still matches this story.)
2. **They open that URL** — **one** interface whose job is **setup**: connect the channels that matter (**Gmail first** on the roadmap, then Slack, SMS, etc.). **Not** “here are twelve environment variables.”
3. **They log in to their accounts** — **OAuth / Connect** **inside your app**; refresh tokens and secrets live in **your** backend (encrypted), **not** copy-pasted into the host dashboard per buyer.
4. **The system does the work** — **roadmap:** read inbound client mail, reply fast, book, fill calendar; **today:** engine + queue + operator alerts + **honest** UI about what is shipped vs coming.

**Host (Railway) role:** run the **container**, attach **Redis**/DB, set **platform** env once (**`REDIS_URL`**, **`SESSION_SECRET`**, **`ENCRYPTION_KEY`**, …). **Not** the place where each SMB configures Slack, Gmail, or Twilio for day-to-day use.

**What we are building toward (hosted, e.g. Railway):** one **product URL** where the buyer runs **in-browser** setup — **Connect Gmail**, optional Slack/SMS, rules — **default path** is **not** “copy webhook URLs into Zapier” unless the buyer is **integration-heavy**. Webhooks remain **universal glue** for forms, CRM, Zapier/Make, ads — **additive**, not the **primary** story for the solo-ICP.

- **OAuth “Connect Gmail / …”** — tokens in **your** DB per tenant; **their** mailbox, not a shared blast pipe. This is the **product** unlock for the plumber story.
- **HTTP contract** (`POST /lead`, etc.) — **any** source can POST JSON; **reliable** ingress for teams that already emit events; **not** a substitute for inbox automation in copy.
- **Self-serve:** plain-language UI; **Redis/BullMQ** stay **operator/hosting** concerns until fully abstracted in the product layer.
- **Engine reliability:** validate → **queue** → **worker** → notify, **idempotency**, retries, **`/health`** / **`/metrics`** — **opaque** to the end buyer when the product layer wraps it.

#### Hosting model — Railway is **host**, not a second settings screen

**Yes, one Railway service can run backend + web UI:** same Node process (e.g. **Express**) serves **API routes** and **static / SPA** files (`GET /` → `public/` or built assets). Buyers see **one** HTTPS origin — no separate “frontend host” unless you add it later for scale. Railway’s job is **run the container** and attach **Redis** (and **Postgres**/etc. when you add a DB).

**Do not productize “configure in Railway dashboard + configure in our app.”** Per-tenant secrets (Slack webhooks, Twilio, OAuth refresh tokens, “which Gmail inbox”) belong in **server-side storage** (encrypted at rest), surfaced only through **your** web UI and APIs — not duplicated as Railway env vars per customer.

**Railway env (operator / platform only):** e.g. **`PORT`**, **`REDIS_URL`**, **`DATABASE_URL`**, **`SESSION_SECRET`**, **`ENCRYPTION_KEY`** — infrastructure **you** (or one deploy pipeline) set once. Not a place where each SMB pastes twelve keys.

**Default onboarding — “monkey could do it”:** customer **never opens Railway**. They pay, visit **your** product URL, **connect Gmail** (and channels as needed) from **your** UI — **not** env-var SMTP for the primary story. **Webhook URL** copy field stays for **integrations** (forms, CRM, Zapier), **not** as the headline for the solo-business ICP.

**Optional “bring your own Railway / own deploy”:** reserved for buyers who need **their** OAuth redirect domains (Google, GitHub), **their** corporate email, or self-hosting — **power path**, not the default story.

**Implementation gap vs today:** repo **`vissai_platform/product_demos/speed_lead/`** is **engine-first** (Express + BullMQ + env) with a **dev** Gmail OAuth + poll + auto-reply path. **`public/index.html`** states the **product narrative** (client-first, INBOX vs operator channels). The **product layer** still to add for **ship** is **durable tenant storage**, **encrypted secrets**, **admin UI**, **multi-tenant** config, and **Graph** (or other inboxes) as needed — **zero** requirement for end users to touch the host’s dashboard. See **Hosted deploy (e.g. Railway)** below.

---

### Current setup (local receiver — implementation)

Authoritative detail and **pwsh** examples: **`vissai_platform/product_demos/speed_lead/README.md`**. Summary for agents:

| Piece | Role |
|--------|------|
| **`server.mjs`** | **Express** ingress: **`POST /lead`**, **`POST /call`**, **`POST /appointment`** (body = one object or array). **Ajv** validates against **`schema/v1/*.schema.json`**. **`GET /health`**, **`GET /metrics`**, **`POST /sms/test`**. **Gmail OAuth:** **`GET /auth/google`**, **`GET /auth/google/callback`**, **`GET /auth/google/test`**, **`GET /auth/google/poll-once`**; starts **`startGmailInboundPoller()`** when enabled. Loads **`dotenv`** first. Default **`PORT`** **3001** (invoices demo owns **3000**; **`$env:PORT`** overrides **`.env`** in **pwsh**). **`startWorker()`** runs in-process. |
| **`queue.mjs`** | **BullMQ** queue **`speed-lead-events`**; **ioredis**; **`getRedisConnection()`** for BullMQ; **`getRedisIngressConnection()`** for idempotency (bounded **`commandTimeout`**, **`REDIS_INGRESS_TIMEOUT_MS`** default **2000**). Env **`REDIS_URL`** or **`REDIS_HOST`** / **`REDIS_PORT`**. |
| **`worker.mjs`** | **Worker**: **2s** delay, then **Slack** (if **`SLACK_WEBHOOK_URL`** set) via **`notify.mjs`**, then optional **SMTP email copy** of the event via **`email.mjs`** (operator alert — **not** inbound Gmail automation), then optional **SMS** via **`sms.mjs`**; logs **`notified:`** + JSON (**`jobId`**); **`attempts: 2`**, fixed backoff **1s**. Records **avg** job duration for **`GET /metrics`**. Idempotency: skip duplicate notify if key already **processed**; mark **processed** after successful path; lock released on **final** BullMQ failure. |
| **`notify.mjs`** | **`sendSlackWebhook`** — Incoming Webhook **`POST`**, **15s** timeout; **`slackIncomingWebhookBody`** / **`notifyEventPlainText`** format event + payload. |
| **`email.mjs`** | Optional **nodemailer** SMTP: **`NOTIFY_EMAIL_TO`** + **`SMTP_*`** — sends **operator** a copy of the lead event. **`GET /health`** exposes **`notify.email_configured`**. Distinct from **roadmap** “read client Gmail inbox.” |
| **`sms.mjs`** | **Twilio** when **`TWILIO_*`** + **`TWILIO_FROM`** set; else **stub** logs **`[sms:stub]`**; **`SMS_FORCE_STUB`**, **`SMS_STUB_ENABLED`**. Product stance: **pipe** — buyer supplies SMS provider (Twilio/Nexmo/local modem); see file header. |
| **`metrics.mjs`** | In-process rolling **avg** ms for successful worker runs; **`GET /metrics`** also returns BullMQ **`getJobCounts()`** (**`completed`**, **`failed`**, **`pending`**). |
| **`idempotency.mjs`** | **Ingress** Redis: **`withIngressTimeout`** on **GET/SET**; **`tryIngressLock`** **false** = dedupe (not outage). Queue **`queue.add`** wrapped with same budget; on failure after lock, **`releaseIngressLock`**. **503** when Redis/queue unavailable or timeout — not for normal dedupe. |
| **`scripts/`** | **`stress-leads.mjs`**, **`stress-dedupe.mjs`**, **`queue-snapshot.mjs`** — **`npm run stress:leads`**, **`stress:dedupe`**, **`queue:snapshot`**. |
| **`keys.mjs`** | Resolves **`idempotency_key`** from body or **`Idempotency-Key`** header; strips idempotency fields from stored **`payload`**. |
| **`worker-standalone.mjs`** | Optional second process: **`npm run worker`** (same queue/env; loads **`dotenv`**). |
| **`check-redis.mjs`** | **PING** + **`INFO`** version check; exits **1** if Redis protocol is below **5.0** (BullMQ requirement). Used by **`setup.ps1`**. |
| **Enqueue shape** | After validation: **`{ eventType, payload, receivedAt, idempotencyKey }`** per row. Queue errors → **503** **`queue unavailable`**. Response includes **`accepted`** / **`deduplicated`** counts. |
| **Secrets / env** | **`vissai_platform/product_demos/speed_lead/.env`** (gitignored) — copy from **`vissai_platform/product_demos/speed_lead/.env.example`**. Keys: **`PORT`**, **`REDIS_URL`** *or* **`REDIS_HOST`** + **`REDIS_PORT`**, **`REDIS_INGRESS_TIMEOUT_MS`** (optional), **`SLACK_WEBHOOK_URL`**, optional **SMTP** (**`NOTIFY_EMAIL_TO`**, **`SMTP_HOST`**, …), Twilio / SMS toggles per **`.env.example`**. **`npm start`** from **`vissai_platform/product_demos/speed_lead/`** loads **`.env`** via **`dotenv`**. |

---

### Current progress (product — operator state)

**ingress → Redis queue → worker → notify** is implemented and **end-to-end verified** (e.g. lead POST → Slack; optional SMTP **operator** copy and SMS per env). **Gmail:** **OAuth + inbound poll + auto-reply** is implemented in **`vissai_platform/product_demos/speed_lead/`** (dev — local tokens/state files; see **`vissai_platform/product_demos/speed_lead/README.md`**), **E2E verified** (unread query default **`is:unread`**). **Positioning:** suitable **portfolio demo**; **full** universal SMB product **parked** — **v1 module rule:** **OAuth / Connect-first** only (**Product gate** above); SMS/voice **BYOK** stays **engine/operator**, not the solo **headline**.

| Area | Status |
|------|--------|
| **HTTP + schemas** | **Ajv** v1 **`lead.submitted`**, **`call.completed`**, **`appointment.requested`**; optional **`idempotency_key`** (UUID) on all. |
| **Queue** | **BullMQ** **`speed-lead-events`**; requires **Redis ≥ 5**. |
| **Notify** | **Slack** Incoming Webhook (**`SLACK_WEBHOOK_URL`**); optional **SMTP** operator **copy** (**`email.mjs`**); optional **SMS** (Twilio or stub). Slack skipped + logged if unset; email/SMS best-effort per env. |
| **Gmail (dev product path)** | **Google OAuth** + **`gmail_inbound.mjs`** poller + idempotent auto-reply; **`GET /health`** exposes Gmail fields. **Not** encrypted multi-tenant DB yet — **roadmap** persistence. |
| **Idempotency** | **Redis** lock + **processed** flag; ingress **timeouts** (no infinite hang when Redis down); dedupe in API; safe under BullMQ retry (no double notify after success). Gmail inbound uses separate **processed message** state file. |
| **Observability** | **`GET /metrics`** — queue counts + **`avgProcessMs`** (in-process). |
| **Load / QA** | Stress scripts (**200** leads, dedupe race, queue snapshot); see **`package.json`** scripts. |
| **Local config** | **`dotenv`** in **`server.mjs`**, **`worker-standalone.mjs`**, **`check-redis.mjs`**; **`.gitignore`** includes **`vissai_platform/product_demos/speed_lead/.env`**, **`.google-tokens.json`**, **`.gmail-inbound-state.json`**. |

**Ops — port 3001:** Default listen is **3001** so **`product_demos/invoices_to_excel`** can keep **3000**. Symptom: **`EADDRINUSE`** on **3001**, or **`/health`** on the wrong port — you are hitting **invoices** or a stale **`node`**. **Fix:** `netstat -ano` for **`:3001`**, **`taskkill`** stale PID, then **`cd product_demos\speed_lead`** and **`start-backend.bat`** (sets **`PORT=3001`**) or **`npm start`**. **Google OAuth:** redirect URI must match **`http://127.0.0.1:3001/auth/google/callback`** in Cloud Console.

**Observability:** IDE **background** terminals sometimes **omit** worker **`console.log`** lines even when jobs **complete**; trust **`GET /health`**, BullMQ **completed** counts, and Slack delivery — not only the terminal tail.

| `eventType` | Route | Schema file |
|-------------|--------|----------------|
| `lead.submitted` | **`POST /lead`** | **`lead.submitted.schema.json`** |
| `call.completed` | **`POST /call`** | **`call.completed.schema.json`** |
| `appointment.requested` | **`POST /appointment`** | **`appointment.requested.schema.json`** |

**Redis:** **BullMQ** needs **Redis ≥ 5**. **Docker** is not the default path in-repo; use **native Windows**, **WSL2**, or **hosted** Redis — see **`vissai_platform/product_demos/speed_lead/README.md`**.

**Windows — Memurai Developer:** **`winget install --id Memurai.MemuraiDeveloper -e`** (package installs Redis-compatible server on **6379**). A legacy **Redis 3.x** Windows **service** often holds **6379** first — **Memurai install fails** until that service is **stopped**; set it **Manual** if it should not fight Memurai on reboot. **`install-memurai.ps1`** automates: stop **`Redis`** service → **winget** → **`setup.ps1`**.

**Setup (pwsh):** **`vissai_platform/product_demos/speed_lead/setup.ps1`** — **`npm install`** + **`node check-redis.mjs`**. From repo root: **`pwsh -NoProfile -ExecutionPolicy Bypass -File .\demos\speed_lead\setup.ps1`**. From **`vissai_platform/product_demos/speed_lead/`**: **`npm run setup`**, **`npm run install-memurai`**.

**Fixtures:** **`npm run generate`** → **`fixtures/*.json`** (Faker, seed **`20260401`**). **Shell:** use **`pwsh`**; prefer **`curl.exe`** over **`curl`** on Windows (alias trap); **`Invoke-RestMethod`** for single-object POSTs in examples.

---

### Process boundary (sticky)

- **Do not** auto-start **dimensional memory**, RCP, tunnels, or other **operator** stacks as a “helpful extra” when Viss only asked for **`vissai_platform/product_demos/speed_lead/`** docs or design — same spirit as **`/portfolio`** **Process boundary**.
- **Do** start or long-run **only** what Viss **explicitly** asks in the same message (e.g. local Node/Python server for webhook tests, load generator).

---

### Integration shape (directional — not a fixed contract yet)

- **Inbound A (roadmap — ICP):** **Mailbox** (Gmail API / IMAP / Microsoft Graph) → **new client message** → queue → **draft/send client reply** + **calendar** + optional internal notify. **Product** secrets in DB + OAuth.
- **Inbound B (engine today):** **`POST`** webhook (`/lead`, `/call`, `/appointment`) or vendor adapter → normalize → queue → worker → **operator** notify (Slack, SMTP copy, SMS).
- **Outbound:** Client-facing **reply** (roadmap) vs **operator** Slack/SMS/SMTP alert (today). Keep **tenant** secrets in **app storage** (roadmap); **env** is **operator/deploy** until then.
- **Drop-in:** Optional small SDK or reverse-proxy snippet **only** when needed — **one** clear HTTP contract for **B**; **A** is a **separate** lane in architecture and copy.

---

### Hosted deploy (e.g. Railway) — operator notes

- **Contract is HTTP:** customers need **one public HTTPS URL** for webhooks (**`POST /lead`**, etc.) and a **stable** hostname (custom domain) so CRM/Zapier configs do not break on redeploys.
- **Redis is mandatory** for BullMQ + idempotency — “set env and go” must include **`REDIS_URL`** (or **`REDIS_HOST`** + **`REDIS_PORT`**) via Railway **Redis** plugin, **Upstash**, or other **Redis ≥ 5** — not only Slack/Twilio.
- **Process model:** **`server.mjs`** runs **API + in-process worker** today; scale-out path is **two services** (HTTP vs **`worker-standalone.mjs`**) when needed.
- **Railway CLI** is valid for **env**, **deploy**, **logs** — document a minimal command list for power users; dashboard-only is fine for others.

---

### Competition landscape (high level — not a price sheet)

**Product stance:** **`vissai_platform/product_demos/speed_lead/`** is **engine-shaped** with a **dev** Gmail Connect + inbound path (see **Current progress**). The **positioned** product moves toward **client-first response** + **inbox + calendar** (competes with **intent** of Calldrip/Podium-class “speed-to-lead” stories, not their full CRM stack). **Honest copy:** engine + **dev** inbox automation exists; **production** inbox product (tenant DB, encryption, deploy) is still **roadmap**. **v1 gate:** **OAuth / Connect-first** modules only (**Product gate**).

| Lane | Examples (illustrative) | Contrast |
|------|-------------------------|----------|
| **All-in-one speed-to-lead / response** | Calldrip, Kixie, Podium | Bundled dialer/text + CRM story; higher touch. |
| **Scheduling / RevOps routing** | Chili Piper, LeadMonk, Inleado, Lantern, Synapsa | Meetings + rules; different buyer. |
| **Automation glue** | Zapier Lead Router, Make, n8n, bridge tools | Cheap to start; different reliability/ops story at volume. |

Validate positioning with **one ICP** and **buyer interviews** — categories blur in sales copy.

---

### Pricing guidance (rough bands — not legal or tax advice)

- **SMB monthly** packaging often lands **~$99–$499/mo** for always-on routing + alerts + support; many products anchor **~$199–$299/mo** for a credible “serious tool” tier.
- **Per-lead / usage** (e.g. **$0.02–$0.25** per event) works when buyers think in unit economics — requires metering and caps.
- **Implementation + retainer** (**~$2k–$15k** setup + **$300–$2k/mo**) fits if you integrate their stack, not just ship a binary.
- **Anchor on outcome:** one extra closed job / month usually **swamps** infra cost — price against **revenue protected**, not AWS bill alone.

---

### Related commands

| Slash | When |
|--------|------|
| **`/portfolio`** | Public site, demo bar, Railway, **`portfolio/`** hub |
| **8811 recycle** | **`web_dimensional_retrieval/8811_reload.md`** — when long-running services or MCP wiring change (not routine static work in **`vissai_platform/product_demos/speed_lead/`**). |

**Precedence (§ 1):** same routing chain as workspace **AGENTS**; product detail for speed-to-lead lives in **this §1 lane** (enter via **`/web_development`**).

---

### Agent discipline

1. **Ground in repo:** Read **`vissai_platform/product_demos/speed_lead/README.md`** (stub routes, **BullMQ**, **pwsh** setup, **Memurai**/Redis) and **`docs/5_AI_workflows.md`** before proposing contracts or simulation plans.
2. **Pick simulation profile deliberately** — vertical, channels (form/call/email), expected QPS, SLO targets; document in **`vissai_platform/product_demos/speed_lead/README.md`**.
3. **Separate demo vs product** — Portfolio demo proves UX; **`vissai_platform/product_demos/speed_lead/`** proves **integration + scale** path (ingress → queue → worker is live; **inbox** is **roadmap**).
4. **Product vision** — **Client-first** (prospect gets the fast response). **Engine** = webhook + notify; **inbox** = **Connect Gmail** (dev path in repo) → **roadmap** = persistence + multi-tenant + booking. **UI copy** in **`vissai_platform/product_demos/speed_lead/public/`** must stay **honest** (demo vs production-ready). **v1 rule:** **OAuth / Connect-first** — skip buyer-facing channels that are key-per-customer unless **power tier**.
5. **When scoping features** — ask: does this help the **solo ICP** or only **integrators**? Prefer **honest** labeling (operator alert vs client reply).
6. **Buyer journey** — if copy or UX sounds like **“configure Railway / paste env”** as the **main** path, rewrite toward **open URL → connect accounts in app → system runs**. The **Implementation gap** section is allowed to be technical; the **buyer-facing** story is not.

---
