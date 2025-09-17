# Station-2100 Dev Health Script
$ErrorActionPreference = "Stop"

Write-Host "`n[env] Ensuring ALLOW_SYNC=1 ..." -ForegroundColor Cyan
Set-Content -Path .\.env.local -Value "ALLOW_SYNC=1" -Encoding UTF8

try { taskkill /IM node.exe /F 2>$null | Out-Null } catch { }
Write-Host "[proc] Cleared stray node.exe" -ForegroundColor DarkGray

Write-Host "[vite] Starting dev server..." -ForegroundColor Cyan
Start-Process -FilePath "cmd" -ArgumentList "/c", "npm run dev" -NoNewWindow

function Wait-JsonOk([string]$url, [int]$tries=15, [int]$delay=1000) {
  for ($i=1; $i -le $tries; $i++) {
    try {
      $res = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
      $json = $res.Content | ConvertFrom-Json
      if ($json.ok) {
        Write-Host ("[ok] {0} -> {1}" -f $url, $res.Content) -ForegroundColor Green
        return $json
      }
    } catch { }
    Write-Host ("[wait] {0} (try {1}/{2})" -f $url,$i,$tries) -ForegroundColor Yellow
    Start-Sleep -Milliseconds $delay
  }
  throw "Timed out waiting for $url"
}

$ping   = Wait-JsonOk "http://localhost:8080/__sync/ping"
$status = Wait-JsonOk "http://localhost:8080/__sync/status"

Write-Host "`n=== Sync Health ===" -ForegroundColor Cyan
Write-Host ("Ping  : ok={0}" -f $ping.ok)
Write-Host ("Status: ok={0} allow={1}" -f $status.ok, $status.allow)
