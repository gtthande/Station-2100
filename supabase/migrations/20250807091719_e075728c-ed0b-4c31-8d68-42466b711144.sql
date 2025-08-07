-- Fix critical security vulnerabilities

-- 1. Enable RLS on security_config_notes table and create proper policies
ALTER TABLE public.security_config_notes ENABLE ROW LEVEL SECURITY;

-- Create admin-only policies for security configuration management
CREATE POLICY "Only admins can view security config notes" 
ON public.security_config_notes 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can insert security config notes" 
ON public.security_config_notes 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Only admins can update security config notes" 
ON public.security_config_notes 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can delete security config notes" 
ON public.security_config_notes 
FOR DELETE 
USING (is_admin(auth.uid()));

-- 2. Fix database functions with proper search_path to prevent SQL injection
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
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
 SET search_path TO 'public'
AS $function$
  SELECT public.has_role(_user_id, 'admin')
$function$;

CREATE OR REPLACE FUNCTION public.get_inventory_summary()
 RETURNS TABLE(product_id uuid, part_number text, description text, total_quantity numeric, allocated_quantity numeric, available_quantity numeric, reorder_point numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT 
    p.id as product_id,
    p.part_number,
    p.description,
    COALESCE(SUM(b.quantity), 0) as total_quantity,
    COALESCE(SUM(CASE WHEN b.job_allocated_to IS NOT NULL THEN b.quantity ELSE 0 END), 0) as allocated_quantity,
    COALESCE(SUM(CASE WHEN b.job_allocated_to IS NULL THEN b.quantity ELSE 0 END), 0) as available_quantity,
    p.reorder_point
  FROM public.inventory_products p
  LEFT JOIN public.inventory_batches b ON p.id = b.product_id AND b.status = 'approved'
  GROUP BY p.id, p.part_number, p.description, p.reorder_point;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_roles_with_profiles()
 RETURNS TABLE(user_id uuid, role text, full_name text, email text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT 
    ur.user_id,
    ur.role::text,
    p.full_name,
    p.email,
    ur.created_at
  FROM public.user_roles ur
  LEFT JOIN public.profiles p ON ur.user_id = p.id;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow role changes by admins
  IF OLD.role IS DISTINCT FROM NEW.role AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can change user roles';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_job_authorisation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.closed_at IS NOT NULL AND (NEW.invoice_no IS NULL OR NEW.invoice_no = '') THEN
        RAISE EXCEPTION 'invoice_no is mandatory before closing a job';
    END IF;
    RETURN NEW;
END;
$function$;

-- 3. Add audit trigger for role changes to track security events
CREATE TABLE IF NOT EXISTS public.role_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    target_user_id uuid NOT NULL,
    action text NOT NULL,
    old_role app_role,
    new_role app_role,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs" 
ON public.role_audit_log 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Create audit trigger function
CREATE OR REPLACE FUNCTION public.audit_role_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.role_audit_log (user_id, target_user_id, action, new_role)
        VALUES (auth.uid(), NEW.user_id, 'ASSIGN_ROLE', NEW.role);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.role_audit_log (user_id, target_user_id, action, old_role)
        VALUES (auth.uid(), OLD.user_id, 'REMOVE_ROLE', OLD.role);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.role_audit_log (user_id, target_user_id, action, old_role, new_role)
        VALUES (auth.uid(), NEW.user_id, 'CHANGE_ROLE', OLD.role, NEW.role);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$function$;

-- Add audit trigger to user_roles table
DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles
    AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.audit_role_changes();