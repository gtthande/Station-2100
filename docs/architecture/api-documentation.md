# API Documentation - Station-2100

[![Cubic Matrix](https://img.shields.io/badge/Cubic_Matrix-v5-purple.svg)](https://raw.githubusercontent.com/gtthande/dev-profiles/main/Dev_Profile_and_Cursor_Prompt_Pack.md)

## Overview

Station-2100 uses Supabase as its backend API, providing a comprehensive REST API with real-time capabilities, authentication, and row-level security. This document outlines the API endpoints, data models, and usage patterns following the Cubic Matrix v5 methodology.

## Base Configuration

### Supabase Client Setup

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jarlvtojzqkccovburmi.supabase.co'
const supabaseKey = 'your-anon-key-here'

const supabase = createClient(supabaseUrl, supabaseKey)
```

### Environment Variables

```env
VITE_SUPABASE_URL=https://jarlvtojzqkccovburmi.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Authentication API

### Sign In

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})
```

**Response:**
```typescript
{
  user: {
    id: 'uuid',
    email: 'user@example.com',
    user_metadata: {
      full_name: 'John Doe'
    }
  },
  session: {
    access_token: 'jwt-token',
    refresh_token: 'refresh-token',
    expires_at: 1234567890
  }
}
```

### Sign Up

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: {
      full_name: 'John Doe'
    }
  }
})
```

### Sign Out

```typescript
const { error } = await supabase.auth.signOut()
```

### Password Reset

```typescript
const { error } = await supabase.auth.resetPasswordForEmail('user@example.com', {
  redirectTo: 'https://yourdomain.com/reset-password'
})
```

## Database API

### Profiles

#### Get Current User Profile

```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single()
```

#### Update Profile

```typescript
const { data, error } = await supabase
  .from('profiles')
  .update({
    full_name: 'Updated Name',
    position: 'Senior Technician',
    phone: '+1234567890'
  })
  .eq('id', user.id)
```

### Inventory Products

#### Get All Products

```typescript
const { data, error } = await supabase
  .from('inventory_products')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
```

#### Create Product

```typescript
const { data, error } = await supabase
  .from('inventory_products')
  .insert({
    user_id: user.id,
    part_number: 'ABC123',
    description: 'Sample aviation part',
    unit_cost: 150.00,
    unit_of_measure: 'each',
    minimum_stock: 10,
    reorder_point: 5,
    reorder_qty: 20
  })
```

#### Update Product

```typescript
const { data, error } = await supabase
  .from('inventory_products')
  .update({
    description: 'Updated description',
    unit_cost: 175.00
  })
  .eq('id', productId)
  .eq('user_id', user.id)
```

#### Delete Product

```typescript
const { data, error } = await supabase
  .from('inventory_products')
  .delete()
  .eq('id', productId)
  .eq('user_id', user.id)
```

### Inventory Batches

#### Get Batches for Product

```typescript
const { data, error } = await supabase
  .from('inventory_batches')
  .select(`
    *,
    inventory_products (
      part_number,
      description
    )
  `)
  .eq('product_id', productId)
  .eq('user_id', user.id)
  .order('received_date', { ascending: false })
```

#### Create Batch

```typescript
const { data, error } = await supabase
  .from('inventory_batches')
  .insert({
    user_id: user.id,
    product_id: productId,
    batch_number: 'BATCH001',
    quantity: 100,
    cost_per_unit: 150.00,
    received_date: '2024-01-15',
    expiry_date: '2025-01-15',
    status: 'active',
    approval_status: 'pending'
  })
```

#### Update Batch Approval

```typescript
const { data, error } = await supabase
  .from('inventory_batches')
  .update({
    approval_status: 'approved',
    updated_at: new Date().toISOString()
  })
  .eq('id', batchId)
  .eq('user_id', user.id)
```

### Customers

#### Get Customers

```typescript
const { data, error } = await supabase
  .from('customers')
  .select('*')
  .eq('user_id', user.id)
  .order('name')
```

#### Create Customer

