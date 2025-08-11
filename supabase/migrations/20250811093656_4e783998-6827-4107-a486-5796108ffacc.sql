-- Create enum for stock movement event types
CREATE TYPE public.stock_movement_event AS ENUM (
  'OPEN_BALANCE',
  'BATCH_RECEIPT', 
  'JOB_CARD_ISSUE',
  'ADJUSTMENT_IN',
  'ADJUSTMENT_OUT'
);

-- Create stock_movements table
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  movement_date DATE NOT NULL,
  product_id UUID NOT NULL,
  batch_id UUID,
  event_type stock_movement_event NOT NULL,
  quantity NUMERIC NOT NULL, -- Signed quantity (positive for in, negative for out)
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  source_ref TEXT NOT NULL, -- Reference to source document (unique for deduplication)
  department_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID NOT NULL,
  
  -- Constraints
  CONSTRAINT stock_movements_source_ref_unique UNIQUE (source_ref),
  CONSTRAINT stock_movements_user_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT stock_movements_product_fkey FOREIGN KEY (product_id) REFERENCES public.inventory_products(id),
  CONSTRAINT stock_movements_batch_fkey FOREIGN KEY (batch_id) REFERENCES public.inventory_batches(id),
  CONSTRAINT stock_movements_department_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id),
  CONSTRAINT stock_movements_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX idx_stock_movements_product_date ON public.stock_movements(product_id, movement_date);
CREATE INDEX idx_stock_movements_product_batch_date ON public.stock_movements(product_id, batch_id, movement_date);
CREATE INDEX idx_stock_movements_user_id ON public.stock_movements(user_id);
CREATE INDEX idx_stock_movements_event_type ON public.stock_movements(event_type);
CREATE INDEX idx_stock_movements_source_ref ON public.stock_movements(source_ref);

-- Enable Row Level Security
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own stock movements" 
ON public.stock_movements 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create stock movements" 
ON public.stock_movements 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND auth.uid() = created_by);

CREATE POLICY "Users can update their own stock movements" 
ON public.stock_movements 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to calculate stock on hand
CREATE OR REPLACE FUNCTION public.get_stock_on_hand(
  _user_id UUID,
  _product_id UUID,
  _as_of_date DATE DEFAULT CURRENT_DATE,
  _batch_id UUID DEFAULT NULL
)
RETURNS TABLE(
  product_id UUID,
  batch_id UUID,
  quantity_on_hand NUMERIC,
  weighted_avg_cost NUMERIC,
  total_value NUMERIC
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH movement_totals AS (
    SELECT 
      sm.product_id,
      sm.batch_id,
      SUM(sm.quantity) as total_quantity,
      SUM(sm.quantity * sm.unit_cost) / NULLIF(SUM(CASE WHEN sm.quantity > 0 THEN sm.quantity ELSE 0 END), 0) as weighted_avg_cost
    FROM public.stock_movements sm
    WHERE sm.user_id = _user_id
      AND sm.product_id = _product_id
      AND sm.movement_date <= _as_of_date
      AND (_batch_id IS NULL OR sm.batch_id = _batch_id)
    GROUP BY sm.product_id, sm.batch_id
    HAVING SUM(sm.quantity) > 0
  )
  SELECT 
    mt.product_id,
    mt.batch_id,
    mt.total_quantity as quantity_on_hand,
    COALESCE(mt.weighted_avg_cost, 0) as weighted_avg_cost,
    mt.total_quantity * COALESCE(mt.weighted_avg_cost, 0) as total_value
  FROM movement_totals mt;
$$;

-- Create function to get stock valuation report
CREATE OR REPLACE FUNCTION public.get_stock_valuation_report(
  _user_id UUID,
  _as_of_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  product_id UUID,
  part_number TEXT,
  description TEXT,
  quantity_on_hand NUMERIC,
  weighted_avg_cost NUMERIC,
  total_value NUMERIC
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH stock_summary AS (
    SELECT 
      sm.product_id,
      SUM(sm.quantity) as total_quantity,
      SUM(sm.quantity * sm.unit_cost) / NULLIF(SUM(CASE WHEN sm.quantity > 0 THEN sm.quantity ELSE 0 END), 0) as weighted_avg_cost
    FROM public.stock_movements sm
    WHERE sm.user_id = _user_id
      AND sm.movement_date <= _as_of_date
    GROUP BY sm.product_id
    HAVING SUM(sm.quantity) > 0
  )
  SELECT 
    ss.product_id,
    ip.part_number,
    ip.description,
    ss.total_quantity as quantity_on_hand,
    COALESCE(ss.weighted_avg_cost, 0) as weighted_avg_cost,
    ss.total_quantity * COALESCE(ss.weighted_avg_cost, 0) as total_value
  FROM stock_summary ss
  JOIN public.inventory_products ip ON ss.product_id = ip.id
  WHERE ip.user_id = _user_id
  ORDER BY ip.part_number;
$$;

-- Create function to get batch breakdown report
CREATE OR REPLACE FUNCTION public.get_batch_breakdown_report(
  _user_id UUID,
  _product_id UUID DEFAULT NULL,
  _as_of_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  product_id UUID,
  part_number TEXT,
  batch_id UUID,
  batch_number TEXT,
  quantity_on_hand NUMERIC,
  weighted_avg_cost NUMERIC,
  total_value NUMERIC,
  date_received DATE
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH batch_summary AS (
    SELECT 
      sm.product_id,
      sm.batch_id,
      SUM(sm.quantity) as total_quantity,
      SUM(sm.quantity * sm.unit_cost) / NULLIF(SUM(CASE WHEN sm.quantity > 0 THEN sm.quantity ELSE 0 END), 0) as weighted_avg_cost
    FROM public.stock_movements sm
    WHERE sm.user_id = _user_id
      AND sm.movement_date <= _as_of_date
      AND (_product_id IS NULL OR sm.product_id = _product_id)
      AND sm.batch_id IS NOT NULL
    GROUP BY sm.product_id, sm.batch_id
    HAVING SUM(sm.quantity) > 0
  )
  SELECT 
    bs.product_id,
    ip.part_number,
    bs.batch_id,
    ib.batch_number,
    bs.total_quantity as quantity_on_hand,
    COALESCE(bs.weighted_avg_cost, 0) as weighted_avg_cost,
    bs.total_quantity * COALESCE(bs.weighted_avg_cost, 0) as total_value,
    ib.received_date as date_received
  FROM batch_summary bs
  JOIN public.inventory_products ip ON bs.product_id = ip.id
  JOIN public.inventory_batches ib ON bs.batch_id = ib.id
  WHERE ip.user_id = _user_id
  ORDER BY ip.part_number, ib.received_date;
$$;