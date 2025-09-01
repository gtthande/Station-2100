-- 🔒 SECURITY FIX: Strengthen profiles table RLS policies
-- This fixes the critical security vulnerability where employee personal information was exposed

-- First, drop existing policies to rebuild them more securely
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Add HR role for accessing employee data
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'hr', 'parts_approver', 'job_allocator', 'batch_manager');
    ELSE
        -- Add HR role if it doesn't exist
        BEGIN
            ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hr';
        EXCEPTION WHEN duplicate_object THEN
            -- Role already exists, continue
        END;
    END IF;
END
$$;

-- Create enhanced security function for profile access
CREATE OR REPLACE FUNCTION public.can_view_profile(_profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- User can view their own profile
  SELECT (auth.uid() = _profile_user_id) 
    -- OR user is admin
    OR public.has_role(auth.uid(), 'admin'::app_role)
    -- OR user is HR personnel  
    OR public.has_role(auth.uid(), 'hr'::app_role);
$$;

-- Create function to check if user can view sensitive data
CREATE OR REPLACE FUNCTION public.can_view_sensitive_profile_data(_profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Only own profile, admin, or HR can view sensitive data
  SELECT (auth.uid() = _profile_user_id) 
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'hr'::app_role);
$$;

-- RESTRICTIVE POLICY: Users can only view profiles they have permission for
CREATE POLICY "Restricted profile viewing"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.can_view_profile(id));

-- RESTRICTIVE POLICY: Users can only update their own profile (admins/HR cannot modify)
CREATE POLICY "Users can update own profile only"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- RESTRICTIVE POLICY: Users can only insert their own profile
CREATE POLICY "Users can insert own profile only"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- SECURITY: No DELETE policy - profiles cannot be deleted via API

-- Add audit logging for profile access (for monitoring)
CREATE TABLE IF NOT EXISTS public.profile_access_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    accessed_profile_id uuid NOT NULL,
    accessed_by uuid NOT NULL,
    access_time timestamp with time zone DEFAULT now(),
    access_type text NOT NULL
);

ALTER TABLE public.profile_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view profile access logs"
ON public.profile_access_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Function to log profile access
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Only log if accessed by someone other than the profile owner
    IF auth.uid() != NEW.id THEN
        INSERT INTO public.profile_access_log (accessed_profile_id, accessed_by, access_type)
        VALUES (NEW.id, auth.uid(), 'SELECT');
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger for audit logging
DROP TRIGGER IF EXISTS profile_access_audit ON public.profiles;
CREATE TRIGGER profile_access_audit
    AFTER SELECT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.log_profile_access();