# 🔧 Correction Finale : Erreur "duplicate key value violates unique constraint"

## Problème

L'erreur `duplicate key value violates unique constraint "ai_reports_pre_analysis_id_key"` se produisait lors de la génération du rapport détaillé car :
- Un rapport existait déjà pour cette pré-analyse
- La suppression du rapport existant pouvait échouer (politiques RLS non configurées)
- Un nouveau rapport était quand même créé, causant la violation de contrainte

## Solution Implémentée

### Approche Multi-Niveaux

Le code utilise maintenant une approche à plusieurs niveaux pour gérer les rapports existants :

#### 1. **Vérification et Suppression (Premier Essai)**
- Vérifie si un rapport existe déjà
- Tente de supprimer les hypothèses diagnostiques associées
- Tente de supprimer le rapport existant (avec retry logic - 3 tentatives)
- Attente entre les tentatives pour laisser la DB traiter

#### 2. **UPDATE au lieu d'INSERT (Fallback Principal)**
- Si la suppression échoue ou si un rapport existe, utilise **UPDATE** au lieu d'INSERT
- Met à jour tous les champs du rapport existant
- Pas de violation de contrainte unique avec UPDATE

#### 3. **Gestion de l'Erreur de Contrainte (Fallback Final)**
- Si l'INSERT échoue à cause de la contrainte unique (code 23505)
- Charge le rapport existant
- Le met à jour avec les nouvelles données

## Code Modifié

### Fichier : `src/services/aiReportService.ts`

**Lignes ~155-200 :** Gestion améliorée des rapports existants
- Logique de suppression avec retry
- Détection des erreurs RLS
- Passage automatique à UPDATE si suppression impossible

**Lignes ~245-320 :** Logique INSERT/UPDATE conditionnelle
- UPDATE si un rapport existe déjà
- INSERT seulement si aucun rapport n'existe
- Gestion de l'erreur de contrainte unique avec fallback UPDATE

**Lignes ~322-345 :** Suppression des hypothèses existantes avant insertion
- Supprime les anciennes hypothèses avant d'insérer les nouvelles
- Évite les doublons lors d'une mise à jour

## Comportement Attendu

### Scénario 1 : Aucun Rapport Existant
1. ✅ Vérifie l'existence → Aucun trouvé
2. ✅ Génère le rapport AI
3. ✅ INSERT le nouveau rapport
4. ✅ INSERT les hypothèses diagnostiques

### Scénario 2 : Rapport Existant + Suppression Réussie
1. ✅ Vérifie l'existence → Trouvé
2. ✅ Supprime les hypothèses existantes
3. ✅ Supprime le rapport existant
4. ✅ Génère le nouveau rapport AI
5. ✅ INSERT le nouveau rapport
6. ✅ INSERT les nouvelles hypothèses

### Scénario 3 : Rapport Existant + Suppression Impossible (RLS)
1. ✅ Vérifie l'existence → Trouvé
2. ⚠️ Tente la suppression → Échoue (RLS)
3. ✅ Génère le nouveau rapport AI
4. ✅ **UPDATE** le rapport existant (au lieu d'INSERT)
5. ✅ Supprime les anciennes hypothèses
6. ✅ INSERT les nouvelles hypothèses

### Scénario 4 : INSERT Échoue à Cause de la Contrainte
1. ✅ Tente INSERT → Échoue (contrainte unique)
2. ✅ Détecte l'erreur 23505
3. ✅ Charge le rapport existant
4. ✅ **UPDATE** le rapport existant
5. ✅ Supprime les anciennes hypothèses
6. ✅ INSERT les nouvelles hypothèses

## Avantages

1. ✅ **Robuste** : Gère tous les cas possibles
2. ✅ **Pas de perte de données** : UPDATE au lieu de supprimer/recréer
3. ✅ **Pas d'erreur de contrainte** : Plus de violation unique
4. ✅ **Compatible RLS** : Fonctionne même si les politiques DELETE ne sont pas configurées
5. ✅ **Retry logic** : Plusieurs tentatives pour la suppression

## Action Requise

### Option 1 : Code Seul (Recommandé)
✅ **Aucune action requise** - Le code gère maintenant tous les cas automatiquement, même sans les politiques DELETE.

### Option 2 : Politiques RLS Complètes (Optionnel)
Pour une expérience optimale, vous pouvez exécuter le fichier SQL pour permettre la suppression :
- `supabase_add_delete_policies_ai_reports.sql`

**Mais ce n'est plus obligatoire** - le code fonctionne maintenant avec UPDATE si la suppression échoue.

## Test

Pour tester la correction :

1. Créer une pré-analyse et générer un rapport
2. Générer le rapport à nouveau (sans supprimer l'ancien)
3. ✅ Le rapport doit être mis à jour sans erreur
4. ✅ Aucune erreur "duplicate key"

---

**Status :** ✅ Problème résolu  
**Date :** 2025-01-27  
**Fichier modifié :** `src/services/aiReportService.ts`

