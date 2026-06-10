# Invoice to Excel (demo)

PDF invoices → vision extraction → editable grid → **.xlsx** download. **English UI** (employer demos). Portfolio: **Automations → Invoice to Excel**. Product lane: **`/docs-agent`**.

## Run in under ~2 minutes

Prerequisites: **Node 20+**, an **OpenAI API key** with vision-capable model access.

**Windows (PowerShell):**

```powershell
cd demos\invoices_to_excel
copy .env.example .env
notepad .env   # set OPENAI_API_KEY=...
npm install
npm start
```

Open **http://127.0.0.1:3000/** in Chrome, Brave, or Edge.

**Smoke:** `GET http://127.0.0.1:3000/health` should return JSON with `ok` / feature flags.

## Config

All variables are documented in **`.env.example`**. Minimum: **`OPENAI_API_KEY`**. Optional: rate limits, Gmail notify, Railway **`INVOICE_TRUST_PROXY=1`** behind a proxy.

## Agent / lane detail

See **`README.lane.md`** — routes, files, and boundaries vs other demos.
