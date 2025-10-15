-- Add foreign key constraints to job_items table
-- This migration adds the missing foreign key relationships

-- Add foreign key constraint for job_id -> job_cards(jobcardid)
ALTER TABLE public.job_items 
ADD CONSTRAINT fk_job_items_job_id 
FOREIGN KEY (job_id) REFERENCES public.job_cards(jobcardid) 
ON DELETE CASCADE;

-- Add foreign key constraint for user_id -> profiles(id)
ALTER TABLE public.job_items 
ADD CONSTRAINT fk_job_items_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Add foreign key constraint for received_by_staff_id -> profiles(id)
ALTER TABLE public.job_items 
ADD CONSTRAINT fk_job_items_received_by_staff_id 
FOREIGN KEY (received_by_staff_id) REFERENCES public.profiles(id) 
ON DELETE SET NULL;

-- Add foreign key constraint for issued_by_staff_id -> profiles(id)
ALTER TABLE public.job_items 
ADD CONSTRAINT fk_job_items_issued_by_staff_id 
FOREIGN KEY (issued_by_staff_id) REFERENCES public.profiles(id) 
ON DELETE SET NULL;

-- Add comments for documentation
COMMENT ON CONSTRAINT fk_job_items_job_id ON public.job_items IS 'Foreign key to job_cards table';
COMMENT ON CONSTRAINT fk_job_items_user_id ON public.job_items IS 'Foreign key to profiles table for the user who created the item';
COMMENT ON CONSTRAINT fk_job_items_received_by_staff_id ON public.job_items IS 'Foreign key to profiles table for staff who received the item';
COMMENT ON CONSTRAINT fk_job_items_issued_by_staff_id ON public.job_items IS 'Foreign key to profiles table for staff who issued the item';







