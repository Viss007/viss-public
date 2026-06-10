# Speed-to-Lead v2 (clean mock)

Fresh workspace for the Custom GPT Actions demo: **Express + SQLite** API and **Vite + React** UI. Same HTTP contract as **`openapi.yaml`** in this folder.

## Setup

On Windows behind HTTPS inspection, use **`agent_tools/scripts/npm-ca.cmd`** (Node **22+**) so npm trusts the **Windows certificate store** (`NODE_OPTIONS=--use-system-ca`). Easiest: double‑click **`install-build.bat`** in this folder (runs install + production build).

Manual (from this folder):

```bash
..\..\..\..\..\..\agent_tools\scripts\npm-ca.cmd install
..\..\..\..\..\..\agent_tools\scripts\npm-ca.cmd run build
```

If you still see TLS errors, your Node build may not support `--use-system-ca` on Windows yet — use **`NODE_EXTRA_CA_CERTS`** with your IT PEM, same as any Node project.

## Run

```bash
..\..\..\..\..\..\agent_tools\scripts\npm-ca.cmd run dev
```

- API: **http://127.0.0.1:8787** (health: `/health`)
- UI: **http://127.0.0.1:5173** — Vite proxies `/api` → API

## Env (optional)

| Variable | Default | Notes |
|----------|---------|--------|
| `PORT` | `8787` | API |
| `HOST` | `127.0.0.1` | Bind |
| `DB_PATH` | `./stl.db` | Relative to `apps/api` cwd |
| `CORS_ORIGIN` | *(omit)* | Demo default permissive |

Double-click **`start-dev.bat`** after install if you want a one-step dev launch (also routes npm through **`agent_tools/scripts/npm-ca.cmd`**).
