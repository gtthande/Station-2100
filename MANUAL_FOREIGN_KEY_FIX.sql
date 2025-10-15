-- Manual SQL to fix foreign key constraints for job_items table
-- Run this in the Supabase SQL Editor

-- First, check if constraints already exist
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='job_items';

-- Add foreign key constraint for job_id -> job_cards(jobcardid)
-- (Only if it doesn't already exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_job_items_job_id' 
        AND table_name = 'job_items'
    ) THEN
        ALTER TABLE public.job_items 
        ADD CONSTRAINT fk_job_items_job_id 
        FOREIGN KEY (job_id) REFERENCES public.job_cards(jobcardid) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraint for user_id -> profiles(id)
-- (Only if it doesn't already exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_job_items_user_id' 
        AND table_name = 'job_items'
    ) THEN
        ALTER TABLE public.job_items 
        ADD CONSTRAINT fk_job_items_user_id 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraint for received_by_staff_id -> profiles(id)
-- (Only if it doesn't already exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_job_items_received_by_staff_id' 
        AND table_name = 'job_items'
    ) THEN
        ALTER TABLE public.job_items 
        ADD CONSTRAINT fk_job_items_received_by_staff_id 
        FOREIGN KEY (received_by_staff_id) REFERENCES public.profiles(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Add foreign key constraint for issued_by_staff_id -> profiles(id)
-- (Only if it doesn't already exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_job_items_issued_by_staff_id' 
        AND table_name = 'job_items'
    ) THEN
        ALTER TABLE public.job_items 
        ADD CONSTRAINT fk_job_items_issued_by_staff_id 
        FOREIGN KEY (issued_by_staff_id) REFERENCES public.profiles(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Verify the constraints were added
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='job_items';







