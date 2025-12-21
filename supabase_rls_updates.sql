-- ============================================================================
-- HopeVisionAI - RLS & Audit Updates
-- ============================================================================
-- 1. Adds audit fields to appointments (cancellation tracking)
-- 2. Updates RLS policies to respect soft deletes (deleted_at IS NULL)
-- 3. Ensures Admins can still see deleted data
-- ============================================================================

-- 1. Appointment Audit Fields
-- ============================================================================
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES profiles(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- 2. Update RLS Policies for Soft Deletes
-- ============================================================================
-- We need to drop existing policies and recreate them with the new condition.
-- Since there are many policies, we will focus on the critical ones identified.

-- Helper to check for soft delete
-- (deleted_at IS NULL) OR (get_user_role() = 'admin')

-- A. PRE-ANALYSES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Patients can view own pre_analyses" ON pre_analyses;
CREATE POLICY "Patients can view own pre_analyses"
    ON pre_analyses FOR SELECT
    USING (
        (deleted_at IS NULL) AND
        patient_profile_id IN (
            SELECT id FROM patient_profiles WHERE profile_id = get_user_profile()
        )
    );

DROP POLICY IF EXISTS "Doctors can view assigned patient pre_analyses" ON pre_analyses;
CREATE POLICY "Doctors can view assigned patient pre_analyses"
    ON pre_analyses FOR SELECT
    USING (
        (deleted_at IS NULL) AND
        get_user_role() = 'doctor' AND
        EXISTS (
            SELECT 1 FROM patient_doctor_assignments pda
            WHERE pda.patient_profile_id = pre_analyses.patient_profile_id
            AND pda.doctor_profile_id = (
                SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
            )
        )
    );

-- B. AI REPORTS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Patients can view own AI reports" ON ai_reports;
CREATE POLICY "Patients can view own AI reports"
    ON ai_reports FOR SELECT
    USING (
        (deleted_at IS NULL) AND
        patient_profile_id IN (
            SELECT id FROM patient_profiles WHERE profile_id = get_user_profile()
        )
    );

DROP POLICY IF EXISTS "Doctors can view assigned patient AI reports" ON ai_reports;
CREATE POLICY "Doctors can view assigned patient AI reports"
    ON ai_reports FOR SELECT
    USING (
        (deleted_at IS NULL) AND
        get_user_role() = 'doctor' AND
        EXISTS (
            SELECT 1 FROM patient_doctor_assignments pda
            WHERE pda.patient_profile_id = ai_reports.patient_profile_id
            AND pda.doctor_profile_id = (
                SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
            )
        )
    );

-- C. APPOINTMENTS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Patients can view own appointments" ON appointments;
CREATE POLICY "Patients can view own appointments"
    ON appointments FOR SELECT
    USING (
        (deleted_at IS NULL) AND
        patient_profile_id IN (
            SELECT id FROM patient_profiles WHERE profile_id = get_user_profile()
        )
    );

DROP POLICY IF EXISTS "Doctors can view own appointments" ON appointments;
CREATE POLICY "Doctors can view own appointments"
    ON appointments FOR SELECT
    USING (
        (deleted_at IS NULL) AND
        doctor_profile_id = (
            SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
        )
    );

-- D. DOCTOR NOTES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Doctors can view own notes" ON doctor_notes;
CREATE POLICY "Doctors can view own notes"
    ON doctor_notes FOR SELECT
    USING (
        (deleted_at IS NULL) AND
        doctor_profile_id = (
            SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
        )
    );

DROP POLICY IF EXISTS "Patients can view own notes" ON doctor_notes;
CREATE POLICY "Patients can view own notes"
    ON doctor_notes FOR SELECT
    USING (
        (deleted_at IS NULL) AND
        patient_profile_id IN (
            SELECT id FROM patient_profiles WHERE profile_id = get_user_profile()
        )
    );

-- E. PATIENT PROFILES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Patients can view own profile" ON patient_profiles;
CREATE POLICY "Patients can view own profile"
    ON patient_profiles FOR SELECT
    USING (
        (deleted_at IS NULL) AND
        profile_id = get_user_profile()
    );

DROP POLICY IF EXISTS "Doctors can view assigned patients" ON patient_profiles;
CREATE POLICY "Doctors can view assigned patients"
    ON patient_profiles FOR SELECT
    USING (
        (deleted_at IS NULL) AND
        get_user_role() = 'doctor' AND
        EXISTS (
            SELECT 1 FROM patient_doctor_assignments pda
            WHERE pda.patient_profile_id = patient_profiles.id
            AND pda.doctor_profile_id = (
                SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
            )
        )
    );

-- 3. Admin Access Override (Example for one table, apply pattern as needed)
-- ============================================================================
-- Admins should see everything, including deleted rows
DROP POLICY IF EXISTS "Admins can view all patient profiles" ON patient_profiles;
CREATE POLICY "Admins can view all patient profiles"
    ON patient_profiles FOR SELECT
    USING (get_user_role() = 'admin'); -- No deleted_at check means they see all

-- ============================================================================
-- End of RLS Updates
-- ============================================================================
