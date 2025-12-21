-- ============================================================================
-- HopeVisionAI - Script de nettoyage pour comptes de test
-- ============================================================================
-- Ce script permet de supprimer proprement un compte utilisateur de test
-- Usage: Appelez delete_test_account('email@example.com') ou delete_test_account_by_user_id('uuid')
-- ============================================================================

-- Fonction pour supprimer un compte de test par email
CREATE OR REPLACE FUNCTION delete_test_account_by_email(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    user_uuid UUID;
    deleted_count INTEGER := 0;
BEGIN
    -- Récupérer l'ID de l'utilisateur depuis auth.users
    SELECT id INTO user_uuid
    FROM auth.users
    WHERE email = user_email;

    IF user_uuid IS NULL THEN
        RETURN 'Utilisateur non trouvé avec l''email: ' || user_email;
    END IF;

    -- Supprimer via la fonction helper
    RETURN delete_test_account_by_user_id(user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction principale pour supprimer un compte de test par user_id
CREATE OR REPLACE FUNCTION delete_test_account_by_user_id(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    profile_record RECORD;
    deleted_count INTEGER := 0;
BEGIN
    -- Vérifier que l'utilisateur existe
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_uuid) THEN
        RETURN 'Utilisateur non trouvé avec l''ID: ' || user_uuid::TEXT;
    END IF;

    -- 1. Supprimer les données liées au profil dans l'ordre correct
    -- Commencer par les tables qui référencent patient_profiles ou doctor_profiles
    
    -- Récupérer le profil pour connaître le rôle
    SELECT id, role INTO profile_record
    FROM profiles
    WHERE user_id = user_uuid;

    IF profile_record.id IS NOT NULL THEN
        -- Supprimer les données selon le rôle
        IF profile_record.role = 'patient' THEN
            -- Supprimer les données liées au patient_profile (dans l'ordre des dépendances)
            DELETE FROM timeline_events WHERE patient_profile_id IN (
                SELECT id FROM patient_profiles WHERE profile_id = profile_record.id
            );
            DELETE FROM appointments WHERE patient_profile_id IN (
                SELECT id FROM patient_profiles WHERE profile_id = profile_record.id
            );
            DELETE FROM documents WHERE patient_profile_id IN (
                SELECT id FROM patient_profiles WHERE profile_id = profile_record.id
            );
            DELETE FROM prescriptions WHERE patient_profile_id IN (
                SELECT id FROM patient_profiles WHERE profile_id = profile_record.id
            );
            DELETE FROM exam_results WHERE patient_profile_id IN (
                SELECT id FROM patient_profiles WHERE profile_id = profile_record.id
            );
            DELETE FROM doctor_notes WHERE patient_profile_id IN (
                SELECT id FROM patient_profiles WHERE profile_id = profile_record.id
            );
            DELETE FROM pre_analyses WHERE patient_profile_id IN (
                SELECT id FROM patient_profiles WHERE profile_id = profile_record.id
            );
            DELETE FROM discussions WHERE patient_profile_id IN (
                SELECT id FROM patient_profiles WHERE profile_id = profile_record.id
            );
            
            -- Supprimer les assignations médecin-patient
            DELETE FROM patient_doctor_assignments WHERE patient_profile_id IN (
                SELECT id FROM patient_profiles WHERE profile_id = profile_record.id
            );
            
            -- Supprimer le patient_profile (sera supprimé en cascade si la contrainte est correcte)
            DELETE FROM patient_profiles WHERE profile_id = profile_record.id;
            
        ELSIF profile_record.role = 'doctor' THEN
            -- Supprimer les données liées au doctor_profile
            DELETE FROM patient_doctor_assignments WHERE doctor_profile_id IN (
                SELECT id FROM doctor_profiles WHERE profile_id = profile_record.id
            );
            DELETE FROM doctor_hospital_affiliations WHERE doctor_profile_id IN (
                SELECT id FROM doctor_profiles WHERE profile_id = profile_record.id
            );
            
            -- Supprimer le doctor_profile
            DELETE FROM doctor_profiles WHERE profile_id = profile_record.id;
        END IF;

        -- Supprimer le profil (sera supprimé en cascade si la contrainte est correcte)
        DELETE FROM profiles WHERE id = profile_record.id;
    END IF;

    -- 2. Supprimer l'utilisateur depuis auth.users
    -- Cela déclenchera CASCADE pour supprimer automatiquement les profils liés
    DELETE FROM auth.users WHERE id = user_uuid;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    IF deleted_count > 0 THEN
        RETURN 'Compte supprimé avec succès. Utilisateur ID: ' || user_uuid::TEXT;
    ELSE
        RETURN 'Aucun compte supprimé. Utilisateur ID: ' || user_uuid::TEXT;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Erreur lors de la suppression: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction helper pour lister tous les comptes de test (optionnel)
CREATE OR REPLACE FUNCTION list_test_accounts()
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    role TEXT,
    full_name TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id AS user_id,
        u.email,
        p.role,
        p.full_name,
        u.created_at
    FROM auth.users u
    LEFT JOIN profiles p ON p.user_id = u.id
    ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour supprimer tous les comptes de test (ATTENTION: utilisation prudente!)
CREATE OR REPLACE FUNCTION delete_all_test_accounts()
RETURNS TEXT AS $$
DECLARE
    user_record RECORD;
    deleted_count INTEGER := 0;
    result_text TEXT := '';
BEGIN
    -- Parcourir tous les utilisateurs et les supprimer un par un
    FOR user_record IN 
        SELECT id, email FROM auth.users
        ORDER BY created_at
    LOOP
        BEGIN
            result_text := delete_test_account_by_user_id(user_record.id);
            deleted_count := deleted_count + 1;
        EXCEPTION
            WHEN OTHERS THEN
                result_text := result_text || E'\nErreur pour ' || user_record.email || ': ' || SQLERRM;
        END;
    END LOOP;

    RETURN 'Suppression terminée. ' || deleted_count || ' comptes traités.' || E'\n' || result_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Exemples d'utilisation:
-- ============================================================================
-- 
-- 1. Supprimer un compte par email:
--    SELECT delete_test_account_by_email('test@example.com');
--
-- 2. Supprimer un compte par user_id:
--    SELECT delete_test_account_by_user_id('uuid-here');
--
-- 3. Lister tous les comptes:
--    SELECT * FROM list_test_accounts();
--
-- 4. Supprimer tous les comptes (ATTENTION!):
--    SELECT delete_all_test_accounts();
--
-- ============================================================================

