-- ============================================================================
-- HopeVisionAI - Fix Profiles with Wrong Role
-- ============================================================================
-- This script checks and fixes profiles that have been created with the wrong role
-- Use this if you have existing profiles with incorrect roles
-- ============================================================================

-- Check for profiles with wrong role based on user metadata
-- ============================================================================
SELECT 
    p.id,
    p.user_id,
    p.role as current_role,
    p.email,
    au.raw_user_meta_data->>'role' as metadata_role,
    CASE 
        WHEN au.raw_user_meta_data->>'role' IS NOT NULL 
        THEN au.raw_user_meta_data->>'role'
        ELSE 'patient'
    END as expected_role
FROM profiles p
JOIN auth.users au ON p.user_id = au.id
WHERE p.role != COALESCE(au.raw_user_meta_data->>'role', 'patient')
AND p.is_deleted = false;

-- ============================================================================
-- Fix function: Correct profile role based on user metadata
-- ============================================================================
CREATE OR REPLACE FUNCTION fix_profile_role(user_email TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
    user_record RECORD;
    profile_record RECORD;
    expected_role TEXT;
    current_role TEXT;
BEGIN
    -- Get user and their metadata
    SELECT id, raw_user_meta_data INTO user_record
    FROM auth.users
    WHERE email = user_email;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'User not found'::TEXT;
        RETURN;
    END IF;
    
    -- Determine expected role from metadata
    expected_role := COALESCE(user_record.raw_user_meta_data->>'role', 'patient');
    
    -- Get existing profile
    SELECT id, role INTO profile_record
    FROM profiles
    WHERE user_id = user_record.id
    AND is_deleted = false;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Profile not found'::TEXT;
        RETURN;
    END IF;
    
    current_role := profile_record.role;
    
    -- If role is already correct, return success
    IF current_role = expected_role THEN
        RETURN QUERY SELECT TRUE, 'Role is already correct'::TEXT;
        RETURN;
    END IF;
    
    -- Delete role-specific profile if it exists
    IF current_role = 'patient' THEN
        DELETE FROM patient_profiles WHERE profile_id = profile_record.id;
    ELSIF current_role = 'doctor' THEN
        DELETE FROM doctor_profiles WHERE profile_id = profile_record.id;
    END IF;
    
    -- Update profile role
    UPDATE profiles
    SET role = expected_role
    WHERE id = profile_record.id;
    
    -- Create correct role-specific profile
    IF expected_role = 'patient' THEN
        INSERT INTO patient_profiles (profile_id)
        VALUES (profile_record.id)
        ON CONFLICT (profile_id) DO NOTHING;
    ELSIF expected_role = 'doctor' THEN
        INSERT INTO doctor_profiles (profile_id, specialty, is_verified)
        VALUES (profile_record.id, 'Médecine générale', false)
        ON CONFLICT (profile_id) DO NOTHING;
    END IF;
    
    RETURN QUERY SELECT TRUE, 
        format('Role corrected from %s to %s', current_role, expected_role)::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Example usage:
-- ============================================================================
-- SELECT * FROM fix_profile_role('user@example.com');
--
-- ============================================================================
-- To fix all profiles with wrong roles:
-- ============================================================================
-- DO $$
-- DECLARE
--     user_email TEXT;
-- BEGIN
--     FOR user_email IN 
--         SELECT DISTINCT p.email
--         FROM profiles p
--         JOIN auth.users au ON p.user_id = au.id
--         WHERE p.role != COALESCE(au.raw_user_meta_data->>'role', 'patient')
--         AND p.is_deleted = false
--     LOOP
--         PERFORM fix_profile_role(user_email);
--     END LOOP;
-- END $$;
-- ============================================================================
