# Configuration de l'envoi d'emails pour la Waitlist Beta

## 📧 Options pour envoyer des emails de confirmation

Il y a deux approches principales pour envoyer des emails de confirmation lors de l'inscription à la waitlist :

### Option 1 : Supabase Database Webhooks (Recommandé - Plus simple)

Cette méthode utilise les webhooks intégrés de Supabase pour déclencher l'envoi d'email.

#### Étapes :

1. **Créer une Edge Function Supabase** (optionnel si vous utilisez un service externe)
   - Allez dans Supabase Dashboard → Edge Functions
   - Créez une nouvelle fonction `send-waitlist-email`
   - Ou utilisez directement un service d'email externe

2. **Configurer un Webhook dans Supabase Dashboard** :
   - Allez dans Database → Webhooks
   - Cliquez sur "Create Webhook"
   - Configuration :
     - **Name**: `send-waitlist-email`
     - **Table**: `beta_waitlist`
     - **Events**: `INSERT`
     - **HTTP Request**:
       - **URL**: Votre endpoint d'email (Resend, SendGrid, etc.)
       - **HTTP Method**: `POST`
       - **HTTP Headers**: 
         ```
         Content-Type: application/json
         Authorization: Bearer YOUR_API_KEY
         ```
       - **HTTP Request Body**:
         ```json
         {
           "to": "{{record.email}}",
           "subject": "Bienvenue sur la Beta HopeVisionAI !",
           "html": "<html>...</html>"
         }
         ```

### Option 2 : Supabase Edge Function + Resend (Plus de contrôle)

Cette méthode utilise une Edge Function Supabase pour envoyer l'email via Resend.

#### Étapes :

1. **Installer Resend** (ou un autre service d'email) :
   - Créez un compte sur https://resend.com
   - Obtenez votre API key

2. **Créer la Edge Function** :
   - Le fichier `supabase_functions_send_waitlist_email/index.ts` est déjà créé
   - Déployez-la avec :
     ```bash
     supabase functions deploy send-waitlist-email
     ```

3. **Configurer les variables d'environnement** :
   - Dans Supabase Dashboard → Edge Functions → Settings
   - Ajoutez :
     - `RESEND_API_KEY`: Votre clé API Resend
     - `FROM_EMAIL`: Votre email d'envoi vérifié (ex: noreply@hopevisionai.com)

4. **Créer le trigger SQL** :
   - Exécutez le script `supabase_webhook_waitlist_email.sql` dans Supabase SQL Editor
   - Ou configurez un webhook dans le Dashboard comme décrit dans Option 1

### Option 3 : Service d'email externe directement (Le plus simple)

Utilisez directement un service comme Resend, SendGrid, ou Mailgun depuis votre frontend.

#### Étapes :

1. **Modifier `waitlistService.ts`** pour appeler directement l'API d'email après l'insertion dans Supabase

2. **Exemple avec Resend** :
   ```typescript
   // Après l'insertion réussie dans Supabase
   await fetch('https://api.resend.com/emails', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${RESEND_API_KEY}`,
     },
     body: JSON.stringify({
       from: 'noreply@hopevisionai.com',
       to: data.email,
       subject: 'Bienvenue sur la Beta HopeVisionAI !',
       html: '<html>...</html>'
     }),
   });
   ```

## 🔧 Configuration recommandée (Option 1 avec Resend)

1. **Créez un compte Resend** : https://resend.com
2. **Vérifiez votre domaine** dans Resend
3. **Obtenez votre API Key**
4. **Dans Supabase Dashboard → Database → Webhooks** :
   - Créez un webhook qui appelle Resend directement
   - Ou utilisez une Edge Function comme intermédiaire

## 📝 Messages d'email

Les messages sont déjà préparés dans la Edge Function (`supabase_functions_send_waitlist_email/index.ts`) avec :
- **Patient** : Message de bienvenue simple
- **Médecin** : Message professionnel avec mention de la spécialité
- **Hôpital** : Message institutionnel avec mention de l'établissement

## ✅ Test

Pour tester :
1. Inscrivez-vous sur la waitlist via le formulaire
2. Vérifiez que l'email est bien envoyé
3. Vérifiez les logs dans Supabase Dashboard → Edge Functions → Logs

## ⚠️ Note importante

**Pour l'instant, le message affiché à l'utilisateur a été corrigé pour ne plus mentionner l'envoi d'email.** 

Une fois que vous avez configuré l'envoi d'email, vous pouvez remettre le message original si vous le souhaitez.
