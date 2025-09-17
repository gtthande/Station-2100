# Station-2100 - Aviation Management System

## Project info

**URL**: https://lovable.dev/projects/3be45a24-6b88-4267-b181-6d323de70799
**GitHub**: https://github.com/gtthande/Station-2100

## Recent Updates

### Customer Management Enhancements
- ✅ Added **State** field to customer information
- ✅ Added **Notes** field for additional customer details
- ✅ Updated customer dialog with improved form layout
- ✅ Enhanced customer display panel with new fields
- ✅ Maintained security permissions for sensitive information

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/3be45a24-6b88-4267-b181-6d323de70799) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- **Frontend**: Vite, TypeScript, React, shadcn-ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth with JWT tokens
- **File Storage**: Supabase Storage with bucket policies
- **Real-time**: Supabase Realtime channels

## Database & Backend Setup

This project uses **Supabase exclusively** for all backend services. No additional database setup required.

### Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Get your Supabase credentials from [your Supabase dashboard](https://supabase.com/dashboard):
   - Project URL
   - Anon/Public key
   - Service role key (for server-side operations only)

3. Update `.env` with your Supabase credentials:
```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Local Development

**Recommended Startup Method:**
```powershell
powershell -ExecutionPolicy Bypass -File ".\Station-2100.ps1"
```

**Alternative Method:**
```bash
# Install dependencies
npm install

# Start development server  
npm run dev
```

### Database Migrations

All database migrations are handled through Supabase:
- Schema changes are in `supabase/migrations/`
- Row Level Security (RLS) policies protect all user data
- Authentication and user management via Supabase Auth

### Health Check

Access `/api/supabase-check` to verify all Supabase services are connected.

## Security Configuration

⚠️ **Important**: After setting up the project, complete these security configurations:

### Required Supabase Dashboard Settings

1. **Authentication > Settings**:
   - Set **OTP expiry**: 600 seconds (10 minutes)
   - Enable **leaked password protection**
   - Set **minimum password length**: 8 characters
   - Enable **password strength requirements**

2. **Authentication > Rate Limiting**:
   - Review and configure appropriate rate limits for sign-in attempts

### Security Features Implemented

- ✅ **Row Level Security (RLS)** on all sensitive tables
- ✅ **Permission-based data access** for customer information
- ✅ **Audit logging** for all sensitive data access
- ✅ **Data masking** for secure logging
- ✅ **Emergency access procedures** with admin controls

### Verify Security Setup

Run these checks after configuration:

```bash
# 1. Check database connectivity and RLS
curl http://localhost:5173/api/supabase-check

# 2. Review audit logs (admin only)
# Login to your app and check the Admin > Security Audit section

# 3. Test customer permission levels
# Create test users with different permission levels and verify data access
```

For detailed security information, see [SECURITY_FIXES.md](./SECURITY_FIXES.md).

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/3be45a24-6b88-4267-b181-6d323de70799) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
