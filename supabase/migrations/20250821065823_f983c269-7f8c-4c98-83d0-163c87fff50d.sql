-- Enable RLS on customers_secure table
ALTER TABLE public.customers_secure ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customers_secure table matching the permission system
CREATE POLICY "Restricted customer viewing with granular permissions" 
ON public.customers_secure 
FOR SELECT 
USING (
  (auth.uid() = user_id) AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   get_user_customer_permission_level(auth.uid()) IS NOT NULL)
);

CREATE POLICY "Restricted customer creation" 
ON public.customers_secure 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   get_user_customer_permission_level(auth.uid()) = 'manage')
);

CREATE POLICY "Restricted customer updates" 
ON public.customers_secure 
FOR UPDATE 
USING (
  (auth.uid() = user_id) AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   get_user_customer_permission_level(auth.uid()) = 'manage')
);

CREATE POLICY "Admin-only customer deletion" 
ON public.customers_secure 
FOR DELETE 
USING (
  (auth.uid() = user_id) AND 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Enable RLS on customers_secure_view 
ALTER VIEW public.customers_secure_view SET (security_invoker = true);

-- Since customers_secure_view appears to be redundant with the existing customers_secure_view functionality,
-- and the code is already using customers_secure_view properly, we should ensure it's properly secured
-- by making sure it inherits security from the underlying table