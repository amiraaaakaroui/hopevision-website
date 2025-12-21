-- ============================================================================
-- HopeVisionAI - Google OAuth Flow Fixes
-- ============================================================================
-- This migration adds missing fields and constraints for proper Google OAuth
-- support, especially for doctor flows.
-- ============================================================================

-- 1. Add referral_source to profiles table
-- This field stores how the user heard about HopeVisionAI
-- Used for both patients and doctors
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS referral_source TEXT;

-- Add index for analytics queries
CREATE INDEX IF NOT EXISTS idx_profiles_referral_source 
ON profiles(referral_source);

COMMENT ON COLUMN profiles.referral_source IS 'How the user heard about HopeVisionAI (e.g., Google, Hospital, Friend, etc.)';

-- 2. Add UNIQUE constraint to doctor_profiles.rpps_number
-- Ensures each RPPS number can only be used once
-- RPPS is the French medical registration number
DO $$ 
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'doctor_profiles_rpps_number_unique'
    ) THEN
        ALTER TABLE doctor_profiles 
        ADD CONSTRAINT doctor_profiles_rpps_number_unique 
        UNIQUE (rpps_number);
    END IF;
END $$;

COMMENT ON CONSTRAINT doctor_profiles_rpps_number_unique ON doctor_profiles IS 'Ensures RPPS numbers are unique across all doctors';

-- 3. Update existing profiles to handle NULL values properly
-- Set referral_source to NULL explicitly for existing rows if not set
UPDATE profiles 
SET referral_source = NULL 
WHERE referral_source IS NULL;

-- 4. Verify changes
-- Run these queries to verify the migration succeeded:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referral_source';
-- SELECT conname FROM pg_constraint WHERE conname = 'doctor_profiles_rpps_number_unique';
