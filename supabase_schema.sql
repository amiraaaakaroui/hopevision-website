-- ============================================================================
-- HopeVisionAI - Supabase Database Schema
-- ============================================================================
-- Generated from frontend analysis
-- PostgreSQL / Supabase compatible
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PROFILES (links to auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    date_of_birth DATE,
    phone_number TEXT,
    country TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- ============================================================================
-- 2. PATIENT PROFILES (extends profiles)
-- ============================================================================
CREATE TABLE IF NOT EXISTS patient_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    patient_id TEXT UNIQUE, -- e.g., PAT-2025-00234
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    blood_group TEXT,
    allergies TEXT[], -- Array of allergies
    weight_kg DECIMAL(5,2),
    height_cm DECIMAL(5,2),
    medical_history TEXT, -- JSON or text field for medical history
    surgical_history TEXT,
    family_history TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_patient_profiles_profile_id ON patient_profiles(profile_id);
CREATE INDEX idx_patient_profiles_patient_id ON patient_profiles(patient_id);

-- ============================================================================
-- 3. DOCTOR PROFILES (extends profiles)
-- ============================================================================
CREATE TABLE IF NOT EXISTS doctor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    specialty TEXT NOT NULL, -- e.g., 'Médecine Générale', 'Cardiologie'
    rpps_number TEXT, -- French medical registration number
    license_number TEXT,
    bio TEXT,
    rating DECIMAL(3,2), -- e.g., 4.8
    total_reviews INTEGER DEFAULT 0,
    consultation_price DECIMAL(10,2), -- in TND
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_doctor_profiles_profile_id ON doctor_profiles(profile_id);
CREATE INDEX idx_doctor_profiles_specialty ON doctor_profiles(specialty);
CREATE INDEX idx_doctor_profiles_verified ON doctor_profiles(is_verified);

-- ============================================================================
-- 4. HOSPITALS / CLINICS (optional, for doctor affiliations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    country TEXT,
    phone_number TEXT,
    email TEXT,
    website TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS doctor_hospital_affiliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_profile_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    position TEXT, -- e.g., 'Chief of Cardiology'
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(doctor_profile_id, hospital_id)
);

CREATE INDEX idx_doctor_hospital_affiliations_doctor ON doctor_hospital_affiliations(doctor_profile_id);
CREATE INDEX idx_doctor_hospital_affiliations_hospital ON doctor_hospital_affiliations(hospital_id);

-- ============================================================================
-- 5. PRE-ANALYSES (patient symptom submissions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pre_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_profile_id UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'processing', 'completed', 'cancelled')),
    
    -- Input data
    text_input TEXT, -- Text description of symptoms
    voice_transcript TEXT, -- Transcribed voice input
    voice_audio_url TEXT, -- URL to stored audio file
    image_urls TEXT[], -- Array of image URLs
    document_urls TEXT[], -- Array of document URLs (PDFs, etc.)
    selected_chips TEXT[], -- Quick selection chips (e.g., ['5 jours', 'Toux sèche'])
    
    -- Processing metadata
    ai_processing_status TEXT CHECK (ai_processing_status IN ('pending', 'processing', 'completed', 'failed')),
    ai_processing_started_at TIMESTAMPTZ,
    ai_processing_completed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    submitted_at TIMESTAMPTZ
);

CREATE INDEX idx_pre_analyses_patient ON pre_analyses(patient_profile_id);
CREATE INDEX idx_pre_analyses_status ON pre_analyses(status);
CREATE INDEX idx_pre_analyses_created_at ON pre_analyses(created_at DESC);

