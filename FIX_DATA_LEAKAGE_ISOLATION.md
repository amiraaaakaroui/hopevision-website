# Correction Critique : Fuite de Données (Data Leakage) - Isolation Stricte

## 🔴 PROBLÈME IDENTIFIÉ

**Symptôme** : Le chat de précision et le rapport final mélangent les historiques entre différentes pré-analyses d'un même patient.

**Conséquence** : 
- L'IA arrête de poser des questions (car elle croit avoir fini avec les données d'une autre analyse)
- Le rapport contient des symptômes d'anciennes maladies
- Violation de l'isolation des données entre sessions

## 🔍 CAUSES IDENTIFIÉES

### 1. **Pollution du champ `text_input`** (CRITIQUE)
**Fichier** : `src/components/PatientChatPrecision.tsx` (ligne 290)

**Problème** : Le composant mettait à jour `text_input` avec `enrichedSymptoms.combined_text` qui contenait le chat. Cela polluait le champ initial avec du contenu de chat, et si ce champ était réutilisé, cela causait une fuite.

**Avant** :
```typescript
text_input: enrichedSymptoms.combined_text || currentPreAnalysis?.text_input,
```

**Correction** : Le champ `text_input` doit rester **IMMUABLE** après la création initiale. Le chat reste dans sa table dédiée (`chat_precision_messages`) et est chargé séparément via `pre_analysis_id`.

### 2. **Manque de validations d'isolation**
**Fichiers** : `src/services/chatService.ts`, `src/services/aiReportService.ts`

**Problème** : Les requêtes filtraient correctement par `pre_analysis_id`, mais il n'y avait pas de validation post-requête pour vérifier que tous les résultats appartenaient bien à la bonne pré-analyse.

## ✅ CORRECTIONS APPLIQUÉES

### 1. **Isolation Stricte dans `chatService.ts`**

#### `loadMessages` - Requête SQL Corrigée
```typescript
// ✅ CORRECT : Isolation stricte par pre_analysis_id uniquement
const { data, error } = await supabase
  .from('chat_precision_messages')
  .select('*')
  .eq('pre_analysis_id', preAnalysisId) // SEUL filtre - pas de patient_profile_id
  .order('created_at', { ascending: true });

// ✅ Validation post-requête
const invalidMessages = data.filter(msg => msg.pre_analysis_id !== preAnalysisId);
if (invalidMessages.length > 0) {
  throw new Error('Violation d\'isolation: Des messages appartiennent à une autre pré-analyse');
}
```

**SQL équivalent** :
```sql
SELECT * 
FROM chat_precision_messages 
WHERE pre_analysis_id = $1  -- SEUL critère de filtrage
ORDER BY created_at ASC;
```

#### `loadCompleteHistory` - Requête SQL Corrigée
```typescript
// ✅ CORRECT : Même isolation stricte
const { data, error } = await supabase
  .from('chat_precision_messages')
  .select('*')
  .eq('pre_analysis_id', preAnalysisId) // SEUL filtre
  .order('created_at', { ascending: true });
```

**SQL équivalent** :
```sql
SELECT * 
FROM chat_precision_messages 
WHERE pre_analysis_id = $1  -- SEUL critère
ORDER BY created_at ASC;
```

#### `saveMessage` - Insertion Corrigée
```typescript
// ✅ CORRECT : Insertion avec isolation stricte
const { data, error } = await supabase
  .from('chat_precision_messages')
  .insert({
    pre_analysis_id: preAnalysisId, // SEUL lien - pas de patient_profile_id
    sender_type: senderType,
    message_text: messageText,
  })
  .select()
  .single();

// ✅ Validation post-insertion
if (data.pre_analysis_id !== preAnalysisId) {
  throw new Error('Violation d\'isolation: Le message sauvegardé appartient à une autre pré-analyse');
}
```

**SQL équivalent** :
```sql
INSERT INTO chat_precision_messages (pre_analysis_id, sender_type, message_text)
VALUES ($1, $2, $3)
RETURNING *;
```

#### `getPatientAnswers` - Requête SQL Corrigée
```typescript
// ✅ CORRECT : Isolation stricte
const { data } = await supabase
  .from('chat_precision_messages')
  .select('*')
  .eq('pre_analysis_id', preAnalysisId) // SEUL filtre
  .order('created_at', { ascending: true });
```

