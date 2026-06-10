param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Args
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PyScript = Join-Path $ScriptDir "toolkit.py"

if (-not (Test-Path $PyScript)) {
  Write-Error "Missing CLI script: $PyScript"
  exit 1
}

# Prefer the py launcher on Windows, fallback to python.
$Runner = Get-Command py -ErrorAction SilentlyContinue
if ($Runner) {
  & py $PyScript @Args
  exit $LASTEXITCODE
}

$Runner = Get-Command python -ErrorAction SilentlyContinue
if ($Runner) {
  & python $PyScript @Args
  exit $LASTEXITCODE
}

Write-Error "Neither 'py' nor 'python' was found on PATH."
exit 1
