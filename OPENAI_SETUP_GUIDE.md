# Guide d'installation et configuration OpenAI

## 📋 Prérequis

1. Compte OpenAI avec accès à l'API
2. Clé API OpenAI
3. Accès à GPT-4o (recommandé) ou GPT-4-turbo

## 🔑 Configuration de l'API Key

### 1. Obtenir une clé API OpenAI

1. Allez sur https://platform.openai.com/api-keys
2. Connectez-vous à votre compte OpenAI
3. Cliquez sur "Create new secret key"
4. Copiez la clé (elle ne sera affichée qu'une seule fois !)

### 2. Configuration dans le projet

Créez un fichier `.env` à la racine du projet avec le contenu suivant :

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon-supabase

# OpenAI Configuration
VITE_OPENAI_API_KEY=sk-votre-clé-api-openai
VITE_OPENAI_MODEL=gpt-4o
```

**⚠️ IMPORTANT :**
- Ne commitez JAMAIS le fichier `.env` dans Git
- Le fichier `.env` est déjà dans `.gitignore`
- Utilisez `.env.example` comme modèle (sans les vraies clés)

## 🎯 Modèles disponibles

- **`gpt-4o`** (recommandé) - Meilleur modèle, vision incluse
- **`gpt-4-turbo`** - Rapide et efficace
- **`gpt-4`** - Version standard

Pour l'analyse d'images, GPT-4o est recommandé car il inclut la vision.

## 🔒 Sécurité

### Option 1 : Variables d'environnement (développement)

✅ Simple à configurer  
✅ Fonctionne immédiatement  
❌ Clé API visible dans le code côté client (acceptable pour développement)

### Option 2 : Edge Function Supabase (production recommandé)

Pour la production, créez une Supabase Edge Function qui fait le pont avec OpenAI :

1. Créez une Edge Function dans Supabase
2. Stockez la clé API OpenAI dans les secrets Supabase
3. Appelez la fonction depuis le frontend
4. La clé API reste sécurisée côté serveur

## 📝 Vérification

Pour vérifier que la configuration fonctionne :

1. Redémarrez le serveur de développement (`npm run dev`)
2. Créez une nouvelle pré-analyse
3. Vérifiez la console pour les erreurs OpenAI
4. L'IA devrait répondre dans le chat de précision

## 🚨 Dépannage

### Erreur : "OpenAI API key is not configured"

✅ Vérifiez que le fichier `.env` existe  
✅ Vérifiez que `VITE_OPENAI_API_KEY` est défini  
✅ Redémarrez le serveur de développement  

### Erreur : "Insufficient quota"

✅ Vérifiez votre solde OpenAI sur https://platform.openai.com/account/billing  
✅ Ajoutez des crédits si nécessaire  

### Erreur : "Model not found"

✅ Vérifiez que votre compte a accès au modèle spécifié  
✅ Utilisez `gpt-4-turbo` si `gpt-4o` n'est pas disponible  

## 💰 Coûts estimés

Approximativement :
- Analyse initiale : ~$0.01-0.03 par pré-analyse
- Chat de précision : ~$0.005-0.01 par message
- Génération de rapport : ~$0.03-0.05 par rapport

Total estimé par pré-analyse complète : **~$0.05-0.10**

## 📚 Documentation

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [OpenAI Pricing](https://openai.com/pricing)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

