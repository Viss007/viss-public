# LeadFlow — paste into Custom GPT **Instructions**

## One command, one file

1. Run **`npm run start:tunnel`** in this folder (`Public/automations/chatgpt_mcp_server`). **Or** run **`npm run start:tunnel:window`** to open the same flow in a **new** PowerShell window (easier to keep the tunnel alive while you use Cursor). **Stop other `ngrok` agents first** if you use the default inspect port (**4040**); otherwise the script may pick the wrong public URL (ChatGPT then hits another backend and you get **Cannot POST /process-lead**). The script checks **local `/health`**, matches the tunnel that forwards to your **`MCP_PORT`**, and **POSTs `/process-lead` through the public URL** before printing **READY**.
2. **Leave that window open** after **READY**. Closing it, pressing **Enter** in the tunnel script, or stopping `ngrok` makes the public host **offline**; ChatGPT then shows **`ERR_NGROK_3200`** (*endpoint offline*). There is no code fix for that — start the tunnel again. If ngrok gives you a **new** HTTPS hostname, regenerate the YAML (the script does this on each successful run) and **re-paste** into Actions.
3. When you see **READY**, open **`openapi-for-chatgpt-COPY-PASTE.yaml`**, **Select All**, paste into the GPT **Actions** schema.
4. Set Action **Authentication** to **None** (first tests).
5. Save the GPT and chat — test **`processLead`** and/or MCP **`callMcp`** (after **`initialize`**).

That YAML is **generated** with your live ngrok **https** origin; do **not** hand-edit **`openapi-custom-gpt.yaml`** for ChatGPT (it keeps **`https://placeholder.invalid`** on purpose).

## Who can call Actions

**Custom GPT Actions are for signed-in ChatGPT users.** In **guest** or **incognito** sessions, tool calls to your API often fail or show **Error talking to App** even when your tunnel is up. That is a product/session limitation, not your LeadFlow server. Demos: use a normal logged-in browser profile.

## OAuth “Sign in” (not ChatGPT login)

With Action **Authentication** set to **None**, users never see a third-party **Sign in** for *your* app. A **Sign in** tied to *your* backend only appears after you ship **OAuth2** in the OpenAPI schema **and** configure matching **OAuth** in the GPT builder **and** run a real authorization server (tokens must work end-to-end). This repo’s template is **`openapi-custom-gpt.oauth.yaml`** (operation **`security`** + **`components.securitySchemes.LeadFlowOAuth`**); paste hacks without a working IdP will not produce a working prompt.

**OAuth / Sign in (later):** edit **`openapi-custom-gpt.oauth.yaml`** (IdP URLs), then
`node scripts/write-openapi-for-chatgpt.mjs <https://your-ngrok-host> openapi-custom-gpt.oauth.yaml`
and paste the generated file; configure GPT Action OAuth to match.

### Composio-style provider OAuth (this server)

The backend implements a **browser OAuth redirect** flow (Google / ClickUp) and stores tokens in a **JSON file** (default **`data/oauth-store.json`**, override with **`LEADFLOW_OAUTH_STORE_PATH`**). This is the pattern: **Connect** → provider login → **callback** → success page; tools later read tokens by an opaque **`link`** id you pass in the query string.

**Env**

- **`LEADFLOW_PUBLIC_URL`** — public **https** origin only (no trailing slash), e.g. `https://abc.ngrok-free.app`. Used to build **`/auth/.../callback`** redirect URIs. Register the same callback URLs in Google Cloud / ClickUp app settings.
- **Google:** **`GOOGLE_CLIENT_ID`**, **`GOOGLE_CLIENT_SECRET`**
- **ClickUp:** **`CLICKUP_CLIENT_ID`**, **`CLICKUP_CLIENT_SECRET`**

**Routes** (after tunnel + `npm run start`)

| Step | URL |
|------|-----|
| Start | `GET https://<public>/auth/google?link=<opaque>` or `.../auth/clickup?link=<opaque>` |
| Callback | `https://<public>/auth/google/callback` / `.../auth/clickup/callback` (provider redirects here; do not open manually) |
| Status | `GET https://<public>/auth/status?link=<opaque>` — JSON summary **without** raw tokens |

Use the **same** **`link`** value in Custom GPT instructions or a setup action so you can tell which ChatGPT user (or session) owns the connection. **`/auth/status`** returns masked rows: `provider`, `subject`, `hasRefreshToken`, `expiresAt`, `updatedAt`.

---

## Action **`processLead`** (`POST /process-lead`)

Regular JSON body (not JSON-RPC). At least one of **`name`**, **`email`**, **`phone`**. Example:

```json
{
  "name": "Alex Buyer",
  "email": "alex@example.com",
  "company": "Example Co",
  "message": "Book a demo.",
  "source": "chatgpt"
}
```

---

## Action **`callMcp`** (`POST /mcp`)

**Never** put **`params`** or **`mcpParams`** in the Action JSON body — **`UnrecognizedKwargsError`**.

**Use `inputJson` only:** a **string** that is a **stringified JSON object** (that becomes JSON-RPC `params`).

**After `initialize`:** add top-level **`mcpSessionId`** (same as **`result._meta.mcpSessionId`**) and optional **`mcpProtocolVersion": "2025-03-26"`** on every later POST.

**Example `initialize` body:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "inputJson": "{\"protocolVersion\":\"2025-03-26\",\"capabilities\":{},\"clientInfo\":{\"name\":\"OpenAI ChatGPT\",\"version\":\"1.0\"}}"
}
```

Do **not** use **`mcpParams`** or **`rpcInput`** in the Action — use **`inputJson`** only.
