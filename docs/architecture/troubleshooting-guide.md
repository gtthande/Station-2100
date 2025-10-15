# Troubleshooting Guide - Station-2100

## Overview

This comprehensive troubleshooting guide provides solutions for common issues encountered when working with Station-2100. The guide is organized by category and includes step-by-step solutions, diagnostic commands, and preventive measures.

## Quick Diagnostic Commands

### System Health Check

```bash
# Check if development server is running
curl http://localhost:8080/__sync/ping

# Check sync status
curl http://localhost:8080/__sync/status

# Check application health
curl http://localhost:8080/api/health

# Check database connectivity
curl http://localhost:8080/api/health/db

# Check authentication status
curl http://localhost:8080/api/health/auth
```

### Environment Verification

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check if dependencies are installed
npm list --depth=0

# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

## Authentication Issues

### Problem: "Invalid login credentials" Error

#### Symptoms
- User cannot log in with correct credentials
- Error message: "Invalid login credentials"
- User account exists in Supabase dashboard

#### Causes
1. Password mismatch
2. User account not confirmed
3. Authentication service issues
4. Environment configuration problems

#### Solutions

**Step 1: Verify User Account**
```bash
# Check if user exists in Supabase
# Go to Supabase Dashboard → Authentication → Users
# Verify user email and confirmation status
```

**Step 2: Reset Password**
```typescript
// Reset password via Supabase
const { error } = await supabase.auth.resetPasswordForEmail('user@example.com', {
  redirectTo: 'https://yourdomain.com/reset-password'
})
```

**Step 3: Check Environment Variables**
```bash
# Verify Supabase configuration
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Check if .env.local exists
ls -la .env*
```

**Step 4: Manual Password Update**
```typescript
// Update password directly via Supabase Admin API
const { data, error } = await supabase.auth.admin.updateUserById(userId, {
  password: 'new-password'
})
```

### Problem: Email Verification Not Working

#### Symptoms
- User receives signup confirmation but no email
- Email verification links expire
- Email delivery failures

#### Solutions

**Step 1: Check Email Configuration**
```bash
# Verify SMTP settings in Supabase Dashboard
# Go to Authentication → Settings → SMTP Settings
```

**Step 2: Check Email Templates**
```bash
# Verify email templates in Supabase Dashboard
# Go to Authentication → Email Templates
```

**Step 3: Test Email Delivery**
```typescript
// Test email sending
const { data, error } = await supabase.auth.resend({
  type: 'signup',
  email: 'test@example.com'
})
```

**Step 4: Check Spam Folder**
- Instruct users to check spam/junk folders
- Add Supabase email to whitelist

### Problem: Session Expiration Issues

#### Symptoms
- User gets logged out frequently
- Session tokens expire unexpectedly
- "Invalid JWT" errors

#### Solutions

**Step 1: Check Session Configuration**
```typescript
// Verify session settings
const session = supabase.auth.getSession()
console.log('Session expiry:', session.data.session?.expires_at)
```

**Step 2: Implement Session Refresh**
```typescript
// Auto-refresh session
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Session refreshed')
  }
})
```

**Step 3: Handle Session Errors**
```typescript
// Handle session errors gracefully
try {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
  
  if (error && error.message.includes('JWT')) {
    // Redirect to login
    window.location.href = '/auth'
  }
} catch (error) {
  console.error('Session error:', error)
}
```

## Database Issues

### Problem: Row Level Security (RLS) Violations

#### Symptoms
- "Insufficient privileges" errors
- Data not loading for authenticated users
- Permission denied errors

#### Solutions

**Step 1: Check RLS Policies**
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

**Step 2: Verify User Roles**
```sql
-- Check user roles
SELECT ur.user_id, ur.role, p.email 
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.id
WHERE ur.user_id = 'user-uuid';
```

**Step 3: Test RLS Functions**
```sql
-- Test role checking function
SELECT has_role('user-uuid', 'admin'::app_role);

-- Test customer permission function
SELECT has_customer_permission('user-uuid', 'view_full');
```

**Step 4: Fix RLS Policies**
```sql
-- Example: Fix profile access policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
```

### Problem: Database Connection Issues

#### Symptoms
- "Connection refused" errors
- Database timeout errors
- Supabase API errors

#### Solutions

