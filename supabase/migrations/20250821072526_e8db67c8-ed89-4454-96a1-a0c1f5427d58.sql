-- CRITICAL SECURITY FIX: Secure Employee Personal Information
-- This migration addresses the critical security vulnerability in the profiles table

-- Step 1: Create secure credentials table with strict access controls
CREATE TABLE IF NOT EXISTS public.secure_employee_credentials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Encrypt sensitive data (in production, use proper encryption)
    encrypted_pin_hash text, -- Store hashed PIN, never plain text
    biometric_data_hash text, -- Store hashed biometric template, never raw data
    badge_id_encrypted text, -- Encrypted badge ID
    
    -- Security metadata
    last_pin_change timestamp with time zone DEFAULT now(),
    failed_attempts integer DEFAULT 0,
    locked_until timestamp with time zone,
    
    -- Audit fields
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Ensure one record per profile
    UNIQUE(profile_id)
);

-- Enable RLS on secure credentials table
ALTER TABLE public.secure_employee_credentials ENABLE ROW LEVEL SECURITY;

-- Step 2: Create extremely restrictive RLS policies for secure credentials
-- Only system administrators can access secure credentials
CREATE POLICY "Only system admins can view secure credentials"
ON public.secure_employee_credentials
FOR SELECT
TO authenticated
USING (
    -- Only allow access to users with 'system_admin' role (not just 'admin')
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'system_admin'::public.app_role
    )
);

CREATE POLICY "Only system admins can manage secure credentials"
ON public.secure_employee_credentials
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'system_admin'::public.app_role
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'system_admin'::public.app_role
    )
);

-- Step 3: Update profiles table to remove dangerous fields
-- CRITICAL: Remove the sample_password field immediately (this should never exist!)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS sample_password;

-- Remove biometric data and PIN from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS biometric_data;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS pin_code;

-- Keep badge_id for now but we'll secure it later
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS badge_id;

-- Step 4: Create secure profile access logging
CREATE TABLE IF NOT EXISTS public.profile_security_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    accessed_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    access_type text NOT NULL, -- 'view', 'update', 'credential_access'
    ip_address inet,
    user_agent text,
    sensitive_fields_accessed text[], -- Track which sensitive fields were accessed
    access_granted boolean DEFAULT true,
    denial_reason text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on security log
ALTER TABLE public.profile_security_log ENABLE ROW LEVEL SECURITY;

-- Only security admins can view security logs
CREATE POLICY "Security logs for admins only"
ON public.profile_security_log
FOR ALL
TO authenticated
USING (
    has_role(auth.uid(), 'admin'::public.app_role) OR 
    has_role(auth.uid(), 'security_admin'::public.app_role)
);

-- Step 5: Update profile access function to include security logging
CREATE OR REPLACE FUNCTION public.secure_profile_access(_profile_id uuid, _access_type text DEFAULT 'view'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    access_granted boolean := false;
    accessing_user uuid := auth.uid();
BEGIN
    -- Check if access should be granted
    SELECT public.can_view_profile(_profile_id) INTO access_granted;
    
    -- Log the access attempt
    INSERT INTO public.profile_security_log (
        profile_id, 
        accessed_by, 
        access_type, 
        access_granted,
        denial_reason,
        ip_address
    ) VALUES (
        _profile_id, 
        accessing_user, 
        _access_type, 
        access_granted,
        CASE WHEN NOT access_granted THEN 'Insufficient permissions' ELSE NULL END,
        inet_client_addr()
    );
    
    RETURN access_granted;
END;
$function$;

-- Step 6: Create more restrictive profile RLS policies
-- Drop existing policies to replace with more secure ones
DROP POLICY IF EXISTS "Secure profile viewing - own profile or admin only" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile only" ON public.profiles;

-- New restrictive policies with security logging
CREATE POLICY "Enhanced secure profile viewing with logging"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    -- Use the new secure access function which includes logging
    public.secure_profile_access(id, 'view')
);

CREATE POLICY "Secure profile updates with enhanced controls"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    -- Only owner or admin can update, with logging
    (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::public.app_role)) AND
    public.secure_profile_access(id, 'update')
)
WITH CHECK (
    (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::public.app_role)) AND
    public.secure_profile_access(id, 'update')
);

-- Prevent deletion of profiles (audit trail protection)
CREATE POLICY "Profiles cannot be deleted"
ON public.profiles
FOR DELETE
TO authenticated
USING (false); -- No one can delete profiles

-- Step 7: Ensure profiles_safe view is the default access method
-- Update the existing profiles_safe view to be even more restrictive
DROP VIEW IF EXISTS public.profiles_safe;
CREATE VIEW public.profiles_safe AS
SELECT 
    p.id,
    p.full_name,
    p.profile_image_url,
    p.position,
    p.department_id,
    p.is_staff,
    p.staff_active,
    p.created_at,
    -- Only show email/phone to admins or HR
    CASE 
        WHEN public.has_role(auth.uid(), 'admin'::public.app_role) 
             OR public.has_role(auth.uid(), 'hr'::public.app_role)
             OR auth.uid() = p.id
        THEN p.email 
        ELSE NULL 
    END as email,
    CASE 
        WHEN public.has_role(auth.uid(), 'admin'::public.app_role) 
             OR public.has_role(auth.uid(), 'hr'::public.app_role)
             OR auth.uid() = p.id
        THEN p.phone 
        ELSE NULL 
    END as phone
FROM public.profiles p
WHERE public.secure_profile_access(p.id, 'safe_view');

-- Set security invoker for the safe view
ALTER VIEW public.profiles_safe SET (security_invoker = true);

-- Step 8: Create emergency admin access audit
CREATE OR REPLACE FUNCTION public.emergency_profile_access(_profile_id uuid, _justification text)
 RETURNS public.profiles
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    profile_record public.profiles;
    accessing_user uuid := auth.uid();
BEGIN
    -- Only system admins can use emergency access
    IF NOT public.has_role(accessing_user, 'system_admin'::public.app_role) THEN
        RAISE EXCEPTION 'Emergency access requires system admin privileges';
    END IF;
    
    -- Log emergency access with justification
    INSERT INTO public.profile_security_log (
        profile_id, 
        accessed_by, 
        access_type, 
        access_granted,
        denial_reason
    ) VALUES (
        _profile_id, 
        accessing_user, 
        'EMERGENCY_ACCESS', 
        true,
        'Emergency access - Justification: ' || _justification
    );
    
    -- Return the profile
    SELECT * INTO profile_record FROM public.profiles WHERE id = _profile_id;
    RETURN profile_record;
END;
$function$;

-- Revoke all public access to profiles table
REVOKE ALL ON public.profiles FROM PUBLIC;
REVOKE ALL ON public.secure_employee_credentials FROM PUBLIC;
REVOKE ALL ON public.profile_security_log FROM PUBLIC;

-- Grant minimal access to authenticated users
GRANT SELECT ON public.profiles_safe TO authenticated;
GRANT SELECT ON public.profiles TO authenticated; -- This will be controlled by RLS