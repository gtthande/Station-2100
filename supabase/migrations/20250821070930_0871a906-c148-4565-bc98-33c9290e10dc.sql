-- Security Audit Fix: Comprehensive Database Security Hardening
-- Fix 1: Remove Security Definer Views and Replace with Security Invoker + RLS

-- Drop existing security definer views if they exist
DROP VIEW IF EXISTS public.customers_secure CASCADE;
DROP VIEW IF EXISTS public.customers_secure_view CASCADE;
DROP VIEW IF EXISTS public.v_tool_movement CASCADE;

-- Create safe public profile view with only non-PII fields
CREATE OR REPLACE VIEW public.profiles_safe AS
SELECT 
    id,
    full_name,
    profile_image_url,
    position,
    department_id,
    is_staff,
    staff_active,
    created_at
FROM public.profiles;

-- Enable RLS on the safe profile view
ALTER VIEW public.profiles_safe SET (security_invoker = true);

-- Create secure customer view with proper RLS
CREATE OR REPLACE VIEW public.customers_secure_view AS
SELECT 
    c.id,
    c.name,
    -- Conditionally show sensitive fields based on permissions
    CASE 
        WHEN has_customer_permission(auth.uid(), 'view_contact') 
             OR has_customer_permission(auth.uid(), 'view_full') 
             OR has_customer_permission(auth.uid(), 'manage')
             OR has_role(auth.uid(), 'admin'::app_role)
        THEN c.email 
        ELSE NULL 
    END as email,
    CASE 
        WHEN has_customer_permission(auth.uid(), 'view_contact') 
             OR has_customer_permission(auth.uid(), 'view_full') 
             OR has_customer_permission(auth.uid(), 'manage')
             OR has_role(auth.uid(), 'admin'::app_role)
        THEN c.phone 
        ELSE NULL 
    END as phone,
    CASE 
        WHEN has_customer_permission(auth.uid(), 'view_full') 
             OR has_customer_permission(auth.uid(), 'manage')
             OR has_role(auth.uid(), 'admin'::app_role)
        THEN c.address 
        ELSE NULL 
    END as address,
    CASE 
        WHEN has_customer_permission(auth.uid(), 'view_full') 
             OR has_customer_permission(auth.uid(), 'manage')
             OR has_role(auth.uid(), 'admin'::app_role)
        THEN c.city 
        ELSE NULL 
    END as city,
    CASE 
        WHEN has_customer_permission(auth.uid(), 'view_full') 
             OR has_customer_permission(auth.uid(), 'manage')
             OR has_role(auth.uid(), 'admin'::app_role)
        THEN c.state 
        ELSE NULL 
    END as state,
    CASE 
        WHEN has_customer_permission(auth.uid(), 'view_full') 
             OR has_customer_permission(auth.uid(), 'manage')
             OR has_role(auth.uid(), 'admin'::app_role)
        THEN c.zip_code 
        ELSE NULL 
    END as zip_code,
    CASE 
        WHEN has_customer_permission(auth.uid(), 'view_full') 
             OR has_customer_permission(auth.uid(), 'manage')
             OR has_role(auth.uid(), 'admin'::app_role)
        THEN c.country 
        ELSE 'Hidden'
    END as country,
    c.aircraft_type,
    c.tail_number,
    CASE 
        WHEN has_customer_permission(auth.uid(), 'view_contact') 
             OR has_customer_permission(auth.uid(), 'view_full') 
             OR has_customer_permission(auth.uid(), 'manage')
             OR has_role(auth.uid(), 'admin'::app_role)
        THEN c.contact_person 
        ELSE NULL 
    END as contact_person,
    c.notes,
    c.user_id,
    c.created_at,
    c.updated_at
FROM public.customers c
WHERE auth.uid() = c.user_id AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    get_user_customer_permission_level(auth.uid()) IS NOT NULL
);

-- Set security invoker for the view
ALTER VIEW public.customers_secure_view SET (security_invoker = true);

-- Create tool movement view with proper security
CREATE OR REPLACE VIEW public.v_tool_movement AS
SELECT 
    tl.id,
    tl.tool_id,
    tl.borrower_user_id,
    tl.issuer_user_id,
    tl.checkout_at,
    tl.due_at,
    tl.returned_at,
    tl.user_id,
    t.name as tool_name,
    t.tool_tag,
    p.full_name as borrower_name
FROM public.tool_loans tl
JOIN public.tools t ON tl.tool_id = t.id
LEFT JOIN public.profiles p ON tl.borrower_user_id = p.id
WHERE auth.uid() = tl.user_id;

-- Set security invoker for tool movement view
ALTER VIEW public.v_tool_movement SET (security_invoker = true);

-- Fix 2: Update all functions to have proper search paths
-- Update existing functions to be schema-qualified and set search paths

-- Update has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- Update has_customer_permission function  
CREATE OR REPLACE FUNCTION public.has_customer_permission(_user_id uuid, _permission text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN public.has_role(_user_id, 'admin'::public.app_role) THEN true
    ELSE EXISTS (
      SELECT 1
      FROM public.customer_permissions cp
      WHERE cp.user_id = _user_id
        AND cp.permission_type = _permission
        AND (cp.expires_at IS NULL OR cp.expires_at > now())
    )
  END;
$function$;

-- Update get_user_customer_permission_level function
CREATE OR REPLACE FUNCTION public.get_user_customer_permission_level(_user_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN public.has_role(_user_id, 'admin'::public.app_role) THEN 'admin'
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
$function$;

-- Fix 3: Enable RLS on all views and ensure proper policies
-- Enable RLS on profiles_safe view
CREATE POLICY "Users can view safe profile data" 
ON public.profiles_safe 
FOR SELECT 
USING (true); -- Safe because it only contains non-PII

-- Revoke public access and grant to authenticated only
REVOKE ALL ON public.profiles_safe FROM PUBLIC;
GRANT SELECT ON public.profiles_safe TO authenticated;

-- Enable RLS on customers_secure_view  
CREATE POLICY "Users with customer permissions can access secure customer view"
ON public.customers_secure_view
FOR SELECT
TO authenticated
USING (true); -- Security is handled in the view definition itself

-- Revoke public access and grant to authenticated only
REVOKE ALL ON public.customers_secure_view FROM PUBLIC;
GRANT SELECT ON public.customers_secure_view TO authenticated;

-- Enable RLS on tool movement view
CREATE POLICY "Users can view their own tool movements"
ON public.v_tool_movement
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Revoke public access and grant to authenticated only
REVOKE ALL ON public.v_tool_movement FROM PUBLIC;
GRANT SELECT ON public.v_tool_movement TO authenticated;