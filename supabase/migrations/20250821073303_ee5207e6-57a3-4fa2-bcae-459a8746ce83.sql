-- CRITICAL SECURITY FIX: Secure Employee Personal Information (Fixed Syntax)

-- Step 1: Add security_admin role to app_role enum if it doesn't exist
DO $$
BEGIN
    BEGIN
        ALTER TYPE public.app_role ADD VALUE 'security_admin';
    EXCEPTION
        WHEN duplicate_object THEN null;
    END;
END $$;

-- Step 2: Create secure credentials table with strict access controls
CREATE TABLE IF NOT EXISTS public.secure_employee_credentials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Store hashed/encrypted sensitive data only (never plain text!)
    pin_hash text, -- Store hashed PIN
    biometric_template_hash text, -- Store hashed biometric template
    badge_access_token text, -- Encrypted badge access token
    
    -- Security metadata
    last_credential_change timestamp with time zone DEFAULT now(),
    failed_access_attempts integer DEFAULT 0,
    locked_until timestamp with time zone,
    requires_reset boolean DEFAULT false,
    
    -- Audit fields
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Ensure one record per profile
    UNIQUE(profile_id)
);

-- Enable RLS on secure credentials table
ALTER TABLE public.secure_employee_credentials ENABLE ROW LEVEL SECURITY;

-- Only security admins can access credentials
CREATE POLICY "Only security admins can access credentials"
ON public.secure_employee_credentials
FOR ALL
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR 
    public.has_role(auth.uid(), 'security_admin'::public.app_role)
)
WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR 
    public.has_role(auth.uid(), 'security_admin'::public.app_role)
);

-- Step 3: CRITICAL - Remove dangerous fields from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS sample_password;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS biometric_data;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS pin_code;

-- Step 4: Create comprehensive security logging
CREATE TABLE IF NOT EXISTS public.profile_security_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    accessed_by uuid NOT NULL,
    access_type text NOT NULL CHECK (access_type IN ('view', 'update', 'credential_access', 'emergency_access', 'safe_view')),
    ip_address inet,
    user_agent text,
    sensitive_fields_accessed text[],
    access_granted boolean DEFAULT true,
    denial_reason text,
    session_info jsonb,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.profile_security_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Security logs for authorized personnel only"
ON public.profile_security_log
FOR ALL
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR 
    public.has_role(auth.uid(), 'security_admin'::public.app_role) OR
    public.has_role(auth.uid(), 'hr'::public.app_role)
);

-- Step 5: Create secure profile access function with comprehensive logging
CREATE OR REPLACE FUNCTION public.secure_profile_access(_profile_id uuid, _access_type text DEFAULT 'view'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    access_granted boolean := false;
    accessing_user uuid := auth.uid();
    current_ip inet;
BEGIN
    -- Validate access type
    IF _access_type NOT IN ('view', 'update', 'credential_access', 'emergency_access', 'safe_view') THEN
        RAISE EXCEPTION 'Invalid access type: %', _access_type;
    END IF;
    
    -- Check if access should be granted
    SELECT public.can_view_profile(_profile_id) INTO access_granted;
    
    -- Safely get client IP
    BEGIN
        SELECT inet_client_addr() INTO current_ip;
    EXCEPTION WHEN OTHERS THEN
        current_ip := NULL;
    END;
    
    -- Log every access attempt
    INSERT INTO public.profile_security_log (
        profile_id, 
        accessed_by, 
        access_type, 
        access_granted,
        denial_reason,
        ip_address,
        user_agent,
        session_info
    ) VALUES (
        _profile_id, 
        COALESCE(accessing_user, '00000000-0000-0000-0000-000000000000'::uuid), 
        _access_type, 
        access_granted,
        CASE WHEN NOT access_granted THEN 'Insufficient permissions' ELSE NULL END,
        current_ip,
        COALESCE(current_setting('request.headers', true)::json->>'user-agent', 'Unknown'),
        jsonb_build_object(
            'timestamp', now(),
            'auth_uid', accessing_user,
            'target_profile', _profile_id
        )
    );
    
    RETURN access_granted;
END;
$function$;

-- Step 6: Replace profile RLS policies with secure logging versions
DROP POLICY IF EXISTS "Secure profile viewing - own profile or admin only" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Enhanced secure profile viewing with logging" ON public.profiles;
DROP POLICY IF EXISTS "Secure profile updates with enhanced controls" ON public.profiles;

CREATE POLICY "Secure profile access with logging"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    public.secure_profile_access(id, 'view')
);

