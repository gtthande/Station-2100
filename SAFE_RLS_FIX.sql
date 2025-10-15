-- Safe RLS Policy Fix - Handles existing policies gracefully
-- Apply this in the Supabase SQL Editor

-- ============================================
-- 1. SAFELY FIX COMPANY TABLE RLS POLICIES
-- ============================================

-- Drop existing policies safely (ignore if they don't exist)
DROP POLICY IF EXISTS "Admins can view company details" ON public.company;
DROP POLICY IF EXISTS "Admins can insert company details" ON public.company;
DROP POLICY IF EXISTS "Admins can update company details" ON public.company;
DROP POLICY IF EXISTS "Admins can delete company details" ON public.company;
DROP POLICY IF EXISTS "Authenticated users can view company details" ON public.company;
DROP POLICY IF EXISTS "Authenticated users can insert company details" ON public.company;
DROP POLICY IF EXISTS "Authenticated users can update company details" ON public.company;
DROP POLICY IF EXISTS "Authenticated users can delete company details" ON public.company;

-- Create new permissive policies for authenticated users
CREATE POLICY "Authenticated users can view company details" 
  ON public.company 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert company details" 
  ON public.company 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update company details" 
  ON public.company 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete company details" 
  ON public.company 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- ============================================
-- 2. SAFELY FIX CUSTOMER_PERMISSIONS TABLE RLS POLICIES
-- ============================================

-- Drop existing policies safely (ignore if they don't exist)
DROP POLICY IF EXISTS "Only admins can manage customer permissions" ON public.customer_permissions;
DROP POLICY IF EXISTS "Users can view their own customer permissions" ON public.customer_permissions;
DROP POLICY IF EXISTS "Authenticated users can view customer permissions" ON public.customer_permissions;
DROP POLICY IF EXISTS "Authenticated users can insert customer permissions" ON public.customer_permissions;
DROP POLICY IF EXISTS "Authenticated users can update customer permissions" ON public.customer_permissions;
DROP POLICY IF EXISTS "Authenticated users can delete customer permissions" ON public.customer_permissions;

-- Create new permissive policies for authenticated users
CREATE POLICY "Authenticated users can view customer permissions" 
  ON public.customer_permissions 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert customer permissions" 
  ON public.customer_permissions 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update customer permissions" 
  ON public.customer_permissions 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete customer permissions" 
  ON public.customer_permissions 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- ============================================
-- 3. SUCCESS MESSAGE
-- ============================================
SELECT 'RLS policies updated successfully! All authenticated users can now access company and customer_permissions tables.' as status;







