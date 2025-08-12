-- Tools Management & Movement Tracking module
-- 1) Enum types
DO $$ BEGIN
  CREATE TYPE public.app_tool_status AS ENUM ('in_stock','checked_out');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.app_tool_auth_method AS ENUM ('code','fingerprint');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.app_tool_event_type AS ENUM ('checkout','return','transfer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Tables
CREATE TABLE IF NOT EXISTS public.tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  serial_no TEXT,
  status public.app_tool_status NOT NULL DEFAULT 'in_stock',
  default_due_hours INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tools_unique_sku_per_user UNIQUE (user_id, sku)
);

-- Reference to profiles (not auth.users) for safer API access
ALTER TABLE public.tools
  DROP CONSTRAINT IF EXISTS tools_user_id_fk,
  ADD CONSTRAINT tools_user_id_fk FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.tool_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tool_id UUID NOT NULL,
  borrower_user_id UUID NOT NULL,
  issuer_user_id UUID NOT NULL,
  auth_method public.app_tool_auth_method NOT NULL,
  checkout_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_at TIMESTAMPTZ NOT NULL,
  returned_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tool_loans_due_after_checkout CHECK (due_at >= checkout_at)
);

ALTER TABLE public.tool_loans
  DROP CONSTRAINT IF EXISTS tool_loans_user_id_fk,
  ADD CONSTRAINT tool_loans_user_id_fk FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  DROP CONSTRAINT IF EXISTS tool_loans_tool_id_fk,
  ADD CONSTRAINT tool_loans_tool_id_fk FOREIGN KEY (tool_id) REFERENCES public.tools(id) ON DELETE CASCADE,
  DROP CONSTRAINT IF EXISTS tool_loans_borrower_fk,
  ADD CONSTRAINT tool_loans_borrower_fk FOREIGN KEY (borrower_user_id) REFERENCES public.profiles(id) ON DELETE RESTRICT,
  DROP CONSTRAINT IF EXISTS tool_loans_issuer_fk,
  ADD CONSTRAINT tool_loans_issuer_fk FOREIGN KEY (issuer_user_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS public.tool_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tool_id UUID NOT NULL,
  loan_id UUID,
  event_type public.app_tool_event_type NOT NULL,
  actor_user_id UUID NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT now(),
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tool_events
  DROP CONSTRAINT IF EXISTS tool_events_user_id_fk,
  ADD CONSTRAINT tool_events_user_id_fk FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  DROP CONSTRAINT IF EXISTS tool_events_tool_id_fk,
  ADD CONSTRAINT tool_events_tool_id_fk FOREIGN KEY (tool_id) REFERENCES public.tools(id) ON DELETE CASCADE,
  DROP CONSTRAINT IF EXISTS tool_events_loan_id_fk,
  ADD CONSTRAINT tool_events_loan_id_fk FOREIGN KEY (loan_id) REFERENCES public.tool_loans(id) ON DELETE SET NULL,
  DROP CONSTRAINT IF EXISTS tool_events_actor_fk,
  ADD CONSTRAINT tool_events_actor_fk FOREIGN KEY (actor_user_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;

-- Global app settings (key/value per user)
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT app_settings_user_key_unique UNIQUE (user_id, key)
);

ALTER TABLE public.app_settings
  DROP CONSTRAINT IF EXISTS app_settings_user_id_fk,
  ADD CONSTRAINT app_settings_user_id_fk FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3) RLS
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Replace existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users manage their tools" ON public.tools;
  CREATE POLICY "Users manage their tools" ON public.tools
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users manage their tool loans" ON public.tool_loans;
  CREATE POLICY "Users manage their tool loans" ON public.tool_loans
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users manage their tool events" ON public.tool_events;
  CREATE POLICY "Users manage their tool events" ON public.tool_events
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users manage their app settings" ON public.app_settings;
  CREATE POLICY "Users manage their app settings" ON public.app_settings
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
END $$;

-- 4) Helper functions & triggers
-- Compute default due_at based on tool.default_due_hours (fallback 24h)
CREATE OR REPLACE FUNCTION public.compute_tool_due_at(_tool_id uuid, _checkout_at timestamptz)
RETURNS timestamptz
LANGUAGE plpgsql
AS $$
DECLARE
  v_hours integer;
BEGIN
  SELECT t.default_due_hours INTO v_hours FROM public.tools t WHERE t.id = _tool_id;
  IF v_hours IS NULL OR v_hours <= 0 THEN
    v_hours := 24; -- fallback
  END IF;
  RETURN _checkout_at + make_interval(hours => v_hours);
END;
$$;

-- BEFORE INSERT on tool_loans: set due_at if null, enforce same tenant, set user_id when omitted
CREATE OR REPLACE FUNCTION public.before_insert_tool_loans()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_tool_user uuid;
BEGIN
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
  IF NEW.due_at IS NULL THEN
    NEW.due_at := public.compute_tool_due_at(NEW.tool_id, COALESCE(NEW.checkout_at, now()));
  END IF;
  RETURN NEW;
