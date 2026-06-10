# Lane contract (agent-readable copy)

When a matching file exists, Cursor may load **`.cursor/rules/web_*.mdc`** for globs. Paths below are relative to the workspace root.

---

## 2. PDF invoices → Excel (`Public/agents/docs_agent/`)

**Hard scope:** Implementation, env, and docs live under **`Public/agents/docs_agent/`** only. Do **not** treat this demo as **`vissai_platform/product_demos/speed_lead/`**, **`Desktop\Public (hire-me; /public) `**, or **`web_dimensional_retrieval/`** unless Viss explicitly crosses lanes.

### What this demo is

- **User story:** Upload one or more **PDF invoices** (LT-style VAT fields) → browser renders pages with **pdf.js** → PNG base64 → **`POST /api/process`** → **OpenAI vision** (structured extraction) → editable table → **`POST /api/export`** → downloadable **`.xlsx`** (ExcelJS).
- **PDF rasterization is client-side** — no GraphicsMagick/Ghostscript on the server; server needs **Node**, **Express**, **OpenAI SDK**, **ExcelJS** only.
- **Optional:** Google OAuth (**`/auth/google`**) + stored refresh token for **Gmail notify** (visit / process limits — see **`lib/gmailNotify.mjs`**). Same OAuth helpers pattern as other demos; tokens are **server-side**, not in `public/`.

### Cursor Simple Browser / embedded preview vs a real browser

**pdf.js** in this demo loads **ES modules**, a **worker**, and (for many PDFs) **same-origin** fetches for **cmaps** and **standard fonts** (see **`server.mjs`** **`/pdfjs`** and **`/pdfjs-assets/...`**). The **Cursor-integrated** Simple Browser / automation preview is **not** a reliable stand-in for **Chromium / Brave / Edge** here: processing can appear to hang (no **`POST /api/process`** in server logs) even when the same URL works in an external browser.

**Agent / operator stance:** When debugging “upload works but **Apdoroti** never finishes” or missing **`POST /api/process`**, treat **Brave (or Chrome) on `http://127.0.0.1:<PORT>/`** as the verification path; do not conclude the app is broken from embedded-browser behavior alone.

---

### Canonical paths

| Role | Path |
|------|------|
| Entry, routes, limits | **`Public/agents/docs_agent/server.mjs`** |
| Browser UI + pdf.js + API calls | **`Public/agents/docs_agent/public/app.js`**, **`public/index.html`** |
| Vision prompt + OpenAI | **`Public/agents/docs_agent/lib/visionExtract.mjs`** |
| Excel build | **`Public/agents/docs_agent/lib/excelExport.mjs`** |
| Rate limits (demo) | **`Public/agents/docs_agent/lib/demoRateLimit.mjs`** |
| Gmail / visit notify | **`Public/agents/docs_agent/lib/gmailNotify.mjs`** |
| Google OAuth | **`Public/agents/docs_agent/lib/google_oauth.mjs`** |
| Operator logging | **`Public/agents/docs_agent/lib/processLogger.mjs`** |
| Setup + env table | **`Public/agents/docs_agent/README.md`**, **`.env.example`** |

---

### HTTP surface (this service)

| Method | Path | Role |
|--------|------|------|
| `GET` | `/` | Static SPA (`public/`) |
| `GET` | `/health` | Liveness + feature flags (e.g. vision, Gmail configured) — **public** |
| `GET` | `/api/config` | `maxFiles`, `maxPagesPerFile`, body limit, demo cap — **public** |
| `POST` | `/api/process` | JSON `{ files: [{ name, pages: [base64 PNG...] }] }` → extracted rows |
| `POST` | `/api/export` | Table JSON → `.xlsx` buffer |
| `GET` | `/auth/google`, `/auth/google/callback` | OAuth when `GOOGLE_*` env set |

**Naming note:** `requireApiKey` in **`server.mjs`** only checks that **`OPENAI_API_KEY`** exists on the server — the browser does **not** send an API key.

---

### Configuration (env)

Authoritative list: **`README.md`** and **`.env.example`**. Highlights:

| Variable | Role |
|----------|------|
| **`OPENAI_API_KEY`** | Required for `/api/process` |
| **`OPENAI_VISION_MODEL`**, **`OPENAI_VISION_MAX_TOKENS`** | Vision call tuning |
| **`MAX_FILES`**, **`INVOICE_MAX_PAGES`**, **`JSON_BODY_LIMIT_MB`** | Upload / payload bounds |
| **`INVOICE_DEMO_MAX_PROCESSES_PER_IP`** | Demo rate limit per IP (`0` = off) |
| **`INVOICE_TRUST_PROXY`** | `1` behind Railway/reverse proxy for correct client IP |
| **`GOOGLE_*`**, **`GOOGLE_TOKENS_JSON`** / token file | OAuth + Gmail notify (optional) |
| **`INVOICE_NOTIFY_EMAIL`**, **`INVOICE_NOTIFY_VISIT`** | Notify hooks |

---

### Railway / hosting

- **Root directory:** `Public/agents/docs_agent` (monorepo).
- **`PORT`** from platform; **`OPENAI_API_KEY`** in Railway variables.
- **`Dockerfile`** in demo folder (Node 20 Alpine) or Nixpacks — see **`README.md`**.

---

### When working on this demo

1. **Read** **`Public/agents/docs_agent/README.md`** and the files you will change (**`server.mjs`**, **`public/app.js`**, **`lib/*`**).
2. **Verify** routes and env against **`server.mjs`** — do not assume from memory.
3. **Stay in folder** unless the task explicitly includes another product path.

---

### Split rule (invoices demo vs neighbors)

| Topic | Use |
|--------|-----|
| This invoice PDF → Excel app | **§ 2** invoice lane · **`Public/agents/docs_agent/`** |
| Speed-to-lead **product** | **§ 1** speed-lead lane · **`vissai_platform/product_demos/speed_lead/`** |
| Public CV + static demo hub | **`/portfolio`** |

---
