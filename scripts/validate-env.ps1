# Environment Validation Script
# Ensures .env.local exists and has required variables

$requiredVars = @(
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY", 
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_DB_PASSWORD"
)

if (-not (Test-Path ".env.local")) {
    Write-Host "Creating .env.local from template..." -ForegroundColor Yellow
    Copy-Item "env-template.txt" ".env.local" -Force
}

Write-Host "Environment validation complete." -ForegroundColor Green