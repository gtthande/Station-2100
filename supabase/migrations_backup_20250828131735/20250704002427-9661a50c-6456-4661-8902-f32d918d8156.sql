
-- Create warehouses table
CREATE TABLE public.warehouses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'United States',
  manager_name TEXT,
  manager_email TEXT,
  manager_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, code)
);

-- Add warehouse_id to inventory_batches
ALTER TABLE public.inventory_batches 
ADD COLUMN warehouse_id UUID REFERENCES public.warehouses(id);

-- Add pricing and owner-supplied fields to inventory_products
ALTER TABLE public.inventory_products 
ADD COLUMN is_owner_supplied BOOLEAN DEFAULT false,
ADD COLUMN markup_percentage DECIMAL(5,2) DEFAULT 25.00,
ADD COLUMN sale_price DECIMAL(10,2),
ADD COLUMN owner_cost_price DECIMAL(10,2);

-- Create system settings table for default markup
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, setting_key)
);

-- Enable RLS on new tables
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for warehouses
CREATE POLICY "Users can view their own warehouses" 
  ON public.warehouses 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own warehouses" 
  ON public.warehouses 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own warehouses" 
  ON public.warehouses 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own warehouses" 
  ON public.warehouses 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS policies for system_settings
CREATE POLICY "Users can view their own settings" 
  ON public.system_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings" 
  ON public.system_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
  ON public.system_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" 
  ON public.system_settings 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Insert default warehouses for existing admin user
INSERT INTO public.warehouses (user_id, name, code, address, city, state, country) 
SELECT 
  p.id as user_id,
  'Main Warehouse' as name,
  'MAIN' as code,
  '123 Aviation Blvd' as address,
  'Aviation City' as city,
  'FL' as state,
  'United States' as country
FROM public.profiles p
WHERE p.email = 'gtthande@gmail.com'
ON CONFLICT (user_id, code) DO NOTHING;

INSERT INTO public.warehouses (user_id, name, code, address, city, state, country) 
SELECT 
  p.id as user_id,
  'North Warehouse' as name,
  'NORTH' as code,
  '456 Hangar Row' as address,
  'Northern Base' as city,
  'GA' as state,
  'United States' as country
FROM public.profiles p
WHERE p.email = 'gtthande@gmail.com'
ON CONFLICT (user_id, code) DO NOTHING;

INSERT INTO public.warehouses (user_id, name, code, address, city, state, country) 
SELECT 
  p.id as user_id,
  'South Warehouse' as name,
  'SOUTH' as code,
  '789 Terminal Way' as address,
  'Southern Hub' as city,
  'TX' as state,
  'United States' as country
FROM public.profiles p
WHERE p.email = 'gtthande@gmail.com'
ON CONFLICT (user_id, code) DO NOTHING;

-- Insert default markup setting
INSERT INTO public.system_settings (user_id, setting_key, setting_value, description)
SELECT 
  p.id as user_id,
  'default_markup_percentage' as setting_key,
  '25.00' as setting_value,
  'Default markup percentage applied to non-owner-supplied items' as description
FROM public.profiles p
WHERE p.email = 'gtthande@gmail.com'
ON CONFLICT (user_id, setting_key) DO NOTHING;

-- Create function to calculate sale price with markup
CREATE OR REPLACE FUNCTION public.calculate_sale_price(
  unit_cost DECIMAL(10,2),
  markup_percentage DECIMAL(5,2),
  is_owner_supplied BOOLEAN,
  owner_cost_price DECIMAL(10,2)
) RETURNS DECIMAL(10,2)
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN is_owner_supplied THEN COALESCE(owner_cost_price, 0)
    ELSE COALESCE(unit_cost, 0) * (1 + COALESCE(markup_percentage, 0) / 100)
  END;
$$;

-- Update inventory_summary view to include warehouse and pricing information
DROP VIEW IF EXISTS public.inventory_summary;
CREATE VIEW public.inventory_summary AS
SELECT 
  p.id,
  p.user_id,
  p.part_number,
  p.name,
  p.description,
  p.category,
  p.manufacturer,
  p.unit_of_measure,
  p.minimum_stock,
  p.reorder_point,
  p.unit_cost,
  p.is_owner_supplied,
  p.markup_percentage,
  p.sale_price,
  p.owner_cost_price,
  -- Calculate automatic sale price
  public.calculate_sale_price(p.unit_cost, p.markup_percentage, p.is_owner_supplied, p.owner_cost_price) as calculated_sale_price,
  -- Only count approved batches as available stock
  COALESCE(SUM(CASE WHEN b.status = 'active' AND b.approval_status = 'approved' THEN b.quantity ELSE 0 END), 0) as total_quantity,
  -- Total batches (all statuses)
  COUNT(b.id) as batch_count,
  -- Pending approval batches
  COALESCE(SUM(CASE WHEN b.approval_status = 'pending' THEN b.quantity ELSE 0 END), 0) as pending_quantity,
  -- Warehouse distribution
  json_agg(
    DISTINCT jsonb_build_object(
      'warehouse_id', w.id,
      'warehouse_name', w.name,
      'warehouse_code', w.code,
      'quantity', COALESCE(SUM(CASE WHEN b.warehouse_id = w.id AND b.status = 'active' AND b.approval_status = 'approved' THEN b.quantity ELSE 0 END), 0)
    )
  ) FILTER (WHERE w.id IS NOT NULL) as warehouse_distribution,
  p.created_at,
  p.updated_at
FROM public.inventory_products p
LEFT JOIN public.inventory_batches b ON p.id = b.product_id
LEFT JOIN public.warehouses w ON b.warehouse_id = w.id
GROUP BY p.id, p.user_id, p.part_number, p.name, p.description, p.category, 
         p.manufacturer, p.unit_of_measure, p.minimum_stock, p.reorder_point, 
         p.unit_cost, p.is_owner_supplied, p.markup_percentage, p.sale_price, 
         p.owner_cost_price, p.created_at, p.updated_at;
