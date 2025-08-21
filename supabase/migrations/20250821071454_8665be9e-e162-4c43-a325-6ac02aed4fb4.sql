-- Security Audit Fix: Complete Remaining Function Security Updates

-- Update all remaining functions to have explicit search paths

-- Update log_profile_access function
CREATE OR REPLACE FUNCTION public.log_profile_access(_profile_id uuid, _access_type text DEFAULT 'SELECT'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Only log if accessed by someone other than the profile owner
    IF auth.uid() != _profile_id THEN
        INSERT INTO public.profile_access_log (accessed_profile_id, accessed_by, access_type)
        VALUES (_profile_id, auth.uid(), _access_type);
    END IF;
END;
$function$;

-- Update compute_tool_due_at function
CREATE OR REPLACE FUNCTION public.compute_tool_due_at(_tool_id uuid, _checkout_at timestamp with time zone)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Update before_insert_tool_loans function
CREATE OR REPLACE FUNCTION public.before_insert_tool_loans()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Update after_change_tool_loans function
CREATE OR REPLACE FUNCTION public.after_change_tool_loans()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Update log_rotable_action function
CREATE OR REPLACE FUNCTION public.log_rotable_action(_rotable_part_id uuid, _action_type text, _action_description text, _old_values jsonb DEFAULT NULL::jsonb, _new_values jsonb DEFAULT NULL::jsonb, _related_table text DEFAULT NULL::text, _related_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.rotable_audit_logs (
    user_id,
    rotable_part_id,
    action_type,
    action_description,
    performed_by,
    old_values,
    new_values,
    related_table,
    related_id
  ) VALUES (
    auth.uid(),
    _rotable_part_id,
    _action_type,
    _action_description,
    auth.uid(),
    _old_values,
    _new_values,
    _related_table,
    _related_id
  );
END;
$function$;

-- Update log_customer_access function
CREATE OR REPLACE FUNCTION public.log_customer_access()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_permissions text[];
BEGIN
  -- Get user's customer permissions
  SELECT array_agg(permission_type) INTO user_permissions
  FROM public.customer_permissions
  WHERE user_id = auth.uid() AND (expires_at IS NULL OR expires_at > now());

  -- Log customer data access for audit purposes
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.customer_access_log (user_id, customer_id, action, user_agent)
    VALUES (auth.uid(), NEW.id, TG_OP || ' - Permissions: ' || COALESCE(array_to_string(user_permissions, ','), 'admin'), 
            current_setting('request.headers', true)::json->>'user-agent');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.customer_access_log (user_id, customer_id, action, user_agent)
    VALUES (auth.uid(), NEW.id, TG_OP || ' - Permissions: ' || COALESCE(array_to_string(user_permissions, ','), 'admin'),
            current_setting('request.headers', true)::json->>'user-agent');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.customer_access_log (user_id, customer_id, action, user_agent)
    VALUES (auth.uid(), OLD.id, TG_OP || ' - Admin access',
            current_setting('request.headers', true)::json->>'user-agent');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Update remaining functions with search paths
CREATE OR REPLACE FUNCTION public.get_stock_on_hand(_user_id uuid, _product_id uuid, _as_of_date date DEFAULT CURRENT_DATE, _batch_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(product_id uuid, batch_id uuid, quantity_on_hand numeric, weighted_avg_cost numeric, total_value numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Create enhanced audit policies for rotable_audit_logs  
DROP POLICY IF EXISTS "System can insert audit logs" ON public.rotable_audit_logs;
DROP POLICY IF EXISTS "Audit logs cannot be modified" ON public.rotable_audit_logs;

CREATE POLICY "System can insert audit logs" 
ON public.rotable_audit_logs 
FOR INSERT 
WITH CHECK (auth.uid() = performed_by);

CREATE POLICY "Audit logs are immutable" 
ON public.rotable_audit_logs 
FOR UPDATE 
USING (false);

CREATE POLICY "Audit logs cannot be deleted" 
ON public.rotable_audit_logs 
FOR DELETE 
USING (false);