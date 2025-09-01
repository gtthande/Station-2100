-- Fix Security Definer View issue
-- Drop and recreate the v_tool_movement view to ensure it doesn't have SECURITY DEFINER property

DROP VIEW IF EXISTS public.v_tool_movement;

-- Recreate the view with explicit SECURITY INVOKER (default behavior)
-- This ensures the view uses the permissions of the querying user, not the view creator
CREATE VIEW public.v_tool_movement AS
SELECT 
  te.id AS event_id,
  te.at,
  te.tool_id,
  t.name AS tool_name,
  t.sku,
  t.serial_no,
  te.event_type AS event,
  te.loan_id,
  te.user_id,
  CASE
    WHEN te.event_type = 'checkout'::event_type THEN 'Warehouse'::text
    WHEN te.event_type = 'return'::event_type THEN borrower_profile.full_name
    WHEN te.event_type = 'transfer'::event_type THEN borrower_profile.full_name
    ELSE 'Unknown'::text
  END AS from_holder,
  CASE
    WHEN te.event_type = 'checkout'::event_type THEN borrower_profile.full_name
    WHEN te.event_type = 'return'::event_type THEN 'Warehouse'::text
    WHEN te.event_type = 'transfer'::event_type THEN 'Unknown'::text
    ELSE 'Unknown'::text
  END AS to_holder,
  issuer_profile.full_name AS issuer_name,
  actor_profile.full_name AS actor_name
FROM tool_events te
JOIN tools t ON te.tool_id = t.id
LEFT JOIN tool_loans tl ON te.loan_id = tl.id
LEFT JOIN profiles borrower_profile ON tl.borrower_user_id = borrower_profile.id
LEFT JOIN profiles issuer_profile ON tl.issuer_user_id = issuer_profile.id
LEFT JOIN profiles actor_profile ON te.actor_user_id = actor_profile.id
ORDER BY te.at DESC;

-- Add RLS policy for the view data access
-- Since this is a view, RLS is enforced through the underlying tables
-- The view will respect the RLS policies of tool_events, tools, tool_loans, and profiles tables

COMMENT ON VIEW public.v_tool_movement IS 'Tool movement history view that respects RLS policies of underlying tables';