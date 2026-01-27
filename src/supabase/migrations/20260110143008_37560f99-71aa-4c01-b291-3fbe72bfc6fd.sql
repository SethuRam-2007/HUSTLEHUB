-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Posters can view applications for their tasks" ON public.task_applications;
DROP POLICY IF EXISTS "Users can view own applications" ON public.task_applications;

-- Create a single PERMISSIVE policy that allows:
-- 1. Applicants to view their own applications
-- 2. Task posters to view applications for their tasks
CREATE POLICY "Users can view relevant applications"
ON public.task_applications
FOR SELECT
USING (
  auth.uid() = applicant_id 
  OR EXISTS (
    SELECT 1 FROM tasks 
    WHERE tasks.id = task_applications.task_id 
    AND tasks.poster_id = auth.uid()
  )
);