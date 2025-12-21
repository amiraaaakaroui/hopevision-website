# 🔧 Guide de Correction - Erreur RLS patient_profiles

## ❌ Erreur rencontrée

```
Erreur lors de la sauvegarde des informations médicales: 
new row violates row-level security policy for table "patient_profiles"
```

## 🎯 Solution rapide

### Étape 1 : Exécuter le script SQL

Dans **Supabase Dashboard → SQL Editor**, exécutez le fichier :

**`supabase_fix_rls_patient_profiles_upsert.sql`**

Ce script va :
- ✅ Supprimer les politiques RLS en conflit
- ✅ Créer une nouvelle politique INSERT sans vérification `is_deleted`
- ✅ Corriger la politique UPDATE pour supporter les opérations UPSERT

### Étape 2 : Vérifier que ça fonctionne

Après avoir exécuté le script, essayez à nouveau de créer un compte patient avec Google et remplir le formulaire Step 2.

## 📋 Ce que le script fait

1. **Supprime les politiques existantes** qui peuvent causer des conflits
2. **Crée une politique INSERT simplifiée** qui permet l'insertion si `profile_id` appartient à l'utilisateur authentifié
3. **Corrige la politique UPDATE** pour supporter les opérations UPSERT avec `WITH CHECK`
4. **Réactive RLS** sur la table `patient_profiles`

## 🔍 Vérification après exécution

Pour vérifier que les politiques sont correctement créées, exécutez :

```sql
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK'
        ELSE 'No WITH CHECK'
    END as has_with_check
FROM pg_policies
WHERE tablename = 'patient_profiles'
ORDER BY policyname;
```

Vous devriez voir :
- ✅ `Patients can insert own profile` (INSERT)
- ✅ `Patients can update own profile` (UPDATE avec WITH CHECK)

## ⚠️ Pourquoi cette erreur se produit ?

L'erreur se produit parce que :
1. La politique INSERT vérifiait `is_deleted = false`
2. Lors du signup avec Google OAuth, le profil peut être créé mais pas encore complètement initialisé
3. L'opération UPSERT nécessite que les politiques INSERT et UPDATE fonctionnent correctement

## ✅ Solution appliquée

La nouvelle politique INSERT :
- ✅ Vérifie uniquement que `profile_id` appartient à l'utilisateur authentifié
- ✅ Ne vérifie pas `is_deleted` pour permettre le signup flow
- ✅ Maintient la sécurité (les utilisateurs ne peuvent insérer que leurs propres profils)

## 🚀 Après correction

Une fois le script exécuté, vous devriez pouvoir :
1. ✅ Créer un compte patient avec Google OAuth
2. ✅ Remplir le formulaire Step 2
3. ✅ Sauvegarder les informations médicales sans erreur

