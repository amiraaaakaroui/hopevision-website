# Configuration de la Waitlist Beta

Ce document explique comment configurer la fonctionnalité de waitlist Beta pour HopeVisionAI.

## 📋 Prérequis

- Accès à votre projet Supabase
- Base de données Supabase configurée

## 🗄️ Création de la table dans Supabase

1. **Connectez-vous à votre dashboard Supabase**
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet

2. **Ouvrez l'éditeur SQL**
   - Dans le menu de gauche, cliquez sur "SQL Editor"
   - Cliquez sur "New query"

3. **Exécutez le script SQL**
   - Copiez le contenu du fichier `supabase_beta_waitlist.sql`
   - Collez-le dans l'éditeur SQL
   - Cliquez sur "Run" pour exécuter le script

   Ce script va créer :
   - La table `beta_waitlist` avec tous les champs nécessaires
   - Les index pour optimiser les requêtes
   - Les politiques RLS (Row Level Security) pour la sécurité
   - Les triggers pour mettre à jour automatiquement `updated_at`

## ✅ Vérification

Après avoir exécuté le script, vous pouvez vérifier que la table a été créée :

1. Allez dans "Table Editor" dans le menu Supabase
2. Vous devriez voir la table `beta_waitlist` dans la liste
3. La table devrait contenir les colonnes suivantes :
   - `id` (UUID, Primary Key)
   - `role` (TEXT: 'patient', 'doctor', 'hospital')
   - `full_name` (TEXT)
   - `email` (TEXT, Unique)
   - `phone` (TEXT, Optional)
   - `specialty` (TEXT, Optional - pour les médecins)
   - `institution_name` (TEXT, Optional - pour les hôpitaux)
   - `created_at` (TIMESTAMPTZ)
   - `updated_at` (TIMESTAMPTZ)

## 🔒 Sécurité (RLS)

Les politiques RLS sont configurées pour :
- **Insertion publique** : N'importe qui peut s'inscrire sur la waitlist (utilisateurs anonymes et authentifiés)
- **Lecture authentifiée** : Seuls les utilisateurs authentifiés peuvent lire les données (pour un futur dashboard admin)

## 🚀 Utilisation

Une fois la table créée, le formulaire de waitlist sur la landing page sera automatiquement fonctionnel :

1. Les utilisateurs cliquent sur "Essayer la Beta (Gratuit)" / "Try Beta for Free"
2. Ils remplissent le formulaire avec leur rôle, nom, email, etc.
3. Les données sont sauvegardées dans la table `beta_waitlist`
4. Un message de confirmation s'affiche

## 📊 Consultation des inscriptions

Pour voir les inscriptions à la waitlist :

1. Allez dans "Table Editor" > `beta_waitlist`
2. Vous verrez toutes les inscriptions avec leurs informations
3. Vous pouvez filtrer par rôle, date, etc.

## 🔧 Personnalisation

Si vous souhaitez modifier le comportement :

- **Messages d'erreur** : Modifiez `src/translations/fr.json` et `src/translations/en.json`
- **Validation** : Modifiez `src/services/waitlistService.ts`
- **Interface** : Modifiez `src/components/BetaWaitlistModal.tsx`

## ⚠️ Notes importantes

- L'email doit être unique (contrainte `UNIQUE` sur la colonne `email`)
- Si un utilisateur essaie de s'inscrire avec un email déjà utilisé, il recevra un message d'erreur approprié
- Les données sont automatiquement horodatées avec `created_at` et `updated_at`
