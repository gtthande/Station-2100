-- Enhanced Customer Data Security - Granular Access Controls
-- This migration implements stricter access controls for customer contact information

-- First, let's create a customer permissions table to control granular access
CREATE TABLE IF NOT EXISTS public.customer_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  permission_type text NOT NULL CHECK (permission_type IN ('view_basic', 'view_contact', 'view_full', 'manage')),
  granted_by uuid NOT NULL,
  granted_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, permission_type)
);

-- Enable RLS on customer permissions
ALTER TABLE public.customer_permissions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage customer permissions
CREATE POLICY "Only admins can manage customer permissions" 
ON public.customer_permissions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own permissions
CREATE POLICY "Users can view their own customer permissions" 
ON public.customer_permissions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create function to check customer permissions
CREATE OR REPLACE FUNCTION public.has_customer_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- Admins have all permissions
  SELECT CASE 
    WHEN has_role(_user_id, 'admin'::app_role) THEN true
    ELSE EXISTS (
      SELECT 1
      FROM public.customer_permissions cp
      WHERE cp.user_id = _user_id
        AND cp.permission_type = _permission
        AND (cp.expires_at IS NULL OR cp.expires_at > now())
    )
  END;
$$;

-- Create a secure view for customer data with field-level access control
CREATE OR REPLACE VIEW public.customers_secure AS
SELECT 
  c.id,
  c.user_id,
  c.name,
  -- Basic contact info (requires view_contact or higher)
  CASE 
    WHEN has_customer_permission(auth.uid(), 'view_contact') OR 
         has_customer_permission(auth.uid(), 'view_full') OR
         has_customer_permission(auth.uid(), 'manage') 
    THEN c.email
    ELSE CASE WHEN c.email IS NOT NULL THEN 'HIDDEN' ELSE NULL END
  END as email,
  CASE 
    WHEN has_customer_permission(auth.uid(), 'view_contact') OR 
         has_customer_permission(auth.uid(), 'view_full') OR
         has_customer_permission(auth.uid(), 'manage') 
    THEN c.phone
    ELSE CASE WHEN c.phone IS NOT NULL THEN 'HIDDEN' ELSE NULL END
  END as phone,
  -- Full address details (requires view_full or manage)
  CASE 
    WHEN has_customer_permission(auth.uid(), 'view_full') OR
         has_customer_permission(auth.uid(), 'manage') 
    THEN c.address
    ELSE CASE WHEN c.address IS NOT NULL THEN 'HIDDEN' ELSE NULL END
  END as address,
  CASE 
    WHEN has_customer_permission(auth.uid(), 'view_full') OR
         has_customer_permission(auth.uid(), 'manage') 
    THEN c.city
    ELSE CASE WHEN c.city IS NOT NULL THEN 'HIDDEN' ELSE NULL END
  END as city,
  CASE 
    WHEN has_customer_permission(auth.uid(), 'view_full') OR
         has_customer_permission(auth.uid(), 'manage') 
    THEN c.state
    ELSE CASE WHEN c.state IS NOT NULL THEN 'HIDDEN' ELSE NULL END
  END as state,
  CASE 
    WHEN has_customer_permission(auth.uid(), 'view_full') OR
         has_customer_permission(auth.uid(), 'manage') 
    THEN c.zip_code
    ELSE CASE WHEN c.zip_code IS NOT NULL THEN 'HIDDEN' ELSE NULL END
  END as zip_code,
  c.country, -- Country is less sensitive, allow with basic access
  c.aircraft_type,
  c.tail_number,
  CASE 
    WHEN has_customer_permission(auth.uid(), 'view_contact') OR 
         has_customer_permission(auth.uid(), 'view_full') OR
         has_customer_permission(auth.uid(), 'manage') 
    THEN c.contact_person
    ELSE CASE WHEN c.contact_person IS NOT NULL THEN 'HIDDEN' ELSE NULL END
  END as contact_person,
  -- Notes might contain sensitive info
  CASE 
    WHEN has_customer_permission(auth.uid(), 'view_full') OR
         has_customer_permission(auth.uid(), 'manage') 
    THEN c.notes
    ELSE CASE WHEN c.notes IS NOT NULL THEN 'LIMITED ACCESS' ELSE NULL END
  END as notes,
  c.created_at,
  c.updated_at
