# Tests End-to-End - Flux Patient Réservation

## Instructions

Exécuter ces tests manuellement après avoir implémenté toutes les fonctionnalités de réservation.

## Prérequis

- [ ] Application démarrée (`npm run dev`)
- [ ] Base de données Supabase configurée avec toutes les tables
- [ ] Au moins un médecin dans `external_doctors` ou `doctor_profiles`
- [ ] Patient connecté avec au moins une pré-analyse complétée

---

## Test 1 : Flux Complet de Réservation depuis Rapport Détaillé

### Étapes

1. [ ] Se connecter en tant que patient
2. [ ] Aller dans "Historique" ou "Rapports"
3. [ ] Ouvrir un rapport détaillé existant
4. [ ] Cliquer sur "Prendre Rendez-vous"
5. [ ] **Vérifier** : Redirection vers `booking-service-selection`
6. [ ] **Vérifier** : Contexte médical affiché (diagnostic réel, pas hardcodé)
7. [ ] Sélectionner un service (ex: Téléconsultation)
8. [ ] **Vérifier** : Redirection vers `booking-provider-selection`
9. [ ] **Vérifier** : Liste de médecins chargée depuis la base de données
10. [ ] **Vérifier** : Médecins recommandés par Léa affichés avec badge
11. [ ] **Vérifier** : Raison de recommandation affichée
12. [ ] Sélectionner un médecin
13. [ ] **Vérifier** : Redirection vers `booking-schedule`
14. [ ] **Vérifier** : Calendrier avec 14 prochains jours affiché
15. [ ] Sélectionner une date disponible
16. [ ] **Vérifier** : Créneaux horaires chargés depuis la base de données
17. [ ] **Vérifier** : Créneaux déjà réservés marqués comme indisponibles
18. [ ] Sélectionner un créneau disponible
19. [ ] Cliquer sur "Continuer"
20. [ ] **Vérifier** : Redirection vers `booking-payment`
21. [ ] **Vérifier** : Récapitulatif affiche les vraies données (médecin, date, heure, prix)
22. [ ] Sélectionner un mode de paiement
23. [ ] Cocher "J'accepte les conditions"
24. [ ] Cliquer sur "Confirmer et Payer"
25. [ ] **Vérifier** : Rendez-vous créé en base de données
26. [ ] **Vérifier** : Redirection vers `booking-confirmation`
27. [ ] **Vérifier** : Détails du rendez-vous affichés (vraies données)
28. [ ] **Vérifier** : Référence de réservation affichée
29. [ ] **Vérifier** : Partage du rapport médical confirmé

### Vérifications Base de Données

```sql
-- Vérifier que le rendez-vous est créé
SELECT id, patient_profile_id, doctor_profile_id, scheduled_date, scheduled_time, status, report_shared
FROM appointments
WHERE patient_profile_id = 'votre_patient_profile_id'
ORDER BY created_at DESC LIMIT 1;

-- Vérifier l'assignment patient-médecin
SELECT * FROM patient_doctor_assignments
WHERE patient_profile_id = 'votre_patient_profile_id'
ORDER BY assigned_at DESC LIMIT 1;

-- Vérifier l'événement timeline
SELECT * FROM timeline_events
WHERE patient_profile_id = 'votre_patient_profile_id'
AND event_type = 'appointment'
ORDER BY created_at DESC LIMIT 1;
```

**Statut:** ☐ Réussi ☐ Échoué  
**Notes:** ________________________________

---

## Test 2 : Réservation depuis Dashboard

### Étapes

1. [ ] Se connecter en tant que patient
2. [ ] Aller sur le dashboard patient
3. [ ] Cliquer sur "Prendre RDV" ou "Réserver"
4. [ ] **Vérifier** : Redirection vers `booking-service-selection`
5. [ ] **Vérifier** : Si une analyse récente existe, contexte médical passé
6. [ ] Continuer le flux de réservation (comme Test 1)

**Statut:** ☐ Réussi ☐ Échoué  
**Notes:** ________________________________

---

## Test 3 : Recommandation IA des Médecins

### Étapes

1. [ ] Avoir un rapport IA avec diagnostic (ex: "Pneumonie")
2. [ ] Aller dans `booking-provider-selection`
3. [ ] **Vérifier** : Médecins recommandés affichés en premier
4. [ ] **Vérifier** : Badge "Recommandé par Léa" visible
5. [ ] **Vérifier** : Raison de recommandation affichée (ex: "Spécialiste en Pneumologie")
6. [ ] **Vérifier** : Médecins triés par score de recommandation

**Statut:** ☐ Réussi ☐ Échoué  
**Notes:** ________________________________

---

## Test 4 : Disponibilités Réelles

### Étapes

1. [ ] Créer un rendez-vous pour un médecin à une date/heure spécifique
2. [ ] Aller dans `booking-schedule` pour le même médecin
3. [ ] Sélectionner la même date
4. [ ] **Vérifier** : Le créneau réservé est marqué comme indisponible
5. [ ] **Vérifier** : Les autres créneaux sont disponibles

**Statut:** ☐ Réussi ☐ Échoué  
**Notes:** ________________________________

---

## Test 5 : Affichage Rendez-vous dans Dashboard

### Étapes

1. [ ] Créer un rendez-vous (via Test 1)
2. [ ] Retourner au dashboard patient
3. [ ] **Vérifier** : Rendez-vous affiché dans la sidebar "Prochain RDV"
4. [ ] **Vérifier** : Date, heure, médecin affichés correctement
5. [ ] Cliquer sur "Voir les détails"
6. [ ] **Vérifier** : Redirection vers historique ou détails

**Statut:** ☐ Réussi ☐ Échoué  
**Notes:** ________________________________

---

## Test 6 : Gestion des Erreurs

### Test 6.1 : Médecin non trouvé
1. [ ] Supprimer manuellement le médecin sélectionné de sessionStorage
2. [ ] Aller dans `booking-schedule`
3. [ ] **Vérifier** : Message d'erreur affiché
4. [ ] **Vérifier** : Bouton "Recommencer" fonctionne

### Test 6.2 : Créneau déjà pris
1. [ ] Essayer de réserver un créneau déjà réservé
2. [ ] **Vérifier** : Erreur affichée lors de la création
3. [ ] **Vérifier** : Message d'erreur clair

### Test 6.3 : Données manquantes
1. [ ] Vider sessionStorage
2. [ ] Aller directement dans `booking-payment`
3. [ ] **Vérifier** : Message d'erreur affiché
4. [ ] **Vérifier** : Redirection vers le début du flux

**Statut:** ☐ Réussi ☐ Échoué  
**Notes:** ________________________________

---

## Résumé des Tests

**Date de test:** _______________  
**Testeur:** _______________

**Tests réussis:** ___ / 6  
**Tests échoués:** ___ / 6

**Problèmes identifiés:**
1. ________________________________
2. ________________________________
3. ________________________________

**Prêt pour production bêta:** ☐ Oui ☐ Non ☐ Avec réserves
