-- Drop existing tool-related tables to rebuild with new schema
DROP TABLE IF EXISTS public.tool_events CASCADE;
DROP TABLE IF EXISTS public.tool_loans CASCADE;
DROP TABLE IF EXISTS public.tools CASCADE;
DROP VIEW IF EXISTS public.v_tool_movement CASCADE;

-- Create tools table with enhanced schema
CREATE TABLE public.tools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  serial_no TEXT,
  calibration_date DATE,
  status app_tool_status NOT NULL DEFAULT 'in_stock',
  default_due_hours INTEGER DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tool_loans table
CREATE TABLE public.tool_loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tool_id UUID NOT NULL,
  borrower_user_id UUID NOT NULL,
  issuer_user_id UUID NOT NULL,
  auth_method auth_method NOT NULL,
  checkout_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  due_at TIMESTAMP WITH TIME ZONE NOT NULL,
  returned_at TIMESTAMP WITH TIME ZONE NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tool_events table
CREATE TABLE public.tool_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tool_id UUID NOT NULL,
  loan_id UUID,
  event_type event_type NOT NULL,
  actor_user_id UUID NOT NULL,
  at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tools
CREATE POLICY "Users manage their tools" ON public.tools
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for tool_loans
CREATE POLICY "Users manage their tool loans" ON public.tool_loans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for tool_events
CREATE POLICY "Users manage their tool events" ON public.tool_events
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_tool_loans_tool_id ON public.tool_loans(tool_id);
CREATE INDEX idx_tool_loans_borrower ON public.tool_loans(borrower_user_id);
CREATE INDEX idx_tool_loans_active ON public.tool_loans(tool_id) WHERE returned_at IS NULL;
CREATE INDEX idx_tool_events_tool_id ON public.tool_events(tool_id);
CREATE INDEX idx_tool_events_at ON public.tool_events(at);

-- Create unique constraint for one active loan per tool
CREATE UNIQUE INDEX idx_tool_loans_one_active 
ON public.tool_loans(tool_id) 
WHERE returned_at IS NULL;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_tools_updated_at
  BEFORE UPDATE ON public.tools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tool_loans_updated_at
  BEFORE UPDATE ON public.tool_loans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to compute due_at for loans
CREATE OR REPLACE FUNCTION public.compute_tool_due_at(
  _tool_id UUID,
  _checkout_at TIMESTAMP WITH TIME ZONE
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
AS $$
DECLARE
  v_hours INTEGER;
BEGIN
  SELECT t.default_due_hours INTO v_hours 
  FROM public.tools t 
  WHERE t.id = _tool_id;
  
  IF v_hours IS NULL OR v_hours <= 0 THEN
    v_hours := 24; -- fallback
  END IF;
  
  RETURN _checkout_at + make_interval(hours => v_hours);
END;
$$;

-- Create trigger to auto-set due_at and validate loans
CREATE OR REPLACE FUNCTION public.before_insert_tool_loans()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_tool_user UUID;
BEGIN
  -- Ensure tool belongs to same user
  SELECT user_id INTO v_tool_user FROM public.tools WHERE id = NEW.tool_id;
  
  IF v_tool_user IS NULL THEN
    RAISE EXCEPTION 'Tool not found';
  END IF;
  
  IF NEW.user_id IS NULL THEN
    NEW.user_id := v_tool_user;
  END IF;
  
  IF NEW.user_id <> v_tool_user THEN
    RAISE EXCEPTION 'Tool loan must belong to the same tenant as the tool';
  END IF;
  
  -- Auto-calculate due_at if not provided
  IF NEW.due_at IS NULL THEN
    NEW.due_at := public.compute_tool_due_at(NEW.tool_id, COALESCE(NEW.checkout_at, now()));
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER before_insert_tool_loans_trigger
  BEFORE INSERT ON public.tool_loans
  FOR EACH ROW
  EXECUTE FUNCTION public.before_insert_tool_loans();

-- Create trigger to update tool status and log events
CREATE OR REPLACE FUNCTION public.after_change_tool_loans()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Set tool as checked out
    UPDATE public.tools SET status = 'checked_out', updated_at = now() WHERE id = NEW.tool_id;
    
    -- Log checkout event
    INSERT INTO public.tool_events(user_id, tool_id, loan_id, event_type, actor_user_id, at, meta)
    VALUES (NEW.user_id, NEW.tool_id, NEW.id, 'checkout', NEW.issuer_user_id, NEW.checkout_at, 
            jsonb_build_object('borrower_user_id', NEW.borrower_user_id));
            
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.returned_at IS NOT NULL AND (OLD.returned_at IS NULL OR NEW.returned_at <> OLD.returned_at) THEN
      -- Set tool as in stock
      UPDATE public.tools SET status = 'in_stock', updated_at = now() WHERE id = NEW.tool_id;
      
      -- Log return event
      INSERT INTO public.tool_events(user_id, tool_id, loan_id, event_type, actor_user_id, at, meta)
      VALUES (NEW.user_id, NEW.tool_id, NEW.id, 'return', NEW.issuer_user_id, NEW.returned_at,
              jsonb_build_object('borrower_user_id', NEW.borrower_user_id));
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$;

CREATE TRIGGER after_change_tool_loans_trigger
  AFTER INSERT OR UPDATE ON public.tool_loans
  FOR EACH ROW
  EXECUTE FUNCTION public.after_change_tool_loans();

-- Create movement view for reports
CREATE VIEW public.v_tool_movement AS
SELECT 
  te.id as event_id,
  te.at,
  te.tool_id,
  t.name as tool_name,
  t.sku,
  t.serial_no,
  te.event_type as event,
  te.loan_id,
  te.user_id,
  CASE 
    WHEN te.event_type = 'checkout' THEN 'Warehouse'
    WHEN te.event_type = 'return' THEN borrower_profile.full_name
    WHEN te.event_type = 'transfer' THEN borrower_profile.full_name
    ELSE 'Unknown'
  END as from_holder,
  CASE 
    WHEN te.event_type = 'checkout' THEN borrower_profile.full_name
    WHEN te.event_type = 'return' THEN 'Warehouse'  
    WHEN te.event_type = 'transfer' THEN 'Unknown'
    ELSE 'Unknown'
  END as to_holder,
  issuer_profile.full_name as issuer_name,
  actor_profile.full_name as actor_name
FROM public.tool_events te
JOIN public.tools t ON te.tool_id = t.id
LEFT JOIN public.tool_loans tl ON te.loan_id = tl.id
LEFT JOIN public.profiles borrower_profile ON tl.borrower_user_id = borrower_profile.id
LEFT JOIN public.profiles issuer_profile ON tl.issuer_user_id = issuer_profile.id  
LEFT JOIN public.profiles actor_profile ON te.actor_user_id = actor_profile.id
ORDER BY te.at DESC;