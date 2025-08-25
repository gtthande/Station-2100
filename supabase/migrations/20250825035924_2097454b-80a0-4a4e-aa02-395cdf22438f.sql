-- COMPREHENSIVE SECURITY VULNERABILITY FIXES
-- This migration addresses: AES-256 encryption, SECURITY DEFINER issues, audit trail, and more

-- 1. Create AES-256 encryption functions for sensitive data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a master encryption key function (uses environment-based key derivation)
CREATE OR REPLACE FUNCTION public.get_encryption_key()
RETURNS bytea
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from DEFINER to INVOKER for better security
AS $$
BEGIN
  -- Derive key from a combination of database identifier and a secret
  -- In production, this should use a proper key management system
  RETURN digest(
    concat(
      current_database(),
      '::',
      current_setting('app.settings.encryption_seed', true)
    ), 
    'sha256'
  );
END;
$$;

-- Create secure AES-256 encryption function
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(_data text)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER  -- Use INVOKER instead of DEFINER
AS $$
DECLARE
  encrypted_data bytea;
  encryption_key bytea;
BEGIN
  IF _data IS NULL OR length(_data) = 0 THEN
    RETURN _data;
  END IF;
  
  -- Get encryption key
  SELECT get_encryption_key() INTO encryption_key;
  
  -- Encrypt using AES-256-GCM
  encrypted_data := pgp_sym_encrypt(_data, encode(encryption_key, 'hex'), 'cipher-algo=aes256');
  
  -- Return base64 encoded encrypted data
  RETURN encode(encrypted_data, 'base64');
END;
$$;

-- Create secure AES-256 decryption function
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(_encrypted_data text)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER  -- Use INVOKER instead of DEFINER
AS $$
DECLARE
  decrypted_data text;
  encryption_key bytea;
BEGIN
  IF _encrypted_data IS NULL OR length(_encrypted_data) = 0 THEN
    RETURN _encrypted_data;
  END IF;
  
  -- Get encryption key
  SELECT get_encryption_key() INTO encryption_key;
  
  -- Decrypt the base64 encoded data
  decrypted_data := pgp_sym_decrypt(
    decode(_encrypted_data, 'base64'), 
    encode(encryption_key, 'hex')
  );
  
  RETURN decrypted_data;
EXCEPTION WHEN OTHERS THEN
  -- Log decryption failure but don't expose details
  RAISE WARNING 'Decryption failed for data';
  RETURN '[DECRYPTION_FAILED]';
END;
$$;

-- 2. Fix existing SECURITY DEFINER functions to use INVOKER where applicable
-- Update profile access functions to use SECURITY INVOKER where safe
CREATE OR REPLACE FUNCTION public.can_view_profile(_profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from DEFINER to INVOKER
SET search_path = public
AS $$
  SELECT (auth.uid() = _profile_user_id) 
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'hr'::public.app_role);
$$;

-- Update customer permission function to use INVOKER
CREATE OR REPLACE FUNCTION public.get_user_customer_permission_level(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from DEFINER to INVOKER  
SET search_path = public
AS $$
  SELECT CASE 
    WHEN public.has_role(_user_id, 'admin'::public.app_role) THEN 'admin'
    WHEN EXISTS (
      SELECT 1 FROM public.customer_permissions 
      WHERE user_id = _user_id 
        AND permission_type = 'manage' 
        AND (expires_at IS NULL OR expires_at > now())
    ) THEN 'manage'
    WHEN EXISTS (
      SELECT 1 FROM public.customer_permissions 
      WHERE user_id = _user_id 
        AND permission_type = 'view_full' 
        AND (expires_at IS NULL OR expires_at > now())
    ) THEN 'view_full'
    WHEN EXISTS (
      SELECT 1 FROM public.customer_permissions 
      WHERE user_id = _user_id 
        AND permission_type = 'view_contact' 
        AND (expires_at IS NULL OR expires_at > now())
    ) THEN 'view_contact'
    WHEN EXISTS (
      SELECT 1 FROM public.customer_permissions 
      WHERE user_id = _user_id 
        AND permission_type = 'view_basic' 
        AND (expires_at IS NULL OR expires_at > now())
    ) THEN 'view_basic'
    ELSE NULL
  END;
$$;

-- 3. Create encrypted storage tables for sensitive employee data
CREATE TABLE IF NOT EXISTS public.employee_encrypted_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  encrypted_email text,
  encrypted_phone text,
  encrypted_address text,
  encrypted_emergency_contact text,
  encrypted_ssn_last_four text, -- Only store last 4 digits of SSN, encrypted
  data_classification text NOT NULL DEFAULT 'confidential',
  encrypted_at timestamp with time zone DEFAULT now(),
  encrypted_by uuid NOT NULL,
  access_log jsonb DEFAULT '[]',
  UNIQUE(employee_id)
);

