-- Manual fix for company table RLS policies
-- Apply this in the Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can view company details" ON public.company;
DROP POLICY IF EXISTS "Admins can insert company details" ON public.company;
DROP POLICY IF EXISTS "Admins can update company details" ON public.company;
DROP POLICY IF EXISTS "Admins can delete company details" ON public.company;

-- Create more permissive policies for authenticated users
-- Allow any authenticated user to view company details
CREATE POLICY "Authenticated users can view company details" 
  ON public.company 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Allow any authenticated user to insert company details
CREATE POLICY "Authenticated users can insert company details" 
  ON public.company 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Allow any authenticated user to update company details
CREATE POLICY "Authenticated users can update company details" 
  ON public.company 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Allow any authenticated user to delete company details
CREATE POLICY "Authenticated users can delete company details" 
  ON public.company 
  FOR DELETE 
  USING (auth.role() = 'authenticated');







