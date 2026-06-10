@echo off
setlocal
cd /d "%~dp0"
pwsh -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%~dp0open-brave.ps1" %*
exit /b %ERRORLEVEL%
