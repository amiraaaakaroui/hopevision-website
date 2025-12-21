-- ============================================================================
-- FIX STORAGE RLS POLICIES (UPDATED)
-- ============================================================================

-- 1. Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('patient-images', 'patient-images', false),
  ('patient-documents', 'patient-documents', false),
  ('patient-audio', 'patient-audio', false)
ON CONFLICT (id) DO NOTHING;

-- REMOVED: ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 
-- (This caused the permission error and is usually already enabled)

-- 2. Drop existing policies to avoid conflicts (Idempotent)
DROP POLICY IF EXISTS "Patients can upload own images" ON storage.objects;
DROP POLICY IF EXISTS "Patients can view own images" ON storage.objects;
DROP POLICY IF EXISTS "Patients can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Patients can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Patients can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Patients can delete own documents" ON storage.objects;
DROP POLICY IF EXISTS "Patients can upload own audio" ON storage.objects;
DROP POLICY IF EXISTS "Patients can view own audio" ON storage.objects;
DROP POLICY IF EXISTS "Patients can delete own audio" ON storage.objects;

-- 3. Policy: Patients can upload to their own folder in patient-images
CREATE POLICY "Patients can upload own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'patient-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM patient_profiles 
    WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

-- 4. Policy: Patients can view their own images
CREATE POLICY "Patients can view own images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'patient-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM patient_profiles 
    WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

-- 5. Policy: Patients can delete their own images
CREATE POLICY "Patients can delete own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'patient-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM patient_profiles 
    WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

-- Repeat for patient-documents
CREATE POLICY "Patients can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'patient-documents' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM patient_profiles 
    WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Patients can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'patient-documents' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM patient_profiles 
    WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Patients can delete own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'patient-documents' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM patient_profiles 
    WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

-- Repeat for patient-audio
CREATE POLICY "Patients can upload own audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'patient-audio' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM patient_profiles 
    WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Patients can view own audio"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'patient-audio' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM patient_profiles 
    WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Patients can delete own audio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'patient-audio' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM patient_profiles 
    WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);
