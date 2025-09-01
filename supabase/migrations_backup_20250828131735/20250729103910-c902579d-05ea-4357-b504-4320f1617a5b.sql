-- PHASE 1: Critical Security Fixes

-- Fix privilege escalation in profiles table
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile (excluding role)" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND role = OLD.role); -- Prevent role changes

-- Add user_id columns to job_cards and jobcard_parts if they don't exist
ALTER TABLE public.job_cards ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.jobcard_parts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Update job_cards with current user's ID for existing records
UPDATE public.job_cards SET user_id = auth.uid() WHERE user_id IS NULL;
UPDATE public.jobcard_parts SET user_id = auth.uid() WHERE user_id IS NULL;

-- Make user_id NOT NULL for security
ALTER TABLE public.job_cards ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.jobcard_parts ALTER COLUMN user_id SET NOT NULL;

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
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own job cards" 
ON public.job_cards 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job cards" 
ON public.job_cards 
FOR DELETE 
USING (auth.uid() = user_id);

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
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobcard parts" 
ON public.jobcard_parts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jobcard parts" 
ON public.jobcard_parts 
FOR DELETE 
USING (auth.uid() = user_id);

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