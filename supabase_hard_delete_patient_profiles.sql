-- ============================================================================
-- HopeVisionAI - Hard Delete Script for patient_profiles
-- ============================================================================
-- This script permanently deletes rows from patient_profiles
-- by bypassing soft delete triggers. Use for cleaning test data.
-- ============================================================================

-- Step 1: Disable soft delete trigger temporarily
-- ============================================================================
DROP TRIGGER IF EXISTS trg_soft_delete_patient_profiles ON patient_profiles;

-- Step 2: Permanently delete all rows from patient_profiles
-- ============================================================================
-- WARNING: This will permanently delete ALL patient_profiles data!
-- Make sure you're in a test/development environment.

DELETE FROM patient_profiles;

-- Step 3: Verify deletion
-- ============================================================================
SELECT COUNT(*) as remaining_rows FROM patient_profiles;
-- Should return 0

-- Step 4 (Optional): Re-enable soft delete trigger
-- ============================================================================
-- Uncomment the following to re-enable soft delete after cleanup:

-- CREATE TRIGGER trg_soft_delete_patient_profiles 
-- BEFORE DELETE ON patient_profiles 
-- FOR EACH ROW 
-- EXECUTE FUNCTION soft_delete_row_generic();

-- ============================================================================
-- Alternative: Delete specific rows by profile_id
-- ============================================================================
-- If you want to delete specific rows instead of all:
--
-- DELETE FROM patient_profiles 
-- WHERE profile_id IN (
--     SELECT id FROM profiles WHERE email = 'test@example.com'
-- );
--
-- ============================================================================

