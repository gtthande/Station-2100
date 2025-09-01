-- Create a security definer function to get user's highest customer permission level
CREATE OR REPLACE FUNCTION public.get_user_customer_permission_level(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN has_role(_user_id, 'admin'::app_role) THEN 'admin'
    WHEN EXISTS (
      SELECT 1 FROM public.customer_permissions 
      WHERE user_id = _user_id 
        AND permission_type = 'manage' 
        AND (expires_at IS NULL OR expires_at > now())
    ) THEN 'manage'
    WHEN EXISTS (
      SELECT 1 FROM public.customer_permissions 
      WHERE user_id = _user_id 
        AND permission_type = 'view_full' 
        AND (expires_at IS NULL OR expires_at > now())
    ) THEN 'view_full'
    WHEN EXISTS (
      SELECT 1 FROM public.customer_permissions 
      WHERE user_id = _user_id 
        AND permission_type = 'view_contact' 
        AND (expires_at IS NULL OR expires_at > now())
    ) THEN 'view_contact'
    WHEN EXISTS (
      SELECT 1 FROM public.customer_permissions 
      WHERE user_id = _user_id 
        AND permission_type = 'view_basic' 
        AND (expires_at IS NULL OR expires_at > now())
    ) THEN 'view_basic'
    ELSE NULL
  END;
$$;

-- Create a secure view for customer data that respects permission levels
CREATE OR REPLACE VIEW public.customers_secure_view AS
SELECT 
  c.id,
  c.user_id,
  c.name,
  c.aircraft_type,
  c.tail_number,
  c.created_at,
  c.updated_at,
  -- Contact info only for view_contact, view_full, manage, and admin
  CASE 
    WHEN get_user_customer_permission_level(auth.uid()) IN ('view_contact', 'view_full', 'manage', 'admin') 
    THEN c.contact_person 
    ELSE NULL 
  END as contact_person,
  CASE 
    WHEN get_user_customer_permission_level(auth.uid()) IN ('view_contact', 'view_full', 'manage', 'admin') 
    THEN c.email 
    ELSE NULL 
  END as email,
  CASE 
    WHEN get_user_customer_permission_level(auth.uid()) IN ('view_contact', 'view_full', 'manage', 'admin') 
    THEN c.phone 
    ELSE NULL 
  END as phone,
  -- Full details only for view_full, manage, and admin
  CASE 
    WHEN get_user_customer_permission_level(auth.uid()) IN ('view_full', 'manage', 'admin') 
    THEN c.address 
    ELSE NULL 
  END as address,
  CASE 
    WHEN get_user_customer_permission_level(auth.uid()) IN ('view_full', 'manage', 'admin') 
    THEN c.city 
    ELSE NULL 
  END as city,
  CASE 
    WHEN get_user_customer_permission_level(auth.uid()) IN ('view_full', 'manage', 'admin') 
    THEN c.state 
    ELSE NULL 
  END as state,
  CASE 
    WHEN get_user_customer_permission_level(auth.uid()) IN ('view_full', 'manage', 'admin') 
    THEN c.zip_code 
    ELSE NULL 
  END as zip_code,
  CASE 
    WHEN get_user_customer_permission_level(auth.uid()) IN ('view_full', 'manage', 'admin') 
    THEN c.country 
    ELSE NULL 
  END as country,
  CASE 
    WHEN get_user_customer_permission_level(auth.uid()) IN ('view_full', 'manage', 'admin') 
    THEN c.notes 
    ELSE NULL 
  END as notes
FROM public.customers c
WHERE c.user_id = auth.uid()
  AND get_user_customer_permission_level(auth.uid()) IS NOT NULL;

-- Enable RLS on the view
ALTER VIEW public.customers_secure_view SET (security_barrier = true);

-- Grant appropriate permissions
GRANT SELECT ON public.customers_secure_view TO authenticated;

-- Update the existing customers table RLS policies to be more restrictive
DROP POLICY IF EXISTS "Granular customer viewing" ON public.customers;

CREATE POLICY "Restricted customer viewing with granular permissions" 
ON public.customers 
FOR SELECT 
USING (
  auth.uid() = user_id 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR get_user_customer_permission_level(auth.uid()) IS NOT NULL
  )
);

-- Update other policies to be more restrictive
DROP POLICY IF EXISTS "Restricted customer creation" ON public.customers;
DROP POLICY IF EXISTS "Restricted customer updates" ON public.customers;

CREATE POLICY "Restricted customer creation" 
ON public.customers 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR get_user_customer_permission_level(auth.uid()) IN ('manage')
  )
);

CREATE POLICY "Restricted customer updates" 
ON public.customers 
FOR UPDATE 
USING (
  auth.uid() = user_id 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR get_user_customer_permission_level(auth.uid()) IN ('manage')
  )
);