# --- Station-2100 Dev Quick Start & Health Check ---
$ErrorActionPreference = "Stop"

# 0) Go to project
Set-Location "E:\Gtthande Dropbox\George Thande\Projects\Cusor\Station-2100"

# 1) Ensure sync flag in .env.local
if (-not (Test-Path .\.env.local)) { New-Item -ItemType File -Path .\.env.local | Out-Null }
if (-not (Select-String -Path .\.env.local -Pattern '^ALLOW_SYNC=1$' -SimpleMatch -Quiet)) {
  Add-Content -Path .\.env.local -Value 'ALLOW_SYNC=1'
  Write-Host "[env] ALLOW_SYNC=1 added to .env.local" -ForegroundColor Cyan
} else {
  Write-Host "[env] ALLOW_SYNC=1 already present" -ForegroundColor DarkGray
}

# 2) Kill any stale Node (ignore if not running)
try { taskkill /IM node.exe /F 2>$null | Out-Null } catch { }
Write-Host "[proc] Cleared any stray node.exe" -ForegroundColor DarkGray

# 3) Verify dotenv dependency and auto-install if missing
try {
  $pkg = Get-Content -Raw -Path .\package.json | ConvertFrom-Json
  $hasDotenv = ($pkg.dependencies.PSObject.Properties.Name -contains "dotenv" -or
                $pkg.devDependencies.PSObject.Properties.Name -contains "dotenv")
  if (-not $hasDotenv) {
    Write-Host "[warn] 'dotenv' not found in package.json. Installing..." -ForegroundColor Yellow
    npm install dotenv --save-dev | Out-Null
    Write-Host "[ok] dotenv installed" -ForegroundColor Green
  } else {
    Write-Host "[ok] dotenv dependency found" -ForegroundColor Green
  }
} catch {
  Write-Host "[warn] Could not parse package.json to check dotenv" -ForegroundColor Yellow
}

# 4) Start Vite dev server (logs will show here)
Write-Host "[vite] Starting: npm run dev ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit","-Command","npm run dev" -WorkingDirectory (Get-Location)

# 5) Helper: wait for endpoint with retries
function Wait-JsonOk([string]$url, [int]$tries = 20, [int]$delayMs = 800) {
  for ($i = 1; $i -le $tries; $i++) {
    try {
      $res = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
      $json = $res.Content | ConvertFrom-Json
      if ($json.ok) {
        Write-Host ("[ok] {0} -> {1}" -f $url, ($res.Content)) -ForegroundColor Green
        return $json
      } else {
        Write-Host ("[wait] {0} -> not ok (try {1}/{2})" -f $url, $i, $tries) -ForegroundColor Yellow
      }
    } catch {
      Write-Host ("[wait] {0} -> not reachable (try {1}/{2})" -f $url, $i, $tries) -ForegroundColor Yellow
    }
    Start-Sleep -Milliseconds $delayMs
  }
  throw "Timed out waiting for $url"
}

# 6) Wait for /__sync/ping and /__sync/status
Start-Sleep -Seconds 3
$ping   = Wait-JsonOk "http://localhost:8080/__sync/ping"
$status = Wait-JsonOk "http://localhost:8080/__sync/status"

# 7) Show summary
Write-Host "`n=== Sync Health ===" -ForegroundColor Cyan
Write-Host ("Ping  : ok={0}" -f $ping.ok)
Write-Host ("Status: ok={0} allow={1}" -f $status.ok, $status.allow)

if (-not $status.allow) {
  Write-Host "`n[hint] 'allow' is false. Ensure ALLOW_SYNC=1 in .env.local (already set), then CTRL+C the dev server and rerun this script." -ForegroundColor Yellow
} else {
  Write-Host "`nAll good! Open http://localhost:8080/ and the Dev Sync Panel should work." -ForegroundColor Green
}