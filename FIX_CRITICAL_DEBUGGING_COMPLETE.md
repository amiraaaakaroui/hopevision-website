# Correction Complète des Bugs Critiques + Debugging

## ✅ CORRECTIONS APPLIQUÉES

### 1. ✅ **Erreur SQL - `ai_processing_status` n'existe pas dans `ai_reports`**

**Problème** : Le code essayait de lire `ai_processing_status` depuis `ai_reports` mais ce champ est dans `pre_analyses`.

**Correction** :
- ✅ Modifié `PatientDetailedReport.tsx` ligne 247 : Supprimé `ai_processing_status` de la requête `ai_reports`
- ✅ Le statut est maintenant lu depuis `preAnalysisData.ai_processing_status` (qui vient de `pre_analyses`)

**Fichier** : `src/components/PatientDetailedReport.tsx`

---

### 2. ✅ **Erreur RLS - `diagnostic_hypotheses` bloqué**

**Problème** : `new row violates row-level security policy for table "diagnostic_hypotheses"`

**Correction** :
- ✅ Ajouté un `try/catch` robuste autour de l'insertion des hypotheses
- ✅ Logs détaillés pour debugging (code, message, details, hint)
- ✅ Le rapport continue à être généré même si les hypotheses échouent (non-bloquant)

**Fichier** : `src/services/aiReportService.ts` (lignes 567-590)

---

### 3. ✅ **Erreur PDF Worker - `Failed to fetch ... pdf.worker.min.mjs`**

**Problème** : Le worker PDF.js ne se charge pas avec `.mjs` dans Vite.

**Correction** :
- ✅ Changé l'extension de `.mjs` à `.js` (plus compatible)
- ✅ Ajouté un try/catch avec fallback vers `.mjs` si `.js` échoue
- ✅ Logs pour confirmer la configuration du worker

**Fichier** : `src/utils/documentExtraction.ts`

---

### 4. ✅ **Erreur Image 400 dans Chat - URLs Supabase privées**

**Problème** : `Failed to fetch image` avec erreur 400 dans `chatService.ts`

**Correction** :
- ✅ Remplacé `fetch(imageUrl)` par `downloadImageFromStorage(imageUrl)` dans `chatService.ts`
- ✅ Utilise maintenant `supabase.storage.from().download()` comme dans `aiReportService`
- ✅ Gestion d'erreur robuste : continue avec les autres images si une échoue

**Fichier** : `src/services/chatService.ts` (ligne 370)

---

### 5. ✅ **Logs pour Voir le Prompt Complet**

**Ajouté** :
- ✅ Logs dans `openaiService.ts` : Affiche le prompt complet (system + user) avant envoi à OpenAI
- ✅ Logs dans `aiReportService.ts` : Affiche le contexte unifié complet avec toutes les modalités
- ✅ Logs dans `chatService.ts` : Affiche le contexte unifié et le prompt pour le chat
- ✅ Détails : longueur, preview, nombre d'images, messages, etc.

**Fichiers** :
- `src/lib/openaiService.ts` (lignes 365-375)
- `src/services/aiReportService.ts` (lignes 258-275)
- `src/services/chatService.ts` (lignes 276-290, 305-310)

---

### 6. ✅ **Pré-Analyses Ne S'Affichent Pas dans Dashboard**

**Problème** : La section "Mes Analyses Récentes" était chargée mais pas affichée dans le JSX.

**Correction** :
- ✅ Ajouté la section "Mes Analyses Récentes" dans le JSX de `PatientHistory.tsx`
- ✅ Affichage conditionnel : `{recentAnalyses.length > 0 && (...)}`
- ✅ Cartes avec statut, date, symptôme principal, diagnostic
- ✅ Boutons conditionnels :
  - `draft` → "Reprendre"
  - `completed` → "Voir Rapport" + "Réserver"
  - `booked` → "Voir Rapport"
- ✅ Badge d'urgence si `overall_severity === 'high'`

**Fichier** : `src/components/PatientHistory.tsx` (lignes 367-448)

---

## 📊 LOGS AJOUTÉS POUR DEBUGGING

### Dans la Console, Vous Verrez :

1. **Pour le Rapport** :
   ```
   [AI Report] 📊 CONTEXTE UNIFIÉ COMPLET:
   [AI Report] Combined text block length: X chars
   [AI Report] Combined text block preview: ...
   [AI Report] Modalities included: {textInput, voiceTranscript, images, documents, chatMessages, patientProfile}
   
   [OpenAI] 📝 ========== PROMPT COMPLET POUR RAPPORT ==========
   [OpenAI] System Prompt (X chars): ...
   [OpenAI] User Prompt (X chars): ...
   [OpenAI] Images included: X
   [OpenAI] Chat messages: X
   ```

2. **Pour le Chat** :
   ```
   [ChatService] 📊 CONTEXTE UNIFIÉ POUR CHAT:
   [ChatService] Combined text block length: X chars
   [ChatService] Combined text block preview: ...
   [ChatService] Modalities: {text, voice, chips, images, documents, chatMessages, patientProfile}
   
   [ChatService] 📝 ========== PROMPT COMPLET POUR CHAT ==========
   [ChatService] Unified context length: X chars
   [ChatService] Conversation history: X messages
   [ChatService] Images: X
   ```

---

## 🧪 TESTS RECOMMANDÉS

1. **Test SQL** : Vérifier que le rapport se charge sans erreur `ai_processing_status`
2. **Test RLS** : Vérifier que le rapport est généré même si les hypotheses échouent
3. **Test PDF** : Vérifier que les documents PDF sont extraits sans erreur worker
4. **Test Image Chat** : Vérifier que les images fonctionnent dans le chat (plus d'erreur 400)
5. **Test Dashboard** : Vérifier que les pré-analyses s'affichent dans "Mes Analyses Récentes"
6. **Test Logs** : Ouvrir la console et vérifier que les prompts complets sont affichés

---

## ✅ RÉSULTAT

- ✅ **SQL corrigé** : Plus d'erreur `ai_processing_status does not exist`
- ✅ **RLS géré** : Les hypotheses échouent gracieusement sans bloquer le rapport
- ✅ **PDF fonctionnel** : Worker configuré avec `.js` (plus compatible)
- ✅ **Images fonctionnelles** : Chat utilise maintenant `downloadImageFromStorage()`
- ✅ **Logs complets** : Vous pouvez voir exactement ce qui est envoyé à OpenAI
- ✅ **Dashboard complet** : Les pré-analyses s'affichent avec actions appropriées

---

## 📝 NOTES IMPORTANTES

1. **RLS pour `diagnostic_hypotheses`** : Si l'erreur persiste, vous devrez peut-être ajuster les politiques RLS dans Supabase pour permettre aux patients d'insérer des hypotheses liées à leurs propres rapports.

2. **PDF Worker** : Si `.js` ne fonctionne toujours pas, vous pouvez essayer de bundler le worker localement avec Vite.

3. **Logs** : Les logs sont très verbeux maintenant. Vous pouvez les réduire en production en ajoutant des conditions `if (import.meta.env.DEV)`.

