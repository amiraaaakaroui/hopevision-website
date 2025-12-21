# Script de Test Manuel - Scénario Patient Complet

## Objectif
Tester rigoureusement le scénario patient complet de bout en bout, de l'authentification jusqu'à la réservation de rendez-vous.

## Date de test: _______________
## Testeur: _______________

---

## Phase 1 : Authentification Patient

### Test 1.1 : Inscription Patient
**Étapes:**
1. [ ] Accéder à la page d'accueil (`/`)
2. [ ] Cliquer sur "Patient" → "S'inscrire"
3. [ ] Remplir le formulaire :
   - Email : `patient.test@example.com`
   - Mot de passe : `Test123456!`
4. [ ] Cliquer sur "S'inscrire"
5. [ ] Vérifier l'email de confirmation (ou utiliser OAuth Google)

**Résultat attendu:** 
- Email de confirmation envoyé
- Redirection vers page de vérification email

**Vérification base de données:**
```sql
SELECT id, email, role FROM profiles WHERE email = 'patient.test@example.com';
-- Vérifier que role = 'patient'
```

**Statut:** ☐ Réussi ☐ Échoué
**Notes:** ________________________________

---

### Test 1.2 : Confirmation Email et Onboarding
**Étapes:**
1. [ ] Cliquer sur le lien de confirmation dans l'email
2. [ ] Vérifier redirection vers `signup-patient-step2`
3. [ ] Compléter le profil :
   - Date de naissance : `1990-01-15`
   - Sexe : `Féminin`
   - Pays : `Tunisie`
4. [ ] Cliquer sur "Continuer"

**Résultat attendu:**
- Profil complété et sauvegardé
- Redirection vers `patient-dashboard` ou `patient-history`

**Vérification base de données:**
```sql
SELECT pp.*, p.full_name, p.date_of_birth 
FROM patient_profiles pp
JOIN profiles p ON pp.profile_id = p.id
WHERE p.email = 'patient.test@example.com';
-- Vérifier que gender et date_of_birth sont remplis
```

**Statut:** ☐ Réussi ☐ Échoué
**Notes:** ________________________________

---

### Test 1.3 : Connexion Patient
**Étapes:**
1. [ ] Se déconnecter (si connecté)
2. [ ] Aller sur la page d'accueil
3. [ ] Cliquer sur "Patient" → "Se connecter"
4. [ ] Entrer :
   - Email : `patient.test@example.com`
   - Mot de passe : `Test123456!`
5. [ ] Cliquer sur "Se connecter"

**Résultat attendu:**
- Connexion réussie
- Redirection vers `patient-dashboard`

**Statut:** ☐ Réussi ☐ Échoué
**Notes:** ________________________________

---

## Phase 2 : Pré-analyse (Consentement → Symptômes)

### Test 2.1 : Accès à la Pré-analyse
**Étapes:**
1. [ ] Depuis le dashboard patient, cliquer sur "Nouvelle pré-analyse" ou "Lancer une nouvelle pré-analyse IA"
2. [ ] Vérifier redirection vers `patient-consent`

**Résultat attendu:**
- Page de consentement affichée
- Texte de consentement lisible

**Statut:** ☐ Réussi ☐ Échoué
**Notes:** ________________________________

---

### Test 2.2 : Consentement
**Étapes:**
1. [ ] Lire le texte de consentement
2. [ ] Cocher la case "J'accepte les conditions"
3. [ ] Cliquer sur "Continuer"

**Résultat attendu:**
- Redirection vers `patient-symptoms`
- Consentement enregistré (si applicable)

**Statut:** ☐ Réussi ☐ Échoué
**Notes:** ________________________________

---

### Test 2.3 : Saisie des Symptômes - Texte
**Étapes:**
1. [ ] Dans `PatientSymptoms`, onglet "Texte"
2. [ ] Saisir : `"J'ai une toux sèche persistante depuis 5 jours, accompagnée de fièvre modérée (38°C). J'ai aussi des maux de tête et je me sens fatigué."`
3. [ ] Vérifier que le texte est bien saisi

**Résultat attendu:**
- Texte affiché dans le champ
- Pas d'erreur de validation

**Statut:** ☐ Réussi ☐ Échoué
**Notes:** ________________________________

---

### Test 2.4 : Saisie des Symptômes - Puces
**Étapes:**
1. [ ] Toujours dans l'onglet "Texte"
2. [ ] Cliquer sur les puces suivantes :
   - "5 jours"
   - "Toux sèche"
   - "Fièvre"
   - "Maux de tête"
