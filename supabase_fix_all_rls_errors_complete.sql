-- ============================================================================
-- COMPLETE FIX: All Missing RLS INSERT/UPDATE Policies
-- ============================================================================
-- This fixes ALL RLS errors for:
-- 1. AI Reports INSERT (generation of AI report)
-- 2. Diagnostic Hypotheses INSERT (linked to AI reports)
-- 3. Timeline Events INSERT (for AI analysis completion)
-- 4. Pre-analysis updates (allowing status changes)
-- ============================================================================

-- ============================================================================
-- 1. AI REPORTS - INSERT POLICY (CRITICAL)
-- ============================================================================
-- The error: "Failed to save AI report: new row violates row-level security policy for table 'ai_reports'"
-- Root cause: No INSERT policy exists for ai_reports table

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
-- Needed when inserting hypotheses linked to AI reports

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
-- Needed when creating timeline events for AI analysis completion

DROP POLICY IF EXISTS "Patients can create own timeline events" ON timeline_events;
DROP POLICY IF EXISTS "System can create timeline events for patients" ON timeline_events;

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
-- Fix the policy to allow updates from 'draft' to 'submitted' and 'completed'
-- Drop old restrictive policy and create new one

DROP POLICY IF EXISTS "Patients can update own draft pre_analyses" ON pre_analyses;
DROP POLICY IF EXISTS "Patients can update own pre_analyses" ON pre_analyses;

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
-- 5. PRE_ANALYSES - INSERT POLICY (Ensure it exists)
-- ============================================================================
-- Make sure INSERT policy uses direct auth.uid() check

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
-- 6. DOCUMENTS - INSERT POLICY (Ensure it exists)
-- ============================================================================
-- Make sure documents can be inserted with correct patient_profile_id

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
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify all policies exist:
-- 
-- SELECT tablename, policyname, cmd 
-- FROM pg_policies 
-- WHERE tablename IN ('ai_reports', 'diagnostic_hypotheses', 'timeline_events', 'pre_analyses', 'documents')
-- ORDER BY tablename, policyname;

