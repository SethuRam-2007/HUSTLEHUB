-- Fix 1: Block direct notification inserts (only allow via RPC)
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Block direct notification inserts" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (false);

-- Fix 2: Create a public profiles view with non-sensitive fields only
-- First, create a secure view that excludes sensitive data
CREATE VIEW public.public_profiles
WITH (security_invoker=on) AS
SELECT 
  id,
  full_name,
  avatar_url,
  tasks_completed,
  average_rating,
  total_ratings,
  is_verified,
  skills,
  bio
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Fix 3: Update profiles SELECT policy to be more restrictive
-- Users can view own profile OR profiles of people they're working with
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Users can always view their own full profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Task posters can view assignee profiles, assignees can view poster profiles
CREATE POLICY "Users can view task participant profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE (tasks.poster_id = auth.uid() AND tasks.assignee_id = profiles.id)
         OR (tasks.assignee_id = auth.uid() AND tasks.poster_id = profiles.id)
    )
  );

-- Task posters can view applicant profiles
CREATE POLICY "Posters can view applicant profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM task_applications
      WHERE task_applications.applicant_id = profiles.id
        AND EXISTS (
          SELECT 1 FROM tasks 
          WHERE tasks.id = task_applications.task_id 
            AND tasks.poster_id = auth.uid()
        )
    )
  );

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));