```typescript
const { data, error } = await supabase
  .from('customers')
  .insert({
    user_id: user.id,
    name: 'Acme Aviation',
    email: 'contact@acmeaviation.com',
    phone: '+1234567890',
    address: '123 Airport Road',
    city: 'Aviation City',
    state: 'AC',
    zip_code: '12345',
    country: 'United States',
    contact_person: 'John Smith',
    tail_number: 'N123AB',
    aircraft_type: 'Cessna 172',
    notes: 'Regular customer'
  })
```

### Job Cards

#### Get Job Cards

```typescript
const { data, error } = await supabase
  .from('job_cards')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
```

#### Create Job Card

```typescript
const { data, error } = await supabase
  .from('job_cards')
  .insert({
    user_id: user.id,
    customername: 'Acme Aviation',
    aircraft_regno: 'N123AB',
    description: 'Annual inspection',
    category: 'maintenance',
    job_status: 'draft',
    warehouse_a_approved: false,
    warehouse_bc_approved: false,
    owner_supplied_approved: false
  })
```

#### Update Job Card Status

```typescript
const { data, error } = await supabase
  .from('job_cards')
  .update({
    job_status: 'pending',
    warehouse_a_approved: true
  })
  .eq('jobcardid', jobCardId)
  .eq('user_id', user.id)
```

### Rotable Parts

#### Get Rotable Parts

```typescript
const { data, error } = await supabase
  .from('rotable_parts')
  .select('*')
  .eq('user_id', user.id)
  .order('part_number')
```

#### Create Rotable Part

```typescript
const { data, error } = await supabase
  .from('rotable_parts')
  .insert({
    user_id: user.id,
    part_number: 'ROT001',
    serial_number: 'SN123456',
    manufacturer: 'Boeing',
    description: 'Landing gear component',
    status: 'serviceable',
    tso_hours: 0,
    tso_cycles: 0
  })
```

#### Update Rotable Part Status

```typescript
const { data, error } = await supabase
  .from('rotable_parts')
  .update({
    status: 'in_service',
    tso_hours: 100.5,
    tso_cycles: 50
  })
  .eq('id', partId)
  .eq('user_id', user.id)
```

## Database Functions

### Security Functions

#### Check User Role

```typescript
const { data, error } = await supabase.rpc('has_role', {
  _user_id: user.id,
  _role: 'admin'
})
```

#### Check Customer Permission

```typescript
const { data, error } = await supabase.rpc('has_customer_permission', {
  _user_id: user.id,
  _permission: 'view_full'
})
```

#### Emergency Profile Access

```typescript
const { data, error } = await supabase.rpc('emergency_profile_access', {
  _profile_id: profileId,
  _justification: 'Critical system issue requires access'
})
```

### Inventory Functions

#### Get Stock Valuation Report

```typescript
const { data, error } = await supabase.rpc('get_stock_valuation_report', {
  _user_id: user.id,
  _as_of_date: '2024-01-15'
})
```

#### Get Batch Breakdown Report

```typescript
const { data, error } = await supabase.rpc('get_batch_breakdown_report', {
  _user_id: user.id,
  _product_id: productId,
  _as_of_date: '2024-01-15'
})
```

#### Get Stock on Hand

```typescript
const { data, error } = await supabase.rpc('get_stock_on_hand', {
  _user_id: user.id,
  _product_id: productId,
  _as_of_date: '2024-01-15',
  _batch_id: null
})
```

### Audit Functions

#### Log Rotable Action

```typescript
const { data, error } = await supabase.rpc('log_rotable_action', {
  _rotable_part_id: partId,
  _action_type: 'UPDATE',
  _action_description: 'Status changed to serviceable',
  _old_values: { status: 'repair' },
  _new_values: { status: 'serviceable' },
  _related_table: 'rotable_parts',
  _related_id: partId
})
```

## Real-time Subscriptions

### Subscribe to Table Changes

```typescript
const subscription = supabase
  .channel('inventory_changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'inventory_products'
  }, (payload) => {
    console.log('Change received!', payload)
  })
  .subscribe()
```