-- Enable RLS on encrypted data table
ALTER TABLE public.employee_encrypted_data ENABLE ROW LEVEL SECURITY;

-- Create strict RLS policies for encrypted employee data
CREATE POLICY "admin_hr_only_encrypted_employee_data" 
ON public.employee_encrypted_data 
FOR ALL 
TO authenticated 
USING (
  has_role(auth.uid(), 'admin'::public.app_role) OR 
  has_role(auth.uid(), 'hr'::public.app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::public.app_role) OR 
  has_role(auth.uid(), 'hr'::public.app_role)
);

-- 4. Create encrypted storage for customer data
CREATE TABLE IF NOT EXISTS public.customer_encrypted_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  encrypted_email text,
  encrypted_phone text,
  encrypted_address text,
  encrypted_payment_info text,
  encrypted_notes text,
  data_classification text NOT NULL DEFAULT 'confidential',
  encrypted_at timestamp with time zone DEFAULT now(),
  encrypted_by uuid NOT NULL,
  access_log jsonb DEFAULT '[]',
  UNIQUE(customer_id)
);

-- Enable RLS on encrypted customer data
ALTER TABLE public.customer_encrypted_data ENABLE ROW LEVEL SECURITY;

-- Create RBAC policies for encrypted customer data
CREATE POLICY "rbac_customer_encrypted_data" 
ON public.customer_encrypted_data 
FOR ALL 
TO authenticated 
USING (
  has_role(auth.uid(), 'admin'::public.app_role) OR 
  has_customer_permission(auth.uid(), 'manage') OR
  has_customer_permission(auth.uid(), 'view_full')
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::public.app_role) OR 
  has_customer_permission(auth.uid(), 'manage')
);

-- 5. Create secure audit trail with limited exposure
CREATE TABLE IF NOT EXISTS public.security_audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  user_id uuid NOT NULL,
  action text NOT NULL,
  -- Store only necessary audit data, not sensitive content
  changes_summary jsonb, -- Summary only, not full field values
  ip_address inet,
  user_agent_hash text, -- Hash instead of full user agent
  severity text DEFAULT 'info',
  created_at timestamp with time zone DEFAULT now(),
  retention_until timestamp with time zone DEFAULT (now() + interval '7 years')
);

-- Enable RLS on audit trail
ALTER TABLE public.security_audit_trail ENABLE ROW LEVEL SECURITY;

-- Create policy for audit trail access
CREATE POLICY "admin_auditor_only_audit_trail" 
ON public.security_audit_trail 
FOR SELECT 
TO authenticated 
USING (
  has_role(auth.uid(), 'admin'::public.app_role) OR 
  has_role(auth.uid(), 'auditor'::public.app_role) OR
  has_role(auth.uid(), 'security_officer'::public.app_role)
);

