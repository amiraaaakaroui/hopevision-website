-- ============================================================================
-- HopeVisionAI - Disable Soft Delete for Testing/Cleanup
-- ============================================================================
-- This script disables the soft delete triggers to allow permanent deletion
-- of test data. Use this ONLY for testing/development environments.
-- ============================================================================

-- Step 1: Drop soft delete triggers on patient_profiles
-- ============================================================================
DROP TRIGGER IF EXISTS trg_soft_delete_patient_profiles ON patient_profiles;

-- Step 2: Verify the trigger is removed
-- ============================================================================
-- Check if trigger still exists (should return 0 rows)
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'patient_profiles'
AND trigger_name LIKE '%soft_delete%';

-- ============================================================================
-- Now you can permanently delete rows from patient_profiles
-- ============================================================================
-- Example: DELETE FROM patient_profiles WHERE profile_id = 'uuid-here';
-- 
-- Or delete all test data:
-- DELETE FROM patient_profiles;
-- DELETE FROM profiles;
-- DELETE FROM auth.users WHERE email LIKE '%+test%@%' OR email LIKE 'test%@%';
--
-- ============================================================================

-- Step 3 (Optional): Re-enable soft delete after cleanup
-- ============================================================================
-- If you want to re-enable soft delete later, uncomment and run:
--
-- CREATE TRIGGER trg_soft_delete_patient_profiles 
-- BEFORE DELETE ON patient_profiles 
-- FOR EACH ROW 
-- EXECUTE FUNCTION soft_delete_row_generic();
--
-- ============================================================================

