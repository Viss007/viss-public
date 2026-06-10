# Opens run-with-ngrok.ps1 in a new PowerShell window that stays open (tunnel + MCP keep running).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$script = Join-Path $root "scripts\run-with-ngrok.ps1"
Start-Process powershell.exe -WorkingDirectory $root -ArgumentList @(
  '-NoExit',
  '-NoProfile',
  '-ExecutionPolicy', 'Bypass',
  '-File', $script
)
Write-Host "Started LeadFlow tunnel in a new window. Leave it open while ChatGPT calls your Actions."
Write-Host "Close that window or press Enter there only when you want to stop ngrok."
