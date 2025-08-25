-- COMPREHENSIVE SECURITY FIX FOR EMPLOYEE PROFILE DATA
-- This migration addresses the security vulnerabilities identified in the profiles table

-- First, ensure RLS is enabled on profiles table (should already be enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them with stronger security
DROP POLICY IF EXISTS "Ultra-restrictive profile access with audit logging" ON public.profiles;
DROP POLICY IF EXISTS "Secure profile updates with comprehensive audit" ON public.profiles;
DROP POLICY IF EXISTS "Secure profile creation with audit trail" ON public.profiles;

-- Create enhanced security policies with explicit authentication requirements

-- 1. SELECT Policy: Only authenticated users can view profiles, with strict restrictions
CREATE POLICY "authenticated_profile_select_policy" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  -- Users can only see their own profile OR
  (auth.uid() = id) OR 
  -- Admins/HR can see profiles with proper audit logging
  (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role)) 
    AND secure_profile_access(id, 'view'::text)
  )
);

-- 2. INSERT Policy: Only authenticated users can create their own profile
CREATE POLICY "authenticated_profile_insert_policy" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = id AND 
  secure_profile_access(id, 'create'::text)
);

-- 3. UPDATE Policy: Strict update permissions with audit trail
CREATE POLICY "authenticated_profile_update_policy" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (
  (
    (auth.uid() = id) OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'hr'::app_role)
  ) AND 
  secure_profile_access(id, 'update'::text)
)
WITH CHECK (
  (
    (auth.uid() = id) OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'hr'::app_role)
  ) AND 
  secure_profile_access(id, 'update'::text)
);

-- 4. DELETE Policy: Maintain existing protection (no deletions allowed)
CREATE POLICY "no_profile_deletion_policy" 
ON public.profiles 
FOR DELETE 
TO authenticated 
USING (false);

