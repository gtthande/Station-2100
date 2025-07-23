-- Fix infinite recursion in profiles table RLS policies
-- Drop the problematic policies first
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- Create proper RLS policies for profiles table
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Fix the missing foreign key relationship between user_roles and custom_roles
-- Add custom_role_id column to user_roles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_roles' 
        AND column_name = 'custom_role_id'
    ) THEN
        ALTER TABLE public.user_roles 
        ADD COLUMN custom_role_id UUID REFERENCES public.custom_roles(id);
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_custom_role_id ON public.user_roles(custom_role_id);

-- Update database functions to include proper search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT public.has_role(_user_id, _role := 'admin')
$function$;

CREATE OR REPLACE FUNCTION public.validate_job_authorisation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    IF NEW.closed_at IS NOT NULL AND (NEW.invoice_no IS NULL OR NEW.invoice_no = '') THEN
        RAISE EXCEPTION 'invoice_no is mandatory before closing a job';
    END IF;
    RETURN NEW;
END;
$function$;