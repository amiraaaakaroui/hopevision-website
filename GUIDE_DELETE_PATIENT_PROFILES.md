# 🔧 Guide - Supprimer définitivement les lignes de patient_profiles

## ❌ Problème

Quand vous essayez de supprimer des lignes dans `patient_profiles` dans Supabase :
- Vous obtenez l'erreur : `violates foreign key constraint "pre_analyses_patient_profile_id_fkey"`
- Les lignes restent visibles après "suppression" à cause du soft delete

## 🔍 Causes

1. **Soft Delete** : Un trigger intercepte les DELETE et met à jour `deleted_at` au lieu de supprimer réellement
2. **Contraintes de clés étrangères** : Plusieurs tables référencent `patient_profiles`, donc il faut supprimer dans le bon ordre

## ✅ Solution

Exécutez le script **`FIX_DELETE_PATIENT_PROFILES_COMPLETE.sql`** dans Supabase SQL Editor.

Ce script :
1. ✅ Désactive tous les triggers de soft delete
2. ✅ Supprime toutes les tables enfants dans le bon ordre
3. ✅ Supprime finalement `patient_profiles`
4. ✅ Vérifie que tout est supprimé

## 📝 Étapes

1. **Ouvrez Supabase Dashboard** → SQL Editor
2. **Copiez-collez le contenu** de `FIX_DELETE_PATIENT_PROFILES_COMPLETE.sql`
3. **Exécutez le script**
4. **Rafraîchissez la page** du Table Editor dans Supabase
5. Les lignes ne devraient plus être visibles ! ✅

## 📊 Ordre de suppression

Le script supprime dans cet ordre (enfants d'abord) :

1. `chat_precision_messages` → références `pre_analyses`
2. `diagnostic_hypotheses` → références `ai_reports`
3. `ai_reports` → références `pre_analyses` et `patient_profiles`
4. `pre_analyses` → références `patient_profiles`
5. `timeline_events`, `discussions`, `documents`, etc. → référencent `patient_profiles`
6. `patient_profiles` → enfin supprimé ! ✅

## ⚠️ Important

- Ce script supprime **TOUTES** les données de test
- Utilisez-le uniquement dans un environnement de développement/test
- Après exécution, vous devrez recréer vos comptes de test

## 🔄 Alternative : Supprimer seulement certains comptes

Si vous voulez supprimer seulement certains comptes (par email), utilisez :

**Fichier:** `supabase_cleanup_test_account.sql`

```sql
SELECT delete_test_account_by_email('test@example.com');
```

---

**Note** : Après avoir exécuté le script, les lignes seront définitivement supprimées et ne pourront pas être récupérées.

