@echo off
setlocal EnableExtensions
cd /d "%~dp0"
call "%~dp0..\..\..\..\..\..\agent_tools\scripts\npm-ca.cmd" install --no-fund --no-audit
if errorlevel 1 exit /b 1
call "%~dp0..\..\..\..\..\..\agent_tools\scripts\npm-ca.cmd" run build
exit /b %ERRORLEVEL%
