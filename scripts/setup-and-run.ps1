# -------- setup-and-run.ps1 (clean, logged) --------
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Config
$env:SUPABASE_DB_PASSWORD = "Series-2100Station-2100"
$PROJECT_REF = "jarlvtojzqkccovburmi"
$LOG = "./scripts/setup.fast.log"

function Log([string]$msg) {
  "$(Get-Date -Format HH:mm:ss)  $msg" | Tee-Object -FilePath $LOG -Append | Out-Null
}
function Step([string]$name, [string]$cmd) {
  Log "-> $name"
  try { Invoke-Expression $cmd | Tee-Object -FilePath $LOG -Append }
  catch { Log "!! $name failed: $($_.Exception.Message)"; throw }
}

Log "=== RUN START ==="

# Kill stray node
try { taskkill /IM node.exe /F 2>$null | Out-Null } catch {}

# Login only if token present
if ($env:SUPABASE_ACCESS_TOKEN) {
  Step "Supabase login"  "npx supabase@latest login --token `"$env:SUPABASE_ACCESS_TOKEN`""
} else {
  Log "Skipping Supabase login (no SUPABASE_ACCESS_TOKEN set)"
}

# Link to remote project
Step "Supabase link"   "npx supabase@latest link --project-ref $PROJECT_REF --password `"$env:SUPABASE_DB_PASSWORD`""

# Run 'status' only if Docker service is running (prevents Windows Docker noise)
$dockerRunning = $false
try {
  $svc = Get-Service -Name 'com.docker.service' -ErrorAction SilentlyContinue
  if ($svc -and $svc.Status -eq 'Running') { $dockerRunning = $true }
} catch { $dockerRunning = $false }
if ($dockerRunning) {
  Step "Supabase status (docker check)" 'npx supabase@latest status'
} else {
  Log "Skipping `supabase status` (Docker not running) — safe for remote-db workflow."
}

# Deps
if (Test-Path "node_modules") {
  Log "node_modules exists → skipping npm ci"
} else {
  Step "Install deps" 'npm ci --prefer-offline --no-audit --no-fund'
}

# DB migrations
Step "DB push (dry-run)" 'npx supabase@latest db push --dry-run'
Step "DB push (apply)"   'npx supabase@latest db push --yes --password "$env:SUPABASE_DB_PASSWORD"'

# Dev server
Step "Dev server" 'npm run dev'

Log "=== RUN END ==="