3. [ ] Vérifier que les puces sont sélectionnées (badge visible)

**Résultat attendu:**
- Puces sélectionnées affichées comme badges
- Compteur mis à jour

**Statut:** ☐ Réussi ☐ Échoué
**Notes:** ________________________________

---

### Test 2.5 : Upload d'Image
**Étapes:**
1. [ ] Aller dans l'onglet "Images"
2. [ ] Cliquer sur "Ajouter des images"
3. [ ] Sélectionner une image JPG/PNG (ex: photo de thermomètre montrant 38°C)
4. [ ] Attendre la fin de l'upload
5. [ ] Vérifier que l'image s'affiche dans la galerie

**Résultat attendu:**
- Image uploadée avec succès
- Barre de progression visible pendant l'upload
- Image affichée dans l'interface
- URL de l'image sauvegardée

**Vérification console:**
- Ouvrir DevTools (F12)
- Vérifier qu'il n'y a pas d'erreurs dans la console
- Vérifier que l'URL de l'image est dans sessionStorage ou Supabase Storage

**Statut:** ☐ Réussi ☐ Échoué
**Notes:** ________________________________

---

### Test 2.6 : Upload de Document
**Étapes:**
1. [ ] Aller dans l'onglet "Documents"
2. [ ] Glisser-déposer un PDF (ex: résultat de laboratoire) ou cliquer pour sélectionner
3. [ ] Attendre la fin de l'upload
4. [ ] Vérifier que le document s'affiche dans la liste

**Résultat attendu:**
- Document uploadé avec succès
- Nom du fichier affiché
- Icône PDF visible

**Vérification base de données:**
```sql
SELECT id, text_input, selected_chips, image_urls, document_urls, status
FROM pre_analyses
WHERE patient_profile_id = 'votre_patient_profile_id'
ORDER BY created_at DESC LIMIT 1;
-- Vérifier que les données sont sauvegardées
```

**Statut:** ☐ Réussi ☐ Échoué
**Notes:** ________________________________

---

### Test 2.7 : Soumission de la Pré-analyse
**Étapes:**
1. [ ] Vérifier que toutes les données sont présentes :
   - Texte saisi ✓
   - Puces sélectionnées ✓
   - Image uploadée ✓
   - Document uploadé ✓
2. [ ] Cliquer sur "Analyser mes symptômes"
3. [ ] Observer la transition vers l'écran suivant

**Résultat attendu:**
- Pré-analyse sauvegardée avec status = 'submitted' ou 'draft'
- Redirection vers `patient-chat-precision`
- `currentPreAnalysisId` stocké dans sessionStorage

**Vérification sessionStorage:**
```javascript
// Dans la console navigateur
console.log(sessionStorage.getItem('currentPreAnalysisId'));
// Doit retourner un UUID
```

**Statut:** ☐ Réussi ☐ Échoué
**Notes:** ________________________________

---

## Phase 3 : Chat de Précision

### Test 3.1 : Affichage du Chat
**Étapes:**
1. [ ] Arriver sur `PatientChatPrecision`
2. [ ] Vérifier que l'interface du chat est affichée
3. [ ] Observer l'indicateur de chargement (si présent)

**Résultat attendu:**
- Interface du chat visible
- Zone de saisie fonctionnelle
- Bouton "Envoyer" visible

**Statut:** ☐ Réussi ☐ Échoué
**Notes:** ________________________________

---

### Test 3.2 : Première Question IA
**Étapes:**
1. [ ] Attendre la génération automatique de la première question (10-30 secondes)
2. [ ] Observer l'apparition du message IA

**Résultat attendu:**
- Première question générée automatiquement
- Message affiché dans le chat avec badge "Léa" ou "IA"
- Question pertinente par rapport aux symptômes saisis

**Exemple de question attendue:**
- "Depuis combien de temps avez-vous cette toux ?"
- "La toux est-elle plus intense le soir ou le matin ?"
- "Avez-vous des difficultés respiratoires ?"

**Vérification base de données:**
```sql
SELECT id, message_text, sender_type, created_at
FROM chat_precision_messages
WHERE pre_analysis_id = 'votre_pre_analysis_id'
ORDER BY created_at ASC;
-- Vérifier qu'au moins un message IA existe
```

**Statut:** ☐ Réussi ☐ Échoué
**Notes:** ________________________________

---

