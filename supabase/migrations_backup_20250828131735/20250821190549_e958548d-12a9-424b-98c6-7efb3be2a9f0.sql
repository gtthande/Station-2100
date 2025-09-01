-- Fix Customer Contact Information Security Issues (Fixed Version)
-- This migration addresses the security vulnerabilities in customer data access

-- 1. Create a more secure customer view that respects permission levels
DROP VIEW IF EXISTS public.customers_secure_view CASCADE;

CREATE OR REPLACE VIEW public.customers_secure_view AS
SELECT 
  c.id,
  c.user_id,
  c.name,
  c.created_at,
  c.updated_at,
  c.aircraft_type,
  c.tail_number,
  c.notes,
  
  -- Only show contact info based on permission level
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) OR 
         get_user_customer_permission_level(auth.uid()) IN ('view_contact', 'view_full', 'manage') 
    THEN c.email 
    ELSE '[PROTECTED]'
  END as email,
  
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) OR 
         get_user_customer_permission_level(auth.uid()) IN ('view_contact', 'view_full', 'manage') 
    THEN c.phone 
    ELSE '[PROTECTED]'
  END as phone,
  
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) OR 
         get_user_customer_permission_level(auth.uid()) IN ('view_contact', 'view_full', 'manage') 
    THEN c.contact_person 
    ELSE '[PROTECTED]'
  END as contact_person,
  
  -- Only show full address details for view_full and manage permissions
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) OR 
         get_user_customer_permission_level(auth.uid()) IN ('view_full', 'manage') 
    THEN c.address 
    ELSE '[PROTECTED]'
  END as address,
  
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) OR 
         get_user_customer_permission_level(auth.uid()) IN ('view_full', 'manage') 
    THEN c.city 
    ELSE c.city -- City can be shown for basic geo info
  END as city,
  
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) OR 
         get_user_customer_permission_level(auth.uid()) IN ('view_full', 'manage') 
    THEN c.state 
    ELSE c.state -- State can be shown for basic geo info
  END as state,
  
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) OR 
         get_user_customer_permission_level(auth.uid()) IN ('view_full', 'manage') 
    THEN c.zip_code 
    ELSE '[PROTECTED]'
  END as zip_code,
  
  c.country -- Country is generally not sensitive
  
FROM public.customers c
WHERE 
  -- User must own the record AND have at least basic view permission
  c.user_id = auth.uid() 
  AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    get_user_customer_permission_level(auth.uid()) IS NOT NULL
  );

-- Enable RLS on the view (inherited from base table)
ALTER VIEW public.customers_secure_view SET (security_barrier = true);

-- 2. Create even more restrictive RLS policies for the main customers table
DROP POLICY IF EXISTS "Restricted customer viewing with granular permissions" ON public.customers;
DROP POLICY IF EXISTS "Restricted customer creation" ON public.customers;
DROP POLICY IF EXISTS "Restricted customer updates" ON public.customers;

-- Only admins and managers can directly access the main customers table
CREATE POLICY "Admin and manager only customer access" ON public.customers
FOR ALL
USING (
  auth.uid() = user_id AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    get_user_customer_permission_level(auth.uid()) = 'manage'
  )
)
WITH CHECK (
  auth.uid() = user_id AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    get_user_customer_permission_level(auth.uid()) = 'manage'
  )
);

-- 3. Create a function to log sensitive customer data access
CREATE OR REPLACE FUNCTION public.log_customer_data_access(
  _customer_id uuid,
  _access_type text DEFAULT 'view',
  _sensitive_fields text[] DEFAULT ARRAY[]::text[]
) 
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log all access to customer data for security auditing
  INSERT INTO public.customer_access_log (
    user_id, 
    customer_id, 
    action,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    _customer_id,
    _access_type || ' - Fields: ' || array_to_string(_sensitive_fields, ','),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
END;
$$;

-- 4. Create additional security functions
CREATE OR REPLACE FUNCTION public.mask_sensitive_customer_data(_data text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Mask sensitive data for logging
  IF _data IS NULL OR length(_data) = 0 THEN
    RETURN _data;
  END IF;
  
  -- Show first and last 2 characters, mask the middle
  IF length(_data) > 4 THEN
    RETURN substring(_data from 1 for 2) || 
           repeat('*', greatest(0, length(_data) - 4)) || 
           substring(_data from length(_data) - 1);
  ELSE
    RETURN repeat('*', length(_data));
  END IF;
END;
$$;

-- 5. Create a function for emergency customer access (admin only)
CREATE OR REPLACE FUNCTION public.emergency_customer_access(
  _customer_id uuid,
  _justification text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  customer_data json;
BEGIN
  -- Only admins can use emergency access
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Emergency access requires administrator privileges';
  END IF;
  
  -- Require detailed justification
  IF _justification IS NULL OR length(trim(_justification)) < 20 THEN
    RAISE EXCEPTION 'Emergency access requires detailed justification (minimum 20 characters)';
  END IF;
  
  -- Log emergency access
  INSERT INTO public.customer_access_log (
    user_id, 
    customer_id, 
    action,
    user_agent
  ) VALUES (
    auth.uid(),
    _customer_id,
    'EMERGENCY_ACCESS - Justification: ' || _justification,
    'Emergency Admin Access'
  );
  
  -- Return unmasked customer data
  SELECT json_build_object(
    'id', c.id,
    'name', c.name,
    'email', c.email,
    'phone', c.phone,
    'address', c.address,
    'emergency_access_granted_at', now(),
    'justification', _justification
  ) INTO customer_data
  FROM public.customers c
  WHERE c.id = _customer_id;
  
  RETURN customer_data;
END;
$$;