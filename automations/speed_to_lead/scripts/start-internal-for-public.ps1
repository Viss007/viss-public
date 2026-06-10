# Loopback child for Public :3333; proxied at /automations/speed-to-lead/*
$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $PSScriptRoot
Set-Location $here

if (-not (Test-Path "node_modules")) {
  Write-Host "[speed_to_lead] npm install in $here"
  npm install --omit=dev
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

if (-not $env:PORT) { $env:PORT = "3001" }
if (-not $env:GOOGLE_REDIRECT_URI) {
  $env:GOOGLE_REDIRECT_URI = "http://127.0.0.1:3333/automations/speed-to-lead/auth/google/callback"
}

Write-Host ("[speed_to_lead] internal http://127.0.0.1:{0} proxied at /automations/speed-to-lead on 3333" -f $env:PORT)
node server.mjs
