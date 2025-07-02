
-- Update the app_role enum to include supervisor role
ALTER TYPE public.app_role ADD VALUE 'supervisor';

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventory_batches_updated_at BEFORE UPDATE
    ON public.inventory_batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update RLS policies to include supervisor role
DROP POLICY IF EXISTS "Users can create batches" ON public.inventory_batches;
DROP POLICY IF EXISTS "Role-based batch updates" ON public.inventory_batches;

-- Updated policies with supervisor role
CREATE POLICY "Users can create batches"
  ON public.inventory_batches
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND (
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'supervisor') OR
      public.has_role(auth.uid(), 'batch_manager')
    )
  );

CREATE POLICY "Role-based batch updates"
  ON public.inventory_batches
  FOR UPDATE
  USING (
    auth.uid() = user_id AND (
      public.has_role(auth.uid(), 'admin') OR
      (public.has_role(auth.uid(), 'supervisor') AND approval_status = 'pending') OR
      (public.has_role(auth.uid(), 'parts_approver') AND approval_status = 'pending') OR
      (public.has_role(auth.uid(), 'job_allocator') AND approval_status = 'approved') OR
      public.has_role(auth.uid(), 'batch_manager')
    )
  );

-- Create a view for unapproved batches (reminders report)
CREATE VIEW public.unapproved_batches_report AS
SELECT 
  ib.id,
  ib.batch_number,
  ib.quantity,
  ib.created_at,
  ib.received_date,
  ip.name as product_name,
  ip.part_number,
  s.name as supplier_name,
  p.full_name as submitted_by,
  p.email as submitter_email,
  EXTRACT(DAY FROM (CURRENT_TIMESTAMP - ib.created_at)) as days_pending
FROM public.inventory_batches ib
JOIN public.inventory_products ip ON ib.product_id = ip.id
LEFT JOIN public.suppliers s ON ib.supplier_id = s.id
LEFT JOIN public.profiles p ON ib.user_id = p.id
WHERE ib.approval_status = 'pending'
ORDER BY ib.created_at ASC;

-- Update inventory_summary view to only include approved batches for stock calculation
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
  -- Only count approved batches as available stock
  COALESCE(SUM(CASE WHEN b.status = 'active' AND b.approval_status = 'approved' THEN b.quantity ELSE 0 END), 0) as total_quantity,
  -- Total batches (all statuses)
  COUNT(b.id) as batch_count,
  -- Pending approval batches
  COALESCE(SUM(CASE WHEN b.approval_status = 'pending' THEN b.quantity ELSE 0 END), 0) as pending_quantity,
  p.created_at,
  p.updated_at
FROM public.inventory_products p
LEFT JOIN public.inventory_batches b ON p.id = b.product_id
GROUP BY p.id, p.user_id, p.part_number, p.name, p.description, p.category, 
         p.manufacturer, p.unit_of_measure, p.minimum_stock, p.reorder_point, 
         p.unit_cost, p.created_at, p.updated_at;
