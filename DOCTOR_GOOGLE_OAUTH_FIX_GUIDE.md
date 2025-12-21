# 🔧 Guide de Correction - Compte Médecin avec Google OAuth

## ❌ Problème rencontré

Lors de la création d'un compte médecin avec Google OAuth :
- Le profil est créé avec le rôle `patient` au lieu de `doctor`
- Les données du formulaire ne sont pas sauvegardées dans la base de données
- Le compte n'est pas créé correctement

## 🎯 Solutions appliquées

### 1. Correction du code App.tsx

Le code a été corrigé pour :
- ✅ Détecter et corriger les profils avec le mauvais rôle
- ✅ Créer automatiquement le profil médecin si nécessaire
- ✅ Vérifier le rôle avant de continuer

### 2. Correction du code SignupDoctorStep2.tsx

Le code a été amélioré pour :
- ✅ Vérifier le rôle du profil avant de sauvegarder
- ✅ Utiliser UPSERT au lieu de UPDATE pour gérer les cas où doctor_profile n'existe pas encore
- ✅ Créer le profil et doctor_profile si nécessaire

### 3. Scripts SQL à exécuter

Vous devez exécuter ces scripts dans Supabase SQL Editor :

#### Script 1 : Corriger les politiques RLS pour doctor_profiles
**Fichier:** `supabase_fix_doctor_profiles_rls_upsert.sql`

Ce script corrige les politiques RLS pour permettre les opérations UPSERT sur `doctor_profiles`.

#### Script 2 (optionnel) : Corriger un profil existant avec mauvais rôle
**Fichier:** `supabase_fix_wrong_role_profiles.sql`

Si vous avez déjà un profil créé avec le mauvais rôle, utilisez cette fonction :

```sql
SELECT fix_profile_role('votre-email@gmail.com', 'doctor');
```

## 📋 Étapes pour corriger

### Étape 1 : Exécuter les scripts SQL

1. Ouvrez **Supabase Dashboard → SQL Editor**

2. Exécutez `supabase_fix_doctor_profiles_rls_upsert.sql`
   - Ce script corrige les politiques RLS pour doctor_profiles

3. (Optionnel) Si vous avez des profils avec le mauvais rôle, exécutez `supabase_fix_wrong_role_profiles.sql`
   - Puis utilisez la fonction pour corriger : `SELECT fix_profile_role('email@example.com', 'doctor');`

### Étape 2 : Supprimer les comptes de test existants

Utilisez la fonction de nettoyage :

```sql
SELECT delete_test_account_by_email('votre-email@gmail.com');
```

### Étape 3 : Tester à nouveau

1. Créez un compte médecin avec Google OAuth
2. Remplissez le formulaire Step 2
3. Vérifiez que les données sont sauvegardées

## 🔍 Vérifications

### Vérifier que le profil a le bon rôle

```sql
SELECT 
    p.email,
    p.role,
    dp.specialty,
    dp.rpps_number
FROM profiles p
LEFT JOIN doctor_profiles dp ON dp.profile_id = p.id
WHERE p.email = 'votre-email@gmail.com';
```

Le `role` devrait être `doctor` et `dp.specialty` devrait avoir une valeur.

### Vérifier que les données Step 2 sont sauvegardées

```sql
SELECT 
    specialty,
    rpps_number,
    city,
    country
FROM doctor_profiles dp
JOIN profiles p ON p.id = dp.profile_id
WHERE p.email = 'votre-email@gmail.com';
```

## ⚠️ Points importants

1. **Rôle dans les métadonnées** : Le rôle doit être défini dans `auth.users.raw_user_meta_data.role` avant que le trigger ne crée le profil

2. **Ordre de création** :
   - D'abord : Mettre à jour les métadonnées avec le rôle
   - Ensuite : Le trigger ou le code crée le profil avec le bon rôle
   - Enfin : Créer le doctor_profile avec specialty

3. **Politiques RLS** : Les politiques doivent permettre INSERT et UPDATE avec WITH CHECK pour supporter UPSERT

## 🐛 Dépannage

### Le profil est toujours créé comme patient

**Solution :**
1. Vérifiez que les métadonnées utilisateur contiennent le rôle :
   ```sql
   SELECT 
       email,
       raw_user_meta_data->>'role' as metadata_role
   FROM auth.users
   WHERE email = 'votre-email@gmail.com';
   ```

2. Si le rôle n'est pas dans les métadonnées, supprimez le compte et recréez-le :
   ```sql
   SELECT delete_test_account_by_email('votre-email@gmail.com');
   ```

3. Le code devrait maintenant mettre à jour les métadonnées avant la création du profil

### Erreur lors de la sauvegarde Step 2

**Vérifications :**
1. Le profil existe-t-il ?
   ```sql
   SELECT * FROM profiles WHERE email = 'votre-email@gmail.com';
   ```

2. Le profil a-t-il le bon rôle ?
   ```sql
   SELECT role FROM profiles WHERE email = 'votre-email@gmail.com';
   ```

3. Les politiques RLS sont-elles correctes ?
   ```sql
   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'doctor_profiles';
   ```

## ✅ Résultat attendu

Après toutes les corrections :
1. ✅ Créer un compte médecin avec Google OAuth
2. ✅ Le profil est créé avec `role = 'doctor'`
3. ✅ Le `doctor_profile` est créé automatiquement
4. ✅ Remplir le formulaire Step 2
5. ✅ Les données sont sauvegardées dans `doctor_profiles`
6. ✅ Navigation vers Step 3 puis dashboard

