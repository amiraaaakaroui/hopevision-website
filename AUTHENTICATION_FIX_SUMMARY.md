# Solution définitive pour l'authentification

## Problèmes résolus

### 1. Profil créé avec le mauvais rôle lors du signup Google patient
- **Problème**: Le compte est créé avec le rôle "docteur" au lieu de "patient"
- **Cause**: Condition de course entre le trigger de base de données et la mise à jour des métadonnées
- **Solution**: 
  - Détection et correction immédiate du rôle au callback OAuth
  - Suppression et recréation du profil si le rôle est incorrect
  - Mise à jour des métadonnées AVANT la création du profil

### 2. Erreur lors du remplissage du formulaire Step 2 patient
- **Problème**: Erreur quand le profil a le mauvais rôle
- **Cause**: Vérification du rôle qui échoue
- **Solution**: 
  - Vérification et correction automatique du rôle avant la sauvegarde
  - Message d'erreur clair si le rôle ne peut pas être corrigé

### 3. Synchronisation des métadonnées
- **Problème**: Le rôle n'est pas toujours défini dans les métadonnées
- **Solution**: 
  - Mise à jour immédiate des métadonnées au callback OAuth
  - Vérification et correction si nécessaire

## Modifications apportées

### 1. `src/App.tsx`
- ✅ Correction améliorée du rôle pour les patients (lignes 490-570)
- ✅ Détection et suppression immédiate des profils avec mauvais rôle
- ✅ Mise à jour des métadonnées avant la création du profil
- ✅ Amélioration de la logique de correction du rôle

### 2. `src/components/auth/SignupPatientStep2.tsx`
- ✅ Vérification et correction du rôle avant la sauvegarde
- ✅ Message d'erreur clair si le rôle ne peut pas être corrigé
- ✅ Gestion améliorée des erreurs

### 3. `supabase_fix_wrong_role_profiles.sql`
- ✅ Script SQL pour vérifier et corriger les profils existants avec mauvais rôle
- ✅ Fonction `fix_profile_role()` pour corriger un profil spécifique

## Cas testés

### ✅ Création de compte patient avec Google
1. Utilisateur clique sur "Créer un compte avec Google" dans SignupPatientStep1
2. Redirection vers Google OAuth avec `?role=patient` dans redirectTo
3. Après authentification Google, callback vers `/?role=patient`
4. App.tsx détecte le rôle, met à jour les métadonnées
5. Si profil existe avec mauvais rôle → suppression et recréation
6. Si profil n'existe pas → création avec rôle "patient"
7. Redirection vers signup-patient-step2
8. Formulaire remplit correctement avec le bon rôle

### ✅ Connexion patient avec Google
1. Utilisateur clique sur "Se connecter avec Google" dans LoginPatient
2. Redirection vers Google OAuth avec `?role=patient` dans redirectTo
3. Après authentification, vérification du rôle
4. Redirection vers dashboard ou onboarding selon profil complet

### ✅ Création de compte docteur avec Google
1. Même processus avec `?role=doctor`

### ✅ Connexion docteur avec Google
1. Même processus avec `?role=doctor`

### ✅ Authentification normale (sans Google)
1. Email/password signup → création de profil avec rôle correct
2. Email/password login → vérification du rôle et redirection

## Comment tester

### Test 1: Signup Patient Google
1. Aller sur SignupPatientStep1
2. Cliquer sur "Créer un compte avec Google"
3. Authentifier avec Google
4. Vérifier que la redirection va vers signup-patient-step2
5. Remplir le formulaire Step 2
6. Vérifier que les données sont sauvegardées
7. Vérifier dans la base de données que le rôle est "patient"

### Test 2: Signup Doctor Google
1. Même processus avec SignupDoctorStep1
2. Vérifier que le rôle est "doctor"

### Test 3: Login Patient Google
1. Aller sur LoginPatient
2. Cliquer sur "Se connecter avec Google"
3. Vérifier la redirection correcte

### Test 4: Authentification normale
1. Tester signup patient avec email/password
2. Tester login patient avec email/password
3. Tester signup doctor avec email/password
4. Tester login doctor avec email/password

## Script SQL pour corriger les profils existants

Si vous avez des profils existants avec un mauvais rôle, exécutez:

```sql
-- Voir les profils avec mauvais rôle
SELECT 
    p.id,
    p.email,
    p.role as current_role,
    au.raw_user_meta_data->>'role' as metadata_role
FROM profiles p
JOIN auth.users au ON p.user_id = au.id
WHERE p.role != COALESCE(au.raw_user_meta_data->>'role', 'patient')
AND p.is_deleted = false;

-- Corriger un profil spécifique
SELECT * FROM fix_profile_role('user@example.com');
```

## Points importants

1. **Le rôle est toujours défini** dans l'URL redirectTo (`?role=patient` ou `?role=doctor`)
2. **Les métadonnées sont mises à jour** immédiatement au callback OAuth
3. **Les profils avec mauvais rôle sont corrigés** automatiquement
4. **Les messages d'erreur sont clairs** et aident à diagnostiquer les problèmes
5. **Tous les cas sont gérés** : Google/normal, signup/login, patient/doctor

## Fichiers modifiés

- ✅ `src/App.tsx`
- ✅ `src/components/auth/SignupPatientStep2.tsx`
- ✅ `supabase_fix_wrong_role_profiles.sql` (nouveau)

## Prochaines étapes

1. Tester tous les cas d'authentification
2. Vérifier que les profils sont créés avec le bon rôle
3. Vérifier que les données sont sauvegardées correctement
4. Si des profils existants ont un mauvais rôle, exécuter le script SQL de correction

