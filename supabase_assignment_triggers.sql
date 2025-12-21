-- ============================================================================
-- HopeVisionAI - Automatic Assignment Triggers
-- ============================================================================
-- 1. Auto-assigns doctors to patients when appointments are created/updated
-- 2. Ensures data consistency for access control
-- ============================================================================

-- 1. Function: Auto Assign Doctor
-- ============================================================================
CREATE OR REPLACE FUNCTION auto_assign_doctor_on_appointment()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if we have both patient and doctor IDs
    IF NEW.patient_profile_id IS NOT NULL AND NEW.doctor_profile_id IS NOT NULL THEN
        
        -- Insert assignment if it doesn't exist
        -- We use ON CONFLICT DO NOTHING to avoid errors if assignment exists
        -- Note: We don't update existing assignments, just ensure one exists
        INSERT INTO patient_doctor_assignments (
            patient_profile_id, 
            doctor_profile_id, 
            assignment_type,
            assigned_at
        )
        VALUES (
            NEW.patient_profile_id, 
            NEW.doctor_profile_id, 
            'appointment',
            NOW()
        )
        ON CONFLICT (patient_profile_id, doctor_profile_id, assignment_type, ai_report_id) 
        DO NOTHING;
        
        -- Also ensure a generic 'cabinet_patient' assignment exists if this is a new relationship?
        -- For now, 'appointment' type is sufficient for RLS as per audit.
        
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger: Auto Assign on Appointment Insert/Update
-- ============================================================================
DROP TRIGGER IF EXISTS trg_auto_assign_doctor ON appointments;

CREATE TRIGGER trg_auto_assign_doctor
AFTER INSERT OR UPDATE OF doctor_profile_id, patient_profile_id ON appointments
FOR EACH ROW
EXECUTE FUNCTION auto_assign_doctor_on_appointment();

-- ============================================================================
-- End of Assignment Triggers
-- ============================================================================
