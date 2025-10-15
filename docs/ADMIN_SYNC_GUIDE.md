# Station-2100 Admin Sync Guide

**Generated:** 2025-01-30  
**Mode:** Cubic Matrix v5 Autopilot  
**Version:** 1.0.0

## 🎯 Overview

The Station-2100 Admin Panel includes two new powerful actions for database management and synchronization:

- **MySQL Connect** - Test and verify MySQL database connection
- **Supabase Sync** - Synchronize data from Supabase to MySQL with dry-run capability

## 🔧 Admin Panel Buttons

### Existing Buttons
- **Dev Sync Panel** – Development synchronization tools
- **Database Access** – Direct database management interface

### New Buttons

#### MySQL Connect
- **Purpose:** Test MySQL database connection via Prisma
- **Action:** Pings MySQL server and returns version information
- **Response:** Shows MySQL version, table count, and connection status
- **Safety:** Read-only operation, no data modification

#### Supabase Sync
- **Purpose:** Synchronize data from Supabase PostgreSQL to MySQL
- **Features:**
  - **Dry Run Mode:** Preview changes without modifying data
  - **Idempotent:** Safe to run multiple times
  - **Transactional:** Each table sync is wrapped in a transaction
  - **Progress Tracking:** Real-time feedback on sync progress
- **Data Synced:**
  - Users (auth.users → users)
  - Profiles (public.profiles → profiles)
  - *More entities can be added following the same pattern*

## 🌐 API Endpoints

### MySQL Ping
```
GET /api/admin/mysql/ping
```

**Response:**
```json
{
  "ok": true,
  "details": {
    "version": "8.0.35",
    "database": "station",
    "tables": 19,
    "connection": "active"
  }
}
```

### Supabase Sync
```
POST /api/admin/supabase/sync?dryRun=true|false
```

**Headers (Optional):**
```
Authorization: Bearer <SYNC_TOKEN>
```

**Response:**
```json
{
  "ok": true,
  "dryRun": true,
  "timestamp": "2025-01-30T15:45:00.000Z",
  "users": {
    "total": 150,
    "inserted": 0,
    "updated": 0
  },
  "profiles": {
    "total": 150,
    "inserted": 0,
    "updated": 0
  }
}
```

## 🔐 Environment Variables

### Required
```bash
# MySQL Database
DATABASE_URL="mysql://root:password@localhost:3306/station"

# Supabase Configuration
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Optional
```bash
# Sync endpoint protection (optional)
SYNC_TOKEN="your-secure-token-here"
```

## 🛡️ Security Features

### Server-Only Operations
- `SUPABASE_SERVICE_ROLE_KEY` is never exposed to client
- All sync operations run server-side only
- API routes are protected and server-only

### Data Safety
- **Dry Run Mode:** Always test with dry-run enabled first
- **Idempotent Operations:** Safe to run multiple times
- **Transaction Wrapping:** Each table sync is atomic
- **Error Handling:** Comprehensive error catching and logging

### Rate Limiting
- Optional token-based authentication for sync endpoint
- Built-in error handling prevents system overload
- Transaction rollback on errors

## 📊 Usage Examples

### 1. Test MySQL Connection
1. Open Admin Panel
2. Click "MySQL Connect"
3. Verify connection status and MySQL version

### 2. Preview Supabase Sync (Dry Run)
1. Open Admin Panel
2. Ensure "Dry-run" checkbox is checked
3. Click "Supabase Sync"
4. Review the summary of changes that would be made

### 3. Perform Actual Sync
1. Open Admin Panel
2. Uncheck "Dry-run" checkbox
3. Click "Supabase Sync"
4. Monitor progress and review results

## 🔍 Monitoring and Logging

### Console Logs
- All sync operations are logged to console
- Error details are captured and reported
- Timing information for performance monitoring

### Toast Notifications
- Success/failure notifications for all operations
- Detailed error messages for troubleshooting
- Progress indicators during long operations

## 🚀 Adding More Entities

To sync additional tables, follow this pattern in `pages/api/admin/supabase/sync.ts`:

```typescript
// 1. Fetch from Supabase
const { data: entities, error } = await supabase.from("table_name").select("*");
if (error) throw error;

// 2. Sync to MySQL
if (!dryRun) {
  await prisma.$transaction(async (tx) => {
    for (const entity of entities) {
      const existing = await tx.tableName.findUnique({ where: { id: entity.id } });
      if (!existing) {
        await tx.tableName.create({ data: entity });
        inserted++;
      } else {
        await tx.tableName.update({ where: { id: entity.id }, data: entity });
        updated++;
      }
    }
  });
}
```

## 🧪 Testing

### Quick Sanity Checks
```bash
# Test MySQL connection
node test-connection.cjs

# Test API endpoints (if server running)
curl http://localhost:8080/api/admin/mysql/ping
curl -X POST "http://localhost:8080/api/admin/supabase/sync?dryRun=true"
```

### Expected Results
- ✅ MySQL ping returns version and table count
- ✅ Dry-run sync shows preview without changes
- ✅ Actual sync performs upserts and returns counts
- ✅ All operations show appropriate toast notifications

## 🎯 Best Practices

1. **Always use dry-run first** to preview changes
2. **Test in development** before production sync
3. **Monitor logs** during sync operations
4. **Backup data** before major sync operations
5. **Use transactions** for data consistency
6. **Handle errors gracefully** with proper user feedback

## 🔧 Troubleshooting

### Common Issues

#### MySQL Connection Failed
- Verify MySQL service is running
- Check `DATABASE_URL` format
- Ensure database `station` exists

#### Supabase Sync Failed
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check network connectivity to Supabase
- Review console logs for detailed error messages

#### Permission Denied
- Ensure `SYNC_TOKEN` is set correctly (if using)
- Check API endpoint authorization headers
- Verify server-side environment variables

### Debug Steps
1. Check browser console for client-side errors
2. Review server logs for API errors
3. Test individual components (MySQL ping, Supabase connection)
4. Verify environment variables are loaded correctly

---

**Generated by Cubic Matrix v5 Autopilot**  
**Station-2100 Admin Panel Enhancement**  
**Status: COMPLETE ✅**
