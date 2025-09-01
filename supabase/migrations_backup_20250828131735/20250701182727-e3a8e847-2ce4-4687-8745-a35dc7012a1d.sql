
-- Create an enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'parts_approver', 'job_allocator', 'batch_manager');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create a function to check if user has admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (public.is_admin(auth.uid()));

-- Add approval status and job allocation fields to inventory tables
ALTER TABLE public.inventory_batches 
ADD COLUMN approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN approved_by UUID REFERENCES auth.users(id),
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN job_allocated_to TEXT,
ADD COLUMN job_allocated_by UUID REFERENCES auth.users(id),
ADD COLUMN job_allocated_at TIMESTAMP WITH TIME ZONE;

-- Update RLS policies for inventory_batches to include role-based access
DROP POLICY IF EXISTS "Users can create their own batches" ON public.inventory_batches;
DROP POLICY IF EXISTS "Users can update their own batches" ON public.inventory_batches;

-- New policies with role-based permissions
CREATE POLICY "Users can create batches"
  ON public.inventory_batches
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND (
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'batch_manager')
    )
  );

CREATE POLICY "Role-based batch updates"
  ON public.inventory_batches
  FOR UPDATE
  USING (
    auth.uid() = user_id AND (
      public.has_role(auth.uid(), 'admin') OR
      (public.has_role(auth.uid(), 'parts_approver') AND approval_status = 'pending') OR
      (public.has_role(auth.uid(), 'job_allocator') AND approval_status = 'approved') OR
      public.has_role(auth.uid(), 'batch_manager')
    )
  );

-- Create a view for user roles with profile information
CREATE VIEW public.user_roles_view AS
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  p.email,
  p.full_name,
  ur.created_at,
  ur.updated_at
FROM public.user_roles ur
LEFT JOIN public.profiles p ON ur.user_id = p.id;
