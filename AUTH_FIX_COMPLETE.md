# Solution complète pour l'authentification

## Problèmes identifiés

1. **Profil créé avec le mauvais rôle lors du signup Google patient**
   - Le trigger crée parfois le profil avec le rôle "doctor" au lieu de "patient"
   - Le code détecte le problème mais ne le corrige pas correctement pour les patients

2. **Erreur lors du remplissage du formulaire Step 2 patient**
   - Le code vérifie que le rôle est "patient" et lance une erreur si ce n'est pas le cas
   - Cette vérification échoue si le profil a été créé avec le mauvais rôle

3. **Condition de course entre le trigger et la mise à jour des métadonnées**
   - Le trigger peut s'exécuter avant que les métadonnées soient mises à jour avec le bon rôle

## Solution

### 1. Améliorer la correction du rôle pour les patients dans App.tsx
- Ajouter la même logique de correction que pour les docteurs
- Supprimer et recréer le profil avec le bon rôle si nécessaire

### 2. Améliorer la vérification du rôle dans SignupPatientStep2.tsx
- Vérifier et corriger le rôle avant de sauvegarder
- Donner une erreur claire si le rôle ne peut pas être corrigé

### 3. Améliorer la synchronisation des métadonnées
- S'assurer que le rôle est défini dans les métadonnées AVANT le callback OAuth
- Mettre à jour les métadonnées immédiatement au callback

### 4. Améliorer la gestion des erreurs
- Donner des messages d'erreur clairs
- Gérer tous les cas d'erreur

## Fichiers à modifier

1. `src/App.tsx` - Correction du rôle patient
2. `src/components/auth/SignupPatientStep2.tsx` - Vérification et correction du rôle
3. `src/components/auth/SignupPatientStep1.tsx` - Améliorer le signup Google
4. `src/components/auth/LoginPatient.tsx` - Améliorer la gestion du rôle
5. `src/components/auth/SignupDoctorStep1.tsx` - Vérification
6. `src/components/auth/LoginDoctor.tsx` - Vérification

