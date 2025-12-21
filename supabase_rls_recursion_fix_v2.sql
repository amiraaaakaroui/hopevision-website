-- ============================================================================
-- HopeVisionAI - RLS Recursion Fix V2 (Circular Dependency)
-- ============================================================================
-- This migration fixes the persistent "infinite recursion" error by breaking
-- the circular dependency between `patient_profiles` and `patient_doctor_assignments`.
--
-- The Loop:
-- 1. `patient_profiles` policy queries `patient_doctor_assignments`.
-- 2. `patient_doctor_assignments` policy queries `patient_profiles` (to verify ownership).
-- 3. This creates an infinite loop during RLS evaluation.
--
-- The Fix:
-- We introduce `SECURITY DEFINER` helper functions. These functions run with
-- the privileges of the creator (admin), bypassing RLS for the lookup.
-- This allows us to check "is this my patient profile?" without triggering
-- the recursive RLS check on the `patient_profiles` table.
-- ============================================================================

-- 1. Create SECURITY DEFINER Helper Functions
-- ============================================================================

-- Get current user's patient_profile_id (Bypasses RLS)
CREATE OR REPLACE FUNCTION get_my_patient_profile_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM patient_profiles
        WHERE profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user's doctor_profile_id (Bypasses RLS)
CREATE OR REPLACE FUNCTION get_my_doctor_profile_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM doctor_profiles
        WHERE profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Policies for patient_doctor_assignments
-- ============================================================================

-- Patients can view their own assignments
-- Uses get_my_patient_profile_id() to break the loop
DROP POLICY IF EXISTS "Patients can view own assignments" ON patient_doctor_assignments;
CREATE POLICY "Patients can view own assignments"
    ON patient_doctor_assignments FOR SELECT
    USING (
        patient_profile_id = get_my_patient_profile_id()
    );

-- Doctors can view their own assignments
-- Uses get_my_doctor_profile_id() for consistency
DROP POLICY IF EXISTS "Doctors can view own assignments" ON patient_doctor_assignments;
CREATE POLICY "Doctors can view own assignments"
    ON patient_doctor_assignments FOR SELECT
    USING (
        doctor_profile_id = get_my_doctor_profile_id()
    );

-- 3. Update Policies for patient_profiles (Doctor View)
-- ============================================================================
-- We also update this to use the new helper for consistency and performance

DROP POLICY IF EXISTS "Doctors can view assigned patients" ON patient_profiles;
CREATE POLICY "Doctors can view assigned patients"
    ON patient_profiles FOR SELECT
    USING (
        (deleted_at IS NULL) AND
        EXISTS (
            SELECT 1 FROM patient_doctor_assignments pda
            WHERE pda.patient_profile_id = patient_profiles.id
            AND pda.doctor_profile_id = get_my_doctor_profile_id()
        )
    );

-- 4. Update Policies for doctor_profiles (Patient View)
-- ============================================================================
-- While we are here, let's ensure no recursion happens here either

DROP POLICY IF EXISTS "Patients can view doctor profiles" ON doctor_profiles;
CREATE POLICY "Patients can view doctor profiles"
    ON doctor_profiles FOR SELECT
    USING (
        -- Allow patients, doctors, and admins to view doctor profiles
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND (role IN ('patient', 'doctor', 'admin'))
        )
    );

-- ============================================================================
-- End of Fix V2
-- ============================================================================
