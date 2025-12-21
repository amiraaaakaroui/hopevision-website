-- ============================================================================
-- Fix RLS Policies for Pre-Analysis Uploads and Finalization
-- ============================================================================
-- This fixes RLS errors for:
-- 1. Image uploads (updates to pre_analyses)
-- 2. Document uploads (inserts to documents table)
-- 3. Pre-analysis finalization (updates to pre_analyses when status changes to 'submitted')
-- ============================================================================

-- ============================================================================
-- 1. FIX PRE_ANALYSES UPDATE POLICY
-- ============================================================================
-- Current policy only allows updates when status = 'draft'
-- We need to allow updates to 'submitted' during finalization
-- Also use direct auth.uid() checks to avoid recursion

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Patients can update own draft pre_analyses" ON pre_analyses;

-- Create new UPDATE policy that allows:
-- - Updates when status = 'draft' (can modify symptoms)
-- - Updates when changing status from 'draft' to 'submitted' (finalization)
-- - Uses direct auth.uid() check via patient_profiles -> profiles
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
-- 2. FIX DOCUMENTS INSERT POLICY
-- ============================================================================
-- Current policy uses get_user_profile() which may cause issues
-- Replace with direct auth.uid() check

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Patients can create own documents" ON documents;

-- Create new INSERT policy with direct auth.uid() check
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
-- 3. ENSURE PRE_ANALYSES INSERT POLICY IS CORRECT
-- ============================================================================
-- Drop and recreate INSERT policy with direct auth.uid() check

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
-- 4. VERIFY DOCUMENTS UPDATE POLICY (if needed)
-- ============================================================================
-- Add UPDATE policy for documents if it doesn't exist
DROP POLICY IF EXISTS "Patients can update own documents" ON documents;

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
-- Run these to verify policies are correct:
-- SELECT * FROM pg_policies WHERE tablename = 'pre_analyses';
-- SELECT * FROM pg_policies WHERE tablename = 'documents';

