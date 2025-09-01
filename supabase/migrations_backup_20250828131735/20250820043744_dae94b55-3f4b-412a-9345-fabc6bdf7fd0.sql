-- Create enum for rotable part status
CREATE TYPE rotable_status AS ENUM (
  'installed',
  'in_stock', 
  'sent_to_oem',
  'awaiting_repair',
  'serviceable',
  'unserviceable'
);

-- Create rotable_parts table
CREATE TABLE public.rotable_parts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  serial_number TEXT NOT NULL,
  part_number TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  ata_chapter TEXT,
  status rotable_status NOT NULL DEFAULT 'in_stock',
  description TEXT,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, serial_number)
);

-- Create flight_tracking table for usage monitoring
CREATE TABLE public.flight_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rotable_part_id UUID NOT NULL REFERENCES public.rotable_parts(id) ON DELETE CASCADE,
  aircraft_tail_number TEXT NOT NULL,
  flight_hours NUMERIC(10,2) DEFAULT 0,
  flight_cycles INTEGER DEFAULT 0,
  installation_date DATE,
  removal_date DATE,
  calendar_time_limit_days INTEGER,
  flight_hours_limit NUMERIC(10,2),
  flight_cycles_limit INTEGER,
  next_inspection_due DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create alerts table for tracking thresholds
CREATE TABLE public.rotable_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rotable_part_id UUID NOT NULL REFERENCES public.rotable_parts(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'calendar_time', 'flight_hours', 'flight_cycles'
  threshold_value NUMERIC,
  current_value NUMERIC,
  alert_date DATE,
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rotable_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rotable_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rotable_parts
CREATE POLICY "Users can manage their own rotable parts" 
ON public.rotable_parts 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for flight_tracking
CREATE POLICY "Users can manage their own flight tracking" 
ON public.flight_tracking 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for rotable_alerts
CREATE POLICY "Users can manage their own rotable alerts" 
ON public.rotable_alerts 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Create update triggers
CREATE TRIGGER update_rotable_parts_updated_at
  BEFORE UPDATE ON public.rotable_parts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flight_tracking_updated_at
  BEFORE UPDATE ON public.flight_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();