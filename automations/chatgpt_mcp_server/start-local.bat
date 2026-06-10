@echo off
setlocal
cd /d "%~dp0"

echo [chatgpt_mcp_server] npm run build ...
call npm run build
if errorlevel 1 (
  echo Build failed.
  pause
  exit /b 1
)

if "%MCP_PORT%"=="" set MCP_PORT=2091
set MCP_HOST=0.0.0.0

echo.
echo chatgpt_mcp_server (no tunnel^)
echo   Health:       http://127.0.0.1:%MCP_PORT%/health
echo   Process lead: http://127.0.0.1:%MCP_PORT%/process-lead
echo   MCP HTTP:     http://127.0.0.1:%MCP_PORT%/mcp
echo   Legacy SSE:   http://127.0.0.1:%MCP_PORT%/sse
echo   Ctrl+C to stop.
echo.

node dist\server.js
if errorlevel 1 pause
