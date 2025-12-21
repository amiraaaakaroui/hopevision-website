-- ============================================================================
-- HopeVisionAI - Missing INSERT Policies for RLS
-- ============================================================================
-- These policies allow users to create their own profiles during signup
-- ============================================================================

-- PROFILES: Users can insert their own profile
-- ============================================================================
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Admins can insert any profile (for system operations)
CREATE POLICY "Admins can insert profiles"
    ON profiles FOR INSERT
    WITH CHECK (get_user_role() = 'admin');

-- PATIENT PROFILES: Users can insert their own patient profile
-- ============================================================================
-- Users can insert a patient_profile if the profile_id belongs to them
CREATE POLICY "Users can insert own patient profile"
    ON patient_profiles FOR INSERT
    WITH CHECK (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Admins can insert any patient profile
CREATE POLICY "Admins can insert patient profiles"
    ON patient_profiles FOR INSERT
    WITH CHECK (get_user_role() = 'admin');

-- DOCTOR PROFILES: Users can insert their own doctor profile
-- ============================================================================
-- Users can insert a doctor_profile if the profile_id belongs to them
CREATE POLICY "Users can insert own doctor profile"
    ON doctor_profiles FOR INSERT
    WITH CHECK (
        profile_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Admins can insert any doctor profile
CREATE POLICY "Admins can insert doctor profiles"
    ON doctor_profiles FOR INSERT
    WITH CHECK (get_user_role() = 'admin');

-- ============================================================================
-- End of INSERT Policies
-- ============================================================================

