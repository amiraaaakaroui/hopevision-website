/**
 * OpenAI Service for HopeVisionAI
 * Handles all AI interactions: symptom analysis, precision chat, and report generation
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o';

if (!OPENAI_API_KEY) {
  console.warn('⚠️ VITE_OPENAI_API_KEY is not set. AI features will not work.');
}

import { UnifiedMedicalContext } from '../utils/medicalContext';

interface SymptomAnalysisInput {
  textInput?: string;
  voiceTranscript?: string;
  selectedChips?: string[];
  imageUrls?: string[];
  documentUrls?: string[];
  chatAnswers?: string;
  chatMessages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  enrichedSymptoms?: {
    initial_text?: string;
    voice_transcriptions?: string;
    chat_answers?: string;
    selected_chips?: string[];
    images_count?: number;
    documents_count?: number;
  };
  patientProfile?: {
    age?: number;
    gender?: string;
    bloodGroup?: string;
    allergies?: string[];
    medicalHistory?: string;
  };
  // NEW: Unified Context Support
  unifiedContext?: UnifiedMedicalContext;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DiagnosticHypothesis {
  disease_name: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  keywords: string[];
  explanation: string;
  is_primary?: boolean;
  is_excluded?: boolean;
}

interface AIReportData {
  overall_severity: 'low' | 'medium' | 'high';
  overall_confidence: number;
  summary: string;
  primary_diagnosis: string;
  primary_diagnosis_confidence: number;
  recommendation_action: string;
  recommendation_text: string;
  diagnostic_hypotheses: DiagnosticHypothesis[];
  explainability_data?: any;
}

/**
 * Analyze symptoms and generate initial AI response for precision chat
 */
export async function analyzeSymptoms(input: SymptomAnalysisInput): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  const systemPrompt = `Tu es un assistant médical IA spécialisé dans l'analyse de symptômes. 
Ton rôle est de poser des questions précises pour affiner le diagnostic initial.

Règles importantes:
- Pose des questions claires et concises (maximum 2-3 questions à la fois)
- Utilise un langage médical adapté aux patients
- Sois empathique et rassurant
- Ne pose jamais de diagnostic définitif, mais guide vers plus de précisions
- Commence toujours par accueillir le patient et lui poser les premières questions de précision

Format de réponse: Questions directes en français, sans formatage spécial.`;

  let userPrompt = `Le patient a décrit les symptômes suivants:\n\n`;

  // USE UNIFIED CONTEXT IF AVAILABLE
  if (input.unifiedContext) {
    userPrompt += input.unifiedContext.combined_text_block;
  } else {
    // FALLBACK TO LEGACY LOGIC
    if (input.textInput) {
      userPrompt += `Description textuelle: ${input.textInput}\n\n`;
    }

    if (input.voiceTranscript) {
      userPrompt += `Transcription vocale: ${input.voiceTranscript}\n\n`;
    }

    if (input.selectedChips && input.selectedChips.length > 0) {
      userPrompt += `Précisions rapides sélectionnées: ${input.selectedChips.join(', ')}\n\n`;
    }

    if (input.imageUrls && input.imageUrls.length > 0) {
      userPrompt += `Images fournies: ${input.imageUrls.length} image(s)\n\n`;
    }

    if (input.documentUrls && input.documentUrls.length > 0) {
      userPrompt += `Documents fournis: ${input.documentUrls.length} document(s)\n\n`;
    }

    if (input.patientProfile) {
      userPrompt += `\nProfil patient:\n`;
      if (input.patientProfile.age) userPrompt += `- Âge: ${input.patientProfile.age} ans\n`;
      if (input.patientProfile.gender) userPrompt += `- Sexe: ${input.patientProfile.gender}\n`;
      if (input.patientProfile.bloodGroup) userPrompt += `- Groupe sanguin: ${input.patientProfile.bloodGroup}\n`;
      if (input.patientProfile.allergies && input.patientProfile.allergies.length > 0) {
        userPrompt += `- Allergies: ${input.patientProfile.allergies.join(', ')}\n`;
      }
      if (input.patientProfile.medicalHistory) {
        userPrompt += `- Antécédents médicaux: ${input.patientProfile.medicalHistory}\n`;
      }
    }
  }

  userPrompt += `\nPose maintenant les premières questions de précision pour affiner ton analyse. Commence par saluer le patient et poser 2-3 questions clés.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Je vais analyser vos symptômes.';
  } catch (error: any) {
    console.error('Error calling OpenAI:', error);
    throw new Error(`Erreur lors de l'analyse des symptômes: ${error.message}`);
  }
}

