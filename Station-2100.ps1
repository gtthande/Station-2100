# ------------- Station-2100 Control Panel (safe, single-quote) -------------
$ErrorActionPreference = 'Stop'

# >>>>> EDIT THIS PATH IF YOUR FOLDER MOVES <<<<<
$ProjectPath   = 'E:\Gtthande Dropbox\George Thande\Projects\Cusor\Station-2100'
$RemoteName    = 'origin'
$DefaultBranch = 'main'
$DevRunnerName = 'dev-runner.ps1'

# Nice window title/size (best-effort)
try {
  $host.UI.RawUI.WindowTitle = 'Station-2100 Control Panel'
  $rawUI = $host.UI.RawUI
  $size  = $rawUI.WindowSize
  $size.Width  = 100
  $size.Height = 35
  $rawUI.WindowSize = $size
} catch {}

# ---------------- Helpers ----------------
function Ensure-Path {
  if (-not (Test-Path -LiteralPath $ProjectPath)) {
    Write-Host '[ERROR] Project path not found: ' -ForegroundColor Red -NoNewline
    Write-Host $ProjectPath
    Pause
    return $false
  }
  return $true
}

function In-Project {
  param([scriptblock]$Do)
  if (-not (Ensure-Path)) { return }
  Push-Location -LiteralPath $ProjectPath
  try { & $Do } finally { Pop-Location }
}

function Get-Branch {
  In-Project {
    $b = git rev-parse --abbrev-ref HEAD 2>$null
    if ($LASTEXITCODE -eq 0 -and $b) { $b.Trim() } else { $DefaultBranch }
  }
}

function Git-Quiet {
  param([string]$Args)
  In-Project { & cmd /c 'git ' + $Args + ' >nul 2>nul' }
}

# ---------------- Dev Server ----------------
function Start-Station {
  if (-not (Ensure-Path)) { return }
  Write-Host '[INFO] Killing stray node.exe...' -ForegroundColor Yellow
  try { taskkill /IM node.exe /F 2>$null | Out-Null } catch {}

  Write-Host '[INFO] Preparing dev runner...' -ForegroundColor Green
  $runner = Join-Path $ProjectPath $DevRunnerName
  $runnerContent = @"
`$host.UI.RawUI.WindowTitle = 'Station-2100 Dev Server'
Set-Location -LiteralPath '$ProjectPath'
npm run dev
"@
  Set-Content -Path $runner -Value $runnerContent -Encoding UTF8
  Unblock-File $runner

  $pwsh = if (Get-Command pwsh.exe -ErrorAction SilentlyContinue) { 'pwsh.exe' } else { 'powershell.exe' }
  Write-Host '[INFO] Opening dev server window...' -ForegroundColor Cyan
  Start-Process -FilePath $pwsh -ArgumentList @(
    '-NoExit','-NoLogo','-ExecutionPolicy','Bypass','-File', $runner
  ) -WorkingDirectory $ProjectPath -WindowStyle Normal

  Write-Host '→ Dev server window started. Visit http://localhost:8080' -ForegroundColor Cyan
}

function Stop-Station {
  Write-Host '[INFO] Stopping dev server (killing node.exe)...' -ForegroundColor Yellow
  $old = $ErrorActionPreference; $ErrorActionPreference = 'SilentlyContinue'
  taskkill /IM node.exe /F 2>$null | Out-Null
  $ErrorActionPreference = $old
  Write-Host '✔ Node processes stopped.' -ForegroundColor Green
}

# ---------------- Sync ----------------
function Sync-Down {
  $branch = Get-Branch
  Write-Host ('[INFO] Sync DOWN: pulling ''{0}/{1}'' → local ''{1}''...' -f $RemoteName,$branch) -ForegroundColor Cyan
  Git-Quiet ('fetch {0} {1}' -f $RemoteName,$branch)

  In-Project {
    & cmd /c ('git pull {0} {1} >nul 2>nul' -f $RemoteName,$branch)
    if ($LASTEXITCODE -eq 0) {
      Write-Host '✔ Pull completed.' -ForegroundColor Green
    } else {
      Write-Host '⚠ Pull may have failed (check repo status).' -ForegroundColor Yellow
    }
  }
}

function Sync-Up {
  $branch = Get-Branch
  Write-Host ('[INFO] Sync UP: local → ''{0}/{1}''...' -f $RemoteName,$branch) -ForegroundColor Cyan
  Git-Quiet 'add -A'
  Git-Quiet 'commit -m "Sync-up from Station-2100"'

  In-Project {
    & cmd /c ('git push {0} {1} >nul 2>nul' -f $RemoteName,$branch)
    if ($LASTEXITCODE -eq 0) {
      Write-Host '✔ Push completed.' -ForegroundColor Green
    } else {
      Write-Host '⚠ Push may have failed (check repo status/credentials).' -ForegroundColor Yellow
    }
  }
}

# ---------------- Menu ----------------
do {
  Clear-Host
  Write-Host '=============== Station-2100 ===============' -ForegroundColor Cyan
  Write-Host '1. Start Dev Server'
  Write-Host '2. Stop Dev Server'
  Write-Host '3. Sync DOWN (GitHub/Lovable → local)'
  Write-Host '4. Sync UP (local → GitHub/Lovable)'
  Write-Host '5. Quit'
  Write-Host '--------------------------------------------'
  $choice = Read-Host 'Select option'

  switch ($choice) {
    '1' { Start-Station; Pause }
    '2' { Stop-Station;  Pause }
    '3' { Sync-Down;     Pause }
    '4' { Sync-Up;       Pause }
    '5' { Write-Host 'Exiting Station-2100 Control Panel...' -ForegroundColor Yellow }
    default { Write-Host 'Invalid choice. Try again.' -ForegroundColor Red; Pause }
  }
} until ($choice -eq '5')