### Test 3.3 : Réponse Patient
**Étapes:**
1. [ ] Lire la question de l'IA
2. [ ] Saisir une réponse : `"La toux est plus intense le soir, surtout quand je me couche. J'ai aussi du mal à respirer profondément."`
3. [ ] Cliquer sur "Envoyer"

**Résultat attendu:**
- Message patient affiché dans le chat
- Message sauvegardé en base de données
- Indicateur de chargement pour la réponse IA suivante

**Statut:** ☐ Réussi ☐ Échoué
**Notes:** ________________________________

---

### Test 3.4 : Conversation Continue
**Étapes:**
1. [ ] Répondre à 2-3 questions supplémentaires
2. [ ] Vérifier que la conversation est fluide
3. [ ] Observer que les questions deviennent plus précises

**Résultat attendu:**
- Conversation naturelle et contextuelle
- Questions adaptées aux réponses précédentes
- Pas d'erreurs dans la console

**Statut:** ☐ Réussi ☐ Échoué
**Notes:** ________________________________

---

### Test 3.5 : Finalisation du Chat
**Étapes:**
1. [ ] Après 2-5 questions, cliquer sur "Terminer et générer le rapport"
2. [ ] Observer la transition

**Résultat attendu:**
- Redirection vers `patient-results`
- Chat sauvegardé avec tous les messages
- Pré-analyse mise à jour avec status = 'submitted'

**Vérification base de données:**
```sql
SELECT COUNT(*) as message_count
FROM chat_precision_messages
WHERE pre_analysis_id = 'votre_pre_analysis_id';
-- Doit avoir au moins 2 messages (1 IA + 1 patient minimum)
```

**Statut:** ☐ Réussi ☐ Échoué
**Notes:** ________________________________

---

## Phase 4 : Génération de Rapports

### Test 4.1 : Affichage des Résultats
**Étapes:**
1. [ ] Arriver sur `PatientResults`
2. [ ] Observer l'indicateur de chargement
3. [ ] Attendre la génération du rapport (15-60 secondes)

**Résultat attendu:**
- Indicateur de progression visible
- Rapport généré et affiché
- Séverité globale affichée (low/medium/high)
- Confiance globale affichée (0-100%)

**Statut:** ☐ Réussi ☐ Échoué
**Notes:** ________________________________

---

### Test 4.2 : Hypothèses Diagnostiques
**Étapes:**
1. [ ] Vérifier que les hypothèses diagnostiques sont affichées
2. [ ] Compter le nombre d'hypothèses (attendu: 3-5)
3. [ ] Vérifier que chaque hypothèse affiche :
   - Nom de la maladie
   - Pourcentage de confiance
   - Explication

**Résultat attendu:**
- Hypothèses triées par confiance décroissante
- Hypothèse principale mise en évidence
- Explications claires et compréhensibles

**Vérification base de données:**
```sql
SELECT disease_name, confidence, is_primary, explanation
FROM diagnostic_hypotheses
WHERE ai_report_id = 'votre_ai_report_id'
ORDER BY confidence DESC;
-- Vérifier qu'il y a au moins 1 hypothèse avec is_primary = true
```

**Statut:** ☐ Réussi ☐ Échoué
**Notes:** ________________________________

---

### Test 4.3 : Recommandations
**Étapes:**
1. [ ] Vérifier que les recommandations sont affichées
2. [ ] Lire l'action recommandée
3. [ ] Vérifier la présence de :
   - Actions à faire
   - Signes d'alerte

**Résultat attendu:**
- Recommandations claires et actionnables
- Actions à faire listées
- Signes d'alerte listés

**Statut:** ☐ Réussi ☐ Échoué
**Notes:** ________________________________

---

### Test 4.4 : Navigation vers Rapport Détaillé
**Étapes:**
1. [ ] Cliquer sur "Voir le rapport détaillé"
2. [ ] Vérifier la redirection

**Résultat attendu:**
- Redirection vers `patient-detailed-report`
- Rapport détaillé chargé

**Statut:** ☐ Réussi ☐ Échoué
**Notes:** ________________________________

---

### Test 4.5 : Rapport Détaillé Complet
**Étapes:**
1. [ ] Vérifier toutes les sections du rapport détaillé :
   - [ ] Résumé des symptômes
   - [ ] Hypothèses diagnostiques (principale + alternatives)
   - [ ] Explication détaillée (explicabilité)
   - [ ] Recommandations
   - [ ] Prochaines étapes
2. [ ] Vérifier que les données correspondent à celles saisies

**Résultat attendu:**
- Toutes les sections présentes et complètes
- Données cohérentes avec la pré-analyse
- Format lisible et professionnel

