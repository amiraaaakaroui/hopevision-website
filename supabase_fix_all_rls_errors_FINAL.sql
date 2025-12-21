-- ============================================================================
-- FINAL FIX: All Missing RLS INSERT/UPDATE Policies (IDEMPOTENT)
-- ============================================================================
-- This fixes ALL RLS errors - can be run multiple times without errors
-- Fixes:
-- 1. AI Reports INSERT (generation of AI report)
-- 2. Diagnostic Hypotheses INSERT (linked to AI reports)
-- 3. Timeline Events INSERT (for AI analysis completion)
-- 4. Pre-analysis updates (allowing status changes)
-- ============================================================================

-- ============================================================================
-- 1. AI REPORTS - INSERT POLICY (CRITICAL)
-- ============================================================================
-- Drop ALL possible variations of INSERT policies for ai_reports
DROP POLICY IF EXISTS "System can create AI reports for patients" ON ai_reports;
DROP POLICY IF EXISTS "Patients can create own AI reports" ON ai_reports;

-- Create INSERT policy: Allow system to create AI reports for patient's own pre-analyses
CREATE POLICY "System can create AI reports for patients"
    ON ai_reports FOR INSERT
    WITH CHECK (
        patient_profile_id IN (
            SELECT id FROM patient_profiles
            WHERE profile_id IN (
                SELECT id FROM profiles
                WHERE user_id = auth.uid()
                AND is_deleted = false
            )
        )
        AND pre_analysis_id IN (
            SELECT id FROM pre_analyses
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
-- 2. DIAGNOSTIC HYPOTHESES - INSERT POLICY (CRITICAL)
-- ============================================================================
-- Drop ALL possible variations of INSERT policies for diagnostic_hypotheses
DROP POLICY IF EXISTS "System can create diagnostic hypotheses" ON diagnostic_hypotheses;
DROP POLICY IF EXISTS "Patients can create diagnostic hypotheses" ON diagnostic_hypotheses;

-- Create INSERT policy: Allow system to create hypotheses linked to patient's AI reports
CREATE POLICY "System can create diagnostic hypotheses"
    ON diagnostic_hypotheses FOR INSERT
    WITH CHECK (
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
-- 3. TIMELINE EVENTS - INSERT POLICY
-- ============================================================================
-- Drop ALL possible variations of INSERT policies for timeline_events
DROP POLICY IF EXISTS "Patients can create own timeline events" ON timeline_events;
DROP POLICY IF EXISTS "System can create timeline events for patients" ON timeline_events;

-- Create INSERT policy: Allow system/patients to create timeline events for their own profile
CREATE POLICY "Patients can create own timeline events"
    ON timeline_events FOR INSERT
    WITH CHECK (
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
-- 4. PRE_ANALYSES - UPDATE POLICY (Allow status changes)
-- ============================================================================
-- Drop ALL possible variations of UPDATE policies for pre_analyses
DROP POLICY IF EXISTS "Patients can update own draft pre_analyses" ON pre_analyses;
DROP POLICY IF EXISTS "Patients can update own pre_analyses" ON pre_analyses;

-- Create new UPDATE policy that allows ALL status changes (draft -> submitted -> completed)
CREATE POLICY "Patients can update own pre_analyses"
    ON pre_analyses FOR UPDATE
    USING (
        patient_profile_id IN (
            SELECT id FROM patient_profiles
            WHERE profile_id IN (
                SELECT id FROM profiles
                WHERE user_id = auth.uid()
                AND is_deleted = false
            )
        )
    )
    WITH CHECK (
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
-- 5. PRE_ANALYSES - INSERT POLICY (Ensure it exists with correct check)
-- ============================================================================
-- Drop existing INSERT policy and recreate with direct auth.uid() check
DROP POLICY IF EXISTS "Patients can create own pre_analyses" ON pre_analyses;

CREATE POLICY "Patients can create own pre_analyses"
    ON pre_analyses FOR INSERT
    WITH CHECK (
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
-- 6. DOCUMENTS - INSERT POLICY (Ensure it exists with correct check)
-- ============================================================================
-- Drop existing INSERT policy and recreate with direct auth.uid() check
DROP POLICY IF EXISTS "Patients can create own documents" ON documents;

CREATE POLICY "Patients can create own documents"
    ON documents FOR INSERT
    WITH CHECK (
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
-- 7. DOCUMENTS - UPDATE POLICY (If needed)
-- ============================================================================
-- Drop existing UPDATE policy if it exists
DROP POLICY IF EXISTS "Patients can update own documents" ON documents;

-- Create UPDATE policy for documents
CREATE POLICY "Patients can update own documents"
    ON documents FOR UPDATE
    USING (
        patient_profile_id IN (
            SELECT id FROM patient_profiles
            WHERE profile_id IN (
                SELECT id FROM profiles
                WHERE user_id = auth.uid()
                AND is_deleted = false
            )
        )
    )
    WITH CHECK (
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
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify all policies exist:
-- 
-- SELECT tablename, policyname, cmd 
-- FROM pg_policies 
-- WHERE tablename IN ('ai_reports', 'diagnostic_hypotheses', 'timeline_events', 'pre_analyses', 'documents')
-- ORDER BY tablename, policyname;

