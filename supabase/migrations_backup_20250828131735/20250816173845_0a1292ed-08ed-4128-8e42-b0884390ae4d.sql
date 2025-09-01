-- Add bio and sample_password columns to profiles table for demo purposes
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS sample_password text;

-- Create a separate table for sample user credentials that admins can view
CREATE TABLE IF NOT EXISTS public.sample_user_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  pin_code text NOT NULL,
  bio text,
  sample_password text NOT NULL,
  position text,
  staff_code text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on sample_user_credentials
ALTER TABLE public.sample_user_credentials ENABLE ROW LEVEL SECURITY;

-- Only admins can view sample credentials
CREATE POLICY "Only admins can view sample credentials"
ON public.sample_user_credentials
FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

-- Insert sample user credentials
INSERT INTO public.sample_user_credentials (
  email, 
  full_name, 
  pin_code, 
  bio, 
  sample_password,
  position,
  staff_code
) VALUES 
(
  'john.mechanic@example.com',
  'John Smith',
  '1234',
  'Senior Aircraft Mechanic with 15 years experience in commercial aviation. Specialized in engine maintenance and avionics systems.',
  'JohnMech123!',
  'Senior Mechanic',
  'MECH001'
),
(
  'sarah.supervisor@example.com', 
  'Sarah Johnson',
  '5678',
  'Maintenance Supervisor overseeing daily operations. Former Air Force technician with expertise in quality control and safety protocols.',
  'SarahSup456!',
  'Maintenance Supervisor',
  'SUP001'
),
(
  'mike.inspector@example.com',
  'Mike Chen',
  '9012',
  'Quality Assurance Inspector ensuring all maintenance meets regulatory standards. FAA certified with commercial and military aircraft experience.',
  'MikeInsp789!',
  'QA Inspector',
  'QA001'
),
(
  'lisa.parts@example.com',
  'Lisa Rodriguez',
  '3456',
  'Parts Coordinator managing inventory and procurement. Expert in aviation parts sourcing and vendor relations.',
  'LisaParts012!',
  'Parts Coordinator',
  'PARTS001'
),
(
  'alex.admin@example.com',
  'Alex Thompson',
  '7890',
  'System Administrator and IT Support. Manages all technical systems and provides user support for maintenance software.',
  'AlexAdmin345!',
  'System Administrator',
  'ADMIN001'
);

COMMENT ON TABLE public.sample_user_credentials IS 'Sample user credentials for demo purposes - visible to admins only';
COMMENT ON COLUMN public.sample_user_credentials.sample_password IS 'Demo passwords for sample users - DO NOT USE IN PRODUCTION';