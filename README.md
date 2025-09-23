# Station-2100 - Aviation Management System

## Table of Contents

- [Project Overview](#project-overview)
- [Current Progress (Intermediate – September 2025)](#current-progress-intermediate--september-2025)
- [Next Steps](#next-steps)
- [Documentation](#documentation)
- [Development Workflow Restart Guide](#development-workflow-restart-guide)
- [Architecture Diagrams](#architecture-diagrams)
- [Conclusion](#conclusion)

## Project Overview

**Station-2100** is a comprehensive aviation inventory and job card management system built with modern web technologies:

- **Frontend**: Next.js 14+, Vite, React 18, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Database**: Prisma ORM with Supabase
- **Styling**: TailwindCSS with shadcn/ui components
- **State Management**: TanStack Query (React Query)
- **Security**: Row-Level Security, AES-256 encryption, audit logging

## Current Progress (Intermediate – September 2025)

### ✅ Completed Infrastructure

#### PowerShell Automation Scripts
- **`Station-2100.ps1`**: Comprehensive startup script with environment setup
- **`dev-health.ps1`**: Health monitoring and endpoint validation
- **`push-changes.ps1`**: Automated Git commit and push workflows

#### Development Environment
- **Sync Health Checks**: Real-time endpoint monitoring (`/__sync/ping`, `/__sync/status`)
- **Cursor Integration**: Seamless AI-assisted development workflow
- **GitHub Automation**: Automated commit and push processes
- **Environment Management**: Proper `.env.local` configuration with `ALLOW_SYNC=1`

#### Core Features
- **Customer Management**: Enhanced with State and Notes fields
- **Security Framework**: Comprehensive permission-based access controls
- **Exchange Rates Manager**: Live API sync with manual override capabilities
- **Inventory Integration**: Automatic currency conversion for cost calculations
- **Documentation**: Comprehensive and up-to-date documentation structure

### 🔧 Current Status
- **Development Server**: ✅ Running at http://localhost:8080
- **Health Checks**: ✅ All sync endpoints operational
- **GitHub Integration**: ✅ Automated workflows active
- **Documentation**: ✅ Comprehensive and up-to-date

## Next Steps

### Immediate Priorities
1. **`pull-changes.ps1`**: Enhanced Git workflow automation with conflict resolution
2. **Environment Validation**: Cross-machine consistency checks
3. **Job Cards Module**: Complete job card lifecycle management
4. **Inventory System**: Advanced inventory tracking and management
5. **Customers/Suppliers**: Enhanced relationship management

## Exchange Rates Manager

### Overview
The Exchange Rates Manager provides real-time currency conversion capabilities for Station-2100's inventory management system. It automatically fetches live exchange rates from external APIs and allows manual overrides when needed.

### Features
- **Live API Integration**: Fetches current exchange rates from `https://api.exchangerate.host/latest?base=USD`
- **Manual Override**: Admins can manually set exchange rates for specific currency pairs
- **Source Tracking**: Tracks whether rates come from API, manual input, or system defaults
- **Inventory Integration**: Automatically converts foreign currency prices to local currency (KES)
- **Admin Panel**: Full management interface in the Admin Panel under "Exchange Rates"

### Supported Currencies
- **USD** → KES (US Dollar to Kenyan Shilling)
- **EUR** → KES (Euro to Kenyan Shilling)  
- **SCR** → KES (Seychelles Rupee to Kenyan Shilling)

### Database Schema
```sql
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency TEXT NOT NULL,
    target_currency TEXT NOT NULL,
    rate NUMERIC(15,6) NOT NULL,
    source TEXT NOT NULL DEFAULT 'api',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(base_currency, target_currency)
);
```

### API Endpoints
- **Update Rates**: `POST /functions/v1/update-exchange-rates`
- **Manual Override**: Update via Admin Panel UI
- **Reset to API**: Restore manual rates to latest API values

### Usage in Inventory
When receiving inventory items priced in foreign currencies:
1. Select the item's currency (USD, EUR, SCR)
2. Enter the unit price
3. System automatically calculates equivalent KES price
4. Shows "Local Guide Price" for reference
5. Allows manual override if needed

### Development Workflow Improvements
- Automated testing integration
- Performance optimization
- Mobile responsiveness enhancements
- Advanced reporting features

## Documentation

- **[DEVLOG.md](./DEVLOG.md)** - Development history and progress tracking
- **[docs/](./docs/)** - Reference documents and detailed reports
- **[USER_MANUAL.md](./USER_MANUAL.md)** - User guide and feature documentation
- **[TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)** - Technical architecture and implementation details

## Supabase Environment Setup

### Required Environment Variables

Create a `.env.local` file in the project root with the following variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Development Sync
ALLOW_SYNC=1

# GitHub Integration
VITE_GITHUB_REPO=gtthande/Station-2100
VITE_GITHUB_TOKEN=your-github-token-here

# Database Password
SUPABASE_DB_PASSWORD=Series-2100Station-2100

# Optional: HaveIBeenPwned API for password security
HAVEIBEENPWNED_API_KEY=your-hibp-api-key-here
```

### Getting Supabase Keys

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project** (or create a new one)
3. **Navigate to Settings → API**
4. **Copy the following values**:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### Security Notes

- **Never commit `.env.local`** to version control (it's in `.gitignore`)
- **Use `.env.example`** as a template for team members
- **Service role key** should only be used server-side (has admin privileges)
- **Anon key** is safe for client-side use (respects RLS policies)

## Development Workflow Restart Guide

### Quick Start
```powershell
# 1. Navigate to project directory
cd "E:\Gtthande Dropbox\George Thande\Projects\Cusor\Station-2100"

# 2. Run automated setup script
.\Station-2100.ps1

# 3. Verify health checks
.\dev-health.ps1

# 4. Access application
# Open browser to http://localhost:8080
```

### Manual Setup (if needed)
```powershell
# Environment setup
echo "ALLOW_SYNC=1" | Out-File -FilePath .env.local -Encoding UTF8

# Install dependencies
npm install

# Start development server
npm run dev

# Verify sync endpoints
Invoke-RestMethod -Uri "http://localhost:8080/__sync/ping"
Invoke-RestMethod -Uri "http://localhost:8080/__sync/status"
```

### Troubleshooting
- **Cursor Hangs**: Restart with summary context for continuity
- **Sync Issues**: Verify `.env.local` contains `ALLOW_SYNC=1`
- **Git Conflicts**: Use `pull-changes.ps1` for safe resolution
- **Environment Issues**: Run `Station-2100.ps1` for automated setup

## Architecture Diagrams

- **[Architecture Documentation](./docs/architecture.md)** - ERD, component diagrams, and deployment diagrams
- **[Architecture Diagrams Folder](./docs/architecture/)** - Visual diagrams and technical specifications

## Conclusion

Station-2100 has successfully established a **stable intermediate foundation** with robust infrastructure, automated workflows, and comprehensive health monitoring. The project is now positioned for **feature-rich module development** with Job Cards, Inventory Management, and enhanced Customer/Supplier relationships as the next major milestones.

**Repository**: https://github.com/gtthande/Station-2100  
**Lovable**: https://lovable.dev/projects/3be45a24-6b88-4267-b181-6d323de70799

---

*Ready for advanced feature development, team collaboration, and production deployment preparation.*