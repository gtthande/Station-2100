# ================== Station-2100: One-time setup for Cursor (PowerShell) ==================

$ErrorActionPreference = "Stop"

Write-Host ">>> 1) Configure global Git identity"
git config --global user.name  "George Thande"
git config --global user.email "gtthande@gmail.com"

Write-Host ">>> 2) Create PowerShell profile (if missing)"
if (!(Test-Path -Path $PROFILE)) {
  New-Item -ItemType File -Path $PROFILE -Force | Out-Null
}

Write-Host ">>> 3) Add PowerShell functions to your profile (git-sync-up / git-sync-down)"
$profileBlock = @'
function git-sync-down {
  Write-Host "Running: git pull origin main"
  git pull origin main
}

function git-sync-up {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]] $Message
  )
  if (-not $Message -or ($Message -join " ").Trim().Length -eq 0) {
    Write-Error 'Usage: git-sync-up "Your commit message"'
    return
  }
  $msg = $Message -join " "
  Write-Host "Staging all changes..."
  git add .
  Write-Host "Committing with message: $msg"
  git commit -m $msg
  Write-Host "Pushing to origin main..."
  git push origin main
}
'@

# Only append once
if (-not (Select-String -Path $PROFILE -Pattern "function git-sync-up" -Quiet)) {
  Add-Content -Path $PROFILE -Value $profileBlock
  Write-Host "Appended functions to $PROFILE"
} else {
  Write-Host "Functions already present in $PROFILE (skipping append)."
}

Write-Host ">>> 4) Add Git aliases (optional, simple)"
git config --global alias.sync-down "pull origin main"

# Note: custom-message alias is unreliable on PowerShell; use git-sync-up function instead.
# We still add a convenience alias to stage everything quickly:
git config --global alias.stage "add ."

Write-Host ">>> 5) Add a .gitattributes to normalize line endings (silence CRLF warnings)"
$gitattributes = ".gitattributes"
if (-not (Test-Path $gitattributes)) {
  @"
# Normalize line endings across platforms
* text=auto
*.ps1 text eol=crlf
*.sh  text eol=lf
"@ | Out-File -Encoding utf8 -FilePath $gitattributes
  Write-Host "Created .gitattributes"
} else {
  Write-Host ".gitattributes already exists (skipping)."
}

Write-Host ">>> 6) Create/Update SYNC_GUIDE.md"
$syncGuide = @"
# 🔄 Station-2100 Sync Guide

Use these commands to keep **Cursor (local)** and **Lovable (cloud)** in sync via GitHub.

## PowerShell Functions (local)
- \`git-sync-down\` → pulls latest changes from GitHub.
- \`git-sync-up "message"\` → stages, commits, and pushes (custom message).

## Daily Workflow
1. Start work:
   \`\`\`
   git-sync-down
   \`\`\`
2. After edits:
   \`\`\`
   git-sync-up "Describe your change"
   \`\`\`

## If You Prefer Git Aliases
- \`git sync-down\` (alias) does the same as \`git pull origin main\`.
- For custom messages, use the PowerShell function \`git-sync-up\` (more reliable on Windows).

## Conflict Handling
\`\`\`
git-sync-down
# fix conflicts in files
git add .
git commit -m "Resolve merge conflicts"
git push origin main
\`\`\`

## Identity (already set)
\`\`\`
git config --global user.name "George Thande"
git config --global user.email "gtthande@gmail.com"
\`\`\`

Notes:
- Line-ending warnings are normalized via \`.gitattributes\`.
- If the terminal looks stuck, close & reopen Cursor; your repo on GitHub is safe.
"@
Set-Content -Path "SYNC_GUIDE.md" -Value $syncGuide -Encoding utf8
Write-Host "Created/updated SYNC_GUIDE.md"

Write-Host ">>> 7) Reload profile for this session"
. $PROFILE

Write-Host "`n✅ Setup complete. Test now:"
Write-Host "   git-sync-down"
Write-Host "   git-sync-up \"Initial sync via function\""
# ==========================================================================================================
