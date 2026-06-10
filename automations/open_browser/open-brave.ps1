#requires -Version 7
# Opens Brave on the interactive desktop via a one-shot scheduled task (works from agent / non-interactive parents).
# After launch, connects over CDP and clicks ChatGPT "Log in" when URL targets chatgpt.com (optional).
param(
  [Parameter(Position = 0)]
  [string]$Url = '',
  [switch]$SkipLoginClick
)
$ErrorActionPreference = 'Stop'
$dotEnv = Join-Path $PSScriptRoot '.env'
if (Test-Path -LiteralPath $dotEnv) {
  foreach ($raw in Get-Content -LiteralPath $dotEnv -Encoding utf8) {
    $line = $raw.Trim()
    if (-not $line -or $line.StartsWith('#')) { continue }
    if ($line.StartsWith('export ', [System.StringComparison]::OrdinalIgnoreCase)) {
      $line = $line.Substring(7).TrimStart()
    }
    $eq = $line.IndexOf('=')
    if ($eq -lt 1) { continue }
    $k = $line.Substring(0, $eq).Trim()
    if (-not $k) { continue }
    $v = $line.Substring($eq + 1).Trim()
    if (
      ($v.Length -ge 2 -and $v.StartsWith('"') -and $v.EndsWith('"')) -or
      ($v.Length -ge 2 -and $v.StartsWith("'") -and $v.EndsWith("'"))
    ) { $v = $v.Substring(1, $v.Length - 2) }
    [Environment]::SetEnvironmentVariable($k, $v, 'Process')
  }
}
if (-not $Url) { $Url = $env:BRAVE_OPEN_URL }
if (-not $Url) { $Url = 'https://chatgpt.com/' }
$exe = @(
  $env:BRAVE_EXE
  "${env:ProgramFiles}\BraveSoftware\Brave-Browser\Application\brave.exe"
  "${env:ProgramFiles(x86)}\BraveSoftware\Brave-Browser\Application\brave.exe"
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -First 1
if (-not $exe) {
  $w = (Get-Command brave -ErrorAction SilentlyContinue)?.Source
  if ($w -and (Test-Path -LiteralPath $w)) { $exe = $w }
}
if (-not $exe) {
  Write-Error 'Brave not found. Set BRAVE_EXE to brave.exe path.'
  exit 2
}
$user = (Get-CimInstance -ClassName Win32_ComputerSystem).UserName
if (-not $user) {
  $user = "$env:USERDOMAIN\$env:USERNAME"
}
$cdpPort = if ($env:BRAVE_CDP_PORT) { $env:BRAVE_CDP_PORT } else { '9333' }
$argLine = "--remote-debugging-port=$cdpPort --remote-allow-origins=* `"$Url`""
$taskName = 'VissOpenBrave_' + [guid]::NewGuid().ToString('n').Substring(0, 12)
$act = New-ScheduledTaskAction -Execute $exe -Argument $argLine
$pr = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive
Register-ScheduledTask -TaskName $taskName -Action $act -Principal $pr -Force | Out-Null
try {
  Start-ScheduledTask -TaskName $taskName
} finally {
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue | Out-Null
}

$wantClick = -not $SkipLoginClick -and ($env:BRAVE_SKIP_LOGIN_CLICK -ne '1')
if (-not $wantClick) { exit 0 }
if ($Url -notmatch 'chatgpt\.com') { exit 0 }

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Warning 'node not on PATH; cannot click Log in. Install Node or use -SkipLoginClick / BRAVE_SKIP_LOGIN_CLICK=1.'
  exit 6
}

$scriptJs = Join-Path $PSScriptRoot 'click-chatgpt-login.mjs'
if (-not (Test-Path -LiteralPath $scriptJs)) {
  Write-Warning "Missing $scriptJs"
  exit 7
}

Start-Sleep -Seconds 5
$env:BRAVE_CDP_PORT = $cdpPort
Push-Location $PSScriptRoot
try {
  & node $scriptJs
  exit $LASTEXITCODE
} finally {
  Pop-Location
}
