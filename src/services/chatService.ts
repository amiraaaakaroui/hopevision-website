/**
 * Chat Service
 * Handles all chat message operations (CRUD, AI responses)
 * Separated from UI components for Clean Architecture
 */

import { supabase } from '../lib/supabaseClient';
import type { ChatPrecisionMessage } from '../types/database';
import { analyzeSymptoms } from '../lib/openaiService';
import { buildUnifiedMedicalContext } from '../utils/medicalContext';
import { extractTextFromDocuments } from '../utils/documentExtraction';

/**
 * Chat Message for UI (simplified format)
 */
export interface ChatMessage {
  sender: 'ai' | 'user' | 'patient';
  text: string;
  timestamp: string;
  id?: string;
}

export interface LoadMessagesParams {
  preAnalysisId: string;
}

export interface SaveMessageParams {
  preAnalysisId: string;
  senderType: 'ai' | 'patient';
  messageText: string;
}

export interface GenerateAIResponseParams {
  preAnalysisId: string;
  conversationHistory: ChatMessage[];
}

/**
 * Load all chat messages for a pre-analysis
 * CRITICAL: Strict isolation by pre_analysis_id - NO patient_profile_id filtering
 */
export async function loadMessages({ preAnalysisId }: LoadMessagesParams): Promise<ChatMessage[]> {
  // CRITICAL: Validate preAnalysisId before query
  if (!preAnalysisId || typeof preAnalysisId !== 'string' || preAnalysisId.trim() === '') {
    throw new Error('pre_analysis_id invalide ou manquant');
  }

  // CRITICAL: Query with STRICT isolation - ONLY pre_analysis_id filter
  const { data, error } = await supabase
    .from('chat_precision_messages')
    .select('*')
    .eq('pre_analysis_id', preAnalysisId) // CRITICAL: ONLY this filter - no patient_profile_id
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Erreur lors du chargement des messages: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  // CRITICAL: Verify isolation - all messages must belong to this pre_analysis_id
  const invalidMessages = data.filter(msg => msg.pre_analysis_id !== preAnalysisId);
  if (invalidMessages.length > 0) {
    console.error(`[ChatService] CRITICAL: Found ${invalidMessages.length} messages with incorrect pre_analysis_id!`);
    throw new Error('Violation d\'isolation: Des messages appartiennent à une autre pré-analyse');
  }

  return data.map((msg: ChatPrecisionMessage) => ({
    sender: msg.sender_type,
    text: msg.message_text,
    timestamp: new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    id: msg.id,
  }));
}

/**
 * Save a chat message to database
 * CRITICAL: Strict isolation - message is linked ONLY to pre_analysis_id
 */
