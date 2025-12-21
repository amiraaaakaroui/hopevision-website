# Guide de Migration - Clean Architecture

## 📋 Vue d'Ensemble

Ce guide explique comment migrer les composants existants vers la nouvelle architecture Clean Architecture.

---

## 🎯 Objectif

Séparer complètement la **logique métier** de l'**interface utilisateur** pour :
- ✅ Améliorer la testabilité
- ✅ Faciliter la maintenance
- ✅ Augmenter la réutilisabilité
- ✅ Respecter les principes SOLID

---

## 📁 Nouveaux Services Créés

### 1. `src/services/preAnalysisService.ts`
**Responsabilité :** Gestion des pre-analyses

**Fonctions disponibles :**
```typescript
// Créer une pre-analysis
createPreAnalysis({ patientProfileId, input })

// Mettre à jour une pre-analysis
updatePreAnalysis({ preAnalysisId, patientProfileId, input })

// Créer ou mettre à jour (upsert)
savePreAnalysis({ patientProfileId, input, existingPreAnalysisId })

// Soumettre une pre-analysis
submitPreAnalysis(preAnalysisId, patientProfileId, enrichedText?)

// Lire une pre-analysis
getPreAnalysis(preAnalysisId)
getPreAnalysisWithProfile(preAnalysisId)
```

**Remplace :** Tous les appels `supabase.from('pre_analyses')` dans les composants

---

### 2. `src/services/storageService.ts`
**Responsabilité :** Gestion des uploads de fichiers

**Fonctions disponibles :**
```typescript
// Upload image
uploadImage(file, patientProfileId)
uploadImages(files[], patientProfileId)

// Upload document
uploadDocument(file, patientProfileId)

// Upload audio
uploadAudio(file, patientProfileId)

// Upload générique
uploadFile({ file, patientProfileId, bucket, folder })
uploadFiles(files[], patientProfileId, bucket, folder)

// Validation
validateFile(file, maxSizeMB)

// Créer enregistrement document
createDocumentRecord({ patientProfileId, preAnalysisId?, fileName, fileUrl, fileType, fileSizeBytes })
```

**Remplace :** Tous les appels `supabase.storage.from().upload()` dans les composants

---

### 3. `src/services/chatService.ts`
**Responsabilité :** Gestion des messages de chat

**Fonctions disponibles :**
```typescript
// Charger messages
loadMessages({ preAnalysisId })
loadCompleteHistory(preAnalysisId)

// Sauvegarder message
saveMessage({ preAnalysisId, senderType, messageText })

// Générer réponse IA
generateAIResponse({ preAnalysisId, conversationHistory })

// Extraire réponses patient
getPatientAnswers(preAnalysisId)
```

**Remplace :** 
- Tous les appels `supabase.from('chat_precision_messages')`
- Tous les appels OpenAI pour le chat
- Logique de construction de contexte médical

---

### 4. `src/services/patientDataService.ts`
**Responsabilité :** Chargement des données patient

**Fonctions disponibles :**
```typescript
// Charger rapport avec génération auto
loadAIReportWithGeneration({ preAnalysisId, maxRetries?, retryDelay? })

// Charger rapport simple
loadAIReport(preAnalysisId)
```

**Remplace :** 
- Logique de retry avec exponential backoff
- Polling pour attendre le rapport
- Transformation de données (hypotheses → results)

---

### 5. `src/hooks/useAudioRecording.ts`
**Responsabilité :** Enregistrement et transcription audio

**Hook disponible :**
```typescript
const {
  recording,
  transcribing,
  startRecording,
  stopRecording,
  transcript,
  error,
  clearTranscript,
} = useAudioRecording(patientProfileId);
```

**Remplace :** Toute la logique MediaRecorder et transcription dans les composants

---

## 🔄 Migration des Composants

### PatientSymptoms.tsx

#### ❌ AVANT (Code Spaghetti)
```typescript
const handleAnalyze = async () => {
  // ... validation ...
  
  // ❌ Appel Supabase direct dans le composant
  const { data: preAnalysis, error } = await supabase
    .from('pre_analyses')
    .insert({
      patient_profile_id: currentProfile.patientProfileId,
      status: 'draft',
      text_input: textInput.trim(),
      // ...
    })
    .select()
    .single();
    
  // ❌ Gestion d'erreur dans le composant
  if (error) throw error;
  
  // ❌ Logique métier dans le composant
  sessionStorage.setItem('currentPreAnalysisId', preAnalysis.id);
};
```

#### ✅ APRÈS (Clean Architecture)
```typescript
import { savePreAnalysis } from '../services/preAnalysisService';

const handleAnalyze = async () => {
  // ... validation ...
  
  try {
    // ✅ Utilisation du service
    const preAnalysisId = await savePreAnalysis({
      patientProfileId: currentProfile.patientProfileId,
      input: {
        textInput,
        selectedChips,
        imageUrls,
        documentUrls,
        voiceTranscript: voiceTranscriptions.join('\n\n'),
      },
      existingPreAnalysisId: sessionStorage.getItem('currentPreAnalysisId') || undefined,
    });
    
    sessionStorage.setItem('currentPreAnalysisId', preAnalysisId);
    onNavigate('patient-chat-precision');
  } catch (error: any) {
    alert(`Erreur: ${error.message}`);
  }
};
```

