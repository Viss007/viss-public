# Package agents/docs_agent for viss-public + cloud agent video (no full portfolio).
$ErrorActionPreference = "Stop"
$PublicRoot = Split-Path $PSScriptRoot -Parent
$Src = Join-Path $PublicRoot "agents\docs_agent"
$Dest = Join-Path $PublicRoot "video-export\agents\docs_agent"

if (-not (Test-Path $Src)) {
  throw "Missing source: $Src"
}

$copyDirs = @("lib", "public", "fixtures")
$copyFiles = @(
  "server.mjs",
  "package.json",
  "package-lock.json",
  ".env.example",
  ".gitignore",
  "Dockerfile"
)

if (Test-Path $Dest) {
  Remove-Item -Recurse -Force $Dest
}
New-Item -ItemType Directory -Path $Dest -Force | Out-Null

foreach ($d in $copyDirs) {
  $from = Join-Path $Src $d
  if (Test-Path $from) {
    Copy-Item -Recurse -Force $from (Join-Path $Dest $d)
  }
}

$smoke = Join-Path $Src "scripts\smoke-test.mjs"
if (Test-Path $smoke) {
  New-Item -ItemType Directory -Path (Join-Path $Dest "scripts") -Force | Out-Null
  Copy-Item -Force $smoke (Join-Path $Dest "scripts\smoke-test.mjs")
}

foreach ($f in $copyFiles) {
  $from = Join-Path $Src $f
  if (Test-Path $from) {
    Copy-Item -Force $from (Join-Path $Dest $f)
  }
}

Copy-Item -Force (Join-Path $Src "README.cloud-video.md") (Join-Path $Dest "README.md")

@'
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [[ ! -f .env ]]; then
  echo "Copy .env.example to .env and set OPENAI_API_KEY" >&2
  exit 1
fi
if [[ ! -d node_modules ]]; then
  npm install
fi
export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-3000}"
export INVOICE_DEMO_MAX_PROCESSES_PER_IP="${INVOICE_DEMO_MAX_PROCESSES_PER_IP:-0}"
exec node server.mjs
'@ | Set-Content -Path (Join-Path $Dest "start.sh") -Encoding utf8NoBOM -NoNewline
# Ensure trailing newline for POSIX
Add-Content -Path (Join-Path $Dest "start.sh") -Value ""

@'
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
'@ | Set-Content -Path (Join-Path $Dest "start.ps1") -Encoding utf8

$gitignore = Join-Path $Dest ".gitignore"
if (Test-Path $gitignore) {
  $gi = Get-Content $gitignore -Raw
  if ($gi -notmatch "video-export") {
    # unchanged — export uses same gitignore as source
  }
}

Write-Host "Packaged docs_agent video studio -> $Dest"
Write-Host "Next: push video-export/agents/docs_agent to github.com/Viss007/viss-public (agents/docs_agent)"
