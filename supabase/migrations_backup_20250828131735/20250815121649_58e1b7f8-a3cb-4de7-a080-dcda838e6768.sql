-- 🔒 SECURITY FIX: Strengthen profiles table RLS policies (Part 1)
-- First, secure the existing policies without adding new enum values

-- Drop existing permissive policies that may be causing the security issue
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create enhanced security function for profile access (without HR role for now)
CREATE OR REPLACE FUNCTION public.can_view_profile(_profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- User can view their own profile OR user is admin
  SELECT (auth.uid() = _profile_user_id) 
    OR public.has_role(auth.uid(), 'admin'::app_role);
$$;

-- RESTRICTIVE POLICY: Users can only view their own profile or admins can view all
CREATE POLICY "Secure profile viewing - own profile or admin only"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.can_view_profile(id));

-- RESTRICTIVE POLICY: Users can only update their own profile
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

-- Explicitly deny DELETE operations for security
-- No DELETE policy means no one can delete profiles via the API