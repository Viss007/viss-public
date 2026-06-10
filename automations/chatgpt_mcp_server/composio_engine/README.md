# composio_engine

Router-only backend for GPT-driven BYO Composio onboarding.

## Operator fast lane (~2 minutes)

From **`chatgpt_mcp_server/composio_engine/`**:

```powershell
copy .env.example .env
notepad .env
```

Minimum honest smoke (URLs must be real strings; swap Composio host if yours differs):

- `INTERNAL_API_KEY` — any non-empty dev secret
- `ENGINE_PUBLIC_URL=http://127.0.0.1:3088`
- `COMPOSIO_ONBOARDING_BASE_URL=https://backend.composio.dev`

Then:

```powershell
npm install
npm run build
npm start
```

Sanity: **`GET http://127.0.0.1:3088/v1/health`** — service up; `config_ready` flips when onboarding URLs match your setup.

## Product contract

- This backend is glue/routing only.
- It does not call provider APIs directly.
- It does not manage provider OAuth tokens.
- It generates onboarding redirect URLs and tracks simple connection state.
- Connect flow is new-user safe: it starts at Composio sign-in/sign-up and then continues to provider OAuth.

## Quick start

1. Copy `.env.example` to `.env` and fill values.
2. Install and build:

```powershell
npm install
npm run build
```

3. Run:

```powershell
npm start
```

Default URL: `http://localhost:3088`.

**Config:** `src/env.ts` loads `chatgpt_mcp_server/composio_engine/.env` at startup (not dependent on shell cwd). `GET /v1/health` returns `config_ready: true` when `ENGINE_PUBLIC_URL` and `COMPOSIO_ONBOARDING_BASE_URL` are set. For local dev, set `ENGINE_PUBLIC_URL=http://127.0.0.1:3088` (or your tunnel URL). Production: use your public HTTPS `ENGINE_PUBLIC_URL` for OAuth callbacks.

## Endpoints

- `GET /v1/health` (public)
- `GET /v1/onboarding/status?user_ref=...&provider=google_sheets|instagram`
- `GET /v1/onboarding/connect_url?user_ref=...&provider=...`
- `GET /v1/onboarding/callback?state=...` (public browser callback)
- `POST /v1/tools/execute`

All secured endpoints require `X-API-Key: INTERNAL_API_KEY`.

## Onboarding flow contract

- `onboarding/connect_url` returns:
  - `connectUrl`: first URL GPT should give the user (direct provider-connect fast path).
  - `providerConnectUrl`: same direct provider connection URL.
  - `signupUrl`: use only if Composio requires sign-up/sign-in first.
- `onboarding/status` returns:
  - `needs_composio_account`: `true` until first successful callback for that user.
  - `provider_connected`: provider-level connection state.

## OpenAPI

Use `openapi/composio_engine.openapi.yaml` in Custom GPT actions after replacing `servers.url`.
