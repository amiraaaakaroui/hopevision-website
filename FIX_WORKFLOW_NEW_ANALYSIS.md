# Correction Critique : Workflow de Nouvelle Pré-Analyse

## 🔴 PROBLÈME IDENTIFIÉ

**Symptôme** : Quand l'utilisateur veut commencer une *nouvelle* pré-analyse, le système charge l'historique de la précédente (75 messages accumulés !).

**Cause** : Le code tentait trop intelligemment de "récupérer la dernière session" au lieu d'en créer une neuve. Le `sessionStorage` contenait l'ancien `pre_analysis_id`, et `PatientSymptoms` réutilisait cet ID au lieu de créer une nouvelle pré-analyse.

## ✅ CORRECTIONS APPLIQUÉES

### 1. **Création du Service `analysisWorkflowService.ts`**

Nouveau service dédié à la gestion du workflow d'analyse :

#### `startNewAnalysis()` - Fonction Principale
```typescript
export async function startNewAnalysis({
  patientProfileId,
  input,
}: StartNewAnalysisParams): Promise<string>
```

**Actions critiques** :
1. ✅ **Nettoie** `sessionStorage.removeItem('currentPreAnalysisId')` pour supprimer l'ancien ID
2. ✅ **Crée** une NOUVELLE pré-analyse via `createPreAnalysis()`
3. ✅ **Stocke** le NOUVEL ID dans `sessionStorage.setItem('currentPreAnalysisId', newId)`
4. ✅ **Retourne** le nouvel ID

#### `clearAnalysisSession()` - Nettoyage
```typescript
export function clearAnalysisSession(): void
```

Supprime `currentPreAnalysisId` de `sessionStorage` quand l'utilisateur retourne au dashboard.

### 2. **Modification de `PatientConsent.tsx`**

**Avant** :
```typescript
onClick={() => onNavigate('patient-symptoms')}
```

**Après** :
```typescript
const handleContinue = async () => {
  // CRITICAL: Start a NEW pre-analysis workflow
  await startNewAnalysis({
    patientProfileId: currentProfile.patientProfileId,
  });
  onNavigate('patient-symptoms');
};
```

**Résultat** : Quand l'utilisateur clique sur "Continuer" après le consentement, une NOUVELLE pré-analyse est créée immédiatement avec un ID unique.

### 3. **Modification de `PatientHistory.tsx`**

**Bouton "Nouvelle pré-analyse"** :
```typescript
onClick={async () => {
  // CRITICAL: Clear any existing session before starting new analysis
  const { clearAnalysisSession } = await import('../services/analysisWorkflowService');
  clearAnalysisSession();
  onNavigate('patient-consent');
}}
```

**useEffect** : Nettoie automatiquement la session quand on retourne au dashboard :
```typescript
useEffect(() => {
  // CRITICAL: Clear any active analysis session when returning to dashboard
  const { clearAnalysisSession } = require('../services/analysisWorkflowService');
  clearAnalysisSession();
  // ...
}, [currentProfile, isPatient]);
```

### 4. **Modification de `PatientLanding.tsx`**

**Bouton "Commencer ma pré-analyse"** :
```typescript
onClick={() => {
  // CRITICAL: Clear any existing session before starting new analysis
  clearAnalysisSession();
  onNavigate('patient-consent');
}}
```

### 5. **Modification de `PatientSymptoms.tsx`**

**Avant** : Réutilisait l'ancien ID s'il existait dans `sessionStorage`.

**Après** : 
- Vérifie que le `pre_analysis_id` existe et appartient au patient
- Si l'ID n'existe pas ou n'appartient pas au patient, crée une nouvelle pré-analyse
- Log des avertissements si le workflow n'est pas correct

**Résultat** : Même si le workflow est incorrect, le composant crée une nouvelle pré-analyse au lieu de réutiliser l'ancienne.

### 6. **Modification de `PatientChatPrecision.tsx`**

**Avant** : Acceptait un `pre_analysis_id` null et essayait de deviner.

**Après** :
- ✅ **Exige** un `pre_analysis_id` valide dans `sessionStorage`
- ✅ **Valide** le format UUID
- ✅ **Redirige** vers le dashboard si l'ID est manquant ou invalide
- ✅ **Ne devine JAMAIS** un ID - échoue proprement si le workflow est incorrect

**Code** :
```typescript
if (!storedId || typeof storedId !== 'string' || storedId.trim() === '') {
  console.error(`[PatientChatPrecision] ❌ CRITICAL: No pre_analysis_id in sessionStorage! Redirecting to dashboard.`);
  alert('Erreur: Aucune pré-analyse active. Veuillez recommencer.');
  onNavigate('patient-history');
  setLoading(false);
  return;
}

// Validate UUID format
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(storedId)) {
  console.error(`[PatientChatPrecision] ❌ Invalid UUID format in sessionStorage: ${storedId}`);
  alert('Erreur: ID de pré-analyse invalide. Veuillez recommencer.');
  onNavigate('patient-history');
  setLoading(false);
  return;
}
```

## 📋 WORKFLOW CORRIGÉ

### Flux Normal (Nouvelle Pré-Analyse)

1. **Utilisateur clique "Nouvelle pré-analyse"** (PatientHistory ou PatientLanding)
   - ✅ `clearAnalysisSession()` est appelé
   - ✅ Navigation vers `patient-consent`

2. **Utilisateur accepte le consentement** (PatientConsent)
   - ✅ `startNewAnalysis()` est appelé
   - ✅ Ancien ID supprimé de `sessionStorage`
   - ✅ NOUVELLE pré-analyse créée en base
   - ✅ NOUVEL ID stocké dans `sessionStorage`
   - ✅ Navigation vers `patient-symptoms`

3. **Utilisateur remplit les symptômes** (PatientSymptoms)
   - ✅ Récupère le NOUVEL ID depuis `sessionStorage`
   - ✅ Met à jour la pré-analyse avec les symptômes
   - ✅ Navigation vers `patient-chat-precision`

4. **Chat de précision** (PatientChatPrecision)
   - ✅ Récupère le NOUVEL ID depuis `sessionStorage`
   - ✅ Charge les messages pour CETTE pré-analyse uniquement (0 messages au début)
   - ✅ Pas de fuite de données

### Flux de Retour au Dashboard

1. **Utilisateur retourne au dashboard** (PatientHistory)
   - ✅ `useEffect` nettoie automatiquement la session
   - ✅ `currentPreAnalysisId` supprimé de `sessionStorage`
   - ✅ Prochaine nouvelle analyse sera propre

## 🎯 RÉSULTAT

- ✅ **Chaque clic sur "Commencer" = Une ID unique = Un chat vide (0 messages)**
- ✅ **Pas de réutilisation d'anciens IDs**
- ✅ **Nettoyage automatique quand on retourne au dashboard**
- ✅ **Validation stricte du workflow dans tous les composants**
- ✅ **Gestion d'erreurs robuste si le workflow est incorrect**

## 🧪 TESTS RECOMMANDÉS

1. **Test de nouvelle analyse** :
   - Créer Pré-analyse A avec 3 messages
   - Retourner au dashboard
   - Créer Pré-analyse B
   - Vérifier que Pré-analyse B a 0 messages (pas les 3 de A)

2. **Test de nettoyage** :
   - Créer une pré-analyse
   - Retourner au dashboard
   - Vérifier que `sessionStorage.getItem('currentPreAnalysisId')` est `null`

3. **Test de validation** :
   - Accéder directement à `patient-chat-precision` sans passer par le workflow
   - Vérifier que l'utilisateur est redirigé vers le dashboard avec un message d'erreur

