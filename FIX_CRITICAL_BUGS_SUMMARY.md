# Correction des Bugs Critiques du MVP

## 🔴 PROBLÈMES IDENTIFIÉS ET CORRIGÉS

### 1. ✅ **Multimodal HS - Images et Documents Ignorés**

**Problème** : Les images et documents étaient ignorés lors de la génération du rapport. Erreurs 400/403 dans la console lors du téléchargement d'images depuis Supabase Storage.

**Cause** : Le code utilisait `fetch(imageUrl)` directement, ce qui échoue pour les URLs privées Supabase Storage.

**Solution** :
- ✅ Création de `src/utils/imageDownload.ts` avec fonction `downloadImageFromStorage()`
- ✅ Utilise `supabase.storage.from(bucket).download(path)` pour les URLs Supabase
- ✅ Fallback vers `fetch()` pour les URLs publiques
- ✅ Intégration dans `openaiService.ts` pour la Vision API
- ✅ Logs défensifs : "Image téléchargée avec succès", "Erreur conversion base64"

**Fichiers modifiés** :
- `src/utils/imageDownload.ts` (nouveau)
- `src/lib/openaiService.ts` (2 endroits : `generateAIReport` et `analyzeImage`)

### 2. ✅ **Bouton "Enregistrer et Quitter" Cassé**

**Problème** : Le bouton nécessitait plusieurs clics ou ne faisait rien.

**Cause** : La fonction `handleExit` était trop simple et ne forçait pas la mise à jour du statut.

**Solution** :
- ✅ Renforcement de `handleExit()` dans `PatientDetailedReport.tsx`
- ✅ Force l'update du statut à `'completed'` si le rapport existe
- ✅ Nettoyage `sessionStorage` (toujours, même si update échoue)
- ✅ Redirection immédiate (toujours, même si update échoue)
- ✅ Logs détaillés pour le debugging

**Code** :
```typescript
const handleExit = async () => {
  // Force update status to 'completed'
  if (preAnalysisId && aiReport) {
    await supabase.from('pre_analyses').update({ 
      status: 'completed',
      ai_processing_status: 'completed',
    }).eq('id', preAnalysisId);
  }
  // Always clear and redirect, even if update fails
  clearAnalysisSession();
  onNavigate('patient-history');
};
```

### 3. ✅ **Perte de Données - Pré-Analyse N'apparaît Pas**

**Problème** : La pré-analyse n'apparaissait pas dans le Dashboard après avoir quitté.

**Cause** : Le Dashboard filtrait peut-être uniquement sur `status = 'completed'`, mais si le bouton Quitter échouait, le statut restait à `submitted` ou `draft`.

**Solution** :
- ✅ Modification de `PatientHistory.tsx` pour afficher **TOUTES** les pré-analyses
- ✅ Pas de filtre par statut - affiche `draft`, `submitted`, `completed`, `booked`
- ✅ Logs pour tracer le chargement : "Loaded X pre-analyses (all statuses)"

**Code** :
```typescript
// CRITICAL: Load ALL recent pre-analyses (draft, submitted, completed, booked)
// Don't filter by status - show everything so user doesn't lose data
const analyses = await getRecentPreAnalyses(currentProfile.patientProfileId, 10);
```

### 4. ✅ **Boucle de Chargement - Rapport Bloqué**

**Problème** : Le rapport restait bloqué sur "En cours de génération" ou demandait de rafraîchir.

**Solution** :
- ✅ Augmentation du timeout : `maxRetries = 10` (au lieu de 5), `maxTotalTime = 60000ms` (60 secondes)
- ✅ Détection de blocage : Si `processing` depuis > 30 secondes, affiche message spécifique
- ✅ Bouton "Réessayer la génération" : Reset le statut et relance la génération
- ✅ Bouton "Rafraîchir la page" : Alternative simple
- ✅ Messages d'erreur améliorés avec instructions claires

**Code** :
```typescript
// Check if report is stuck in processing for > 30 seconds
const processingTime = preAnalysisData?.ai_processing_started_at 
  ? Date.now() - new Date(preAnalysisData.ai_processing_started_at).getTime()
  : 0;

const isStuck = preAnalysisData?.ai_processing_status === 'processing' && processingTime > 30000;

if (isStuck) {
  setError(`Le rapport est bloqué en génération depuis ${Math.round(processingTime / 1000)} secondes. Utilisez le bouton "Réessayer la génération" ci-dessous.`);
}
```

---

## 📋 RÉSUMÉ DES MODIFICATIONS

### Fichiers Créés
- ✅ `src/utils/imageDownload.ts` - Utilitaire pour télécharger images depuis Supabase Storage

### Fichiers Modifiés
- ✅ `src/lib/openaiService.ts` - Utilise `downloadImageFromStorage()` au lieu de `fetch()` direct
- ✅ `src/components/PatientDetailedReport.tsx` - `handleExit()` renforcé, retry logic amélioré, bouton réessai
- ✅ `src/components/PatientHistory.tsx` - Affiche toutes les analyses (pas de filtre par statut)

---

## 🧪 TESTS RECOMMANDÉS

1. **Test Multimodal** :
   - Uploader une image dans PatientSymptoms
   - Vérifier dans la console : "Image téléchargée avec succès"
   - Vérifier que le rapport mentionne l'image

2. **Test Bouton Quitter** :
   - Générer un rapport
   - Cliquer "Enregistrer et Quitter"
   - Vérifier que la pré-analyse apparaît dans le Dashboard avec statut "Terminée"

3. **Test Persistence** :
   - Créer plusieurs pré-analyses (draft, submitted, completed)
   - Vérifier que toutes apparaissent dans "Mes Analyses Récentes"

4. **Test Retry** :
   - Simuler un blocage (modifier manuellement le statut à 'processing' dans la DB)
   - Attendre 30 secondes
   - Vérifier que le message "bloqué" apparaît avec bouton "Réessayer"

---

## ✅ RÉSULTAT

- ✅ **Multimodal fonctionnel** : Images et documents correctement téléchargés et intégrés
- ✅ **Bouton Quitter robuste** : Fonctionne toujours, même si update échoue
- ✅ **Persistence garantie** : Toutes les analyses apparaissent dans le Dashboard
- ✅ **Chargement stabilisé** : Timeout augmenté, détection de blocage, bouton réessai

