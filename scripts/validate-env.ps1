# Station-2100 Environment Validation Script
# Validates environment configuration and provides setup guidance

param(
    [switch]$Fix,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

Write-Host "`n=== Station-2100 Environment Validation ===" -ForegroundColor Cyan

# Color functions
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Warning { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Blue }

# Check if .env.local exists
$envFile = ".env.local"
$templateFile = "env-template.txt"

if (-not (Test-Path $envFile)) {
    Write-Warning ".env.local not found"
    if ($Fix) {
        Write-Info "Creating .env.local from template..."
        if (Test-Path $templateFile) {
            Copy-Item $templateFile $envFile
            Write-Success ".env.local created from template"
        } else {
            Write-Error "Template file not found. Cannot auto-fix."
            exit 1
        }
    } else {
        Write-Info "Run with -Fix to create .env.local from template"
        exit 1
    }
}

# Read environment file
try {
    $envContent = Get-Content $envFile -Raw -Encoding UTF8
    Write-Success ".env.local found and readable"
} catch {
    Write-Error "Failed to read .env.local: $($_.Exception.Message)"
    exit 1
}

# Parse environment variables
$envVars = @{}
$lines = $envContent -split "`n"

foreach ($line in $lines) {
    $line = $line.Trim()
    
    # Skip empty lines and comments
    if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith("#")) {
        continue
    }
    
    # Parse KEY=value
    if ($line -match "^([^=]+)=(.*)$") {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $envVars[$key] = $value
    } else {
        Write-Warning "Invalid line format: $line"
    }
}

Write-Info "Found $($envVars.Count) environment variables"

# Required variables
$requiredVars = @(
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY", 
    "SUPABASE_SERVICE_ROLE_KEY",
    "ALLOW_SYNC",
    "VITE_GITHUB_REPO",
    "SUPABASE_DB_PASSWORD"
)

$optionalVars = @(
    "VITE_GITHUB_TOKEN",
    "HAVEIBEENPWNED_API_KEY"
)

$allVars = $requiredVars + $optionalVars

# Validate required variables
Write-Host "`n--- Required Variables ---" -ForegroundColor Cyan
$missingRequired = @()
$invalidRequired = @()

foreach ($var in $requiredVars) {
    if (-not $envVars.ContainsKey($var)) {
        Write-Error "Missing: $var"
        $missingRequired += $var
    } elseif ($envVars[$var] -match "^(your-|https://your-|ghp_xxx)") {
        Write-Warning "Placeholder value: $var = $($envVars[$var])"
        $invalidRequired += $var
    } else {
        Write-Success "$var = $($envVars[$var].Substring(0, [Math]::Min(20, $envVars[$var].Length)))..."
    }
}

# Validate optional variables
Write-Host "`n--- Optional Variables ---" -ForegroundColor Cyan
foreach ($var in $optionalVars) {
    if (-not $envVars.ContainsKey($var)) {
        Write-Info "Not set: $var (optional)"
    } elseif ($envVars[$var] -match "^(your-|https://your-|ghp_xxx)") {
        Write-Info "Placeholder: $var (optional)"
    } else {
        Write-Success "$var = $($envVars[$var].Substring(0, [Math]::Min(20, $envVars[$var].Length)))..."
    }
}

# Check for unknown variables
Write-Host "`n--- Unknown Variables ---" -ForegroundColor Cyan
$unknownVars = $envVars.Keys | Where-Object { $_ -notin $allVars }
if ($unknownVars.Count -gt 0) {
    foreach ($var in $unknownVars) {
        Write-Warning "Unknown variable: $var"
    }
} else {
    Write-Success "No unknown variables found"
}

# Validate specific formats
Write-Host "`n--- Format Validation ---" -ForegroundColor Cyan

# Check Supabase URL format
if ($envVars.ContainsKey("VITE_SUPABASE_URL")) {
    $url = $envVars["VITE_SUPABASE_URL"]
    if ($url -match "^https://[a-z0-9-]+\.supabase\.co$") {
        Write-Success "VITE_SUPABASE_URL format is valid"
    } else {
        Write-Warning "VITE_SUPABASE_URL format may be invalid: $url"
    }
}

# Check ALLOW_SYNC value
if ($envVars.ContainsKey("ALLOW_SYNC")) {
    $allowSync = $envVars["ALLOW_SYNC"]
    if ($allowSync -eq "1") {
        Write-Success "ALLOW_SYNC is set to 1 (enabled)"
    } else {
        Write-Warning "ALLOW_SYNC is set to '$allowSync' (should be '1')"
    }
}

# Check GitHub repo format
if ($envVars.ContainsKey("VITE_GITHUB_REPO")) {
    $repo = $envVars["VITE_GITHUB_REPO"]
    if ($repo -match "^[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+$") {
        Write-Success "VITE_GITHUB_REPO format is valid"
    } else {
        Write-Warning "VITE_GITHUB_REPO format may be invalid: $repo"
    }
}

# Summary
Write-Host "`n--- Summary ---" -ForegroundColor Cyan

if ($missingRequired.Count -eq 0 -and $invalidRequired.Count -eq 0) {
    Write-Success "All required environment variables are properly configured!"
    Write-Info "You can now run: npm run dev"
} else {
    Write-Error "Environment configuration issues found:"
    if ($missingRequired.Count -gt 0) {
        Write-Error "Missing variables: $($missingRequired -join ', ')"
    }
    if ($invalidRequired.Count -gt 0) {
        Write-Error "Placeholder values: $($invalidRequired -join ', ')"
    }
    
    Write-Host "`n--- Setup Instructions ---" -ForegroundColor Yellow
    Write-Host "1. Get your Supabase project URL and keys from: https://supabase.com/dashboard"
    Write-Host "2. Update .env.local with your actual values"
    Write-Host "3. Run this script again to validate"
    Write-Host "4. Start development server with: npm run dev"
}

# Test Supabase connection if configured
if ($envVars.ContainsKey("VITE_SUPABASE_URL") -and 
    $envVars["VITE_SUPABASE_URL"] -notmatch "your-project-ref") {
    
    Write-Host "`n--- Connection Test ---" -ForegroundColor Cyan
    try {
        $url = $envVars["VITE_SUPABASE_URL"]
        $response = Invoke-WebRequest -Uri "$url/rest/v1/" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Success "Supabase connection successful"
        } else {
            Write-Warning "Supabase connection returned status: $($response.StatusCode)"
        }
    } catch {
        Write-Warning "Supabase connection test failed: $($_.Exception.Message)"
    }
}

Write-Host "`n=== Validation Complete ===" -ForegroundColor Cyan
