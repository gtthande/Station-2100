-- Remove category and notes columns from inventory_products table
ALTER TABLE public.inventory_products 
DROP COLUMN IF EXISTS category,
DROP COLUMN IF EXISTS notes;