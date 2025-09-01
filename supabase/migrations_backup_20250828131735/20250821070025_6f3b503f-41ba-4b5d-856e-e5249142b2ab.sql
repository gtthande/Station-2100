-- Grant SELECT permissions on the secure customer views to authenticated users
-- The views themselves already have field-level security built into their definitions

-- Grant access to customers_secure view
GRANT SELECT ON public.customers_secure TO authenticated;

-- Grant access to customers_secure_view
GRANT SELECT ON public.customers_secure_view TO authenticated;

-- Ensure the views are accessible by users with proper permissions
-- The security is already built into the view definitions through permission checks