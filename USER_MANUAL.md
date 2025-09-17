# User Manual - Aviation Inventory Management System

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Inventory Management](#inventory-management)
4. [Job Card Management](#job-card-management)
5. [Customer Management](#customer-management)
6. [Tool Management](#tool-management)
7. [Rotable Parts Management](#rotable-parts-management)
8. [Reports & Analytics](#reports--analytics)
9. [Admin Functions](#admin-functions)
10. [Security Features](#security-features)
11. [Code & DB Sync (Development)](#code--db-sync-development)

## Getting Started

### Development Environment Setup
**Recommended Startup Method:**
```powershell
powershell -ExecutionPolicy Bypass -File ".\Station-2100.ps1"
```

This script will:
- Set up the `.env.local` file with `ALLOW_SYNC=1`
- Clear any stale Node.js processes
- Verify and install the `dotenv` dependency if needed
- Start the Vite development server
- Wait for sync endpoints to be ready
- Display sync health status

### System Access
1. Navigate to the application URL (typically http://localhost:8080)
2. Create an account or sign in with existing credentials
3. Verify email address if required
4. Complete profile setup

### Dashboard Overview
The main dashboard provides:
- Recent activity summary
- Pending approvals (if applicable)
- Low stock alerts
- Overdue tools notification
- Quick action buttons

## Inventory Management

### Product Management
**Adding Products**:
1. Navigate to Inventory → Products
2. Click "Add Product"
3. Fill in required information:
   - Part number (unique identifier)
   - Description
   - Unit of measure
   - Cost information
   - Stock levels and reorder points
4. Save the product

**Managing Stock**:
1. Navigate to Inventory → Batches
2. Click "Add Batch"
3. Select product and enter batch details
4. Submit for approval
5. Track approval status

### Approval Process
**For Approvers**:
1. Navigate to Approvals page
2. Review pending batches
3. Verify quantities and documentation
4. Approve or reject with comments
5. Approved batches become available for allocation

## Job Card Management

### Creating Job Cards
1. Navigate to Job Cards
2. Click "Create Job"
3. Enter basic job information
4. Add items by category:
   - Warehouse A: Standard inventory items
   - Warehouse B/C: Special or external items
   - Owner Supplied: Customer-provided parts

### Job Approval Workflow
1. Submit job card for approval
2. Each category requires specific approval:
   - Warehouse approvers review inventory items
   - Department heads approve special items
   - Customer liaison approves owner-supplied items
3. All approvals required before job becomes active

## Customer Management

### Customer Data
**Access Levels**:
- Basic: Company name and general information
- Contact: Phone and email access
- Full: Complete customer information including address details
- Management: All data plus editing capabilities

**Customer Information Fields**:
- **Name** (Required): Customer company or individual name
- **Contact Person**: Primary contact for the customer
- **Email**: Customer email address
- **Phone**: Customer phone number
- **Address**: Street address
- **City**: City location
- **State**: State or province
- **Country**: Country (defaults to "United States")
- **Aircraft Type**: Type of aircraft (e.g., Cessna 172, Boeing 737)
- **Tail Number**: Aircraft registration number (e.g., N123AB)
- **Notes**: Additional notes and comments about the customer

**Adding Customers**:
1. Navigate to Customers
2. Click "Add Customer"
3. Enter customer information based on your access level:
   - Fill in required fields (Name)
   - Add contact information if you have contact access
   - Include full address details if you have full access
   - Add aircraft information if applicable
   - Include any additional notes
4. Click "Add Customer" to save

## Tool Management

### Tool Registration
1. Navigate to Tools
2. Click "Add Tool"
3. Enter tool information:
   - Name and description
   - Serial number
   - Category and location
   - Status

### Tool Checkout Process
1. Select available tool
2. Click "Checkout"
3. Enter borrower information
4. Set due date
5. Add purpose/notes
6. Complete checkout

### Tool Returns
1. Navigate to Tools → Checked Out
2. Select tool to return
3. Inspect tool condition
4. Add return notes
5. Complete return

## Rotable Parts Management

### Parts Lifecycle
1. **Serviceable**: Ready for use
2. **In Service**: Currently installed
3. **Repair**: Under maintenance
4. **Scrapped**: End of life

### Flight Tracking
1. Navigate to Rotable Parts
2. Select part for tracking
3. Enter flight hours/cycles
4. Update aircraft information
5. Monitor compliance status

## Reports & Analytics

### Stock Valuation Report
1. Navigate to Reports → Stock Valuation
2. Select date range
3. View current stock values
4. Export or print report

### Movement Reports
1. Navigate to Reports → Movements
2. Filter by date range and product
3. View detailed movement history
4. Print movement summary

### Batch Reports
1. Navigate to Reports → Batches
2. Filter by status and date
3. View batch approval status
4. Export batch data

## Admin Functions

### User Management
1. Navigate to Admin → User Management
2. View all users and roles
3. Assign/remove roles
4. Manage user permissions

### System Settings
1. Navigate to Admin → Settings
2. Configure system parameters
3. Manage departments
4. Set up approval workflows

### Security Audit
1. Navigate to Admin → Security Audit
2. View security events
3. Monitor access patterns
4. Review audit logs

## Security Features

### Password Security
The system automatically checks password security:
- Real-time strength validation
- Breach detection using HaveIBeenPwned database
- Security recommendations

### Data Protection
- Sensitive information is automatically encrypted
- Access is logged for audit purposes
- Data masking based on user permissions
- Emergency access procedures for critical situations

## Code & DB Sync (Development)

### Overview
The Code & DB Sync feature is available only in development mode and provides one-click synchronization with GitHub and Supabase for seamless collaboration with Lovable.

### Prerequisites
- Development environment (`npm run dev`)
- Localhost access only
- Admin role required
- `ALLOW_SYNC=1` in `.env.local`

### Accessing the Sync Panel
1. Navigate to Admin page
2. Click "Dev Sync Panel" tab (visible only in dev mode)
3. Ensure you have admin privileges

### Available Actions

#### Status Check
- Click "Status" to check current Git status
- Shows current branch, ahead/behind counts
- Displays last commit information

#### Pull from GitHub
- Click "Pull" to fetch latest changes from GitHub
- Syncs with Lovable's latest updates
- Automatically handles merge conflicts

#### Push to GitHub
- Enter commit message
- Click "Push" to send changes to GitHub
- Includes all staged changes
- Updates remote repository

#### Database Push
- Click "DB Push" to deploy Supabase migrations
- Pushes local database changes to production
- Requires `SUPABASE_DB_PASSWORD` in `.env.local`

### Environment Configuration
Create `.env.local` in project root:
```env
ALLOW_SYNC=1
GIT_REMOTE=origin
GIT_BRANCH=main
SUPABASE_DB_PASSWORD=your-db-password
```

### Safety Features
- Only works in development mode
- Requires explicit `ALLOW_SYNC=1` setting
- Admin role verification
- Localhost-only access
- All actions logged for audit

### Troubleshooting
**Sync Disabled Error**:
- Ensure `ALLOW_SYNC=1` in `.env.local`
- Restart development server
- Verify admin role assignment

**Git Errors**:
- Check Git configuration
- Verify remote repository access
- Ensure working directory is clean

**Database Errors**:
- Verify `SUPABASE_DB_PASSWORD` is correct
- Check Supabase project access
- Ensure migrations are valid

---

**Note**: The Code & DB Sync feature is designed for development use only and provides seamless integration with Lovable's development workflow. All sync operations are logged and require explicit admin authorization.
