# Refonte Complète du Workflow de Pré-Analyse

## 🎯 OBJECTIFS ATTEINTS

### 1. **Isolation Stricte** ✅
- "Commencer une analyse" crée TOUJOURS une nouvelle session vierge
- Chaque nouvelle analyse = ID unique = Chat vide (0 messages)

### 2. **Persistence** ✅
- Le Dashboard permet de voir et reprendre les anciennes analyses
- Liste des analyses récentes avec actions selon le statut

### 3. **Liberté** ✅
- Le Rapport final offre le choix explicite entre "Réserver" et "Quitter"
- AlertDialog pour sévérité élevée (nudge vers la réservation)

---

## 📋 MODIFICATIONS APPLIQUÉES

### ÉTAPE 1 : Types et Base de Données ✅

**Fichier : `src/types/database.ts`**
- ✅ Ajout de `'booked'` au type `PreAnalysisStatus`
- Types disponibles : `'draft' | 'submitted' | 'processing' | 'completed' | 'cancelled' | 'booked'`

### ÉTAPE 2 : Service Pre-Analysis ✅

**Fichier : `src/services/preAnalysisService.ts`**
- ✅ `getRecentPreAnalyses(patientProfileId, limit)` : Récupère les analyses récentes
- ✅ `getPreAnalysisWithReport(preAnalysisId)` : Récupère une analyse avec son rapport AI

### ÉTAPE 3 : Refonte du Dashboard ✅

**Fichier : `src/components/PatientHistory.tsx`**

#### 3.1. Bouton "Nouvelle pré-analyse" Corrigé
```typescript
onClick={async () => {
  // CRITICAL: Create NEW pre-analysis IMMEDIATELY
  const newPreAnalysisId = await startNewAnalysis({
    patientProfileId: currentProfile.patientProfileId,
  });
  onNavigate('patient-symptoms');
}}
```

**Actions** :
- ✅ Appelle `startNewAnalysis()` qui nettoie `sessionStorage` et crée une nouvelle pré-analyse
- ✅ Récupère le nouvel ID unique
- ✅ Stocke dans `sessionStorage.setItem('currentPreAnalysisId', newId)`
- ✅ Redirige vers `patient-symptoms`

#### 3.2. Nouvelle Section "Mes Analyses Récentes"
- ✅ Liste des 10 dernières analyses du patient
- ✅ Affichage conditionnel selon le statut :
  - **`status === 'draft'`** : Bouton "Reprendre" → Charge l'ID → Redirige vers `patient-symptoms`
  - **`status === 'completed'`** : 
    - Bouton "Voir Rapport" → Charge l'ID → Redirige vers `patient-detailed-report`
    - Bouton "Réserver" → Charge l'ID → Redirige vers `booking-service-selection`
  - **`status === 'booked'`** : Bouton "Voir Rapport" uniquement
- ✅ Affiche la date, le motif principal, et le diagnostic si disponible
- ✅ Badge "Urgence" pour sévérité élevée

### ÉTAPE 4 : Sécurisation du Chat ✅

**Fichier : `src/components/PatientChatPrecision.tsx`**
- ✅ Suppression de la logique "Auto-fetch most recent analysis"
- ✅ Règle stricte : Si `sessionStorage.getItem('currentPreAnalysisId')` est vide :
  - Affiche une erreur
  - Redirige immédiatement vers le Dashboard
  - Interdiction de "deviner" un ID
- ✅ Validation du format UUID

### ÉTAPE 5 : Refonte de la Navigation du Rapport ✅

**Fichier : `src/components/PatientDetailedReport.tsx`**

#### 5.1. Action Bar avec 2 Options

**Option A : "Prendre Rendez-vous" (Primaire/Bleu)**
```typescript
<Button 
  className="flex-1 bg-blue-600 hover:bg-blue-700"
  onClick={() => {
    sessionStorage.setItem('currentPreAnalysisId', preAnalysisId);
    onNavigate('booking-service-selection');
  }}
>
  <CalendarCheck className="w-5 h-5 mr-2" />
  Prendre Rendez-vous
</Button>
```

