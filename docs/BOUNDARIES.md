# Public island — no workspace runtime

**Locked 2026-06-09 (operator):** **`Desktop\Public`** is a **self-contained** hire-me runtime. **`start-public.bat`** → **3333** + loopback children. **No connections** to **`viss-workspace`** at runtime (no **8811**, **9872**, **8803**, no junctions, no proxy upstream).

**SSOT:** **`docs/RUNTIME-3333.md`**.

## What lives here

- Hire-me site + template playground (**3333**)
- **`automations/`** — pipes (ChatGPT MCP, speed-to-lead, open_browser scripts)
- **`agents/`** — **docs_agent** (loopback **3000**, `/agents/docs-agent/*`), **slack_agent** (Socket Mode, started with stack)

## What does **not** live here

- Cursor operator stack, **8811**, fork/probe, **`agent_tools/`**
- Agent desk **9872** or Zeus **8803**
- Instructions for agents editing this site — those stay in **`viss-workspace/.cursor/`** (Cursor only; **not** loaded by Public runtime)

## Rules

- **Edits** → this folder when **`/public`** is scoped.
- **No runtime bridge** to workspace — copy code in once; no live sync.
- **No junctions** to **`transcend/`** or the SSD stick.
- **Site UI for agents** (tabs, copy) comes **after** this runtime is stable — not before.

**Thaw/freeze:** **`docs/LANE-FROZEN.md`**.
