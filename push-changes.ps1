# push-changes.ps1
# Auto-commit and push all changes in Station-2100

Set-Location "E:\Gtthande Dropbox\George Thande\Projects\Cusor\Station-2100"

Write-Host "`n=== Git Auto Push Script ===`n" -ForegroundColor Cyan

# Stage all changes
git add .
Write-Host "[ok] Staged all changes" -ForegroundColor Green

# Commit with timestamp
$commitMsg = "Auto-commit: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
git commit -m "$commitMsg" 2>$null
Write-Host "[ok] Commit created: $commitMsg" -ForegroundColor Green

# Pull latest changes (safe sync)
git pull origin main --rebase
Write-Host "[ok] Pulled latest from origin/main" -ForegroundColor Green

# Push to GitHub
git push origin main
Write-Host "`n[done] All changes pushed to GitHub 🚀" -ForegroundColor Cyan
