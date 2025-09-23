param(
    [string]$Message = "Autocommit"
)

# Station-2100 Auto Sync Script
# Usage: .\sync-up.ps1 "Your commit message"
# Usage: .\sync-up.ps1 (uses default "Autocommit" message)

Write-Host "[SYNC] Station-2100 Auto Sync" -ForegroundColor Cyan
Write-Host "Message: $Message" -ForegroundColor Yellow

# Add all changes
Write-Host "[ADD] Adding all changes..." -ForegroundColor Blue
git add .

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to add changes" -ForegroundColor Red
    exit 1
}

# Commit with message
Write-Host "[COMMIT] Committing changes..." -ForegroundColor Blue
git commit -m "$Message"

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to commit changes" -ForegroundColor Red
    exit 1
}

# Push to origin main
Write-Host "[PUSH] Pushing to origin main..." -ForegroundColor Blue
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to push changes" -ForegroundColor Red
    exit 1
}

Write-Host "[SUCCESS] Auto sync completed successfully!" -ForegroundColor Green
