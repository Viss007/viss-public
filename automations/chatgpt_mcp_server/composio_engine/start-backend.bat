@echo off
setlocal

REM Composio Engine backend launcher (separate terminal)
REM Usage: double-click this file or run it from cmd/powershell.

set HOST=0.0.0.0
set PORT=3088
set INTERNAL_API_KEY=local-dev-key
set ENGINE_PUBLIC_URL=https://rundown-baking-chump.ngrok-free.dev
set COMPOSIO_ONBOARDING_BASE_URL=https://app.composio.dev
set COMPOSIO_CONNECT_URL_TEMPLATE=https://app.composio.dev/connections/new?provider={provider}&user={user_ref}
set COMPOSIO_ONBOARDING_URL_TEMPLATE=https://app.composio.dev/sign-in?next={provider_connect_url}
set COMPOSIO_OAUTH_AUTHORIZE_URL=https://connect.composio.dev/api/v3/auth/dash/oauth2/authorize

echo Building composio_engine...
call npm run build
if errorlevel 1 (
  echo Build failed.
  exit /b 1
)

echo Starting composio_engine on port %PORT%...
call npm start

endlocal
