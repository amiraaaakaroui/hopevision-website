-- ============================================================================
-- HopeVisionAI - Row Level Security (RLS) Policies
-- ============================================================================
-- These policies control access to data based on user roles and relationships
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_hospital_affiliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_hypotheses ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_doctor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_precision_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamnesis_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTION: Get current user's profile
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_profile()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id FROM profiles WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTION: Get current user's role
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM profiles WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PROFILES
-- ============================================================================
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (user_id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (get_user_role() = 'admin');

-- ============================================================================
-- PATIENT PROFILES
-- ============================================================================
-- Patients can view their own profile
CREATE POLICY "Patients can view own profile"
    ON patient_profiles FOR SELECT
    USING (profile_id = get_user_profile());

-- Patients can update their own profile
CREATE POLICY "Patients can update own profile"
    ON patient_profiles FOR UPDATE
    USING (profile_id = get_user_profile());

-- Doctors can view patient profiles they are assigned to
CREATE POLICY "Doctors can view assigned patients"
    ON patient_profiles FOR SELECT
    USING (
        get_user_role() = 'doctor' AND
        EXISTS (
            SELECT 1 FROM patient_doctor_assignments pda
            WHERE pda.patient_profile_id = patient_profiles.id
            AND pda.doctor_profile_id = (
                SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
            )
        )
    );

-- Admins can view all patient profiles
CREATE POLICY "Admins can view all patient profiles"
    ON patient_profiles FOR SELECT
    USING (get_user_role() = 'admin');

-- ============================================================================
-- DOCTOR PROFILES
-- ============================================================================
-- Doctors can view their own profile
CREATE POLICY "Doctors can view own profile"
    ON doctor_profiles FOR SELECT
    USING (profile_id = get_user_profile());

-- Doctors can update their own profile
CREATE POLICY "Doctors can update own profile"
    ON doctor_profiles FOR UPDATE
    USING (profile_id = get_user_profile());

-- Patients can view doctor profiles (for booking)
CREATE POLICY "Patients can view doctor profiles"
    ON doctor_profiles FOR SELECT
    USING (get_user_role() = 'patient' OR get_user_role() = 'doctor' OR get_user_role() = 'admin');

-- ============================================================================
-- PRE-ANALYSES
-- ============================================================================
-- Patients can view their own pre-analyses
CREATE POLICY "Patients can view own pre_analyses"
    ON pre_analyses FOR SELECT
    USING (
        patient_profile_id IN (
            SELECT id FROM patient_profiles WHERE profile_id = get_user_profile()
        )
    );

-- Patients can create their own pre-analyses
CREATE POLICY "Patients can create own pre_analyses"
    ON pre_analyses FOR INSERT
    WITH CHECK (
        patient_profile_id IN (
            SELECT id FROM patient_profiles WHERE profile_id = get_user_profile()
        )
    );

-- Patients can update their own pre-analyses (if draft)
CREATE POLICY "Patients can update own draft pre_analyses"
    ON pre_analyses FOR UPDATE
    USING (
        patient_profile_id IN (
            SELECT id FROM patient_profiles WHERE profile_id = get_user_profile()
        )
        AND status = 'draft'
    );

-- Doctors can view pre-analyses of assigned patients
CREATE POLICY "Doctors can view assigned patient pre_analyses"
    ON pre_analyses FOR SELECT
    USING (
        get_user_role() = 'doctor' AND
        EXISTS (
            SELECT 1 FROM patient_doctor_assignments pda
            WHERE pda.patient_profile_id = pre_analyses.patient_profile_id
            AND pda.doctor_profile_id = (
                SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
            )
        )
    );

-- ============================================================================
-- AI REPORTS
-- ============================================================================
-- Patients can view their own AI reports
CREATE POLICY "Patients can view own AI reports"
    ON ai_reports FOR SELECT
    USING (
        patient_profile_id IN (
            SELECT id FROM patient_profiles WHERE profile_id = get_user_profile()
        )
    );

-- Doctors can view AI reports of assigned patients
CREATE POLICY "Doctors can view assigned patient AI reports"
    ON ai_reports FOR SELECT
    USING (
        get_user_role() = 'doctor' AND
        EXISTS (
            SELECT 1 FROM patient_doctor_assignments pda
            WHERE pda.patient_profile_id = ai_reports.patient_profile_id
            AND pda.doctor_profile_id = (
                SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
            )
        )
    );

-- ============================================================================
-- DIAGNOSTIC HYPOTHESES
-- ============================================================================
-- Users can view hypotheses for reports they can access
CREATE POLICY "Users can view accessible hypotheses"
    ON diagnostic_hypotheses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM ai_reports ar
            WHERE ar.id = diagnostic_hypotheses.ai_report_id
            AND (
                -- Patient owns the report
                ar.patient_profile_id IN (
                    SELECT id FROM patient_profiles WHERE profile_id = get_user_profile()
                )
                OR
                -- Doctor is assigned to the patient
                (
                    get_user_role() = 'doctor' AND
                    EXISTS (
                        SELECT 1 FROM patient_doctor_assignments pda
                        WHERE pda.patient_profile_id = ar.patient_profile_id
                        AND pda.doctor_profile_id = (
                            SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
                        )
                    )
                )
            )
        )
    );