---

### PatientChatPrecision.tsx

#### ❌ AVANT
```typescript
const requestAiResponse = async (conversationHistory: Message[]) => {
  // ❌ Chargement de données dans le composant
  const { data: preAnalysis, error } = await supabase
    .from('pre_analyses')
    .select('*, patient_profiles(*, profiles(*))')
    .eq('id', preAnalysisId)
    .single();
    
  // ❌ Calcul d'âge dans le composant
  let age: number | undefined;
  if (profile?.date_of_birth) {
    const birthDate = new Date(profile.date_of_birth);
    // ... calcul complexe ...
  }
  
  // ❌ Construction de contexte dans le composant
  const unifiedContext = buildUnifiedMedicalContext({...});
  
  // ❌ Appel OpenAI direct
  return await generateChatResponse(openaiMessages, { unifiedContext });
};
```

#### ✅ APRÈS
```typescript
import { generateAIResponse } from '../services/chatService';

// ✅ Toute la logique est dans le service
const aiResponseText = await generateAIResponse({
  preAnalysisId,
  conversationHistory: completeHistory,
});
```

---

### PatientResults.tsx

#### ❌ AVANT
```typescript
const loadAIReportWithGeneration = async (preAnalysisId: string) => {
  // ❌ Logique de retry complexe dans le composant
  const maxRetries = 5;
  let retryCount = 0;
  let reportExists = false;
  
  while (retryCount < maxRetries && !reportExists) {
    // ❌ Requêtes Supabase directes
    const { data: existingReport } = await supabase
      .from('ai_reports')
      .select('id')
      .eq('pre_analysis_id', preAnalysisId)
      .maybeSingle();
      
    // ❌ Calcul exponential backoff dans le composant
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // ❌ Logique de génération dans le composant
    if (preAnalysis.status === 'submitted') {
      await generateAndSaveAIReport(preAnalysisId);
    }
  }
  
  // ❌ Transformation de données dans le composant
  const formattedResults: ResultItem[] = hypotheses
    .filter(h => !h.is_excluded)
    .map(h => ({...}))
    .sort((a, b) => b.confidence - a.confidence);
};
```

#### ✅ APRÈS
```typescript
import { loadAIReportWithGeneration } from '../services/patientDataService';

// ✅ Toute la logique est dans le service
const { report, results } = await loadAIReportWithGeneration({
  preAnalysisId,
  maxRetries: 5,
});

setAiReport(report);
setResults(results);
```

---

## 📝 Checklist de Migration

### Pour chaque composant à migrer :

- [ ] **Identifier les appels Supabase**
  - Chercher `supabase.from()`
  - Chercher `supabase.storage.from()`
  - Les déplacer vers un service approprié

- [ ] **Identifier les appels API externes**
  - Chercher `fetch()`, `axios()`, appels OpenAI
  - Les déplacer vers un service approprié

- [ ] **Identifier la logique métier**
  - Calculs complexes
  - Transformations de données
  - Algorithmes
  - Les déplacer vers un service ou utilitaire

- [ ] **Identifier la logique d'état complexe**
  - Gestion de retry
  - Polling
  - State machines
  - Créer un hook personnalisé

- [ ] **Nettoyer le composant**
  - Ne garder que l'UI (JSX)
  - Utiliser les services/hooks créés
  - Simplifier les handlers

- [ ] **Tester**
  - Vérifier que tout fonctionne
  - Tester les services unitairement
  - Tester le composant avec mocks

---

## 🧪 Tests des Services

### Exemple : Test de preAnalysisService

```typescript
// tests/services/preAnalysisService.test.ts
import { createPreAnalysis } from '../src/services/preAnalysisService';

describe('preAnalysisService', () => {
  it('should create a pre-analysis', async () => {
    const result = await createPreAnalysis({
      patientProfileId: 'test-id',
      input: {
        textInput: 'Test symptoms',
        selectedChips: ['5 jours'],
      },
    });
    
    expect(result.id).toBeDefined();
    expect(result.status).toBe('draft');
  });
});
```

**Avantage :** Testable sans renderer de composant React !

---

## ✅ Résultat Final

### Architecture Avant
```
Components/
├── PatientSymptoms.tsx (705 lignes)
│   ├── UI
│   ├── Supabase Queries ❌
│   ├── Storage Uploads ❌
│   ├── OpenAI Calls ❌
│   └── Business Logic ❌
```

### Architecture Après
```
Components/
└── PatientSymptoms.tsx (400 lignes)
    └── UI uniquement ✅

Services/
├── preAnalysisService.ts ✅
├── storageService.ts ✅
├── chatService.ts ✅
└── patientDataService.ts ✅

Hooks/
└── useAudioRecording.ts ✅
```

---

## 🚀 Prochaines Étapes

1. **Tester les services créés**
2. **Remplacer les composants originaux** par les versions refactorisées
3. **Migrer les autres composants** (DoctorDashboard, etc.)
4. **Ajouter des tests unitaires** pour les services
5. **Documenter les services** avec JSDoc

---

**Date de création :** 27 janvier 2025  
**Architecture :** Clean Architecture + Separation of Concerns