**Statut:** ☐ Réussi ☐ Échoué
**Notes:** ________________________________

---

## Phase 5 : Navigation vers Réservation

### Test 5.1 : Bouton "Prendre Rendez-vous"
**Étapes:**
1. [ ] Dans `PatientDetailedReport`, localiser le bouton "Prendre Rendez-vous"
2. [ ] Vérifier qu'il est visible et cliquable
3. [ ] Cliquer sur "Prendre Rendez-vous"

**Résultat attendu:**
- Bouton visible et accessible
- Redirection vers `booking-service-selection`
- Contexte médical préservé (pre_analysis_id, ai_report_id)

**Vérification sessionStorage:**
```javascript
// Dans la console navigateur
console.log(sessionStorage.getItem('currentPreAnalysisId'));
console.log(sessionStorage.getItem('bookingContext'));
// Doit retourner des valeurs
```

**Statut:** ☐ Réussi ☐ Échoué
**Notes:** ________________________________

---

### Test 5.2 : Accès depuis Dashboard
**Étapes:**
1. [ ] Retourner au dashboard patient (`patient-dashboard`)
2. [ ] Cliquer sur le bouton "Prendre RDV" ou "Réserver"
3. [ ] Vérifier la redirection

**Résultat attendu:**
- Redirection vers `booking-service-selection`
- Si une analyse récente existe, contexte médical passé

**Statut:** ☐ Réussi ☐ Échoué
**Notes:** ________________________________

---

## Phase 6 : Flux de Réservation (Actuellement Non Fonctionnel)

### Test 6.1 : Sélection de Service
**Étapes:**
1. [ ] Arriver sur `BookingServiceSelection`
2. [ ] Vérifier que les services sont affichés :
   - Téléconsultation
   - Consultation au cabinet
   - Examens de laboratoire
   - Consultation de suivi
3. [ ] Cliquer sur "Sélectionner" pour un service (ex: Téléconsultation)

**Résultat attendu:**
- Services affichés avec descriptions
- Service sélectionné sauvegardé
- Redirection vers `booking-provider-selection`

**Problèmes détectés:**
- ☐ Pas de redirection
- ☐ Service non sauvegardé
- ☐ Contexte médical perdu
- ☐ Autre: ________________________________

**Statut:** ☐ Réussi ☐ Échoué
**Notes:** ________________________________

---

### Test 6.2 : Sélection de Prestataire
**Étapes:**
1. [ ] Arriver sur `BookingProviderSelection`
2. [ ] Vérifier que les médecins sont affichés
3. [ ] Observer s'il y a des médecins "Recommandés par Léa"
4. [ ] Cliquer sur "Voir les disponibilités" pour un médecin

**Résultat attendu:**
- Liste de médecins affichée
- Médecins recommandés mis en évidence
- Raison de recommandation affichée
- Redirection vers `booking-schedule`

**Problèmes détectés:**
- ☐ Médecins non chargés depuis la base de données
- ☐ Pas de recommandation IA
- ☐ Données statiques hardcodées
- ☐ Filtres non fonctionnels
- ☐ Autre: ________________________________

**Statut:** ☐ Réussi ☐ Échoué
**Notes:** ________________________________

---

### Test 6.3 : Sélection de Créneau
**Étapes:**
1. [ ] Arriver sur `BookingSchedule`
2. [ ] Vérifier que le calendrier est affiché
3. [ ] Sélectionner une date disponible
4. [ ] Sélectionner un créneau horaire
5. [ ] Cliquer sur "Continuer"

**Résultat attendu:**
- Calendrier fonctionnel
- Disponibilités réelles affichées
- Date et heure sélectionnées sauvegardées
- Redirection vers `booking-payment`

**Problèmes détectés:**
- ☐ Calendrier non fonctionnel
- ☐ Disponibilités hardcodées
- ☐ Pas de vérification en temps réel
- ☐ Autre: ________________________________

**Statut:** ☐ Réussi ☐ Échoué
**Notes:** ________________________________

---

### Test 6.4 : Paiement
**Étapes:**
1. [ ] Arriver sur `BookingPayment`
2. [ ] Vérifier le récapitulatif :
   - Médecin sélectionné
   - Date et heure
   - Type de consultation
   - Prix
3. [ ] Sélectionner un mode de paiement
4. [ ] Remplir les informations de paiement (si requis)
5. [ ] Cliquer sur "Confirmer et Payer"

