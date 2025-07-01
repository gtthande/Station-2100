
-- Create inventory_products table (master table)
CREATE TABLE public.inventory_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  part_number TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  manufacturer TEXT,
  unit_of_measure TEXT DEFAULT 'each',
  minimum_stock INTEGER DEFAULT 0,
  reorder_point INTEGER DEFAULT 0,
  unit_cost DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, part_number)
);

-- Create inventory_batches table (detail table)
CREATE TABLE public.inventory_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  product_id UUID REFERENCES public.inventory_products(id) ON DELETE CASCADE NOT NULL,
  batch_number TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  location TEXT,
  url TEXT,
  expiry_date DATE,
  received_date DATE DEFAULT CURRENT_DATE,
  supplier_id UUID REFERENCES public.suppliers(id),
  purchase_order TEXT,
  cost_per_unit DECIMAL(10,2),
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'quarantined', 'consumed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id, batch_number)
);

-- Enable Row Level Security
ALTER TABLE public.inventory_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_batches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for inventory_products
CREATE POLICY "Users can view their own products" 
  ON public.inventory_products 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own products" 
  ON public.inventory_products 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products" 
  ON public.inventory_products 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products" 
  ON public.inventory_products 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for inventory_batches
CREATE POLICY "Users can view their own batches" 
  ON public.inventory_batches 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own batches" 
  ON public.inventory_batches 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own batches" 
  ON public.inventory_batches 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own batches" 
  ON public.inventory_batches 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create a view for inventory summary with calculated totals
-- Views inherit RLS from underlying tables, so no need to enable RLS on the view itself
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
  COALESCE(SUM(CASE WHEN b.status = 'active' THEN b.quantity ELSE 0 END), 0) as total_quantity,
  COUNT(b.id) as batch_count,
  p.created_at,
  p.updated_at
FROM public.inventory_products p
LEFT JOIN public.inventory_batches b ON p.id = b.product_id
GROUP BY p.id, p.user_id, p.part_number, p.name, p.description, p.category, 
         p.manufacturer, p.unit_of_measure, p.minimum_stock, p.reorder_point, 
         p.unit_cost, p.created_at, p.updated_at;
