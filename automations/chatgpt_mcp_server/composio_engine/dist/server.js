import "./env.js";
import express from "express";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { getApiKey, getComposioOnboardingBaseUrl, getHost, getPort, getPublicUrl, isProvider, buildComposioConnectUrl, buildComposioOnboardingUrl, getComposioOauthAuthorizeUrl, getComposioOauthClientId, getComposioOauthRegisterUrl, getComposioOauthTokenUrl } from "./config.js";
import { getProviderConnection, getUserState, setProviderConnection } from "./store.js";
function fail(res, status, error) {
    res.status(status).json({ ok: false, error });
}
function requireApiKey(req, res, next) {
    const expected = getApiKey();
    const raw = req.headers["x-api-key"];
    const actual = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
    if (actual !== expected) {
        fail(res, 401, "Invalid or missing X-API-Key header");
        return;
    }
    next();
}
function queryString(value) {
    return typeof value === "string" ? value.trim() : "";
}
function normalizeMcpBody(rawBody) {
    if (!rawBody || typeof rawBody !== "object")
        return rawBody;
    const body = { ...rawBody };
    const method = queryString(body.method);
    // Compatibility shim for malformed ChatGPT Action payloads:
    // some clients send tool name as method directly.
    if (method.startsWith("COMPOSIO_")) {
        return {
            jsonrpc: queryString(body.jsonrpc) || "2.0",
            id: body.id ?? null,
            method: "tools/call",
            params: {
                name: method,
                arguments: body.arguments ||
                    body.params ||
                    {}
            }
        };
    }
    // Compatibility shim for malformed tools/call payloads:
    // map params.params -> params.arguments.
    if (method === "tools/call" && body.params && typeof body.params === "object") {
        const callParams = { ...body.params };
        if (!callParams.arguments && callParams.params && typeof callParams.params === "object") {
            callParams.arguments = callParams.params;
            delete callParams.params;
            body.params = callParams;
        }
    }
    return body;
}
const app = express();
app.use(express.json({ limit: "1mb" }));
let runtimeOauthClientId = "";
const runtimeOauthSessions = new Map();
const runtimeMcpAuthByUserRef = new Map();
function activeOauthClientId() {
    return runtimeOauthClientId || getComposioOauthClientId();
}
function renderOauthPage(title, message, tone) {
    const accent = tone === "success" ? "#34d399" : "#f87171";
    const chipBg = tone === "success" ? "rgba(16, 185, 129, 0.16)" : "rgba(239, 68, 68, 0.16)";
    const chipText = tone === "success" ? "#6ee7b7" : "#fca5a5";
    const titleText = tone === "success" ? "Connected successfully" : "Connection failed";
    const helper = tone === "success"
        ? "Everything is set. You can return to the ChatGPT safely."
        : "Please try again. If this keeps happening, contact support.";
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Inter, "Segoe UI", Arial, sans-serif;
        color: #eaf0ff;
        background:
          radial-gradient(1000px 500px at 0% 0%, rgba(80, 112, 255, 0.22), transparent 70%),
          radial-gradient(900px 460px at 100% 100%, rgba(111, 66, 193, 0.20), transparent 72%),
          #070b17;
        padding: 24px;
      }
      .card {
        width: min(620px, 100%);
        border: 1px solid rgba(167, 183, 255, 0.2);
        border-radius: 20px;
        padding: 26px;
        background: linear-gradient(180deg, rgba(20, 28, 58, 0.96), rgba(12, 18, 40, 0.98));
        box-shadow: 0 24px 70px rgba(0, 0, 0, 0.45);
        text-align: center;
      }
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 12px;
        border-radius: 999px;
        background: rgba(99, 102, 241, 0.15);
        color: #c9d2ff;
        font-size: 12px;
        letter-spacing: 0.08em;
        font-weight: 600;
      }
      .brand-name {
        color: #f87171;
        font-weight: 700;
      }
      .chip {
        margin-top: 18px;
        display: inline-flex;
        align-items: center;
        padding: 6px 11px;
        border-radius: 999px;
        background: ${chipBg};
        color: ${chipText};
        font-size: 12px;
        font-weight: 600;
      }
      .title {
        margin: 14px 0 8px;
        font-size: 30px;
        line-height: 1.15;
        font-weight: 700;
      }
      .sub {
        margin: 0;
        color: #c9d3fb;
        font-size: 16px;
        line-height: 1.55;
      }
      .box {
        margin-top: 18px;
        border: 1px solid rgba(166, 181, 255, 0.18);
        background: rgba(8, 12, 24, 0.52);
        border-radius: 12px;
        padding: 12px;
      }
      .label {
        color: #9db0f6;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 5px;
      }
      .value {
        color: #eaf0ff;
        font-size: 14px;
        line-height: 1.45;
        word-break: break-word;
      }
      .footer {
        margin-top: 16px;
        color: #95a5e6;
        font-size: 13px;
      }
      .rule {
        margin-top: 16px;
        height: 1px;
        border: 0;
        background: linear-gradient(90deg, transparent, ${accent}, transparent);
      }
    </style>
  </head>
  <body>
    <main class="card">
      <div class="brand"><span class="brand-name">VissAI</span></div>
      <div class="chip">${titleText}</div>
      <h1 class="title">${title}</h1>
      <p class="sub">${message}</p>
      <div class="box">
        <div class="label">Status</div>
        <div class="value">${helper}</div>
      </div>
      <hr class="rule" />
      <div class="footer">You can close this page now.</div>
    </main>
  </body>
