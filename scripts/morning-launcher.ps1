# -------- Station-2100 Morning Launcher (safe, auto-kill) --------
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Info($m) { Write-Host ("[INFO] " + $m) -ForegroundColor Cyan }
function Warn($m) { Write-Host ("[WARN] " + $m) -ForegroundColor Yellow }
function Err ($m) { Write-Host ("[ERR ] " + $m) -ForegroundColor Red }

$setupScript = ".\scripts\setup-and-run.ps1"
$logFile     = ".\scripts\setup.fast.log"

# 0) Kill any stray Node processes (common reason for "stuck" terminals / ports)
Info "Killing stray node.exe processes (if any)..."
try { taskkill /IM node.exe /F 2>$null | Out-Null } catch {}

# 1) Pull latest from GitHub
Info "Pulling latest from GitHub..."
try {
  if (Get-Command git-sync-down -ErrorAction SilentlyContinue) {
    git-sync-down
  } else {
    Warn "git-sync-down not found; using 'git pull origin main'."
    git pull origin main
  }
} catch {
  Err "Git pull failed: $($_.Exception.Message)"
  throw
}

# 2) Allow scripts for THIS session (no machine-wide change)
Info "Enabling script execution for this session..."
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force

# 3) Sanity checks
if (-not (Test-Path $setupScript)) {
  Err "Missing $setupScript. Recreate it, then re-run this launcher."
  throw "setup-and-run.ps1 not found"
}

if (-not $env:SUPABASE_ACCESS_TOKEN) {
  Warn "SUPABASE_ACCESS_TOKEN is not set. Supabase CLI may prompt and block."
  Warn "Set once per session with:"
  Warn '  $env:SUPABASE_ACCESS_TOKEN = "YOUR_SUPABASE_PERSONAL_ACCESS_TOKEN"'
}

# 4) Run the setup script (logged)
Info "Running setup-and-run.ps1..."
try {
  & $setupScript
} catch {
  Err "Launcher caught an error while running setup-and-run.ps1."
  if (Test-Path $logFile) {
    Write-Host "`n--- $logFile (last 80 lines) ---" -ForegroundColor DarkGray
    Get-Content $logFile -Tail 80
    Write-Host "--- end log ---`n" -ForegroundColor DarkGray
  }
  throw
}



















