-- Remove description and department fields from stock_categories table
ALTER TABLE public.stock_categories 
DROP COLUMN IF EXISTS category_description,
DROP COLUMN IF EXISTS department_id;