-- ============================================================================
-- DOCUMENTS
-- ============================================================================
-- Patients can view their own documents
CREATE POLICY "Patients can view own documents"
    ON documents FOR SELECT
    USING (
        patient_profile_id IN (
            SELECT id FROM patient_profiles WHERE profile_id = get_user_profile()
        )
    );

-- Patients can upload their own documents
CREATE POLICY "Patients can create own documents"
    ON documents FOR INSERT
    WITH CHECK (
        patient_profile_id IN (
            SELECT id FROM patient_profiles WHERE profile_id = get_user_profile()
        )
    );

-- Doctors can view documents of assigned patients
CREATE POLICY "Doctors can view assigned patient documents"
    ON documents FOR SELECT
    USING (
        get_user_role() = 'doctor' AND
        EXISTS (
            SELECT 1 FROM patient_doctor_assignments pda
            WHERE pda.patient_profile_id = documents.patient_profile_id
            AND pda.doctor_profile_id = (
                SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
            )
        )
    );

-- ============================================================================
-- APPOINTMENTS
-- ============================================================================
-- Patients can view their own appointments
CREATE POLICY "Patients can view own appointments"
    ON appointments FOR SELECT
    USING (
        patient_profile_id IN (
            SELECT id FROM patient_profiles WHERE profile_id = get_user_profile()
        )
    );

-- Patients can create appointments for themselves
CREATE POLICY "Patients can create own appointments"
    ON appointments FOR INSERT
    WITH CHECK (
        patient_profile_id IN (
            SELECT id FROM patient_profiles WHERE profile_id = get_user_profile()
        )
    );

-- Patients can update their own appointments (if not completed)
CREATE POLICY "Patients can update own appointments"
    ON appointments FOR UPDATE
    USING (
        patient_profile_id IN (
            SELECT id FROM patient_profiles WHERE profile_id = get_user_profile()
        )
        AND status != 'completed'
    );

-- Doctors can view appointments with their patients
CREATE POLICY "Doctors can view own appointments"
    ON appointments FOR SELECT
    USING (
        doctor_profile_id = (
            SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
        )
    );

-- Doctors can update appointments they are part of
CREATE POLICY "Doctors can update own appointments"
    ON appointments FOR UPDATE
    USING (
        doctor_profile_id = (
            SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
        )
    );

-- ============================================================================
-- DOCTOR NOTES
-- ============================================================================
-- Doctors can view their own notes
CREATE POLICY "Doctors can view own notes"
    ON doctor_notes FOR SELECT
    USING (
        doctor_profile_id = (
            SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
        )
    );

-- Doctors can create notes for assigned patients
CREATE POLICY "Doctors can create notes for assigned patients"
    ON doctor_notes FOR INSERT
    WITH CHECK (
        get_user_role() = 'doctor' AND
        doctor_profile_id = (
            SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
        )
        AND EXISTS (
            SELECT 1 FROM patient_doctor_assignments pda
            WHERE pda.patient_profile_id = doctor_notes.patient_profile_id
            AND pda.doctor_profile_id = (
                SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
            )
        )
    );

