#Requires -Version 5.1
<#
  Installs Memurai Developer via winget so BullMQ gets Redis >= 5 on 127.0.0.1:6379.
  If the legacy Windows "Redis" service (3.x) holds 6379, it is stopped and set to Manual start.
  Run: pwsh -NoProfile -ExecutionPolicy Bypass -File .\install-memurai.ps1
#>
$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

Write-Host "Checking port 6379..." -ForegroundColor Cyan
$redisSvc = Get-Service -Name Redis -ErrorAction SilentlyContinue
if ($redisSvc -and $redisSvc.Status -eq "Running") {
  Write-Host "Stopping legacy Redis service (frees 6379 for Memurai)..." -ForegroundColor Yellow
  Stop-Service -Name Redis -Force
  Set-Service -Name Redis -StartupType Manual -ErrorAction SilentlyContinue
}

$winget = Get-Command winget -ErrorAction SilentlyContinue
if (-not $winget) {
  Write-Error "winget not found. Install Memurai manually from https://memurai.com/get-memurai"
  exit 1
}

Write-Host "Installing Memurai Developer (winget)..." -ForegroundColor Cyan
winget install --id Memurai.MemuraiDeveloper -e --accept-source-agreements --accept-package-agreements --disable-interactivity
if ($LASTEXITCODE -ne 0) {
  Write-Error "winget install failed. If the log says port in use, stop whatever listens on 6379 and retry."
  exit $LASTEXITCODE
}

Write-Host "`nRunning setup.ps1 (npm + Redis check)..." -ForegroundColor Cyan
& "$PSScriptRoot\setup.ps1"
exit $LASTEXITCODE
