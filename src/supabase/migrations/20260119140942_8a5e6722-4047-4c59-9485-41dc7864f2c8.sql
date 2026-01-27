-- Server-side input validation for core user-generated content

-- 1) Add constraints (NOT VALID so existing legacy rows don't block deployment)
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_payout_range_chk CHECK (payout >= 5 AND payout <= 1000000) NOT VALID;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_title_length_chk CHECK (length(trim(title)) >= 5 AND length(title) <= 200) NOT VALID;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_description_length_chk CHECK (description IS NULL OR length(description) <= 5000) NOT VALID;

ALTER TABLE public.disputes
  ADD CONSTRAINT disputes_reason_length_chk CHECK (length(trim(reason)) >= 10 AND length(reason) <= 2000) NOT VALID;

ALTER TABLE public.task_applications
  ADD CONSTRAINT task_applications_cover_note_length_chk CHECK (cover_note IS NULL OR length(cover_note) <= 1000) NOT VALID;

-- 2) Trigger-based validation for non-immutable checks (e.g., deadline relative to now())
CREATE OR REPLACE FUNCTION public.validate_task_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Normalize
  NEW.title := trim(NEW.title);
  IF NEW.description IS NOT NULL THEN
    NEW.description := trim(NEW.description);
  END IF;

  -- Enforce core rules (redundant with CHECKs but gives clearer errors and covers legacy NOT VALID state)
  IF NEW.title IS NULL OR length(NEW.title) < 5 OR length(NEW.title) > 200 THEN
    RAISE EXCEPTION 'Task title must be between 5 and 200 characters';
  END IF;

  IF NEW.payout < 5 OR NEW.payout > 1000000 THEN
    RAISE EXCEPTION 'Payout must be between 5 and 1,000,000';
  END IF;

  IF NEW.description IS NOT NULL AND length(NEW.description) > 5000 THEN
    RAISE EXCEPTION 'Description must be 5000 characters or less';
  END IF;

  IF NEW.deadline IS NOT NULL AND NEW.deadline < now() THEN
    RAISE EXCEPTION 'Deadline must be in the future';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_tasks_before_write ON public.tasks;
CREATE TRIGGER validate_tasks_before_write
BEFORE INSERT OR UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.validate_task_fields();
