# Fix environment configuration for working build
$envContent = @"
# === DATABASES ===
DATABASE_URL="mysql://root:password@localhost:3306/station"

# Supabase mirror (optional backup)
SUPABASE_URL="https://jarlvtojzqkccovburmi.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imphcmx2dG9qenFrY2NvdmJ1cm1pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDk3MzA1NywiZXhwIjoyMDY2NTQ5MDU3fQ.95sSXw5CWjxM1mY7X21PGpkKfx0XW8lmkREkwIa8ExA"
SUPABASE_DB_URL="postgresql://postgres:Series-2100Station-2100@db.jarlvtojzqkccovburmi.supabase.co:5432/postgres"

# === SYNC CONFIGURATION ===
ALLOW_SYNC=1
SYNC_TOKEN=station-2100-sync-token-3985
SYNC_DIRECTION="mysql_to_supabase"
ALLOW_DESTRUCTIVE="false"
MIRROR_DELETES="false"
SYNC_TABLES='["users","profiles","inventory_products","inventory_batches","customers","job_cards","tools","exchange_rates","audit_logs"]'
SYNC_BATCH_SIZE="1000"

# === SERVER CONFIGURATION ===
VITE_API_URL="http://localhost:5055"
"@

$envContent | Out-File -FilePath ".env.local" -Encoding UTF8
Write-Host "✅ Environment configuration updated with correct ports"