export async function saveMessage({
  preAnalysisId,
  senderType,
  messageText,
}: SaveMessageParams): Promise<ChatMessage> {
  // CRITICAL: Validate preAnalysisId before insert
  if (!preAnalysisId || typeof preAnalysisId !== 'string' || preAnalysisId.trim() === '') {
    throw new Error('pre_analysis_id invalide ou manquant');
  }

  // CRITICAL: Insert with STRICT isolation - ONLY pre_analysis_id
  const { data, error } = await supabase
    .from('chat_precision_messages')
    .insert({
      pre_analysis_id: preAnalysisId, // CRITICAL: ONLY this link - no patient_profile_id
      sender_type: senderType,
      message_text: messageText,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur lors de la sauvegarde: ${error.message}`);
  }

  // CRITICAL: Verify the saved message belongs to the correct pre_analysis_id
  if (data.pre_analysis_id !== preAnalysisId) {
    console.error(`[ChatService] CRITICAL: Saved message has incorrect pre_analysis_id! Expected: ${preAnalysisId}, Got: ${data.pre_analysis_id}`);
    throw new Error('Violation d\'isolation: Le message sauvegardé appartient à une autre pré-analyse');
  }

  return {
    sender: data.sender_type,
    text: data.message_text,
    timestamp: new Date(data.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    id: data.id,
  };
}

/**
 * Load complete conversation history from database
 * CRITICAL: Strict isolation by pre_analysis_id - NO patient_profile_id filtering
 */
export async function loadCompleteHistory(preAnalysisId: string): Promise<ChatMessage[]> {
  // CRITICAL: Validate preAnalysisId before query
  if (!preAnalysisId || typeof preAnalysisId !== 'string' || preAnalysisId.trim() === '') {
    console.error('[ChatService] Invalid preAnalysisId:', preAnalysisId);
    return [];
  }

  console.log(`[ChatService] 🔍 Loading complete history for pre_analysis_id: ${preAnalysisId}`);

  // CRITICAL: Query with STRICT isolation - ONLY pre_analysis_id filter
  const { data, error } = await supabase
    .from('chat_precision_messages')
    .select('*')
    .eq('pre_analysis_id', preAnalysisId) // CRITICAL: ONLY this filter - no patient_profile_id
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[ChatService] ❌ Error loading chat messages from DB:', error);
    return [];
  }

  if (!data) {
    console.log(`[ChatService] ✅ No messages found for pre_analysis_id: ${preAnalysisId}`);
    return [];
  }

  console.log(`[ChatService] 📊 Loaded ${data.length} messages from DB for pre_analysis_id: ${preAnalysisId}`);
  
  // CRITICAL: Log all pre_analysis_id values to detect leakage
  const uniquePreAnalysisIds = [...new Set(data.map(msg => msg.pre_analysis_id))];
  if (uniquePreAnalysisIds.length > 1) {
    console.error(`[ChatService] 🚨 CRITICAL DATA LEAKAGE DETECTED! Found messages from multiple pre_analyses:`, uniquePreAnalysisIds);
    console.error(`[ChatService] Expected: ${preAnalysisId}, Found:`, uniquePreAnalysisIds);
  } else if (uniquePreAnalysisIds[0] !== preAnalysisId) {
    console.error(`[ChatService] 🚨 CRITICAL: All messages belong to different pre_analysis_id! Expected: ${preAnalysisId}, Got: ${uniquePreAnalysisIds[0]}`);
  }

  // CRITICAL: Verify isolation - all messages must belong to this pre_analysis_id
  const invalidMessages = data.filter(msg => msg.pre_analysis_id !== preAnalysisId);
  if (invalidMessages.length > 0) {
    console.error(`[ChatService] 🚨 CRITICAL: Found ${invalidMessages.length} messages with incorrect pre_analysis_id!`);
    console.error(`[ChatService] Invalid messages:`, invalidMessages.map(m => ({ id: m.id, pre_analysis_id: m.pre_analysis_id, text: m.message_text.substring(0, 50) })));
    // Don't throw - return empty array to prevent data leakage
    return [];
  }

  console.log(`[ChatService] ✅ All ${data.length} messages verified - isolation confirmed for pre_analysis_id: ${preAnalysisId}`);

  return data.map((msg: ChatPrecisionMessage) => ({
    sender: msg.sender_type,
    text: msg.message_text,
    timestamp: new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    id: msg.id,
  }));
}

/**
 * Generate AI response based on pre-analysis context and conversation history
 * CRITICAL: Multimodal support (Images + Documents) + Strict data isolation
 */
export async function generateAIResponse({
  preAnalysisId,
  conversationHistory,
}: GenerateAIResponseParams): Promise<string> {
  console.log(`[ChatService] 🤖 Generating AI response for pre-analysis: ${preAnalysisId}`);
  console.log(`[ChatService] 📥 Frontend provided ${conversationHistory.length} messages (will be ignored - loading from DB)`);
  
  // CRITICAL: Load complete history from DB (sovereignty of data)
  // Don't trust the conversationHistory from frontend - load the real data
  const completeHistoryFromDB = await loadCompleteHistory(preAnalysisId);
  console.log(`[ChatService] ✅ Loaded ${completeHistoryFromDB.length} messages from DB for pre_analysis_id: ${preAnalysisId}`);
  
  // CRITICAL: Log message count to detect if we're getting messages from other analyses
  if (completeHistoryFromDB.length > 20) {
    console.warn(`[ChatService] ⚠️ WARNING: Loaded ${completeHistoryFromDB.length} messages - this seems high. Possible data leakage?`);
  }

  // Load pre-analysis with patient profile - STRICT ISOLATION by pre_analysis_id
  const { data: preAnalysis, error: preAnalysisError } = await supabase
    .from('pre_analyses')
    .select('*, patient_profiles(*, profiles(*))')
    .eq('id', preAnalysisId) // CRITICAL: Strict filter
    .single();

  if (preAnalysisError) {
    throw new Error(`Erreur lors du chargement de la pré-analyse: ${preAnalysisError.message}`);
  }

  // CRITICAL: Verify isolation
  if (preAnalysis.id !== preAnalysisId) {
    throw new Error(`Violation d'isolation: L'ID de la pré-analyse ne correspond pas`);
  }

  // Handle both array and object formats from Supabase
  const patientProfile = Array.isArray(preAnalysis.patient_profiles)
    ? preAnalysis.patient_profiles[0]
    : preAnalysis.patient_profiles;

  const profile = Array.isArray(patientProfile?.profiles)
    ? patientProfile.profiles[0]
    : patientProfile?.profiles;

  // Calculate age from date_of_birth
  let age: number | undefined;
  if (profile?.date_of_birth) {
    const birthDate = new Date(profile.date_of_birth);
    const today = new Date();
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }

  // CRITICAL: Extract text from documents if available
  let documentContents: string[] = [];
  if (preAnalysis.document_urls && preAnalysis.document_urls.length > 0) {
    try {
      console.log(`[ChatService] Extracting text from ${preAnalysis.document_urls.length} document(s)...`);
      // OPTIMIZATION: Pass patient_profile_id to use DB cache
      documentContents = await extractTextFromDocuments(preAnalysis.document_urls, preAnalysis.patient_profile_id);
      console.log(`[ChatService] Document extraction completed: ${documentContents.length} texts`);
    } catch (docError: any) {
      console.error('[ChatService] Error extracting document text:', docError);
      // Continue without document text, but log the error
      documentContents = [`[Erreur d'extraction pour ${preAnalysis.document_urls.length} document(s)]`];
    }
  }

  // CRITICAL: Format chat messages from DB (use complete history, not frontend)
  const formattedChatMessages: Array<{ role: 'user' | 'assistant'; content: string; timestamp?: string }> = completeHistoryFromDB.map((msg) => ({
    role: (msg.sender === 'patient' ? 'user' : 'assistant') as 'user' | 'assistant',
    content: msg.text,
    timestamp: msg.timestamp,
  }));

  // Build unified medical context with ALL modalities including documents
  const unifiedContext = buildUnifiedMedicalContext({
    textInput: preAnalysis.text_input || undefined,
    voiceTranscripts: preAnalysis.voice_transcript || undefined,
    selectedChips: preAnalysis.selected_chips || undefined,
    imageUrls: preAnalysis.image_urls || undefined,
    documentUrls: preAnalysis.document_urls || undefined,
    documentContents: documentContents, // CRITICAL: Pass extracted document text
    chatMessages: formattedChatMessages, // CRITICAL: Use complete history from DB
    patientProfile: {
      age,
      gender: patientProfile?.gender || undefined,
      bloodGroup: patientProfile?.blood_group || undefined,
      allergies: patientProfile?.allergies || undefined,
      medicalHistory: patientProfile?.medical_history || undefined,
    },
  });

  // CRITICAL: Log the unified context for debugging
  console.log(`[ChatService] 📊 CONTEXTE UNIFIÉ POUR CHAT:`);
  console.log(`[ChatService] Combined text block length: ${unifiedContext.combined_text_block.length} chars`);
  console.log(`[ChatService] Combined text block preview:`, unifiedContext.combined_text_block.substring(0, 500) + '...');
  console.log(`[ChatService] Modalities:`, {
    text: !!preAnalysis.text_input,
    voice: !!preAnalysis.voice_transcript,
    chips: preAnalysis.selected_chips?.length || 0,
    images: preAnalysis.image_urls?.length || 0,
    documents: preAnalysis.document_urls?.length || 0,
    documentContents: documentContents.length,
    chatMessages: formattedChatMessages.length,
    patientProfile: !!patientProfile,
  });

  // If this is the first message (no conversation yet), use analyzeSymptoms
  if (completeHistoryFromDB.length === 0 || (completeHistoryFromDB.length === 1 && completeHistoryFromDB[0].sender === 'ai')) {
    return await analyzeSymptoms({ unifiedContext });
  } else {
    // For subsequent messages, include ALL context in the chat with Vision support
    return await generateChatResponseWithVision(
      formattedChatMessages,
      unifiedContext,
      preAnalysis.image_urls || []
    );
  }
}

/**
 * Generate chat response with Vision API support for images
 * CRITICAL: Includes images in GPT-4o Vision format if available
 */
async function generateChatResponseWithVision(
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp?: string }>,
  unifiedContext: any,
  imageUrls: string[]
): Promise<string> {
  // Get OpenAI API key from environment (same pattern as openaiService.ts)
  const OPENAI_API_KEY = (import.meta as any).env?.VITE_OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  // CRITICAL: Log the complete prompt for debugging
  console.log(`[ChatService] 📝 ========== PROMPT COMPLET POUR CHAT ==========`);
  console.log(`[ChatService] Unified context length: ${unifiedContext.combined_text_block.length} chars`);
  console.log(`[ChatService] Unified context preview:`, unifiedContext.combined_text_block.substring(0, 500) + '...');
  console.log(`[ChatService] Conversation history: ${conversationHistory.length} messages`);
  console.log(`[ChatService] Images: ${imageUrls.length}`);
  console.log(`[ChatService] ===================================================`);

  // CRITICAL: Improved system prompt (strict and detailed)
  const systemPrompt = `Tu es HopeVision, IA d’ANALYSE PRÉLIMINAIRE DES SYMPTÔMES.
Tu n’es PAS médecin. Pas de diagnostic certain, pas de prescription.

RÔLE
- Structurer les symptômes, détecter la gravité, orienter la priorité, générer des synthèses.
- Toujours rappeler que l’analyse est indicative et qu’un médecin doit confirmer.

RÈGLES DE SÉCURITÉ
- Jamais « vous n’avez rien ». Préférer « situation modérée mais avis médical nécessaire ».
- Aucun traitement/posologie.
- Signes de gravité (douleur thoracique intense, signes neuro aigus, détresse respi, saignement abondant, perte de connaissance…) => dire explicitement :
  « Appelez immédiatement les urgences (SAMU / numéro local). Ne vous fiez pas uniquement à cette application. »
- Images : décrire prudemment, formuler « pourrait correspondre à… », jamais conclure seul.

MODES
- mode="chat" : poser UNE question à la fois (ou petit bloc 2–3 sous-questions liées). Priorités :
  1) vérifier urgences selon symptôme principal,
  2) durée/évolution,
  3) contexte (effort, alimentation, stress…),
  4) symptômes associés,
  5) antécédents/facteurs de risque.
- mode="rapport_court" : produire un résumé court + triage (texte), structure :
  1. Motif principal
  2. Niveau de gravité estimé (Urgence immédiate / Consultation 24–48h / Consultation prochainement / Situation probablement bénigne à surveiller) + justification courte
  3. Pistes possibles (2–3) formulées en hypothèses
  4. Recommandation principale (rappeler qu’un médecin doit confirmer)
- mode="rapport_detaille" : rapport structuré (titre rappel aide décision, résumé patient, analyse multimodale texte/images/docs, évaluation gravité, pistes cliniques 2–5, recommandations patient + points pour médecin, conclure que seul un pro peut confirmer).

COMPORTEMENT
- Par défaut considère mode="chat" si non précisé.
- Ne repose pas une information déjà présente.
- Mets en avant les contradictions : distinguer symptômes décrits vs info documentaire générale.
- 2–5 pistes maximum, bien expliquées.

RÈGLES ANTI-HALLUCINATION ET TRAÇABILITÉ DES SYMPTÔMES
- Ne déclare un symptôme présent que s’il apparaît dans le texte patient, une réponse explicite, ou un document spécifique au patient. Poser une question ne signifie pas présence.
- Distingue clairement en sortie :
  - Symptômes déclarés par le patient,
  - Symptômes observés sur images (au conditionnel),
  - Informations issues de documents généraux (non spécifiques),
  - Pistes/hypothèses (jamais comme faits).
- Ne jamais inventer ni amplifier. Un PDF général ne prouve pas que le patient a ces symptômes.
- Utiliser les documents généraux comme base de connaissance, pas comme description du patient.
- Pour les rapports détaillés, prévoir une section « Origine des informations » avec ces catégories.
- Si une hypothèse repose sur un seul symptôme non spécifique et sans éléments concordants, la qualifier de « hypothèse très incertaine » ou omettre si cela ajoute de la confusion.

CONTEXTE PATIENT (multimodal) :
${unifiedContext.combined_text_block}`;

  // Build messages array
  const messages: any[] = [
    { role: 'system', content: systemPrompt },
  ];

  // CRITICAL: If images are available, use Vision API format
  if (imageUrls && imageUrls.length > 0) {
    console.log(`[ChatService] Using Vision API for ${imageUrls.length} image(s)`);
    
    // Helper function to convert blob to base64
    const blobToBase64 = (blob: Blob): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };

    // Build content array with text and images for the first user message
    const contentArray: any[] = [
      { 
        type: 'text', 
        text: `Contexte patient complet (voir ci-dessus). Historique de conversation:\n\n${conversationHistory.map(msg => `${msg.role === 'user' ? 'Patient' : 'IA'}: ${msg.content}`).join('\n\n')}\n\nPose maintenant une question de précision basée sur le contexte complet.` 
      }
    ];

    // Add all images to the content array
    for (const imageUrl of imageUrls) {
      try {
        // CRITICAL: Validate that URL is an image before processing
        const urlLower = imageUrl.toLowerCase();
        const isImageUrl = urlLower.match(/\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i);
        
        if (!isImageUrl) {
          console.warn(`[ChatService] Skipping non-image URL: ${imageUrl}`);
          continue;
        }

        // CRITICAL: Use Supabase Storage API to download image (handles private URLs)
        let imageBlob: Blob;
        try {
          const { downloadImageFromStorage } = await import('../utils/imageDownload');
          imageBlob = await downloadImageFromStorage(imageUrl);
          console.log(`[ChatService] ✅ Image downloaded successfully: ${imageUrl.substring(0, 50)}...`);
        } catch (downloadError: any) {
          console.error(`[ChatService] ❌ Failed to download image ${imageUrl}:`, downloadError);
          // Continue with next image instead of failing entire request
          continue;
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
          
          console.warn(`[ChatService] Blob type is "${imageBlob.type}", using detected type "${mimeType}" for ${imageUrl}`);
        }
        
        const base64Image = await blobToBase64(imageBlob);
        
        contentArray.push({
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${base64Image}`
          }
        });
      } catch (imageError: any) {
        console.error(`[ChatService] Error processing image ${imageUrl}:`, imageError);
        // Continue with other images - don't fail the entire request
      }
    }

    // Add conversation history (excluding the first message which is now in contentArray)
    if (conversationHistory.length > 0) {
      messages.push({
        role: 'user',
        content: contentArray
      });

      // Add remaining conversation history
      for (let i = 1; i < conversationHistory.length; i++) {
        messages.push({
          role: conversationHistory[i].role,
          content: conversationHistory[i].content
        });
      }
    } else {
      messages.push({
        role: 'user',
        content: contentArray
      });
    }
  } else {
    // No images, use text-only format with conversation history
    const userMessage = `Contexte patient complet (voir ci-dessus). Historique de conversation:\n\n${conversationHistory.map(msg => `${msg.role === 'user' ? 'Patient' : 'IA'}: ${msg.content}`).join('\n\n')}\n\nPose maintenant une question de précision basée sur le contexte complet.`;
    
    messages.push({
      role: 'user',
      content: userMessage
    });
  }

  // CRITICAL: Log the complete prompt before sending to OpenAI
  console.log('📝 ========== FINAL OPENAI PROMPT START (CHAT) ==========');
  console.log('📝 Full request payload:');
  const requestPayload = {
    model: 'gpt-4o',
    messages: messages,
    temperature: 0.7,
    max_tokens: 400,
  };
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
  console.log('📝 ========== FINAL OPENAI PROMPT END (CHAT) ==========');

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
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Pouvez-vous me donner plus de précisions ?';
  } catch (error: any) {
    console.error('[ChatService] Error calling OpenAI:', error);
    throw new Error(`Erreur lors de la génération de la réponse: ${error.message}`);
  }
}

/**
 * Get patient answers from chat history
 * CRITICAL: Strict isolation by pre_analysis_id - NO patient_profile_id filtering
 */
export async function getPatientAnswers(preAnalysisId: string): Promise<string> {
  // CRITICAL: Validate preAnalysisId before query
  if (!preAnalysisId || typeof preAnalysisId !== 'string' || preAnalysisId.trim() === '') {
    console.error('[ChatService] Invalid preAnalysisId:', preAnalysisId);
    return '';
  }

  // CRITICAL: Query with STRICT isolation - ONLY pre_analysis_id filter
  const { data } = await supabase
    .from('chat_precision_messages')
    .select('*')
    .eq('pre_analysis_id', preAnalysisId) // CRITICAL: ONLY this filter - no patient_profile_id
    .order('created_at', { ascending: true });

  if (!data) {
    return '';
  }

  // CRITICAL: Verify isolation
  const invalidMessages = data.filter(msg => msg.pre_analysis_id !== preAnalysisId);
  if (invalidMessages.length > 0) {
    console.error(`[ChatService] CRITICAL: Found ${invalidMessages.length} messages with incorrect pre_analysis_id!`);
    // Return empty string to prevent data leakage
    return '';
  }

  return data
    .filter(msg => msg.sender_type === 'patient')
    .map(msg => msg.message_text)
    .join('\n\n');
}

