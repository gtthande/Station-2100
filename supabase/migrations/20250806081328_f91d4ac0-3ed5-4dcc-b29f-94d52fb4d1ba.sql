-- Fix security warnings: Remove SECURITY DEFINER views and replace with proper functions

-- First, check what SECURITY DEFINER views exist and drop them
DROP VIEW IF EXISTS public.inventory_summary CASCADE;
DROP VIEW IF EXISTS public.user_roles_view CASCADE;

-- Create SECURITY INVOKER functions instead to replace the views
-- These will respect user-level RLS policies

-- Function to get inventory summary (replaces inventory_summary view)
CREATE OR REPLACE FUNCTION public.get_inventory_summary()
RETURNS TABLE (
  product_id uuid,
  part_number text,
  description text,
  total_quantity numeric,
  allocated_quantity numeric,
  available_quantity numeric,
  reorder_level numeric
) 
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT 
    p.id as product_id,
    p.part_number,
    p.description,
    COALESCE(SUM(b.quantity), 0) as total_quantity,
    COALESCE(SUM(CASE WHEN b.job_allocated_to IS NOT NULL THEN b.quantity ELSE 0 END), 0) as allocated_quantity,
    COALESCE(SUM(CASE WHEN b.job_allocated_to IS NULL THEN b.quantity ELSE 0 END), 0) as available_quantity,
    p.reorder_level
  FROM inventory_products p
  LEFT JOIN inventory_batches b ON p.id = b.product_id AND b.status = 'approved'
  GROUP BY p.id, p.part_number, p.description, p.reorder_level;
$$;

-- Function to get user roles with profiles (replaces user_roles_view)
CREATE OR REPLACE FUNCTION public.get_user_roles_with_profiles()
RETURNS TABLE (
  user_id uuid,
  role text,
  full_name text,
  email text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT 
    ur.user_id,
    ur.role::text,
    p.full_name,
    p.email,
    ur.created_at
  FROM user_roles ur
  LEFT JOIN profiles p ON ur.user_id = p.id;
$$;

-- Update Auth settings to reduce OTP expiry and enable leaked password protection
-- Note: These settings are typically configured in the Supabase dashboard
-- But we can create a note for manual configuration

-- Create a table to track security configurations that need manual setup
CREATE TABLE IF NOT EXISTS public.security_config_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_type text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Insert notes for manual Auth configuration
INSERT INTO public.security_config_notes (config_type, description) VALUES
('auth_otp_expiry', 'Configure OTP expiry to 300 seconds (5 minutes) in Supabase Auth settings'),
('auth_password_protection', 'Enable leaked password protection (HaveIBeenPwned integration) in Supabase Auth settings')
ON CONFLICT DO NOTHING;