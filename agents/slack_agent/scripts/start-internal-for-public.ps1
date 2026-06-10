# Socket Mode child for Public stack (no HTTP port).
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $PSScriptRoot
Set-Location $here

$py = Join-Path $here '.venv\Scripts\python.exe'
if (-not (Test-Path $py)) {
  Write-Host '[slack_agent] missing .venv — run: python -m venv .venv; pip install -r requirements.txt'
  exit 1
}

$env:PYTHONUNBUFFERED = '1'
Write-Host '[slack_agent] Socket Mode seat (Public stack; no loopback HTTP)'
& $py -u -m backend.main