FROM public.customers c
WHERE auth.uid() = c.user_id 
  AND (
    has_customer_permission(auth.uid(), 'view_basic') OR
    has_customer_permission(auth.uid(), 'view_contact') OR
    has_customer_permission(auth.uid(), 'view_full') OR
    has_customer_permission(auth.uid(), 'manage') OR
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Role-based customer viewing" ON public.customers;
DROP POLICY IF EXISTS "Role-based customer creation" ON public.customers;
DROP POLICY IF EXISTS "Role-based customer updates" ON public.customers;
DROP POLICY IF EXISTS "Role-based customer deletion" ON public.customers;

-- Create new restrictive policies that require explicit permissions
CREATE POLICY "Granular customer viewing" 
ON public.customers 
FOR SELECT 
USING (
  auth.uid() = user_id AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_customer_permission(auth.uid(), 'view_basic') OR
    has_customer_permission(auth.uid(), 'view_contact') OR
    has_customer_permission(auth.uid(), 'view_full') OR
    has_customer_permission(auth.uid(), 'manage')
  )
);

-- Only users with manage permission can create customers (plus admins)
CREATE POLICY "Restricted customer creation" 
ON public.customers 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_customer_permission(auth.uid(), 'manage')
  )
);

-- Only users with manage permission can update customers (plus admins)
CREATE POLICY "Restricted customer updates" 
ON public.customers 
FOR UPDATE 
USING (
  auth.uid() = user_id AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_customer_permission(auth.uid(), 'manage')
  )
);

-- Only admins can delete customers
CREATE POLICY "Admin-only customer deletion" 
ON public.customers 
FOR DELETE 
USING (
  auth.uid() = user_id AND has_role(auth.uid(), 'admin'::app_role)
);

-- Enhanced audit logging with more details
DROP TRIGGER IF EXISTS customer_access_audit_trigger ON public.customers;
DROP FUNCTION IF EXISTS public.log_customer_access();

-- Updated audit function with more security details
CREATE OR REPLACE FUNCTION public.log_customer_access()
RETURNS TRIGGER AS $$
DECLARE
  user_permissions text[];
BEGIN
  -- Get user's customer permissions
  SELECT array_agg(permission_type) INTO user_permissions
  FROM public.customer_permissions
  WHERE user_id = auth.uid() AND (expires_at IS NULL OR expires_at > now());

  -- Log customer data access for audit purposes
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.customer_access_log (user_id, customer_id, action, user_agent)
    VALUES (auth.uid(), NEW.id, TG_OP || ' - Permissions: ' || COALESCE(array_to_string(user_permissions, ','), 'admin'), 
            current_setting('request.headers', true)::json->>'user-agent');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.customer_access_log (user_id, customer_id, action, user_agent)
    VALUES (auth.uid(), NEW.id, TG_OP || ' - Permissions: ' || COALESCE(array_to_string(user_permissions, ','), 'admin'),
            current_setting('request.headers', true)::json->>'user-agent');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.customer_access_log (user_id, customer_id, action, user_agent)
    VALUES (auth.uid(), OLD.id, TG_OP || ' - Admin access',
            current_setting('request.headers', true)::json->>'user-agent');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the audit trigger
CREATE TRIGGER customer_access_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.log_customer_access();

-- Insert default permissions for existing HR and supervisor roles
-- This ensures backward compatibility while adding security
INSERT INTO public.customer_permissions (user_id, permission_type, granted_by, notes)
SELECT DISTINCT ur.user_id, 'view_basic', ur.user_id, 'Auto-granted for existing HR/supervisor role'
FROM public.user_roles ur
WHERE ur.role IN ('hr', 'supervisor')
ON CONFLICT (user_id, permission_type) DO NOTHING;

-- Grant contact viewing to HR (they need this for customer service)
INSERT INTO public.customer_permissions (user_id, permission_type, granted_by, notes)
SELECT DISTINCT ur.user_id, 'view_contact', ur.user_id, 'Auto-granted for HR role'
FROM public.user_roles ur
WHERE ur.role = 'hr'
ON CONFLICT (user_id, permission_type) DO NOTHING;

-- Grant supervisors view_full access (but not manage)
INSERT INTO public.customer_permissions (user_id, permission_type, granted_by, notes)
SELECT DISTINCT ur.user_id, 'view_full', ur.user_id, 'Auto-granted for supervisor role'
FROM public.user_roles ur
WHERE ur.role = 'supervisor'
ON CONFLICT (user_id, permission_type) DO NOTHING;

COMMENT ON TABLE public.customer_permissions IS 'Granular permissions for customer data access - implements principle of least privilege';
COMMENT ON VIEW public.customers_secure IS 'Security-enhanced view of customer data with field-level access control';
COMMENT ON FUNCTION public.has_customer_permission IS 'Checks if user has specific customer data permission';