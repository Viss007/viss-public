# Loopback child for Public :3333; proxied at /agents/docs-agent/*
$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $PSScriptRoot
Set-Location $here

if (-not (Test-Path "node_modules")) {
  Write-Host "[docs_agent] npm install in $here"
  npm install --omit=dev
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

if (-not $env:PORT) { $env:PORT = "3000" }
if (-not $env:GOOGLE_REDIRECT_URI) {
  $env:GOOGLE_REDIRECT_URI = "http://127.0.0.1:3333/agents/docs-agent/auth/google/callback"
}
if (-not $env:INVOICE_TRUST_PROXY) { $env:INVOICE_TRUST_PROXY = "1" }

Write-Host ("[docs_agent] internal http://127.0.0.1:{0} proxied at /agents/docs-agent on 3333" -f $env:PORT)
node server.mjs