/**
 * Generate AI response in precision chat conversation
 */
export async function generateChatResponse(
  conversationHistory: ChatMessage[],
  preAnalysisData: SymptomAnalysisInput
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  const systemPrompt = `Tu es un assistant médical IA spécialisé dans l'anamnèse (recueil de l'histoire médicale).
Ton rôle est de poser des questions ciblées pour affiner le diagnostic.

Règles CRITIQUES:
- Lis TOUT l'historique de conversation avant de poser une nouvelle question
- N'oublie JAMAIS les réponses déjà données par le patient
- Ne pose JAMAIS de questions déjà répondues dans l'historique
- Pose des questions spécifiques basées UNIQUEMENT sur les informations manquantes
- Maximum 2-3 questions à la fois
- Langage clair et accessible
- Sois empathique
- Si tu as assez d'informations, remercie le patient et indique que tu vas procéder à l'analyse finale
- Ne pose JAMAIS de diagnostic définitif dans cette phase
- Évite absolument la répétition - si une information est déjà dans le contexte ou l'historique, ne la redemande pas`;

  // Build conversation messages
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Pouvez-vous me donner plus de précisions ?';
  } catch (error: any) {
    console.error('Error calling OpenAI:', error);
    throw new Error(`Erreur lors de la génération de la réponse: ${error.message}`);
  }
}

/**
 * Generate final AI report with diagnostic hypotheses
 * CRITICAL: Includes images via GPT-4o Vision API and all modalities
 */
