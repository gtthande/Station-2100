-- Create Company table for managing company details
CREATE TABLE public.company (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT, -- public URL of uploaded logo
  tax_id TEXT, -- e.g. VAT number or Business Registration number
  zip_code TEXT, -- reserved for future use
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.company ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for company management
-- Only admins can manage company details
CREATE POLICY "Admins can view company details" 
  ON public.company 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert company details" 
  ON public.company 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update company details" 
  ON public.company 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete company details" 
  ON public.company 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_company_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_company_updated_at
  BEFORE UPDATE ON public.company
  FOR EACH ROW
  EXECUTE FUNCTION update_company_updated_at();

-- Insert default company record (can be updated later)
INSERT INTO public.company (name, address, city, country, phone, email, website, tax_id)
VALUES (
  'Station-2100 Aviation Management',
  '123 Aviation Way',
  'Aviation City',
  'United States',
  '+1-555-0123',
  'info@station2100.com',
  'https://station2100.com',
  'TAX-123456789'
);