-- Doctors can update their own notes
CREATE POLICY "Doctors can update own notes"
    ON doctor_notes FOR UPDATE
    USING (
        doctor_profile_id = (
            SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
        )
    );

-- Patients can view notes about them
CREATE POLICY "Patients can view own notes"
    ON doctor_notes FOR SELECT
    USING (
        patient_profile_id IN (
            SELECT id FROM patient_profiles WHERE profile_id = get_user_profile()
        )
    );

-- ============================================================================
-- DISCUSSIONS
-- ============================================================================
-- Doctors can view discussions they participate in
CREATE POLICY "Doctors can view own discussions"
    ON discussions FOR SELECT
    USING (
        get_user_role() = 'doctor' AND
        EXISTS (
            SELECT 1 FROM discussion_participants dp
            WHERE dp.discussion_id = discussions.id
            AND dp.doctor_profile_id = (
                SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
            )
        )
    );

-- Doctors can create discussions for assigned patients
CREATE POLICY "Doctors can create discussions"
    ON discussions FOR INSERT
    WITH CHECK (
        get_user_role() = 'doctor' AND
        created_by_doctor_id = (
            SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
        )
        AND EXISTS (
            SELECT 1 FROM patient_doctor_assignments pda
            WHERE pda.patient_profile_id = discussions.patient_profile_id
            AND pda.doctor_profile_id = (
                SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
            )
        )
    );

-- ============================================================================
-- DISCUSSION PARTICIPANTS
-- ============================================================================
-- Doctors can view participants of discussions they're in
CREATE POLICY "Doctors can view discussion participants"
    ON discussion_participants FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM discussion_participants dp2
            WHERE dp2.discussion_id = discussion_participants.discussion_id
            AND dp2.doctor_profile_id = (
                SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
            )
        )
    );

-- ============================================================================
-- DISCUSSION MESSAGES
-- ============================================================================
-- Doctors can view messages in discussions they participate in
CREATE POLICY "Doctors can view discussion messages"
    ON discussion_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM discussion_participants dp
            WHERE dp.discussion_id = discussion_messages.discussion_id
            AND dp.doctor_profile_id = (
                SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
            )
        )
    );

-- Doctors can create messages in discussions they participate in
CREATE POLICY "Doctors can create discussion messages"
    ON discussion_messages FOR INSERT
    WITH CHECK (
        get_user_role() = 'doctor' AND
        doctor_profile_id = (
            SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
        )
        AND EXISTS (
            SELECT 1 FROM discussion_participants dp
            WHERE dp.discussion_id = discussion_messages.discussion_id
            AND dp.doctor_profile_id = (
                SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
            )
        )
    );

-- ============================================================================
-- PATIENT-DOCTOR ASSIGNMENTS
-- ============================================================================
-- Auto-create assignment when appointment is created or report is shared
-- This is typically done via triggers or application logic

-- Doctors can view their own assignments
CREATE POLICY "Doctors can view own assignments"
    ON patient_doctor_assignments FOR SELECT
    USING (
        doctor_profile_id = (
            SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
        )
    );

-- Patients can view assignments involving them
CREATE POLICY "Patients can view own assignments"
    ON patient_doctor_assignments FOR SELECT
    USING (
        patient_profile_id IN (
            SELECT id FROM patient_profiles WHERE profile_id = get_user_profile()
        )
    );

-- ============================================================================
-- CHAT PRECISION MESSAGES
-- ============================================================================
-- Patients can view their own chat messages
CREATE POLICY "Patients can view own chat precision messages"
    ON chat_precision_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM pre_analyses pa
            WHERE pa.id = chat_precision_messages.pre_analysis_id
            AND pa.patient_profile_id IN (
                SELECT id FROM patient_profiles WHERE profile_id = get_user_profile()
            )
        )
    );

-- Patients can create chat messages for their pre-analyses
CREATE POLICY "Patients can create chat precision messages"
    ON chat_precision_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM pre_analyses pa
            WHERE pa.id = chat_precision_messages.pre_analysis_id
            AND pa.patient_profile_id IN (
                SELECT id FROM patient_profiles WHERE profile_id = get_user_profile()
            )
        )
    );

