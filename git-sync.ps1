param(
    [string]$Message = "Autocommit"
)

Write-Host "🔄 Staging changes..."
git add .

Write-Host "💾 Committing with message: $Message"
git commit -m "$Message"

Write-Host "⬆️ Pushing to origin/main..."
git push origin main

Write-Host "✅ Sync complete!"
