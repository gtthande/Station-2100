-- First drop the existing view that depends on columns we want to remove
DROP VIEW IF EXISTS public.inventory_summary;

-- Create departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  department_name TEXT NOT NULL,
  department_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, department_name)
);

-- Enable RLS on departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for departments
CREATE POLICY "Users can view their own departments" 
ON public.departments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own departments" 
ON public.departments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own departments" 
ON public.departments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own departments" 
ON public.departments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create stock_categories table
CREATE TABLE public.stock_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  department_id UUID NOT NULL,
  category_name TEXT NOT NULL,
  category_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_name)
);

-- Enable RLS on stock_categories
ALTER TABLE public.stock_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for stock_categories
CREATE POLICY "Users can view their own stock categories" 
ON public.stock_categories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stock categories" 
ON public.stock_categories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock categories" 
ON public.stock_categories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock categories" 
ON public.stock_categories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Modify inventory_products table
-- Remove specified columns
ALTER TABLE public.inventory_products 
DROP COLUMN IF EXISTS original_part_no,
DROP COLUMN IF EXISTS alternate_department,
DROP COLUMN IF EXISTS manufacturer,
DROP COLUMN IF EXISTS name;

-- Change data types to allow decimals
ALTER TABLE public.inventory_products 
ALTER COLUMN reorder_qty TYPE NUMERIC,
ALTER COLUMN minimum_stock TYPE NUMERIC,
ALTER COLUMN reorder_point TYPE NUMERIC;

-- Change stock_category to reference the new table (will be UUID)
ALTER TABLE public.inventory_products 
ALTER COLUMN stock_category TYPE UUID USING NULL;

-- Change department_id to UUID to reference departments table
ALTER TABLE public.inventory_products 
ALTER COLUMN department_id TYPE UUID USING NULL;

-- Remove stock_qty as it will be computed later
ALTER TABLE public.inventory_products 
DROP COLUMN IF EXISTS stock_qty;

-- Also update inventory_batches department_id to UUID
ALTER TABLE public.inventory_batches 
ALTER COLUMN department_id TYPE UUID USING NULL,
ALTER COLUMN alternate_department_id TYPE UUID USING NULL;

-- Recreate the inventory_summary view with updated fields
CREATE VIEW public.inventory_summary AS
SELECT 
  p.id,
  p.user_id,
  p.part_number,
  p.description,
  p.category,
  p.unit_of_measure,
  p.minimum_stock,
  p.reorder_point,
  p.unit_cost,
  p.bin_no,
  p.reorder_qty,
  p.purchase_price,
  p.sale_markup,
  p.sale_price,
  p.stock_category,
  p.open_balance,
  p.open_bal_date,
  p.notes,
  p.active,
  p.department_id,
  p.superseding_no,
  p.rack,
  p.row_position,
  COALESCE(SUM(b.quantity), 0) as total_quantity,
  COUNT(b.id) as batch_count,
  p.created_at,
  p.updated_at,
  d.department_name,
  sc.category_name as stock_category_name
FROM public.inventory_products p
LEFT JOIN public.inventory_batches b ON p.id = b.product_id AND b.status = 'active'
LEFT JOIN public.departments d ON p.department_id = d.id
LEFT JOIN public.stock_categories sc ON p.stock_category = sc.id
GROUP BY p.id, p.user_id, p.part_number, p.description, p.category, p.unit_of_measure, 
         p.minimum_stock, p.reorder_point, p.unit_cost, p.bin_no, p.reorder_qty, 
         p.purchase_price, p.sale_markup, p.sale_price, p.stock_category, 
         p.open_balance, p.open_bal_date, p.notes, p.active, p.department_id, 
         p.superseding_no, p.rack, p.row_position, p.created_at, p.updated_at,
         d.department_name, sc.category_name;

-- Create trigger for departments updated_at
CREATE TRIGGER update_departments_updated_at
BEFORE UPDATE ON public.departments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for stock_categories updated_at  
CREATE TRIGGER update_stock_categories_updated_at
BEFORE UPDATE ON public.stock_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();