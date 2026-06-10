# Loopback child for Public :3333; proxied at /automations/* (not operator-facing :2091).
$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $PSScriptRoot
Set-Location $here

if (-not (Test-Path "dist\server.js")) {
  Write-Host "[chatgpt_mcp] dist missing - run npm run build in $here"
  exit 1
}

if (-not $env:MCP_PORT) { $env:MCP_PORT = "2091" }
if (-not $env:MCP_HOST) { $env:MCP_HOST = "127.0.0.1" }

# Public island: no operator memory, no Cursor mcp.json, no paths outside Desktop\Public.
$publicRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
$env:CHATGPT_TOOL_MODE = "public"
$env:CHATGPT_MCP_ROOT = $publicRoot
$env:DIMENSIONAL_HTTP_URL = "disabled"
Remove-Item Env:MCP_CALL_ALLOW_SERVERS -ErrorAction SilentlyContinue

Write-Host ("[chatgpt_mcp] internal http://{0}:{1} proxied at /automations/mcp on 3333 (island mode)" -f $env:MCP_HOST, $env:MCP_PORT)
node dist/server.js
