#Requires -Version 5.1
<#
  Stops Node processes for this workspace chatgpt_mcp_server (dist/server.js) and
  railway_tunnel (dist/agent.js) so only one stack runs (avoids WebSocket 4000 replaced
  and port conflicts).

  Optional -ForcePort: if port still in use, stop listener only when it looks like node + server.js.

  Usage: .\stop-railway-chatgpt-stack.ps1 [-Port 2091] [-ForcePort]
#>
[CmdletBinding()]
param(
  [int]$Port = 2091,
  [switch]$ForcePort
)

$ErrorActionPreference = "Stop"

$here = $PSScriptRoot

function Stop-NodeByCommandLineMatch {
  param(
    [string]$MustContainPath,
    [string]$MustContainArg
  )
  Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue |
    ForEach-Object {
      $cl = $_.CommandLine
      if ($null -eq $cl) { return }
      $norm = $cl.ToLowerInvariant()
      $pathOk = $norm.Contains($MustContainPath.ToLowerInvariant())
      $argOk = $norm.Contains($MustContainArg.ToLowerInvariant())
      if ($pathOk -and $argOk) {
        Write-Host "[stop-stack] Stopping PID $($_.ProcessId) (matched $MustContainArg)"
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
      }
    }
}

function Stop-RailwayTunnelAgentProcesses {
  <#
    Railway CLI runs: node ...\@railway\cli\bin\railway.js run node dist/agent.js
    The child is often: node dist/agent.js (no "railway_tunnel" in the command line), so path-based
    matching misses it. Stopping these avoids duplicate WebSocket clients (4000 replaced).
  #>
  Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue |
    ForEach-Object {
      $cl = $_.CommandLine
      if ($null -eq $cl) { return }
      $norm = $cl.ToLowerInvariant()
      if ($norm.Contains('@railway\cli') -and ($norm.Contains('dist/agent') -or $norm.Contains('dist\agent'))) {
        Write-Host "[stop-stack] Stopping PID $($_.ProcessId) (railway CLI tunnel)"
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
        return
      }
      if ($cl.Length -le 128 -and $norm -match '^\s*"?node(\.exe)?"?\s+dist[/\\]agent\.js\s*$') {
        Write-Host "[stop-stack] Stopping PID $($_.ProcessId) (tunnel dist/agent.js)"
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
      }
    }
}

Write-Host "[stop-stack] Stopping prior chatgpt_mcp_server + railway_tunnel agent (if any)..."
Stop-NodeByCommandLineMatch -MustContainPath "chatgpt_mcp_server" -MustContainArg "dist\server.js"
Stop-NodeByCommandLineMatch -MustContainPath "chatgpt_mcp_server" -MustContainArg "dist/server.js"
Stop-NodeByCommandLineMatch -MustContainPath "railway_tunnel" -MustContainArg "dist\agent.js"
Stop-NodeByCommandLineMatch -MustContainPath "railway_tunnel" -MustContainArg "dist/agent.js"
Stop-RailwayTunnelAgentProcesses

Start-Sleep -Milliseconds 400

if ($ForcePort -and $Port -gt 0) {
  $listeners = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($procId in $listeners) {
    if (-not $procId) { continue }
    $p = Get-CimInstance Win32_Process -Filter "ProcessId = $procId" -ErrorAction SilentlyContinue
    if (-not $p) { continue }
    $cl = $p.CommandLine
    if ($null -eq $cl) { continue }
    if ($cl -match 'node' -and $cl -match 'server\.js' -and $cl -match 'chatgpt_mcp_server') {
      Write-Host "[stop-stack] Port $Port still held by PID $procId - stopping"
      Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
  }
}

$still = Test-NetConnection -ComputerName 127.0.0.1 -Port $Port -WarningAction SilentlyContinue
if ($still.TcpTestSucceeded) {
  Write-Warning "[stop-stack] Port $Port is still open. Close the process manually or re-run with -ForcePort"
} else {
  Write-Host "[stop-stack] Port $Port is free."
}
