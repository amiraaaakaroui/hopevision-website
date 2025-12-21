# Guide de Démarrage Rapide - Système de Réservation

## Installation et Configuration

### 1. Exécuter les Scripts SQL

Exécuter dans l'ordre dans Supabase SQL Editor :

1. **Créer la table external_doctors :**
   ```sql
   -- Exécuter: supabase_doctors_medin_schema.sql
   ```

2. **Créer la table doctor_availability (optionnel pour MVP) :**
   ```sql
   -- Exécuter: supabase_doctor_availability.sql
   ```

3. **Insérer des médecins de test :**
   ```sql
   -- Exécuter: supabase_insert_test_doctors.sql
   ```

### 2. Vérifier les Médecins

Vérifier que les médecins sont bien insérés :

```sql
SELECT id, name, specialty, city, rating, consultation_price, accepts_teleconsultation
FROM external_doctors
WHERE is_active = true
ORDER BY name;
```

Vous devriez voir 10 médecins de test.

---

## Test du Flux Complet

### Étape 1 : Créer une Pré-analyse

1. Se connecter en tant que patient
2. Aller dans "Nouvelle pré-analyse"
3. Compléter :
   - Consentement
   - Symptômes (texte + puces)
   - Chat de précision (2-3 questions)
4. Générer le rapport IA

### Étape 2 : Réserver un Rendez-vous

1. Dans le rapport détaillé, cliquer sur "Prendre Rendez-vous"
2. **Vérifier** : Le contexte médical s'affiche (vrai diagnostic)
3. Sélectionner un service (ex: Téléconsultation)
4. **Vérifier** : Liste de médecins chargée depuis la base
5. **Vérifier** : Médecins recommandés par Léa affichés en premier
6. Sélectionner un médecin recommandé
7. **Vérifier** : Calendrier avec 14 prochains jours
8. Sélectionner une date disponible
9. **Vérifier** : Créneaux horaires chargés (9h-18h)
10. Sélectionner un créneau
11. Remplir le formulaire de paiement
12. Cocher "J'accepte les conditions"
13. Cliquer sur "Confirmer et Payer"
14. **Vérifier** : Redirection vers confirmation
15. **Vérifier** : Détails du rendez-vous affichés

### Étape 3 : Vérifier en Base de Données

```sql
-- Vérifier le rendez-vous créé
SELECT 
    a.id,
    a.scheduled_date,
    a.scheduled_time,
    a.status,
    a.report_shared,
    dp.name as doctor_name,
    p.full_name as patient_name
FROM appointments a
LEFT JOIN external_doctors ed ON a.doctor_profile_id = ed.id
LEFT JOIN doctor_profiles dp ON a.doctor_profile_id = dp.id
LEFT JOIN profiles p ON a.patient_profile_id = (
    SELECT profile_id FROM patient_profiles WHERE id = a.patient_profile_id
)
ORDER BY a.created_at DESC
LIMIT 1;

-- Vérifier l'assignment
SELECT * FROM patient_doctor_assignments
ORDER BY assigned_at DESC LIMIT 1;

-- Vérifier l'événement timeline
SELECT * FROM timeline_events
WHERE event_type = 'appointment'
ORDER BY created_at DESC LIMIT 1;
```

---

## Dépannage

### Problème : Aucun médecin affiché

**Solution:**
1. Vérifier que `external_doctors` contient des médecins :
   ```sql
   SELECT COUNT(*) FROM external_doctors WHERE is_active = true;
   ```
2. Vérifier les RLS policies :
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'external_doctors';
   ```

### Problème : Recommandation IA ne fonctionne pas

**Solution:**
1. Vérifier qu'un rapport IA existe :
   ```sql
   SELECT id, primary_diagnosis, overall_severity 
   FROM ai_reports 
   ORDER BY created_at DESC LIMIT 1;
   ```
2. Vérifier que `currentPreAnalysisId` est dans sessionStorage (console navigateur)

### Problème : Disponibilités toujours vides

**Solution:**
1. Vérifier que le médecin existe :
   ```sql
   SELECT id FROM external_doctors WHERE id = 'doctor_id_from_sessionStorage';
   ```
2. Vérifier les rendez-vous existants :
   ```sql
   SELECT * FROM appointments 
   WHERE doctor_profile_id = 'doctor_id' 
   AND scheduled_date = '2025-01-15';
   ```

### Problème : Rendez-vous non créé

**Solution:**
1. Vérifier les logs console navigateur (F12)
2. Vérifier que `patient_profile_id` existe :
   ```sql
   SELECT id FROM patient_profiles WHERE id = 'patient_id';
   ```
3. Vérifier les RLS policies pour `appointments`

---

## Prochaines Étapes

1. **Scraping Med.in** : Créer le script `scripts/sync-medin-doctors.ts`
2. **Notifications** : Implémenter email/SMS
3. **Paiement réel** : Intégrer Stripe
4. **Géolocalisation** : Ajouter lat/lng au profil patient

---

## Support

Pour toute question ou problème, consulter :
- `TEST_REPORT_PATIENT_SCENARIO.md` - Rapport d'analyse initiale
- `MVP_PATIENT_VALIDATION_REPORT.md` - Rapport de validation final
- `docs/MEDIN_INTEGRATION.md` - Documentation intégration Med.in