**Option B : "Enregistrer et Quitter" (Secondaire/Gris)**
```typescript
<Button 
  variant="outline"
  onClick={() => {
    if (aiReport?.overall_severity === 'high') {
      setShowExitDialog(true); // Show warning
    } else {
      handleExit(); // Safe to exit
    }
  }}
>
  <Home className="w-5 h-5 mr-2" />
  Enregistrer et Quitter
</Button>
```

#### 5.2. AlertDialog pour Sévérité Élevée
- ✅ Si `aiReport.overall_severity === 'high'` :
  - Affiche un `AlertDialog` avant de quitter
  - Message : "Attention : Votre analyse suggère une urgence potentielle. Nous vous recommandons vivement de voir un médecin rapidement. Voulez-vous vraiment quitter sans réserver ?"
  - Boutons :
    - "Quitter quand même" (Cancel)
    - "Prendre RDV maintenant" (Action - Focus)

### ÉTAPE 6 : Nettoyage dans App.tsx ✅

**Fichier : `src/App.tsx`**
- ✅ Import de `clearAnalysisSession`
- ✅ Disponible pour utilisation dans les composants

---

## 🔄 WORKFLOW COMPLET

### Scénario 1 : Nouvelle Analyse
1. **Dashboard** → Clic "Nouvelle pré-analyse"
2. **`startNewAnalysis()`** → Nettoie sessionStorage → Crée nouvelle pré-analyse → Stocke nouvel ID
3. **PatientSymptoms** → Remplit symptômes → Met à jour la pré-analyse
4. **PatientChatPrecision** → Chat vide (0 messages) → Questions de précision
5. **PatientResults** → Rapport généré
6. **PatientDetailedReport** → Action Bar :
   - Option A : "Prendre Rendez-vous" → Booking
   - Option B : "Enregistrer et Quitter" → Dashboard (avec AlertDialog si sévérité élevée)

### Scénario 2 : Reprendre une Analyse
1. **Dashboard** → Liste "Mes Analyses Récentes"
2. **Clic "Reprendre"** sur une analyse `draft`
3. **`sessionStorage.setItem('currentPreAnalysisId', analysisId)`**
4. **PatientSymptoms** ou **PatientChatPrecision** → Continue où il s'était arrêté

### Scénario 3 : Voir Rapport d'une Analyse Complétée
1. **Dashboard** → Liste "Mes Analyses Récentes"
2. **Clic "Voir Rapport"** sur une analyse `completed`
3. **`sessionStorage.setItem('currentPreAnalysisId', analysisId)`**
4. **PatientDetailedReport** → Affiche le rapport
5. **Action Bar** → "Réserver" ou "Quitter"

---

## 🎨 AMÉLIORATIONS UX

### Dashboard
- ✅ Bouton principal clair : "Nouvelle pré-analyse"
- ✅ Liste des analyses récentes avec statuts visuels
- ✅ Actions contextuelles selon le statut
- ✅ Badge "Urgence" pour sévérité élevée

### Rapport
- ✅ Action Bar claire avec 2 options distinctes
- ✅ Nudge vers la réservation pour sévérité élevée
- ✅ Message d'alerte empathique mais ferme

---

## 🔒 SÉCURITÉ

- ✅ Isolation stricte : Chaque analyse = ID unique
- ✅ Pas de réutilisation d'anciens IDs
- ✅ Nettoyage automatique au retour au dashboard
- ✅ Validation stricte du workflow dans tous les composants
- ✅ Gestion d'erreurs robuste

---

## ✅ RÉSULTAT FINAL

- ✅ **Isolation** : Chaque nouvelle analyse = session vierge
- ✅ **Persistence** : Dashboard pour voir/reprendre analyses
- ✅ **Liberté** : Choix explicite après le rapport (Réserver/Quitter)
- ✅ **Sécurité** : Nudge vers réservation pour urgence
- ✅ **UX** : Interface claire et intuitive

