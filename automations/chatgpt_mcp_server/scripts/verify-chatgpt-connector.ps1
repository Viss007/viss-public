#Requires -Version 5.1
<#
  Preflight before ChatGPT UI: built artifacts, MCP /health, Railway /health,
  POST dimensional health (8811), dimensional URL from MCP health body.

  Usage (from Public/automations/chatgpt_mcp_server):
    npm run verify:chatgpt
    .\scripts\verify-chatgpt-connector.ps1 -PublicUrl https://your-host.up.railway.app
#>
[CmdletBinding()]
param(
  [int]$McpPort = 2091,
  [string]$PublicUrl = ""
)

$ErrorActionPreference = "Continue"
$here = $PSScriptRoot
$chatgptDir = (Resolve-Path (Join-Path $here "..")).Path
$repoRoot = (Resolve-Path (Join-Path $chatgptDir "..\..")).Path
$railwayTunnelDir = Join-Path $repoRoot "railway_tunnel"

$script:ok = $true

function Step-Fail($msg) {
  Write-Host "[fail] $msg" -ForegroundColor Red
  $script:ok = $false
}

function Get-RailwayHealthJson {
  param([string]$baseUrl)
  $u = "$($baseUrl.TrimEnd('/'))/health"
  try {
    $json = Invoke-RestMethod -Uri $u -Method Get -TimeoutSec 15
    return @($json, $null)
  } catch {
    $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
    if (-not $curl) { return @($null, $_.Exception.Message) }
    $raw = & curl.exe -fsS -m 15 -k $u 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $raw) { return @($null, "curl exit $LASTEXITCODE") }
    try {
      return @(($raw | ConvertFrom-Json), $null)
    } catch {
      return @($null, "invalid JSON from curl")
    }
  }
}

Write-Host "`n=== ChatGPT connector preflight ===`n"

if (-not (Test-Path (Join-Path $chatgptDir "dist\server.js"))) {
  Step-Fail "chatgpt_mcp_server not built (missing dist/server.js). Run: npm run build"
} else {
  Write-Host "[ok] chatgpt_mcp_server dist/server.js present" -ForegroundColor Green
}

if (-not (Test-Path (Join-Path $railwayTunnelDir "dist\agent.js"))) {
  Step-Fail "railway_tunnel not built (missing dist/agent.js). Run: npm run build:stack"
} else {
  Write-Host "[ok] railway_tunnel dist/agent.js present" -ForegroundColor Green
}

$mcpJson = $null
$mcpHealthy = $false
$listen = Test-NetConnection -ComputerName 127.0.0.1 -Port $McpPort -WarningAction SilentlyContinue
if ($listen.TcpTestSucceeded) {
  try {
    $mcpJson = Invoke-RestMethod -Uri "http://127.0.0.1:$McpPort/health" -Method Get -TimeoutSec 8
    if ($mcpJson.ok -eq $true) {
      Write-Host "PASS: MCP health (GET http://127.0.0.1:$McpPort/health ok=true)" -ForegroundColor Green
      $mcpHealthy = $true
    } else {
      Step-Fail "MCP /health returned ok!=true"
      Write-Host "FAIL: MCP health (response missing ok=true)" -ForegroundColor Red
    }
  } catch {
    Step-Fail "MCP /health request failed"
    Write-Host "FAIL: MCP health ($_)" -ForegroundColor Red
  }
} else {
  Step-Fail "Nothing listening on MCP port $McpPort"
  Write-Host "FAIL: MCP health (port $McpPort closed - run npm run run:railway-tunnel)" -ForegroundColor Red
}

$dimUrlUsed = $null
if ($mcpHealthy -and $mcpJson) {
  if ($mcpJson.dimensionalHttpUrl) {
    $dimUrlUsed = [string]$mcpJson.dimensionalHttpUrl
  } else {
    $dimUrlUsed = "http://127.0.0.1:8811/api/dimensional"
  }
  Write-Host "PASS: dimensional URL used by MCP - $dimUrlUsed" -ForegroundColor Green
} else {
  Write-Host "SKIP: dimensional URL from MCP (needs healthy MCP /health)" -ForegroundColor DarkYellow
}

if (-not $PublicUrl) {
  Push-Location $railwayTunnelDir
  try {
    $dj = railway domain --json 2>$null | ConvertFrom-Json
    if ($dj.domains -and $dj.domains[0]) {
      $PublicUrl = ($dj.domains[0] -replace "/$", "")
    }
  } catch { }
  Pop-Location
}

if ($PublicUrl) {
  $base = $PublicUrl.TrimEnd("/")
  $rail = Get-RailwayHealthJson -baseUrl $base
  $th = $rail[0]
  $railErr = $rail[1]
  if ($null -ne $th -and $th.agent_connected -eq $true) {
    Write-Host "PASS: Railway tunnel connection ($base/health agent_connected=true)" -ForegroundColor Green
  } elseif ($null -ne $th) {
    Step-Fail "Railway agent_connected=false"
    Write-Host "FAIL: Railway tunnel connection ($base/health agent_connected=false - keep npm run run:railway-tunnel running)" -ForegroundColor Red
  } else {
    Step-Fail "Railway /health unreachable"
    Write-Host "FAIL: Railway tunnel connection (could not GET $base/health : $railErr)" -ForegroundColor Red
  }
} else {
  Write-Host "SKIP: Railway tunnel (no PublicUrl - run from repo with railway CLI linked or pass -PublicUrl)" -ForegroundColor DarkYellow
}

