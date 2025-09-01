-- Reset opening balances and seed stock movements to reflect opening + batches
-- Opening balance date: 2025-01-01 (products at zero)
-- Batch receipt date:   2025-01-10 (carry batch quantities)

BEGIN;

-- 0) Ensure no orphan batches exist (defensive cleanup in case legacy data bypassed FKs)
DELETE FROM public.inventory_batches b
WHERE b.product_id IS NULL
   OR NOT EXISTS (
     SELECT 1 FROM public.inventory_products p WHERE p.id = b.product_id
   );

-- 1) Normalize opening balance fields on products
UPDATE public.inventory_products
SET 
  open_balance = 0,
  open_bal_date = DATE '2025-01-01'
WHERE TRUE;

-- 2) Remove previously generated initialization movements to avoid duplicates
--    Identify by source_ref prefixes we control
DELETE FROM public.stock_movements
WHERE source_ref LIKE 'INIT_OPEN_BAL_%'
   OR source_ref LIKE 'INIT_BATCH_RECEIPT_%';

-- 3) Insert OPEN_BALANCE movement per product at zero (explicit for auditable baseline)
INSERT INTO public.stock_movements (
  user_id,
  movement_date,
  product_id,
  batch_id,
  event_type,
  quantity,
  unit_cost,
  source_ref,
  department_id,
  notes,
  created_by
)
SELECT 
  p.user_id,
  DATE '2025-01-01' AS movement_date,
  p.id AS product_id,
  NULL AS batch_id,
  'OPEN_BALANCE'::public.stock_movement_event AS event_type,
  0::numeric AS quantity,
  COALESCE(p.unit_cost, 0) AS unit_cost,
  'INIT_OPEN_BAL_' || p.id::text AS source_ref,
  NULL::uuid AS department_id,
  'Opening balance normalized to zero as of 2025-01-01' AS notes,
  p.user_id AS created_by
FROM public.inventory_products p;

-- 4) For every active batch, ensure there is a parent product (via FK) and insert a BATCH_RECEIPT movement
--    This reflects stock on hand coming from batches on the same opening date
INSERT INTO public.stock_movements (
  user_id,
  movement_date,
  product_id,
  batch_id,
  event_type,
  quantity,
  unit_cost,
  source_ref,
  department_id,
  notes,
  created_by
)
SELECT 
  b.user_id,
  DATE '2025-01-10' AS movement_date,
  b.product_id,
  b.id AS batch_id,
  'BATCH_RECEIPT'::public.stock_movement_event AS event_type,
  COALESCE(b.quantity, 0)::numeric AS quantity,
  COALESCE(b.cost_per_unit, 0) AS unit_cost,
  'INIT_BATCH_RECEIPT_' || b.id::text AS source_ref,
  NULL::uuid AS department_id,
  'Opening position: batch quantity carried as of 2025-01-10' AS notes,
  b.user_id AS created_by
FROM public.inventory_batches b
JOIN public.inventory_products p ON p.id = b.product_id
WHERE COALESCE(b.status, 'active') = 'active';

COMMIT;


