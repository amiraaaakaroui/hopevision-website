-- ============================================================================
-- HopeVisionAI - Complete Cleanup of All Test Data
-- ============================================================================
-- This script permanently deletes ALL data from the database
-- Use ONLY for testing/development environments!
-- ============================================================================

-- Step 1: Disable all soft delete triggers
-- ============================================================================
DROP TRIGGER IF EXISTS trg_soft_delete_patient_profiles ON patient_profiles;
DROP TRIGGER IF EXISTS trg_soft_delete_pre_analyses ON pre_analyses;
DROP TRIGGER IF EXISTS trg_soft_delete_ai_reports ON ai_reports;
DROP TRIGGER IF EXISTS trg_soft_delete_appointments ON appointments;
DROP TRIGGER IF EXISTS trg_soft_delete_doctor_notes ON doctor_notes;
DROP TRIGGER IF EXISTS trg_soft_delete_diagnostic_hypotheses ON diagnostic_hypotheses;
DROP TRIGGER IF EXISTS trg_soft_delete_prescriptions ON prescriptions;
DROP TRIGGER IF EXISTS trg_soft_delete_exam_results ON exam_results;
DROP TRIGGER IF EXISTS trg_soft_delete_documents ON documents;
DROP TRIGGER IF EXISTS trg_soft_delete_discussions ON discussions;
DROP TRIGGER IF EXISTS trg_soft_delete_discussion_messages ON discussion_messages;
DROP TRIGGER IF EXISTS trg_soft_delete_timeline_events ON timeline_events;

-- Step 2: Delete all data in the correct order (respecting foreign keys)
-- ============================================================================

-- Delete child tables first
DELETE FROM timeline_events;
DELETE FROM discussion_messages;
DELETE FROM discussions;
DELETE FROM documents;
DELETE FROM exam_results;
DELETE FROM prescriptions;
DELETE FROM diagnostic_hypotheses;
DELETE FROM ai_reports;
DELETE FROM pre_analyses;
DELETE FROM appointments;
DELETE FROM doctor_notes;
DELETE FROM patient_doctor_assignments;
DELETE FROM doctor_hospital_affiliations;

-- Delete profile-specific tables
DELETE FROM patient_profiles;
DELETE FROM doctor_profiles;

-- Delete main profiles table
DELETE FROM profiles;

-- Delete from auth.users (this will cascade to profiles if CASCADE is set)
-- Note: Be careful with this in production!
-- DELETE FROM auth.users;

-- Step 3: Reset sequences if needed (optional)
-- ============================================================================
-- Uncomment if you want to reset auto-increment sequences:
--
-- ALTER SEQUENCE IF EXISTS profiles_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS patient_profiles_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS doctor_profiles_id_seq RESTART WITH 1;

-- Step 4: Verify all tables are empty
-- ============================================================================
SELECT 
    'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 'patient_profiles', COUNT(*) FROM patient_profiles
UNION ALL
SELECT 'doctor_profiles', COUNT(*) FROM doctor_profiles
UNION ALL
SELECT 'pre_analyses', COUNT(*) FROM pre_analyses
UNION ALL
SELECT 'ai_reports', COUNT(*) FROM ai_reports
UNION ALL
SELECT 'timeline_events', COUNT(*) FROM timeline_events;

-- All counts should be 0

-- Step 5 (Optional): Re-enable soft delete triggers
-- ============================================================================
-- If you want to re-enable soft delete, run supabase_soft_delete_upgrade.sql again
-- Or manually recreate triggers using soft_delete_row_generic() function

-- ============================================================================
-- SAFE ALTERNATIVE: Delete only test accounts
-- ============================================================================
-- Instead of deleting everything, use the cleanup function:
--
-- SELECT delete_test_account_by_email('test@example.com');
--
-- ============================================================================