export async function generateAIReport(
  preAnalysisData: SymptomAnalysisInput,
  conversationHistory: ChatMessage[],
  imageUrls?: string[] // CRITICAL: Images to analyze with Vision API
): Promise<AIReportData> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  const systemPrompt = `Tu es HopeVision, IA d’ANALYSE PRÉLIMINAIRE DES SYMPTÔMES (aide à la décision, pas un médecin).
Pas de diagnostic certain, pas de prescription. Multimodal : texte, voix, images, documents, chat, profil.

Rappels de sécurité :
- Jamais « vous n’avez rien ». Préférer « situation modérée mais avis médical nécessaire ».
- Aucun traitement/posologie.
- Signes de gravité (douleur thoracique intense, signes neuro aigus, détresse respi, saignement abondant, perte de connaissance…) => dire clairement :
  « Appelez immédiatement les services d’urgence (SAMU / numéro local). Ne vous fiez pas uniquement à cette application. »
- Images : décrire prudemment, « pourrait correspondre à… », jamais conclure seul.

Format de réponse REQUIS (JSON strict):
{
  "summary": "Résumé clinique synthétique (2-3 phrases, en FRANÇAIS)",
  "explainability_data": {
    "text_analysis": ["Points clés du texte"],
    "voice_analysis": ["Points clés de la voix (essoufflement, toux, pauses respiratoires…)"],
    "image_analysis": ["Observations images (formulation prudente)"],
    "document_analysis": ["Points extraits des documents (PDF, analyses)"],
    "correlation": "Analyse croisée entre sources",
    "recommended_actions": ["Action recommandée 1", "Action recommandée 2", "Action recommandée 3"],
    "warning_signs": ["Signe d'alerte 1", "Signe d'alerte 2", "Signe d'alerte 3"]
  },
  "diagnostic_hypotheses": [
    {
      "disease_name": "Nom de la pathologie (hypothèse, pas confirmé)",
      "confidence": nombre entre 0 et 100,
      "severity": "low" | "medium" | "high",
      "keywords": ["mot-clé1", "mot-clé2", "mot-clé3"],
      "explanation": "Justification basée sur TOUTES les sources",
      "is_primary": true/false
    }
  ],
  "overall_severity": "low" | "medium" | "high",
  "overall_confidence": nombre entre 0 et 100,
  "primary_diagnosis": "Hypothèse principale",
  "primary_diagnosis_confidence": nombre entre 0 et 100,
  "recommendation_action": "Ex: 'Consultation d'urgence immédiate' ou 'Consultation recommandée dans les 24-48h'",
  "recommendation_text": "Explication détaillée de la recommandation"
}

Règles importantes:
- 3-5 hypothèses max, ordonnées. is_primary=true pour la plus probable.
- Combine TOUTES les sources (texte, voix, images, documents, chat, profil) et corrèle-les.
- Pas de probabilités numériques en dehors des champs demandés. Pas de traitement médicamenteux.
- Langage clair, empathique, FRANÇAIS. Rappeler que seul un professionnel peut confirmer.
- Ne génère QUE du JSON valide, sans texte avant ou après.`;

  const antiHallucinationRules = `
RÈGLES ANTI-HALLUCINATION ET TRAÇABILITÉ DES SYMPTÔMES
- Ne déclare un symptôme présent que s’il apparaît dans le texte patient, une réponse explicite, ou un document spécifique au patient. Poser une question ne signifie pas présence.
- Distinguer clairement :
  - Symptômes déclarés par le patient
  - Symptômes observés sur images (au conditionnel)
  - Informations issues de documents généraux (non spécifiques)
  - Pistes/hypothèses (jamais comme faits)
- Ne jamais inventer ni amplifier : un PDF général ne prouve pas que le patient a ces symptômes.
- Utiliser les documents généraux comme base de connaissance, pas comme description du patient.
- Dans les rapports détaillés, ajouter une section « Origine des informations » avec ces catégories.
- Si une hypothèse repose sur un seul symptôme non spécifique sans éléments concordants, la qualifier de « hypothèse très incertaine » ou l’omettre si elle ajoute de la confusion.
`;

  const systemPromptFull = `${systemPrompt}\n${antiHallucinationRules}`;

  // CRITICAL: Build structured multimodal medical prompt
  // Extract document contents if available (from unifiedContext or preAnalysisData)
  const documentContents = preAnalysisData.unifiedContext?.document_contents || 
    (preAnalysisData as any).documentContents || [];

  // Build structured user prompt following the medical template
  let userPrompt = `🏥 PROMPT : Analyse Multimodale de Diagnostic Médical – HOPEVISIONAI

===========================
DONNÉES DU PATIENT
===========================
Profil :
- Âge : ${preAnalysisData.patientProfile?.age || 'Non spécifié'}
- Sexe : ${preAnalysisData.patientProfile?.gender || 'Non spécifié'}
- Antécédents médicaux : ${preAnalysisData.patientProfile?.medicalHistory || 'Aucun antécédent mentionné'}
- Allergies : ${preAnalysisData.patientProfile?.allergies?.join(', ') || 'Aucune allergie mentionnée'}
- Traitements actuels : ${(preAnalysisData.patientProfile as any)?.currentTreatments || 'Aucun traitement mentionné'}
- Mode de vie : ${(preAnalysisData.patientProfile as any)?.lifestyle || 'Non spécifié'}

===========================
SYMPTÔMES COMMUNIQUÉS
===========================
Texte écrit :
${preAnalysisData.textInput || 'Aucun texte fourni'}

Transcription vocale :
${preAnalysisData.voiceTranscript || 'Aucune transcription vocale'}

Analyse vocale (optionnel) :
${preAnalysisData.voiceTranscript ? 'À analyser : essoufflement, toux, pauses respiratoires, fatigue vocale' : 'Non disponible'}

Tags/Précisions rapides :
${preAnalysisData.selectedChips && preAnalysisData.selectedChips.length > 0 
  ? preAnalysisData.selectedChips.join(', ') 
  : 'Aucun tag sélectionné'}

===========================
DONNÉES VISUELLES
===========================
Images médicales analysées :
${imageUrls && imageUrls.length > 0 
  ? `${imageUrls.length} image(s) fournie(s) - Analyse visuelle jointe au message pour analyse détaillée`
  : 'Aucune image fournie'}

${preAnalysisData.unifiedContext?.image_analyses && preAnalysisData.unifiedContext.image_analyses.length > 0
  ? `Analyses préliminaires des images:\n${preAnalysisData.unifiedContext.image_analyses.join('\n')}`
  : ''}

===========================
DOCUMENTS MÉDICAUX UPLOADÉS
===========================
Analyses sanguines / rapports :
${Array.isArray(documentContents) && documentContents.length > 0
  ? documentContents.map((doc, idx) => `Document ${idx + 1}:\n${doc}`).join('\n\n---\n\n')
  : (preAnalysisData.documentUrls && preAnalysisData.documentUrls.length > 0
      ? `${preAnalysisData.documentUrls.length} document(s) fourni(s) mais contenu non extrait`
      : 'Aucun document fourni')}

===========================
QUESTIONS DE PRÉCISION (Q&A)
===========================
Historique de conversation :
${conversationHistory.length > 0
  ? conversationHistory
      .filter(msg => msg.role !== 'system')
      .map(msg => `${msg.role === 'user' ? 'Patient' : 'IA'}: ${msg.content}`)
      .join('\n\n')
  : 'Aucune conversation de précision'}

${preAnalysisData.chatAnswers
  ? `Réponses du patient résumées:\n${preAnalysisData.chatAnswers}`
  : ''}

===========================
OBJECTIF
===========================
À partir de toutes ces données combinées, génère un rapport médical professionnel selon la structure suivante :

1. **Résumé clinique**
   Synthèse rapide et claire de ce que présente le patient.

2. **Analyse multimodale unifiée**
   - Analyse des symptômes textuels
   - Analyse de la voix (respiration, fatigue vocale, toux…)
   - Analyse des images (lésions, anomalies visibles)
   - Analyse des documents médicaux
   - Corrélation entre les différentes sources
   - Prise en compte de l'âge + antécédents + allergies + traitements

3. **Hypothèses diagnostiques probables**
   Pour chaque hypothèse :
   - nom de la pathologie
   - justification clinique basée sur TOUTES les sources
   - niveau de confiance (%)
   - niveau de gravité

4. **Niveau de gravité** (faible / modéré / élevé)
   Justifie ce niveau en utilisant toutes les données.
   Note: Pour les urgences vitales, utilise "high" (la base de données n'accepte que "low", "medium", "high").

5. **Recommandations médicales**
   - examens complémentaires utiles
   - consultations recommandées
   - traitement d'attente (non médicalisé)
   - signaux d'alerte à surveiller

6. **Conclusion médicale**
   Basée sur toutes les sources, comme un médecin qui synthétise.

IMPORTANT :
- Utilise un langage médical clair et compréhensible pour un patient.
- Ne donne jamais de diagnostic définitif : fournir des hypothèses.
- Ne proposer aucun médicament (conformité RGPD/HDS).
- Toujours recommander un professionnel en cas de doute ou gravité.
- Combine TOUTES les sources dans un seul raisonnement clinique.
- Corrèle les données entre elles (ex: "L'essoufflement dans la voix corrobore l'image montrant X").

Génère maintenant le rapport complet au format JSON strict.`;

  // CRITICAL: Build messages array with images if available (GPT-4o Vision)
  const messages: any[] = [
    { role: 'system', content: systemPromptFull },
  ];

  // CRITICAL: Log the complete prompt for debugging
  console.log(`[OpenAI] 📝 PROMPT COMPLET POUR RAPPORT:`);
  console.log(`[OpenAI] System Prompt (${systemPromptFull.length} chars):`, systemPromptFull.substring(0, 200) + '...');
  console.log(`[OpenAI] User Prompt (${userPrompt.length} chars):`, userPrompt.substring(0, 500) + '...');
  console.log(`[OpenAI] Context includes:`, {
    textInput: !!preAnalysisData.textInput,
    voiceTranscript: !!preAnalysisData.voiceTranscript,
    selectedChips: preAnalysisData.selectedChips?.length || 0,
    imageUrls: imageUrls?.length || 0,
    documentUrls: preAnalysisData.documentUrls?.length || 0,
    chatMessages: conversationHistory.length,
    patientProfile: !!preAnalysisData.patientProfile,
    unifiedContext: !!preAnalysisData.unifiedContext,
  });

  // CRITICAL: If images are available, use Vision API format
  if (imageUrls && imageUrls.length > 0 && preAnalysisData.unifiedContext?.image_urls) {
    console.log(`[OpenAI] Using Vision API for ${imageUrls.length} image(s)`);
    
    // Build content array with text and images
    const contentArray: any[] = [
      { type: 'text', text: userPrompt }
    ];

    // Add all images to the content array
    for (const imageUrl of imageUrls) {
      try {
        // CRITICAL: Validate that URL is an image before processing
        const urlLower = imageUrl.toLowerCase();
        const isImageUrl = urlLower.match(/\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i);
        
        if (!isImageUrl) {
          console.warn(`[OpenAI] Skipping non-image URL: ${imageUrl}`);
          continue;
        }

        // CRITICAL: Download image using Supabase Storage API if needed
        // This handles both public and private URLs
        let imageBlob: Blob;
        try {
          const { downloadImageFromStorage } = await import('../utils/imageDownload');
          imageBlob = await downloadImageFromStorage(imageUrl);
          console.log(`[OpenAI] ✅ Image downloaded successfully: ${imageUrl.substring(0, 50)}...`);
        } catch (downloadError: any) {
          console.error(`[OpenAI] ❌ Failed to download image ${imageUrl}:`, downloadError);
          // Continue with next image instead of failing entire request
          continue;
        }
        
        // CRITICAL: Validate and correct MIME type
        let mimeType = imageBlob.type;
        
        if (!mimeType || !mimeType.startsWith('image/')) {
          // Try to detect MIME type from URL extension
          if (urlLower.includes('.png')) {
            mimeType = 'image/png';
          } else if (urlLower.includes('.gif')) {
            mimeType = 'image/gif';
          } else if (urlLower.includes('.webp')) {
            mimeType = 'image/webp';
          } else if (urlLower.includes('.bmp')) {
            mimeType = 'image/bmp';
          } else if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) {
            mimeType = 'image/jpeg';
          } else {
            mimeType = 'image/jpeg'; // Default fallback
          }
          
          console.warn(`[OpenAI] Blob type is "${imageBlob.type}", using detected type "${mimeType}" for ${imageUrl}`);
        }
        
        // CRITICAL: Ensure mimeType is valid for Vision API
        const validMimeType = mimeType && mimeType.startsWith('image/') 
          ? mimeType 
          : 'image/jpeg'; // Fallback to jpeg if still invalid
        
        const base64Image = await blobToBase64(imageBlob);
        
        contentArray.push({
          type: 'image_url',
          image_url: {
            url: `data:${validMimeType};base64,${base64Image}`
          }
        });
      } catch (imageError: any) {
        console.error(`[OpenAI] Error processing image ${imageUrl}:`, imageError);
        // Continue with other images - don't fail the entire request
      }
    }

    messages.push({
      role: 'user',
      content: contentArray
    });
  } else {
    // No images, use text-only format
    messages.push({
      role: 'user',
      content: userPrompt
    });
  }

  // CRITICAL: Log the complete prompt before sending to OpenAI
  console.log('📝 ========== FINAL OPENAI PROMPT START (RAPPORT) ==========');
  console.log('📝 Full request payload:');
  
  // CRITICAL: Check if messages contain images
  const hasImages = messages.some((msg: any) => 
    Array.isArray(msg.content) && msg.content.some((item: any) => item.type === 'image_url')
  );
  
  const requestPayload: any = {
    model: 'gpt-4o',
    messages: messages,
    temperature: 0.3,
    max_tokens: 4000, // CRITICAL: Increased for comprehensive medical reports
  };
  
  // CRITICAL: response_format: json_object can cause empty responses when combined with images
  // Only use it when there are no images
  if (!hasImages) {
    requestPayload.response_format = { type: 'json_object' };
    console.log('[OpenAI] ✅ Using response_format: json_object (no images)');
  } else {
    console.log('[OpenAI] ⚠️ NOT using response_format: json_object (images present - forcing JSON in prompt)');
    // The system prompt already instructs to return JSON, so it should work without response_format
  }
  
  console.log(JSON.stringify(requestPayload, null, 2));
  console.log('📝 Messages breakdown:');
  messages.forEach((msg, idx) => {
    console.log(`📝 Message ${idx + 1} (${msg.role}):`);
    if (Array.isArray(msg.content)) {
      // Vision API format - log each content item
      msg.content.forEach((item: any, itemIdx: number) => {
        if (item.type === 'text') {
          console.log(`📝   Text content (${item.text.length} chars): ${item.text.substring(0, 200)}...`);
        } else if (item.type === 'image_url') {
          const base64Preview = item.image_url.url.substring(0, 100);
          console.log(`📝   Image ${itemIdx}: ${base64Preview}... (${item.image_url.url.length} chars total)`);
        }
      });
    } else {
      console.log(`📝   Content (${msg.content.length} chars): ${msg.content.substring(0, 200)}...`);
    }
  });
  console.log('📝 ========== FINAL OPENAI PROMPT END (RAPPORT) ==========');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      console.error('[OpenAI] ❌ API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`OpenAI API error: ${errorData.error?.message || errorData.message || response.statusText}`);
    }

    const data = await response.json();
    
    // CRITICAL: Log full response for debugging
    console.log('[OpenAI] 📥 Full API Response:', JSON.stringify(data, null, 2));
    console.log('[OpenAI] 📊 Response Summary:', {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length || 0,
      firstChoice: data.choices?.[0] ? {
        hasMessage: !!data.choices[0].message,
        hasContent: !!data.choices[0].message?.content,
        contentLength: data.choices[0].message?.content?.length || 0,
        finishReason: data.choices[0].finish_reason,
        contentPreview: data.choices[0].message?.content?.substring(0, 200) || 'NO CONTENT'
      } : null,
      usage: data.usage
    });

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('[OpenAI] ❌ Empty content in response - Full response data:');
      console.error(JSON.stringify(data, null, 2));
      
      // Check if response was cut off due to token limit
      if (data.choices?.[0]?.finish_reason === 'length') {
        throw new Error('Rapport trop long - réponse tronquée par OpenAI. Augmentez max_tokens.');
      }
      
      // If finish_reason is 'stop' but content is empty, it might be a JSON parsing issue
      if (data.choices?.[0]?.finish_reason === 'stop' && !content) {
        console.error('[OpenAI] ⚠️ Finish reason is "stop" but content is empty - possible JSON format issue with images');
        // Try to get any content from the response
        const rawContent = data.choices?.[0]?.message?.content;
        if (rawContent) {
          console.log('[OpenAI] Found raw content:', rawContent.substring(0, 500));
          content = rawContent;
        } else {
          throw new Error('Empty response from OpenAI. Finish reason: stop but no content. Possible issue with JSON format and images.');
        }
      } else {
        throw new Error(`Empty response from OpenAI. Finish reason: ${data.choices?.[0]?.finish_reason || 'unknown'}`);
      }
    }

    // Parse JSON response
    let reportData: AIReportData;
    try {
      reportData = JSON.parse(content);
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        reportData = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Invalid JSON response from AI');
      }
    }

    // CRITICAL: Validate and normalize overall_severity to match database constraint
    // Database only accepts: 'low' | 'medium' | 'high' (NOT 'critical')
    if (reportData.overall_severity) {
      const severity = reportData.overall_severity.toLowerCase();
      if (severity === 'critical') {
        console.warn('[OpenAI] ⚠️ Converting "critical" severity to "high" to match database constraint');
        reportData.overall_severity = 'high';
      } else if (!['low', 'medium', 'high'].includes(severity)) {
        console.warn(`[OpenAI] ⚠️ Invalid severity "${severity}", defaulting to "medium"`);
        reportData.overall_severity = 'medium';
      } else {
        reportData.overall_severity = severity as 'low' | 'medium' | 'high';
      }
    }

    // Validate required fields
    if (!reportData.diagnostic_hypotheses || !Array.isArray(reportData.diagnostic_hypotheses)) {
      throw new Error('Missing diagnostic_hypotheses in AI response');
    }

    // Ensure at least one primary diagnosis
    if (!reportData.diagnostic_hypotheses.some((h: DiagnosticHypothesis) => h.is_primary)) {
      if (reportData.diagnostic_hypotheses.length > 0) {
        reportData.diagnostic_hypotheses[0].is_primary = true;
      }
    }

    // Ensure explainability_data exists
    if (!reportData.explainability_data) {
      reportData.explainability_data = {
        text_analysis: reportData.diagnostic_hypotheses.map((h: DiagnosticHypothesis) => ({
          label: h.disease_name,
          description: h.explanation
        }))
      };
    }

    return reportData;
  } catch (error: any) {
    console.error('Error generating AI report:', error);
    throw new Error(`Erreur lors de la génération du rapport: ${error.message}`);
  }
}

