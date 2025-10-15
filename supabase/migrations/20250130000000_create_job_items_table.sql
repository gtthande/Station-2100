-- Create job_items table if it doesn't exist
-- This table stores individual parts/items for job cards

-- Create enum for item category if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.item_category AS ENUM ('spare', 'consumable', 'owner_supplied');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create job_items table
CREATE TABLE IF NOT EXISTS public.job_items (
    item_id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    job_id BIGINT NOT NULL,
    batch_no BIGINT,
    stock_card_no VARCHAR(64),
    item_date DATE,
    description TEXT,
    warehouse VARCHAR(64),
    qty INTEGER NOT NULL DEFAULT 1,
    uom VARCHAR(16),
    fitting_price DECIMAL(14,2) DEFAULT 0,
    unit_cost DECIMAL(14,2) DEFAULT 0,
    total_cost DECIMAL(14,2) GENERATED ALWAYS AS (unit_cost * qty) STORED,
    category item_category DEFAULT 'spare',
    verified_by VARCHAR(64),
    received_by VARCHAR(64),
    received_by_staff_id UUID,
    issued_by_code VARCHAR(32),
    issued_by_staff_id UUID,
    received_at TIMESTAMP WITH TIME ZONE,
    issued_at TIMESTAMP WITH TIME ZONE,
    prepaid BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_items_job_id ON public.job_items(job_id);
CREATE INDEX IF NOT EXISTS idx_job_items_user_id ON public.job_items(user_id);
CREATE INDEX IF NOT EXISTS idx_job_items_stock_card_no ON public.job_items(stock_card_no);
CREATE INDEX IF NOT EXISTS idx_job_items_category ON public.job_items(category);

-- Enable Row Level Security
ALTER TABLE public.job_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for job_items
-- Users can only access their own job items
CREATE POLICY "Users can view their own job items" 
  ON public.job_items 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own job items" 
  ON public.job_items 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job items" 
  ON public.job_items 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job items" 
  ON public.job_items 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_job_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_job_items_updated_at
  BEFORE UPDATE ON public.job_items
  FOR EACH ROW
  EXECUTE FUNCTION update_job_items_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.job_items IS 'Stores individual parts/items for job cards';
COMMENT ON COLUMN public.job_items.item_id IS 'Unique identifier for the job item';
COMMENT ON COLUMN public.job_items.job_id IS 'Reference to the job card';
COMMENT ON COLUMN public.job_items.stock_card_no IS 'Part number or stock card number';
COMMENT ON COLUMN public.job_items.description IS 'Description of the part';
COMMENT ON COLUMN public.job_items.qty IS 'Quantity of the part';
COMMENT ON COLUMN public.job_items.unit_cost IS 'Cost per unit';
COMMENT ON COLUMN public.job_items.fitting_price IS 'Fitting price per unit';
COMMENT ON COLUMN public.job_items.category IS 'Category: spare, consumable, or owner_supplied';