**Step 1: Check Database Status**
```bash
# Check Supabase project status
curl -H "apikey: your-anon-key" https://your-project.supabase.co/rest/v1/

# Check database connectivity
psql -h your-host -U postgres -d station2100 -c "SELECT 1;"
```

**Step 2: Verify Connection String**
```typescript
// Check Supabase client configuration
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

console.log('Supabase URL:', process.env.VITE_SUPABASE_URL)
console.log('Supabase Key:', process.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
```

**Step 3: Check Network Connectivity**
```bash
# Test network connectivity
ping your-project.supabase.co

# Test HTTPS connectivity
curl -I https://your-project.supabase.co
```

**Step 4: Check Database Limits**
```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('station2100'));

-- Check active connections
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE state = 'active';
```

### Problem: Migration Issues

#### Symptoms
- Migration failures
- Schema inconsistencies
- Function errors

#### Solutions

**Step 1: Check Migration Status**
```bash
# Check migration history
npx supabase migration list

# Check current schema
npx supabase db diff
```

**Step 2: Fix Migration Issues**
```bash
# Reset database (development only)
npx supabase db reset

# Push specific migration
npx supabase db push --file migration_file.sql
```

**Step 3: Verify Schema**
```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check if all functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public';
```

## Frontend Issues

### Problem: Build Failures

#### Symptoms
- npm run build fails
- TypeScript errors
- Dependency conflicts

#### Solutions

**Step 1: Clear Cache and Reinstall**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install
```

**Step 2: Check TypeScript Errors**
```bash
# Run type checking
npm run type-check

# Fix TypeScript errors
npx tsc --noEmit
```

**Step 3: Check Dependencies**
```bash
# Check for outdated dependencies
npm outdated

# Check for security vulnerabilities
npm audit

# Fix security issues
npm audit fix
```

**Step 4: Check Build Configuration**
```typescript
// Check vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  }
})
```

### Problem: Component Rendering Issues

#### Symptoms
- Components not rendering
- Styling issues
- State management problems

#### Solutions

**Step 1: Check Component Imports**
```typescript
// Verify component imports
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Check if components exist
ls -la src/components/ui/
```

**Step 2: Check State Management**
```typescript
// Verify React Query setup
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
})
```

**Step 3: Check Styling**
```bash
# Check TailwindCSS configuration
cat tailwind.config.ts

# Check if styles are loading
# Inspect element in browser dev tools
```

**Step 4: Debug Component State**
```typescript
// Add debugging to components
const MyComponent = () => {
  const [state, setState] = useState(initialState)
  
  useEffect(() => {
    console.log('Component state:', state)
  }, [state])
  
  return <div>Component content</div>
}
```

### Problem: Performance Issues

#### Symptoms
- Slow page loading
- High memory usage
- Unresponsive UI

#### Solutions

**Step 1: Check Bundle Size**
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist

# Check for large dependencies
npm list --depth=0
```

**Step 2: Optimize Queries**
```typescript
// Optimize database queries
const { data, error } = await supabase
  .from('inventory_products')
  .select('id, part_number, description') // Select only needed columns
  .eq('user_id', user.id)
  .limit(50) // Limit results
  .order('created_at', { ascending: false })
```

**Step 3: Implement Code Splitting**
```typescript
// Lazy load components
const AdminPanel = lazy(() => import('./pages/Admin'))
const Inventory = lazy(() => import('./pages/Inventory'))

// Use Suspense
<Suspense fallback={<LoadingSpinner />}>
  <AdminPanel />
</Suspense>
```

**Step 4: Optimize Images and Assets**
```typescript
// Optimize image loading
<img 
  src={imageUrl} 
  alt="Description"
  loading="lazy"
  width={300}
  height={200}
/>
```

## Development Environment Issues

### Problem: Development Server Not Starting

#### Symptoms
- npm run dev fails
- Port already in use
- Environment variables not loading

#### Solutions

**Step 1: Check Port Availability**
```bash
# Check if port 8080 is in use
netstat -ano | findstr :8080

# Kill process using port
taskkill /PID <process_id> /F

# Or use different port
npm run dev -- --port 3000
```

**Step 2: Check Environment Variables**
```bash
# Check if .env.local exists
ls -la .env*

# Check environment variables
cat .env.local

# Verify variables are loaded
echo $VITE_SUPABASE_URL
```

**Step 3: Check Dependencies**
```bash
# Check if all dependencies are installed
npm list --depth=0

# Install missing dependencies
npm install

# Check for peer dependency warnings
npm install --legacy-peer-deps
```

