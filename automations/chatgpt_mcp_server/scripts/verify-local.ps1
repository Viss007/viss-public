# Smoke-test ChatGPT MCP bridge on loopback (server must already be running).
# - GET /health, POST /process-lead (REST)
# - Streamable HTTP MCP JSON-RPC via scripts/mcp-http-roundtrip.mjs (initialize -> tools/list)
#
# MCP session behavior (see server.ts): First POST is JSON-RPC initialize (no session header).
# Server returns session in response header `mcp-session-id` and body `result._meta.mcpSessionId`.
# tools/list sends header `Mcp-Session-Id: <uuid>`.

$ErrorActionPreference = "Stop"

function Step-Fail([string]$Msg) {
  Write-Host "FAIL: $Msg" -ForegroundColor Red
  $script:AllOk = $false
}

function Step-Pass([string]$Msg) {
  Write-Host "PASS: $Msg" -ForegroundColor Green
}

$script:AllOk = $true

if (-not $env:MCP_PORT) { $env:MCP_PORT = "2091" }
$port = [string]$env:MCP_PORT.Trim()

if ($env:MCP_VERIFY_HTTP_BASE -and $env:MCP_VERIFY_HTTP_BASE.Trim().Length -gt 0) {
  $baseRoot = $env:MCP_VERIFY_HTTP_BASE.TrimEnd('/')
} else {
  $baseRoot = "http://127.0.0.1:$port"
}

$healthUrl = "$baseRoot/health"

Write-Host "=== verify-local (REST + MCP Streamable HTTP) ==="
Write-Host "Base: $baseRoot"

# --- GET /health ---
Write-Host "`nGET $healthUrl"
try {
  $health = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 15
  $health | ConvertTo-Json -Depth 6
  if ($health.ok -eq $true) {
    Step-Pass "local /health (ok=true)"
  } else {
    Step-Fail "local /health missing ok=true"
  }
} catch {
  Step-Fail "local /health request failed ($_)"
  $health = $null
}

# --- POST /process-lead ---
Write-Host "`nPOST $baseRoot/process-lead"
try {
  $body = @{
    email  = "e2e@example.com"
    name   = "E2E Verify"
    source = "verify-local"
  } | ConvertTo-Json -Compress

  $lead = Invoke-RestMethod -Uri "$baseRoot/process-lead" -Method Post -ContentType "application/json; charset=utf-8" -Body $body -TimeoutSec 15
  $lead | ConvertTo-Json -Depth 5
  if (-not $lead.ok -or -not $lead.leadId) {
    Step-Fail "process-lead did not return ok + leadId"
  } else {
    Step-Pass "process-lead (ok + leadId)"
  }
} catch {
  Step-Fail "process-lead failed ($_)"
}

# --- MCP initialize + tools/list (Node fetch; reliable JSON on Windows PowerShell 5.x) ---
$mcpPostUrl = "$baseRoot/mcp"
Write-Host "`nMCP POST $mcpPostUrl (JSON-RPC via node)"
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Step-Fail "node not on PATH (required for MCP round-trip script)"
} else {
  try {
    & node (Join-Path $PSScriptRoot "mcp-http-roundtrip.mjs") --url $mcpPostUrl
    if ($LASTEXITCODE -ne 0) {
      $script:AllOk = $false
    }
  } catch {
    Step-Fail "MCP round-trip runner failed ($_)"
  }
}

# --- POST dimensional health (8811) when /health exposes URL ---
if ($health -and $health.dimensionalHttpUrl) {
  $dimUrl = [string]$health.dimensionalHttpUrl.Trim()
  Write-Host "`nPOST dimensional health $dimUrl"
  try {
    $dhBody = '{"action":"health","params":{}}'
    $dh = Invoke-RestMethod -Uri $dimUrl -Method Post -Body $dhBody -ContentType "application/json; charset=utf-8" -TimeoutSec 12
    if ($dh.status -eq "ok") {
      Step-Pass "memory_agent / 8811 dimensional health (status=ok)"
    } else {
      Step-Fail "8811 dimensional health unexpected status (expected status=ok)"
    }
  } catch {
    Step-Fail "8811 dimensional health POST failed ($_)"
  }
} elseif ($health) {
  Write-Host "`nSKIP: dimensional health (no dimensionalHttpUrl on /health JSON)"
} else {
  Write-Host "`nSKIP: dimensional health (no healthy /health response)"
}

Write-Host ""
if (-not $script:AllOk) {
  Write-Host "verify-local: FAILED" -ForegroundColor Red
  exit 1
}
Write-Host "verify-local: ALL PASS" -ForegroundColor Green