-- ============================================================================
-- 6. AI REPORTS (generated from pre-analyses)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pre_analysis_id UUID NOT NULL UNIQUE REFERENCES pre_analyses(id) ON DELETE CASCADE,
    patient_profile_id UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    
    -- Overall assessment
    overall_severity TEXT CHECK (overall_severity IN ('low', 'medium', 'high')),
    overall_confidence DECIMAL(5,2), -- e.g., 78.00 for 78%
    summary TEXT,
    
    -- Main diagnosis hypothesis
    primary_diagnosis TEXT,
    primary_diagnosis_confidence DECIMAL(5,2),
    
    -- Recommendations
    recommendation_action TEXT, -- e.g., 'Consultation recommandée dans les 24-48h'
    recommendation_text TEXT,
    
    -- Explainability data (stored as JSONB for flexibility)
    explainability_data JSONB, -- Contains text analysis, voice analysis, image analysis details
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_reports_pre_analysis ON ai_reports(pre_analysis_id);
CREATE INDEX idx_ai_reports_patient ON ai_reports(patient_profile_id);
CREATE INDEX idx_ai_reports_created_at ON ai_reports(created_at DESC);

-- ============================================================================
-- 7. DIAGNOSTIC HYPOTHESES (multiple hypotheses per report)
-- ============================================================================
CREATE TABLE IF NOT EXISTS diagnostic_hypotheses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ai_report_id UUID NOT NULL REFERENCES ai_reports(id) ON DELETE CASCADE,
    disease_name TEXT NOT NULL,
    confidence DECIMAL(5,2) NOT NULL, -- e.g., 71.00
    severity TEXT CHECK (severity IN ('low', 'medium', 'high')),
    keywords TEXT[], -- e.g., ['toux sèche', 'fièvre', 'essoufflement']
    explanation TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    is_excluded BOOLEAN NOT NULL DEFAULT false, -- For hypotheses that were ruled out
    exclusion_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_diagnostic_hypotheses_report ON diagnostic_hypotheses(ai_report_id);
CREATE INDEX idx_diagnostic_hypotheses_primary ON diagnostic_hypotheses(ai_report_id, is_primary);

-- ============================================================================
-- 8. DOCUMENTS (medical documents uploaded by patients)
-- ============================================================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_profile_id UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    pre_analysis_id UUID REFERENCES pre_analyses(id) ON DELETE SET NULL,
    
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT, -- e.g., 'pdf', 'jpg', 'png'
    file_size_bytes INTEGER,
    
    -- AI extraction results
    ai_extraction_status TEXT CHECK (ai_extraction_status IN ('pending', 'processing', 'completed', 'failed')),
    extracted_data JSONB, -- Extracted medical data (e.g., lab results, values)
    extracted_at TIMESTAMPTZ,
    
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_patient ON documents(patient_profile_id);
CREATE INDEX idx_documents_pre_analysis ON documents(pre_analysis_id);

