@echo off
setlocal
title ChatGPT MCP + Railway tunnel
cd /d "%~dp0"
if not exist "package.json" (
  echo ERROR: chatgpt_mcp_server package.json not found from this .bat location.
  pause
  exit /b 1
)
echo.
echo  ChatGPT Railway tunnel — npm run run:railway-tunnel
echo  Stop: Ctrl+C  (also runs stop for MCP when the tunnel exits)
echo.
call npm run run:railway-tunnel
echo.
pause
