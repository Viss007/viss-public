# Public — single runtime on :3333

**Locked 2026-06-09:** **`start-public.bat`** → **`runtime/stack.mjs`**. **One Node process**, **one listen port (3333)**.

## What runs (all one Node PID)

| Piece | How |
|-------|-----|
| **3333** | Express gateway — only operator HTTP port |
| **docs_agent** | In-process mount `/agents/docs-agent/*` |
| **speed_to_lead** | In-process mount `/automations/speed-to-lead/*` |
| **chatgpt_mcp** | In-process mount `/automations/*` |
| **hire-me + assets** | Static from `website-templates/public` |
| **template playground** | Laravel **stdio worker** (`runtime/laravel-stdio.php`) — **no** `php artisan serve`, **no** loopback HTTP |
| **slack_agent** | `@slack/bolt` Socket Mode in-process — **no** Python subprocess |

## Start

```bat
start-public.bat
```

## Health

- `http://127.0.0.1:3333/agents/docs-agent/health`
- `http://127.0.0.1:3333/automations/speed-to-lead/health`
- `http://127.0.0.1:3333/automations/health`
- `http://127.0.0.1:3333/about` · `http://127.0.0.1:3333/websites`

## Banned

- Separate PowerShell windows per service
- `php artisan serve` in the Public stack
- Loopback proxy to 3000 / 3001 / 2091
- Python `slack_agent` subprocess from `start-public.bat`