-- ============================================================================
-- 9. APPOINTMENTS / CONSULTATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_profile_id UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    doctor_profile_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
    pre_analysis_id UUID REFERENCES pre_analyses(id) ON DELETE SET NULL,
    ai_report_id UUID REFERENCES ai_reports(id) ON DELETE SET NULL,
    
    appointment_type TEXT NOT NULL CHECK (appointment_type IN ('teleconsultation', 'in_person', 'follow_up', 'lab_exam')),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    
    scheduled_date TIMESTAMPTZ NOT NULL,
    scheduled_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    
    -- Location (for in-person)
    location_type TEXT CHECK (location_type IN ('clinic', 'hospital', 'home', 'online')),
    location_address TEXT,
    
    -- Payment
    price DECIMAL(10,2),
    payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded', 'cancelled')),
    payment_method TEXT,
    
    -- Report sharing
    report_shared BOOLEAN NOT NULL DEFAULT false,
    report_shared_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    cancelled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_appointments_patient ON appointments(patient_profile_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_profile_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_scheduled_date ON appointments(scheduled_date);
CREATE INDEX idx_appointments_pre_analysis ON appointments(pre_analysis_id);

-- ============================================================================
-- 10. DOCTOR NOTES / DECISIONS (doctor's review of AI report)
-- ============================================================================
CREATE TABLE IF NOT EXISTS doctor_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_profile_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
    patient_profile_id UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    ai_report_id UUID REFERENCES ai_reports(id) ON DELETE SET NULL,
    
    -- Doctor's diagnosis
    doctor_diagnosis TEXT,
    doctor_notes TEXT,
    
    -- Validation of AI suggestions
    ai_diagnosis_validated BOOLEAN,
    ai_diagnosis_modified BOOLEAN DEFAULT false,
    validation_comment TEXT,
    
    -- Prescription (can be text or structured)
    prescription_text TEXT,
    prescription_data JSONB, -- Structured prescription data
    
    -- Recommendations
    recommended_exams JSONB, -- Array of recommended exams with priorities
    treatment_plan TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_doctor_notes_doctor ON doctor_notes(doctor_profile_id);
CREATE INDEX idx_doctor_notes_patient ON doctor_notes(patient_profile_id);
CREATE INDEX idx_doctor_notes_appointment ON doctor_notes(appointment_id);
CREATE INDEX idx_doctor_notes_ai_report ON doctor_notes(ai_report_id);

-- ============================================================================
-- 11. COLLABORATIVE DISCUSSIONS (doctor-to-doctor collaboration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS discussions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_profile_id UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    ai_report_id UUID REFERENCES ai_reports(id) ON DELETE SET NULL,
    created_by_doctor_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
    title TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_discussions_patient ON discussions(patient_profile_id);
CREATE INDEX idx_discussions_created_by ON discussions(created_by_doctor_id);
CREATE INDEX idx_discussions_status ON discussions(status);

-- ============================================================================
-- 12. DISCUSSION PARTICIPANTS (many-to-many: doctors in discussions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS discussion_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
    doctor_profile_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_read_at TIMESTAMPTZ,
    UNIQUE(discussion_id, doctor_profile_id)
);

CREATE INDEX idx_discussion_participants_discussion ON discussion_participants(discussion_id);
CREATE INDEX idx_discussion_participants_doctor ON discussion_participants(doctor_profile_id);

-- ============================================================================
-- 13. DISCUSSION MESSAGES (messages in collaborative discussions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS discussion_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
    doctor_profile_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    mentions JSONB, -- Array of mentioned doctor IDs or specialties (e.g., ['@pneumo', '@cardio'])
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_discussion_messages_discussion ON discussion_messages(discussion_id);
CREATE INDEX idx_discussion_messages_doctor ON discussion_messages(doctor_profile_id);
CREATE INDEX idx_discussion_messages_created_at ON discussion_messages(created_at DESC);

-- ============================================================================
-- 14. PATIENT-DOCTOR ASSIGNMENTS (which doctors can see which patients)
-- ============================================================================
CREATE TABLE IF NOT EXISTS patient_doctor_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_profile_id UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    doctor_profile_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
    assignment_type TEXT NOT NULL CHECK (assignment_type IN ('appointment', 'shared_report', 'collaboration', 'cabinet_patient')),
    ai_report_id UUID REFERENCES ai_reports(id) ON DELETE SET NULL, -- If report was shared
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(patient_profile_id, doctor_profile_id, assignment_type, ai_report_id)
);

CREATE INDEX idx_patient_doctor_assignments_patient ON patient_doctor_assignments(patient_profile_id);
CREATE INDEX idx_patient_doctor_assignments_doctor ON patient_doctor_assignments(doctor_profile_id);

-- ============================================================================
-- 15. CHAT PRECISION MESSAGES (AI-patient chat during pre-analysis)
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_precision_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pre_analysis_id UUID NOT NULL REFERENCES pre_analyses(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('ai', 'patient')),
    message_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_precision_messages_pre_analysis ON chat_precision_messages(pre_analysis_id);
CREATE INDEX idx_chat_precision_messages_created_at ON chat_precision_messages(created_at);

-- ============================================================================
-- 16. DOCTOR CHAT RELAY (doctor-patient real-time chat)
-- ============================================================================
CREATE TABLE IF NOT EXISTS doctor_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_profile_id UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    doctor_profile_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('doctor', 'patient')),
    message_text TEXT NOT NULL,
    status TEXT CHECK (status IN ('sent', 'delivered', 'read')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at TIMESTAMPTZ
);

CREATE INDEX idx_doctor_chat_messages_patient ON doctor_chat_messages(patient_profile_id);
CREATE INDEX idx_doctor_chat_messages_doctor ON doctor_chat_messages(doctor_profile_id);
CREATE INDEX idx_doctor_chat_messages_created_at ON doctor_chat_messages(created_at DESC);

-- ============================================================================
-- 17. ANAMNESIS QUESTIONS (AI-generated questions during consultation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS anamnesis_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pre_analysis_id UUID NOT NULL REFERENCES pre_analyses(id) ON DELETE CASCADE,
    ai_report_id UUID REFERENCES ai_reports(id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    question_type TEXT, -- e.g., 'clarification', 'exclusion', 'confirmation'
    answer_text TEXT,
    answered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_anamnesis_questions_pre_analysis ON anamnesis_questions(pre_analysis_id);
CREATE INDEX idx_anamnesis_questions_ai_report ON anamnesis_questions(ai_report_id);

-- ============================================================================
-- 18. TIMELINE EVENTS (patient care timeline)
-- ============================================================================
CREATE TABLE IF NOT EXISTS timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_profile_id UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('pre_analysis', 'ai_report', 'anamnesis', 'appointment', 'exam', 'doctor_note', 'prescription', 'reminder')),
    event_title TEXT NOT NULL,
    event_description TEXT,
    status TEXT CHECK (status IN ('completed', 'active', 'pending')),
    related_pre_analysis_id UUID REFERENCES pre_analyses(id) ON DELETE SET NULL,
    related_appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    related_ai_report_id UUID REFERENCES ai_reports(id) ON DELETE SET NULL,
    event_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_timeline_events_patient ON timeline_events(patient_profile_id);
CREATE INDEX idx_timeline_events_event_date ON timeline_events(event_date DESC);
CREATE INDEX idx_timeline_events_status ON timeline_events(status);

-- ============================================================================
-- 19. PRESCRIPTIONS (structured prescriptions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_profile_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
    patient_profile_id UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    doctor_note_id UUID REFERENCES doctor_notes(id) ON DELETE SET NULL,
    
    prescription_text TEXT NOT NULL,
    prescription_data JSONB, -- Structured data: medications, dosages, frequencies
    
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX idx_prescriptions_doctor ON prescriptions(doctor_profile_id);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_profile_id);
CREATE INDEX idx_prescriptions_appointment ON prescriptions(appointment_id);

-- ============================================================================
-- 20. LAB RESULTS / EXAM RESULTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_profile_id UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    doctor_profile_id UUID REFERENCES doctor_profiles(id) ON DELETE SET NULL,
    
    exam_type TEXT NOT NULL, -- e.g., 'blood_test', 'xray', 'pcr'
    exam_name TEXT NOT NULL, -- e.g., 'Radiographie thoracique', 'PCR COVID-19'
    lab_name TEXT,
    
    results_data JSONB, -- Structured results (e.g., {"CRP": "38 mg/L", "globules_blancs": "11.2 × 10⁹/L"})
    results_file_url TEXT, -- PDF or image of results
    
    status TEXT CHECK (status IN ('pending', 'completed', 'cancelled')),
    ordered_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exam_results_patient ON exam_results(patient_profile_id);
CREATE INDEX idx_exam_results_appointment ON exam_results(appointment_id);
CREATE INDEX idx_exam_results_status ON exam_results(status);

-- ============================================================================
-- TRIGGERS: Update updated_at timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_profiles_updated_at BEFORE UPDATE ON patient_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctor_profiles_updated_at BEFORE UPDATE ON doctor_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pre_analyses_updated_at BEFORE UPDATE ON pre_analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_reports_updated_at BEFORE UPDATE ON ai_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctor_notes_updated_at BEFORE UPDATE ON doctor_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discussions_updated_at BEFORE UPDATE ON discussions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discussion_messages_updated_at BEFORE UPDATE ON discussion_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctor_chat_messages_updated_at BEFORE UPDATE ON doctor_chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

