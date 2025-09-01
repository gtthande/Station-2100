# ==== CONFIG (already filled for your project) ====
$SupabaseUrl = 'https://jarlvtojzqkccovburmi.supabase.co'
$AnonKey     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imphcmx2dG9qenFrY2NvdmJ1cm1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NzMwNTcsImV4cCI6MjA2NjU0OTA1N30.tFLcrolwr79OVXymCyTxdPcp6-qsQo6NDIrGOZ9h_Iw'
# ================================================

Write-Host "== A) Ensure .env / .env.local has hosted Supabase values ==" -ForegroundColor Cyan
function Set-Or-Replace-Line($file, $key, $value) {
  if (-not (Test-Path $file)) { New-Item -ItemType File -Path $file -Force | Out-Null }
  $content = Get-Content $file -Raw
  if ($content -match "^(?m)$key=.*$") {
    $content = [regex]::Replace($content, "^(?m)$key=.*$", "$key=$value")
  } else {
    if ($content.Length -gt 0 -and $content[-1] -ne "`n") { $content = $content + "`r`n" }
    $content += "$key=$value`r`n"
  }
  Set-Content -Path $file -Value $content -NoNewline
}

$EnvFile = ".env"
try {
  Set-Or-Replace-Line $EnvFile "VITE_SUPABASE_URL" $SupabaseUrl
  Set-Or-Replace-Line $EnvFile "VITE_SUPABASE_ANON_KEY" $AnonKey
} catch {
  $EnvFile = ".env.local"
  try {
    Set-Or-Replace-Line $EnvFile "VITE_SUPABASE_URL" $SupabaseUrl
    Set-Or-Replace-Line $EnvFile "VITE_SUPABASE_ANON_KEY" $AnonKey
  } catch {
    Write-Host "Could not write to .env or .env.local. Please check file permissions." -ForegroundColor Red
    exit 1
  }
}
Write-Host "Wrote Supabase vars to $EnvFile" -ForegroundColor Green

# Derive project ref from URL
$ProjectRef = ($SupabaseUrl -replace '^https://','' -replace '\.supabase\.co/?$','')
Write-Host "Derived PROJECT_REF: $ProjectRef" -ForegroundColor Green

Write-Host "== B) Ensure package.json scripts ==" -ForegroundColor Cyan
if (-not (Test-Path "package.json")) { Write-Error "package.json not found in this folder."; exit 1 }
$pkg = Get-Content package.json -Raw | ConvertFrom-Json
if (-not $pkg.scripts) { $pkg | Add-Member -Name scripts -MemberType NoteProperty -Value (@{}) }

$pkg.scripts.dev = "vite --port 8080"
$pkg.scripts.'db:push' = "npx supabase@latest db push"
$pkg.scripts.'start:all' = "npm run db:push && npm run dev"

$pkg | ConvertTo-Json -Depth 100 | Set-Content package.json -NoNewline
Write-Host "Updated package.json scripts (dev, db:push, start:all)." -ForegroundColor Green

Write-Host "== C) Install deps if needed ==" -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
  npm install
  if ($LASTEXITCODE -ne 0) { Write-Error "npm install failed"; exit 1 }
}

Write-Host "== D) Push DB migrations to HOSTED Supabase ==" -ForegroundColor Cyan
npx supabase@latest db push
if ($LASTEXITCODE -ne 0) {
  Write-Host "db push failed. If it says 'not authenticated', set your access token and rerun:" -ForegroundColor Yellow
  Write-Host '  setx SUPABASE_ACCESS_TOKEN "YOUR_TOKEN"  (then reopen terminal)' -ForegroundColor Yellow
  exit 1
}

Write-Host "== E) Start dev server on http://localhost:8080 ==" -ForegroundColor Cyan
npm run dev -- --port 8080
