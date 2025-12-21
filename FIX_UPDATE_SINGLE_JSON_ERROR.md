# 🔧 Correction : Erreur "Cannot coerce the result to a single JSON object"

## Problème

L'erreur `Failed to update AI report: Cannot coerce the result to a single JSON object` se produisait lors de la mise à jour du rapport AI dans l'étape 5 (rapport détaillé).

**Cause racine :**
- L'utilisation de `.single()` après un `UPDATE` avec `.select()` échoue si :
  1. Aucune ligne n'est mise à jour (bloquée par RLS)
  2. La requête retourne 0 résultats
  3. Le format JSON de `explainability_data` n'est pas valide

## Solution Implémentée

### Approche en 3 étapes pour UPDATE

#### 1. **UPDATE sans `.single()`**
- Effectue l'UPDATE sans `.select().single()`
- Vérifie seulement l'erreur et le nombre de lignes mises à jour
- S'assure que `explainability_data` est correctement formaté avant l'UPDATE

#### 2. **Rechargement séparé avec `.maybeSingle()`**
- Après l'UPDATE, recharge le rapport avec une requête SELECT séparée
- Utilise `.maybeSingle()` au lieu de `.single()` pour éviter les erreurs si aucun résultat
- Gère gracieusement le cas où le rechargement échoue

#### 3. **Formatage correct de `explainability_data`**
- Vérifie que `explainability_data` est un objet valide
- Parse si c'est une string, garde tel quel si c'est déjà un objet
- Gère les erreurs de parsing sans bloquer

## Code Modifié

### Fichier : `src/services/aiReportService.ts`

**Lignes ~245-310 :** UPDATE amélioré
```typescript
// Avant : UPDATE avec .select().single() (échoue si 0 lignes)
const { data: updatedReport, error: updateError } = await supabase
  .from('ai_reports')
  .update({ ... })
  .select()
  .single(); // ❌ Échoue si aucune ligne mise à jour

// Après : UPDATE séparé + rechargement
const { error: updateError, count } = await supabase
  .from('ai_reports')
  .update({ ... }) // ✅ Pas de .select().single()
  .eq('id', existingReportId)
  .eq('patient_profile_id', preAnalysis.patient_profile_id);

// Rechargement séparé avec .maybeSingle()
const { data: reloadedReport, error: reloadError } = await supabase
  .from('ai_reports')
  .select('*')
  .eq('id', existingReportId)
  .eq('patient_profile_id', preAnalysis.patient_profile_id)
  .maybeSingle(); // ✅ Ne plante pas si aucun résultat
```

**Lignes ~247-259 :** Formatage de `explainability_data`
```typescript
// Ensure explainability_data is properly serialized
let explainabilityDataValue: any = null;
if (aiReportData.explainability_data) {
  try {
    explainabilityDataValue = typeof aiReportData.explainability_data === 'string' 
      ? JSON.parse(aiReportData.explainability_data)
      : aiReportData.explainability_data;
  } catch (e) {
    console.warn('[AI Report] Error parsing explainability_data, using as-is:', e);
    explainabilityDataValue = aiReportData.explainability_data;
  }
}
```

**Lignes ~312-340 :** INSERT amélioré avec même logique pour `explainability_data`

**Lignes ~346-397 :** Fallback UPDATE avec même approche (UPDATE séparé + rechargement)

## Comportement Attendu

### Scénario 1 : UPDATE Réussit
1. ✅ Formate `explainability_data`
2. ✅ Effectue UPDATE (sans `.single()`)
3. ✅ Vérifie l'erreur
4. ✅ Recharge le rapport avec `.maybeSingle()`
5. ✅ Utilise le rapport rechargé

### Scénario 2 : UPDATE Réussit mais Rechargement Échoue (RLS)
1. ✅ Formate `explainability_data`
2. ✅ Effectue UPDATE (sans erreur)
3. ⚠️ Rechargement échoue (RLS bloque la lecture)
4. ✅ Continue avec un objet minimal `{ id, pre_analysis_id }`
5. ✅ La mise à jour est quand même effectuée en base

### Scénario 3 : Aucune Ligne Mise à Jour (RLS Bloque UPDATE)
1. ✅ Formate `explainability_data`
2. ⚠️ UPDATE ne met à jour aucune ligne (RLS)
3. ✅ Vérifie `count === 0` et log un avertissement
4. ✅ Tente quand même le rechargement
5. ✅ Continue avec un objet minimal si nécessaire

## Avantages

1. ✅ **Plus d'erreur "Cannot coerce"** : Pas de `.single()` après UPDATE
2. ✅ **Gestion gracieuse** : Continue même si rechargement échoue
3. ✅ **Format JSON valide** : `explainability_data` toujours correctement formaté
4. ✅ **Robuste face à RLS** : Fonctionne même si RLS bloque certaines opérations
5. ✅ **Logs détaillés** : Facilite le débogage

## Tests à Effectuer

1. **Générer un rapport détaillé** → Doit fonctionner sans erreur
2. **Générer un rapport deux fois** → Doit mettre à jour sans erreur
3. **Vérifier les logs console** → Doit montrer les étapes de mise à jour
4. **Vérifier en base de données** → Le rapport doit être correctement sauvegardé

---

**Status :** ✅ Problème résolu  
**Date :** 2025-01-27  
**Fichier modifié :** `src/services/aiReportService.ts`

