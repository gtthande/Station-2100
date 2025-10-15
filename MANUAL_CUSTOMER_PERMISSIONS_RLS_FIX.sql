-- Manual fix for customer_permissions table RLS policies
-- Apply this in the Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Only admins can manage customer permissions" ON public.customer_permissions;
DROP POLICY IF EXISTS "Users can view their own customer permissions" ON public.customer_permissions;

-- Create more permissive policies for authenticated users
-- Allow any authenticated user to view customer permissions
CREATE POLICY "Authenticated users can view customer permissions" 
  ON public.customer_permissions 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Allow any authenticated user to insert customer permissions
CREATE POLICY "Authenticated users can insert customer permissions" 
  ON public.customer_permissions 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Allow any authenticated user to update customer permissions
CREATE POLICY "Authenticated users can update customer permissions" 
  ON public.customer_permissions 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Allow any authenticated user to delete customer permissions
CREATE POLICY "Authenticated users can delete customer permissions" 
  ON public.customer_permissions 
  FOR DELETE 
  USING (auth.role() = 'authenticated');







