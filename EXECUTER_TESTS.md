# 🧪 Guide d'Exécution des Tests - HopeVisionAI

## Tests Automatisés

### Test de Configuration (Recommandé en premier)

Ce test vérifie que toutes les configurations nécessaires sont en place.

```bash
npm run test:config
```

**Ce test vérifie:**
- ✅ Fichier `.env` existe
- ✅ Variables d'environnement configurées
- ✅ Fichiers essentiels présents
- ✅ Dépendances NPM installées
- ✅ Structure des dossiers correcte

### Test Complet (Nécessite connexion Supabase)

```bash
npm run test
```

**Ce test vérifie:**
- ✅ Configuration des variables d'environnement
- ✅ Connexion à Supabase
- ✅ Existence des tables de base de données
- ✅ Accessibilité des buckets Storage
- ✅ Fonctions utilitaires
- ✅ Intégration OpenAI (si configurée)

---

## Tests Manuels (Dans le Navigateur)

### 1. Préparer l'Environnement

1. **Installer les dépendances:**
```bash
npm install
```

2. **Configurer les variables d'environnement:**
Créez un fichier `.env` à la racine avec:
```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
VITE_OPENAI_API_KEY=sk-votre_cle_openai
VITE_OPENAI_MODEL=gpt-4o
```

3. **Lancer l'application:**
```bash
npm run dev
```

4. **Ouvrir le navigateur:**
```
http://localhost:5173
```

### 2. Suivre la Checklist de Tests Manuels

Ouvrez le fichier `tests/manual-test-checklist.md` et suivez les tests un par un.

**Tests principaux à exécuter:**

#### ✅ Test Rapide (5 minutes)
1. Inscription patient
2. Soumission symptômes (texte + puces)
3. Chat de précision (1-2 questions)
4. Vérification rapport IA généré

#### ✅ Test Complet (30 minutes)
Suivre tous les tests de `tests/manual-test-checklist.md`

---

## Résultats Attendus

### Test de Configuration
```
✅ Tous les tests de configuration sont passés !
🚀 Vous pouvez maintenant lancer: npm run dev
```

### Test Complet
```
✅ Tests réussis: XX
❌ Tests échoués: 0
📈 Taux de réussite: 100%
```

### Tests Manuels
Chaque test doit avoir un résultat attendu clairement défini dans la checklist.

---

## Dépannage

### ❌ "Fichier .env non trouvé"
**Solution:** Créez un fichier `.env` à la racine du projet

### ❌ "Variables d'environnement manquantes"
**Solution:** Ajoutez les variables manquantes dans `.env`

### ❌ "Connexion Supabase échouée"
**Solution:** 
- Vérifiez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
- Vérifiez votre connexion internet
- Vérifiez que votre projet Supabase est actif

### ❌ "Table n'existe pas"
**Solution:** Exécutez `supabase_schema.sql` dans votre projet Supabase

### ❌ "Bucket n'existe pas"
**Solution:** Créez les buckets dans Supabase Dashboard > Storage:
- `patient-documents`
- `patient-images`
- `patient-audio`

---

## Ordre Recommandé d'Exécution

1. **Première fois:**
   ```bash
   npm run test:config  # Vérifier la configuration
   npm install          # Installer les dépendances
   # Configurer .env
   npm run dev          # Lancer l'application
   # Suivre tests/manual-test-checklist.md
   ```

2. **Tests réguliers:**
   ```bash
   npm run test:config  # Vérification rapide
   npm run test         # Test complet (si Supabase accessible)
   ```

3. **Avant chaque commit:**
   ```bash
   npm run test:config
   # Exécuter les tests manuels critiques
   ```

---

## Notes

- Les tests automatisés vérifient la **configuration** et la **structure**
- Les tests manuels vérifient le **fonctionnement réel** dans le navigateur
- Les deux types de tests sont complémentaires
- Exécutez toujours `test:config` en premier pour éviter les erreurs évidentes

---

**Date de création:** 27 janvier 2025

