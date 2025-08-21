-- Final Security Fix: Strengthen Profile Access Controls

-- Create even more restrictive profile access policy
-- The current policy still allows access through secure_profile_access function
-- Let's make it more restrictive

DROP POLICY IF EXISTS "Enhanced secure profile viewing with audit logging" ON public.profiles;

-- Create stricter profile access policy
CREATE POLICY "Ultra-restrictive profile access with audit logging"
ON public.profiles
FOR SELECT  
TO authenticated
USING (
    -- Only allow access to own profile or with explicit admin/HR role verification
    (auth.uid() = id) OR 
    (
        (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'hr'::public.app_role)) 
        AND public.secure_profile_access(id, 'view')
    )
);

-- Create a public minimal profile view for general use (no PII)
CREATE OR REPLACE VIEW public.profiles_minimal AS
SELECT 
    p.id,
    p.full_name,
    p.profile_image_url,
    p."position",
    p.department_id,
    p.is_staff,
    p.staff_active,
    p.created_at
FROM public.profiles p
WHERE auth.uid() IS NOT NULL; -- Must be authenticated

-- Set security invoker
ALTER VIEW public.profiles_minimal SET (security_invoker = true);

-- Grant access to minimal view
GRANT SELECT ON public.profiles_minimal TO authenticated;

-- Update profiles_safe to be even more restrictive  
DROP VIEW IF EXISTS public.profiles_safe CASCADE;

CREATE VIEW public.profiles_safe AS
SELECT 
    p.id,
    p.full_name,
    p.profile_image_url,
    p."position",
    p.department_id,
    p.is_staff,
    p.staff_active,  
    p.created_at,
    -- Only own profile or authorized personnel can see PII
    CASE 
        WHEN auth.uid() = p.id THEN p.email
        WHEN public.has_role(auth.uid(), 'admin'::public.app_role) THEN p.email
        WHEN public.has_role(auth.uid(), 'hr'::public.app_role) THEN p.email
        ELSE '[PROTECTED]'
    END as email,
    CASE 
        WHEN auth.uid() = p.id THEN p.phone
        WHEN public.has_role(auth.uid(), 'admin'::public.app_role) THEN p.phone
        WHEN public.has_role(auth.uid(), 'hr'::public.app_role) THEN p.phone
        ELSE '[PROTECTED]'
    END as phone,
    -- Badge ID only for admins (critical security access)
    CASE 
        WHEN public.has_role(auth.uid(), 'admin'::public.app_role) THEN p.badge_id
        ELSE '[RESTRICTED]'
    END as badge_id
FROM public.profiles p
WHERE 
    -- Must be own profile, or admin/HR with logging
    (auth.uid() = p.id) OR 
    (
        (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'hr'::public.app_role))
        AND public.secure_profile_access(p.id, 'safe_view')
    );

ALTER VIEW public.profiles_safe SET (security_invoker = true);

-- Revoke and re-grant with proper permissions
REVOKE ALL ON public.profiles_safe FROM PUBLIC;
REVOKE ALL ON public.profiles_minimal FROM PUBLIC;

GRANT SELECT ON public.profiles_safe TO authenticated;
GRANT SELECT ON public.profiles_minimal TO authenticated;