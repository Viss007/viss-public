# Speed to lead — Gmail OAuth frozen

**Frozen:** 2026-06-08 · **Viss:** park Gmail OAuth; fix Google Cloud app later.

**Scope:** Gmail **Connect** + inbound poll on **`Public/automations/speed_to_lead`** only. **Webhook engine** (`POST /lead`, Slack, SMS) stays live on **3333** `/automations/speed-to-lead/*`.

**Runtime:** `GMAIL_INBOUND_ENABLED=0` in **`.env`** — no poll errors while OAuth is broken.

**Thaw:** **`unfreeze speed-to-lead gmail`** — then fix GCP (Web client, redirect `http://127.0.0.1:3333/automations/speed-to-lead/auth/google/callback`, Gmail API, scopes `gmail.readonly` + `gmail.send`, test users), reconnect at `/automations/speed-to-lead/auth/google`, set `GMAIL_INBOUND_ENABLED=1`, prove `auth/google/test`.

**Agents:** read/orient only on Gmail OAuth paths unless thaw. Do not chase OAuth in GCP unless Viss unfreezes.
