-- Remove sensitive credential fields from sample_user_credentials table
-- and add security-focused fields instead

-- First, let's add new columns for secure credential management
ALTER TABLE public.sample_user_credentials 
DROP COLUMN IF EXISTS sample_password,
DROP COLUMN IF EXISTS pin_code;

-- Add secure credential metadata instead
ALTER TABLE public.sample_user_credentials 
ADD COLUMN credential_type TEXT DEFAULT 'demo_user',
ADD COLUMN access_level TEXT DEFAULT 'basic',
ADD COLUMN last_credential_reset TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN requires_secure_login BOOLEAN DEFAULT true;

-- Add a comment explaining the security approach
COMMENT ON TABLE public.sample_user_credentials IS 'Sample user profiles for demonstration purposes. No actual credentials are stored - secure authentication is handled separately.';

-- Create a function to generate secure demo credentials when needed
CREATE OR REPLACE FUNCTION public.generate_demo_credentials(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  demo_data JSONB;
BEGIN
  -- Only admins can generate demo credentials
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can generate demo credentials';
  END IF;
  
  -- Return secure demo data that doesn't expose real credentials
  demo_data := jsonb_build_object(
    'demo_username', CONCAT('demo_user_', EXTRACT(epoch FROM now())::bigint),
    'credential_hint', 'Contact administrator for secure access',
    'access_type', 'demonstration_only',
    'security_note', 'Real credentials are managed through secure authentication system'
  );
  
  RETURN demo_data;
END;
$$;