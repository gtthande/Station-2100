# -------- Station-2100 Morning Launcher (safe, auto-kill) --------
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Info($m) { Write-Host ("[INFO] " + $m) -ForegroundColor Cyan }
function Warn($m) { Write-Host ("[WARN] " + $m) -ForegroundColor Yellow }
function Err ($m) { Write-Host ("[ERR ] " + $m) -ForegroundColor Red }

$setupScript = ".\scripts\setup-and-run.ps1"
$logFile     = ".\scripts\setup.fast.log"

Info "Killing stray node.exe processes (if any)..."
try { taskkill /IM node.exe /F 2>$null | Out-Null } catch {}

Info "Pulling latest from GitHub..."
try {
  if (Get-Command git-sync-down -ErrorAction SilentlyContinue) {
    git-sync-down
  } else {
    Warn "git-sync-down not found; using 'git pull origin main'."
    git pull origin main
  }
} catch {
  Err "Git pull failed: $($_.Exception.Message)"; throw
}

Info "Enabling script execution for this session..."
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force

if (-not (Test-Path $setupScript)) {
  Err "Missing $setupScript. Aborting."; throw "setup-and-run.ps1 not found"
}

if (-not $env:SUPABASE_ACCESS_TOKEN) {
  Warn "SUPABASE_ACCESS_TOKEN is not set (login will be skipped)."
}

Info "Running setup-and-run.ps1..."
try {
  & $setupScript
} catch {
  Err "Error while running setup-and-run.ps1."
  if (Test-Path $logFile) {
    Write-Host "`n--- $logFile (last 80 lines) ---" -ForegroundColor DarkGray
    Get-Content $logFile -Tail 80
    Write-Host "--- end log ---`n" -ForegroundColor DarkGray
  }
  throw
}

# -------- Station-2100 Morning Launcher --------
$ErrorActionPreference = "Stop"

Write-Host ">>> Pulling latest from GitHub..."
try { git-sync-down } catch {
  Write-Host "git-sync-down not available, using plain git pull"
  git pull origin main
}

Write-Host ">>> Running setup-and-run.ps1..."
& .\scripts\setup-and-run.ps1
