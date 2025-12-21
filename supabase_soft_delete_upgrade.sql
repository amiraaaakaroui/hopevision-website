-- ============================================================================
-- HopeVisionAI - Soft Delete Upgrade Migration
-- ============================================================================
-- 1. Adds deleted_at column to all medical tables
-- 2. Implements soft delete triggers (intercepts DELETE)
-- 3. Removes dangerous ON DELETE CASCADE constraints
-- ============================================================================

-- 1. Helper Function for Soft Deletes
-- ============================================================================
CREATE OR REPLACE FUNCTION soft_delete_row() 
RETURNS TRIGGER AS $$
BEGIN
    -- Set deleted_at to current timestamp instead of removing the row
    UPDATE public.patient_profiles SET deleted_at = NOW() WHERE id = OLD.id AND TG_TABLE_NAME = 'patient_profiles';
    UPDATE public.pre_analyses SET deleted_at = NOW() WHERE id = OLD.id AND TG_TABLE_NAME = 'pre_analyses';
    UPDATE public.ai_reports SET deleted_at = NOW() WHERE id = OLD.id AND TG_TABLE_NAME = 'ai_reports';
    UPDATE public.appointments SET deleted_at = NOW() WHERE id = OLD.id AND TG_TABLE_NAME = 'appointments';
    UPDATE public.doctor_notes SET deleted_at = NOW() WHERE id = OLD.id AND TG_TABLE_NAME = 'doctor_notes';
    UPDATE public.diagnostic_hypotheses SET deleted_at = NOW() WHERE id = OLD.id AND TG_TABLE_NAME = 'diagnostic_hypotheses';
    UPDATE public.prescriptions SET deleted_at = NOW() WHERE id = OLD.id AND TG_TABLE_NAME = 'prescriptions';
    UPDATE public.exam_results SET deleted_at = NOW() WHERE id = OLD.id AND TG_TABLE_NAME = 'exam_results';
    UPDATE public.documents SET deleted_at = NOW() WHERE id = OLD.id AND TG_TABLE_NAME = 'documents';
    UPDATE public.discussions SET deleted_at = NOW() WHERE id = OLD.id AND TG_TABLE_NAME = 'discussions';
    UPDATE public.discussion_messages SET deleted_at = NOW() WHERE id = OLD.id AND TG_TABLE_NAME = 'discussion_messages';
    UPDATE public.timeline_events SET deleted_at = NOW() WHERE id = OLD.id AND TG_TABLE_NAME = 'timeline_events';
    
    -- For generic usage if we used dynamic SQL, but explicit is safer for now.
    -- Returning NULL prevents the actual DELETE operation
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Better Generic Soft Delete Function (Dynamic)
CREATE OR REPLACE FUNCTION soft_delete_row_generic() 
RETURNS TRIGGER AS $$
BEGIN
    EXECUTE format('UPDATE %I SET deleted_at = NOW() WHERE id = $1', TG_TABLE_NAME) USING OLD.id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Apply Changes to Tables
-- ============================================================================

-- List of tables to upgrade
-- patient_profiles, pre_analyses, ai_reports, appointments, doctor_notes, 
-- diagnostic_hypotheses, prescriptions, exam_results, documents, 
-- discussions, discussion_messages, timeline_events

