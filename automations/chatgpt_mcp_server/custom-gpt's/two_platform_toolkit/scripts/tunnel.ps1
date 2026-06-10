# two_platform_toolkit: one public URL (see .env TOOLKIT_PUBLIC_URL + PORT).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "[1/4] Stopping any ngrok agents..."
Get-Process -Name ngrok -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 600

$envFile = Join-Path $root ".env"
if (-not (Test-Path $envFile)) { throw "Missing .env - copy .env.example first." }
Get-Content $envFile | ForEach-Object {
  $l = $_.Trim()
  if ($l -match '^\s*#' -or $l -eq "") { return }
  if ($l -match '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
    Set-Item -Path "Env:$($matches[1])" -Value $matches[2].Trim()
  }
}

if (-not $env:TOOLKIT_PUBLIC_URL) { throw "TOOLKIT_PUBLIC_URL missing in .env" }
$null = [Uri]$env:TOOLKIT_PUBLIC_URL
$port = if ($env:PORT) { [int]$env:PORT } else { 3040 }

Write-Host "[2/4] npm run build ..."
npm run build

$busy = @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
if ($busy.Count -gt 0) {
  $pids = $busy.OwningProcess | Sort-Object -Unique
  throw "Port $port is in use (PIDs: $($pids -join ', ')). Stop that process or change PORT in .env."
}

Write-Host "[3/4] Starting toolkit on http://127.0.0.1:$port ..."
$job = Start-Job -ScriptBlock {
  param($dir)
  Set-Location $dir
  node dist/server.js
} -ArgumentList $root

$ok = $false
foreach ($i in 1..50) {
  Start-Sleep -Milliseconds 200
  if ($job.State -eq "Failed") {
    Receive-Job $job -ErrorAction SilentlyContinue | Write-Host
    throw "Server failed to start."
  }
  try {
    Invoke-RestMethod -Uri "http://127.0.0.1:$port/v1/health" -TimeoutSec 2 | Out-Null
    $ok = $true
    break
  }
  catch {}
}
if (-not $ok) {
  Receive-Job $job -ErrorAction SilentlyContinue | Write-Host
  Stop-Job $job -ErrorAction SilentlyContinue
  Remove-Job $job -ErrorAction SilentlyContinue
  throw "Health check failed on http://127.0.0.1:$port/v1/health"
}

$ngrok = (Get-Command ngrok -ErrorAction Stop).Source
$public = $env:TOOLKIT_PUBLIC_URL.TrimEnd('/')
Write-Host "[4/4] Starting ngrok $public -> localhost:$port ..."
$ngArgs = @('http', "$port", '--url', $public)
$ngProc = Start-Process -FilePath $ngrok -ArgumentList $ngArgs -PassThru -WindowStyle Hidden
Write-Host ""
Write-Host "=== two_platform_toolkit ===" -ForegroundColor Green
Write-Host "Public URL (GPT Actions + OAuth): $public"
Write-Host "Local health:  http://127.0.0.1:$port/v1/health"
Write-Host ""
if ([Console]::IsInputRedirected) {
  Write-Host "Non-interactive: tunnel stays up until ngrok exits (or stop this job)."
  Wait-Process -Id $ngProc.Id -ErrorAction SilentlyContinue
}
else {
  Write-Host "Leave this window open. Press Enter to stop ngrok and the server."
  Read-Host | Out-Null
}

if ($ngProc -and -not $ngProc.HasExited) { Stop-Process -Id $ngProc.Id -Force -ErrorAction SilentlyContinue }
Stop-Job $job -ErrorAction SilentlyContinue
Remove-Job $job -ErrorAction SilentlyContinue
Get-Process -Name ngrok -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "Stopped."
