-- Create exchange_rates table for Station-2100
-- This table stores currency exchange rates with support for both API and manual rates

CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency TEXT NOT NULL,
    target_currency TEXT NOT NULL,
    rate NUMERIC(15,6) NOT NULL,
    source TEXT NOT NULL DEFAULT 'api',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique currency pairs
    UNIQUE(base_currency, target_currency)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currency_pair 
ON exchange_rates(base_currency, target_currency);

-- Create index for source filtering
CREATE INDEX IF NOT EXISTS idx_exchange_rates_source 
ON exchange_rates(source);

-- Create index for updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_exchange_rates_updated_at 
ON exchange_rates(updated_at DESC);

-- Insert initial exchange rates (placeholder values)
INSERT INTO exchange_rates (base_currency, target_currency, rate, source) VALUES
('USD', 'KES', 150.00, 'api'),
('EUR', 'KES', 165.00, 'api'),
('SCR', 'KES', 11.00, 'api')
ON CONFLICT (base_currency, target_currency) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Create policies for exchange_rates
-- Allow authenticated users to read exchange rates
CREATE POLICY "Allow authenticated users to read exchange rates" ON exchange_rates
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admin users to insert exchange rates
CREATE POLICY "Allow admin users to insert exchange rates" ON exchange_rates
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Allow admin users to update exchange rates
CREATE POLICY "Allow admin users to update exchange rates" ON exchange_rates
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Allow admin users to delete exchange rates
CREATE POLICY "Allow admin users to delete exchange rates" ON exchange_rates
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_exchange_rates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_exchange_rates_updated_at
    BEFORE UPDATE ON exchange_rates
    FOR EACH ROW
    EXECUTE FUNCTION update_exchange_rates_updated_at();

-- Add comments for documentation
COMMENT ON TABLE exchange_rates IS 'Stores currency exchange rates with support for both API and manual rates';
COMMENT ON COLUMN exchange_rates.base_currency IS 'Base currency code (e.g., USD, EUR, SCR)';
COMMENT ON COLUMN exchange_rates.target_currency IS 'Target currency code (e.g., KES)';
COMMENT ON COLUMN exchange_rates.rate IS 'Exchange rate from base to target currency';
COMMENT ON COLUMN exchange_rates.source IS 'Source of the rate: api, manual, or system';
COMMENT ON COLUMN exchange_rates.updated_at IS 'Timestamp when the rate was last updated';

