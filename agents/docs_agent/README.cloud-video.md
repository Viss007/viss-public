# Documentation agent — cloud video studio

Minimal slice for **Cursor cloud agent** screen recording. Not the full hire-me portfolio on port 3333.

## Start (Linux VM)

```bash
cp .env.example .env    # set OPENAI_API_KEY=
npm install
chmod +x start.sh
./start.sh
```

Open **http://127.0.0.1:3000/** — one app, one URL.

Health: `curl -s http://127.0.0.1:3000/health`

## Record this flow

**Full screen on http://127.0.0.1:3000/ only** — never record hire-me portfolio (3333/agents.html).

1. Open the app — title must read **Invoices → Excel**.
2. Click **Sample invoice 1 (€87.43)**.
3. **Process invoices** — wait for the review table.
4. **Export to Excel** — show the file landed.

Optional: drag-drop a PDF instead of the sample.

Executor prompt: `docs/cloud-agent-docs-agent-video-prompt.txt` in repo root.

## Env (minimum)

| Variable | Required |
|----------|----------|
| `OPENAI_API_KEY` | Yes |

For recording without per-IP caps: `INVOICE_DEMO_MAX_PROCESSES_PER_IP=0` (set in `start.sh`).

## Push target

Sync this folder to **`viss-public`** → `agents/docs_agent/` on GitHub. Portfolio embeds the finished mp4 at `/videos/demos/docs-agent.mp4`.

## Refresh from full portfolio

On your PC (full `Public` tree): `pwsh Public/scripts/package-docs-agent-video.ps1`
