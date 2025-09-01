
-- Add a new table to store custom roles
CREATE TABLE public.custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on custom_roles
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view custom roles
CREATE POLICY "Authenticated users can view custom roles"
  ON public.custom_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage custom roles
CREATE POLICY "Admins can manage custom roles"
  ON public.custom_roles
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Insert some default custom roles
INSERT INTO public.custom_roles (name, label, description) VALUES
  ('view_reports', 'View Reports', 'Can view all system reports and analytics'),
  ('manage_customers', 'Manage Customers', 'Can create, edit, and delete customer records'),
  ('manage_suppliers', 'Manage Suppliers', 'Can create, edit, and delete supplier records'),
  ('view_analytics', 'View Analytics', 'Can access business intelligence and analytics dashboards');

-- Update the user_roles table to support custom roles
-- First, let's add a new column for custom role references
ALTER TABLE public.user_roles ADD COLUMN custom_role_id UUID REFERENCES public.custom_roles(id);

-- Make role column nullable since we'll now have either a system role or custom role
ALTER TABLE public.user_roles ALTER COLUMN role DROP NOT NULL;

-- Add a constraint to ensure either role or custom_role_id is set, but not both
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_role_xor_custom 
CHECK (
  (role IS NOT NULL AND custom_role_id IS NULL) OR 
  (role IS NULL AND custom_role_id IS NOT NULL)
);

-- Create a view that combines system and custom roles for easier querying
CREATE OR REPLACE VIEW public.user_roles_combined_view AS
SELECT 
  ur.id,
  ur.user_id,
  ur.created_at,
  ur.updated_at,
  p.email,
  p.full_name,
  CASE 
    WHEN ur.role IS NOT NULL THEN ur.role::text
    ELSE cr.name
  END as role_name,
  CASE 
    WHEN ur.role IS NOT NULL THEN 
      CASE ur.role
        WHEN 'admin' THEN 'System Administrator'
        WHEN 'system_owner' THEN 'System Owner'
        WHEN 'supervisor' THEN 'Supervisor'
        WHEN 'parts_approver' THEN 'Parts Batch Approver'
        WHEN 'job_allocator' THEN 'Parts Issue Approver'
        WHEN 'batch_manager' THEN 'Job Closer'
      END
    ELSE cr.label
  END as role_label,
  CASE 
    WHEN ur.role IS NOT NULL THEN 
      CASE ur.role
        WHEN 'admin' THEN 'Full system access and user management'
        WHEN 'system_owner' THEN 'Business owner with full system access (no database access)'
        WHEN 'supervisor' THEN 'Can supervise all warehouse operations and approve batches'
        WHEN 'parts_approver' THEN 'Can approve parts batched into the system'
        WHEN 'job_allocator' THEN 'Can approve parts issued out of the system'
        WHEN 'batch_manager' THEN 'Can close completed jobs and manage final inventory'
      END
    ELSE cr.description
  END as role_description,
  ur.role IS NOT NULL as is_system_role,
  ur.custom_role_id
FROM public.user_roles ur
JOIN public.profiles p ON ur.user_id = p.id
LEFT JOIN public.custom_roles cr ON ur.custom_role_id = cr.id;