CREATE POLICY "Secure profile updates with audit trail"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'hr'::public.app_role)) AND
    public.secure_profile_access(id, 'update')
)
WITH CHECK (
    (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'hr'::public.app_role)) AND
    public.secure_profile_access(id, 'update')
);

CREATE POLICY "Secure profile creation with logging"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = id
);

-- Prevent profile deletion to maintain audit integrity
CREATE POLICY "Profiles cannot be deleted for audit integrity"
ON public.profiles
FOR DELETE
TO authenticated
USING (false);

-- Step 7: Update profiles_safe view with enhanced security
DROP VIEW IF EXISTS public.profiles_safe CASCADE;

CREATE VIEW public.profiles_safe AS
SELECT 
    p.id,
    p.full_name,
    p.profile_image_url,
    p."position", -- Escape the reserved keyword
    p.department_id,
    p.is_staff,
    p.staff_active,
    p.created_at,
    -- Conditional PII access
    CASE 
        WHEN public.has_role(auth.uid(), 'admin'::public.app_role) 
             OR public.has_role(auth.uid(), 'hr'::public.app_role)
             OR public.has_role(auth.uid(), 'security_admin'::public.app_role)
             OR auth.uid() = p.id
        THEN p.email 
        ELSE '[PROTECTED]'
    END as email,
    CASE 
        WHEN public.has_role(auth.uid(), 'admin'::public.app_role) 
             OR public.has_role(auth.uid(), 'hr'::public.app_role)
             OR auth.uid() = p.id
        THEN p.phone 
        ELSE '[PROTECTED]'
    END as phone,
    -- Badge ID only for security personnel
    CASE 
        WHEN public.has_role(auth.uid(), 'admin'::public.app_role) 
             OR public.has_role(auth.uid(), 'security_admin'::public.app_role)
        THEN p.badge_id
        ELSE '[PROTECTED]'
    END as badge_id
FROM public.profiles p
WHERE public.secure_profile_access(p.id, 'safe_view');

ALTER VIEW public.profiles_safe SET (security_invoker = true);

-- Step 8: Create emergency access function for critical situations
CREATE OR REPLACE FUNCTION public.emergency_profile_access(_profile_id uuid, _justification text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    accessing_user uuid := auth.uid();
    profile_data json;
BEGIN
    -- Only admins can use emergency access
    IF NOT (public.has_role(accessing_user, 'admin'::public.app_role) OR 
            public.has_role(accessing_user, 'security_admin'::public.app_role)) THEN
        RAISE EXCEPTION 'Emergency access requires administrator privileges';
    END IF;
    
    -- Require detailed justification
    IF _justification IS NULL OR LENGTH(TRIM(_justification)) < 10 THEN
        RAISE EXCEPTION 'Emergency access requires detailed justification (minimum 10 characters)';
    END IF;
    
    -- Log emergency access
    INSERT INTO public.profile_security_log (
        profile_id, 
        accessed_by, 
        access_type, 
        access_granted,
        denial_reason,
        session_info
    ) VALUES (
        _profile_id, 
        accessing_user, 
        'emergency_access', 
        true,
        'EMERGENCY ACCESS - Justification: ' || _justification,
        jsonb_build_object(
            'emergency_justification', _justification,
            'emergency_timestamp', now(),
            'requires_review', true
        )
    );
    
    -- Return limited profile data as JSON
    SELECT json_build_object(
        'id', p.id,
        'email', p.email,
        'full_name', p.full_name,
        'position', p."position",
        'emergency_access_granted_at', now()
    ) INTO profile_data
    FROM public.profiles p 
    WHERE p.id = _profile_id;
    
    RETURN profile_data;
END;
$function$;

-- Step 9: Revoke unnecessary permissions and grant minimal access
REVOKE ALL ON public.profiles FROM PUBLIC;
REVOKE ALL ON public.secure_employee_credentials FROM PUBLIC;
REVOKE ALL ON public.profile_security_log FROM PUBLIC;

GRANT SELECT ON public.profiles_safe TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;