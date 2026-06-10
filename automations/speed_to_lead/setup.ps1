#Requires -Version 5.1
<#
  One-shot setup for speed_lead (npm deps + Redis >= 5 check for BullMQ).
  Run from anywhere:
    pwsh -NoProfile -ExecutionPolicy Bypass -File "C:\path\to\VissAI\speed_lead\setup.ps1"
  Or from repo:
    pwsh -NoProfile -ExecutionPolicy Bypass -File .\speed_lead\setup.ps1
#>
$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

Write-Host "speed_lead setup (cwd: $(Get-Location))" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js not found in PATH. Install Node LTS, then re-run this script."
  exit 1
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Error "npm not found in PATH."
  exit 1
}

Write-Host "`nnpm install" -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`nRedis check (BullMQ needs Redis protocol >= 5.x; Memurai default 127.0.0.1:6379)" -ForegroundColor Cyan
node .\check-redis.mjs
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Fix: install Memurai Developer from https://memurai.com/get-memurai (listen 6379), or set REDIS_URL to Redis 5+." -ForegroundColor Yellow
  exit 1
}

Write-Host ""
Write-Host "Done. Start the stub:" -ForegroundColor Green
Write-Host "  cd `"$PSScriptRoot`""
Write-Host "  npm start"
Write-Host ""
Write-Host "Optional env (defaults already match Memurai):" -ForegroundColor DarkGray
Write-Host '  $env:REDIS_URL = "redis://127.0.0.1:6379"'