-- Macro for upgrading a table
DO $$ 
DECLARE 
    t text;
    tables text[] := ARRAY[
        'patient_profiles', 'pre_analyses', 'ai_reports', 'appointments', 
        'doctor_notes', 'diagnostic_hypotheses', 'prescriptions', 'exam_results', 
        'documents', 'discussions', 'discussion_messages', 'timeline_events'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        -- Add deleted_at column if it doesn't exist
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL', t);
        
        -- Create Trigger for Soft Delete (intercept DELETE)
        EXECUTE format('DROP TRIGGER IF EXISTS trg_soft_delete_%I ON %I', t, t);
        EXECUTE format('CREATE TRIGGER trg_soft_delete_%I BEFORE DELETE ON %I FOR EACH ROW EXECUTE FUNCTION soft_delete_row_generic()', t, t);
    END LOOP;
END $$;

-- 3. Remove Dangerous Cascades & Update FKs
-- ============================================================================
-- We need to drop existing FKs with CASCADE and recreate them with SET NULL or RESTRICT
-- This is critical to prevent accidental mass deletion from parents

-- Patient Profiles -> Profiles
ALTER TABLE patient_profiles DROP CONSTRAINT IF EXISTS patient_profiles_profile_id_fkey;
ALTER TABLE patient_profiles ADD CONSTRAINT patient_profiles_profile_id_fkey 
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Pre Analyses -> Patient Profiles
ALTER TABLE pre_analyses DROP CONSTRAINT IF EXISTS pre_analyses_patient_profile_id_fkey;
ALTER TABLE pre_analyses ADD CONSTRAINT pre_analyses_patient_profile_id_fkey 
    FOREIGN KEY (patient_profile_id) REFERENCES patient_profiles(id) ON DELETE RESTRICT;

-- AI Reports -> Pre Analyses
ALTER TABLE ai_reports DROP CONSTRAINT IF EXISTS ai_reports_pre_analysis_id_fkey;
ALTER TABLE ai_reports ADD CONSTRAINT ai_reports_pre_analysis_id_fkey 
    FOREIGN KEY (pre_analysis_id) REFERENCES pre_analyses(id) ON DELETE RESTRICT;

-- Diagnostic Hypotheses -> AI Reports
ALTER TABLE diagnostic_hypotheses DROP CONSTRAINT IF EXISTS diagnostic_hypotheses_ai_report_id_fkey;
ALTER TABLE diagnostic_hypotheses ADD CONSTRAINT diagnostic_hypotheses_ai_report_id_fkey 
    FOREIGN KEY (ai_report_id) REFERENCES ai_reports(id) ON DELETE RESTRICT;

-- Documents -> Patient Profiles
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_patient_profile_id_fkey;
ALTER TABLE documents ADD CONSTRAINT documents_patient_profile_id_fkey 
    FOREIGN KEY (patient_profile_id) REFERENCES patient_profiles(id) ON DELETE RESTRICT;

-- Appointments -> Patient Profiles
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_patient_profile_id_fkey;
ALTER TABLE appointments ADD CONSTRAINT appointments_patient_profile_id_fkey 
    FOREIGN KEY (patient_profile_id) REFERENCES patient_profiles(id) ON DELETE RESTRICT;

-- Doctor Notes -> Patient Profiles
ALTER TABLE doctor_notes DROP CONSTRAINT IF EXISTS doctor_notes_patient_profile_id_fkey;
ALTER TABLE doctor_notes ADD CONSTRAINT doctor_notes_patient_profile_id_fkey 
    FOREIGN KEY (patient_profile_id) REFERENCES patient_profiles(id) ON DELETE RESTRICT;

-- Discussions -> Patient Profiles
ALTER TABLE discussions DROP CONSTRAINT IF EXISTS discussions_patient_profile_id_fkey;
ALTER TABLE discussions ADD CONSTRAINT discussions_patient_profile_id_fkey 
    FOREIGN KEY (patient_profile_id) REFERENCES patient_profiles(id) ON DELETE RESTRICT;

-- Timeline Events -> Patient Profiles
ALTER TABLE timeline_events DROP CONSTRAINT IF EXISTS timeline_events_patient_profile_id_fkey;
ALTER TABLE timeline_events ADD CONSTRAINT timeline_events_patient_profile_id_fkey 
    FOREIGN KEY (patient_profile_id) REFERENCES patient_profiles(id) ON DELETE RESTRICT;

-- Prescriptions -> Patient Profiles
ALTER TABLE prescriptions DROP CONSTRAINT IF EXISTS prescriptions_patient_profile_id_fkey;
ALTER TABLE prescriptions ADD CONSTRAINT prescriptions_patient_profile_id_fkey 
    FOREIGN KEY (patient_profile_id) REFERENCES patient_profiles(id) ON DELETE RESTRICT;

-- Exam Results -> Patient Profiles
ALTER TABLE exam_results DROP CONSTRAINT IF EXISTS exam_results_patient_profile_id_fkey;
ALTER TABLE exam_results ADD CONSTRAINT exam_results_patient_profile_id_fkey 
    FOREIGN KEY (patient_profile_id) REFERENCES patient_profiles(id) ON DELETE RESTRICT;

-- ============================================================================
-- End of Soft Delete Upgrade
-- ============================================================================
