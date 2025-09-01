-- Drop and recreate inventory_summary view without category and notes columns
DROP VIEW IF EXISTS public.inventory_summary;

-- Remove category and notes columns from inventory_products table
ALTER TABLE public.inventory_products 
DROP COLUMN IF EXISTS category,
DROP COLUMN IF EXISTS notes;

-- Recreate inventory_summary view without category and notes
CREATE VIEW public.inventory_summary AS
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
    COALESCE(SUM(CASE WHEN b.status IN ('active', 'approved') THEN b.quantity ELSE 0 END), 0) as total_quantity,
    COUNT(b.id) as batch_count,
    d.department_name,
    sc.category_name as stock_category_name
FROM public.inventory_products p
LEFT JOIN public.inventory_batches b ON p.id = b.product_id AND p.user_id = b.user_id
LEFT JOIN public.departments d ON p.department_id = d.id AND p.user_id = d.user_id
LEFT JOIN public.stock_categories sc ON p.stock_category = sc.id AND p.user_id = sc.user_id
WHERE p.user_id = auth.uid()
GROUP BY p.id, p.user_id, p.part_number, p.description, p.unit_of_measure, 
         p.minimum_stock, p.reorder_point, p.unit_cost, p.reorder_qty, 
         p.purchase_price, p.sale_markup, p.sale_price, p.stock_category, 
         p.open_balance, p.open_bal_date, p.active, p.department_id, 
         p.bin_no, p.superseding_no, p.rack, p.row_position, 
         p.created_at, p.updated_at, d.department_name, sc.category_name;