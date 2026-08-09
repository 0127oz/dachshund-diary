ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS proof_photo_path text;

CREATE POLICY "goal_photos_select_authenticated"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'goal-photos');

CREATE POLICY "goal_photos_insert_own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'goal-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "goal_photos_update_own"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'goal-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'goal-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "goal_photos_delete_own"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'goal-photos' AND (storage.foldername(name))[1] = auth.uid()::text);