END;
$$;

-- AFTER INSERT/UPDATE on tool_loans: update tool status and insert events
CREATE OR REPLACE FUNCTION public.after_change_tool_loans()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Set tool as checked out
    UPDATE public.tools SET status = 'checked_out', updated_at = now() WHERE id = NEW.tool_id;
    -- Log checkout event
    INSERT INTO public.tool_events(user_id, tool_id, loan_id, event_type, actor_user_id, at, meta)
    VALUES (NEW.user_id, NEW.tool_id, NEW.id, 'checkout', NEW.issuer_user_id, NEW.checkout_at, jsonb_build_object('borrower_user_id', NEW.borrower_user_id));
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.returned_at IS NOT NULL AND (OLD.returned_at IS NULL OR NEW.returned_at <> OLD.returned_at) THEN
      -- Set tool as in stock
      UPDATE public.tools SET status = 'in_stock', updated_at = now() WHERE id = NEW.tool_id;
      -- Log return event
      INSERT INTO public.tool_events(user_id, tool_id, loan_id, event_type, actor_user_id, at, meta)
      VALUES (NEW.user_id, NEW.tool_id, NEW.id, 'return', NEW.issuer_user_id, NEW.returned_at, jsonb_build_object('borrower_user_id', NEW.borrower_user_id));
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

-- Attach triggers
DROP TRIGGER IF EXISTS trg_before_insert_tool_loans ON public.tool_loans;
CREATE TRIGGER trg_before_insert_tool_loans
BEFORE INSERT ON public.tool_loans
FOR EACH ROW
EXECUTE FUNCTION public.before_insert_tool_loans();

DROP TRIGGER IF EXISTS trg_after_change_tool_loans ON public.tool_loans;
CREATE TRIGGER trg_after_change_tool_loans
AFTER INSERT OR UPDATE ON public.tool_loans
FOR EACH ROW
EXECUTE FUNCTION public.after_change_tool_loans();

-- updated_at triggers
DROP TRIGGER IF EXISTS trg_tools_updated_at ON public.tools;
CREATE TRIGGER trg_tools_updated_at
BEFORE UPDATE ON public.tools
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_tool_loans_updated_at ON public.tool_loans;
CREATE TRIGGER trg_tool_loans_updated_at
BEFORE UPDATE ON public.tool_loans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER trg_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 5) View for movement tracking
DROP VIEW IF EXISTS public.v_tool_movement;
CREATE VIEW public.v_tool_movement AS
SELECT 
  te.user_id,
  te.tool_id,
  t.name AS tool_name,
  t.sku,
  t.serial_no,
  te.event_type::text AS event,
  te.at,
  tl.id AS loan_id,
  -- Holder resolution
  CASE te.event_type
    WHEN 'checkout' THEN 'Warehouse'
    WHEN 'return' THEN COALESCE(bp.full_name, bp.email, tl.borrower_user_id::text)
    WHEN 'transfer' THEN COALESCE((te.meta->>'from_borrower_name'), bp.full_name, bp.email, tl.borrower_user_id::text)
  END AS from_holder,
  CASE te.event_type
    WHEN 'checkout' THEN COALESCE(bp.full_name, bp.email, tl.borrower_user_id::text)
    WHEN 'return' THEN 'Warehouse'
    WHEN 'transfer' THEN COALESCE(tp.full_name, tp.email, (te.meta->>'to_borrower_user_id'))
  END AS to_holder,
  ip.full_name AS issuer_name,
  ap.full_name AS actor_name
FROM public.tool_events te
JOIN public.tools t ON t.id = te.tool_id
LEFT JOIN public.tool_loans tl ON tl.id = te.loan_id
LEFT JOIN public.profiles ap ON ap.id = te.actor_user_id
LEFT JOIN public.profiles ip ON ip.id = tl.issuer_user_id
LEFT JOIN public.profiles bp ON bp.id = tl.borrower_user_id
LEFT JOIN public.profiles tp ON tp.id = COALESCE(NULLIF(te.meta->>'to_borrower_user_id','')::uuid, tl.borrower_user_id)
ORDER BY te.at DESC;

-- 6) Indexes
CREATE INDEX IF NOT EXISTS idx_tools_user_status ON public.tools (user_id, status);
CREATE INDEX IF NOT EXISTS idx_tool_loans_tool_checkout ON public.tool_loans (tool_id, checkout_at);
CREATE INDEX IF NOT EXISTS idx_tool_loans_user_due ON public.tool_loans (user_id, due_at);
CREATE INDEX IF NOT EXISTS idx_tool_events_tool_at ON public.tool_events (tool_id, at);
CREATE INDEX IF NOT EXISTS idx_tool_events_user_at ON public.tool_events (user_id, at);

-- Optional default setting seed for notification time (no-op if existing)
INSERT INTO public.app_settings (user_id, key, value)
SELECT p.id, 'tools.notifications.time', '{"time": "17:00"}'::jsonb
FROM public.profiles p
ON CONFLICT (user_id, key) DO NOTHING;
