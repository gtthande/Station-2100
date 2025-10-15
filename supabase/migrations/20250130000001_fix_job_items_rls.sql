-- Fix Row Level Security policies for job_items table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own job items" ON public.job_items;
DROP POLICY IF EXISTS "Users can insert their own job items" ON public.job_items;
DROP POLICY IF EXISTS "Users can update their own job items" ON public.job_items;
DROP POLICY IF EXISTS "Users can delete their own job items" ON public.job_items;

-- Create more permissive RLS policies for job_items
-- Allow authenticated users to view all job items (for now)
CREATE POLICY "Allow authenticated users to view job items" 
  ON public.job_items 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert job items
CREATE POLICY "Allow authenticated users to insert job items" 
  ON public.job_items 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update job items
CREATE POLICY "Allow authenticated users to update job items" 
  ON public.job_items 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete job items
CREATE POLICY "Allow authenticated users to delete job items" 
  ON public.job_items 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Also create a more specific policy for user-owned items (for future use)
CREATE POLICY "Users can manage their own job items" 
  ON public.job_items 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON public.job_items TO authenticated;
GRANT ALL ON public.job_items TO anon;

