-- Add sample users with bios and 4-digit PINs
-- First, let's ensure we have proper PIN storage in profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS sample_password text;

-- Update the profiles table to store sample passwords for demo purposes
-- Note: In production, passwords should NEVER be stored in plain text

-- Insert sample users (these will be created when actual auth users are created)
-- We'll insert profiles that can be linked when users sign up

-- Sample data for demonstration
INSERT INTO public.profiles (
  id, 
  email, 
  full_name, 
  pin_code, 
  bio, 
  sample_password,
  is_staff,
  position,
  staff_code,
  department_id
) VALUES 
-- Generate UUIDs for sample users (these would be real auth.users IDs in practice)
(
  gen_random_uuid(),
  'john.mechanic@example.com',
  'John Smith',
  '1234',
  'Senior Aircraft Mechanic with 15 years experience in commercial aviation. Specialized in engine maintenance and avionics systems.',
  'JohnMech123!',
  true,
  'Senior Mechanic',
  'MECH001',
  NULL
),
(
  gen_random_uuid(),
  'sarah.supervisor@example.com', 
  'Sarah Johnson',
  '5678',
  'Maintenance Supervisor overseeing daily operations. Former Air Force technician with expertise in quality control and safety protocols.',
  'SarahSup456!',
  true,
  'Maintenance Supervisor',
  'SUP001',
  NULL
),
(
  gen_random_uuid(),
  'mike.inspector@example.com',
  'Mike Chen',
  '9012',
  'Quality Assurance Inspector ensuring all maintenance meets regulatory standards. FAA certified with commercial and military aircraft experience.',
  'MikeInsp789!',
  true,
  'QA Inspector',
  'QA001',
  NULL
),
(
  gen_random_uuid(),
  'lisa.parts@example.com',
  'Lisa Rodriguez',
  '3456',
  'Parts Coordinator managing inventory and procurement. Expert in aviation parts sourcing and vendor relations.',
  'LisaParts012!',
  true,
  'Parts Coordinator',
  'PARTS001',
  NULL
),
(
  gen_random_uuid(),
  'alex.admin@example.com',
  'Alex Thompson',
  '7890',
  'System Administrator and IT Support. Manages all technical systems and provides user support for maintenance software.',
  'AlexAdmin345!',
  true,
  'System Administrator',
  'ADMIN001',
  NULL
);

COMMENT ON COLUMN public.profiles.sample_password IS 'Demo passwords for sample users - DO NOT USE IN PRODUCTION';