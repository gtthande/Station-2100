-- Create installation/removal logs table
CREATE TABLE public.installation_removal_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rotable_part_id UUID NOT NULL REFERENCES public.rotable_parts(id) ON DELETE CASCADE,
  aircraft_id TEXT NOT NULL,
  log_type TEXT NOT NULL CHECK (log_type IN ('installation', 'removal')),
  log_date DATE NOT NULL,
  flight_hours_at_action NUMERIC(10,2),
  flight_cycles_at_action INTEGER,
  performed_by_staff_id UUID,
  performed_by_name TEXT,
  reason_for_removal TEXT,
  maintenance_reference TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create repair & exchange records table
CREATE TABLE public.repair_exchange_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rotable_part_id UUID NOT NULL REFERENCES public.rotable_parts(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL CHECK (record_type IN ('repair', 'exchange', 'overhaul')),
  sent_to_facility TEXT NOT NULL,
  sent_date DATE NOT NULL,
  expected_return_date DATE,
  actual_return_date DATE,
  cost NUMERIC(10,2),
  warranty_expiry_date DATE,
  warranty_terms TEXT,
  new_tso_hours NUMERIC(10,2),
  new_tso_cycles INTEGER,
  exchange_part_serial TEXT,
  work_order_number TEXT,
  certification_reference TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'in_progress', 'completed', 'returned')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pooled parts sharing table
CREATE TABLE public.pooled_parts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rotable_part_id UUID NOT NULL REFERENCES public.rotable_parts(id) ON DELETE CASCADE,
  pool_name TEXT NOT NULL,
  pool_operator TEXT,
  sharing_agreement_ref TEXT,
  available_for_pool BOOLEAN DEFAULT false,
  pool_priority INTEGER DEFAULT 1,
  usage_cost_per_hour NUMERIC(8,2),
  usage_cost_per_cycle NUMERIC(8,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create warehouse locations table for detailed location tracking
CREATE TABLE public.warehouse_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rotable_part_id UUID NOT NULL REFERENCES public.rotable_parts(id) ON DELETE CASCADE,
  warehouse_code TEXT NOT NULL,
  aisle TEXT,
  shelf TEXT,
  bin TEXT,
  is_current_location BOOLEAN DEFAULT true,
  moved_date DATE DEFAULT CURRENT_DATE,
  moved_by_staff_id UUID,
  moved_by_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.installation_removal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_exchange_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pooled_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for installation_removal_logs
CREATE POLICY "Users can manage their own installation/removal logs" 
ON public.installation_removal_logs 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for repair_exchange_records
CREATE POLICY "Users can manage their own repair/exchange records" 
ON public.repair_exchange_records 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for pooled_parts
CREATE POLICY "Users can manage their own pooled parts" 
ON public.pooled_parts 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for warehouse_locations
CREATE POLICY "Users can manage their own warehouse locations" 
ON public.warehouse_locations 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Create update triggers for new tables
CREATE TRIGGER update_installation_removal_logs_updated_at
  BEFORE UPDATE ON public.installation_removal_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_repair_exchange_records_updated_at
  BEFORE UPDATE ON public.repair_exchange_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pooled_parts_updated_at
  BEFORE UPDATE ON public.pooled_parts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_warehouse_locations_updated_at
  BEFORE UPDATE ON public.warehouse_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();