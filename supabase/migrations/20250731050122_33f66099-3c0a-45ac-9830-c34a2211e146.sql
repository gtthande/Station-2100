-- PHASE 1: Critical Security Fixes

-- Fix privilege escalation in profiles table - create a function to prevent role changes
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Only allow role changes by admins
  IF OLD.role IS DISTINCT FROM NEW.role AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can change user roles';
  END IF;
  RETURN NEW;
END;
$function$;

-- Drop existing profile update policy and create secure one
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Add trigger to prevent role escalation
DROP TRIGGER IF EXISTS prevent_role_escalation_trigger ON public.profiles;
CREATE TRIGGER prevent_role_escalation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

-- Add user_id columns to job_cards and jobcard_parts if they don't exist
ALTER TABLE public.job_cards ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.jobcard_parts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Replace insecure RLS policies on job_cards
DROP POLICY IF EXISTS "Users can create job cards" ON public.job_cards;
DROP POLICY IF EXISTS "Users can delete job cards" ON public.job_cards;
DROP POLICY IF EXISTS "Users can update job cards" ON public.job_cards;
DROP POLICY IF EXISTS "Users can view all job cards" ON public.job_cards;

CREATE POLICY "Users can create their own job cards" 
ON public.job_cards 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own job cards" 
ON public.job_cards 
FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can update their own job cards" 
ON public.job_cards 
FOR UPDATE 
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can delete their own job cards" 
ON public.job_cards 
FOR DELETE 
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Replace insecure RLS policies on jobcard_parts
DROP POLICY IF EXISTS "Users can create jobcard parts" ON public.jobcard_parts;
DROP POLICY IF EXISTS "Users can delete jobcard parts" ON public.jobcard_parts;
DROP POLICY IF EXISTS "Users can update jobcard parts" ON public.jobcard_parts;
DROP POLICY IF EXISTS "Users can view all jobcard parts" ON public.jobcard_parts;

CREATE POLICY "Users can create their own jobcard parts" 
ON public.jobcard_parts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own jobcard parts" 
ON public.jobcard_parts 
FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can update their own jobcard parts" 
ON public.jobcard_parts 
FOR UPDATE 
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can delete their own jobcard parts" 
ON public.jobcard_parts 
FOR DELETE 
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- PHASE 2: Function Security Hardening
-- Fix security issues by adding SET search_path = '' to functions

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
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
SET search_path = ''
AS $function$
  SELECT public.has_role(_user_id, 'admin')
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_job_authorisation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
    IF NEW.closed_at IS NOT NULL AND (NEW.invoice_no IS NULL OR NEW.invoice_no = '') THEN
        RAISE EXCEPTION 'invoice_no is mandatory before closing a job';
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$function$;