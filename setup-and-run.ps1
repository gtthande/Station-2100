# ---------- setup-and-run.ps1 ----------
$env:SUPABASE_DB_PASSWORD = "Series-2100Station-2100"

# Ensure login (opens browser only the first time)
npx supabase@latest login

# Link project (safe to re-run)
npx supabase@latest link --project-ref jarlvtojzqkccovburmi --password "$env:SUPABASE_DB_PASSWORD"

# Kill any stuck node processes, push DB, start dev server on 8080
taskkill /F /IM node.exe /T 2>$null
npm install
npx supabase@latest db push --yes --password "$env:SUPABASE_DB_PASSWORD"
npm run dev
# ---------------------------------------

