# Guide Rapide - Suppression de Comptes de Test

## 🚀 Démarrage rapide

### Étape 1 : Exécuter les scripts SQL (une seule fois)

1. **Ouvrez Supabase Dashboard → SQL Editor**

2. **Exécutez d'abord** `supabase_fix_cascade_constraints.sql`
   - Ce script corrige les contraintes de base de données

3. **Exécutez ensuite** `supabase_cleanup_test_account.sql`
   - Ce script crée les fonctions de nettoyage

### Étape 2 : Supprimer un compte de test

Dans le **SQL Editor**, exécutez simplement :

```sql
SELECT delete_test_account_by_email('votre-email@gmail.com');
```

C'est tout ! Le compte et toutes ses données seront supprimés proprement.

## 📝 Commandes utiles

### Supprimer par email
```sql
SELECT delete_test_account_by_email('test@example.com');
```

### Supprimer par user_id
```sql
SELECT delete_test_account_by_user_id('uuid-here');
```

### Lister tous les comptes
```sql
SELECT * FROM list_test_accounts();
```

### Vérifier qu'un compte est supprimé
```sql
SELECT * FROM auth.users WHERE email = 'test@example.com';
-- Devrait retourner 0 lignes
```

## 🔄 Workflow complet pour tester

1. ✅ **Créer un compte** dans l'application avec Google OAuth
2. ✅ **Tester** la fonctionnalité
3. ✅ **Supprimer le compte** :
   ```sql
   SELECT delete_test_account_by_email('votre-email@gmail.com');
   ```
4. ✅ **Nettoyer le navigateur** :
   - F12 → Application → Clear storage → Clear site data
   - Ou utilisez un mode navigation privée
5. ✅ **Répéter** : Créez un nouveau compte avec le même email

## ⚡ Astuce : Emails Gmail avec alias

Pour créer plusieurs comptes avec le même email Gmail :

- `votre-email+test1@gmail.com`
- `votre-email+test2@gmail.com`
- `votre-email+test3@gmail.com`

Tous arrivent dans `votre-email@gmail.com` mais Supabase les voit comme différents !

## ⚠️ Important

- Ces fonctions sont pour les **comptes de test uniquement**
- Ne pas utiliser sur des données de production
- Toujours vérifier avant de supprimer

## 🐛 Problème ?

Si vous avez l'erreur `"null value in column profile_id"` :

1. Exécutez `supabase_fix_cascade_constraints.sql`
2. Réessayez la suppression

Si ça ne marche toujours pas, supprimez manuellement dans l'ordre :

```sql
-- Remplacer 'email@example.com' par votre email
DELETE FROM auth.users WHERE email = 'email@example.com';
-- Cela devrait supprimer automatiquement les profils grâce à CASCADE
```