/**
 * Transcribe audio using OpenAI Whisper API
 */
export async function transcribeAudio(audioFile: File): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  const formData = new FormData();
  formData.append('file', audioFile);
  formData.append('model', 'whisper-1');
  formData.append('language', 'fr');

  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.text || '';
  } catch (error: any) {
    console.error('Error transcribing audio:', error);
    throw new Error(`Erreur lors de la transcription: ${error.message}`);
  }
}

/**
 * Analyze images using OpenAI Vision API
 */
export async function analyzeImage(imageUrl: string, context?: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  console.log(`[OpenAI Vision] 🔍 Début analyse d'image`);
  console.log(`[OpenAI Vision] 📷 URL: ${imageUrl.substring(0, 80)}...`);
  console.log(`[OpenAI Vision] 📝 Contexte: ${context || 'Aucun contexte spécifique'}`);

  // CRITICAL: Validate that URL is an image before processing
  const urlLower = imageUrl.toLowerCase();
  const isImageUrl = urlLower.match(/\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i);
  
  if (!isImageUrl) {
    console.error(`[OpenAI Vision] ❌ URL n'est pas une image: ${imageUrl}`);
    throw new Error(`URL is not an image: ${imageUrl}`);
  }

  // CRITICAL: Download image using Supabase Storage API if needed
  let imageBlob: Blob;
  try {
    const { downloadImageFromStorage } = await import('../utils/imageDownload');
    imageBlob = await downloadImageFromStorage(imageUrl);
    console.log(`[OpenAI Vision] ✅ Image téléchargée avec succès (${imageBlob.size} bytes, type: ${imageBlob.type})`);
  } catch (downloadError: any) {
    console.error(`[OpenAI Vision] ❌ Échec du téléchargement de l'image:`, downloadError);
    throw new Error(`Failed to download image: ${downloadError.message}`);
  }
  
  // CRITICAL: Validate and correct MIME type if needed
  let mimeType = imageBlob.type;
  
  if (!mimeType || !mimeType.startsWith('image/')) {
    // Try to detect MIME type from URL extension
    if (urlLower.includes('.png')) {
      mimeType = 'image/png';
    } else if (urlLower.includes('.gif')) {
      mimeType = 'image/gif';
    } else if (urlLower.includes('.webp')) {
      mimeType = 'image/webp';
    } else if (urlLower.includes('.bmp')) {
      mimeType = 'image/bmp';
    } else {
      mimeType = 'image/jpeg'; // Default fallback
    }
    
    console.warn(`[OpenAI] Blob type is "${imageBlob.type}", using detected type "${mimeType}" for ${imageUrl}`);
  }
  
  const base64Image = await blobToBase64(imageBlob);

  // CRITICAL: Ensure mimeType is valid for Vision API
  const validMimeType = mimeType && mimeType.startsWith('image/') 
    ? mimeType 
    : 'image/jpeg'; // Fallback to jpeg if still invalid

  const systemPrompt = `Tu es un assistant médical IA expert en analyse d'images médicales.
Analyse l'image fournie et décris ce que tu observes de manière médicale précise.
Note les éléments visuels pertinents pour l'analyse des symptômes.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Use vision-capable model
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: context || 'Analyse cette image médicale et décris ce que tu observes.' },
              { type: 'image_url', image_url: { url: `data:${validMimeType};base64,${base64Image}` } },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`[OpenAI Vision] ❌ Erreur API:`, error);
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const analysisResult = data.choices[0]?.message?.content || 'Image analysée.';
    
    // CRITICAL: Log the complete analysis result
    console.log(`[OpenAI Vision] ✅ Analyse complétée avec succès`);
    console.log(`[OpenAI Vision] 📊 Résultat de l'analyse (${analysisResult.length} caractères):`);
    console.log(`[OpenAI Vision] ========== ANALYSE IMAGE PAR IA ==========`);
    console.log(analysisResult);
    console.log(`[OpenAI Vision] ==========================================`);
    console.log(`[OpenAI Vision] 📈 Usage tokens:`, data.usage);
    
    return analysisResult;
  } catch (error: any) {
    console.error(`[OpenAI Vision] ❌ Erreur lors de l'analyse de l'image:`, error);
    console.error(`[OpenAI Vision] Détails de l'erreur:`, {
      message: error.message,
      stack: error.stack,
      url: imageUrl.substring(0, 80)
    });
    throw new Error(`Erreur lors de l'analyse de l'image: ${error.message}`);
  }
}

/**
 * Helper function to convert blob to base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

