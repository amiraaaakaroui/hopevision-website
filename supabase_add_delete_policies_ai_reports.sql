-- ============================================================================
-- ADD DELETE POLICIES for AI Reports and Diagnostic Hypotheses
-- ============================================================================
-- This allows patients to delete their own AI reports (for regeneration)
-- ============================================================================
-- IMPORTANT: Run this AFTER supabase_fix_all_rls_errors_FINAL.sql
-- ============================================================================

-- ============================================================================
-- 1. DIAGNOSTIC HYPOTHESES - DELETE POLICY
-- ============================================================================
-- Drop existing DELETE policy if it exists
DROP POLICY IF EXISTS "Patients can delete own diagnostic hypotheses" ON diagnostic_hypotheses;
DROP POLICY IF EXISTS "System can delete diagnostic hypotheses" ON diagnostic_hypotheses;

-- Create DELETE policy: Allow deletion of hypotheses for patient's own AI reports
CREATE POLICY "Patients can delete own diagnostic hypotheses"
    ON diagnostic_hypotheses FOR DELETE
    USING (
        ai_report_id IN (
            SELECT id FROM ai_reports
            WHERE patient_profile_id IN (
                SELECT id FROM patient_profiles
                WHERE profile_id IN (
                    SELECT id FROM profiles
                    WHERE user_id = auth.uid()
                    AND is_deleted = false
                )
            )
        )
    );

-- ============================================================================
-- 2. AI REPORTS - DELETE POLICY
-- ============================================================================
-- Drop existing DELETE policy if it exists
DROP POLICY IF EXISTS "Patients can delete own AI reports" ON ai_reports;
DROP POLICY IF EXISTS "System can delete AI reports" ON ai_reports;

-- Create DELETE policy: Allow patients to delete their own AI reports
CREATE POLICY "Patients can delete own AI reports"
    ON ai_reports FOR DELETE
    USING (
        patient_profile_id IN (
            SELECT id FROM patient_profiles
            WHERE profile_id IN (
                SELECT id FROM profiles
                WHERE user_id = auth.uid()
                AND is_deleted = false
            )
        )
    );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this query to verify the policies were created:
-- SELECT tablename, policyname, cmd 
-- FROM pg_policies 
-- WHERE tablename IN ('ai_reports', 'diagnostic_hypotheses')
-- AND cmd = 'DELETE'
-- ORDER BY tablename, policyname;
-- ============================================================================

