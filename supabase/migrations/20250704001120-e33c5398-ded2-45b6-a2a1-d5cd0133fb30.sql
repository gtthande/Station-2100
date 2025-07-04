
-- Find the user ID for gtthande@gmail.com and assign admin role
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Get the user ID from the profiles table
    SELECT id INTO target_user_id 
    FROM public.profiles 
    WHERE email = 'gtthande@gmail.com';
    
    -- If user exists, insert admin role (ignore if already exists)
    IF target_user_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (target_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Admin role assigned to user: %', target_user_id;
    ELSE
        RAISE NOTICE 'User with email gtthande@gmail.com not found in profiles table';
    END IF;
END $$;
