-- ============================================================================
-- SOLUTION COMPLÈTE - Supprimer définitivement les lignes de patient_profiles
-- ============================================================================
-- Problème: Les lignes restent visibles après "suppression" à cause du soft delete
-- Solution: Désactiver les triggers, supprimer dans le bon ordre (enfants d'abord)
-- ============================================================================

-- Étape 1: Désactiver TOUS les triggers de soft delete sur les tables liées
-- ============================================================================
DROP TRIGGER IF EXISTS trg_soft_delete_timeline_events ON timeline_events;
DROP TRIGGER IF EXISTS trg_soft_delete_discussion_messages ON discussion_messages;
DROP TRIGGER IF EXISTS trg_soft_delete_discussions ON discussions;
DROP TRIGGER IF EXISTS trg_soft_delete_documents ON documents;
DROP TRIGGER IF EXISTS trg_soft_delete_exam_results ON exam_results;
DROP TRIGGER IF EXISTS trg_soft_delete_prescriptions ON prescriptions;
DROP TRIGGER IF EXISTS trg_soft_delete_chat_precision_messages ON chat_precision_messages;
DROP TRIGGER IF EXISTS trg_soft_delete_diagnostic_hypotheses ON diagnostic_hypotheses;
DROP TRIGGER IF EXISTS trg_soft_delete_ai_reports ON ai_reports;
DROP TRIGGER IF EXISTS trg_soft_delete_pre_analyses ON pre_analyses;
DROP TRIGGER IF EXISTS trg_soft_delete_appointments ON appointments;
DROP TRIGGER IF EXISTS trg_soft_delete_doctor_notes ON doctor_notes;
DROP TRIGGER IF EXISTS trg_soft_delete_patient_profiles ON patient_profiles;

-- Étape 2: Supprimer dans le bon ordre (en commençant par les tables enfants)
-- ============================================================================

-- 2.1 Supprimer les messages de discussions
DELETE FROM discussion_messages;

-- 2.2 Supprimer les discussions
DELETE FROM discussions;

-- 2.3 Supprimer les messages de chat précision (référence pre_analyses)
DELETE FROM chat_precision_messages;

-- 2.4 Supprimer les événements de timeline
DELETE FROM timeline_events;

-- 2.5 Supprimer les hypothèses de diagnostic (référence ai_reports)
DELETE FROM diagnostic_hypotheses;

-- 2.6 Supprimer les rapports AI (référence pre_analyses et patient_profiles)
DELETE FROM ai_reports;

-- 2.7 Supprimer les analyses préliminaires (référence patient_profiles)
DELETE FROM pre_analyses;

-- 2.8 Supprimer les notes des médecins
DELETE FROM doctor_notes;

-- 2.9 Supprimer les rendez-vous
DELETE FROM appointments;

-- 2.10 Supprimer les documents
DELETE FROM documents;

-- 2.11 Supprimer les résultats d'examens
DELETE FROM exam_results;

-- 2.12 Supprimer les prescriptions
DELETE FROM prescriptions;

-- 2.13 Supprimer les assignations patient-médecin
DELETE FROM patient_doctor_assignments;

-- 2.14 Supprimer les messages de chat docteur
DELETE FROM doctor_chat_messages;

-- 2.15 Maintenant, supprimer les profils patients (plus de références)
DELETE FROM patient_profiles;

-- Étape 3: Vérifier que tout est supprimé
-- ============================================================================
SELECT 
    'chat_precision_messages' as table_name, COUNT(*) as lignes_restantes FROM chat_precision_messages
UNION ALL
SELECT 'timeline_events', COUNT(*) FROM timeline_events
UNION ALL
SELECT 'discussion_messages', COUNT(*) FROM discussion_messages
UNION ALL
SELECT 'discussions', COUNT(*) FROM discussions
UNION ALL
SELECT 'diagnostic_hypotheses', COUNT(*) FROM diagnostic_hypotheses
UNION ALL
SELECT 'ai_reports', COUNT(*) FROM ai_reports
UNION ALL
SELECT 'pre_analyses', COUNT(*) FROM pre_analyses
UNION ALL
SELECT 'doctor_notes', COUNT(*) FROM doctor_notes
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'documents', COUNT(*) FROM documents
UNION ALL
SELECT 'exam_results', COUNT(*) FROM exam_results
UNION ALL
SELECT 'prescriptions', COUNT(*) FROM prescriptions
UNION ALL
SELECT 'patient_doctor_assignments', COUNT(*) FROM patient_doctor_assignments
UNION ALL
SELECT 'doctor_chat_messages', COUNT(*) FROM doctor_chat_messages
UNION ALL
SELECT 'patient_profiles', COUNT(*) FROM patient_profiles;

-- Tous les compteurs devraient être 0

-- ============================================================================
-- IMPORTANT: Après avoir exécuté ce script, rafraîchissez la page dans Supabase
-- Les lignes ne devraient plus être visibles dans patient_profiles.
-- ============================================================================

