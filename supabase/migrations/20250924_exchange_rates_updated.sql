-- Updated exchange_rates table with exact schema requested
-- Drop existing table if it exists to recreate with new schema
DROP TABLE IF EXISTS exchange_rates CASCADE;

-- Create exchange_rates table with exact schema
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  base_currency TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  manual_override BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currency_pair 
ON exchange_rates (base_currency, target_currency);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_last_updated 
ON exchange_rates (last_updated);

-- Create unique constraint on currency pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_exchange_rates_unique_pair 
ON exchange_rates (base_currency, target_currency);

-- Insert initial exchange rates data
INSERT INTO exchange_rates (base_currency, target_currency, rate, last_updated, manual_override) VALUES
('USD', 'KES', 150.000000, NOW(), FALSE),
('EUR', 'KES', 165.000000, NOW(), FALSE),
('SCR', 'KES', 11.000000, NOW(), FALSE)
ON CONFLICT (base_currency, target_currency) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read exchange rates" ON exchange_rates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin users to insert exchange rates" ON exchange_rates
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Allow admin users to update exchange rates" ON exchange_rates
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Allow admin users to delete exchange rates" ON exchange_rates
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );
