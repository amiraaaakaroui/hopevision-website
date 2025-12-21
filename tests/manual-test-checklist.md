# Checklist de Tests Manuels - HopeVisionAI

## Instructions

Cette checklist doit être suivie manuellement dans le navigateur après avoir lancé l'application avec `npm run dev`.

---

## ✅ Prérequis

- [ ] Application démarrée (`npm run dev`)
- [ ] Variables d'environnement configurées (`.env`)
- [ ] Base de données Supabase configurée
- [ ] Buckets Storage créés

---

## 📋 Tests d'Authentification

### Test 1: Inscription Patient
- [ ] Aller sur la page d'accueil
- [ ] Cliquer sur "Patient"
- [ ] Cliquer sur "S'inscrire"
- [ ] Remplir email et mot de passe
- [ ] Vérifier l'email (ou utiliser OAuth)
- [ ] Compléter le profil (date de naissance, sexe)
- [ ] **Résultat attendu:** Redirection vers `patient-history`

### Test 2: Connexion Patient
- [ ] Se déconnecter
- [ ] Cliquer sur "Se connecter"
- [ ] Entrer email et mot de passe
- [ ] **Résultat attendu:** Connexion réussie, redirection vers `patient-history`

### Test 3: Inscription Médecin
- [ ] Se déconnecter
- [ ] Cliquer sur "Médecin"
- [ ] S'inscrire avec email/mot de passe
- [ ] Compléter le profil (spécialité, RPPS, ville)
- [ ] **Résultat attendu:** Redirection vers `doctor-dashboard`

---

## 📋 Tests Patient - Soumission Symptômes

### Test 4: Soumission Texte Seul
- [ ] Se connecter en tant que patient
- [ ] Naviguer vers "Nouvelle analyse" ou "Symptômes"
- [ ] Onglet "Texte"
- [ ] Saisir: `"J'ai une toux sèche depuis 3 jours"`
- [ ] Cliquer sur "Analyser mes symptômes"
- [ ] **Résultat attendu:** Redirection vers chat de précision

**Vérification en console:**
```javascript
// Ouvrir la console navigateur (F12)
// Vérifier qu'il n'y a pas d'erreurs
```

### Test 5: Soumission avec Puces
- [ ] Dans PatientSymptoms, onglet "Texte"
- [ ] Saisir du texte: `"Douleur à la gorge"`
- [ ] Cliquer sur les puces: "5 jours", "Toux sèche", "Fièvre"
- [ ] Cliquer sur "Analyser mes symptômes"
- [ ] **Résultat attendu:** Toutes les données sauvegardées

### Test 6: Upload d'Image
- [ ] Dans PatientSymptoms, onglet "Images"
- [ ] Cliquer sur "Ajouter des images"
- [ ] Sélectionner une image (JPG ou PNG)
- [ ] Attendre l'upload (barre de progression)
- [ ] Vérifier que l'image s'affiche
- [ ] Ajouter du texte aussi
- [ ] Cliquer sur "Analyser mes symptômes"
- [ ] **Résultat attendu:** Image uploadée, URL sauvegardée

**Vérification:**
- [ ] Image visible dans l'interface
- [ ] Pas d'erreur dans la console
- [ ] URL de l'image dans sessionStorage ou base de données

### Test 7: Upload de Document
- [ ] Dans PatientSymptoms, onglet "Documents"
- [ ] Glisser-déposer un PDF ou JPG
- [ ] Attendre l'upload
- [ ] Vérifier que le document s'affiche
- [ ] Ajouter du texte
- [ ] Cliquer sur "Analyser mes symptômes"
- [ ] **Résultat attendu:** Document uploadé, URL sauvegardée

---

## 📋 Tests Chat de Précision

### Test 8: Première Question IA
- [ ] Après soumission de symptômes
- [ ] Arriver sur `PatientChatPrecision`
- [ ] **Attendre** la première question (10-15 secondes)
- [ ] **Résultat attendu:** Question IA générée automatiquement

**Vérification:**
- [ ] Message IA visible dans le chat
- [ ] Pas d'erreur dans la console
- [ ] Message sauvegardé en base (vérifier avec Supabase Dashboard)

### Test 9: Conversation Chat
- [ ] Répondre à la première question: `"Oui, la toux est pire le soir"`
- [ ] Cliquer sur "Envoyer"
- [ ] **Attendre** la réponse IA (5-10 secondes)
- [ ] **Résultat attendu:** Réponse IA contextuelle

**Vérification:**
- [ ] Message patient sauvegardé
- [ ] Réponse IA générée
- [ ] Conversation fluide

### Test 10: Fin du Chat
- [ ] Répondre à 2-3 questions
- [ ] Cliquer sur "Terminer et générer le rapport"
- [ ] **Résultat attendu:** Redirection vers `PatientResults`

---

## 📋 Tests Génération Rapport IA

### Test 11: Génération Rapport
- [ ] Après le chat, arriver sur `PatientResults`
- [ ] **Observer** l'indicateur de chargement
- [ ] **Attendre** 15-30 secondes
- [ ] **Résultat attendu:** Rapport généré et affiché

**Vérification:**
- [ ] Séverité globale affichée (low/medium/high)
- [ ] Confiance globale affichée (0-100%)
- [ ] Hypothèses diagnostiques affichées (3-5)
- [ ] Recommandations affichées

**Vérification en base (Supabase Dashboard):**
```sql
SELECT * FROM ai_reports 
WHERE pre_analysis_id = 'votre_id' 
ORDER BY created_at DESC LIMIT 1;

SELECT * FROM diagnostic_hypotheses 
WHERE ai_report_id = 'votre_ai_report_id';
```

### Test 12: Rapport Détaillé
- [ ] Dans `PatientResults`, cliquer sur "Voir le rapport détaillé"
- [ ] Vérifier les onglets:
  - [ ] Résumé
  - [ ] Hypothèses
  - [ ] Explicabilité
  - [ ] Recommandations
- [ ] **Résultat attendu:** Toutes les sections affichées

---

## 📋 Tests Fusion Multimodale

### Test 13: Toutes Modalités Ensemble
- [ ] **Texte:** `"Toux persistante depuis une semaine"`
- [ ] **Puces:** Sélectionner "1 semaine", "Toux sèche", "Intense"
- [ ] **Image:** Uploader une photo
- [ ] **Document:** Uploader un PDF
- [ ] **Chat:** Répondre à 2-3 questions
- [ ] Générer le rapport
- [ ] **Résultat attendu:** Toutes les modalités prises en compte

**Vérification dans le rapport:**
- [ ] Le texte est mentionné
- [ ] Les puces sont prises en compte
- [ ] L'image est référencée (si analysée)
- [ ] Le document est référencé
- [ ] Les réponses du chat sont incluses

**Vérification en base:**
```sql
SELECT 
  text_input IS NOT NULL as has_text,
  array_length(selected_chips, 1) > 0 as has_chips,
  array_length(image_urls, 1) > 0 as has_images,
  array_length(document_urls, 1) > 0 as has_documents
FROM pre_analyses 
WHERE id = 'votre_pre_analysis_id';
```

---

## 📋 Tests Interface Médecin

### Test 14: Dashboard Médecin
- [ ] Se connecter en tant que médecin
- [ ] Vérifier `DoctorDashboard`
- [ ] **Résultat attendu:** Liste des cas patients

**Vérification:**
- [ ] Cas affichés (si des patients ont créé des rapports)
- [ ] Filtres fonctionnels
- [ ] Statistiques affichées

### Test 15: Dossier Patient
- [ ] Dans `DoctorDashboard`, cliquer sur un cas
- [ ] Ouvrir `DoctorPatientFile`
- [ ] Vérifier les onglets:
  - [ ] Fusion IA
  - [ ] Anamnèse IA
  - [ ] Documents
  - [ ] Explicabilité
  - [ ] Recommandations
  - [ ] Ma Décision
  - [ ] Rapport
- [ ] **Résultat attendu:** Toutes les données affichées

### Test 16: Notes Médecin
- [ ] Dans `DoctorPatientFile`, onglet "Ma Décision"
- [ ] Remplir:
  - Diagnostic médecin
  - Notes
  - Prescription
- [ ] Cliquer sur "Enregistrer"
- [ ] **Résultat attendu:** Note sauvegardée

**Vérification:**
```sql
SELECT * FROM doctor_notes 
WHERE patient_profile_id = 'votre_patient_id' 
ORDER BY created_at DESC LIMIT 1;
```

---

## 📋 Tests de Performance

### Test 17: Temps de Génération Rapport
- [ ] Mesurer le temps entre "Terminer chat" et affichage du rapport
- [ ] **Résultat attendu:** < 30 secondes

### Test 18: Temps de Chargement Dashboard
- [ ] Mesurer le temps de chargement de `DoctorDashboard`
- [ ] **Résultat attendu:** < 2 secondes

### Test 19: Temps d'Upload
- [ ] Mesurer le temps d'upload d'une image (1-2 MB)
- [ ] **Résultat attendu:** < 5 secondes

---

## 📋 Tests d'Erreurs

### Test 20: Gestion Erreurs
- [ ] Tester avec connexion internet coupée
- [ ] **Résultat attendu:** Message d'erreur clair

### Test 21: Validation Fichiers
- [ ] Essayer d'uploader un fichier > 10MB
- [ ] **Résultat attendu:** Message d'erreur "Fichier trop volumineux"

### Test 22: Session Expirée
- [ ] Attendre expiration de session (ou supprimer manuellement)
- [ ] Essayer d'accéder à une page protégée
- [ ] **Résultat attendu:** Redirection vers login

---

## 📊 Résumé des Tests

**Date de test:** _______________
**Testeur:** _______________

**Résultats:**
- Tests réussis: ___ / 22
- Tests échoués: ___ / 22
- Tests non testés: ___ / 22

**Problèmes identifiés:**
1. ________________________________
2. ________________________________
3. ________________________________

**Notes:**
________________________________
________________________________
________________________________

