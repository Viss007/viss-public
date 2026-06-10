# Automations lane — `Desktop\Public\automations`

**Category:** automation (not agent loop). **Not** desk **9872** — no brain_loop / session glue here.

**Site tab:** `live-projects.html` (Automations) on **http://127.0.0.1:3333**

**One runtime:** **3333** serves hire-me + **`/automations/*`** proxies. Loopback children: MCP **2091**, speed-to-lead **3001**.

## Homes

| Automation | Path | Public (3333) | Loopback |
|------------|------|---------------|----------|
| ChatGPT Custom GPT MCP | `automations/chatgpt_mcp_server/` | `/automations/mcp` | **2091** |
| Speed to lead | `automations/speed_to_lead/` | `/automations/speed-to-lead/*` | **3001** |
| Open Brave (CDP) | `automations/open_browser/` | — *(lane frozen — local `.bat` only)* | — |
| Composio engine (optional) | `chatgpt_mcp_server/composio_engine/` | — | **3088** |

**Moved from:** `vissai_platform/chatgpt_mcp_server/` · `VissAgent/lead_agent/` · `viss-tool's/automation/open_browser/` — **2026-06-08**

**Lane frozen:** relocation + bugfixes only — `docs/AUTOMATIONS-LANE-FROZEN.md`. Thaw **`unfreeze public automations`**.

**ChatGPT MCP on :3333:** **`CHATGPT_TOOL_MODE=public`** (echo only) — no operator memory, no Cursor **`mcp.json`**, no paths outside **`Desktop\Public`**. See **`docs/RUNTIME-3333.md`**.
