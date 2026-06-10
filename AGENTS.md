# AGENTS.md

## Cursor Cloud specific instructions

### Product overview

**VissAI Portfolio Site** — self-contained hire-me runtime on `http://127.0.0.1:3333/`. Canonical full-stack entry is **`node runtime/stack.mjs`** (Windows: `start-public.bat`). See `docs/RUNTIME-3333.md`.

### System prerequisites (not in update script)

These are installed once on the VM image / first setup via `apt`:

- **PHP 8.2+** with extensions: `sqlite3`, `mbstring`, `xml`, `curl`, `zip`, `bcmath`
- **Composer** at `~/.local/bin/composer` (add to `PATH`)
- **Redis** — must be running before starting the stack: `redis-server --daemonize yes` (verify: `redis-cli ping` → `PONG`)

Node **≥20.18.1** is required (`.nvmrc` pins major 20; Node 22 works).

### First-time Laravel bootstrap (one-time per clone)

If `website-templates/.env` or `database/database.sqlite` are missing:

```bash
export PATH="$HOME/.local/bin:$PATH"
cd website-templates
cp .env.example .env
touch database/database.sqlite
php artisan key:generate --force
php artisan migrate --no-interaction
npm run build
```

`runtime/stack.mjs` auto-copies `.env` and runs `key:generate` if `.env` is absent, but migrations and Vite build must be done manually once.

### Starting the full stack

```bash
redis-server --daemonize yes   # if not already running
export PATH="$HOME/.local/bin:$PATH"
cd /workspace
node runtime/stack.mjs
```

Runs on **port 3333** only (agents, automations, static site, Laravel stdio worker in one Node process).

**Health checks:**

- `http://127.0.0.1:3333/agents/docs-agent/health`
- `http://127.0.0.1:3333/automations/speed-to-lead/health`
- `http://127.0.0.1:3333/automations/health`
- `http://127.0.0.1:3333/about` · `http://127.0.0.1:3333/websites`

### Lighter alternatives (optional)

| Mode | Command | Notes |
|------|---------|-------|
| Static preview only | `npm run dev` | HTML/CSS/JS hot reload; **no** agents/automations/Laravel |
| Laravel standalone | `cd website-templates && php artisan serve --port=8000` | Dev-only; **banned** in public stack |

### Tests

| Scope | Command |
|-------|---------|
| Root unit tests | `npm test` (from repo root) |
| Laravel | `cd website-templates && php artisan test` |
| MCP standalone verify | `cd automations/chatgpt_mcp_server && npm run verify:local:mcp` — expects standalone on `:2091`; **fails** when only the gateway stack is running. Use `/automations/health` instead when stack is up. |

**Known test quirk:** `website-templates/tests/Feature/ExampleTest.php` expects `GET /` → 200 but Laravel redirects `/` → 302 by design.

### Secrets (optional per feature)

- **docs_agent** (`agents/docs_agent/.env`): `OPENAI_API_KEY` for invoice processing
- **speed_to_lead** (`automations/speed_to_lead/.env`): `SLACK_WEBHOOK_URL`, Twilio, SMTP for notifications; Redis defaults to `127.0.0.1:6379`
- **slack_agent** (`agents/slack_agent/.env`): `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` to enable in-process Slack bot

Core stack health and static pages work **without** any secrets.

### Gotchas

- `chatgpt_mcp_server` is auto-built on first `stack.mjs` boot if `dist/server.js` is missing.
- Redis must be up before `stack.mjs` or speed-to-lead queue will fail.
- Composer is at `~/.local/bin/composer` — ensure `PATH` includes it for Laravel artisan commands.
