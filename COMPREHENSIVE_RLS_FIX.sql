-- Comprehensive RLS Policy Fix for Station-2100
-- Apply this in the Supabase SQL Editor to fix all RLS issues

-- ============================================
-- 1. FIX COMPANY TABLE RLS POLICIES
-- ============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can view company details" ON public.company;
DROP POLICY IF EXISTS "Admins can insert company details" ON public.company;
DROP POLICY IF EXISTS "Admins can update company details" ON public.company;
DROP POLICY IF EXISTS "Admins can delete company details" ON public.company;

-- Create permissive policies for authenticated users
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
-- 2. FIX CUSTOMER_PERMISSIONS TABLE RLS POLICIES
-- ============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Only admins can manage customer permissions" ON public.customer_permissions;
DROP POLICY IF EXISTS "Users can view their own customer permissions" ON public.customer_permissions;

-- Create permissive policies for authenticated users
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
-- 3. VERIFY TABLES EXIST AND ARE ACCESSIBLE
-- ============================================

-- Check if company table exists and has data
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company' AND table_schema = 'public') THEN
        RAISE NOTICE 'Company table does not exist - creating it...';
        
        CREATE TABLE public.company (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            address TEXT,
            city TEXT,
            country TEXT,
            phone TEXT,
            email TEXT,
            website TEXT,
            logo_url TEXT,
            tax_id TEXT,
            zip_code TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
        
        ALTER TABLE public.company ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE 'Company table created successfully';
    ELSE
        RAISE NOTICE 'Company table already exists';
    END IF;
END $$;

-- Check if customer_permissions table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_permissions' AND table_schema = 'public') THEN
        RAISE NOTICE 'Customer_permissions table does not exist - creating it...';
        
        CREATE TABLE public.customer_permissions (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid NOT NULL,
            permission_type text NOT NULL CHECK (permission_type IN ('view_basic', 'view_contact', 'view_full', 'manage')),
            granted_by uuid NOT NULL,
            granted_at timestamp with time zone DEFAULT now(),
            expires_at timestamp with time zone,
            notes text,
            created_at timestamp with time zone DEFAULT now(),
            UNIQUE(user_id, permission_type)
        );
        
        ALTER TABLE public.customer_permissions ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE 'Customer_permissions table created successfully';
    ELSE
        RAISE NOTICE 'Customer_permissions table already exists';
    END IF;
END $$;

-- ============================================
-- 4. SUCCESS MESSAGE
-- ============================================
SELECT 'RLS policies updated successfully! All authenticated users can now access company and customer_permissions tables.' as status;







