-- Migration: Add city and establishment columns to doctor_profiles
-- Date: 2025-01-21
-- Purpose: Store the doctor's primary practice location in doctor_profiles table
--          This is needed for the doctor onboarding flow (Step 2)

-- Add city column to doctor_profiles
ALTER TABLE doctor_profiles
ADD COLUMN IF NOT EXISTS city TEXT;

-- Add establishment column to doctor_profiles  
ALTER TABLE doctor_profiles
ADD COLUMN IF NOT EXISTS establishment TEXT;

COMMENT ON COLUMN doctor_profiles.city IS 'Ville principale de pratique du médecin (Doctor primary practice city)';
COMMENT ON COLUMN doctor_profiles.establishment IS 'Établissement / Cabinet du médecin (Doctor practice establishment/clinic)';

-- Note: No RLS policy changes needed - existing policies already cover all columns
-- Both columns are optional (nullable) and used for doctor profile information
