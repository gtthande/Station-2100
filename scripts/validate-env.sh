#!/bin/bash
# Station-2100 Environment Validation Script (Linux/Mac)
# Validates environment configuration and provides setup guidance

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Functions
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

echo -e "\n${CYAN}=== Station-2100 Environment Validation ===${NC}"

# Check if .env.local exists
ENV_FILE=".env.local"
TEMPLATE_FILE="env-template.txt"

if [ ! -f "$ENV_FILE" ]; then
    warning ".env.local not found"
    if [ "$1" = "--fix" ]; then
        info "Creating .env.local from template..."
        if [ -f "$TEMPLATE_FILE" ]; then
            cp "$TEMPLATE_FILE" "$ENV_FILE"
            success ".env.local created from template"
        else
            error "Template file not found. Cannot auto-fix."
            exit 1
        fi
    else
        info "Run with --fix to create .env.local from template"
        exit 1
    fi
fi

# Read environment file
if [ ! -r "$ENV_FILE" ]; then
    error "Cannot read .env.local"
    exit 1
fi

success ".env.local found and readable"

# Parse environment variables
declare -A ENV_VARS
while IFS='=' read -r key value; do
    # Skip empty lines and comments
    if [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Remove leading/trailing whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)
    
    ENV_VARS["$key"]="$value"
done < "$ENV_FILE"

info "Found ${#ENV_VARS[@]} environment variables"

# Required variables
REQUIRED_VARS=(
    "VITE_SUPABASE_URL"
    "VITE_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "ALLOW_SYNC"
    "VITE_GITHUB_REPO"
    "SUPABASE_DB_PASSWORD"
)

OPTIONAL_VARS=(
    "VITE_GITHUB_TOKEN"
    "HAVEIBEENPWNED_API_KEY"
)

# Validate required variables
echo -e "\n${CYAN}--- Required Variables ---${NC}"
MISSING_REQUIRED=()
INVALID_REQUIRED=()

for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${ENV_VARS[$var]}" ]]; then
        error "Missing: $var"
        MISSING_REQUIRED+=("$var")
    elif [[ "${ENV_VARS[$var]}" =~ ^(your-|https://your-|ghp_xxx) ]]; then
        warning "Placeholder value: $var = ${ENV_VARS[$var]}"
        INVALID_REQUIRED+=("$var")
    else
        value="${ENV_VARS[$var]}"
        if [ ${#value} -gt 20 ]; then
            value="${value:0:20}..."
        fi
        success "$var = $value"
    fi
done

# Validate optional variables
echo -e "\n${CYAN}--- Optional Variables ---${NC}"
for var in "${OPTIONAL_VARS[@]}"; do
    if [[ -z "${ENV_VARS[$var]}" ]]; then
        info "Not set: $var (optional)"
    elif [[ "${ENV_VARS[$var]}" =~ ^(your-|https://your-|ghp_xxx) ]]; then
        info "Placeholder: $var (optional)"
    else
        value="${ENV_VARS[$var]}"
        if [ ${#value} -gt 20 ]; then
            value="${value:0:20}..."
        fi
        success "$var = $value"
    fi
done

# Format validation
echo -e "\n${CYAN}--- Format Validation ---${NC}"

# Check Supabase URL format
if [[ -n "${ENV_VARS[VITE_SUPABASE_URL]}" ]]; then
    url="${ENV_VARS[VITE_SUPABASE_URL]}"
    if [[ "$url" =~ ^https://[a-z0-9-]+\.supabase\.co$ ]]; then
        success "VITE_SUPABASE_URL format is valid"
    else
        warning "VITE_SUPABASE_URL format may be invalid: $url"
    fi
fi

# Check ALLOW_SYNC value
if [[ -n "${ENV_VARS[ALLOW_SYNC]}" ]]; then
    allow_sync="${ENV_VARS[ALLOW_SYNC]}"
    if [[ "$allow_sync" == "1" ]]; then
        success "ALLOW_SYNC is set to 1 (enabled)"
    else
        warning "ALLOW_SYNC is set to '$allow_sync' (should be '1')"
    fi
fi

# Check GitHub repo format
if [[ -n "${ENV_VARS[VITE_GITHUB_REPO]}" ]]; then
    repo="${ENV_VARS[VITE_GITHUB_REPO]}"
    if [[ "$repo" =~ ^[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+$ ]]; then
        success "VITE_GITHUB_REPO format is valid"
    else
        warning "VITE_GITHUB_REPO format may be invalid: $repo"
    fi
fi

# Summary
echo -e "\n${CYAN}--- Summary ---${NC}"

if [ ${#MISSING_REQUIRED[@]} -eq 0 ] && [ ${#INVALID_REQUIRED[@]} -eq 0 ]; then
    success "All required environment variables are properly configured!"
    info "You can now run: npm run dev"
else
    error "Environment configuration issues found:"
    if [ ${#MISSING_REQUIRED[@]} -gt 0 ]; then
        error "Missing variables: ${MISSING_REQUIRED[*]}"
    fi
    if [ ${#INVALID_REQUIRED[@]} -gt 0 ]; then
        error "Placeholder values: ${INVALID_REQUIRED[*]}"
    fi
    
    echo -e "\n${YELLOW}--- Setup Instructions ---${NC}"
    echo "1. Get your Supabase project URL and keys from: https://supabase.com/dashboard"
    echo "2. Update .env.local with your actual values"
    echo "3. Run this script again to validate"
    echo "4. Start development server with: npm run dev"
fi

# Test Supabase connection if configured
if [[ -n "${ENV_VARS[VITE_SUPABASE_URL]}" ]] && [[ ! "${ENV_VARS[VITE_SUPABASE_URL]}" =~ your-project-ref ]]; then
    echo -e "\n${CYAN}--- Connection Test ---${NC}"
    url="${ENV_VARS[VITE_SUPABASE_URL]}"
    if curl -s --connect-timeout 5 "$url/rest/v1/" > /dev/null; then
        success "Supabase connection successful"
    else
        warning "Supabase connection test failed"
    fi
fi

echo -e "\n${CYAN}=== Validation Complete ===${NC}"