**Step 4: Use Automated Setup**
```bash
# Use the automated setup script
.\Station-2100.ps1
```

### Problem: Sync Features Not Working

#### Symptoms
- Dev Sync Panel not visible
- Git operations failing
- Database sync errors

#### Solutions

**Step 1: Check Sync Configuration**
```bash
# Check if ALLOW_SYNC is set
echo $ALLOW_SYNC

# Check .env.local file
cat .env.local | grep ALLOW_SYNC
```

**Step 2: Verify Git Configuration**
```bash
# Check Git status
git status

# Check remote configuration
git remote -v

# Check branch
git branch
```

**Step 3: Check Database Password**
```bash
# Verify database password
echo $SUPABASE_DB_PASSWORD

# Test database connection
npx supabase db push --password "your-password"
```

**Step 4: Check Admin Role**
```typescript
// Verify user has admin role
const { data, error } = await supabase.rpc('has_role', {
  _user_id: user.id,
  _role: 'admin'
})
```

## API Issues

### Problem: API Rate Limiting

#### Symptoms
- "Rate limit exceeded" errors
- API requests failing
- 429 HTTP status codes

#### Solutions

**Step 1: Check Rate Limits**
```typescript
// Check rate limit headers
const response = await fetch('/api/endpoint')
const rateLimit = response.headers.get('X-RateLimit-Limit')
const rateRemaining = response.headers.get('X-RateLimit-Remaining')
const rateReset = response.headers.get('X-RateLimit-Reset')

console.log('Rate limit:', rateLimit)
console.log('Remaining:', rateRemaining)
console.log('Reset at:', rateReset)
```

**Step 2: Implement Rate Limit Handling**
```typescript
// Handle rate limiting
const makeRequest = async (url: string) => {
  try {
    const response = await fetch(url)
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After')
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
      return makeRequest(url) // Retry
    }
    
    return response
  } catch (error) {
    console.error('Request failed:', error)
    throw error
  }
}
```

**Step 3: Optimize API Usage**
```typescript
// Batch requests when possible
const batchRequests = async (requests: Promise<any>[]) => {
  return Promise.all(requests)
}

// Use pagination for large datasets
const getPaginatedData = async (page: number, limit: number) => {
  return supabase
    .from('table')
    .select('*')
    .range(page * limit, (page + 1) * limit - 1)
}
```

### Problem: CORS Issues

#### Symptoms
- CORS errors in browser
- API requests blocked
- Cross-origin request failures

#### Solutions

**Step 1: Check CORS Configuration**
```typescript
// Check Supabase CORS settings
// Go to Supabase Dashboard → Settings → API
// Verify allowed origins
```

**Step 2: Configure CORS Headers**
```typescript
// Add CORS headers to requests
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  },
  body: JSON.stringify(data)
})
```

**Step 3: Check Request Headers**
```typescript
// Verify request headers
const request = new Request(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(data)
})

console.log('Request headers:', request.headers)
```

## Security Issues

### Problem: Security Policy Violations

#### Symptoms
- Content Security Policy errors
- XSS warnings
- Security headers missing

#### Solutions

**Step 1: Check CSP Configuration**
```typescript
// Configure Content Security Policy
const cspConfig = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", "data:", "https:"],
  'connect-src': ["'self'", "https://*.supabase.co"]
}
```

**Step 2: Implement Security Headers**
```typescript
// Add security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  next()
})
```

**Step 3: Sanitize User Input**
```typescript
// Sanitize user input
import DOMPurify from 'dompurify'

const sanitizeInput = (input: string) => {
  return DOMPurify.sanitize(input)
}

// Use in forms
const handleSubmit = (data: FormData) => {
  const sanitizedData = {
    ...data,
    description: sanitizeInput(data.description)
  }
  // Submit sanitized data
}
```

### Problem: Data Leakage Issues

#### Symptoms
- Sensitive data exposed in logs
- Unauthorized data access
- Audit trail gaps

#### Solutions

**Step 1: Check Data Masking**
```typescript
// Implement data masking
const maskSensitiveData = (data: any, userPermissions: string[]) => {
  if (!userPermissions.includes('view_full')) {
    return {
      ...data,
      email: '[PROTECTED]',
      phone: '[PROTECTED]',
      address: '[PROTECTED]'
    }
  }
  return data
}
```