-- Create a secure function to mask sensitive profile data for API responses
CREATE OR REPLACE FUNCTION public.get_safe_profile_data(_profile_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_data json;
  accessing_user uuid := auth.uid();
  user_permission_level text;
BEGIN
  -- Ensure user is authenticated
  IF accessing_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Check if user can access this profile
  IF NOT secure_profile_access(_profile_id, 'safe_view') THEN
    RAISE EXCEPTION 'Access denied to profile data';
  END IF;
  
  -- Determine user's permission level
  IF accessing_user = _profile_id THEN
    user_permission_level := 'self';
  ELSIF has_role(accessing_user, 'admin'::app_role) THEN
    user_permission_level := 'admin';
  ELSIF has_role(accessing_user, 'hr'::app_role) THEN
    user_permission_level := 'hr';
  ELSE
    user_permission_level := 'restricted';
  END IF;
  
  -- Return appropriate data based on permission level
  SELECT json_build_object(
    'id', p.id,
    'full_name', p.full_name,
    'position', p.position,
    'department_id', p.department_id,
    'is_staff', p.is_staff,
    'staff_active', p.staff_active,
    'profile_image_url', p.profile_image_url,
    'created_at', p.created_at,
    -- Conditionally include sensitive fields
    'email', CASE 
      WHEN user_permission_level IN ('self', 'admin', 'hr') THEN p.email 
      ELSE '[PROTECTED]' 
    END,
    'phone', CASE 
      WHEN user_permission_level IN ('self', 'admin', 'hr') THEN p.phone 
      ELSE '[PROTECTED]' 
    END,
    'badge_id', CASE 
      WHEN user_permission_level IN ('admin') THEN p.badge_id 
      ELSE '[RESTRICTED]' 
    END,
    'bio', CASE 
      WHEN user_permission_level IN ('self', 'admin', 'hr') THEN p.bio 
      ELSE NULL 
    END
  ) INTO profile_data
  FROM public.profiles p 
  WHERE p.id = _profile_id;
  
  -- Log the data access
  PERFORM log_profile_access(_profile_id, 'safe_data_access');
  
  RETURN profile_data;
END;
$$;

-- Update the secure_profile_access function to handle the new 'create' and 'safe_view' access types
CREATE OR REPLACE FUNCTION public.secure_profile_access(_profile_id uuid, _access_type text DEFAULT 'view'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    access_granted boolean := false;
    accessing_user uuid := auth.uid();
    current_ip inet;
BEGIN
    -- Validate access type
    IF _access_type NOT IN ('view', 'update', 'create', 'emergency_access', 'safe_view') THEN
        RAISE EXCEPTION 'Invalid access type: %', _access_type;
    END IF;
    
    -- Require authentication for all operations
    IF accessing_user IS NULL THEN
        access_granted := false;
    ELSE
        -- Check if access should be granted
        IF _access_type = 'create' THEN
            -- Only allow users to create their own profile
            access_granted := (accessing_user = _profile_id);
        ELSIF _access_type = 'safe_view' THEN
            -- Allow broader safe viewing for basic profile info
            access_granted := (
                accessing_user = _profile_id OR 
                has_role(accessing_user, 'admin'::app_role) OR 
                has_role(accessing_user, 'hr'::app_role)
            );
        ELSE
            -- Use existing logic for other access types
            access_granted := can_view_profile(_profile_id);
        END IF;
    END IF;
    
    -- Safely get client IP
    BEGIN
        SELECT inet_client_addr() INTO current_ip;
    EXCEPTION WHEN OTHERS THEN
        current_ip := NULL;
    END;
    
    -- Log every access attempt (critical for security auditing)
    BEGIN
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
            CASE WHEN NOT access_granted THEN 
                CASE 
                    WHEN accessing_user IS NULL THEN 'Authentication required'
                    ELSE 'Insufficient permissions' 
                END
            ELSE NULL END,
            current_ip,
            'System Access',
            jsonb_build_object(
                'timestamp', now(),
                'auth_uid', accessing_user,
                'target_profile', _profile_id,
                'authentication_status', CASE WHEN accessing_user IS NULL THEN 'unauthenticated' ELSE 'authenticated' END
            )
        );
    EXCEPTION WHEN OTHERS THEN
        -- Log insertion failed, but don't block access for now
        NULL;
    END;
    
    RETURN access_granted;
END;
$$;

-- Create a trigger to automatically log profile changes
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Log what fields were changed
        INSERT INTO public.profile_security_log (
            profile_id,
            accessed_by,
            access_type,
            access_granted,
            session_info
        ) VALUES (
            NEW.id,
            auth.uid(),
            'field_update',
            true,
            jsonb_build_object(
                'changed_fields', jsonb_object_agg(
                    field_name, 
                    jsonb_build_object('old', old_value, 'new', new_value)
                ) 
                FROM (
                    SELECT 'email' as field_name, to_jsonb(OLD.email) as old_value, to_jsonb(NEW.email) as new_value WHERE OLD.email IS DISTINCT FROM NEW.email
                    UNION ALL
                    SELECT 'phone', to_jsonb(OLD.phone), to_jsonb(NEW.phone) WHERE OLD.phone IS DISTINCT FROM NEW.phone
                    UNION ALL
                    SELECT 'full_name', to_jsonb(OLD.full_name), to_jsonb(NEW.full_name) WHERE OLD.full_name IS DISTINCT FROM NEW.full_name
                    UNION ALL
                    SELECT 'position', to_jsonb(OLD.position), to_jsonb(NEW.position) WHERE OLD.position IS DISTINCT FROM NEW.position
                ) changes WHERE old_value IS NOT NULL OR new_value IS NOT NULL,
                'timestamp', now(),
                'table', 'profiles'
            )
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS profile_audit_trigger ON public.profiles;
CREATE TRIGGER profile_audit_trigger
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION log_profile_changes();

-- Add comments for documentation
COMMENT ON POLICY "authenticated_profile_select_policy" ON public.profiles IS 
'Restricts profile viewing to authenticated users only. Users can see their own profile, while admins/HR require additional audit logging.';

COMMENT ON POLICY "authenticated_profile_insert_policy" ON public.profiles IS 
'Only authenticated users can create profiles, and only for themselves with audit logging.';

COMMENT ON POLICY "authenticated_profile_update_policy" ON public.profiles IS 
'Authenticated users can update their own profiles. Admins/HR can update any profile with comprehensive audit logging.';

COMMENT ON FUNCTION public.get_safe_profile_data(uuid) IS 
'Returns profile data with field-level security. Sensitive fields are masked based on user permissions.';

COMMENT ON FUNCTION public.secure_profile_access(uuid, text) IS 
'Enhanced security function that validates access permissions and logs all access attempts with authentication requirements.';