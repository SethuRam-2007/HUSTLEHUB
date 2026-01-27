-- Create task_applications table for worker applications
CREATE TABLE public.task_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending',
  cover_note TEXT,
  UNIQUE(task_id, applicant_id)
);

-- Enable RLS
ALTER TABLE public.task_applications ENABLE ROW LEVEL SECURITY;

-- Workers can view their own applications
CREATE POLICY "Users can view own applications"
ON public.task_applications
FOR SELECT
USING (auth.uid() = applicant_id);

-- Task poster can view applications for their tasks
CREATE POLICY "Posters can view applications for their tasks"
ON public.task_applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.id = task_applications.task_id
    AND tasks.poster_id = auth.uid()
  )
);

-- Users can create applications
CREATE POLICY "Users can apply to tasks"
ON public.task_applications
FOR INSERT
WITH CHECK (auth.uid() = applicant_id);

-- Task poster can update applications (to select/reject)
CREATE POLICY "Posters can update applications"
ON public.task_applications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.id = task_applications.task_id
    AND tasks.poster_id = auth.uid()
  )
);

-- Add application_count to tasks for quick reference
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS application_count INTEGER DEFAULT 0;

-- Create function to increment application count
CREATE OR REPLACE FUNCTION public.increment_application_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.tasks
  SET application_count = application_count + 1
  WHERE id = NEW.task_id;
  
  -- Update status to applications_received if still open
  UPDATE public.tasks
  SET status = 'applications_received'
  WHERE id = NEW.task_id AND status = 'open';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for application count
CREATE TRIGGER on_application_created
AFTER INSERT ON public.task_applications
FOR EACH ROW
EXECUTE FUNCTION public.increment_application_count();

-- Add realtime for task_applications
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_applications;