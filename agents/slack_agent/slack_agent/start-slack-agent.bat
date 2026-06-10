@echo off
setlocal
cd /d "%~dp0"
set PYTHONUNBUFFERED=1

if not exist ".venv\Scripts\python.exe" (
  echo [slack_agent] Create venv and deps once:
  echo   python -m venv .venv
  echo   .venv\Scripts\pip install -r requirements.txt
  exit /b 1
)

echo [slack_agent] PYTHONUNBUFFERED=%PYTHONUNBUFFERED% ^(log level: slack_agent\.env SLACK_AGENT_LOG_LEVEL^)
".venv\Scripts\python.exe" -u -m backend.main
exit /b %ERRORLEVEL%
