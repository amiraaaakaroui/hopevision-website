# 🔧 Correction Rapide - Supprimer les lignes de patient_profiles

## ❌ Problème

Quand vous essayez de supprimer des lignes dans `patient_profiles` dans Supabase :
- Le message dit "Successfully deleted selected row(s)"
- Mais les lignes restent visibles dans la table

## 🔍 Cause

Un **trigger de soft delete** est activé sur `patient_profiles`. Ce trigger intercepte les opérations DELETE et met à jour `deleted_at` au lieu de supprimer réellement les lignes.

## ✅ Solution rapide

### Option 1 : Désactiver le trigger (recommandé pour les tests)

Exécutez ce script dans **Supabase SQL Editor** :

**Fichier:** `supabase_disable_soft_delete_for_testing.sql`

```sql
DROP TRIGGER IF EXISTS trg_soft_delete_patient_profiles ON patient_profiles;
```

Ensuite, vous pourrez supprimer les lignes normalement via l'interface Supabase.

### Option 2 : Supprimer toutes les lignes via SQL

Exécutez ce script pour supprimer définitivement toutes les lignes :

**Fichier:** `supabase_hard_delete_patient_profiles.sql`

```sql
-- Désactiver le trigger
DROP TRIGGER IF EXISTS trg_soft_delete_patient_profiles ON patient_profiles;

-- Supprimer toutes les lignes
DELETE FROM patient_profiles;

-- Vérifier
SELECT COUNT(*) FROM patient_profiles; -- Devrait retourner 0
```

### Option 3 : Nettoyer toutes les données de test

Exécutez ce script pour tout nettoyer :

**Fichier:** `supabase_cleanup_all_test_data.sql`

⚠️ **ATTENTION**: Ce script supprime TOUTES les données !

## 🎯 Étapes recommandées

1. **Exécutez le script de désactivation du trigger** :
   ```sql
   DROP TRIGGER IF EXISTS trg_soft_delete_patient_profiles ON patient_profiles;
   ```

2. **Rafraîchissez la page** dans Supabase Table Editor

3. **Essayez de supprimer à nouveau** les lignes via l'interface

4. Les lignes devraient maintenant être supprimées définitivement

## 📝 Note importante

Le soft delete est une fonctionnalité de sécurité pour éviter la suppression accidentelle. Pour les tests, il est normal de le désactiver temporairement.

Si vous voulez réactiver le soft delete plus tard, exécutez à nouveau `supabase_soft_delete_upgrade.sql`.

