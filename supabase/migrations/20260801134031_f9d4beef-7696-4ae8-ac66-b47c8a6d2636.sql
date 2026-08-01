ALTER TABLE public.goals
  ADD COLUMN progress integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.goals_progress_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.progress IS NULL THEN
    NEW.progress := 0;
  END IF;
  IF NEW.progress < 0 THEN
    NEW.progress := 0;
  END IF;
  IF NEW.progress > 100 THEN
    NEW.progress := 100;
  END IF;
  IF NEW.is_done THEN
    NEW.progress := 100;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER goals_progress_guard_trg
BEFORE INSERT OR UPDATE ON public.goals
FOR EACH ROW EXECUTE FUNCTION public.goals_progress_guard();

UPDATE public.goals SET progress = 100 WHERE is_done;