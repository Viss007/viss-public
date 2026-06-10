#Requires -Version 5.1
<#
  Single-stack launcher: stops any prior chatgpt_mcp_server + railway_tunnel agent from this repo,
  then starts one MCP server (memory mode) and one tunnel agent. Uses a mutex so two terminals
  cannot run this script at once.

  Prereqs: npm run build in Public/automations/chatgpt_mcp_server and railway_tunnel; railway CLI linked.

  ChatGPT URL: https://<railway-host>/mcp  (see railway domain --json)
#>
[CmdletBinding()]
param(
  [switch]$NoStop,
  [int]$McpPort = 2091
)

$ErrorActionPreference = "Stop"

$mtx = New-Object System.Threading.Mutex($false, "Global\ChatGPTRailwayTunnelStackV1")
$acquired = $false
try {
  if (-not $mtx.WaitOne(0)) {
    Write-Host "Another run-railway-tunnel.ps1 is already running (mutex held).`nClose the other window, or run: npm run stop:railway-tunnel`nThen retry." -ForegroundColor Yellow
    exit 1
  }
  $acquired = $true

  $here = $PSScriptRoot
  $chatgptDir = (Resolve-Path (Join-Path $here "..")).Path
  $repoRoot = (Resolve-Path (Join-Path $chatgptDir "..\..")).Path
  $railwayTunnelDir = Join-Path $repoRoot "railway_tunnel"

  if (-not (Test-Path (Join-Path $railwayTunnelDir "dist\agent.js"))) {
    Write-Error "Build railway_tunnel first: cd '$railwayTunnelDir'; npm ci; npm run build"
  }
  if (-not (Test-Path (Join-Path $chatgptDir "dist\server.js"))) {
    Write-Error "Build chatgpt_mcp_server first: cd '$chatgptDir'; npm ci; npm run build"
  }

  if (-not $NoStop) {
    & (Join-Path $here "stop-railway-chatgpt-stack.ps1") -Port $McpPort
    Start-Sleep -Milliseconds 300
    $probe = Test-NetConnection -ComputerName 127.0.0.1 -Port $McpPort -WarningAction SilentlyContinue
    if ($probe.TcpTestSucceeded) {
      Write-Host "[run] Port $McpPort still busy - second pass (ForcePort)..."
      & (Join-Path $here "stop-railway-chatgpt-stack.ps1") -Port $McpPort -ForcePort
      Start-Sleep -Milliseconds 400
    }
  }

  $public = "https://railway-tunnel-production-3ab7.up.railway.app"
  Push-Location $railwayTunnelDir
  try {
    $dj = railway domain --json 2>$null | ConvertFrom-Json
    if ($dj.domains -and $dj.domains[0]) {
      $public = ($dj.domains[0] -replace '/$', '')
    }
  } catch { }
  Pop-Location

  Write-Host ""
  Write-Host "RAILWAY_TUNNEL_SERVER=$public  (override env if needed)"
  Write-Host "LOCAL_URL=http://127.0.0.1:$McpPort"
  Write-Host ""

  $env:CHATGPT_TOOL_MODE = "memory"
  $env:MCP_HOST = "0.0.0.0"
  $env:MCP_PORT = "$McpPort"

  $mcpProc = Start-Process -FilePath "node" -ArgumentList "dist/server.js" -WorkingDirectory $chatgptDir -PassThru -WindowStyle Hidden
  if (-not $mcpProc) {
    Write-Error "Failed to start chatgpt_mcp_server"
  }

  for ($i = 0; $i -lt 50; $i++) {
    $ok = Test-NetConnection -ComputerName 127.0.0.1 -Port $McpPort -WarningAction SilentlyContinue
    if ($ok.TcpTestSucceeded) { break }
    if ($mcpProc.HasExited) {
      Write-Error "chatgpt_mcp_server exited early (PID $($mcpProc.Id))"
    }
    Start-Sleep -Milliseconds 200
    if ($i -eq 49) {
      Stop-Process -Id $mcpProc.Id -Force -ErrorAction SilentlyContinue
      Write-Error "chatgpt_mcp_server did not listen on $McpPort"
    }
  }

  Write-Host "chatgpt_mcp_server PID $($mcpProc.Id) on http://127.0.0.1:$McpPort"
  Write-Host "Paste in ChatGPT: $public/mcp  (Authentication: none unless you added OAuth)"
  Write-Host "Ctrl+C stops the tunnel agent; the MCP server will be stopped automatically."
  Write-Host ""

  Set-Location $railwayTunnelDir
  $env:RAILWAY_TUNNEL_SERVER = if ($env:RAILWAY_TUNNEL_SERVER) { $env:RAILWAY_TUNNEL_SERVER } else { $public }
  $env:LOCAL_URL = "http://127.0.0.1:$McpPort"

  # Node WSS to Railway often fails on Windows with "unable to verify the first certificate"
  # (revocation / CRL). MCP server above keeps normal TLS; only railway run sees relax.
  $relaxTunnelTls = ($env:OS -eq "Windows_NT") -and ($env:CHATGPT_TUNNEL_STRICT_TLS -ne "1")
  if ($relaxTunnelTls) {
    Write-Host "[run] Tunnel WSS: NODE_TLS_REJECT_UNAUTHORIZED=0 for this step only (CHATGPT_TUNNEL_STRICT_TLS=1 to disable)"
    $env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
  }

  try {
    railway run node dist/agent.js
  } finally {
    if ($relaxTunnelTls) {
      Remove-Item Env:\NODE_TLS_REJECT_UNAUTHORIZED -ErrorAction SilentlyContinue
    }
    if ($mcpProc -and -not $mcpProc.HasExited) {
      Write-Host ('[run] Stopping chatgpt_mcp_server PID {0}...' -f $mcpProc.Id)
      Stop-Process -Id $mcpProc.Id -Force -ErrorAction SilentlyContinue
    }
  }
} finally {
  if ($acquired) {
    [void]$mtx.ReleaseMutex()
  }
  $mtx.Dispose()
}
