# Guide de Navigation - HopeVisionAI

## 📋 Vue d'ensemble

L'application HopeVisionAI comprend maintenant **33 écrans interconnectés** organisés en 3 interfaces principales :
- **Interface Patient (A)** : 8 écrans
- **Interface Médecin (B)** : 17 écrans  
- **Interface Admin (C)** : 6 écrans
- **Flux de Réservation (R)** : 5 écrans (partagé)

---

## 🎯 Parcours Complet pour la Vidéo Tutoriel (5 minutes)

### 🔵 PARTIE 1 : Parcours Patient (1 min 30s)

#### A0 - Landing Page Patient
**Fichier:** `PatientLanding.tsx`
- Point d'entrée de l'application
- CTA : "Commencer mon analyse" → **A1**

#### A1 - Consentement RGPD
**Fichier:** `PatientConsent.tsx`
- Acceptation des CGU et RGPD
- CTA : "J'accepte et continue" → **A2**

#### A2 - Saisie Symptômes Multimodale
**Fichier:** `PatientSymptoms.tsx`
- **4 onglets** : Texte, Voix, Image, **Documents** ✨
- Import de documents médicaux avec extraction IA
- CTA : "Analyser mes symptômes" → **A2.1** ou **A3**

#### A2.1 - Chat de Précision IA ✨
**Fichier:** `PatientChatPrecision.tsx`
- Questions automatiques après saisie symptôme
- Dialogue IA pour clarifier les informations manquantes
- CTA : "Terminer et analyser" → **A3**

#### A3 - Résultats IA
**Fichier:** `PatientResults.tsx`
- Hypothèses diagnostiques avec scores de confiance
- Explications XAI pour chaque diagnostic
- **CTA :** 
  - "Questions précision" → **A2.1**
  - "Voir ma timeline" → **A5.1** ✨
  - "Voir mes recommandations" → **A4**

#### A5.1 - Timeline Patient ✨
**Fichier:** `PatientTimeline.tsx`
- États : Pré-analyse → Consultation → Examens → Résultats → Rapport → Suivi
- Suivi visuel du parcours de soins
- Retour : **A3** ou **A4**

#### A4 - Orientation & Recommandations
**Fichier:** `PatientOrientation.tsx`
- Médecins recommandés
- Examens suggérés
- CTA : "Réserver" → **R1** (flux de réservation)

#### A5 - Historique Patient
**Fichier:** `PatientHistory.tsx`
- Liste des consultations passées
- Accès aux rapports précédents

---

### 🟢 PARTIE 2 : Parcours Médecin (2 min 30s)

#### B0 - Login Médecin 2FA
**Fichier:** `DoctorLogin.tsx`
- Authentification avec code OTP
- CTA : "Se connecter" → **B1**

#### B1 - Dashboard Médecin
**Fichier:** `DoctorDashboard.tsx`
- Vue tableau des cas entrants
- **CTA :**
  - "Vue Kanban" → **B1.3** ✨
  - "Gestion patients" → **B1.1** ✨
  - "Ouvrir" (un cas) → **B2**
  - "Collaboration" → **B5**
  - "Journal d'activité" → **B6**

#### B1.1 - Gestion Patients Plateforme/Cabinet ✨
**Fichier:** `DoctorPatientManagement.tsx`
- **3 onglets** : Patients plateforme / Patients cabinet / Tous
- Filtres par statut et source
- CTA : "Nouveau patient cabinet" → **B1.2**

#### B1.2 - Nouveau Patient Cabinet ✨
**Fichier:** `DoctorNewPatient.tsx`
- Formulaire rapide de création patient
- Envoi dans le pipeline d'aide à la décision
- CTA : "Créer et analyser" → **B2**

#### B1.3 - Kanban Clinicien ✨
**Fichier:** `DoctorKanban.tsx`
- **5 colonnes** : À voir / En cours / Examens / Validation / Suivi
- Drag & drop des cartes patient
- Vue organisationnelle du flux de travail

#### B2 - Dossier Patient Complet
**Fichier:** `DoctorPatientFile.tsx`
- **7 onglets** :
  1. **Fusion IA** : Résumé multimodal
  2. **Anamnèse IA** ✨ : Bouton "Lancer questionnaire IA" → **B2.0**
  3. **Documents** ✨ : Import PDF/JPG avec extraction auto
  4. **Explicabilité** : Analyse détaillée texte/voix/image
  5. **Recommandations** : Examens et traitements suggérés
  6. **Ma Décision** : Saisie diagnostic médecin
  7. **Rapport** : Aperçu du rapport final
- **CTA :**
  - "Lancer questionnaire IA" → **B2.0**
  - "Poser question au patient" → **B2.7**
  - "Exporter PDF" → téléchargement
  - "Valider diagnostic" → **B2.5+**

#### B2.0 - Anamnèse Assistée IA ✨
**Fichier:** `DoctorAnamnesisAI.tsx`
- Questions dynamiques adaptatives (oui/non/échelle)
- Panneau "Hypothèses écartées & pourquoi"
- Progression : 5 questions
- CTA : "Consolider l'anamnèse" → **B2.6**

#### B2.6 - Consolidation Anamnèse ✨
**Fichier:** `DoctorAnamnesisConsolidation.tsx`
- Récap des réponses collectées
- Badges "information manquante"
- CTA : "Demander au patient en live" → **B2.7**
- Retour : **B2**

#### B2.7 - Chat Relayé Médecin ✨
**Fichier:** `DoctorChatRelay.tsx`
- Le médecin envoie une question au patient
- Réponse stockée dans le dossier
- Analyse IA de la réponse
- Retour : **B2**

#### B2.5+ - Rapport Détaillé XAI ✨
**Fichier:** `DoctorDetailedReport.tsx`
- **6 onglets** :
  1. **Résumé** : Vue exécutive
  2. **Hypothèses** : Retenues et écartées
  3. **XAI Multimodal** : Explicabilité par modalité
  4. **Plan d'action** : Examens + Prescriptions
  5. **Traçabilité** : IA vs Médecin
  6. **Rapport complet** : Document final
- **CTA :**
  - "Export PDF" → téléchargement
  - "Export FHIR" → export standard
  - "Partager & Réserver" → **R1** (flux réservation)

#### B5 - Collaboration Clinique
**Fichier:** `DoctorCollaboration.tsx`
- Partage de cas avec confrères
- Demande d'avis spécialisé
- Discussion asynchrone

#### B6 - Journal d'Audit
**Fichier:** `DoctorAudit.tsx`
- Traçabilité complète des actions
- Horodatage et auteur
- Conformité réglementaire

---

### 🔴 PARTIE 3 : Parcours Admin (1 min)

#### C0 - Dashboard Admin
**Fichier:** `AdminDashboard.tsx`
- **6 KPIs ✨** :
  1. Cas analysés : 523 (+12%)
  2. **Concordance IA/Médecin** : 87% ✨
  3. Délai médian : 18 min
  4. **Temps par état** : 2.4h ✨
  5. **Taux no-show** : 8.2% ✨
  6. Erreurs détectées : 2
- Graphiques d'évolution
- Activité récente
- Navigation : **C1**, **C2**, **C3**, **C4**, **C5**

#### C1 - Gestion Utilisateurs
**Fichier:** `AdminUsers.tsx`
- CRUD médecins et patients
- Gestion des rôles

#### C2 - Intégrations FHIR/HL7
**Fichier:** `AdminIntegrations.tsx`
- Connexion systèmes externes
- Logs de synchronisation

#### C3 - Validation Center
**Fichier:** `AdminValidation.tsx`
- Vérification diagnostics IA
- Feedback pour amélioration modèle

#### C4 - Sécurité & Audit
**Fichier:** `AdminSecurity.tsx`
- Journaux de sécurité
- Gestion des accès

#### C5 - Insights Épidémiologiques
**Fichier:** `AdminInsights.tsx`
- Tendances de santé publique
- Analyses agrégées

---

### 🟣 FLUX DE RÉSERVATION (R1→R5) ✨

Déclenchable depuis :
- **A4** (PatientOrientation)
- **B2.5+** (DoctorDetailedReport via "Partager & Réserver")

#### R1 - Choix Prestation
**Fichier:** `BookingServiceSelection.tsx`
- **4 types** : Téléconsult / Cabinet / Examens labo / Suivi
- CTA : "Sélectionner" → **R2**

#### R2 - Sélection Prestataire
**Fichier:** `BookingProviderSelection.tsx`
- Cartes médecins/labos
- Filtres (spécialité, distance, avis)
- CTA : "Continuer" → **R3**

#### R3 - Agenda & Créneaux
**Fichier:** `BookingSchedule.tsx`
- Calendrier avec disponibilités
- Choix durée et créneau
- CTA : "Réserver ce créneau" → **R4**

#### R4 - Récap & Paiement
**Fichier:** `BookingPayment.tsx`
- Résumé réservation
- Formulaire paiement (si requis)
- CTA : "Confirmer et payer" → **R5**

#### R5 - Confirmation & Partage Rapport
**Fichier:** `BookingConfirmation.tsx`
- Confirmation visuelle
- Rapport médical joint automatiquement
- Instructions pré-consultation
- CTA : "Retour accueil"

---

## 🎬 Scénario de Walkthrough Vidéo (5 min)

### Timeline suggérée :

**0:00 - 0:30** | Introduction + Landing
- Présenter HopeVisionAI
- Montrer **A0** → **A1**

**0:30 - 1:30** | Parcours Patient
- **A2** : Saisir symptômes (texte + documents)
- **A2.1** : Chat de précision (2 questions)
- **A3** : Résultats IA avec explicabilité
- **A5.1** : Timeline patient

**1:30 - 2:00** | Transition vers Médecin
- Changer de rôle (bouton démo)
- **B0** : Login 2FA

**2:00 - 3:45** | Parcours Médecin (focus principal)
- **B1** : Dashboard → ouvrir cas Nadia
- **B2** : Dossier complet
  - Onglet "Anamnèse IA" → **B2.0**
  - Lancer questionnaire (montrer 2 questions)
  - **B2.6** : Consolidation
- **B2** : Onglet "Documents" (extraction auto)
- **B2.5+** : Rapport détaillé
  - Onglet "XAI Multimodal"
  - Onglet "Traçabilité"
- "Partager & Réserver" → **R1**

**3:45 - 4:15** | Flux de Réservation
- **R1** : Choisir "Téléconsultation"
- **R2** : Sélectionner médecin
- **R3** : Choisir créneau
- **R4** : Skip paiement
- **R5** : Confirmation avec rapport joint

**4:15 - 4:45** | Parcours Admin
- Changer de rôle → Admin
- **C0** : KPIs (concordance 87%, no-show 8.2%)
- Graphiques de tendance
- **B1.3** : Vue Kanban (drag & drop)

**4:45 - 5:00** | Conclusion
- Récap des 3 interfaces
- Bénéfices multimodal + XAI
- Call-to-action

---

## 🔗 Tableau de Navigation Rapide

| Écran | Fichier | Navigations Sortantes |
|-------|---------|----------------------|
| **A0** | PatientLanding | → A1 |
| **A1** | PatientConsent | → A2 |
| **A2** | PatientSymptoms | → A2.1, A3 |
| **A2.1** | PatientChatPrecision | → A3 |
| **A3** | PatientResults | → A2.1, A4, A5.1 |
| **A4** | PatientOrientation | → R1, A5 |
| **A5** | PatientHistory | — |
| **A5.1** | PatientTimeline | → A3, A4 |
| **B0** | DoctorLogin | → B1 |
| **B1** | DoctorDashboard | → B1.1, B1.3, B2, B5, B6 |
| **B1.1** | DoctorPatientManagement | → B1.2, B2 |
| **B1.2** | DoctorNewPatient | → B2 |
| **B1.3** | DoctorKanban | → B2 |
| **B2** | DoctorPatientFile | → B2.0, B2.5+, B2.7 |
| **B2.0** | DoctorAnamnesisAI | → B2.6 |
| **B2.6** | DoctorAnamnesisConsolidation | → B2, B2.7 |
| **B2.7** | DoctorChatRelay | → B2 |
| **B2.5+** | DoctorDetailedReport | → R1 (partage) |
| **B5** | DoctorCollaboration | → B1 |
| **B6** | DoctorAudit | → B1 |
| **C0** | AdminDashboard | → C1, C2, C3, C4, C5 |
| **C1-C5** | Admin* | → C0 |
| **R1** | BookingServiceSelection | → R2 |
| **R2** | BookingProviderSelection | → R3 |
| **R3** | BookingSchedule | → R4 |
| **R4** | BookingPayment | → R5 |
| **R5** | BookingConfirmation | → A0/B1 |

---

## ✨ Nouveautés Ajoutées

### Anamnèse IA (B2.0, B2.6)
- Questionnaire dynamique adaptatif
- Hypothèses écartées avec explications
- Consolidation avec détection lacunes

### Chat de Précision (A2.1, B2.7)
- IA → Patient : questions auto après symptômes
- Médecin → Patient : demande clarifications
- Stockage et analyse des réponses

### Import Documents (A2, B2)
- Upload PDF/JPG de bilans/CR
- Extraction automatique de données (CRP, GB, etc.)
- Affichage "✨ Données extraites : [clés:valeurs]"

### Rapport Détaillé XAI (B2.5+)
- 6 sections complètes
- Traçabilité IA vs Médecin
- Export PDF et FHIR

### Gestion Patients (B1.1, B1.2)
- Onglets Plateforme/Cabinet/Tous
- Formulaire nouveau patient cabinet
- Filtres multiples

### Réservation Complète (R1-R5)
- 4 types de prestations
- Sélection prestataire avec filtres
- Paiement et confirmation
- Rapport médical auto-joint

### Timeline Patient (A5.1)
- 6 états de parcours
- Visualisation étape actuelle
- Historique complet

### Kanban Médecin (B1.3)
- 5 colonnes workflow
- Drag & drop interactif
- Vue organisationnelle

### KPIs Admin Enrichis (C0)
- Concordance IA/Médecin : 87%
- Temps par état : 2.4h
- Taux no-show : 8.2%

---

## 📊 Statistiques Finales

- **Total écrans** : 33
- **Composants patients** : 8
- **Composants médecin** : 17
- **Composants admin** : 6
- **Flux réservation** : 5
- **Nouveaux écrans** : 12
- **Écrans mis à jour** : 5

---

## 🎨 Charte Graphique Respectée

- **Bleu médical** : #2563EB (boutons CTA)
- **Indigo** : #4338CA (anamnèse IA)
- **Vert validation** : #059669 (succès)
- **Rouge alerte** : #DC2626 (urgences)
- **Gris neutre** : #F3F4F6, #374151 (backgrounds)
- **Police** : Inter (via Tailwind)
- **Composants** : Shadcn/ui
- **Animations** : Motion/react
- **Graphiques** : Recharts

---

## 💡 Conseils pour la Vidéo

1. **Préparer les données** : Utiliser le cas Nadia Ben Salem (cohérent partout)
2. **Transitions fluides** : Utiliser les animations Motion existantes
3. **Montrer l'IA** : Insister sur XAI, anamnèse adaptative, extraction docs
4. **Workflow complet** : Patient → Médecin → Réservation → Admin
5. **Points forts** :
   - Multimodalité (texte/voix/image/docs)
   - Explicabilité (pourquoi chaque diagnostic)
   - Traçabilité complète
   - Intégrations standards (FHIR)
   - Vue organisationnelle (Kanban)
   - Concordance IA 87%

---

**Document généré le 12 Novembre 2025**  
**Projet HopeVisionAI - Prototype UI complet**
