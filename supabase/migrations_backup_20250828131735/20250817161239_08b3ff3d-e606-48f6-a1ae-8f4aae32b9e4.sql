-- Fix Customer Contact Information Security Issue
-- Implement role-based access controls for customer data

-- Drop existing permissive RLS policies
DROP POLICY IF EXISTS "Users can create their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can view their own customers" ON public.customers;

-- Create more restrictive role-based RLS policies
-- Only allow users with customer management roles to access customer data

-- SELECT policy: Only admins, sales, and customer service can view customers
CREATE POLICY "Role-based customer viewing" 
ON public.customers 
FOR SELECT 
USING (
  auth.uid() = user_id AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'sales'::app_role) OR
    has_role(auth.uid(), 'customer_service'::app_role) OR
    has_role(auth.uid(), 'hr'::app_role)
  )
);

-- INSERT policy: Only admins and sales can create customers
CREATE POLICY "Role-based customer creation" 
ON public.customers 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'sales'::app_role)
  )
);

-- UPDATE policy: Only admins, sales, and customer service can update customers
CREATE POLICY "Role-based customer updates" 
ON public.customers 
FOR UPDATE 
USING (
  auth.uid() = user_id AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'sales'::app_role) OR
    has_role(auth.uid(), 'customer_service'::app_role)
  )
);

-- DELETE policy: Only admins can delete customers
CREATE POLICY "Role-based customer deletion" 
ON public.customers 
FOR DELETE 
USING (
  auth.uid() = user_id AND has_role(auth.uid(), 'admin'::app_role)
);

-- Add the missing roles to the app_role enum if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid 
                 WHERE t.typname = 'app_role' AND e.enumlabel = 'sales') THEN
    ALTER TYPE app_role ADD VALUE 'sales';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid 
                 WHERE t.typname = 'app_role' AND e.enumlabel = 'customer_service') THEN
    ALTER TYPE app_role ADD VALUE 'customer_service';
  END IF;
END $$;

-- Add audit logging for customer data access
CREATE TABLE IF NOT EXISTS public.customer_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  action text NOT NULL,
  accessed_at timestamp with time zone DEFAULT now(),
  ip_address inet,
  user_agent text
);

-- Enable RLS on audit log
ALTER TABLE public.customer_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view customer access logs" 
ON public.customer_access_log 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to log customer access
CREATE OR REPLACE FUNCTION public.log_customer_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log customer data access for audit purposes
  IF TG_OP = 'SELECT' THEN
    INSERT INTO public.customer_access_log (user_id, customer_id, action)
    VALUES (auth.uid(), OLD.id, TG_OP);
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.customer_access_log (user_id, customer_id, action)
    VALUES (auth.uid(), NEW.id, TG_OP);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.customer_access_log (user_id, customer_id, action)
    VALUES (auth.uid(), NEW.id, TG_OP);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.customer_access_log (user_id, customer_id, action)
    VALUES (auth.uid(), OLD.id, TG_OP);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;