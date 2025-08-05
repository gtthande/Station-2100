-- Fix any tables that may have been created with wrong UUID function
-- Ensure all tables use the correct gen_random_uuid() function

-- Update custom_roles table if it exists with wrong default
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'custom_roles') THEN
    ALTER TABLE custom_roles ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Update user_custom_roles table if it exists with wrong default  
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_custom_roles') THEN
    ALTER TABLE user_custom_roles ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Create custom_roles table with correct UUID function if it doesn't exist
CREATE TABLE IF NOT EXISTS public.custom_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role_name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_custom_roles table with correct UUID function if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_custom_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  custom_role_id UUID NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, custom_role_id)
);

-- Enable RLS on custom_roles
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_custom_roles  
ALTER TABLE public.user_custom_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view their own custom roles" ON public.custom_roles;
DROP POLICY IF EXISTS "Users can create their own custom roles" ON public.custom_roles;
DROP POLICY IF EXISTS "Users can update their own custom roles" ON public.custom_roles;
DROP POLICY IF EXISTS "Users can delete their own custom roles" ON public.custom_roles;

DROP POLICY IF EXISTS "Users can view their own custom role assignments" ON public.user_custom_roles;
DROP POLICY IF EXISTS "Users can assign custom roles to themselves" ON public.user_custom_roles;
DROP POLICY IF EXISTS "Users can update their own custom role assignments" ON public.user_custom_roles;
DROP POLICY IF EXISTS "Users can delete their own custom role assignments" ON public.user_custom_roles;

-- Create RLS policies for custom_roles
CREATE POLICY "Users can view their own custom roles" 
ON public.custom_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom roles" 
ON public.custom_roles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom roles" 
ON public.custom_roles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom roles" 
ON public.custom_roles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for user_custom_roles
CREATE POLICY "Users can view their own custom role assignments" 
ON public.user_custom_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can assign custom roles to themselves" 
ON public.user_custom_roles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom role assignments" 
ON public.user_custom_roles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom role assignments" 
ON public.user_custom_roles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create update triggers
DROP TRIGGER IF EXISTS update_custom_roles_updated_at ON public.custom_roles;
DROP TRIGGER IF EXISTS update_user_custom_roles_updated_at ON public.user_custom_roles;

CREATE TRIGGER update_custom_roles_updated_at
  BEFORE UPDATE ON public.custom_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_custom_roles_updated_at
  BEFORE UPDATE ON public.user_custom_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();