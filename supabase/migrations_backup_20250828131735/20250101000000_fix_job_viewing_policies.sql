-- Fix job viewing policies to allow viewing all jobs
-- Drop the restrictive viewing policy
DROP POLICY IF EXISTS "Users can view their own jobs" ON public.jobs;

-- Create a new policy that allows viewing all jobs
CREATE POLICY "Users can view all jobs" ON public.jobs FOR SELECT USING (true);

-- Keep the other policies for security (create, update, delete only own jobs)
-- These policies remain unchanged:
-- "Users can create their own jobs" - INSERT WITH CHECK (auth.uid() = user_id)
-- "Users can update their own jobs" - UPDATE USING (auth.uid() = user_id)  
-- "Users can delete their own jobs" - DELETE USING (auth.uid() = user_id)

-- Also fix job_items viewing policy
DROP POLICY IF EXISTS "Users can view their own job items" ON public.job_items;
CREATE POLICY "Users can view all job items" ON public.job_items FOR SELECT USING (true);

