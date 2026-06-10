# ChatGPT connector (Railway tunnel + MCP)

## Operator runbook (Lane A — Railway + `/mcp`)

**Start** (leave this terminal open):

```powershell
cd C:\Users\Vismantas\Desktop\Public\automations\chatgpt_mcp_server
npm run run:railway-tunnel
```

Or from repo root: double‑click **`start-chatgpt-railway-tunnel.bat`**.

**Verify** (second terminal, same `chatgpt_mcp_server` folder):

```powershell
npm run verify:chatgpt
```

**Local MCP Streamable HTTP** (`npm run verify:local` — server must already be listening):

Runs **`GET /health`**, **`POST /process-lead`**, then a real MCP JSON-RPC round-trip on **`POST http://127.0.0.1:2091/mcp`** (via `scripts/mcp-http-roundtrip.mjs`):

1. **`initialize`** — must return JSON-RPC **`result`** with **`protocolVersion`** / **`serverInfo`** and no **`error`**. Session id is returned as **`result._meta.mcpSessionId`** and as response header **`mcp-session-id`** (either works).
2. **`tools/list`** — second POST with header **`Mcp-Session-Id: <same uuid>`**; response **`result.tools`** must include **`echo`** and **`dimensional`**. Extra tools (**Read**, **Grep**, …) are OK when **`CHATGPT_TOOL_MODE`** is not **`memory`**.
3. If **`GET /health`** exposes **`dimensionalHttpUrl`**, the script **`POST`s** `{"action":"health","params":{}}` there (8811 memory_agent).

Override base URL with **`MCP_VERIFY_HTTP_BASE`** (no trailing slash); **`MCP_PORT`** still defaults **`2091`** when that env is unset.

Round-trip only (no REST lead step): **`npm run verify:local:mcp`** (forces loopback via **`--local`**, so a stray public URL env var cannot override).

Direct Node (same checks):

- **`node scripts/mcp-http-roundtrip.mjs --local`** — same as **`npm run verify:local:mcp`** (uses **`MCP_VERIFY_HTTP_BASE`** or **`http://127.0.0.1:${MCP_PORT:-2091}/mcp`**).
- **`node scripts/mcp-http-roundtrip.mjs --url http://127.0.0.1:2091/mcp`** — explicit MCP endpoint.

### Public Railway MCP round-trip (parity)

Set **`CHATGPT_MCP_PUBLIC_URL`** or **`RAILWAY_MCP_URL`** to the **full** connector URL (including **`/mcp`**), for example **`https://<railway-host>/mcp`**. Do not hardcode hosts in repo scripts; use env only.

- **`npm run verify:public:mcp`** — requires one of those variables; exits non-zero if missing or if **`initialize` / `tools/list`** fails.
- **`npm run verify:chatgpt`** — if either env var is **set**, also runs **`GET`** `…/health` on the **same origin** as that MCP URL (unless that origin was already checked via **`-PublicUrl`** / railway domain), then runs the same MCP JSON-RPC round-trip against the env URL. If neither env var is set, prints **`SKIP`** and names **`CHATGPT_MCP_PUBLIC_URL`** **or** **`RAILWAY_MCP_URL`**.

**Expected tools (memory mode)**

With **`CHATGPT_TOOL_MODE=memory`** (typical launcher), **`tools/list`** must include **`echo`** and **`dimensional`**. Extra tools mean full mode — still OK for **`echo`** / **`dimensional`** checks.

### Headers / session through the tunnel

The client sends **`Accept: application/json, text/event-stream`**, **`Content-Type: application/json; charset=utf-8`**, and on the second request **`Mcp-Session-Id`**. Node **`fetch`** forwards these as normal HTTP headers. Railway’s edge and this repo’s tunnel are expected to pass them through unchanged unless something upstream strips custom headers (unusual). **`initialize`** must return a session (**`result._meta.mcpSessionId`** and/or **`mcp-session-id`** response header); **`tools/list`** without that session fails with a JSON-RPC error — if **local passes** but **public fails** at **`tools/list`** only, suspect **session header** propagation or a proxy rewriting **`Mcp-Session-Id`**.

**Expected when healthy**

- **Local MCP:** `GET http://127.0.0.1:2091/health` → JSON with `"ok":true`, `"chatgptToolMode":"memory"` (launcher sets memory mode).
- **Railway tunnel:** `GET https://<railway-host>/health` → `"agent_connected":true`.
- **Operator memory:** `POST http://127.0.0.1:8811/api/dimensional` with body `{"action":"health","params":{}}` → `"status":"ok"` (needed for tool **`dimensional`**; **`echo`** does not use 8811).

**ChatGPT connector URL (Settings → Connectors / New App)**

- Paste: **`https://<railway-host>/mcp`** (same host as `railway domain`; path must be **`/mcp`**).
- Authentication: **None** unless you added OAuth on this server.

**Warning — do not paste `8811` into ChatGPT**

