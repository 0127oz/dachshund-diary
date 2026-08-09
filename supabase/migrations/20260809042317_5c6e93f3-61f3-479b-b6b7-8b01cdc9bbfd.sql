ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS proof_photo_paths text[] NOT NULL DEFAULT '{}'::text[];

UPDATE public.goals
SET proof_photo_paths = ARRAY[proof_photo_path]
WHERE proof_photo_path IS NOT NULL
  AND cardinality(proof_photo_paths) = 0;

CREATE OR REPLACE FUNCTION public.goals_photos_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.proof_photo_paths IS NULL THEN
    NEW.proof_photo_paths := '{}'::text[];
  END IF;
  IF cardinality(NEW.proof_photo_paths) > 5 THEN
    RAISE EXCEPTION '사진은 최대 5장까지 올릴 수 있어요.';
  END IF;
  NEW.proof_photo_path := NEW.proof_photo_paths[1];
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS goals_photos_guard_trg ON public.goals;
CREATE TRIGGER goals_photos_guard_trg
BEFORE INSERT OR UPDATE ON public.goals
FOR EACH ROW EXECUTE FUNCTION public.goals_photos_guard();