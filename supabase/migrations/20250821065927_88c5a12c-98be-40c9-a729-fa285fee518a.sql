-- The customers_secure and customers_secure_view are views built on the customers table
-- They already have permission-based field filtering in their definitions
-- We need to enable RLS policies to control who can access these views

-- Enable RLS policies for customers_secure view
CREATE POLICY "Users with customer permissions can access customers_secure"
ON public.customers_secure
FOR SELECT
TO authenticated
USING (
  -- Users with any customer permission level can access the view
  -- The view itself handles field-level security through its definition
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_customer_permission(auth.uid(), 'view_basic') OR
  has_customer_permission(auth.uid(), 'view_contact') OR
  has_customer_permission(auth.uid(), 'view_full') OR
  has_customer_permission(auth.uid(), 'manage')
);

-- Enable RLS policies for customers_secure_view
CREATE POLICY "Users with customer permissions can access customers_secure_view"
ON public.customers_secure_view
FOR SELECT
TO authenticated
USING (
  -- Users with any customer permission level can access the view
  -- The view itself handles field-level security through its definition
  has_role(auth.uid(), 'admin'::app_role) OR 
  get_user_customer_permission_level(auth.uid()) IS NOT NULL
);

-- Grant necessary permissions to authenticated users to access the views
GRANT SELECT ON public.customers_secure TO authenticated;
GRANT SELECT ON public.customers_secure_view TO authenticated;