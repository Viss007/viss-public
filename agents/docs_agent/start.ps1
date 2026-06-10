# Cloud video studio — npm start on port 3000
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if (-not (Test-Path .env)) {
  Copy-Item .env.example .env
  Write-Host "Created .env — set OPENAI_API_KEY then re-run."
  exit 1
}
if (-not (Test-Path node_modules)) { npm install }
$env:HOST = if ($env:HOST) { $env:HOST } else { "127.0.0.1" }
$env:PORT = if ($env:PORT) { $env:PORT } else { "3000" }
$env:INVOICE_DEMO_MAX_PROCESSES_PER_IP = if ($env:INVOICE_DEMO_MAX_PROCESSES_PER_IP) { $env:INVOICE_DEMO_MAX_PROCESSES_PER_IP } else { "0" }
npm start
