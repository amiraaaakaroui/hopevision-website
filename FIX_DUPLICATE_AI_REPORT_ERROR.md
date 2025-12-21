# 🔧 Fix: Erreur "duplicate key value violates unique constraint ai_reports_pre_analysis_id_key"

## Problème

L'erreur `duplicate key value violates unique constraint "ai_reports_pre_analysis_id_key"` se produit lorsqu'on essaie de générer un rapport AI alors qu'un rapport existe déjà pour cette pré-analyse.

## Solution

Deux corrections ont été appliquées :

### 1. Code Frontend (`src/services/aiReportService.ts`)

**Changement :** Vérification et suppression du rapport existant avant de créer un nouveau

- ✅ Vérifie si un rapport existe déjà pour la pré-analyse
- ✅ Supprime d'abord les hypothèses diagnostiques associées (contrainte de clé étrangère)
- ✅ Supprime ensuite le rapport existant
- ✅ Gestion d'erreur améliorée avec messages clairs pour les erreurs RLS

**Lignes modifiées :** ~138-161

### 2. Politiques RLS Supabase (SQL)

**Fichier créé :** `supabase_add_delete_policies_ai_reports.sql`

**Contenu :**
- Politique DELETE pour `diagnostic_hypotheses` (permettre aux patients de supprimer leurs propres hypothèses)
- Politique DELETE pour `ai_reports` (permettre aux patients de supprimer leurs propres rapports)

## Instructions d'Application

### Étape 1 : Exécuter le fichier SQL dans Supabase

1. Ouvrir **Supabase Dashboard** → **SQL Editor**
2. Ouvrir le fichier `supabase_add_delete_policies_ai_reports.sql`
3. Copier tout le contenu
4. Coller dans l'éditeur SQL
5. Cliquer sur **Run** (ou Ctrl+Enter)

### Étape 2 : Vérifier que les politiques ont été créées

Exécuter cette requête dans Supabase SQL Editor :

```sql
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('ai_reports', 'diagnostic_hypotheses')
AND cmd = 'DELETE'
ORDER BY tablename, policyname;
```

**Résultat attendu :**
- `ai_reports` | `Patients can delete own AI reports` | DELETE
- `diagnostic_hypotheses` | `Patients can delete own diagnostic hypotheses` | DELETE

### Étape 3 : Tester

1. Créer une nouvelle pré-analyse
2. Finaliser la pré-analyse (générer le rapport AI)
3. Si vous obtenez l'erreur de duplication, le code devrait maintenant supprimer l'ancien rapport et créer un nouveau
4. Vérifier que le rapport est généré sans erreur

## Comportement Attendu

**Avant la correction :**
- ❌ Erreur : `duplicate key value violates unique constraint "ai_reports_pre_analysis_id_key"`
- ❌ Le rapport n'est pas créé

**Après la correction :**
- ✅ Si un rapport existe déjà, il est supprimé (avec ses hypothèses)
- ✅ Un nouveau rapport est créé
- ✅ Pas d'erreur de duplication

## Gestion des Erreurs

Si la suppression échoue à cause de RLS (politique non appliquée), vous obtiendrez un message d'erreur clair :
- `"Un rapport existe déjà pour cette pré-analyse. Veuillez contacter le support si vous souhaitez le régénérer."`

**Solution :** Exécuter le fichier SQL `supabase_add_delete_policies_ai_reports.sql` dans Supabase.

## Fichiers Modifiés

1. ✅ `src/services/aiReportService.ts` - Vérification et suppression des rapports existants
2. ✅ `supabase_add_delete_policies_ai_reports.sql` - Politiques DELETE pour RLS (nouveau fichier)

## Notes Importantes

- ⚠️ **Important :** Le fichier SQL doit être exécuté dans Supabase pour que la suppression fonctionne
- ✅ Le code gère déjà les erreurs RLS avec des messages clairs
- ✅ La suppression respecte les politiques RLS (patients ne peuvent supprimer que leurs propres rapports)

---

**Status :** ✅ Code corrigé | ⏳ SQL à exécuter dans Supabase