**Step 2: Audit Data Access**
```sql
-- Check audit logs
SELECT * FROM profile_security_log 
WHERE access_granted = false 
ORDER BY created_at DESC;

-- Check customer access logs
SELECT * FROM customer_access_log 
WHERE action = 'unauthorized_access'
ORDER BY created_at DESC;
```

**Step 3: Implement Access Controls**
```typescript
// Check user permissions before data access
const checkPermission = async (userId: string, resource: string, action: string) => {
  const { data, error } = await supabase.rpc('check_permission', {
    _user_id: userId,
    _resource: resource,
    _action: action
  })
  
  if (error || !data) {
    throw new Error('Insufficient permissions')
  }
  
  return data
}
```

## Monitoring and Logging

### Problem: Insufficient Monitoring

#### Symptoms
- No visibility into system health
- Difficult to diagnose issues
- No performance metrics

#### Solutions

**Step 1: Implement Health Checks**
```typescript
// Health check endpoint
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
    database: await checkDatabaseHealth(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  }
  
  res.json(health)
})
```

**Step 2: Set Up Logging**
```typescript
// Configure logging
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console()
  ]
})
```

**Step 3: Monitor Performance**
```typescript
// Performance monitoring
const performanceMonitor = {
  startTime: Date.now(),
  
  measure: (name: string, fn: () => Promise<any>) => {
    const start = Date.now()
    return fn().then(result => {
      const duration = Date.now() - start
      logger.info(`Performance: ${name} took ${duration}ms`)
      return result
    })
  }
}
```

## Preventive Measures

### Regular Maintenance

#### Daily Checks
```bash
# Check system health
curl http://localhost:8080/api/health

# Check database connectivity
curl http://localhost:8080/api/health/db

# Check authentication
curl http://localhost:8080/api/health/auth
```

#### Weekly Checks
```bash
# Check for security vulnerabilities
npm audit

# Check for outdated dependencies
npm outdated

# Check database performance
psql -c "SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

#### Monthly Checks
```bash
# Review audit logs
psql -c "SELECT * FROM profile_security_log WHERE created_at > NOW() - INTERVAL '30 days';"

# Check database size
psql -c "SELECT pg_size_pretty(pg_database_size('station2100'));"

# Review error logs
tail -n 1000 error.log | grep ERROR
```

### Backup and Recovery

#### Daily Backups
```bash
#!/bin/bash
# daily_backup.sh
DATE=$(date +%Y%m%d)
pg_dump station2100 > backup_$DATE.sql
gzip backup_$DATE.sql
aws s3 cp backup_$DATE.sql.gz s3://your-backup-bucket/
```

#### Recovery Testing
```bash
#!/bin/bash
# test_recovery.sh
createdb station2100_test
psql station2100_test < latest_backup.sql
psql station2100_test -c "SELECT count(*) FROM profiles;"
dropdb station2100_test
```

## Getting Help

### Support Channels

1. **Documentation**: Check this troubleshooting guide first
2. **GitHub Issues**: Report bugs and request features
3. **Community**: Join discussions and get help from other users
4. **Professional Support**: Contact for enterprise support

### Reporting Issues

When reporting issues, please include:

1. **Environment Details**:
   - OS version
   - Node.js version
   - Browser version
   - Supabase project details

2. **Error Messages**:
   - Complete error messages
   - Stack traces
   - Console logs

3. **Steps to Reproduce**:
   - Detailed steps
   - Expected vs actual behavior
   - Screenshots if applicable

4. **System Information**:
   - Memory usage
   - CPU usage
   - Network connectivity
   - Database status

### Emergency Procedures

#### Critical Issues
1. **Security Breach**: Immediately disable affected accounts
2. **Data Loss**: Restore from latest backup
3. **System Down**: Check health endpoints and restart services
4. **Performance Issues**: Scale resources or optimize queries

#### Contact Information
- **Emergency**: [Emergency contact details]
- **Support**: [Support contact details]
- **Security**: [Security contact details]

## Conclusion

This troubleshooting guide provides comprehensive solutions for common issues encountered with Station-2100. Regular maintenance, monitoring, and following best practices will help prevent many issues from occurring. When issues do arise, this guide provides step-by-step solutions to resolve them quickly and effectively.

Remember to always test solutions in a development environment before applying them to production, and keep backups of your data and configuration files.
