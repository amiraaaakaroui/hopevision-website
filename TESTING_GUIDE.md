# Guide de Test - Comptes de Test et Nettoyage

## 🔧 Problème résolu

Vous pouvez maintenant supprimer et recréer des comptes de test facilement pour tester avec le même email Google.

## 📋 Étapes pour tester correctement

### 1. Corriger les contraintes de base de données (une seule fois)

Exécutez ce script dans le **SQL Editor** de Supabase pour corriger les contraintes :

**Fichier:** `supabase_fix_cascade_constraints.sql`

```sql
-- Ce script corrige les contraintes pour permettre la suppression en cascade
```

### 2. Utiliser les fonctions de nettoyage

Après avoir exécuté le script de nettoyage (`supabase_cleanup_test_account.sql`), vous avez accès à plusieurs fonctions utiles.

#### Option A: Supprimer un compte par email

```sql
SELECT delete_test_account_by_email('votre-email@gmail.com');
```

#### Option B: Supprimer un compte par user_id

```sql
-- D'abord, trouvez l'ID de l'utilisateur
SELECT id, email FROM auth.users WHERE email = 'votre-email@gmail.com';

-- Ensuite, supprimez le compte
SELECT delete_test_account_by_user_id('uuid-du-user');
```

#### Option C: Lister tous les comptes

```sql
SELECT * FROM list_test_accounts();
```

## 🚀 Workflow de test recommandé

### Pour tester avec le même email Google :

1. **Créer un compte de test** via l'application (Google OAuth)

2. **Tester la fonctionnalité** (remplir le formulaire, vérifier les données, etc.)

3. **Supprimer le compte de test** via SQL :
   ```sql
   SELECT delete_test_account_by_email('votre-email@gmail.com');
   ```

4. **Réinitialiser la session dans le navigateur** :
   - Ouvrez les DevTools (F12)
   - Allez dans l'onglet "Application" (Chrome) ou "Stockage" (Firefox)
   - Supprimez les cookies et le localStorage pour votre domaine

5. **Répéter** : Créez un nouveau compte avec le même email

### Alternative : Utiliser plusieurs emails temporaires

Si vous utilisez Gmail, vous pouvez créer des alias temporaires en ajoutant `+` dans l'adresse :

- `votre-email+test1@gmail.com`
- `votre-email+test2@gmail.com`
- `votre-email+test3@gmail.com`

Tous ces emails arrivent dans la même boîte `votre-email@gmail.com`, mais Supabase les considère comme des comptes différents.

## 🔍 Vérification après suppression

Après avoir supprimé un compte, vérifiez que tout a été nettoyé :

```sql
-- Vérifier que l'utilisateur n'existe plus
SELECT * FROM auth.users WHERE email = 'votre-email@gmail.com';

-- Vérifier que le profil n'existe plus
SELECT * FROM profiles WHERE email = 'votre-email@gmail.com';

-- Vérifier que le patient_profile n'existe plus
SELECT pp.* FROM patient_profiles pp
JOIN profiles p ON p.id = pp.profile_id
WHERE p.email = 'votre-email@gmail.com';
```

## ⚠️ Notes importantes

1. **Suppression en cascade** : Quand vous supprimez un utilisateur depuis `auth.users`, les profils liés sont automatiquement supprimés grâce à `ON DELETE CASCADE`.

2. **Ordre de suppression** : Les fonctions de nettoyage suppriment les données dans le bon ordre pour éviter les erreurs de contraintes.

3. **Données de production** : Ne pas utiliser ces fonctions sur des données de production !

4. **Session navigateur** : Après suppression, pensez à :
   - Vider le cache du navigateur
   - Supprimer les cookies
   - Supprimer le localStorage/sessionStorage

## 🛠️ Dépannage

### Erreur : "null value in column profile_id violates not-null constraint"

**Solution :** Exécutez le script `supabase_fix_cascade_constraints.sql` pour corriger les contraintes.

### Erreur : "Cannot delete user"

**Solution :** Utilisez les fonctions `delete_test_account_by_email()` ou `delete_test_account_by_user_id()` qui gèrent correctement l'ordre de suppression.

### Le compte n'est pas complètement supprimé

**Solution :** Vérifiez que toutes les données liées sont supprimées :

```sql
-- Supprimer manuellement si nécessaire (utilisez avec précaution!)
DELETE FROM patient_profiles WHERE profile_id IN (
    SELECT id FROM profiles WHERE user_id = 'uuid-du-user'
);
DELETE FROM profiles WHERE user_id = 'uuid-du-user';
DELETE FROM auth.users WHERE id = 'uuid-du-user';
```

## 📝 Exemple complet

```sql
-- 1. Lister tous les comptes
SELECT * FROM list_test_accounts();

-- 2. Supprimer un compte spécifique
SELECT delete_test_account_by_email('test@example.com');

-- 3. Vérifier que c'est supprimé
SELECT * FROM auth.users WHERE email = 'test@example.com';
-- Devrait retourner 0 lignes

-- 4. Maintenant, vous pouvez recréer un compte avec le même email dans l'application
```

## 🎯 Scripts créés

1. **`supabase_fix_cascade_constraints.sql`** : Corrige les contraintes de clé étrangère
2. **`supabase_cleanup_test_account.sql`** : Crée les fonctions de nettoyage

Exécutez ces scripts dans l'ordre dans le **SQL Editor** de Supabase.

