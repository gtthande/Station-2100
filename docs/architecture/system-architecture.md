# System Architecture - Station-2100

[![Cubic Matrix](https://img.shields.io/badge/Cubic_Matrix-v5-purple.svg)](https://raw.githubusercontent.com/gtthande/dev-profiles/main/Dev_Profile_and_Cursor_Prompt_Pack.md)

## Overview

Station-2100 is built on a modern, scalable architecture that separates concerns between the frontend, backend, and data layers. The system uses React 18 + TypeScript for the frontend, Supabase for the backend services, and PostgreSQL for data storage. The architecture follows the Cubic Matrix v5 methodology for consistent development practices.

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[React 18 + TypeScript]
        B[Vite Dev Server]
        C[shadcn/ui Components]
        D[TailwindCSS Styling]
    end
    
    subgraph "API Layer"
        E[Supabase API Gateway]
        F[Authentication Service]
        G[Row Level Security]
        H[Realtime Subscriptions]
    end
    
    subgraph "Data Layer"
        I[PostgreSQL Database]
        J[Edge Functions]
        K[Storage Buckets]
        L[Audit Logs]
    end
    
    subgraph "External Services"
        M[Exchange Rate API]
        N[HaveIBeenPwned API]
        O[GitHub Integration]
    end
    
    A --> E
    B --> A
    C --> A
    D --> A
    E --> F
    E --> G
    E --> H
    E --> I
    E --> J
    E --> K
    E --> L
    E --> M
    E --> N
    A --> O
```

## Component Architecture

### Frontend Components

```mermaid
graph TD
    A[App.tsx] --> B[Router]
    B --> C[Auth Pages]
    B --> D[Dashboard]
    B --> E[Admin Panel]
    B --> F[Inventory]
    B --> G[Job Cards]
    B --> H[Customers]
    B --> I[Tools]
    B --> J[Rotable Parts]
    
    C --> K[LoginForm]
    C --> L[SignupForm]
    
    D --> M[ActivitySummary]
    D --> N[PendingApprovals]
    D --> O[LowStockAlerts]
    
    E --> P[UserManagement]
    E --> Q[SecurityAudit]
    E --> R[DevSyncPanel]
    
    F --> S[ProductCatalog]
    F --> T[BatchManagement]
    F --> U[StockMovements]
    
    G --> V[JobCardForm]
    G --> W[ApprovalWorkflow]
    G --> X[JobCardList]
    
    H --> Y[CustomerList]
    H --> Z[CustomerForm]
    H --> AA[PermissionManagement]
    
    I --> BB[ToolCatalog]
    I --> CC[CheckoutSystem]
    I --> DD[ReturnSystem]
    
    J --> EE[RotablePartsList]
    J --> FF[FlightTracking]
    J --> GG[InstallationLogs]
```

### Data Flow Architecture

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant S as Supabase API
    participant D as Database
    participant A as Audit Log
    
    U->>F: User Action
    F->>S: API Request
    S->>D: Query with RLS
    D-->>S: Data + Permissions
    S->>A: Log Access
    S-->>F: Response
    F-->>U: UI Update
```

## Security Architecture

### Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant S as Supabase Auth
    participant D as Database
    
    U->>F: Enter credentials
    F->>S: signInWithPassword()
    S->>D: Validate user
    D-->>S: User data + roles
    S-->>F: JWT token + session
    F->>F: Store session
    F-->>U: Redirect to dashboard
```

### Authorization System

```mermaid
graph TD
    A[User Request] --> B{Authentication Check}
    B -->|Valid| C{RLS Policy Check}
    B -->|Invalid| D[Access Denied]
    
    C -->|Admin Role| E[Full Access]
    C -->|Staff Role| F[Limited Access]
    C -->|User Role| G[Own Data Only]
    C -->|No Permission| H[Access Denied]
    
    E --> I[Audit Log]
    F --> I
    G --> I
    H --> I
```

### Permission Hierarchy

```mermaid
graph TD
    A[System Owner] --> B[Admin]
    B --> C[HR Manager]
    B --> D[Parts Approver]
    B --> E[Job Allocator]
    B --> F[Batch Manager]
    C --> G[Standard User]
    D --> G
    E --> G
    F --> G
```

## Database Architecture

### Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ PROFILES : has
    USERS ||--o{ USER_ROLES : assigned
    PROFILES ||--o{ INVENTORY_PRODUCTS : owns
    INVENTORY_PRODUCTS ||--o{ INVENTORY_BATCHES : contains
    PROFILES ||--o{ CUSTOMERS : manages
    PROFILES ||--o{ JOB_CARDS : creates
    PROFILES ||--o{ ROTABLE_PARTS : tracks
    PROFILES ||--o{ TOOLS : manages
    PROFILES ||--o{ CUSTOMER_PERMISSIONS : granted
    
    USERS {
        uuid id PK
        string email
        timestamp created_at
        timestamp updated_at
    }
    
    PROFILES {
        uuid id PK
        string email
        string full_name
        string position
        uuid department_id FK
        boolean is_staff
        boolean staff_active
        string phone
        string badge_id
        string profile_image_url
        text bio
        timestamp created_at
        timestamp updated_at
    }
    
    INVENTORY_PRODUCTS {
        uuid id PK
        uuid user_id FK
        string part_number
        text description
        decimal unit_cost
        decimal sale_price
        decimal purchase_price
        string unit_of_measure
        decimal minimum_stock
        decimal reorder_point
        decimal reorder_qty
        timestamp created_at
        timestamp updated_at
    }
    
    INVENTORY_BATCHES {
        uuid id PK
        uuid user_id FK
        uuid product_id FK
        string batch_number
        integer quantity
        decimal cost_per_unit
        date received_date
        date expiry_date
        string status
        string approval_status
        timestamp created_at
        timestamp updated_at
    }
    
    CUSTOMERS {
        uuid id PK
        uuid user_id FK
        string name
        string email
        string phone
        text address
        string city
        string state
        string zip_code
        string country
        string contact_person
        string tail_number
        string aircraft_type
        text notes
        timestamp created_at
        timestamp updated_at
    }
    
    JOB_CARDS {
        integer jobcardid PK
        uuid user_id FK
        string customername
        string aircraft_regno
        text description
        string category
        string job_status
        boolean warehouse_a_approved
        boolean warehouse_bc_approved
        boolean owner_supplied_approved
        timestamp created_at
        timestamp updated_at
    }
    
    ROTABLE_PARTS {
        uuid id PK
        uuid user_id FK
        string part_number
        string serial_number
        string manufacturer
        text description
        rotable_status status
        decimal tso_hours
        integer tso_cycles
        timestamp created_at
        timestamp updated_at
    }
    
    USER_ROLES {
        uuid id PK
        uuid user_id FK
        app_role role
        timestamp created_at
    }
    
    CUSTOMER_PERMISSIONS {
        uuid id PK
        uuid user_id FK
        string permission_type
        uuid granted_by FK
        timestamp granted_at
        timestamp expires_at
        text notes
    }
```

## Development Architecture

### Development Sync System

```mermaid
graph TB
    A[Dev Sync Panel] --> B[Git Status]
    A --> C[Pull from GitHub]
    A --> D[Push to GitHub]
    A --> E[Push DB Migrations]
    
    B --> F[Show current branch]
    B --> G[Show ahead/behind counts]
    
    C --> H[Fetch latest changes]
    C --> I[Handle merge conflicts]
    
    D --> J[Commit staged changes]
    D --> K[Push to remote]
    
    E --> L[Deploy migrations]
    E --> M[Update production DB]
```

### Vite Plugin Architecture

The development sync functionality is implemented as a Vite plugin that provides middleware endpoints:

```typescript
// Vite plugin configuration
export default defineConfig({
  plugins: [
    devSyncPlugin({
      allowSync: process.env.ALLOW_SYNC === '1',
      gitRemote: process.env.GIT_REMOTE || 'origin',
      gitBranch: process.env.GIT_BRANCH || 'main',
      supabasePassword: process.env.SUPABASE_DB_PASSWORD
    })
  ]
});
```

## Deployment Architecture

### Production Deployment

```mermaid
graph TB
    subgraph "Production Environment"
        A[Lovable Platform]
        B[Supabase Cloud]
        C[PostgreSQL Database]
        D[Edge Functions]
        E[Storage Buckets]
    end
    
    subgraph "Development Environment"
        F[Local Development]
        G[GitHub Repository]
        H[Supabase Local]
    end
    
    F --> G
    G --> A
    A --> B
    B --> C
    B --> D
    B --> E
```

### Environment Configuration

```mermaid
graph LR
    A[Development] --> B[.env.local]
    C[Production] --> D[Environment Variables]
    E[Staging] --> F[Staging Config]
    
    B --> G[ALLOW_SYNC=1]
    B --> H[Local Supabase]
    B --> I[GitHub Integration]
    
    D --> J[Production Supabase]
    D --> K[Security Settings]
    D --> L[Monitoring]
    
    F --> M[Staging Supabase]
    F --> N[Test Data]
    F --> O[QA Settings]
```

## Performance Architecture

### Caching Strategy

```mermaid
graph TD
    A[Client Request] --> B{Check Cache}
    B -->|Hit| C[Return Cached Data]
    B -->|Miss| D[Fetch from API]
    D --> E[Update Cache]
    E --> F[Return Data]
    
    G[React Query] --> H[Client Cache]
    I[Supabase] --> J[Database Cache]
    K[CDN] --> L[Static Assets]
```

### Monitoring & Health Checks

```mermaid
graph TB
    A[Health Check Endpoints] --> B[/api/health]
    A --> C[/__sync/ping]
    A --> D[/__sync/status]
    
    B --> E[Application Health]
    B --> F[Database Connectivity]
    B --> G[Authentication Status]
    
    C --> H[Basic Connectivity]
    D --> I[Git Status]
    D --> J[Sync Permissions]
```

## Security Architecture

### Data Protection

```mermaid
graph LR
    A[User Request] --> B{Check Permissions}
    B -->|Admin| C[Full Access]
    B -->|Manage| D[CRUD Access]
    B -->|View Full| E[Read All Fields]
    B -->|View Contact| F[Basic + Contact]
    B -->|View Basic| G[Name Only]
    B -->|No Access| H[Access Denied]
    
    C --> I[Audit Log]
    D --> I
    E --> I
    F --> I
    G --> I
    H --> I
```

### Audit Logging

```mermaid
sequenceDiagram
    participant U as User
    participant A as Application
    participant D as Database
    participant L as Audit Log
    
    U->>A: Action Request
    A->>D: Data Operation
    D-->>A: Response
    A->>L: Log Event
    L-->>A: Confirmation
    A-->>U: Result
```

## API Architecture

### REST API Endpoints

```mermaid
graph TB
    A[Supabase API] --> B[Authentication]
    A --> C[Database Operations]
    A --> D[File Storage]
    A --> E[Realtime]
    
    B --> F[signInWithPassword]
    B --> G[signUp]
    B --> H[signOut]
    B --> I[resetPassword]
    
    C --> J[Select with RLS]
    C --> K[Insert with RLS]
    C --> L[Update with RLS]
    C --> M[Delete with RLS]
    
    D --> N[Upload Files]
    D --> O[Download Files]
    D --> P[Delete Files]
    
    E --> Q[Subscribe to Changes]
    E --> R[Real-time Updates]
```

### Database Functions

```mermaid
graph TB
    A[Database Functions] --> B[Security Functions]
    A --> C[Inventory Functions]
    A --> D[Audit Functions]
    
    B --> E[has_role]
    B --> F[has_customer_permission]
    B --> G[secure_profile_access]
    B --> H[emergency_profile_access]
    
    C --> I[get_stock_valuation_report]
    C --> J[get_batch_breakdown_report]
    C --> K[get_stock_on_hand]
    
    D --> L[log_rotable_action]
    D --> M[audit_customer_access]
    D --> N[profile_security_log]
```

## Conclusion

The Station-2100 architecture is designed for scalability, security, and maintainability. The separation of concerns between frontend, backend, and data layers ensures that the system can evolve and scale as needed. The comprehensive security architecture provides enterprise-grade protection for sensitive aviation data, while the development tools enable efficient collaboration and deployment.
