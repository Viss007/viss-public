@echo off
setlocal
cd /d "%~dp0"

if not exist "public\build\manifest.json" (
  echo [template_playground] No public\build\manifest.json — run: npm install ^&^& npm run build
)

for /f "usebackq delims=" %%a in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "[Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')"`) do set "PATH=%%a"

set "PHP_CMD="
where php >nul 2>&1
if not errorlevel 1 (
  for /f "delims=" %%p in ('where php 2^>nul') do set "PHP_CMD=%%p" & goto :have_php
)

for /d %%D in ("%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.*") do (
  if exist "%%~fD\php.exe" (
    set "PHP_CMD=%%~fD\php.exe"
    goto :have_php
  )
)

echo PHP not found. Install PHP ^(e.g. winget install PHP.PHP.8.2^) or add php.exe to PATH.
pause
exit /b 1

:have_php
echo Using PHP: %PHP_CMD%
"%PHP_CMD%" -v
echo.

echo  Template Playground — http://127.0.0.1:8000
echo  Press Ctrl+C to stop the server.
echo.

set LOG_STACK=single,stderr

rem Default: do not open a browser (avoids Brave/default handler on every start).
rem To auto-open the default browser after ~2s: set TEMPLATE_PLAYGROUND_OPEN_BROWSER=1 before running this script.
if /i "%TEMPLATE_PLAYGROUND_OPEN_BROWSER%"=="1" (
  start "" cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:8000/"
)

"%PHP_CMD%" artisan serve --host=127.0.0.1 --port=8000

endlocal
