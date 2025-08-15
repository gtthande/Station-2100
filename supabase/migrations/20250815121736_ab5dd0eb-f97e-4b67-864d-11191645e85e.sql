-- 🔒 SECURITY FIX: Update policies to include HR role and add audit logging (Part 3)

-- Update the security function to include HR role
CREATE OR REPLACE FUNCTION public.can_view_profile(_profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- User can view their own profile, OR user is admin, OR user is HR personnel
  SELECT (auth.uid() = _profile_user_id) 
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'hr'::app_role);
$$;

-- Add audit logging table for profile access monitoring
CREATE TABLE IF NOT EXISTS public.profile_access_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    accessed_profile_id uuid NOT NULL,
    accessed_by uuid NOT NULL,
    access_time timestamp with time zone DEFAULT now(),
    access_type text NOT NULL DEFAULT 'SELECT',
    user_agent text,
    ip_address inet
);

ALTER TABLE public.profile_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view profile access logs"
ON public.profile_access_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create function to manually log sensitive profile access
CREATE OR REPLACE FUNCTION public.log_profile_access(_profile_id uuid, _access_type text DEFAULT 'SELECT')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Only log if accessed by someone other than the profile owner
    IF auth.uid() != _profile_id THEN
        INSERT INTO public.profile_access_log (accessed_profile_id, accessed_by, access_type)
        VALUES (_profile_id, auth.uid(), _access_type);
    END IF;
END;
$$;