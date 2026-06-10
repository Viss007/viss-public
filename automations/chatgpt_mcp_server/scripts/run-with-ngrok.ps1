# End-to-end: build + MCP + ngrok + generated OpenAPI for ChatGPT (copy-paste one file).
# https://developers.openai.com/apps-sdk/deploy
#
# Important: the ngrok agent exposes inspect API on http://127.0.0.1:4040 by default.
# If another ngrok is already running, a second agent often cannot bind 4040 — this script
# then picks the tunnel whose config.addr forwards to MCP_PORT (not the first https URL).
# Stop stray ngrok.exe processes if READY never matches your local server.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Get-HttpsTunnelUrlForLocalPort {
  param(
    [Parameter(Mandatory = $true)][int] $LocalPort,
    [Parameter(Mandatory = $true)] $TunnelsResponse
  )
  $list = @($TunnelsResponse.tunnels)
  foreach ($x in $list) {
    $addr = $null
    if ($null -ne $x.config -and $null -ne $x.config.addr) { $addr = [string]$x.config.addr }
    if (-not $addr) { continue }
    # e.g. http://localhost:2091 — match :{port} at end (avoid picking another agent's tunnel)
    $portPat = ':{0}$' -f $LocalPort
    if ($addr -match $portPat) {
      $pu = $x.public_url
      if ($pu -like 'https://*') { return $pu }
    }
  }
  return $null
}

Write-Host "[1/5] npm run build ..."
npm run build

if (-not $env:MCP_PORT) { $env:MCP_PORT = "2091" }
$mcpPort = [int]$env:MCP_PORT
$env:MCP_HOST = "0.0.0.0"

$busy = @(Get-NetTCPConnection -LocalPort $mcpPort -State Listen -ErrorAction SilentlyContinue)
if ($busy.Count -gt 0) {
  $pids = $busy.OwningProcess | Sort-Object -Unique
  $info = ($pids | ForEach-Object { "PID $_ ($(try { (Get-Process -Id $_ -ErrorAction Stop).ProcessName } catch { '?' }))" }) -join ', '
  throw "Port $mcpPort is already in use ($info). Stop that process (often a stale node dist/server.js) or set MCP_PORT to a free port, then rerun."
}

Write-Host "[2/5] Starting MCP on http://0.0.0.0:$mcpPort ..."
$job = Start-Job -ScriptBlock {
  param($dir, $port)
  Set-Location $dir
  $env:MCP_HOST = "0.0.0.0"
  $env:MCP_PORT = "$port"
  node dist/server.js
} -ArgumentList $root, $mcpPort

$localBase = "http://127.0.0.1:$mcpPort"
$healthOk = $false
foreach ($i in 1..40) {
  Start-Sleep -Milliseconds 250
  if ($job.State -eq "Failed") {
    Receive-Job $job -ErrorAction SilentlyContinue | Write-Host
    throw "MCP server job failed (see output above). Is port $mcpPort already in use?"
  }
  try {
    $h = Invoke-RestMethod -Uri "$localBase/health" -TimeoutSec 2
    if ($h.leadPath -eq '/process-lead') { $healthOk = $true; break }
  }
  catch {}
}
if (-not $healthOk) {
  Receive-Job $job -ErrorAction SilentlyContinue | Write-Host
  Stop-Job -Job $job -ErrorAction SilentlyContinue
  Remove-Job -Job $job -ErrorAction SilentlyContinue
  throw "MCP server did not become healthy at $localBase/health (POST /process-lead is registered there). Check port $mcpPort and dist/server.js."
}

$ngrokExe = (Get-Command ngrok -ErrorAction Stop).Source
Write-Host "[3/5] Starting ngrok (background) -> inspect http://127.0.0.1:4040 (stop other ngrok if this hangs)"
$ngProc = Start-Process -FilePath $ngrokExe -ArgumentList @('http', "$mcpPort") -PassThru -WindowStyle Hidden

$httpsUrl = $null
$deadline = (Get-Date).AddSeconds(45)
while ((Get-Date) -lt $deadline -and -not $httpsUrl) {
  try {
    $t = Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels' -TimeoutSec 2
    $httpsUrl = Get-HttpsTunnelUrlForLocalPort -LocalPort $mcpPort -TunnelsResponse $t
  }
  catch {}
  if (-not $httpsUrl) { Start-Sleep -Milliseconds 400 }
}

if (-not $httpsUrl) {
  if ($ngProc -and -not $ngProc.HasExited) { Stop-Process -Id $ngProc.Id -Force -ErrorAction SilentlyContinue }
  Stop-Job -Job $job -ErrorAction SilentlyContinue
  Remove-Job -Job $job -ErrorAction SilentlyContinue
  throw @"
No HTTPS tunnel forwarding to local port $mcpPort found on http://127.0.0.1:4040/api/tunnels.
Often: another ngrok is already running (this tunnel still points at an old port), or the new ngrok failed to start.
Fix: close other ngrok agents, free port $mcpPort, run this script again.
"@
}

Write-Host "[4/5] Verifying POST /process-lead through public URL (same path ChatGPT uses)..."
$verifyBody = '{"name":"Ngrok E2E","email":"e2e@example.com","source":"run-with-ngrok"}'
try {
  $vh = @{
    'Content-Type'               = 'application/json'
    'ngrok-skip-browser-warning' = '69420'
  }
  $lead = Invoke-RestMethod -Uri "$httpsUrl/process-lead" -Method Post -Headers $vh -Body $verifyBody -TimeoutSec 30
  if (-not $lead.ok -or -not $lead.leadId) { throw "Unexpected response" }
}
catch {
  if ($ngProc -and -not $ngProc.HasExited) { Stop-Process -Id $ngProc.Id -Force -ErrorAction SilentlyContinue }
  Stop-Job -Job $job -ErrorAction SilentlyContinue
  Remove-Job -Job $job -ErrorAction SilentlyContinue
  $why = $_.Exception.Message
  throw (
    "POST $httpsUrl/process-lead failed: $why" + [Environment]::NewLine +
    "Local /health was OK - tunnel URL may forward to a different app or stale ngrok. Stop other ngrok.exe, rerun."
  )
}

Write-Host "[5/5] Writing OpenAPI for ChatGPT..."
node scripts/write-openapi-for-chatgpt.mjs $httpsUrl
$pastePath = Join-Path $root "openapi-for-chatgpt-COPY-PASTE.yaml"

Write-Host @"

================================================================================
  READY — Copy ONE file into your Custom GPT Action schema:

  $pastePath

  In the GPT builder: Actions -> Authentication -> None (first test).
  Paste contents of CUSTOM_GPT_INSTRUCTIONS.md into GPT Instructions.
================================================================================

  Tunnel: $httpsUrl
  ngrok inspect: http://127.0.0.1:4040

  KEEP THIS WINDOW OPEN while testing the Custom GPT. If you stop ngrok or press Enter
  below, ChatGPT gets ERR_NGROK_3200 (endpoint offline) for that host until you run
  start:tunnel again and re-paste openapi-for-chatgpt-COPY-PASTE.yaml if the URL changed.

  Stop tunnel: press Enter here (stops ngrok + MCP).

"@

try {
  [void][Console]::ReadLine()
}
finally {
  Write-Host "Stopping ngrok and MCP..."
  if ($ngProc -and -not $ngProc.HasExited) {
    Stop-Process -Id $ngProc.Id -Force -ErrorAction SilentlyContinue
  }
  Stop-Job -Job $job -ErrorAction SilentlyContinue
  Remove-Job -Job $job -ErrorAction SilentlyContinue
}