-- ============================================================================
-- DOCTOR CHAT MESSAGES
-- ============================================================================
-- Doctors and patients can view messages in their conversations
CREATE POLICY "Users can view own chat messages"
    ON doctor_chat_messages FOR SELECT
    USING (
        (
            get_user_role() = 'patient' AND
            patient_profile_id IN (
                SELECT id FROM patient_profiles WHERE profile_id = get_user_profile()
            )
        )
        OR
        (
            get_user_role() = 'doctor' AND
            doctor_profile_id = (
                SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
            )
        )
    );

-- Doctors and patients can create messages in their conversations
CREATE POLICY "Users can create chat messages"
    ON doctor_chat_messages FOR INSERT
    WITH CHECK (
        (
            get_user_role() = 'patient' AND
            patient_profile_id IN (
                SELECT id FROM patient_profiles WHERE profile_id = get_user_profile()
            )
            AND sender_type = 'patient'
        )
        OR
        (
            get_user_role() = 'doctor' AND
            doctor_profile_id = (
                SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
            )
            AND sender_type = 'doctor'
        )
    );

-- ============================================================================
-- TIMELINE EVENTS
-- ============================================================================
-- Patients can view their own timeline
CREATE POLICY "Patients can view own timeline"
    ON timeline_events FOR SELECT
    USING (
        patient_profile_id IN (
            SELECT id FROM patient_profiles WHERE profile_id = get_user_profile()
        )
    );

-- Doctors can view timeline of assigned patients
CREATE POLICY "Doctors can view assigned patient timeline"
    ON timeline_events FOR SELECT
    USING (
        get_user_role() = 'doctor' AND
        EXISTS (
            SELECT 1 FROM patient_doctor_assignments pda
            WHERE pda.patient_profile_id = timeline_events.patient_profile_id
            AND pda.doctor_profile_id = (
                SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
            )
        )
    );

-- ============================================================================
-- PRESCRIPTIONS
-- ============================================================================
-- Patients can view their own prescriptions
CREATE POLICY "Patients can view own prescriptions"
    ON prescriptions FOR SELECT
    USING (
        patient_profile_id IN (
            SELECT id FROM patient_profiles WHERE profile_id = get_user_profile()
        )
    );

-- Doctors can view prescriptions they issued
CREATE POLICY "Doctors can view own prescriptions"
    ON prescriptions FOR SELECT
    USING (
        doctor_profile_id = (
            SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
        )
    );

-- Doctors can create prescriptions for assigned patients
CREATE POLICY "Doctors can create prescriptions"
    ON prescriptions FOR INSERT
    WITH CHECK (
        get_user_role() = 'doctor' AND
        doctor_profile_id = (
            SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
        )
        AND EXISTS (
            SELECT 1 FROM patient_doctor_assignments pda
            WHERE pda.patient_profile_id = prescriptions.patient_profile_id
            AND pda.doctor_profile_id = (
                SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
            )
        )
    );

-- ============================================================================
-- EXAM RESULTS
-- ============================================================================
-- Patients can view their own exam results
CREATE POLICY "Patients can view own exam results"
    ON exam_results FOR SELECT
    USING (
        patient_profile_id IN (
            SELECT id FROM patient_profiles WHERE profile_id = get_user_profile()
        )
    );

-- Doctors can view exam results of assigned patients
CREATE POLICY "Doctors can view assigned patient exam results"
    ON exam_results FOR SELECT
    USING (
        get_user_role() = 'doctor' AND
        (
            doctor_profile_id = (
                SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
            )
            OR
            EXISTS (
                SELECT 1 FROM patient_doctor_assignments pda
                WHERE pda.patient_profile_id = exam_results.patient_profile_id
                AND pda.doctor_profile_id = (
                    SELECT id FROM doctor_profiles WHERE profile_id = get_user_profile()
                )
            )
        )
    );

-- ============================================================================
-- END OF RLS POLICIES
-- ============================================================================