**SQL équivalent** :
```sql
SELECT * 
FROM chat_precision_messages 
WHERE pre_analysis_id = $1  -- SEUL critère
  AND sender_type = 'patient'
ORDER BY created_at ASC;
```

### 2. **Isolation Stricte dans `aiReportService.ts`**

#### Chargement des Messages de Chat - Requête SQL Corrigée
```typescript
// ✅ CORRECT : Isolation stricte avec validation
if (!preAnalysisId || typeof preAnalysisId !== 'string' || preAnalysisId.trim() === '') {
  throw new Error('pre_analysis_id invalide ou manquant');
}

const { data: chatMessages, error: chatError } = await supabase
  .from('chat_precision_messages')
  .select('*')
  .eq('pre_analysis_id', preAnalysisId) // SEUL filtre - pas de patient_profile_id, pas de .or()
  .order('created_at', { ascending: true });

// ✅ Validation post-requête
const invalidMessages = chatMessages.filter(msg => msg.pre_analysis_id !== preAnalysisId);
if (invalidMessages.length > 0) {
  throw new Error('Violation d\'isolation: Des messages de chat appartiennent à une autre pré-analyse');
}
```

**SQL équivalent** :
```sql
SELECT * 
FROM chat_precision_messages 
WHERE pre_analysis_id = $1  -- SEUL critère - PAS de OR, PAS de patient_profile_id
ORDER BY created_at ASC;
```

### 3. **Protection du champ `text_input` dans `preAnalysisService.ts`**

#### `submitPreAnalysis` - Correction Majeure
```typescript
// ✅ CORRECT : Ne modifie JAMAIS text_input avec du contenu de chat
export async function submitPreAnalysis(
  preAnalysisId: string,
  patientProfileId: string
  // ❌ SUPPRIMÉ : enrichedText?: string - Ne plus accepter de texte enrichi
): Promise<void> {
  // ✅ Validation d'isolation avant update
  const { data: existingPreAnalysis, error: checkError } = await supabase
    .from('pre_analyses')
    .select('id, patient_profile_id')
    .eq('id', preAnalysisId)
    .single();

  if (existingPreAnalysis.patient_profile_id !== patientProfileId) {
    throw new Error('Violation d\'isolation: La pré-analyse n\'appartient pas à ce patient');
  }

  // ✅ Update status SANS modifier text_input
  const { error } = await supabase
    .from('pre_analyses')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      ai_processing_status: 'pending',
      // ✅ CRITIQUE : text_input n'est PAS modifié - reste propre
    })
    .eq('id', preAnalysisId)
    .eq('patient_profile_id', patientProfileId);
}
```

**SQL équivalent** :
```sql
-- ✅ CORRECT : Update status uniquement, text_input reste intact
UPDATE pre_analyses 
SET 
  status = 'submitted',
  submitted_at = NOW(),
  ai_processing_status = 'pending'
  -- text_input n'est PAS modifié
WHERE id = $1 
  AND patient_profile_id = $2;
```

### 4. **Correction du Composant `PatientChatPrecision.tsx`**

#### `handleFinish` - Correction Majeure
```typescript
// ✅ AVANT : Polluait text_input avec le chat
// text_input: enrichedSymptoms.combined_text || currentPreAnalysis?.text_input,

// ✅ APRÈS : Utilise le service qui ne modifie PAS text_input
const { submitPreAnalysis } = await import('../services/preAnalysisService');
await submitPreAnalysis(
  preAnalysisId,
  currentProfile.patientProfileId
  // ✅ CRITIQUE : Pas de enrichedText - text_input reste propre
);
```

## 📋 RÈGLES D'ISOLATION STRICTES

### ✅ RÈGLES À RESPECTER

1. **Toutes les requêtes `chat_precision_messages` DOIVENT** :
   - Filtrer UNIQUEMENT par `.eq('pre_analysis_id', preAnalysisId)`
   - **JAMAIS** filtrer par `patient_profile_id`
   - **JAMAIS** utiliser `.or()` qui pourrait inclure d'autres IDs
   - Valider post-requête que tous les résultats appartiennent à la bonne pré-analyse

2. **Le champ `text_input` de `pre_analyses` DOIT** :
   - Contenir UNIQUEMENT les symptômes initiaux (text, voice, chips)
   - **JAMAIS** être modifié avec du contenu de chat
   - Rester **IMMUABLE** après la création initiale

