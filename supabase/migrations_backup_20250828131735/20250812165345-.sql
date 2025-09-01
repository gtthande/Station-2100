-- Restrict profiles exposure: remove public SELECT, allow self and admins
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- Users can view only their own profile
DO $$ BEGIN
  CREATE POLICY IF NOT EXISTS "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admins can view all profiles
DO $$ BEGIN
  CREATE POLICY IF NOT EXISTS "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;