</html>`;
}
app.use((req, _res, next) => {
    req.reqId = randomUUID().slice(0, 8);
    next();
});
app.get("/v1/health", (_req, res) => {
    let publicBase = null;
    let onboardingBaseUrl = null;
    try {
        publicBase = getPublicUrl();
    }
    catch {
        /* missing ENGINE_PUBLIC_URL — other routes need it; liveness still 200 */
    }
    try {
        onboardingBaseUrl = getComposioOnboardingBaseUrl();
    }
    catch {
        /* missing COMPOSIO_ONBOARDING_BASE_URL */
    }
    res.json({
        ok: true,
        service: "composio_engine",
        mode: "router_only",
        publicBase,
        onboardingBaseUrl,
        config_ready: Boolean(publicBase && onboardingBaseUrl)
    });
});
app.get("/v1/onboarding/status", requireApiKey, (req, res) => {
    const userRef = queryString(req.query.user_ref);
    const providerRaw = queryString(req.query.provider);
    if (!userRef)
        return fail(res, 400, "Missing user_ref");
    if (!isProvider(providerRaw))
        return fail(res, 400, "Missing or invalid provider");
    const state = getProviderConnection(userRef, providerRaw);
    const userState = getUserState(userRef);
    const providerConnected = Boolean(state?.connected);
    const hasAnyConnectedProvider = Boolean(userState &&
        Object.values(userState.providers || {}).some((providerState) => Boolean(providerState?.connected)));
    const composioAccountReady = Boolean(userState?.composioAccountReady) || hasAnyConnectedProvider;
    res.json({
        ok: true,
        user_ref: userRef,
        provider: providerRaw,
        needs_composio_account: !composioAccountReady,
        provider_connected: providerConnected,
        connected: providerConnected,
        updatedAt: state?.updatedAtIso || null,
        composioUpdatedAt: userState?.composioUpdatedAtIso || null
    });
});
app.get("/v1/onboarding/connect_url", requireApiKey, (req, res) => {
    const userRef = queryString(req.query.user_ref);
    const providerRaw = queryString(req.query.provider);
    if (!userRef)
        return fail(res, 400, "Missing user_ref");
    if (!isProvider(providerRaw))
        return fail(res, 400, "Missing or invalid provider");
    const callbackState = Buffer.from(JSON.stringify({
        user_ref: userRef,
        provider: providerRaw
    }), "utf8").toString("base64url");
    const callbackUrl = `${getPublicUrl()}/v1/onboarding/callback?state=${encodeURIComponent(callbackState)}`;
    const baseConnect = buildComposioConnectUrl(providerRaw, userRef);
    const joiner = baseConnect.includes("?") ? "&" : "?";
    const providerConnectUrl = `${baseConnect}${joiner}return_url=${encodeURIComponent(callbackUrl)}`;
    const signupUrl = buildComposioOnboardingUrl(providerRaw, userRef, providerConnectUrl);
    const connectUrl = providerConnectUrl;
    res.json({
        ok: true,
        user_ref: userRef,
        provider: providerRaw,
        connectUrl,
        providerConnectUrl,
        signupUrl,
        note: "Use connectUrl first (fast path to provider connect). If Composio requires account setup, open signupUrl once and then retry connectUrl."
    });
});
app.get("/v1/onboarding/callback", (req, res) => {
    const stateRaw = queryString(req.query.state);
    if (!stateRaw)
        return fail(res, 400, "Missing callback state");
    try {
        const decoded = JSON.parse(Buffer.from(stateRaw, "base64url").toString("utf8"));
        if (!decoded.user_ref || !decoded.provider || !isProvider(decoded.provider)) {
            return fail(res, 400, "Invalid callback state");
        }
        setProviderConnection(decoded.user_ref, decoded.provider, true);
        res.status(200).type("text/html").send("<html><body><h1>Connection saved</h1><p>You can close this tab and return to ChatGPT.</p></body></html>");
    }
    catch {
        fail(res, 400, "Invalid callback state");
    }
});
app.get("/v1/oauth/composio/start", (req, res) => {
    const userRef = queryString(req.query.user_ref);
    const providerRaw = queryString(req.query.provider);
    if (!userRef)
        return fail(res, 400, "Missing user_ref");
    if (!isProvider(providerRaw))
        return fail(res, 400, "Missing or invalid provider");
    const state = randomBytes(24).toString("base64url");
    const codeVerifier = randomBytes(32).toString("base64url");
    const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");
    const callbackUrl = `${getPublicUrl()}/v1/oauth/composio/callback`;
    const clientId = activeOauthClientId();
    if (!clientId) {
        return fail(res, 400, "Missing OAuth client. Register runtime client first via POST /v1/oauth/composio/register_client.");
    }
    const authorizeUrl = new URL(getComposioOauthAuthorizeUrl());
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set("redirect_uri", callbackUrl);
    authorizeUrl.searchParams.set("state", state);
    authorizeUrl.searchParams.set("code_challenge", codeChallenge);
    authorizeUrl.searchParams.set("code_challenge_method", "S256");
    // Prefer consent screen after launch; if user is logged out, provider may still require sign-in first.
    authorizeUrl.searchParams.set("prompt", "consent");
    const authorizeUrlString = authorizeUrl.toString();
    runtimeOauthSessions.set(state, {
        userRef,
        provider: providerRaw,
        codeVerifier,
        authorizeUrl: authorizeUrlString,
        createdAt: Date.now()
    });
    const launchUrl = `${getPublicUrl()}/v1/oauth/composio/launch?state=${encodeURIComponent(state)}`;
    res.json({
        ok: true,
        user_ref: userRef,
        provider: providerRaw,
        authorizeUrl: authorizeUrlString,
        launchUrl,
        callbackUrl,
        state
    });
});
app.get("/v1/oauth/composio/launch", (req, res) => {
    const renderLaunchError = (message) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>VissAI Router</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Inter, "Segoe UI", Arial, sans-serif;
        color: #eaf0ff;
        background:
          radial-gradient(1000px 500px at 0% 0%, rgba(80, 112, 255, 0.22), transparent 70%),
          radial-gradient(900px 460px at 100% 100%, rgba(111, 66, 193, 0.20), transparent 72%),
          #070b17;
        padding: 24px;
      }
      .card {
        width: min(640px, 100%);
        border: 1px solid rgba(167, 183, 255, 0.2);
        border-radius: 20px;
        padding: 26px;
        background: linear-gradient(180deg, rgba(20, 28, 58, 0.96), rgba(12, 18, 40, 0.98));
        box-shadow: 0 24px 70px rgba(0, 0, 0, 0.45);
        text-align: center;
      }
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 12px;
        border-radius: 999px;
        background: rgba(99, 102, 241, 0.15);
        color: #c9d2ff;
        font-size: 12px;
        letter-spacing: 0.08em;
        font-weight: 600;
      }
      .brand-name {
        color: #f87171;
        font-weight: 700;
      }
      .chip {
        margin-top: 18px;
        display: inline-flex;
        align-items: center;
        padding: 6px 11px;
        border-radius: 999px;
        background: rgba(239, 68, 68, 0.16);
        color: #fca5a5;
        font-size: 12px;
        font-weight: 600;
      }
      .title {
        margin: 14px 0 8px;
        font-size: 30px;
        line-height: 1.15;
        font-weight: 700;
      }
      .sub {
        margin: 0 auto;
        color: #c9d3fb;
        font-size: 16px;
        line-height: 1.55;
        max-width: 520px;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <div class="brand"><span class="brand-name">VissAI</span></div>
      <div class="chip">Launch unavailable</div>
      <h1 class="title">Session not available</h1>
      <p class="sub">${message}</p>
    </main>
  </body>
</html>`;
    const state = queryString(req.query.state);
    if (!state) {
        return res.status(400).type("text/html").send(renderLaunchError("Missing OAuth state. Please restart the connection flow."));
    }
    const session = runtimeOauthSessions.get(state);
    if (!session) {
        return res
            .status(400)
            .type("text/html")
            .send(renderLaunchError("This link is invalid or expired. Generate a fresh launch link and try again."));
    }
    return res.status(200).type("text/html").send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Connecting securely...</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Inter, "Segoe UI", Arial, sans-serif;
        color: #eaf0ff;
        background:
          radial-gradient(1000px 500px at 0% 0%, rgba(80, 112, 255, 0.22), transparent 70%),
          radial-gradient(900px 460px at 100% 100%, rgba(111, 66, 193, 0.20), transparent 72%),
          #070b17;
        padding: 24px;
      }
      .card {
        width: min(640px, 100%);
        border: 1px solid rgba(167, 183, 255, 0.2);
        border-radius: 20px;
        padding: 26px;
        background: linear-gradient(180deg, rgba(20, 28, 58, 0.96), rgba(12, 18, 40, 0.98));
        box-shadow: 0 24px 70px rgba(0, 0, 0, 0.45);
        text-align: center;
      }
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 12px;
        border-radius: 999px;
        background: rgba(99, 102, 241, 0.15);
        color: #c9d2ff;
        font-size: 12px;
        letter-spacing: 0.08em;
        font-weight: 600;
      }
      .brand-name {
        color: #f87171;
        font-weight: 700;
      }
      .title {
        margin: 16px 0 10px;
        font-size: 30px;
        line-height: 1.15;
        font-weight: 700;
      }
      .sub {
        margin: 0;
        color: #c9d3fb;
        font-size: 16px;
        line-height: 1.55;
      }
      .actions {
        margin-top: 22px;
        display: flex;
        gap: 12px;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
      }
      .btn {
        appearance: none;
        border: 1px solid #738cff;
        border-radius: 12px;
        background: linear-gradient(180deg, #6b87ff, #5a73e6);
        color: #fff;
        font-weight: 700;
        padding: 12px 18px;
        cursor: pointer;
        text-decoration: none;
        display: inline-block;
        box-shadow: 0 8px 24px rgba(84, 110, 255, 0.35);
      }
      .btn:hover { filter: brightness(1.06); }
      .btn:active { transform: translateY(1px); }
      .helper {
        margin-top: 16px;
        border: 1px solid rgba(166, 181, 255, 0.18);
        background: rgba(8, 12, 24, 0.52);
        border-radius: 12px;
        padding: 12px;
        text-align: center;
      }
      .muted { color: #a8b4e5; font-size: 13px; margin: 0; line-height: 1.5; }
      .muted a { color: #d4deff; }
      .rule {
        margin-top: 16px;
        height: 1px;
        border: 0;
        background: linear-gradient(90deg, transparent, #6f8bff, transparent);
      }
      .footer {
        margin-top: 12px;
        color: #95a5e6;
        font-size: 13px;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <div class="brand"><span class="brand-name">VissAI</span></div>
      <h1 class="title">Continue to secure authorization</h1>
      <p class="sub">You are about to connect your account securely.</p>
      <div class="actions">
        <button id="continue-btn" class="btn" type="button">Continue</button>
      </div>
      <div class="helper">
        <p class="muted">If the button does not work, use this direct link: <a id="direct-link" href="#">Continue</a>.</p>
      </div>
      <hr class="rule" />
      <div class="footer">This secure page is part of your connection flow.</div>
    </main>
    <script>
      const authUrl = ${JSON.stringify(session.authorizeUrl)};
      const continueBtn = document.getElementById("continue-btn");
      const directLink = document.getElementById("direct-link");
      if (directLink) directLink.setAttribute("href", authUrl);
      if (continueBtn) {
        continueBtn.addEventListener("click", () => {
          window.location.assign(authUrl);
        });
      }
    </script>
    <noscript>
      <p style="padding: 16px; color: #e6ebff;">
        JavaScript is disabled. Continue here:
        <a href="${session.authorizeUrl}">Open authorization</a>
      </p>
    </noscript>
  </body>
</html>`);
});
app.post("/v1/oauth/composio/register_client", async (req, res) => {
    const callbackUrl = `${getPublicUrl()}/v1/oauth/composio/callback`;
    const clientNameRaw = queryString(req.body?.client_name);
    const clientName = clientNameRaw || `composio-engine-${Date.now()}`;
    const registerUrl = getComposioOauthRegisterUrl();
    try {
        const response = await fetch(registerUrl, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                client_name: clientName,
                redirect_uris: [callbackUrl],
                grant_types: ["authorization_code", "refresh_token"],
                response_types: ["code"],
                token_endpoint_auth_method: "none",
                application_type: "web"
            })
        });
        const data = (await response.json());
        if (!response.ok || !data.client_id) {
            return fail(res, 502, "Composio client registration failed");
        }
        runtimeOauthClientId = data.client_id;
        return res.json({
            ok: true,
            client_id: data.client_id,
            callbackUrl,
            registerUrl
        });
    }
    catch {
        return fail(res, 502, "Composio client registration failed");
    }
});
app.post("/mcp", async (req, res) => {
    const userRef = queryString(req.query.user_ref) || queryString(req.body?.user_ref);
    const runtimeAuth = userRef ? runtimeMcpAuthByUserRef.get(userRef) : undefined;
    const authHeader = queryString(req.headers.authorization) || runtimeAuth?.authorization || "";
    if (!authHeader)
        return fail(res, 401, "Missing Authorization header");
    const acceptHeader = queryString(req.headers.accept) || "application/json, text/event-stream";
    const upstreamUrl = "https://connect.composio.dev/mcp";
    try {
        const upstream = await fetch(upstreamUrl, {
            method: "POST",
            headers: {
                authorization: authHeader,
                accept: acceptHeader,
                "content-type": "application/json"
            },
            body: JSON.stringify(normalizeMcpBody(req.body ?? {}))
        });
        const contentType = upstream.headers.get("content-type") || "application/json";
        const text = await upstream.text();
        return res.status(upstream.status).type(contentType).send(text);
    }
    catch {
        return fail(res, 502, "Failed to reach Composio MCP upstream");
    }
});
app.get("/v1/oauth/composio/runtime", requireApiKey, (_req, res) => {
    const callbackUrl = `${getPublicUrl()}/v1/oauth/composio/callback`;
    res.json({
        ok: true,
        callbackUrl,
        client_id: activeOauthClientId() || null,
        source: runtimeOauthClientId ? "runtime_registered" : "env"
    });
});
app.get("/v1/oauth/composio/runtime_token_status", requireApiKey, (req, res) => {
    const userRef = queryString(req.query.user_ref);
    if (!userRef)
        return fail(res, 400, "Missing user_ref");
    const runtimeToken = runtimeMcpAuthByUserRef.get(userRef);
    const now = Date.now();
    const expiresInSeconds = runtimeToken?.expiresAt && runtimeToken.expiresAt > now
        ? Math.floor((runtimeToken.expiresAt - now) / 1000)
        : 0;
    res.json({
        ok: true,
        user_ref: userRef,
        has_runtime_mcp_auth: Boolean(runtimeToken),
        provider: runtimeToken?.provider || null,
        updated_at: runtimeToken?.updatedAt || null,
        expires_at: runtimeToken?.expiresAt || null,
        expires_in_seconds: runtimeToken?.expiresAt ? expiresInSeconds : null
    });
});
app.get("/v1/oauth/composio/callback", async (req, res) => {
    const state = queryString(req.query.state);
    const code = queryString(req.query.code);
    const error = queryString(req.query.error);
    if (!state)
        return fail(res, 400, "Missing state");
    const session = runtimeOauthSessions.get(state);
    if (!session)
        return fail(res, 400, "Invalid or expired state");
    runtimeOauthSessions.delete(state);
    if (error) {
        return res
            .status(400)
            .type("text/html")
            .send(renderOauthPage("Connection failed", `Connection was not completed: ${error}`, "error"));
    }
    if (!code)
        return fail(res, 400, "Missing authorization code");
    const callbackUrl = `${getPublicUrl()}/v1/oauth/composio/callback`;
    const clientId = activeOauthClientId();
    const tokenUrl = getComposioOauthTokenUrl();
    try {
        const tokenResponse = await fetch(tokenUrl, {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: callbackUrl,
                client_id: clientId,
                code_verifier: session.codeVerifier
            }).toString()
        });
        const tokenPayload = (await tokenResponse.json());
        if (!tokenResponse.ok || !tokenPayload.access_token) {
            return res
                .status(502)
                .type("text/html")
                .send(renderOauthPage("Connection failed", "Token exchange failed on callback.", "error"));
        }
        runtimeMcpAuthByUserRef.set(session.userRef, {
            authorization: `Bearer ${tokenPayload.access_token}`,
            provider: session.provider,
            updatedAt: Date.now(),
            expiresAt: tokenPayload.expires_in ? Date.now() + tokenPayload.expires_in * 1000 : undefined
        });
    }
    catch {
        return res
            .status(502)
            .type("text/html")
            .send(renderOauthPage("Connection failed", "Token exchange failed on callback.", "error"));
    }
    // Router-only runtime contract:
    // keep OAuth result in runtime process memory and mark provider as connected.
    setProviderConnection(session.userRef, session.provider, true);
    return res
        .status(200)
        .type("text/html")
        .send(renderOauthPage("Connection complete", "Your account is connected. You can close this tab.", "success"));
});
app.post("/v1/tools/execute", requireApiKey, (req, res) => {
    const userRef = queryString(req.body?.user_ref);
    const providerRaw = queryString(req.body?.provider);
    const tool = queryString(req.body?.tool);
    const input = req.body?.input;
    if (!userRef)
        return fail(res, 400, "Missing user_ref");
    if (!isProvider(providerRaw))
        return fail(res, 400, "Missing or invalid provider");
    if (!tool)
        return fail(res, 400, "Missing tool");
    const state = getProviderConnection(userRef, providerRaw);
    if (!state?.connected) {
        return fail(res, 409, "Provider not connected. Call /v1/onboarding/connect_url first.");
    }
    // Router-only contract: this backend does not execute provider API calls.
    // It returns an execution envelope for the Composio layer.
    res.json({
        ok: true,
        routed: true,
        mode: "router_only",
        user_ref: userRef,
        provider: providerRaw,
        tool,
        input,
        forwardTo: "composio",
        note: "Replace this envelope with your Composio execution adapter when you attach server-to-server credentials."
    });
});
const port = getPort();
const host = getHost();
app.listen(port, host, () => {
    console.log(`composio_engine listening at http://${host}:${port}`);
});
//# sourceMappingURL=server.js.map