-- 🔒 SECURITY FIX: Add HR role and audit logging (Part 2)

-- Add HR role to the enum type
DO $$
BEGIN
    BEGIN
        ALTER TYPE public.app_role ADD VALUE 'hr';
    EXCEPTION WHEN duplicate_object THEN
        -- Role already exists, continue
    END;
END
$$;