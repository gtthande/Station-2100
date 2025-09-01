
-- Add supplier invoice number and entry tracking to inventory_batches table
ALTER TABLE public.inventory_batches 
ADD COLUMN supplier_invoice_number TEXT,
ADD COLUMN entered_by UUID REFERENCES auth.users(id);

-- Update existing batches to set entered_by to user_id for data consistency
UPDATE public.inventory_batches 
SET entered_by = user_id 
WHERE entered_by IS NULL;
