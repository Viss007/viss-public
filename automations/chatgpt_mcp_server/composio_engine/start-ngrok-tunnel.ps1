param(
  [int]$Port = 3088,
  [string]$NgrokPath = "ngrok",
  [switch]$KillExisting
)

$ErrorActionPreference = "Stop"

if ($KillExisting) {
  Get-Process -Name "ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  Start-Sleep -Milliseconds 400
}

Write-Host "Starting ngrok tunnel for port $Port..."
$args = @("http", "$Port", "--log=stdout")
$proc = Start-Process -FilePath $NgrokPath -ArgumentList $args -PassThru

$publicUrl = $null
for ($i = 0; $i -lt 25; $i++) {
  Start-Sleep -Milliseconds 500
  try {
    $resp = Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:4040/api/tunnels"
    if ($resp.tunnels) {
      $https = $resp.tunnels | Where-Object { $_.public_url -like "https://*" } | Select-Object -First 1
      if ($https) {
        $publicUrl = $https.public_url
        break
      }
    }
  } catch {
    # ngrok api not ready yet
  }
}

if (-not $publicUrl) {
  Write-Host "ngrok started (PID $($proc.Id)), but tunnel URL was not detected yet."
  Write-Host "Open http://127.0.0.1:4040 to copy the public URL."
  exit 0
}

Write-Host ""
Write-Host "ngrok running (PID $($proc.Id))"
Write-Host "Public URL: $publicUrl"
Write-Host ""
Write-Host "Optional runtime env command:"
Write-Host "`$env:ENGINE_PUBLIC_URL='$publicUrl'"