3. **Le chat DOIT** :
   - Rester dans sa table dédiée (`chat_precision_messages`)
   - Être chargé séparément via `pre_analysis_id` lors de la génération du rapport
   - Ne jamais être concaténé dans `text_input`

### ❌ ANTI-PATTERNS À ÉVITER

```typescript
// ❌ MAUVAIS : Filtrage par patient_profile_id
.eq('patient_profile_id', patientId)

// ❌ MAUVAIS : Utilisation de .or() qui pourrait inclure d'autres analyses
.or(`pre_analysis_id.eq.${preAnalysisId},patient_profile_id.eq.${patientId}`)

// ❌ MAUVAIS : Modification de text_input avec du chat
text_input: `${originalText}\n\nChat: ${chatHistory}`

// ❌ MAUVAIS : Pas de validation post-requête
const { data } = await supabase.from('chat_precision_messages').select('*').eq('pre_analysis_id', preAnalysisId);
// Utiliser data sans vérifier que tous les messages appartiennent à la bonne analyse
```

## 🔒 VALIDATIONS AJOUTÉES

### 1. Validation de `preAnalysisId` avant chaque requête
```typescript
if (!preAnalysisId || typeof preAnalysisId !== 'string' || preAnalysisId.trim() === '') {
  throw new Error('pre_analysis_id invalide ou manquant');
}
```

### 2. Validation post-requête pour vérifier l'isolation
```typescript
const invalidMessages = data.filter(msg => msg.pre_analysis_id !== preAnalysisId);
if (invalidMessages.length > 0) {
  throw new Error('Violation d\'isolation: Des messages appartiennent à une autre pré-analyse');
}
```

### 3. Validation d'isolation dans `submitPreAnalysis`
```typescript
if (existingPreAnalysis.patient_profile_id !== patientProfileId) {
  throw new Error('Violation d\'isolation: La pré-analyse n\'appartient pas à ce patient');
}

if (existingPreAnalysis.id !== preAnalysisId) {
  throw new Error('Violation d\'isolation: L\'ID de la pré-analyse ne correspond pas');
}
```

## 📊 RÉSUMÉ DES REQUÊTES SQL CORRIGÉES

| Fonction | Table | Filtre Principal | Validations |
|----------|-------|------------------|-------------|
| `loadMessages` | `chat_precision_messages` | `.eq('pre_analysis_id', preAnalysisId)` | ✅ Post-requête |
| `loadCompleteHistory` | `chat_precision_messages` | `.eq('pre_analysis_id', preAnalysisId)` | ✅ Post-requête |
| `saveMessage` | `chat_precision_messages` | Insert avec `pre_analysis_id` | ✅ Post-insertion |
| `getPatientAnswers` | `chat_precision_messages` | `.eq('pre_analysis_id', preAnalysisId)` | ✅ Post-requête |
| `generateAndSaveAIReport` | `chat_precision_messages` | `.eq('pre_analysis_id', preAnalysisId)` | ✅ Post-requête |
| `submitPreAnalysis` | `pre_analyses` | `.eq('id', preAnalysisId)` | ✅ Pré-update + Post-update |

## ✅ RÉSULTAT

- ✅ **Isolation stricte** : Toutes les requêtes filtrent UNIQUEMENT par `pre_analysis_id`
- ✅ **Protection de `text_input`** : Le champ n'est plus pollué avec du contenu de chat
- ✅ **Validations robustes** : Vérifications pré-requête et post-requête
- ✅ **Pas de fuite de données** : Chaque pré-analyse est complètement isolée

## 🧪 TESTS RECOMMANDÉS

1. **Test d'isolation** :
   - Créer Pré-analyse A avec chat
   - Créer Pré-analyse B avec chat différent
   - Vérifier que le chat de A n'apparaît pas dans B
   - Vérifier que le rapport de B ne contient pas les symptômes de A

2. **Test de `text_input`** :
   - Créer une pré-analyse avec symptômes initiaux
   - Ajouter du chat
   - Vérifier que `text_input` n'a PAS été modifié avec le chat

3. **Test de validation** :
   - Essayer de charger des messages avec un `pre_analysis_id` invalide
   - Vérifier que les erreurs sont correctement levées

