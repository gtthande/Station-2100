# Add missing environment variables for sync functionality
$envContent = @"
# --- MySQL Primary ---
DATABASE_URL="mysql://root:password@localhost:3306/station"

# --- Supabase Mirror (PostgreSQL) ---
VITE_SUPABASE_URL="https://jarlvtojzqkccovburmi.supabase.co"
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imphcmx2dG9qenFrY2NvdmJ1cm1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NzMwNTcsImV4cCI6MjA2NjU0OTA1N30.tFLcrolwr79OVXymCyTxdPcp6-qsQo6NDIrGOZ9h_Iw
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imphcmx2dG9qenFrY2NvdmJ1cm1pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDk3MzA1NywiZXhwIjoyMDY2NTQ5MDU3fQ.95sSXw5CWjxM1mY7X21PGpkKfx0XW8lmkREkwIa8ExA
SUPABASE_DB_URL="postgresql://postgres:Series-2100Station-2100@db.jarlvtojzqkccovburmi.supabase.co:5432/postgres"

# --- Sync Configuration ---
ALLOW_SYNC=1
SYNC_TOKEN=station-2100-sync-token-3985
SYNC_DIRECTION="mysql_to_supabase"
ALLOW_DESTRUCTIVE="false"
MIRROR_DELETES="false"
SYNC_TABLES='["users","profiles","inventory_products","inventory_batches","customers","job_cards","rotable_parts","tools","exchange_rates","audit_logs","stock_movements"]'
SYNC_BATCH_SIZE="1000"
VITE_API_URL=http://localhost:8787
"@

$envContent | Out-File -FilePath ".env.local" -Encoding UTF8
Write-Host "Environment variables updated for sync functionality"