Port **8811** is **internal** operator memory HTTP on your PC. The **`dimensional`** tool calls it from **`chatgpt_mcp_server`**. ChatGPT must only see the **HTTPS Railway origin + `/mcp`**, not `http://127.0.0.1:8811/...`.

## One-time

1. **Railway CLI** linked to the `railway-tunnel` service (`cd railway_tunnel && railway link` if needed).
2. **Build both** packages from this folder:

   ```powershell
   cd C:\Users\Vismantas\Desktop\Public\automations\chatgpt_mcp_server
   npm run build:stack
   ```

## Every test session

1. **Stop old stacks** (optional but avoids port/WebSocket fights):

   ```powershell
   npm run stop:railway-tunnel
   ```

2. **Start the tunnel + MCP** (one terminal; leave it open):

   ```powershell
   npm run run:railway-tunnel
   ```

3. **Preflight** (optional, in a second terminal):

   ```powershell
   npm run verify:chatgpt
   ```

   **Local `/mcp` JSON-RPC only** (MCP server must be listening on 2091):

   ```powershell
   npm run verify:local
   ```

   Or MCP round-trip without REST smoke: **`npm run verify:local:mcp`**.

4. **ChatGPT** → Settings → Connectors / New App (Beta):

   - **MCP Server URL:** `https://<your-railway-host>/mcp`
     (same host as `railway domain`; path must be `/mcp` for Streamable HTTP).
   - **Authentication:** **None** (unless you implemented OAuth for this server).

5. **Operator memory (8811)** — optional: start `memory_agent` on `127.0.0.1:8811` on this PC so the `dimensional` tool can search/write. ChatGPT can still connect if 8811 is down; only memory tools fail.

## Troubleshooting

### Local OK, public Railway MCP fails

| Symptom | Likely meaning |
|--------|----------------|
| **Local MCP PASS, public MCP FAIL** | Tunnel, HTTPS edge, or wrong public URL — not the MCP server binary on loopback. Confirm env URL is **`https://…/mcp`**, tunnel agent running, **`agent_connected`** on public **`/health`**. |
| **Railway `/health` shows `agent_connected: false`** | Tunnel agent not connected or token mismatch — fix tunnel before blaming MCP. |
| **`initialize` PASS, `tools/list` FAIL on public only** | Often **session not propagated** (**`Mcp-Session-Id`** dropped or renamed by a proxy). Compare response headers from **`initialize`** on public vs local. |
| **`tools/list` missing `dimensional` on public but present locally** | Different **`CHATGPT_TOOL_MODE`** / env on the process behind the tunnel vs your local server — align env and restart. |
| **`dimensional` listed but 8811 health fails locally** | MCP connector path is fine; **`memory_agent`** on **`127.0.0.1:8811`** or **`DIMENSIONAL_HTTP_URL`** — **`echo`** can still work over Railway; **`dimensional`** calls fail until 8811 is healthy from the MCP host. |

### MCP `/mcp` vs `/health` (local verify)

| Symptom | Meaning |
|--------|---------|
| **`/health` PASS, MCP initialize FAIL** | Streamable HTTP path broken (wrong URL, missing **`Accept: application/json, text/event-stream`**, body not JSON-RPC **`initialize`**, or server error). **`GET /mcp`** without a session only returns a small JSON hint — ChatGPT needs **`POST /mcp`**. |
| **initialize PASS, `tools/list` FAIL** | Usually missing or wrong **`Mcp-Session-Id`** on the second POST (must match **`result._meta.mcpSessionId`** / **`mcp-session-id`** header from initialize). |
| **`tools/list` lacks `dimensional`** | Wrong server binary, bad **`registerTools`**, or stuck old process — rebuild (**`npm run build`**) and restart **`node dist/server.js`**. |
| **`dimensional` listed but 8811 health FAIL** | Connector MCP is fine; **`memory_agent`** not up on **`127.0.0.1:8811`** or wrong **`DIMENSIONAL_HTTP_URL`**. **`echo`** can still work. |

| Symptom | Fix |
|--------|-----|
| `Bad Gateway: fetch failed` | MCP server not listening on `LOCAL_URL`; run `run:railway-tunnel` and wait until it prints the PID. |
| ChatGPT **502** / “Upstream or external service errors” on **`dimensional`** only (`echo` works) | Usually **memory_agent not on 8811**, **hung health/search**, or **bad `params`**. Start memory on `127.0.0.1:8811`, retry. Optional: `DIMENSIONAL_HTTP_TIMEOUT_MS` (default 12000) in the env of `node dist/server.js`. Rebuild after pulling fixes for **`params: null`** handling. |
| `agent_connected: false` on Railway `/health` | Tunnel agent not running or `TUNNEL_TOKEN` mismatch. |
| WebSocket `4000 replaced` in agent log | Two agents running — `npm run stop:railway-tunnel`, then a single `run:railway-tunnel`. |
| Mutex “already running” | Close the other PowerShell window or `stop:railway-tunnel`, then retry. |

Railway **GET `/health`** is the tunnel control plane (`agent_connected`). Your app’s JSON is **`GET http://127.0.0.1:2091/health`** on the machine running the MCP server.
