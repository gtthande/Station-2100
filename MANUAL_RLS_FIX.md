# Manual RLS Fix for job_items Table

## Problem
The `job_items` table has Row Level Security (RLS) policies that are too restrictive, causing "Failed to save part" errors.

## Solution
Run the following SQL in your Supabase Dashboard > SQL Editor:

```sql
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own job items" ON public.job_items;
DROP POLICY IF EXISTS "Users can insert their own job items" ON public.job_items;
DROP POLICY IF EXISTS "Users can update their own job items" ON public.job_items;
DROP POLICY IF EXISTS "Users can delete their own job items" ON public.job_items;

-- Create more permissive policies
CREATE POLICY "Allow authenticated users to view job items" 
  ON public.job_items 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert job items" 
  ON public.job_items 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update job items" 
  ON public.job_items 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete job items" 
  ON public.job_items 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.job_items TO authenticated;
GRANT ALL ON public.job_items TO anon;
```

## Steps
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Paste the SQL above
4. Click "Run"
5. Test the application again

## Alternative: Disable RLS Temporarily
If you want to disable RLS temporarily for testing:

```sql
ALTER TABLE public.job_items DISABLE ROW LEVEL SECURITY;
```

**Note: Only do this for testing. Re-enable RLS in production for security.**







