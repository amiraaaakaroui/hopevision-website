# Flow complet de pré-analyse avec OpenAI

## 📊 Vue d'ensemble du processus

```
1. Consentement Patient
   ↓
2. Saisie des symptômes (texte/voix/image/document)
   ↓
3. Création de pre_analysis (status: 'draft')
   ↓
4. Chat de précision (Questions AI)
   ↓
5. Génération du rapport AI (status: 'submitted')
   ↓
6. Affichage des résultats
```

## 🔄 Flux détaillé

### Étape 1: Consentement (PatientConsent.tsx)

**Actions:**
- ✅ Enregistrer le consentement dans la base de données (nouveau champ ou table)
- ✅ Naviguer vers PatientSymptoms après validation

**Modifications nécessaires:**
- Ajouter un champ `consent_given` ou créer une table `patient_consents`
- Sauvegarder le consentement avec timestamp

### Étape 2: Saisie des symptômes (PatientSymptoms.tsx)

**Actions:**
- ✅ Collecte texte (existant)
- 🔧 Transcription vocale (à améliorer avec OpenAI Whisper)
- 🔧 Upload et analyse d'images (à améliorer avec OpenAI Vision)
- ✅ Upload documents (existant)

**Améliorations nécessaires:**
1. **Transcription vocale:**
   - Utiliser `openaiService.transcribeAudio()` 
   - Enregistrer l'audio via MediaRecorder API
   - Transmettre à OpenAI Whisper
   - Stocker la transcription

2. **Upload images:**
   - Upload vers Supabase Storage
   - Optionnel: Analyse avec OpenAI Vision
   - Stocker les URLs

3. **Création pre_analysis:**
   - Après "Analyser mes symptômes"
   - Status: 'draft'
   - Stocker toutes les données collectées

### Étape 3: Chat de précision (PatientChatPrecision.tsx)

**Actions:**
- ✅ Charger les messages existants (existant)
- 🔧 Générer première question AI avec OpenAI (à implémenter)
- 🔧 Répondre aux questions patient avec OpenAI (à implémenter)
- ✅ Sauvegarder messages (existant)

**Améliorations nécessaires:**
1. **Première question:**
   - Au chargement, si pas de messages
   - Appeler `openaiService.analyzeSymptoms()` 
   - Sauvegarder la première question de l'AI

2. **Conversation:**
   - Utiliser `openaiService.generateChatResponse()`
   - Passer l'historique de conversation
   - Générer réponses contextuelles

3. **Fin du chat:**
   - Mettre status: 'submitted'
   - Déclencher génération du rapport

### Étape 4: Génération du rapport (Nouveau service)

**Actions:**
- 🔧 Générer rapport AI complet
- 🔧 Créer ai_report dans la base
- 🔧 Créer diagnostic_hypotheses
- 🔧 Mettre status: 'processing' → 'completed'

**Nouveau composant/service:**
- Créer `generateAIReportService.ts` ou intégrer dans PatientResults
- Appeler `openaiService.generateAIReport()`
- Parser et sauvegarder dans la base

### Étape 5: Affichage résultats (PatientResults.tsx)

**Actions:**
- ✅ Charger ai_report (existant)
- ✅ Afficher diagnostic_hypotheses (existant)
- 🔧 Attendre si status: 'processing' (à améliorer)

**Améliorations nécessaires:**
- Polling ou WebSocket pour attendre la génération
- Indicateur de chargement pendant génération
- Affichage des résultats une fois prêt

## 🔧 Implémentation

### Fichiers à modifier/créer:

1. ✅ `src/lib/openaiService.ts` - Service OpenAI complet
2. 🔧 `src/components/PatientConsent.tsx` - Sauvegarder consentement
3. 🔧 `src/components/PatientSymptoms.tsx` - Transcription vocale + analyse images
4. 🔧 `src/components/PatientChatPrecision.tsx` - Intégrer OpenAI
5. 🔧 `src/components/PatientResults.tsx` - Générer rapport si manquant
6. 🔧 Nouveau: Service pour générer et sauvegarder le rapport

### Prochaines étapes:

1. Améliorer PatientSymptoms avec transcription vocale
2. Améliorer PatientChatPrecision avec OpenAI
3. Créer service de génération de rapport
4. Tester le flux complet

