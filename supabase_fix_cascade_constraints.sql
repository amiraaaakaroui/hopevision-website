-- ============================================================================
-- HopeVisionAI - Correction des contraintes CASCADE pour permettre la suppression propre
-- ============================================================================
-- Ce script corrige les contraintes de clé étrangère pour permettre la suppression
-- en cascade des comptes de test sans erreur
-- ============================================================================

-- Vérifier et corriger la contrainte de patient_profiles
-- La contrainte doit être ON DELETE CASCADE (pas SET NULL car profile_id est NOT NULL)

-- 1. Supprimer la contrainte existante si elle existe avec SET NULL
DO $$ 
BEGIN
    -- Supprimer la contrainte si elle existe
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'patient_profiles_profile_id_fkey'
    ) THEN
        ALTER TABLE patient_profiles 
        DROP CONSTRAINT IF EXISTS patient_profiles_profile_id_fkey;
        
        -- Recréer avec CASCADE
        ALTER TABLE patient_profiles 
        ADD CONSTRAINT patient_profiles_profile_id_fkey 
        FOREIGN KEY (profile_id) 
        REFERENCES profiles(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Contrainte patient_profiles_profile_id_fkey recréée avec CASCADE';
    ELSE
        -- Si la contrainte n'existe pas, la créer
        ALTER TABLE patient_profiles 
        ADD CONSTRAINT patient_profiles_profile_id_fkey 
        FOREIGN KEY (profile_id) 
        REFERENCES profiles(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Contrainte patient_profiles_profile_id_fkey créée avec CASCADE';
    END IF;
END $$;

-- 2. Faire de même pour doctor_profiles
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'doctor_profiles_profile_id_fkey'
    ) THEN
        ALTER TABLE doctor_profiles 
        DROP CONSTRAINT IF EXISTS doctor_profiles_profile_id_fkey;
        
        ALTER TABLE doctor_profiles 
        ADD CONSTRAINT doctor_profiles_profile_id_fkey 
        FOREIGN KEY (profile_id) 
        REFERENCES profiles(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Contrainte doctor_profiles_profile_id_fkey recréée avec CASCADE';
    ELSE
        ALTER TABLE doctor_profiles 
        ADD CONSTRAINT doctor_profiles_profile_id_fkey 
        FOREIGN KEY (profile_id) 
        REFERENCES profiles(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Contrainte doctor_profiles_profile_id_fkey créée avec CASCADE';
    END IF;
END $$;

-- Vérification: Afficher les contraintes créées
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.referential_constraints AS rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name IN ('patient_profiles', 'doctor_profiles')
    AND tc.constraint_type = 'FOREIGN KEY'
    AND tc.constraint_name LIKE '%profile_id%';

