# Cubic Matrix Dev Profile Sync Script
# Keeps local dev profile synchronized with GitHub source

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Log([string]$msg) {
  "$(Get-Date -Format HH:mm:ss)  $msg" | Write-Host -ForegroundColor Cyan
}

Log "=== CUBIC MATRIX DEV PROFILE SYNC ==="

# GitHub source URL
$sourceUrl = "https://raw.githubusercontent.com/gtthande/dev-profiles/main/Dev_Profile_and_Cursor_Prompt_Pack.md"
$localPath = "docs/Dev_Profile_and_Cursor_Prompt_Pack.md"
$backupPath = "docs/Dev_Profile_and_Cursor_Prompt_Pack.backup.md"

try {
  # Create backup of current version
  if (Test-Path $localPath) {
    Copy-Item $localPath $backupPath -Force
    Log "Created backup: $backupPath"
  }

  # Download latest version from GitHub
  Log "Downloading latest dev profile from GitHub..."
  $webClient = New-Object System.Net.WebClient
  $webClient.DownloadFile($sourceUrl, $localPath)
  
  Log "✅ Dev profile synchronized successfully"
  Log "Source: $sourceUrl"
  Log "Local: $localPath"
  
} catch {
  Log "❌ Sync failed: $($_.Exception.Message)"
  if (Test-Path $backupPath) {
    Log "Restoring from backup..."
    Copy-Item $backupPath $localPath -Force
  }
  throw
}

Log "=== SYNC COMPLETE ==="





