# ✅ Fix Complet - Rapport Détaillé Non Généré

## 🔍 Problème Identifié

L'étape 5 (Rapport détaillé) affichait "Aucune pré-analyse trouvée" au lieu d'afficher le rapport généré.

## ✅ Corrections Appliquées

### Fichier: `src/components/PatientDetailedReport.tsx`

#### 1. Amélioration de la récupération de `preAnalysisId`

**Problème**: Si `preAnalysisId` n'est pas dans sessionStorage, le composant affichait immédiatement une erreur.

**Solution**: Ajout de la fonction `loadMostRecentPreAnalysis()` qui:
- Cherche automatiquement la pré-analyse la plus récente du patient
- Essaie plusieurs statuts: `submitted`, `completed`, puis `draft`
- Sauvegarde l'ID trouvé dans sessionStorage
- Charge automatiquement les données

**Code ajouté** (lignes ~47-113):
```typescript
const loadMostRecentPreAnalysis = async () => {
  // 1. Try submitted/completed pre-analyses
  let { data: recentPreAnalysis } = await supabase
    .from('pre_analyses')
    .select('id, status')
    .eq('patient_profile_id', currentProfile.patientProfileId)
    .in('status', ['submitted', 'completed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 2. If not found, try draft pre-analyses
  if (!recentPreAnalysis) {
    const { data: draftPreAnalysis } = await supabase
      .from('pre_analyses')
      .select('id, status')
      .eq('patient_profile_id', currentProfile.patientProfileId)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (draftPreAnalysis) {
      recentPreAnalysis = draftPreAnalysis;
    }
  }

  // 3. If still not found, try any pre-analysis
  if (!recentPreAnalysis) {
    const { data: anyPreAnalysis } = await supabase
      .from('pre_analyses')
      .select('id, status')
      .eq('patient_profile_id', currentProfile.patientProfileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (anyPreAnalysis) {
      recentPreAnalysis = anyPreAnalysis;
    }
  }

  if (recentPreAnalysis) {
    sessionStorage.setItem('currentPreAnalysisId', recentPreAnalysis.id);
    setPreAnalysisId(recentPreAnalysis.id);
    loadReportData(recentPreAnalysis.id);
  } else {
    setError('Aucune pré-analyse trouvée. Veuillez créer une nouvelle pré-analyse.');
    setLoading(false);
  }
};
```

#### 2. Génération automatique du rapport AI

**Problème**: Le rapport n'était pas généré automatiquement s'il n'existait pas.

**Solution**: Le code génère maintenant automatiquement le rapport:
- Vérifie si le rapport existe
- Si non, génère automatiquement avec `generateAndSaveAIReport()`
- Utilise une logique de retry avec exponential backoff
- Affiche le rapport une fois généré

**Code amélioré** (lignes ~116-227):
```typescript
const loadReportData = async (preAnalysisId: string) => {
  // 1. Load pre-analysis
  const { data: preAnalysisData } = await supabase
    .from('pre_analyses')
    .select('*')
    .eq('id', preAnalysisId)
    .single();

  // 2. Check if AI report exists
  const { data: existingReport } = await supabase
    .from('ai_reports')
    .select('id, ai_processing_status')
    .eq('pre_analysis_id', preAnalysisId)
    .maybeSingle();

  // 3. Generate report if missing or processing
  if (!existingReport || preAnalysisData.ai_processing_status === 'pending' || preAnalysisData.ai_processing_status === 'processing') {
    // Update status
    await supabase
      .from('pre_analyses')
      .update({ status: 'submitted', ai_processing_status: 'pending' })
      .eq('id', preAnalysisId);

    // Generate report
    const { generateAndSaveAIReport } = await import('../services/aiReportService');
    await generateAndSaveAIReport(preAnalysisId);
  }

  // 4. Load report with retry logic
  let reportData = null;
  let retryCount = 0;
  while (retryCount < maxRetries && !reportData) {
    const { data, error } = await supabase
      .from('ai_reports')
      .select('*, diagnostic_hypotheses(*)')
      .eq('pre_analysis_id', preAnalysisId)
      .single();

    if (data) {
      reportData = data;
      break;
    }

    // Wait and retry
    const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
    await new Promise(resolve => setTimeout(resolve, delay));
    retryCount++;
  }

  // 5. Set report data
  if (reportData) {
    setAiReport(reportData);
    setHypotheses(reportData.diagnostic_hypotheses);
  }
};
```

#### 3. Amélioration des messages d'erreur

- Messages d'erreur plus clairs et spécifiques
- Bouton "Réessayer" pour relancer la génération
- Logs détaillés dans la console pour le debugging

## 📋 Comportement Attendu

### Scénario 1: Navigation depuis PatientResults
1. Utilisateur clique sur "Générer un rapport détaillé"
2. `preAnalysisId` est dans sessionStorage
3. Le composant charge directement la pré-analyse
4. Génère le rapport si nécessaire
5. Affiche le rapport détaillé ✅

### Scénario 2: Accès direct (URL ou refresh)
1. `preAnalysisId` n'est pas dans sessionStorage
2. Le composant cherche automatiquement la pré-analyse la plus récente
3. Trouve une pré-analyse (soumis, complétée, ou draft)
4. Génère le rapport si nécessaire
5. Affiche le rapport détaillé ✅

### Scénario 3: Rapport en cours de génération
1. Le rapport n'existe pas encore
2. Le composant génère automatiquement le rapport
3. Attend avec retry logic (exponential backoff)
4. Affiche le rapport une fois généré ✅

### Scénario 4: Aucune pré-analyse
1. Aucune pré-analyse trouvée dans la base
2. Affiche un message clair
3. Invite l'utilisateur à créer une nouvelle pré-analyse ✅

## 🔧 Fichiers Modifiés

1. ✅ `src/components/PatientDetailedReport.tsx`
   - Ajout de `loadMostRecentPreAnalysis()` (lignes ~47-113)
   - Amélioration de `loadReportData()` avec génération automatique (lignes ~116-227)
   - Amélioration des messages d'erreur

## ✅ Résultat

Le rapport détaillé devrait maintenant:
- ✅ Se générer automatiquement si absent
- ✅ Se charger même si `preAnalysisId` n'est pas dans sessionStorage
- ✅ Afficher un message clair en cas d'erreur
- ✅ Fonctionner dans tous les scénarios de navigation

---

**✅ Le rapport détaillé devrait maintenant fonctionner correctement!**