### Subscribe to Specific User Data

```typescript
const subscription = supabase
  .channel('user_inventory')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'inventory_products',
    filter: `user_id=eq.${user.id}`
  }, (payload) => {
    console.log('User inventory change:', payload)
  })
  .subscribe()
```

### Unsubscribe

```typescript
supabase.removeChannel(subscription)
```

## File Storage API

### Upload File

```typescript
const { data, error } = await supabase.storage
  .from('documents')
  .upload('job-cards/job-001.pdf', file)
```

### Download File

```typescript
const { data, error } = await supabase.storage
  .from('documents')
  .download('job-cards/job-001.pdf')
```

### Get Public URL

```typescript
const { data } = supabase.storage
  .from('documents')
  .getPublicUrl('job-cards/job-001.pdf')
```

### Delete File

```typescript
const { data, error } = await supabase.storage
  .from('documents')
  .remove(['job-cards/job-001.pdf'])
```

## Error Handling

### Common Error Patterns

```typescript
const { data, error } = await supabase
  .from('inventory_products')
  .select('*')

if (error) {
  switch (error.code) {
    case 'PGRST116':
      console.log('No rows returned')
      break
    case '42501':
      console.log('Insufficient privileges')
      break
    case '23505':
      console.log('Duplicate key violation')
      break
    default:
      console.log('Unknown error:', error.message)
  }
}
```

### Error Types

- **PGRST116**: No rows returned
- **42501**: Insufficient privileges (RLS violation)
- **23505**: Duplicate key violation
- **23503**: Foreign key violation
- **23502**: Not null violation

## Rate Limiting

### API Limits

- **Authentication**: 10 requests per minute
- **Database**: 1000 requests per hour
- **Storage**: 100 requests per minute
- **Realtime**: 100 connections per user

### Handling Rate Limits

```typescript
const { data, error } = await supabase
  .from('inventory_products')
  .select('*')

if (error && error.code === '429') {
  // Rate limit exceeded
  const retryAfter = error.headers['retry-after']
  setTimeout(() => {
    // Retry request
  }, retryAfter * 1000)
}
```

## Security Considerations

### Row Level Security

All database operations are protected by Row Level Security (RLS) policies. Users can only access data they own or have permission to view.

### API Key Security

- **Anon Key**: Safe for client-side use, respects RLS policies
- **Service Role Key**: Server-side only, bypasses RLS (use with caution)

### Data Validation

Always validate data on both client and server side:

```typescript
import { z } from 'zod'

const productSchema = z.object({
  part_number: z.string().min(1),
  description: z.string().min(1),
  unit_cost: z.number().positive(),
  unit_of_measure: z.string().min(1)
})

const validatedData = productSchema.parse(productData)
```

## Best Practices

### Query Optimization

1. **Use specific column selection**:
   ```typescript
   .select('id, part_number, description') // Good
   .select('*') // Avoid when possible
   ```

2. **Use filters to limit results**:
   ```typescript
   .eq('user_id', user.id)
   .limit(100)
   ```

3. **Use proper ordering**:
   ```typescript
   .order('created_at', { ascending: false })
   ```

### Caching

Use React Query for client-side caching:

```typescript
import { useQuery } from '@tanstack/react-query'

const { data, error, isLoading } = useQuery({
  queryKey: ['inventory-products', user.id],
  queryFn: () => supabase
    .from('inventory_products')
    .select('*')
    .eq('user_id', user.id),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000 // 10 minutes
})
```

### Error Handling

Always handle errors gracefully:

```typescript
try {
  const { data, error } = await supabase
    .from('inventory_products')
    .insert(productData)
  
  if (error) throw error
  
  return data
} catch (error) {
  console.error('Failed to create product:', error)
  throw new Error('Failed to create product')
}
```

## Conclusion

The Station-2100 API provides a comprehensive set of endpoints for managing aviation inventory, job cards, customers, and rotable parts. The API is built on Supabase's robust infrastructure, providing real-time capabilities, authentication, and security out of the box. Following the best practices outlined in this document will ensure optimal performance and security.
