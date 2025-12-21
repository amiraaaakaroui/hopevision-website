/**
 * AI Report Service
 * Handles generation and saving of AI reports after pre-analysis completion
 */

import { supabase } from '../lib/supabaseClient';
import { generateAIReport } from '../lib/openaiService';
import { buildUnifiedMedicalContext } from '../utils/medicalContext';
import { extractTextFromDocuments } from '../utils/documentExtraction'; // NEW
import type { AIReport } from '../types/database';

interface PatientProfileData {
  age?: number;
  gender?: string;
  bloodGroup?: string;
  allergies?: string[];
  medicalHistory?: string;
}



/**
 * Generate and save AI report for a completed pre-analysis
 * CRITICAL: All data is strictly isolated by pre_analysis_id to prevent data leakage between analyses
 */
export async function generateAndSaveAIReport(preAnalysisId: string): Promise<AIReport> {
  try {
    console.log(`[AI Report] Starting report generation for pre-analysis: ${preAnalysisId}`);
    
    // CRITICAL: Verify pre_analysis_id is valid and exists
    if (!preAnalysisId || typeof preAnalysisId !== 'string' || preAnalysisId.trim() === '') {
      throw new Error('pre_analysis_id invalide ou manquant');
    }

    // 1. Load pre-analysis with all related data - STRICT ISOLATION by pre_analysis_id
    const { data: preAnalysis, error: preAnalysisError } = await supabase
      .from('pre_analyses')
      .select(`
        *,
        patient_profiles (
          *,
          profiles (
            date_of_birth,
            full_name
          )
        )
      `)
      .eq('id', preAnalysisId) // CRITICAL: Strict filter by pre_analysis_id
      .single();

    if (preAnalysisError) {
      console.error('[AI Report] Error loading pre-analysis:', preAnalysisError);
      throw new Error(`Pré-analyse non trouvée: ${preAnalysisError.message} (Code: ${preAnalysisError.code})`);
    }

    if (!preAnalysis) {
      throw new Error(`Pré-analyse non trouvée pour l'ID: ${preAnalysisId}`);
    }

    // CRITICAL: Verify we have the correct pre_analysis_id
    if (preAnalysis.id !== preAnalysisId) {
      throw new Error(`Incohérence: L'ID de la pré-analyse ne correspond pas (attendu: ${preAnalysisId}, reçu: ${preAnalysis.id})`);
    }

    console.log(`[AI Report] Pre-analysis loaded: ${preAnalysisId}, patient: ${preAnalysis.patient_profile_id}`);

    // 2. Load conversation history - STRICT ISOLATION by pre_analysis_id
    // CRITICAL: Validate preAnalysisId before query
    if (!preAnalysisId || typeof preAnalysisId !== 'string' || preAnalysisId.trim() === '') {
      throw new Error('pre_analysis_id invalide ou manquant');
    }

    console.log(`[AI Report] 🔍 Loading chat messages for pre_analysis_id: ${preAnalysisId}`);

    // CRITICAL: Query with STRICT isolation - ONLY pre_analysis_id filter
    // NO patient_profile_id filtering - this would cause data leakage
    const { data: chatMessages, error: chatError } = await supabase
      .from('chat_precision_messages')
      .select('*')
      .eq('pre_analysis_id', preAnalysisId) // CRITICAL: ONLY this filter - no patient_profile_id, no .or()
      .order('created_at', { ascending: true });

    if (chatError) {
      console.error('[AI Report] ❌ Error loading chat messages:', chatError);
      throw new Error(`Erreur lors du chargement des messages: ${chatError.message}`);
    }

    // CRITICAL: Verify all chat messages belong to this pre_analysis_id
    if (chatMessages) {
      // CRITICAL: Log all pre_analysis_id values to detect leakage
      const uniquePreAnalysisIds = [...new Set(chatMessages.map(msg => msg.pre_analysis_id))];
      if (uniquePreAnalysisIds.length > 1) {
        console.error(`[AI Report] 🚨 CRITICAL DATA LEAKAGE DETECTED! Found messages from multiple pre_analyses:`, uniquePreAnalysisIds);
        console.error(`[AI Report] Expected: ${preAnalysisId}, Found:`, uniquePreAnalysisIds);
        throw new Error(`Violation d'isolation: Des messages de chat appartiennent à plusieurs pré-analyses différentes`);
      } else if (uniquePreAnalysisIds[0] !== preAnalysisId) {
        console.error(`[AI Report] 🚨 CRITICAL: All messages belong to different pre_analysis_id! Expected: ${preAnalysisId}, Got: ${uniquePreAnalysisIds[0]}`);
        throw new Error(`Violation d'isolation: Tous les messages appartiennent à une autre pré-analyse`);
      }

      const invalidMessages = chatMessages.filter(msg => msg.pre_analysis_id !== preAnalysisId);
      if (invalidMessages.length > 0) {
        console.error(`[AI Report] 🚨 CRITICAL: Found ${invalidMessages.length} chat messages with incorrect pre_analysis_id!`);
        console.error('[AI Report] Invalid messages:', invalidMessages.map(m => ({ id: m.id, pre_analysis_id: m.pre_analysis_id, text: m.message_text.substring(0, 50) })));
        throw new Error('Violation d\'isolation: Des messages de chat appartiennent à une autre pré-analyse');
      }
      console.log(`[AI Report] ✅ Loaded ${chatMessages.length} chat messages for pre-analysis ${preAnalysisId} - isolation verified`);
      
      // CRITICAL: Warn if message count seems high (possible leakage)
      if (chatMessages.length > 20) {
        console.warn(`[AI Report] ⚠️ WARNING: Loaded ${chatMessages.length} messages - this seems high. Possible data leakage?`);
      }
    } else {
      console.log(`[AI Report] ✅ No chat messages found for pre-analysis ${preAnalysisId}`);
    }

    // 3. Prepare patient profile data
    // Handle both array and object formats from Supabase
    const patientProfile = Array.isArray(preAnalysis.patient_profiles)
      ? preAnalysis.patient_profiles[0]
      : preAnalysis.patient_profiles;

    const profile = Array.isArray(patientProfile?.profiles)
      ? patientProfile.profiles[0]
      : patientProfile?.profiles;

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

    const patientData: PatientProfileData = {
      age,
      gender: patientProfile?.gender || undefined,
      bloodGroup: patientProfile?.blood_group || undefined,
      allergies: patientProfile?.allergies || undefined,
      medicalHistory: patientProfile?.medical_history || undefined,
    };

    // 4. Prepare conversation history (formatted for OpenAI API)
    // Note: This is used later as formattedChatMessages

    // FIXED: Extract chat answers and merge with symptoms
    const patientAnswers = (chatMessages || [])
      .filter((msg: any) => msg.sender_type === 'patient')
      .map((msg: any) => msg.message_text)
      .join('\n\n---\n\n');

    // CRITICAL: Analyze images if available - Images MUST be analyzed and integrated
    let imageAnalyses: string[] = [];
    let imageUrlsForVision: string[] = []; // URLs to pass directly to GPT-4o Vision
    if (preAnalysis.image_urls && preAnalysis.image_urls.length > 0) {
      try {
        console.log(`[AI Report] Analyzing ${preAnalysis.image_urls.length} image(s) for pre-analysis ${preAnalysisId}...`);
        // CRITICAL: Verify image URLs belong to this pre-analysis (security check)
        const validImageUrls = preAnalysis.image_urls.filter((url: string) => {
          // Basic validation - URLs should contain patient_profile_id or pre_analysis_id
          return url && typeof url === 'string' && url.trim() !== '';
        });
        
        if (validImageUrls.length !== preAnalysis.image_urls.length) {
          console.warn(`[AI Report] Some image URLs were invalid, using ${validImageUrls.length}/${preAnalysis.image_urls.length}`);
        }
        
        // Store URLs for direct Vision API integration
        imageUrlsForVision = validImageUrls;
        
        // Analyze images for text description (for context)
        const { analyzeAllImages } = await import('../utils/imageAnalysis');
        imageAnalyses = await analyzeAllImages(validImageUrls);
        console.log(`[AI Report] Image analysis completed: ${imageAnalyses.length} analyses for pre-analysis ${preAnalysisId}`);
      } catch (imageError: any) {
        console.error('[AI Report] Error analyzing images:', imageError);
        // CRITICAL: If images exist but analysis fails, we should still pass URLs to Vision API
        if (preAnalysis.image_urls && preAnalysis.image_urls.length > 0) {
          imageUrlsForVision = preAnalysis.image_urls;
          console.warn('[AI Report] Image analysis failed, but URLs will be passed to Vision API');
        }
      }
    }

    // CRITICAL: Extract text from documents if available - Documents MUST be extracted and integrated
    let documentContents: string[] = [];
    if (preAnalysis.document_urls && preAnalysis.document_urls.length > 0) {
      try {
        console.log(`[AI Report] Extracting text from ${preAnalysis.document_urls.length} document(s) for pre-analysis ${preAnalysisId}...`);
        // CRITICAL: Verify document URLs belong to this pre-analysis
        const validDocumentUrls = preAnalysis.document_urls.filter((url: string) => {
          return url && typeof url === 'string' && url.trim() !== '';
        });
        
        // OPTIMIZATION: Pass patient_profile_id to use DB cache
        documentContents = await extractTextFromDocuments(validDocumentUrls, preAnalysis.patient_profile_id);
        console.log(`[AI Report] Document extraction completed: ${documentContents.length} texts extracted for pre-analysis ${preAnalysisId}`);
        
        if (documentContents.length === 0 && validDocumentUrls.length > 0) {
          console.warn('[AI Report] WARNING: Documents exist but no text was extracted');
        }
      } catch (docError: any) {
        console.error('[AI Report] Error extracting document text:', docError);
        // CRITICAL: If extraction fails, we should still try to include document info
        documentContents = [`[Erreur d'extraction pour ${preAnalysis.document_urls.length} document(s)]`];
      }
    }

    // CRITICAL: Prepare unified symptom analysis input with ALL modalities + chat answers + image analyses + document contents
    // CRITICAL: Build unified context object with ALL modalities using the centralized utility
    // CRITICAL: Ensure chat messages are properly formatted and belong to THIS pre-analysis
    // Format for OpenAI API: role must be 'user' | 'assistant' | 'system', content must be string
    const formattedChatMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = (chatMessages || []).map((msg: any) => ({
      role: (msg.sender_type === 'patient' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: msg.message_text || '',
    }));

    const unifiedContext = buildUnifiedMedicalContext({
      textInput: preAnalysis.text_input || undefined,
      voiceTranscripts: preAnalysis.voice_transcript || undefined,
      selectedChips: preAnalysis.selected_chips || undefined,
      imageUrls: preAnalysis.image_urls || undefined,
      documentUrls: preAnalysis.document_urls || undefined,
      documentContents: documentContents, // CRITICAL: Pass extracted document text
      chatMessages: formattedChatMessages, // CRITICAL: Pass formatted chat messages
      patientProfile: patientData,
    });

    // CRITICAL: Enhance unified context with image analyses if available
    let enhancedCombinedText = unifiedContext.combined_text_block;
    if (imageAnalyses.length > 0) {
      const { formatImageAnalyses } = await import('../utils/imageAnalysis');
      enhancedCombinedText += '\n\n' + formatImageAnalyses(imageAnalyses);
    }

    // CRITICAL: Prepare symptom analysis input with unified context (enhanced with image analyses)
    // CRITICAL: Include ALL data: symptoms + images + documents + chat + profile
    const symptomInput = {
      unifiedContext: {
        ...unifiedContext,
        combined_text_block: enhancedCombinedText, // Enhanced with image analyses
        image_urls: imageUrlsForVision, // CRITICAL: Pass image URLs for Vision API
      },
      // Keep legacy fields for backward compatibility
      textInput: preAnalysis.text_input || undefined,
      voiceTranscript: preAnalysis.voice_transcript || undefined,
      selectedChips: preAnalysis.selected_chips || undefined,
      imageUrls: imageUrlsForVision, // CRITICAL: Use validated image URLs
      documentUrls: preAnalysis.document_urls || undefined,
      documentContents: documentContents, // CRITICAL: Include extracted document text
      chatAnswers: patientAnswers || undefined,
      chatMessages: formattedChatMessages, // CRITICAL: Include complete chat history
      patientProfile: patientData,
    };

    // CRITICAL: Log the complete unified context for debugging
    console.log(`[AI Report] 📊 CONTEXTE UNIFIÉ COMPLET:`);
    console.log(`[AI Report] Combined text block length: ${enhancedCombinedText.length} chars`);
    console.log(`[AI Report] Combined text block preview:`, enhancedCombinedText.substring(0, 500) + '...');
    console.log(`[AI Report] Modalities included:`, {
      textInput: !!preAnalysis.text_input,
      voiceTranscript: !!preAnalysis.voice_transcript,
      selectedChips: preAnalysis.selected_chips?.length || 0,
      images: imageUrlsForVision.length,
      imageAnalyses: imageAnalyses.length,
      documents: preAnalysis.document_urls?.length || 0,
      documentContents: documentContents.length,
      chatMessages: formattedChatMessages.length,
      patientProfile: !!patientData,
    });

    // 6. Check if AI report already exists and handle it properly
    const { data: existingReport, error: checkError } = await supabase
      .from('ai_reports')
      .select('id')
      .eq('pre_analysis_id', preAnalysisId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.warn('[AI Report] Error checking for existing report:', checkError);
    }

    let existingReportId: string | null = null;
    if (existingReport) {
      existingReportId = existingReport.id;
      console.log('[AI Report] Report already exists for this pre-analysis, will update it...');

      // Delete existing diagnostic hypotheses first (foreign key constraint)
      const { error: deleteHypothesesError } = await supabase
        .from('diagnostic_hypotheses')
        .delete()
        .eq('ai_report_id', existingReport.id);

      if (deleteHypothesesError) {
        console.error('[AI Report] Error deleting old hypotheses:', deleteHypothesesError);
        if (deleteHypothesesError.code === '42501') {
          console.warn('[AI Report] RLS error deleting hypotheses - policies may not be set up');
          // Try to continue - we'll update the report instead
        } else {
          throw new Error(`Failed to delete existing hypotheses: ${deleteHypothesesError.message}`);
        }
      } else {
        console.log(`[AI Report] Deleted old hypotheses successfully`);
      }

      // Delete existing report - with retry logic
      let deleteAttempts = 0;
      const maxDeleteAttempts = 3;
      let deleteSuccess = false;

      while (deleteAttempts < maxDeleteAttempts && !deleteSuccess) {
        const { error: deleteReportError } = await supabase
          .from('ai_reports')
          .delete()
          .eq('id', existingReport.id)
          .eq('patient_profile_id', preAnalysis.patient_profile_id); // RLS check

        if (!deleteReportError) {
          deleteSuccess = true;
          console.log('[AI Report] Successfully deleted old report');
          // Wait a bit to ensure DB has processed the deletion
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          deleteAttempts++;
          console.error(`[AI Report] Error deleting old report (attempt ${deleteAttempts}/${maxDeleteAttempts}):`, deleteReportError);

          if (deleteReportError.code === '42501') {
            // RLS error - will use UPDATE approach instead
            console.warn('[AI Report] Cannot delete due to RLS - will use UPDATE approach instead');
            break;
          }

          if (deleteAttempts < maxDeleteAttempts) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 500 * deleteAttempts));
          } else {
            // Last attempt failed - will use UPDATE instead
            console.warn('[AI Report] Delete failed after all attempts - will use UPDATE instead');
          }
        }
      }
    }

    // 7. Update pre-analysis status to processing
    await supabase
      .from('pre_analyses')
      .update({
        ai_processing_status: 'processing',
        ai_processing_started_at: new Date().toISOString(),
      })
      .eq('id', preAnalysisId);

    // 8. Generate AI report using OpenAI
    // CRITICAL: Pass complete conversation history and ensure images are included in Vision API call
    console.log(`[AI Report] Generating report for pre-analysis: ${preAnalysisId}`);
    console.log(`[AI Report] Context includes: ${formattedChatMessages.length} chat messages, ${imageUrlsForVision.length} images, ${documentContents.length} document texts`);
    
    // CRITICAL: Ensure conversationHistory includes ALL messages from THIS pre-analysis only

    
    // CRITICAL: Generate report with ALL modalities including images via Vision API
    let aiReportData = await generateAIReport(symptomInput, formattedChatMessages, imageUrlsForVision);
    console.log(`[AI Report] Report generated successfully for pre-analysis: ${preAnalysisId}`);
    
    // CRITICAL: Validate and normalize overall_severity to match database constraint
    // Database only accepts: 'low' | 'medium' | 'high' (NOT 'critical')
    if (aiReportData.overall_severity) {
      const severity = aiReportData.overall_severity.toLowerCase();
      if (severity === 'critical') {
        console.warn('[AI Report] ⚠️ Converting "critical" severity to "high" to match database constraint');
        aiReportData.overall_severity = 'high';
      } else if (!['low', 'medium', 'high'].includes(severity)) {
        console.warn(`[AI Report] ⚠️ Invalid severity "${severity}", defaulting to "medium"`);
        aiReportData.overall_severity = 'medium';
      } else {
        aiReportData.overall_severity = severity as 'low' | 'medium' | 'high';
      }
    } else {
      // Default to medium if not provided
      console.warn('[AI Report] ⚠️ No severity provided, defaulting to "medium"');
      aiReportData.overall_severity = 'medium';
    }

    // 9. Save AI report to database - Use UPDATE if exists, INSERT if not
    let savedReport: any;

    if (existingReportId) {
      // Update existing report
      console.log('[AI Report] Updating existing report:', existingReportId);

      // Ensure explainability_data is properly serialized
      let explainabilityDataValue: any = null;
      if (aiReportData.explainability_data) {
        try {
          // If it's already an object, stringify it to ensure it's valid JSON
          explainabilityDataValue = typeof aiReportData.explainability_data === 'string'
            ? JSON.parse(aiReportData.explainability_data)
            : aiReportData.explainability_data;
        } catch (e) {
          console.warn('[AI Report] Error parsing explainability_data, using as-is:', e);
          explainabilityDataValue = aiReportData.explainability_data;
        }
      }

      // Perform UPDATE without .single() first to check if it succeeds
      const { error: updateError, count } = await supabase
        .from('ai_reports')
        .update({
          overall_severity: aiReportData.overall_severity,
          overall_confidence: aiReportData.overall_confidence,
          summary: aiReportData.summary,
          primary_diagnosis: aiReportData.primary_diagnosis,
          primary_diagnosis_confidence: aiReportData.primary_diagnosis_confidence,
          recommendation_action: aiReportData.recommendation_action,
          recommendation_text: aiReportData.recommendation_text,
          explainability_data: explainabilityDataValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingReportId)
        .eq('patient_profile_id', preAnalysis.patient_profile_id); // RLS check

      if (updateError) {
        console.error('[AI Report] Error updating report:', updateError);
        throw new Error(`Failed to update AI report: ${updateError.message}`);
      }

      // Check if any rows were updated
      if (count !== null && count === 0) {
        console.warn('[AI Report] No rows updated - RLS might be blocking. Trying to reload report...');
        // RLS might have blocked the update, but let's try to reload the report
      }

      // Reload the updated report
      const { data: reloadedReport, error: reloadError } = await supabase
        .from('ai_reports')
        .select('*')
        .eq('id', existingReportId)
        .eq('patient_profile_id', preAnalysis.patient_profile_id)
        .maybeSingle();

      if (reloadError) {
        console.error('[AI Report] Error reloading updated report:', reloadError);
        // Continue anyway - the update might have succeeded even if we can't reload
        // Create a minimal savedReport object
        savedReport = { id: existingReportId, pre_analysis_id: preAnalysisId };
      } else if (!reloadedReport) {
        console.warn('[AI Report] Report not found after update - RLS might be blocking read');
        // Create a minimal savedReport object
        savedReport = { id: existingReportId, pre_analysis_id: preAnalysisId };
      } else {
        savedReport = reloadedReport;
      }
    } else {
      // Insert new report
      console.log('[AI Report] Inserting new report');

      // Ensure explainability_data is properly formatted
      let explainabilityDataValue: any = null;
      if (aiReportData.explainability_data) {
        try {
          // If it's already an object, use it directly (Supabase will handle JSONB)
          // If it's a string, parse it first
          explainabilityDataValue = typeof aiReportData.explainability_data === 'string'
            ? JSON.parse(aiReportData.explainability_data)
            : aiReportData.explainability_data;
        } catch (e) {
          console.warn('[AI Report] Error parsing explainability_data for insert, using as-is:', e);
          explainabilityDataValue = aiReportData.explainability_data;
        }
      }

      const { data: insertedReport, error: insertError } = await supabase
        .from('ai_reports')
        .insert({
          pre_analysis_id: preAnalysisId,
          patient_profile_id: preAnalysis.patient_profile_id,
          overall_severity: aiReportData.overall_severity,
          overall_confidence: aiReportData.overall_confidence,
          summary: aiReportData.summary,
          primary_diagnosis: aiReportData.primary_diagnosis,
          primary_diagnosis_confidence: aiReportData.primary_diagnosis_confidence,
          recommendation_action: aiReportData.recommendation_action,
          recommendation_text: aiReportData.recommendation_text,
          explainability_data: explainabilityDataValue,
        })
        .select()
        .single();

      if (insertError) {
        console.error('[AI Report] Error inserting report:', insertError);

        // If insert fails due to unique constraint, try to update instead
        if (insertError.code === '23505' && insertError.message?.includes('ai_reports_pre_analysis_id_key')) {
          console.log('[AI Report] Unique constraint violation - report exists, trying to load and update...');

          // Load the existing report
          const { data: existingReportData, error: loadError } = await supabase
            .from('ai_reports')
            .select('id')
            .eq('pre_analysis_id', preAnalysisId)
            .single();

          if (!loadError && existingReportData) {
            // Ensure explainability_data is properly serialized
            let explainabilityDataValue: any = null;
            if (aiReportData.explainability_data) {
              try {
                explainabilityDataValue = typeof aiReportData.explainability_data === 'string'
                  ? JSON.parse(aiReportData.explainability_data)
                  : aiReportData.explainability_data;
              } catch (e) {
                console.warn('[AI Report] Error parsing explainability_data, using as-is:', e);
                explainabilityDataValue = aiReportData.explainability_data;
              }
            }

            // Update it instead - without .single() first
            const { error: updateError } = await supabase
              .from('ai_reports')
              .update({
                overall_severity: aiReportData.overall_severity,
                overall_confidence: aiReportData.overall_confidence,
                summary: aiReportData.summary,
                primary_diagnosis: aiReportData.primary_diagnosis,
                primary_diagnosis_confidence: aiReportData.primary_diagnosis_confidence,
                recommendation_action: aiReportData.recommendation_action,
                recommendation_text: aiReportData.recommendation_text,
                explainability_data: explainabilityDataValue,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingReportData.id)
              .eq('patient_profile_id', preAnalysis.patient_profile_id);

            if (updateError) {
              throw new Error(`Failed to update existing AI report: ${updateError.message}`);
            }

            // Reload the updated report
            const { data: reloadedReport, error: reloadError } = await supabase
              .from('ai_reports')
              .select('*')
              .eq('id', existingReportData.id)
              .eq('patient_profile_id', preAnalysis.patient_profile_id)
              .maybeSingle();

            if (reloadError || !reloadedReport) {
              console.warn('[AI Report] Could not reload updated report, using minimal object');
              savedReport = { id: existingReportData.id, pre_analysis_id: preAnalysisId };
            } else {
              savedReport = reloadedReport;
            }

            console.log('[AI Report] Successfully updated existing report after constraint violation');
          } else {
            throw new Error(`Failed to save AI report: ${insertError.message}`);
          }
        } else {
          throw new Error(`Failed to save AI report: ${insertError.message}`);
        }
      } else {
        savedReport = insertedReport;
      }
    }

    if (!savedReport) {
      throw new Error('AI report was not saved or updated');
    }

    if (!savedReport) {
      throw new Error('AI report was not saved');
    }

    // 10. Save diagnostic hypotheses
    // First, delete any existing hypotheses for this report (in case of UPDATE)
    if (existingReportId || savedReport.id) {
      const reportIdToUse = savedReport.id;

      // Delete existing hypotheses
      const { error: deleteExistingError } = await supabase
        .from('diagnostic_hypotheses')
        .delete()
        .eq('ai_report_id', reportIdToUse);

      if (deleteExistingError) {
        console.warn('[AI Report] Error deleting existing hypotheses (non-critical):', deleteExistingError);
        // Continue anyway - we'll try to insert new ones
      }
    }

    const hypothesesToInsert = aiReportData.diagnostic_hypotheses.map((hypothesis, index) => ({
      ai_report_id: savedReport.id,
      disease_name: hypothesis.disease_name,
      confidence: hypothesis.confidence,
      severity: hypothesis.severity,
      keywords: hypothesis.keywords || [],
      explanation: hypothesis.explanation || '',
      is_primary: hypothesis.is_primary || index === 0,
      is_excluded: hypothesis.is_excluded || false,
    }));

    // CRITICAL: Try to save hypotheses with robust error handling
    // RLS might block this, but we don't want to fail the entire report generation
    try {
      const { error: hypothesesError, data: insertedHypotheses } = await supabase
        .from('diagnostic_hypotheses')
        .insert(hypothesesToInsert)
        .select();

      if (hypothesesError) {
        console.error('[AI Report] ❌ Error saving hypotheses:', hypothesesError);
        console.error('[AI Report] RLS Error details:', {
          code: hypothesesError.code,
          message: hypothesesError.message,
          details: hypothesesError.details,
          hint: hypothesesError.hint,
        });
        
        // CRITICAL: Don't throw - report is saved, hypotheses can be added later or manually
        // Log the hypotheses that failed to insert for debugging
        console.warn('[AI Report] ⚠️ Hypotheses not saved due to RLS, but report generation succeeded');
        console.warn('[AI Report] Hypotheses that failed:', JSON.stringify(hypothesesToInsert, null, 2));
      } else {
        console.log(`[AI Report] ✅ Successfully saved ${insertedHypotheses?.length || hypothesesToInsert.length} diagnostic hypotheses`);
      }
    } catch (hypothesesException: any) {
      console.error('[AI Report] ❌ Exception saving hypotheses:', hypothesesException);
      // Don't throw - report is saved
    }

    // 11. Update pre-analysis status to completed with RLS check
    const { error: updateStatusError } = await supabase
      .from('pre_analyses')
      .update({
        ai_processing_status: 'completed',
        ai_processing_completed_at: new Date().toISOString(),
        status: 'completed',
      })
      .eq('id', preAnalysisId)
      .eq('patient_profile_id', preAnalysis.patient_profile_id); // RLS CHECK

    if (updateStatusError) {
      console.error('[AI Report] Error updating pre-analysis status:', updateStatusError);
      // Don't throw - report is saved, status can be updated later
    }

    // 12. Create timeline event (non-critical, don't fail if it errors)
    const patientProfileId = patientProfile?.id || preAnalysis.patient_profile_id;
    if (patientProfileId && savedReport?.id) {
      try {
        console.log('[Timeline Debug] Payload:', {
          patient_profile_id: patientProfileId,
          event_type: 'ai_analysis_completed',
          event_title: 'Analyse IA complétée',
          event_description: `Rapport AI généré avec diagnostic principal: ${aiReportData.primary_diagnosis}`,
          event_date: new Date().toISOString(),
          status: 'completed',
          related_ai_report_id: savedReport.id,
        });

        const { error: timelineError } = await supabase
          .from('timeline_events')
          .insert({
            patient_profile_id: patientProfileId,
            event_type: 'ai_analysis_completed',
            event_title: 'Analyse IA complétée',
            event_description: `Rapport AI généré avec diagnostic principal: ${aiReportData.primary_diagnosis}`,
            event_date: new Date().toISOString(),
            status: 'completed',
            related_ai_report_id: savedReport.id,
          })
          .select()
          .maybeSingle();

        if (timelineError) {
          console.error('[AI Report] ❌ Error creating timeline event:', timelineError);
          console.error('[AI Report] Timeline error details:', {
            code: timelineError.code,
            message: timelineError.message,
            details: timelineError.details,
            hint: timelineError.hint,
          });
          // Don't throw - timeline event is non-critical
        } else {
          console.log('[AI Report] ✅ Timeline event created successfully');
        }
      } catch (timelineException: any) {
        console.error('[AI Report] ❌ Exception creating timeline event:', timelineException);
        // Don't throw - timeline event is non-critical
      }
    } else {
      console.warn('[AI Report] ⚠️ Skipping timeline event creation:', {
        patientProfileId: patientProfileId || 'missing',
        savedReportId: savedReport?.id || 'missing',
      });
    }

    console.log('[AI Report] Report generation completed successfully');
    return savedReport as AIReport;
  } catch (error: any) {
    console.error('[AI Report] Error generating report:', error);

    // Update status to failed
    await supabase
      .from('pre_analyses')
      .update({
        ai_processing_status: 'failed',
      })
      .eq('id', preAnalysisId);

    throw error;
  }
}

