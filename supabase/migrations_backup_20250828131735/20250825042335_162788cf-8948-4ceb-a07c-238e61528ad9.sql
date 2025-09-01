-- First, let's add the missing roles to the app_role enum
-- Check current enum values and add missing ones

-- Add new security roles to the existing enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'auditor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'security_officer';

-- COMPREHENSIVE SECURITY VULNERABILITY FIXES (PART 1)
-- This migration addresses: AES-256 encryption, SECURITY DEFINER issues, audit trail, and more

-- 1. Create AES-256 encryption functions for sensitive data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a master encryption key function (uses environment-based key derivation)
CREATE OR REPLACE FUNCTION public.get_encryption_key()
RETURNS bytea
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from DEFINER to INVOKER for better security
SET search_path = public
AS $$
BEGIN
  -- Derive key from a combination of database identifier and a secret
  -- In production, this should use a proper key management system
  RETURN digest(
    concat(
      current_database(),
      '::',
      coalesce(current_setting('app.settings.encryption_seed', true), 'default-seed-change-in-production')
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
SET search_path = public
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
  
  -- Encrypt using AES-256
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
SET search_path = public
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