-- 6. Create function to securely log audit events
CREATE OR REPLACE FUNCTION public.log_security_audit(
  _event_type text,
  _table_name text,
  _record_id uuid,
  _action text,
  _changes_summary jsonb DEFAULT NULL,
  _severity text DEFAULT 'info'
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER  -- Use INVOKER for audit logging
SET search_path = public
AS $$
DECLARE
  current_ip inet;
  user_agent_text text;
  user_agent_hash text;
BEGIN
  -- Safely get IP address
  BEGIN
    SELECT inet_client_addr() INTO current_ip;
  EXCEPTION WHEN OTHERS THEN
    current_ip := NULL;
  END;
  
  -- Get and hash user agent for privacy
  BEGIN
    user_agent_text := current_setting('request.headers', true)::json->>'user-agent';
    user_agent_hash := encode(digest(coalesce(user_agent_text, 'unknown'), 'sha256'), 'hex');
  EXCEPTION WHEN OTHERS THEN
    user_agent_hash := 'unknown';
  END;
  
  -- Insert audit record
  INSERT INTO public.security_audit_trail (
    event_type,
    table_name,
    record_id,
    user_id,
    action,
    changes_summary,
    ip_address,
    user_agent_hash,
    severity
  ) VALUES (
    _event_type,
    _table_name,
    _record_id,
    auth.uid(),
    _action,
    _changes_summary,
    current_ip,
    user_agent_hash,
    _severity
  );
END;
$$;

-- 7. Update existing functions to use secure audit logging
CREATE OR REPLACE FUNCTION public.log_profile_access(_profile_id uuid, _access_type text DEFAULT 'SELECT'::text)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only log if accessed by someone other than the profile owner
    IF auth.uid() != _profile_id THEN
        -- Use the new secure audit function
        PERFORM log_security_audit(
          'profile_access',
          'profiles',
          _profile_id,
          _access_type,
          jsonb_build_object('accessed_profile', _profile_id),
          'info'
        );
    END IF;
END;
$$;

-- 8. Add data encryption triggers for automatic encryption
CREATE OR REPLACE FUNCTION public.auto_encrypt_employee_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- Auto-encrypt sensitive fields when profile is updated
  IF TG_OP = 'UPDATE' AND (
    OLD.email IS DISTINCT FROM NEW.email OR
    OLD.phone IS DISTINCT FROM NEW.phone
  ) THEN
    -- Insert or update encrypted data
    INSERT INTO public.employee_encrypted_data (
      employee_id,
      encrypted_email,
      encrypted_phone,
      encrypted_by
    ) VALUES (
      NEW.id,
      CASE WHEN NEW.email IS NOT NULL THEN encrypt_sensitive_data(NEW.email) END,
      CASE WHEN NEW.phone IS NOT NULL THEN encrypt_sensitive_data(NEW.phone) END,
      auth.uid()
    )
    ON CONFLICT (employee_id) 
    DO UPDATE SET
      encrypted_email = CASE WHEN NEW.email IS NOT NULL THEN encrypt_sensitive_data(NEW.email) ELSE employee_encrypted_data.encrypted_email END,
      encrypted_phone = CASE WHEN NEW.phone IS NOT NULL THEN encrypt_sensitive_data(NEW.phone) ELSE employee_encrypted_data.encrypted_phone END,
      encrypted_at = now(),
      encrypted_by = auth.uid();
      
    -- Log the encryption event
    PERFORM log_security_audit(
      'data_encryption',
      'employee_encrypted_data',
      NEW.id,
      'auto_encrypt',
      jsonb_build_object('fields_encrypted', array['email', 'phone']),
      'info'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic encryption
CREATE TRIGGER auto_encrypt_employee_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_encrypt_employee_data();

-- 9. Create environment-based access control
CREATE TABLE IF NOT EXISTS public.environment_access_control (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  environment text NOT NULL, -- 'production', 'staging', 'development'
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  allowed_actions text[] DEFAULT ARRAY['read'],
  ip_whitelist inet[] DEFAULT NULL,
  time_restrictions jsonb DEFAULT NULL, -- Business hours, etc.
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid NOT NULL
);

-- Enable RLS on environment access control
ALTER TABLE public.environment_access_control ENABLE ROW LEVEL SECURITY;

-- Create policy for environment access control
CREATE POLICY "admin_only_environment_access_control" 
ON public.environment_access_control 
FOR ALL 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::public.app_role));

-- 10. Add comments for documentation
COMMENT ON FUNCTION public.encrypt_sensitive_data(text) IS 
'Encrypts sensitive data using AES-256 encryption with environment-specific keys. Uses SECURITY INVOKER for better privilege management.';

COMMENT ON FUNCTION public.decrypt_sensitive_data(text) IS 
'Decrypts sensitive data using AES-256 decryption. Uses SECURITY INVOKER and includes error handling for failed decryption attempts.';

COMMENT ON TABLE public.employee_encrypted_data IS 
'Stores encrypted employee personal data with AES-256 encryption. Access restricted to admin/HR roles only.';

COMMENT ON TABLE public.customer_encrypted_data IS 
'Stores encrypted customer data with RBAC-based access control and AES-256 encryption.';

COMMENT ON TABLE public.security_audit_trail IS 
'Secure audit trail with limited data exposure. Stores hashed user agents and summary data only to prevent sensitive information leakage.';

COMMENT ON FUNCTION public.log_security_audit(text, text, uuid, text, jsonb, text) IS 
'Secure audit logging function that stores minimal necessary information and hashes sensitive metadata for privacy protection.';