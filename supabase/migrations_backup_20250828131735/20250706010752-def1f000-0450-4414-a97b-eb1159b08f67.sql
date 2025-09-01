
-- Add system_owner to the app_role enum
ALTER TYPE public.app_role ADD VALUE 'system_owner';

-- Update RLS policies to include system_owner role with same permissions as admin
DROP POLICY IF EXISTS "Users can create batches" ON public.inventory_batches;
DROP POLICY IF EXISTS "Role-based batch updates" ON public.inventory_batches;

-- Updated policies with system_owner role
CREATE POLICY "Users can create batches"
  ON public.inventory_batches
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND (
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'system_owner') OR
      public.has_role(auth.uid(), 'supervisor') OR
      public.has_role(auth.uid(), 'batch_manager')
    )
  );

CREATE POLICY "Role-based batch updates"
  ON public.inventory_batches
  FOR UPDATE
  USING (
    auth.uid() = user_id AND (
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'system_owner') OR
      (public.has_role(auth.uid(), 'supervisor') AND approval_status = 'pending') OR
      (public.has_role(auth.uid(), 'parts_approver') AND approval_status = 'pending') OR
      (public.has_role(auth.uid(), 'job_allocator') AND approval_status = 'approved') OR
      public.has_role(auth.uid(), 'batch_manager')
    )
  );

-- Update user_roles policies to allow system_owner to manage roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Admins and system owners can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'system_owner')
  );

CREATE POLICY "Admins and system owners can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'system_owner')
  );

-- Update profiles policies to allow system_owner to view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins and system owners can view all profiles"
  ON public.profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'system_owner')
    )
  );
