-- ============================================================================
-- SOLUTION RAPIDE - Supprimer définitivement les lignes de patient_profiles
-- ============================================================================
-- Problème: Les lignes restent visibles après "suppression" à cause du soft delete
-- Solution: Désactiver le trigger de soft delete et supprimer réellement
-- ============================================================================

-- Étape 1: Désactiver le trigger de soft delete
DROP TRIGGER IF EXISTS trg_soft_delete_patient_profiles ON patient_profiles;

-- Étape 2: Vérifier que le trigger est supprimé (devrait retourner 0 lignes)
SELECT 
    trigger_name,
    event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'patient_profiles'
AND trigger_name LIKE '%soft_delete%';

-- Étape 3: Maintenant vous pouvez supprimer les lignes normalement
-- Option A: Supprimer toutes les lignes
DELETE FROM patient_profiles;

-- Option B: Ou supprimer seulement certaines lignes (décommentez et modifiez)
-- DELETE FROM patient_profiles 
-- WHERE profile_id IN (
--     SELECT id FROM profiles WHERE email LIKE '%test%@%'
-- );

-- Étape 4: Vérifier la suppression
SELECT COUNT(*) as lignes_restantes FROM patient_profiles;
-- Devrait retourner 0 si tout est supprimé

-- ============================================================================
-- IMPORTANT: Après avoir nettoyé, rafraîchissez la page dans Supabase Table Editor
-- Les lignes ne devraient plus être visibles.
-- ============================================================================

