@echo off
setlocal EnableExtensions
cd /d "%~dp0"

if not exist "website-templates\artisan" (
  echo Missing website-templates\artisan
  exit /b 1
)

node runtime\stack.mjs
exit /b %ERRORLEVEL%