**Résultat attendu:**
- Récapitulatif correct et complet
- Formulaire de paiement fonctionnel
- Redirection vers `booking-confirmation`

**Problèmes détectés:**
- ☐ Récapitulatif incorrect
- ☐ Paiement non fonctionnel
- ☐ Pas de création de rendez-vous en base
- ☐ Autre: ________________________________

**Statut:** ☐ Réussi ☐ Échoué
**Notes:** ________________________________

---

### Test 6.5 : Confirmation
**Étapes:**
1. [ ] Arriver sur `BookingConfirmation`
2. [ ] Vérifier que les détails du rendez-vous sont affichés
3. [ ] Vérifier que le partage du rapport médical est confirmé
4. [ ] Vérifier la référence de réservation

**Résultat attendu:**
- Détails complets du rendez-vous
- Confirmation du partage du rapport
- Référence de réservation affichée
- Événement créé dans la timeline

**Vérification base de données:**
```sql
-- Vérifier que le rendez-vous est créé
SELECT id, patient_profile_id, doctor_profile_id, scheduled_date, scheduled_time, status
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

**Problèmes détectés:**
- ☐ Rendez-vous non créé en base
- ☐ Assignment non créé
- ☐ Timeline event non créé
- ☐ Rapport non partagé
- ☐ Autre: ________________________________

**Statut:** ☐ Réussi ☐ Échoué
**Notes:** ________________________________

---

## Phase 7 : Vérification Dashboard

### Test 7.1 : Affichage Rendez-vous à Venir
**Étapes:**
1. [ ] Retourner au dashboard patient
2. [ ] Vérifier la section "Prochain RDV" dans la sidebar
3. [ ] Vérifier que le rendez-vous créé est affiché

**Résultat attendu:**
- Rendez-vous affiché avec :
  - Date et heure
  - Nom du médecin
  - Type de consultation
- Lien vers les détails fonctionnel

**Statut:** ☐ Réussi ☐ Échoué
**Notes:** ________________________________

---

### Test 7.2 : Historique
**Étapes:**
1. [ ] Dans le dashboard, vérifier l'historique
2. [ ] Vérifier que la pré-analyse apparaît
3. [ ] Vérifier que le rendez-vous apparaît

**Résultat attendu:**
- Pré-analyse listée avec statut "Terminée"
- Rendez-vous listé avec statut "Planifié"
- Liens fonctionnels vers les détails

**Statut:** ☐ Réussi ☐ Échoué
**Notes:** ________________________________

---

## Résumé des Tests

### Statistiques
- **Tests réussis:** ___ / 30
- **Tests échoués:** ___ / 30
- **Tests non testés:** ___ / 30

### Problèmes Critiques Identifiés

1. **Titre:** ________________________________
   - **Description:** ________________________________
   - **Impact:** ☐ Bloquant ☐ Majeur ☐ Mineur
   - **Composant concerné:** ________________________________

2. **Titre:** ________________________________
   - **Description:** ________________________________
   - **Impact:** ☐ Bloquant ☐ Majeur ☐ Mineur
   - **Composant concerné:** ________________________________

3. **Titre:** ________________________________
   - **Description:** ________________________________
   - **Impact:** ☐ Bloquant ☐ Majeur ☐ Mineur
   - **Composant concerné:** ________________________________

### Erreurs Console Détectées

1. **Erreur:** ________________________________
   - **Fichier/Ligne:** ________________________________
   - **Fréquence:** ☐ Toujours ☐ Parfois ☐ Rarement

2. **Erreur:** ________________________________
   - **Fichier/Ligne:** ________________________________
   - **Fréquence:** ☐ Toujours ☐ Parfois ☐ Rarement

### Blocages Identifiés

1. **Blocage:** ________________________________
   - **Étape:** ________________________________
   - **Cause probable:** ________________________________

2. **Blocage:** ________________________________
   - **Étape:** ________________________________
   - **Cause probable:** ________________________________

### Recommandations

1. ________________________________
2. ________________________________
3. ________________________________

---

## Notes Finales

**Temps total de test:** _______________ minutes

**Environnement de test:**
- Navigateur: ☐ Chrome ☐ Firefox ☐ Safari ☐ Edge ☐ Autre: _______________
- Version: _______________
- OS: ☐ Windows ☐ macOS ☐ Linux ☐ Autre: _______________

**Observations générales:**
________________________________
________________________________
________________________________

**Prêt pour production bêta:** ☐ Oui ☐ Non ☐ Avec réserves

**Commentaires:**
________________________________
________________________________
________________________________