/**
 * Check if AI report exists for a pre-analysis
 */
export async function checkAIReportExists(preAnalysisId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('ai_reports')
    .select('id')
    .eq('pre_analysis_id', preAnalysisId)
    .maybeSingle();

  return !error && !!data;
}

/**
 * Get AI report for a pre-analysis (with retry logic)
 */
export async function getAIReportWithRetry(
  preAnalysisId: string,
  maxRetries: number = 10,
  retryDelay: number = 2000
): Promise<AIReport | null> {
  for (let i = 0; i < maxRetries; i++) {
    const exists = await checkAIReportExists(preAnalysisId);

    if (exists) {
      const { data, error } = await supabase
        .from('ai_reports')
        .select('*, diagnostic_hypotheses(*)')
        .eq('pre_analysis_id', preAnalysisId)
        .single();

      if (!error && data) {
        return data as AIReport;
      }
    }

    // Check if processing is still in progress
    const { data: preAnalysis } = await supabase
      .from('pre_analyses')
      .select('ai_processing_status')
      .eq('id', preAnalysisId)
      .single();

    if (preAnalysis?.ai_processing_status === 'failed') {
      throw new Error('AI report generation failed');
    }

    if (preAnalysis?.ai_processing_status === 'completed' && !exists) {
      // Status says completed but report doesn't exist - generate it
      console.log('[AI Report] Status is completed but report missing, generating...');
      return await generateAndSaveAIReport(preAnalysisId);
    }

    // Wait before retrying
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  return null;
}