if ($mcpHealthy -and $dimUrlUsed) {
  try {
    $body = '{"action":"health","params":{}}'
    $dh = Invoke-RestMethod -Uri $dimUrlUsed -Method Post -Body $body -ContentType "application/json; charset=utf-8" -TimeoutSec 10
    if ($dh.status -eq "ok") {
      Write-Host "PASS: memory_agent / 8811 dimensional health (POST $dimUrlUsed -> status=ok)" -ForegroundColor Green
    } else {
      Step-Fail "Dimensional health status not ok"
      Write-Host "FAIL: memory_agent / 8811 health (unexpected body)" -ForegroundColor Red
    }
  } catch {
    Step-Fail "Dimensional health POST failed"
    Write-Host "FAIL: memory_agent / 8811 ($_)" -ForegroundColor Red
  }
} else {
  Write-Host "SKIP: memory_agent / 8811 (needs healthy MCP and dimensional URL)" -ForegroundColor DarkYellow
}

Write-Host "`n--- Public MCP Streamable HTTP (optional env) ---"
$pubMcpEnv = $env:CHATGPT_MCP_PUBLIC_URL
if (-not $pubMcpEnv -or $pubMcpEnv.Trim().Length -eq 0) { $pubMcpEnv = $env:RAILWAY_MCP_URL }

if ($pubMcpEnv -and $pubMcpEnv.Trim().Length -gt 0) {
  $pubMcpTrim = $pubMcpEnv.Trim()
  $mcpUri = $null
  try {
    $mcpUri = New-Object System.Uri $pubMcpTrim
  } catch {
    Step-Fail "invalid CHATGPT_MCP_PUBLIC_URL / RAILWAY_MCP_URL ($_)"
  }

  if ($null -ne $mcpUri) {
    $pubOrigin = $mcpUri.GetLeftPart([UriPartial]::Authority)
    $publicUrlOrigin = $null
    if ($PublicUrl -and $PublicUrl.Trim().Length -gt 0) {
      $publicUrlOrigin = ([Uri]($PublicUrl.TrimEnd('/'))).GetLeftPart([UriPartial]::Authority)
    }
    if ($publicUrlOrigin -and ($pubOrigin -ieq $publicUrlOrigin)) {
      Write-Host "SKIP: duplicate GET $pubOrigin/health (already verified via PublicUrl / railway domain)" -ForegroundColor DarkYellow
    } else {
      $rh = Get-RailwayHealthJson -baseUrl $pubOrigin
      $tj = $rh[0]
      $terr = $rh[1]
      if ($null -ne $tj -and $tj.agent_connected -eq $true) {
        Write-Host "PASS: public origin /health (agent_connected=true) $pubOrigin" -ForegroundColor Green
      } elseif ($null -ne $tj) {
        Step-Fail "public origin Railway /health agent_connected=false ($pubOrigin)"
        Write-Host "FAIL: public origin /health agent_connected=false - keep npm run run:railway-tunnel running" -ForegroundColor Red
      } else {
        Step-Fail "public origin /health unreachable ($pubOrigin)"
        Write-Host "FAIL: could not GET $pubOrigin/health : $terr" -ForegroundColor Red
      }
    }

    $nodePub = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodePub) {
      Step-Fail "node not on PATH (required for public MCP round-trip)"
    } else {
      Write-Host "Running MCP round-trip against env URL (initialize + tools/list)..."
      & node (Join-Path $here "mcp-http-roundtrip.mjs") --url $pubMcpTrim
      if ($LASTEXITCODE -ne 0) {
        Step-Fail "public MCP round-trip failed (exit $LASTEXITCODE)"
      }
    }
  }
} else {
  Write-Host "SKIP: public MCP JSON-RPC round-trip - set CHATGPT_MCP_PUBLIC_URL or RAILWAY_MCP_URL (full URL https://<host>/mcp)" -ForegroundColor DarkYellow
}

Write-Host "`n--- Paste in ChatGPT (New App / Connector) ---"
Write-Host "Never use port 8811 or http://127.0.0.1:8811 as the ChatGPT connector URL."
if ($PublicUrl) {
  Write-Host "MCP Server URL: $($PublicUrl.TrimEnd('/'))/mcp"
} else {
  Write-Host "MCP Server URL: https://<your-railway-host>/mcp   (run: cd railway_tunnel && railway domain)"
}
Write-Host "Authentication: none (unless you added OAuth to this server)"
Write-Host "Leave npm run run:railway-tunnel running while testing.`n"

if (-not $script:ok) { exit 1 }
