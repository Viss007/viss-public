# railway_tunnel

Single-port **HTTP reverse tunnel** for [Railway](https://railway.app): a public `https://…up.railway.app` terminates TLS at Railway, while your API runs on `localhost`. A small **agent** on your PC opens an outbound WebSocket to Railway and forwards HTTP to `LOCAL_URL`.

## Why not raw FRP/ngrok here?

FRP’s server usually wants multiple exposed TCP ports. Railway’s public HTTP service maps to **one** `PORT`. This project multiplexes **all** inbound HTTP over one WebSocket from the agent, which matches that model.

## Deploy (Railway)

1. Create a new service from this folder (Dockerfile build).
2. Set variables:
   - `TUNNEL_TOKEN` — long random string (agent must use the same value).
3. Deploy. Note the public URL, e.g. `https://your-service.up.railway.app`.

Railway sets `PORT`; the server binds `0.0.0.0`.

## Run the agent (your PC)

Install deps once in this repo: `npm ci`

```bash
set TUNNEL_TOKEN=your-secret
set RAILWAY_TUNNEL_SERVER=https://your-service.up.railway.app
set LOCAL_URL=http://127.0.0.1:3088
npm run build
node dist/agent.js
```

Or:

```bash
node dist/agent.js --server https://your-service.up.railway.app --token your-secret --local http://127.0.0.1:3088
```

When the agent is connected, `GET /health` on the Railway URL returns `{ "agent_connected": true }`.

### Prefer `railway run` (no token on the command line)

From the service directory (after `railway link`), `railway run` injects service variables such as `TUNNEL_TOKEN`. You must still set the **public origin** yourself — it is **not** auto-injected:

```powershell
cd railway_tunnel
railway domain --json
$env:RAILWAY_TUNNEL_SERVER = "https://<paste-public-host>.up.railway.app"
$env:LOCAL_URL = "http://127.0.0.1:3088"
railway run node dist/agent.js
```

If `RAILWAY_TUNNEL_SERVER` is missing, the agent exits with usage text (it cannot guess the HTTPS hostname).

## Railway edge lessons (from VissAI probe work)

See `VissAI/docs/railway.md` for full detail. Short version:

- **gRPC-style paths** (`/agent.v1.AgentService/Run` — dots in the path) can trigger special handling on Railway’s edge; **large POST bodies** may **hang** before the container sees them. Mitigation used there was **client-side path rewriting** (dots → slashes) and server-side normalization.
- **This tunnel** usually forwards normal REST paths (`/mcp`, `/v1/...`). If you later proxy traffic whose paths look like gRPC service names **and** bodies are large, apply the same “avoid dotted path at the edge” idea or test with `curl` from outside.
- **Limits:** Railway documents HTTP timeouts (e.g. long-running requests), header size limits, **max 32 KB combined headers** — keep Custom GPT / proxy headers reasonable.
- **Health checks:** In Railway service settings, point the healthcheck at **`/health`** (or rely on TCP if you prefer). The tunnel server exposes `GET /health` without the agent; `agent_connected` tells you if the WebSocket agent is up.

## Express 5

Do not use `app.all('*', …)` — Express 5 / `path-to-regexp` rejects bare `*`. This project uses a **terminal `app.use`** handler as the catch-all.

## Point Custom GPT / OpenAPI

Use the Railway **HTTPS origin** as `servers.url` (same host you use for `/mcp`, `/health`, etc.). No ngrok URL in the schema unless you bypass this tunnel.

## Security

- Keep `TUNNEL_TOKEN` secret; it gates the WebSocket `/tunnel` path.
- Anyone who can reach your Railway URL can hit paths exposed by your **local** app; protect backends with API keys as you already do (e.g. composio_engine `INTERNAL_API_KEY`).
