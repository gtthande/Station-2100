-- Security Audit Fix: Database Security Hardening (Fixed for Views)

-- Drop existing views if they exist
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

-- Set security invoker for the profile view (inherits RLS from underlying table)
ALTER VIEW public.profiles_safe SET (security_invoker = true);

-- Create secure customer view with field-level permissions
CREATE OR REPLACE VIEW public.customers_secure_view AS
SELECT 
    c.id,
    c.name,
    -- Conditionally show sensitive fields based on permissions
    CASE 
        WHEN public.has_customer_permission(auth.uid(), 'view_contact') 
             OR public.has_customer_permission(auth.uid(), 'view_full') 
             OR public.has_customer_permission(auth.uid(), 'manage')
             OR public.has_role(auth.uid(), 'admin'::public.app_role)
        THEN c.email 
        ELSE NULL 
    END as email,
    CASE 
        WHEN public.has_customer_permission(auth.uid(), 'view_contact') 
             OR public.has_customer_permission(auth.uid(), 'view_full') 
             OR public.has_customer_permission(auth.uid(), 'manage')
             OR public.has_role(auth.uid(), 'admin'::public.app_role)
        THEN c.phone 
        ELSE NULL 
    END as phone,
    CASE 
        WHEN public.has_customer_permission(auth.uid(), 'view_full') 
             OR public.has_customer_permission(auth.uid(), 'manage')
             OR public.has_role(auth.uid(), 'admin'::public.app_role)
        THEN c.address 
        ELSE NULL 
    END as address,
    CASE 
        WHEN public.has_customer_permission(auth.uid(), 'view_full') 
             OR public.has_customer_permission(auth.uid(), 'manage')
             OR public.has_role(auth.uid(), 'admin'::public.app_role)
        THEN c.city 
        ELSE NULL 
    END as city,
    CASE 
        WHEN public.has_customer_permission(auth.uid(), 'view_full') 
             OR public.has_customer_permission(auth.uid(), 'manage')
             OR public.has_role(auth.uid(), 'admin'::public.app_role)
        THEN c.state 
        ELSE NULL 
    END as state,
    CASE 
        WHEN public.has_customer_permission(auth.uid(), 'view_full') 
             OR public.has_customer_permission(auth.uid(), 'manage')
             OR public.has_role(auth.uid(), 'admin'::public.app_role)
        THEN c.zip_code 
        ELSE NULL 
    END as zip_code,
    CASE 
        WHEN public.has_customer_permission(auth.uid(), 'view_full') 
             OR public.has_customer_permission(auth.uid(), 'manage')
             OR public.has_role(auth.uid(), 'admin'::public.app_role)
        THEN c.country 
        ELSE 'Hidden'
    END as country,
    c.aircraft_type,
    c.tail_number,
    CASE 
        WHEN public.has_customer_permission(auth.uid(), 'view_contact') 
             OR public.has_customer_permission(auth.uid(), 'view_full') 
             OR public.has_customer_permission(auth.uid(), 'manage')
             OR public.has_role(auth.uid(), 'admin'::public.app_role)
        THEN c.contact_person 
        ELSE NULL 
    END as contact_person,
    c.notes,
    c.user_id,
    c.created_at,
    c.updated_at
FROM public.customers c
WHERE auth.uid() = c.user_id AND (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR 
    public.get_user_customer_permission_level(auth.uid()) IS NOT NULL
);

-- Set security invoker for the customer view
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
    t.sku as tool_sku,
    t.serial_no as tool_serial,
    p.full_name as borrower_name
FROM public.tool_loans tl
JOIN public.tools t ON tl.tool_id = t.id
LEFT JOIN public.profiles p ON tl.borrower_user_id = p.id
WHERE auth.uid() = tl.user_id;

-- Set security invoker for tool movement view
ALTER VIEW public.v_tool_movement SET (security_invoker = true);

-- Update all functions to have proper search paths and schema qualification

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

-- Update remaining functions with proper search paths
CREATE OR REPLACE FUNCTION public.can_view_profile(_profile_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT (auth.uid() = _profile_user_id) 
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'hr'::public.app_role);
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.has_role(_user_id, 'admin'::public.app_role)
$function$;

-- Update has_rotable_role function
CREATE OR REPLACE FUNCTION public.has_rotable_role(_user_id uuid, _role public.rotable_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.rotable_user_roles
    WHERE user_id = _user_id
      AND role = _role
  ) OR public.has_role(_user_id, 'admin'::public.app_role);
$function$;

-- Grant proper permissions to views (no RLS policies needed - security handled by underlying tables)
REVOKE ALL ON public.profiles_safe FROM PUBLIC;
GRANT SELECT ON public.profiles_safe TO authenticated;

REVOKE ALL ON public.customers_secure_view FROM PUBLIC;
GRANT SELECT ON public.customers_secure_view TO authenticated;

REVOKE ALL ON public.v_tool_movement FROM PUBLIC;
GRANT SELECT ON public.v_tool_movement TO authenticated;