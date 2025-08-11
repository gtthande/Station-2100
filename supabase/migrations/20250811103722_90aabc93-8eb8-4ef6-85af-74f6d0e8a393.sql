-- Add requested performance indexes for stock_movements
-- Note: No CONCURRENTLY due to transactional migrations
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_date
  ON public.stock_movements (product_id, movement_date);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product_batch_date
  ON public.stock_movements (product_id, batch_id, movement_date);
