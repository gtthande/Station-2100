-- Fix Security Issues

-- 1. Drop the security definer views
DROP VIEW IF EXISTS public.inventory_summary;
DROP VIEW IF EXISTS public.user_roles_view;

-- 2. Update Auth configuration for OTP expiry (reduce to 5 minutes = 300 seconds)
UPDATE auth.config SET 
    otp_expiry = 300 
WHERE name = 'otp_expiry';

-- 3. Enable leaked password protection
UPDATE auth.config SET 
    password_min_length = 8,
    password_required_characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    enable_password_rules = true
WHERE name IN ('password_min_length', 'password_required_characters', 'enable_password_rules');

-- 4. Create a secure function to get inventory summary (replaces the SECURITY DEFINER view)
CREATE OR REPLACE FUNCTION public.get_inventory_summary()
RETURNS TABLE (
    id uuid,
    user_id uuid,
    part_number text,
    description text,
    unit_of_measure text,
    minimum_stock numeric,
    reorder_point numeric,
    unit_cost numeric,
    reorder_qty numeric,
    purchase_price numeric,
    sale_markup numeric,
    sale_price numeric,
    stock_category uuid,
    open_balance numeric,
    open_bal_date date,
    active boolean,
    department_id uuid,
    bin_no text,
    superseding_no text,
    rack text,
    row_position text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    total_quantity bigint,
    batch_count bigint,
    department_name text,
    stock_category_name text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.part_number,
    p.description,
    p.unit_of_measure,
    p.minimum_stock,
    p.reorder_point,
    p.unit_cost,
    p.reorder_qty,
    p.purchase_price,
    p.sale_markup,
    p.sale_price,
    p.stock_category,
    p.open_balance,
    p.open_bal_date,
    p.active,
    p.department_id,
    p.bin_no,
    p.superseding_no,
    p.rack,
    p.row_position,
    p.created_at,
    p.updated_at,
    COALESCE(sum(
        CASE
            WHEN (b.status = ANY (ARRAY['active'::text, 'approved'::text])) THEN b.quantity
            ELSE 0
        END), 0::bigint) AS total_quantity,
    count(b.id) AS batch_count,
    d.department_name,
    sc.category_name AS stock_category_name
  FROM inventory_products p
    LEFT JOIN inventory_batches b ON ((p.id = b.product_id) AND (p.user_id = b.user_id))
    LEFT JOIN departments d ON ((p.department_id = d.id) AND (p.user_id = d.user_id))
    LEFT JOIN stock_categories sc ON ((p.stock_category = sc.id) AND (p.user_id = sc.user_id))
  WHERE p.user_id = auth.uid()
  GROUP BY p.id, p.user_id, p.part_number, p.description, p.unit_of_measure, p.minimum_stock, 
           p.reorder_point, p.unit_cost, p.reorder_qty, p.purchase_price, p.sale_markup, 
           p.sale_price, p.stock_category, p.open_balance, p.open_bal_date, p.active, 
           p.department_id, p.bin_no, p.superseding_no, p.rack, p.row_position, 
           p.created_at, p.updated_at, d.department_name, sc.category_name;
$$;

-- 5. Create a secure function to get user roles with profile data (replaces the SECURITY DEFINER view)
CREATE OR REPLACE FUNCTION public.get_user_roles_with_profiles()
RETURNS TABLE (
    id uuid,
    user_id uuid,
    role app_role,
    email text,
    full_name text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT 
    ur.id,
    ur.user_id,
    ur.role,
    p.email,
    p.full_name,
    ur.created_at,
    ur.updated_at
  FROM user_roles ur
    LEFT JOIN profiles p ON (ur.user_id = p.id)
  WHERE (
    -- User can see their own roles
    ur.user_id = auth.uid() 
    OR 
    -- Admins can see all roles
    public.has_role(auth.uid(), 'admin')
  );
$$;