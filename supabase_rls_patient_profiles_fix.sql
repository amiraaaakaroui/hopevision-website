-- ============================================================================
-- HopeVisionAI - RLS Recursion Fix for patient_profiles
-- ============================================================================
-- This migration replaces all RLS policies on `patient_profiles` with 
-- non-recursive versions to fix the "infinite recursion detected" error
-- during patient onboarding (Step 2).
--
-- Key changes:
-- 1. Drops all existing policies on `patient_profiles`.
-- 2. Replaces `get_user_profile()` calls with direct `profiles` table lookups
--    using `auth.uid()`.
-- 3. Adds explicit `WITH CHECK` clauses for UPDATE policies to support UPSERT.
-- 4. Ensures `deleted_at IS NULL` checks are preserved.
-- ============================================================================

-- 1. Drop existing policies
-- ============================================================================
DROP POLICY IF EXISTS "Patients can view own profile" ON patient_profiles;
DROP POLICY IF EXISTS "Patients can update own profile" ON patient_profiles;
DROP POLICY IF EXISTS "Users can insert own patient profile" ON patient_profiles;
DROP POLICY IF EXISTS "Doctors can view assigned patients" ON patient_profiles;
DROP POLICY IF EXISTS "Admins can view all patient profiles" ON patient_profiles;
DROP POLICY IF EXISTS "Admins can insert patient profiles" ON patient_profiles;

-- Drop potentially named policies from previous migrations (defensive)
DROP POLICY IF EXISTS "Users can view own profile" ON patient_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON patient_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON patient_profiles;

-- 2. Create new non-recursive policies
-- ============================================================================

-- A. SELECT (Own Profile)
-- Users can view their patient profile if it is linked to their auth.uid() via profiles
CREATE POLICY "Patients can view own profile"
ON patient_profiles
FOR SELECT
USING (
    (deleted_at IS NULL) AND
    profile_id IN (
        SELECT id FROM profiles
        WHERE user_id = auth.uid()
        AND is_deleted = false
    )
);

-- B. INSERT (Own Profile)
-- Users can insert a patient profile if the profile_id belongs to them
-- Note: No deleted_at check needed for INSERT (new row)
CREATE POLICY "Patients can insert own profile"
ON patient_profiles
FOR INSERT
WITH CHECK (
    profile_id IN (
        SELECT id FROM profiles
        WHERE user_id = auth.uid()
        AND is_deleted = false
    )
);

-- C. UPDATE (Own Profile)
-- Users can update their own patient profile
-- CRITICAL: Must have both USING and WITH CHECK to handle UPSERT correctly
CREATE POLICY "Patients can update own profile"
ON patient_profiles
FOR UPDATE
USING (
    (deleted_at IS NULL) AND
    profile_id IN (
        SELECT id FROM profiles
        WHERE user_id = auth.uid()
        AND is_deleted = false
    )
)
WITH CHECK (
    profile_id IN (
        SELECT id FROM profiles
        WHERE user_id = auth.uid()
        AND is_deleted = false
    )
);

-- D. SELECT (Doctors)
-- Doctors can view assigned patients
-- Uses direct lookups to avoid recursion via helper functions
CREATE POLICY "Doctors can view assigned patients"
ON patient_profiles
FOR SELECT
USING (
    (deleted_at IS NULL) AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND role = 'doctor'
        AND is_deleted = false
    ) AND
    EXISTS (
        SELECT 1 FROM patient_doctor_assignments pda
        WHERE pda.patient_profile_id = patient_profiles.id
        AND pda.doctor_profile_id IN (
            SELECT id FROM doctor_profiles
            WHERE profile_id IN (
                SELECT id FROM profiles
                WHERE user_id = auth.uid()
            )
        )
    )
);

-- E. SELECT (Admins)
-- Admins can view all profiles (including deleted ones, or we can restrict if needed)
-- Usually admins want to see everything.
CREATE POLICY "Admins can view all patient profiles"
ON patient_profiles
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- F. INSERT (Admins)
CREATE POLICY "Admins can insert patient profiles"
ON patient_profiles
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- G. UPDATE (Admins)
CREATE POLICY "Admins can update patient profiles"
ON patient_profiles
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- ============================================================================
-- End of Fix
-- ============================================================================
