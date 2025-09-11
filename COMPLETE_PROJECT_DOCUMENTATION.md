# Aviation Inventory Management System - Complete Project Documentation

## Executive Summary

This document provides comprehensive documentation for the Aviation Inventory Management System, including architecture diagrams, entity-relationship diagrams, workflow charts, security implementations, and user guides. The system is built with React, TypeScript, Tailwind CSS, and Supabase to provide a complete aviation inventory management solution with advanced security features.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Database Design & Entity-Relationship Diagrams](#database-design--entity-relationship-diagrams)
4. [User Workflows & Process Charts](#user-workflows--process-charts)
5. [Security Architecture](#security-architecture)
6. [Technical Implementation](#technical-implementation)
7. [API Documentation](#api-documentation)
8. [User Manual](#user-manual)
9. [Security Implementation](#security-implementation)
10. [Deployment & Configuration](#deployment--configuration)
11. [Troubleshooting & Maintenance](#troubleshooting--maintenance)

---

## 1. Project Overview

### 1.1 System Description
A comprehensive Aviation Inventory Management System designed for aviation maintenance organizations to manage inventory, job cards, customer data, rotable parts lifecycle, and tools with enterprise-grade security and role-based access control.

### 1.2 Key Features
- **Inventory Management**: Product tracking, batch management, stock movements with approval workflows
- **Job Card System**: Aviation job card creation and multi-level approval workflows
- **Customer Management**: Secure customer data with permission-based access and data masking
- **Rotable Parts Lifecycle**: Complete lifecycle tracking for aviation rotable components with compliance monitoring
- **Tool Management**: Tool checkout/check-in system with tracking and overdue management
- **Advanced Security**: AES-256 encryption, row-level security, comprehensive audit logging
- **Role-Based Access Control**: Granular permissions with custom roles and environment-based controls
- **Real-Time Security**: Password breach detection with HaveIBeenPwned integration
- **Code & DB Sync**: Development-only Git and Supabase synchronization with Lovable for seamless collaboration

### 1.3 Technology Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions)
- **UI Framework**: shadcn/ui, Radix UI components
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: React Router DOM
- **Security**: AES-256 encryption, Row-Level Security (RLS), JWT authentication

---

## 2. System Architecture

### 2.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND LAYER                           │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   React     │  │  TypeScript │  │  Tailwind   │  │  shadcn/ui  │ │
│  │   Client    │  │   Types     │  │    CSS      │  │ Components  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Pages &   │  │   Hooks &   │  │  Components │  │   Utils &   │ │
│  │   Routing   │  │ State Mgmt  │  │ & Layouts   │  │ Validation  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                             HTTPS / WSS
                                    │
┌─────────────────────────────────────────────────────────────────────┐
│                          SUPABASE LAYER                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  API Gateway│  │    Auth     │  │  Realtime   │  │ Edge        │ │
│  │  & REST API │  │  Service    │  │  Channels   │  │ Functions   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ Row Level   │  │  Storage    │  │  Security   │  │  Audit &    │ │
│  │  Security   │  │  Buckets    │  │ Functions   │  │  Logging    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                              Connection Pool
                                    │
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                             │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ PostgreSQL  │  │    Tables   │  │    Views    │  │  Functions  │ │
│  │  Database   │  │  & Indexes  │  │ & Policies  │  │ & Triggers  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ Encryption  │  │  Audit      │  │  Backup &   │  │ Performance │ │
│  │  (AES-256)  │  │  Tables     │  │  Recovery   │  │ Monitoring  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Architecture

```
src/
├── components/                    # React Components
│   ├── admin/                    # Administrative Components
│   │   ├── UserManagement.tsx    # User & role management
│   │   ├── SecurityAuditLog.tsx  # Security monitoring
│   │   └── SystemSettings.tsx    # System configuration
│   ├── auth/                     # Authentication Components
│   │   ├── AuthForm.tsx          # Login/signup forms
│   │   ├── ProtectedRoute.tsx    # Route protection
│   │   └── FeatureGate.tsx       # Permission gating
│   ├── inventory/                # Inventory Management
│   │   ├── ProductsList.tsx      # Product catalog
│   │   ├── BatchApprovalList.tsx # Batch approvals
│   │   └── InventoryAnalytics.tsx# Analytics dashboard
│   ├── jobs/                     # Job Card System
│   │   ├── JobCardInterface.tsx  # Main job interface
│   │   ├── JobApprovalPanel.tsx  # Approval workflow
│   │   └── JobReports.tsx        # Job reporting
│   ├── rotable/                  # Rotable Parts Management
│   │   ├── RotablePartsList.tsx  # Parts catalog
│   │   ├── FlightTracking.tsx    # Flight hour tracking
│   │   └── ComplianceTab.tsx     # Compliance monitoring
│   ├── security/                 # Security Components
│   │   ├── SecurityAuditDashboard.tsx  # Security monitoring
│   │   └── ProfileSecurityAlert.tsx    # Data protection alerts
│   └── ui/                       # Base UI Components (shadcn/ui)
├── scripts/                      # Development Scripts
│   └── dev-sync-plugin.ts        # Vite plugin for sync middleware
├── hooks/                        # Custom React Hooks
│   ├── useAuth.tsx              # Authentication state
│   ├── usePasswordSecurity.tsx  # Password validation
│   ├── useEncryptedData.tsx     # Encrypted data handling
│   └── useProfileSafe.tsx       # Secure profile access
├── pages/                        # Route Pages
│   ├── Dashboard.tsx            # Main dashboard
│   ├── Inventory.tsx            # Inventory management
│   ├── JobCards.tsx             # Job card management
│   └── Admin.tsx                # Administration panel
└── lib/                          # Utilities & Libraries
    ├── auth/                    # Authentication utilities
    │   └── useAdminGuard.ts     # Admin role verification
    ├── utils.ts                 # Common utilities
    └── validation.ts            # Form validation schemas
```

### 2.3 Security Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ LEVEL 1: CLIENT-SIDE SECURITY                                      │
├─────────────────────────────────────────────────────────────────────┤
│ • JWT Token Management        • Input Validation & Sanitization     │
│ • Secure Form Handling        • Password Strength Checking          │
│ • Route Protection            • Breach Detection (HaveIBeenPwned)   │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│ LEVEL 2: API & TRANSPORT SECURITY                                  │
├─────────────────────────────────────────────────────────────────────┤
│ • HTTPS/TLS Encryption        • API Rate Limiting                   │
│ • CORS Configuration          • Request/Response Validation         │
│ • JWT Token Verification      • Audit Logging                       │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│ LEVEL 3: APPLICATION SECURITY                                      │
├─────────────────────────────────────────────────────────────────────┤
│ • Role-Based Access Control   • Permission Matrix Validation        │
│ • Environment-Based Controls  • Emergency Access Procedures         │
│ • Data Masking & Protection   • Security Event Monitoring           │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│ LEVEL 4: DATABASE SECURITY                                         │
├─────────────────────────────────────────────────────────────────────┤
│ • Row-Level Security (RLS)    • AES-256 Data Encryption            │
│ • Security Definer Functions • Encrypted Storage Tables             │
│ • Audit Trail Logging        • Privacy-Preserving Analytics        │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│ LEVEL 5: INFRASTRUCTURE SECURITY                                   │
├─────────────────────────────────────────────────────────────────────┤
│ • Database Access Controls    • Backup Encryption                   │
│ • Network Security            • Key Management                      │
│ • Monitoring & Alerting       • Disaster Recovery                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Design & Entity-Relationship Diagrams

### 3.1 Core Entities Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CORE ENTITIES                              │
└─────────────────────────────────────────────────────────────────────┘

          ┌─────────────┐
          │   profiles  │
          │ (users)     │
          │─────────────│
          │ • id (PK)   │
          │ • email     │
          │ • full_name │
          │ • position  │
          │ • dept_id   │
          └─────────────┘
                 │
                 │ 1:N
                 ▼
          ┌─────────────┐      1:N     ┌──────────────────┐
          │ user_roles  │◄─────────────│ inventory_products │
          │─────────────│              │──────────────────│
          │ • id (PK)   │              │ • id (PK)        │
          │ • user_id   │              │ • user_id (FK)   │
          │ • role      │              │ • part_number    │
          └─────────────┘              │ • description    │
                                       │ • unit_cost      │
                                       └──────────────────┘
                                              │
                                              │ 1:N
                                              ▼
                                       ┌──────────────────┐
                                       │ inventory_batches│
                                       │──────────────────│
                                       │ • id (PK)        │
                                       │ • product_id (FK)│
                                       │ • batch_number   │
                                       │ • quantity       │
                                       │ • status         │
                                       └──────────────────┘

┌─────────────┐      1:N     ┌─────────────┐      1:N     ┌─────────────┐
│  customers  │◄─────────────│  job_cards  │◄─────────────│  job_items  │
│─────────────│              │─────────────│              │─────────────│
│ • id (PK)   │              │ • id (PK)   │              │ • id (PK)   │
│ • user_id   │              │ • user_id   │              │ • job_id    │
│ • name      │              │ • customer  │              │ • item_desc │
│ • email     │              │ • aircraft  │              │ • quantity  │
│ • phone     │              │ • status    │              │ • category  │
│ • address   │              │ • job_no    │              └─────────────┘
└─────────────┘              └─────────────┘

          ┌─────────────┐      1:N     ┌──────────────────┐
          │    tools    │◄─────────────│   tool_loans     │
          │─────────────│              │──────────────────│
          │ • id (PK)   │              │ • id (PK)        │
          │ • user_id   │              │ • tool_id (FK)   │
          │ • name      │              │ • borrower_id    │
          │ • serial_no │              │ • checkout_at    │
          │ • status    │              │ • due_at         │
          └─────────────┘              │ • returned_at    │
                                       └──────────────────┘

       ┌─────────────┐      1:N     ┌──────────────────┐
       │rotable_parts│◄─────────────│ flight_tracking  │
       │─────────────│              │──────────────────│
       │ • id (PK)   │              │ • id (PK)        │
       │ • user_id   │              │ • part_id (FK)   │
       │ • part_no   │              │ • flight_hours   │
       │ • serial_no │              │ • flight_cycles  │
       │ • status    │              │ • aircraft_tail  │
       │ • tso_hours │              └──────────────────┘
       │ • tso_cycles│
       └─────────────┘
```

### 3.2 Security & Audit Entities

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SECURITY & AUDIT ENTITIES                       │
└─────────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐      1:N     ┌──────────────────────┐
    │    profiles     │◄─────────────│ profile_security_log │
    │─────────────────│              │──────────────────────│
    │ • id (PK)       │              │ • id (PK)            │
    │ • email         │              │ • profile_id (FK)    │
    │ • full_name     │              │ • accessed_by        │
    │ • phone         │              │ • access_type        │
    │ • badge_id      │              │ • access_granted     │
    └─────────────────┘              │ • ip_address         │
            │                        │ • user_agent        │
            │ 1:1                    │ • created_at         │
            ▼                        └──────────────────────┘
┌───────────────────────┐
│ employee_encrypted_data│
│───────────────────────│      1:N     ┌──────────────────────┐
│ • id (PK)             │◄─────────────│ security_audit_trail │
│ • employee_id (FK)    │              │──────────────────────│
│ • encrypted_email     │              │ • id (PK)            │
│ • encrypted_phone     │              │ • event_type         │
│ • encrypted_address   │              │ • table_name         │
│ • data_classification │              │ • user_id            │
│ • encrypted_by        │              │ • action             │
│ • encrypted_at        │              │ • ip_address         │
└───────────────────────┘              │ • user_agent_hash    │
                                       │ • changes_summary    │
                                       │ • severity           │
    ┌─────────────────┐                │ • created_at         │
    │   customers     │                └──────────────────────┘
    │─────────────────│
    │ • id (PK)       │                ┌──────────────────────┐
    │ • name          │                │customer_permissions  │
    │ • email         │                │──────────────────────│
    │ • phone         │                │ • id (PK)            │
    └─────────────────┘                │ • user_id (FK)       │
            │                          │ • permission_type    │
            │ 1:1                      │ • granted_by         │
            ▼                          │ • granted_at         │
┌───────────────────────┐              │ • expires_at         │
│customer_encrypted_data│              └──────────────────────┘
│───────────────────────│
│ • id (PK)             │       ┌───────────────────────────┐
│ • customer_id (FK)    │       │environment_access_control │
│ • encrypted_email     │       │───────────────────────────│
│ • encrypted_phone     │       │ • id (PK)                 │
│ • encrypted_payment   │       │ • environment             │
│ • data_classification │       │ • user_id (FK)            │
│ • encrypted_by        │       │ • role                    │
│ • encrypted_at        │       │ • allowed_actions         │
└───────────────────────┘       │ • ip_whitelist            │
                                │ • time_restrictions       │
                                │ • expires_at              │
                                └───────────────────────────┘
```

### 3.3 Database Schema Details

#### Core Tables

**profiles** - User profile information with security enhancements
- Primary Key: `id` (UUID)
- Security: RLS enabled, secure views, audit logging
- Sensitive fields: email, phone, badge_id (conditionally protected)

**inventory_products** - Product catalog management
- Primary Key: `id` (UUID)
- Foreign Key: `user_id` → profiles(id)
- Business Logic: Reorder points, stock categories, pricing

**inventory_batches** - Batch tracking with approval workflow
- Primary Key: `id` (UUID)
- Foreign Keys: `user_id` → profiles(id), `product_id` → inventory_products(id)
- Workflow: pending → approved → allocated → consumed

**job_cards** - Aviation job card management
- Primary Key: `jobcardid` (Integer)
- Foreign Key: `user_id` → profiles(id)
- Approval Flow: Multi-level approval system (Warehouse A, B/C, Owner Supplied)

**customers** - Customer management with data protection
- Primary Key: `id` (UUID)
- Foreign Key: `user_id` → profiles(id)
- Security: Permission-based access, secure views, encrypted storage

#### Security Tables

**user_roles** - Role-based access control
- Primary Key: `id` (UUID)
- Foreign Key: `user_id` → profiles(id)
- Roles: admin, hr, parts_approver, job_allocator, batch_manager, auditor, security_officer

**employee_encrypted_data** - AES-256 encrypted employee data
- Primary Key: `id` (UUID)
- Foreign Key: `employee_id` → profiles(id)
- Encryption: AES-256 with environment-based keys

**security_audit_trail** - Comprehensive security event logging
- Primary Key: `id` (UUID)
- Privacy: Hashed user agents, summary-only data, IP logging

---

## 4. User Workflows & Process Charts

### 4.1 User Authentication Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION WORKFLOW                        │
└─────────────────────────────────────────────────────────────────────┘

Start → User Access Application
  │
  ▼
┌─────────────────┐    No     ┌──────────────────┐
│ Authenticated?  │───────────│  Login Page      │
└─────────────────┘           │  • Email         │
  │ Yes                       │  • Password      │
  ▼                           │  • Remember Me   │
┌─────────────────┐           └──────────────────┘
│ Check Session   │                     │
│ Validity        │                     │ Submit
└─────────────────┘                     ▼
  │ Valid                    ┌──────────────────┐
  ▼                         │ Password Security│
┌─────────────────┐         │ Check           │
│ Load Dashboard  │         │ • Strength      │
└─────────────────┘         │ • Breach Check  │
                            │ • Validation    │
                            └──────────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │ Supabase Auth    │
                            │ • JWT Token      │
                            │ • Session Mgmt   │
                            │ • RLS Context    │
                            └──────────────────┘
                                     │ Success
                                     ▼
                            ┌──────────────────┐
                            │ Load User Profile│
                            │ • Basic Info     │
                            │ • Roles         │
                            │ • Permissions   │
                            └──────────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │ Dashboard Access │
                            │ • Role-based UI  │
                            │ • Feature Gates  │
                            │ • Audit Logging  │
                            └──────────────────┘
```

### 4.2 Inventory Management Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                   INVENTORY MANAGEMENT WORKFLOW                    │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐    Add Product    ┌──────────────────┐
│   Product        │◄──────────────────│  Product Entry   │
│   Catalog        │                   │  • Part Number   │
│   • Search       │                   │  • Description   │
│   • Filter       │                   │  • Unit Cost     │
│   • Categories   │                   │  • Reorder Point │
└──────────────────┘                   └──────────────────┘
         │                                      │
         │ Select Product                       │ Save
         ▼                                      ▼
┌──────────────────┐    Receive Stock  ┌──────────────────┐
│   Batch Entry   │◄──────────────────│  Validation &    │
│   • Quantity    │                   │  Business Rules  │
│   • Batch No.   │                   │  • Duplicate     │
│   • Supplier    │                   │    Check         │
│   • Cost        │                   │  • Mandatory     │
│   • Expiry      │                   │    Fields        │
└──────────────────┘                   └──────────────────┘
         │                                      │
         │ Submit                               │
         ▼                                      ▼
┌──────────────────┐                  ┌──────────────────┐
│  Batch Approval  │                  │   Data Storage   │
│  Workflow        │                  │   • Product      │
│  • Pending       │◄─────────────────│     Record       │
│  • Review        │                  │   • Batch        │
│  • Approve/      │                  │     Record       │
│    Reject        │                  │   • Audit Log    │
└──────────────────┘                  └──────────────────┘
         │
         │ Approved
         ▼
┌──────────────────┐
│  Available for   │
│  Allocation      │
│  • Job Cards     │
│  • Stock Issues  │
│  • Transfers     │
└──────────────────┘
```

### 4.3 Job Card Approval Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    JOB CARD APPROVAL WORKFLOW                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────┐     Create Job      ┌─────────────┐
│  Customer   │────────────────────▶│  Job Card   │
│  Request    │                     │  Creation   │
│             │                     │  • Basic    │
│             │                     │    Info     │
│             │                     │  • Customer │
│             │                     │  • Aircraft │
└─────────────┘                     └─────────────┘
                                           │
                                           │ Add Items
                                           ▼
                                   ┌─────────────┐
                        ┌──────────│  Add Items  │
                        │          │  by Category│
                        │          │             │
                        │          └─────────────┘
                        │                 │
              ┌─────────▼─────────┐      │      ┌─────────────────┐
              │  Warehouse A      │      │      │  Owner Supplied │
              │  (Standard Parts) │      │      │  (Customer      │
              │  • Inventory      │      │      │   Provided)     │
              │    Lookup         │      │      │  • Part Desc    │
              │  • Batch          │      │      │  • Quantity     │
              │    Selection      │      │      │  • Notes        │
              │  • Quantity       │      │      └─────────────────┘
              │    Check          │      │                │
              └───────────────────┘      │                │
                        │                │                │
                        │                ▼                │
                        │      ┌─────────────────┐        │
                        │      │  Warehouse B/C  │        │
                        │      │  (Special Parts)│        │
                        │      │  • External     │        │
                        │      │    Sourcing     │        │
                        │      │  • Special      │        │
                        │      │    Orders       │        │
                        │      │  • Long Lead    │        │
                        │      │    Items        │        │
                        │      └─────────────────┘        │
                        │                │                │
                        │                │                │
                        ▼                ▼                ▼
                   ┌──────────────────────────────────────────┐
                   │           APPROVAL PROCESS               │
                   │                                          │
                   │  ┌─────────────┐  ┌─────────────┐       │
                   │  │ Warehouse A │  │ Warehouse   │       │
                   │  │ Approver    │  │ B/C         │       │
                   │  │ • Review    │  │ Approver    │       │
                   │  │   Items     │  │ • Review    │       │
                   │  │ • Check     │  │   Items     │       │
                   │  │   Stock     │  │ • Check     │       │
                   │  │ • Approve   │  │   Sourcing  │       │
                   │  └─────────────┘  │ • Approve   │       │
                   │                   └─────────────┘       │
                   │                                          │
                   │  ┌─────────────┐                        │
                   │  │ Owner       │                        │
                   │  │ Supplied    │                        │
                   │  │ Approver    │                        │
                   │  │ • Review    │                        │
                   │  │   Customer  │                        │
                   │  │   Items     │                        │
                   │  │ • Approve   │                        │
                   │  └─────────────┘                        │
                   └──────────────────────────────────────────┘
                                    │
                                    │ All Approved
                                    ▼
                            ┌─────────────┐
                            │ Job Ready   │
                            │ for Work    │
                            │ • Print     │
                            │   Job Card  │
                            │ • Issue     │
                            │   Parts     │
                            │ • Track     │
                            │   Progress  │
                            └─────────────┘
```

### 4.4 Security Audit Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SECURITY AUDIT WORKFLOW                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────┐     User Action      ┌─────────────┐
│   User      │─────────────────────▶│  System     │
│   Activity  │                      │  Detection  │
│             │                      │             │
└─────────────┘                      └─────────────┘
                                            │
                                            │ Security Event
                                            ▼
                                    ┌─────────────┐
                                    │ Risk        │
                                    │ Assessment  │
                                    │ • Low       │
                                    │ • Medium    │
                                    │ • High      │
                                    │ • Critical  │
                                    └─────────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
                    ▼                       ▼                       ▼
            ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
            │   Low Risk  │         │ Medium Risk │         │ High/Critical│
            │   • Log     │         │ • Log +     │         │ • Immediate │
            │     Only    │         │   Alert     │         │   Alert     │
            │   • Monitor │         │ • Review    │         │ • Auto-     │
            │             │         │   Required  │         │   Response  │
            └─────────────┘         └─────────────┘         │ • Escalation│
                    │                       │               └─────────────┘
                    │                       │                       │
                    ▼                       ▼                       ▼
            ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
            │ Audit Log   │         │ Enhanced    │         │ Security    │
            │ Storage     │         │ Logging     │         │ Team        │
            │ • Standard  │         │ • Context   │         │ Alert       │
            │   Fields    │         │ • IP Track  │         │ • SMS       │
            │ • Retention │         │ • Session   │         │ • Email     │
            │   Policy    │         │   Details   │         │ • Dashboard │
            └─────────────┘         └─────────────┘         └─────────────┘
                    │                       │                       │
                    └───────────────────────┼───────────────────────┘
                                            │
                                            ▼
                                    ┌─────────────┐
                                    │ Compliance  │
                                    │ Reporting   │
                                    │ • Daily     │
                                    │   Summary   │
                                    │ • Monthly   │
                                    │   Report    │
                                    │ • Audit     │
                                    │   Export    │
                                    └─────────────┘
```

### 4.5 Tool Management Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TOOL MANAGEMENT WORKFLOW                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────┐    Register Tool     ┌─────────────┐
│   Tool      │─────────────────────▶│  Tool       │
│   Receipt   │                      │  Entry      │
│             │                      │  • Name     │
│             │                      │  • Serial   │
│             │                      │  • Category │
│             │                      │  • Location │
└─────────────┘                      └─────────────┘
                                            │
                                            │ Save
                                            ▼
                                    ┌─────────────┐
                                    │  Available  │
                                    │  for        │
                                    │  Checkout   │
                                    │             │
                                    └─────────────┘
                                            │
                                            │ Checkout Request
                                            ▼
                                    ┌─────────────┐
                            ┌───────│  Checkout   │
                            │       │  Process    │
                            │       │  • Borrower │
                            │       │  • Due Date │
                            │       │  • Purpose  │
                            │       └─────────────┘
                            │               │
                            │               │ Complete
                            │               ▼
                    ┌─────────────┐  ┌─────────────┐
                    │   Tool      │  │  Checked    │
                    │   Status    │  │  Out        │
                    │   Update    │  │  Status     │
                    │             │  │             │
                    └─────────────┘  └─────────────┘
                            │               │
                            │               │ Monitor Due Date
                            │               ▼
                            │       ┌─────────────┐      Overdue
                            │       │  Due Date   │◄─────────────┐
                            │       │  Tracking   │              │
                            │       │             │              │
                            │       └─────────────┘              │
                            │               │                    │
                            │               │ Due Soon           │
                            │               ▼                    │
                            │       ┌─────────────┐              │
                            │       │  Reminder   │              │
                            │       │  System     │              │
                            │       │  • Email    │              │
                            │       │  • SMS      │              │
                            │       │  • Dashboard│              │
                            │       └─────────────┘              │
                            │               │                    │
                            │               │ Return             │
                            │               ▼                    │
                            │       ┌─────────────┐              │
                            └──────▶│  Tool       │◄─────────────┘
                                    │  Return     │
                                    │  • Inspect  │
                                    │  • Condition│
                                    │  • Notes    │
                                    └─────────────┘
                                            │
                                            │ Return Complete
                                            ▼
                                    ┌─────────────┐
                                    │  Available  │
                                    │  for Next   │
                                    │  Checkout   │
                                    │             │
                                    └─────────────┘
```

---

## 5. Security Architecture

### 5.1 Security Implementation Overview

The system implements a comprehensive security architecture with multiple layers of protection:

#### 5.1.1 Authentication & Authorization
- **JWT-based Authentication**: Managed by Supabase Auth
- **Role-Based Access Control (RBAC)**: Granular permissions system
- **Environment-Based Controls**: Different access levels per environment
- **Session Management**: Automatic token refresh and secure session handling

#### 5.1.2 Data Protection
- **AES-256 Encryption**: Sensitive data encrypted at rest
- **Row-Level Security (RLS)**: Database-level access control
- **Data Masking**: Sensitive fields conditionally displayed
- **Privacy-Preserving Audit**: Logs without exposing sensitive data

#### 5.1.3 Security Monitoring
- **Real-Time Breach Detection**: HaveIBeenPwned API integration
- **Comprehensive Audit Logging**: All security events tracked
- **Anomaly Detection**: Unusual access pattern detection
- **Security Dashboard**: Real-time security event monitoring

### 5.2 Role-Based Permission Matrix

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PERMISSION MATRIX                               │
└─────────────────────────────────────────────────────────────────────┘

Feature/Resource        │ User │ Staff│ Manager│ Admin │ HR   │ Auditor
───────────────────────┼──────┼──────┼────────┼───────┼──────┼────────
Profile (Own)          │  R/W │  R/W │   R/W  │  R/W  │ R/W  │   R
Profile (Others)       │   -  │   R  │    R   │  R/W  │ R/W  │   R
Customer Data (Basic)  │   R  │   R  │    R   │  R/W  │  R   │   R
Customer Data (Full)   │   -  │   -  │   R/W  │  R/W  │  -   │   R
Inventory Products     │   R  │  R/W │   R/W  │  R/W  │  R   │   R
Inventory Batches      │   R  │   C  │   R/W  │  R/W  │  R   │   R
Job Cards (Own)        │  R/W │  R/W │   R/W  │  R/W  │  R   │   R
Job Cards (Others)     │   R  │   R  │    R   │  R/W  │  R   │   R
Job Approvals          │   -  │   A  │    A   │   A   │  -   │   R
Tools                  │   R  │  R/W │   R/W  │  R/W  │  R   │   R
Tool Loans             │  C/R │  R/W │   R/W  │  R/W  │  R   │   R
Rotable Parts          │   R  │  R/W │   R/W  │  R/W  │  R   │   R
Reports                │   R  │   R  │    R   │   R   │  R   │   R
Admin Functions        │   -  │   -  │    -   │  R/W  │  P   │   R
Security Logs          │   -  │   -  │    -   │   R   │  R   │   R
User Management        │   -  │   -  │    P   │  R/W  │ R/W  │   R

Legend: R=Read, W=Write, C=Create, A=Approve, P=Partial, -=No Access
```

### 5.3 Data Encryption Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DATA ENCRYPTION ARCHITECTURE                    │
└─────────────────────────────────────────────────────────────────────┘

                        Application Layer
                              │
                              │ Encrypt/Decrypt Requests
                              ▼
                    ┌─────────────────────┐
                    │   Encryption API    │
                    │   • AES-256         │
                    │   • Key Management  │
                    │   • Error Handling  │
                    └─────────────────────┘
                              │
                              │ Function Calls
                              ▼
                    ┌─────────────────────┐
                    │  Database Functions │
                    │  • encrypt_sensitive_data() │
                    │  • decrypt_sensitive_data() │
                    │  • get_encryption_key()     │
                    └─────────────────────┘
                              │
                              │ Key Derivation
                              ▼
                    ┌─────────────────────┐
                    │   Key Management    │
                    │   • Environment     │
                    │     Based Keys      │
                    │   • SHA-256         │
                    │     Derivation      │
                    └─────────────────────┘
                              │
                              │ Encrypted Storage
                              ▼
    ┌─────────────────────┐         ┌─────────────────────┐
    │ employee_encrypted  │         │ customer_encrypted  │
    │ _data               │         │ _data               │
    │ • encrypted_email   │         │ • encrypted_email   │
    │ • encrypted_phone   │         │ • encrypted_phone   │
    │ • encrypted_address │         │ • encrypted_payment │
    │ • access_log        │         │ • access_log        │
    └─────────────────────┘         └─────────────────────┘
```

### 5.4 Security Audit Trail

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SECURITY AUDIT TRAIL                          │
└─────────────────────────────────────────────────────────────────────┘

Event Sources:
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ User Login  │  │Profile      │  │Data         │  │Permission   │
│Activities   │  │Access       │  │Changes      │  │Violations   │
│• Sign In    │  │• View       │  │• Create     │  │• Access     │
│• Sign Out   │  │• Update     │  │• Update     │  │  Denied     │
│• Failed     │  │• Emergency  │  │• Delete     │  │• Role       │
│  Attempts   │  │  Access     │  │• Encryption │  │  Changes    │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
       │               │               │               │
       └───────────────┼───────────────┼───────────────┘
                       │               │
                       ▼               ▼
                 ┌─────────────────────────┐
                 │    Audit Processing     │
                 │    • Risk Assessment    │
                 │    • Data Anonymization │
                 │    • Context Enrichment │
                 │    • Severity Scoring   │
                 └─────────────────────────┘
                             │
                             ▼
                 ┌─────────────────────────┐
                 │   security_audit_trail  │
                 │   • event_type          │
                 │   • table_name          │
                 │   • user_id             │
                 │   • action              │
                 │   • changes_summary     │
                 │   • ip_address          │
                 │   • user_agent_hash     │
                 │   • severity            │
                 │   • created_at          │
                 └─────────────────────────┘
                             │
                 ┌───────────┼───────────┐
                 │           │           │
                 ▼           ▼           ▼
        ┌─────────────┐ ┌──────────┐ ┌──────────────┐
        │   Real-Time │ │ Security │ │  Compliance  │
        │   Alerts    │ │Dashboard │ │  Reporting   │
        │ • Critical  │ │• Events  │ │ • Daily      │
        │   Events    │ │• Trends  │ │ • Monthly    │
        │ • SMS/Email │ │• Metrics │ │ • Audit      │
        └─────────────┘ └──────────┘ └──────────────┘
```

---

## 6. Technical Implementation

### 6.1 Development Sync Architecture

#### 6.1.1 Vite Plugin Implementation
The Code & DB Sync feature is implemented as a custom Vite plugin that provides middleware endpoints for Git and Supabase operations:

```typescript
// scripts/dev-sync-plugin.ts
import path from "node:path";
import { existsSync } from "node:fs";
import { config as loadDotenv } from "dotenv";

export default function devSyncPlugin() {
  // Load environment variables at startup
  loadEnvOnce();
  
  return {
    name: "station-dev-sync",
    configureServer(server: any) {
      // Middleware endpoints for sync operations
      server.middlewares.use("/__sync/ping", pingHandler);
      server.middlewares.use("/__sync/status", statusHandler);
      server.middlewares.use("/__sync/pull", pullHandler);
      server.middlewares.use("/__sync/push", pushHandler);
      server.middlewares.use("/__sync/db", dbPushHandler);
    },
  };
}
```

#### 6.1.2 Security Implementation
- **Environment Guard**: Requires `ALLOW_SYNC=1` in `.env.local`
- **Development Only**: Plugin only applies in development mode
- **Localhost Restriction**: UI only visible on localhost
- **Admin Role Verification**: Uses `useAdminGuard` hook
- **Audit Logging**: All sync operations logged

#### 6.1.3 API Endpoints
- `GET /__sync/ping` - Health check endpoint
- `GET /__sync/status` - Git status and sync permission check
- `POST /__sync/pull` - Git pull from remote repository
- `POST /__sync/push` - Git push with commit message
- `POST /__sync/db` - Supabase database migration push

### 6.2 Frontend Architecture

#### 6.2.1 Component Structure
The frontend follows a modular component architecture with clear separation of concerns:

**Page-Level Components**: Route handlers that orchestrate data fetching and layout
**Feature Components**: Business logic components for specific functionality
**UI Components**: Reusable design system components based on shadcn/ui
**Layout Components**: Structural components for consistent application layout

#### 6.2.2 State Management
- **TanStack Query**: Server state management with caching and synchronization
- **React Context**: Authentication state and user permissions
- **Local State**: Component-specific state using React hooks
- **Form State**: React Hook Form with Zod validation

#### 6.2.3 Security Implementation
- **Route Protection**: ProtectedRoute components with role checking
- **Feature Gates**: Permission-based component rendering
- **Input Validation**: Client-side validation with Zod schemas
- **Secure Data Handling**: Encrypted data components and hooks

### 6.3 Backend Architecture

#### 6.3.1 Supabase Configuration
The system leverages Supabase for all backend functionality:

**Database**: PostgreSQL with Row-Level Security
**Authentication**: JWT-based authentication with email/password
**Storage**: File storage with bucket policies
**Realtime**: WebSocket connections for live updates
**Edge Functions**: Serverless functions for custom logic

#### 6.3.2 Database Design Principles
- **Row-Level Security**: All user data protected with RLS policies
- **Data Normalization**: Proper normalization with foreign key constraints
- **Audit Trails**: Comprehensive logging for security and compliance
- **Performance**: Optimized indexes and query patterns

#### 6.3.3 Security Functions
Custom database functions implement business logic and security:
- Role checking functions (SECURITY DEFINER)
- Data encryption/decryption functions
- Audit logging functions
- Emergency access procedures

### 6.4 Development Guidelines

#### 6.4.1 Code Standards
- **TypeScript**: Strict typing for all components and functions
- **ESLint**: Code quality and consistency enforcement
- **Prettier**: Automatic code formatting
- **Component Documentation**: Clear prop types and usage examples

#### 6.4.2 Security Guidelines
- **Input Validation**: All user inputs validated and sanitized
- **SQL Injection Prevention**: Use Supabase client methods only
- **XSS Prevention**: Proper data encoding and CSP headers
- **Authentication Required**: All sensitive operations require authentication

#### 6.4.3 Performance Best Practices
- **Code Splitting**: Lazy loading for route components
- **Memoization**: React.memo and useMemo for expensive operations
- **Database Optimization**: Efficient queries with proper indexes
- **Caching**: TanStack Query for intelligent data caching

---

## 7. API Documentation

### 7.1 Authentication API

#### 7.1.1 Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
```

#### 7.1.2 Sign Up
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: {
      full_name: 'John Doe'
    },
    emailRedirectTo: `${window.location.origin}/`
  }
});
```

#### 7.1.3 Password Security Check
```typescript
const { data, error } = await supabase.functions.invoke('check-leaked-password', {
  body: { 
    password: 'user-password',
    userId: 'optional-user-id'
  }
});
```

### 7.2 Database Operations

#### 7.2.1 Inventory Products
```typescript
// Get user's products
const { data, error } = await supabase
  .from('inventory_products')
  .select('*')
  .eq('user_id', user.id);

// Create new product
const { data, error } = await supabase
  .from('inventory_products')
  .insert({
    part_number: 'ABC123',
    description: 'Sample part',
    user_id: user.id
  });
```

#### 7.2.2 Secure Profile Access
```typescript
// Get safe profile data
const { data, error } = await supabase.rpc('get_safe_profile_data', {
  _profile_id: profileId
});

// Emergency admin access
const { data, error } = await supabase.rpc('emergency_profile_access', {
  _profile_id: profileId,
  _justification: 'Critical system issue requires access'
});
```

#### 7.2.3 Encrypted Data Operations
```typescript
// Store encrypted employee data
const { data, error } = await supabase
  .from('employee_encrypted_data')
  .insert({
    employee_id: employeeId,
    encrypted_email: encryptedEmail,
    encrypted_phone: encryptedPhone,
    encrypted_by: user.id
  });
```

### 7.3 Security Functions

#### 7.3.1 Role Checking
```typescript
// Check if user has specific role
const { data, error } = await supabase.rpc('has_role', {
  _user_id: user.id,
  _role: 'admin'
});

// Check customer permissions
const { data, error } = await supabase.rpc('has_customer_permission', {
  _user_id: user.id,
  _permission: 'view_full'
});
```

#### 7.3.2 Audit Logging
```typescript
// Log security event
const { data, error } = await supabase.rpc('log_security_audit', {
  _event_type: 'profile_access',
  _table_name: 'profiles',
  _record_id: profileId,
  _action: 'emergency_access',
  _changes_summary: { reason: 'System maintenance' },
  _severity: 'high'
});
```

### 7.4 Edge Functions

#### 7.4.1 HaveIBeenPwned Integration
**Endpoint**: `/functions/v1/check-leaked-password`
**Method**: POST
**Authentication**: None required

**Request Body**:
```json
{
  "password": "user-password",
  "userId": "optional-user-uuid"
}
```

**Response**:
```json
{
  "isCompromised": false,
  "occurrences": 0,
  "recommendation": "Password has not been found in known data breaches.",
  "severity": "low"
}
```

---

## 8. User Manual

### 8.1 Getting Started

#### 8.1.1 System Access
1. Navigate to the application URL
2. Create an account or sign in with existing credentials
3. Verify email address if required
4. Complete profile setup

#### 8.1.2 Dashboard Overview
The main dashboard provides:
- Recent activity summary
- Pending approvals (if applicable)
- Low stock alerts
- Overdue tools notification
- Quick action buttons

### 8.2 Inventory Management

#### 8.2.1 Product Management
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

#### 8.2.2 Approval Process
**For Approvers**:
1. Navigate to Approvals page
2. Review pending batches
3. Verify quantities and documentation
4. Approve or reject with comments
5. Approved batches become available for allocation

### 8.3 Job Card Management

#### 8.3.1 Creating Job Cards
1. Navigate to Job Cards
2. Click "Create Job"
3. Enter basic job information
4. Add items by category:
   - Warehouse A: Standard inventory items
   - Warehouse B/C: Special or external items
   - Owner Supplied: Customer-provided parts

#### 8.3.2 Job Approval Workflow
1. Submit job card for approval
2. Each category requires specific approval:
   - Warehouse approvers review inventory items
   - Department heads approve special items
   - Customer liaison approves owner-supplied items
3. All approvals required before job becomes active

### 8.4 Customer Management

#### 8.4.1 Customer Data
**Access Levels**:
- Basic: Company name and general information
- Contact: Phone and email access
- Full: Complete customer information
- Management: All data plus editing capabilities

**Adding Customers**:
1. Navigate to Customers
2. Click "Add Customer"
3. Enter customer information based on your access level
4. Include aircraft information if applicable

### 8.5 Security Features

#### 8.5.1 Password Security
The system automatically checks password security:
- Real-time strength validation
- Breach detection using HaveIBeenPwned database
- Security recommendations

#### 8.5.2 Data Protection
- Sensitive information is automatically encrypted
- Access is logged for audit purposes
- Data masking based on user permissions
- Emergency access procedures for critical situations

---

## 9. Security Implementation

### 9.1 Security Architecture Summary

The system implements enterprise-grade security with multiple protection layers:

#### 9.1.1 Authentication & Authorization
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permission system
- **Environment Controls**: Different access levels per environment
- **Session Management**: Automatic token refresh and secure handling

#### 9.1.2 Data Protection
- **AES-256 Encryption**: All sensitive data encrypted at rest
- **Row-Level Security**: Database-level access control
- **Data Masking**: Conditional display of sensitive information
- **Audit Logging**: Comprehensive activity tracking

#### 9.1.3 Real-Time Security
- **Password Breach Detection**: HaveIBeenPwned API integration
- **Anomaly Detection**: Unusual access pattern monitoring
- **Security Dashboard**: Real-time event visualization
- **Automatic Alerts**: Critical event notifications

### 9.2 Security Vulnerabilities Fixed

#### 9.2.1 Data Encryption Implementation
**Problem**: Sensitive employee and customer data stored in plain text
**Solution**: 
- AES-256 encryption for all sensitive fields
- Separate encrypted storage tables
- Environment-based key management
- Automatic encryption triggers

#### 9.2.2 SECURITY DEFINER Function Refactoring
**Problem**: Potential privilege escalation through SECURITY DEFINER functions
**Solution**:
- Converted functions to SECURITY INVOKER where appropriate
- Maintained DEFINER only where necessary for security
- Enhanced input validation and error handling

#### 9.2.3 Audit Trail Protection
**Problem**: Security audit logs exposed sensitive information
**Solution**:
- Privacy-preserving audit logging
- User agent hashing instead of full strings
- Summary-only change tracking
- Proper data retention policies

#### 9.2.4 Password Security Enhancement
**Problem**: No real-time password breach detection
**Solution**:
- HaveIBeenPwned API integration
- K-anonymity for privacy protection
- Severity-based user warnings
- Automatic security event logging

### 9.3 Security Monitoring

#### 9.3.1 Real-Time Monitoring
The system continuously monitors for:
- Failed authentication attempts
- Unusual access patterns
- Permission violations
- Data export activities
- Emergency access usage

#### 9.3.2 Security Metrics
Key security metrics tracked:
- Authentication success/failure rates
- Permission denial rates
- Data access patterns
- Security event severity distribution
- Audit log completeness

#### 9.3.3 Compliance Features
- Comprehensive audit trails
- Data retention policies
- Access control documentation
- Emergency access procedures
- Regular security assessments

---

## 10. Deployment & Configuration

### 10.1 Environment Setup

#### 10.1.1 Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- Git version control
- Supabase account with project created

#### 10.1.2 Installation Steps
1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd aviation-inventory-system
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Configure environment variables:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ```

4. **Database Setup**
   - Run migrations through Supabase dashboard
   - Configure Row-Level Security policies
   - Set up security functions and triggers

5. **Authentication Configuration**
   - Set OTP expiry to 120 seconds (2 minutes)
   - Enable leaked password protection
   - Configure email templates
   - Set redirect URLs

#### 10.1.3 Security Configuration
1. **API Keys**
   - Add HaveIBeenPwned API key to Supabase secrets
   - Configure service role key securely
   - Set up environment-specific encryption keys

2. **Access Control**
   - Create initial admin user
   - Set up role assignments
   - Configure customer permissions
   - Test access controls

### 10.2 Production Deployment

#### 10.2.1 Pre-Deployment Checklist
- [ ] All security vulnerabilities addressed
- [ ] Database migrations completed
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Backup procedures tested
- [ ] Monitoring configured
- [ ] Security audit completed

#### 10.2.2 Deployment Steps
1. **Build Application**
   ```bash
   npm run build
   ```

2. **Deploy to Hosting Platform**
   - Configure build settings
   - Set environment variables
   - Deploy static assets
   - Configure CDN if applicable

3. **Database Configuration**
   - Verify RLS policies active
   - Test security functions
   - Configure backup schedule
   - Set up monitoring

4. **Security Verification**
   - Test authentication flows
   - Verify permission enforcement
   - Check audit logging
   - Test emergency procedures

### 10.3 Monitoring & Maintenance

#### 10.3.1 System Monitoring
- Application performance metrics
- Database query performance
- Error rate tracking
- User activity monitoring
- Security event tracking

#### 10.3.2 Security Maintenance
- Regular security audits
- User permission reviews
- Audit log analysis
- Security patch management
- Backup verification

#### 10.3.3 Regular Tasks
**Daily**:
- Review security alerts
- Check system health
- Monitor error logs

**Weekly**:
- Audit user permissions
- Review security logs
- Check backup integrity

**Monthly**:
- Security assessment
- Performance review
- User access review
- Documentation updates

---

## 11. Troubleshooting & Maintenance

### 11.1 Common Issues

#### 11.1.1 Authentication Issues
**Problem**: Users cannot log in
**Troubleshooting**:
1. Check Supabase authentication settings
2. Verify email confirmation requirements
3. Check rate limiting configuration
4. Review error logs for specific issues

**Problem**: Session timeouts
**Troubleshooting**:
1. Check JWT expiry settings
2. Verify token refresh implementation
3. Review session management code
4. Check network connectivity

#### 11.1.2 Permission Issues
**Problem**: Access denied errors
**Troubleshooting**:
1. Verify user roles in database
2. Check RLS policy configuration
3. Review permission functions
4. Test with admin user

**Problem**: Data not visible
**Troubleshooting**:
1. Check RLS policies
2. Verify user context
3. Review data ownership
4. Check audit logs

#### 11.1.3 Performance Issues
**Problem**: Slow query performance
**Troubleshooting**:
1. Review database indexes
2. Analyze query execution plans
3. Check connection pooling
4. Review data volume

**Problem**: UI responsiveness
**Troubleshooting**:
1. Check network requests
2. Review component rendering
3. Analyze bundle size
4. Check memory usage

### 11.2 Maintenance Procedures

#### 11.2.1 Database Maintenance
- Regular VACUUM and ANALYZE operations
- Index optimization and rebuilding
- Statistics updates
- Connection pool management

#### 11.2.2 Security Maintenance
- User permission audits
- Security log analysis
- Vulnerability assessments
- Incident response procedures

#### 11.2.3 Backup Procedures
- Daily automated backups
- Backup integrity verification
- Disaster recovery testing
- Documentation updates

### 11.3 Support & Documentation

#### 11.3.1 Support Channels
- Technical documentation
- User manuals and guides
- Security incident procedures
- Administrative contacts

#### 11.3.2 Change Management
- Version control procedures
- Deployment documentation
- Testing protocols
- Rollback procedures

---

## Appendices

### Appendix A: Database Schema Reference
[Complete database schema with all tables, relationships, and constraints]

### Appendix B: API Reference
[Detailed API documentation with examples and response formats]

### Appendix C: Security Policies
[Complete security policy documentation and procedures]

### Appendix D: Deployment Scripts
[Automated deployment scripts and configuration files]

### Appendix E: Troubleshooting Guide
[Detailed troubleshooting procedures and solutions]

---

## Document Control

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Prepared By**: Development Team  
**Reviewed By**: Security Team  
**Approved By**: Project Manager  

**Distribution**:
- Development Team
- Security Team
- System Administrators
- End Users

**Change History**:
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | [Date] | Dev Team | Initial documentation |

---

*This document contains comprehensive project documentation including technical specifications, security implementations, user guides, and operational procedures. Regular updates are required as the system evolves.*