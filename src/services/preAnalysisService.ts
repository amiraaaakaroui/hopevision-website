/**
 * Pre-Analysis Service
 * Handles all pre-analysis business logic (CRUD operations)
 * Separated from UI components for Clean Architecture
 */

import { supabase } from '../lib/supabaseClient';
import type { PreAnalysis } from '../types/database';

export interface PreAnalysisInput {
  textInput?: string;
  selectedChips?: string[];
  imageUrls?: string[];
  documentUrls?: string[];
  voiceTranscript?: string;
}

export interface CreatePreAnalysisParams {
  patientProfileId: string;
  input: PreAnalysisInput;
}

export interface UpdatePreAnalysisParams {
  preAnalysisId: string;
  patientProfileId: string;
  input: PreAnalysisInput;
}

/**
 * Create a new pre-analysis
 */
export async function createPreAnalysis({
  patientProfileId,
  input,
}: CreatePreAnalysisParams): Promise<PreAnalysis> {
  const { data: preAnalysis, error } = await supabase
    .from('pre_analyses')
    .insert({
      patient_profile_id: patientProfileId,
      status: 'draft',
      text_input: input.textInput?.trim() || undefined,
      selected_chips: input.selectedChips && input.selectedChips.length > 0 ? input.selectedChips : undefined,
      image_urls: input.imageUrls && input.imageUrls.length > 0 ? input.imageUrls : undefined,
      document_urls: input.documentUrls && input.documentUrls.length > 0 ? input.documentUrls : undefined,
      voice_transcript: input.voiceTranscript || undefined,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur lors de la création de la pré-analyse: ${error.message}`);
  }

  if (!preAnalysis) {
    throw new Error('Erreur lors de la création de la pré-analyse');
  }

  return preAnalysis as PreAnalysis;
}

/**
 * Update an existing pre-analysis
 */
export async function updatePreAnalysis({
  preAnalysisId,
  patientProfileId,
  input,
}: UpdatePreAnalysisParams): Promise<void> {
  const { error } = await supabase
    .from('pre_analyses')
    .update({
      text_input: input.textInput?.trim() || undefined,
      selected_chips: input.selectedChips && input.selectedChips.length > 0 ? input.selectedChips : undefined,
      image_urls: input.imageUrls && input.imageUrls.length > 0 ? input.imageUrls : undefined,
      document_urls: input.documentUrls && input.documentUrls.length > 0 ? input.documentUrls : undefined,
      voice_transcript: input.voiceTranscript || undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', preAnalysisId)
    .eq('patient_profile_id', patientProfileId); // RLS CHECK

  if (error) {
    throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
  }
}

/**
 * Create or update pre-analysis (upsert logic)
 */
export async function savePreAnalysis({
  patientProfileId,
  input,
  existingPreAnalysisId,
}: CreatePreAnalysisParams & { existingPreAnalysisId?: string | null }): Promise<string> {
  if (existingPreAnalysisId) {
    await updatePreAnalysis({
      preAnalysisId: existingPreAnalysisId,
      patientProfileId,
      input,
    });
    return existingPreAnalysisId;
  } else {
    const preAnalysis = await createPreAnalysis({ patientProfileId, input });
    return preAnalysis.id;
  }
}

/**
 * Submit pre-analysis (change status to 'submitted')
 * CRITICAL: Do NOT modify text_input - keep it clean to prevent data leakage
 * The chat history is loaded separately via pre_analysis_id in aiReportService
 */
export async function submitPreAnalysis(
  preAnalysisId: string,
  patientProfileId: string
): Promise<void> {
  // CRITICAL: Verify isolation before update
  const { data: existingPreAnalysis, error: checkError } = await supabase
    .from('pre_analyses')
    .select('id, patient_profile_id')
    .eq('id', preAnalysisId)
    .single();

  if (checkError) {
    throw new Error(`Pré-analyse non trouvée: ${checkError.message}`);
  }

  if (!existingPreAnalysis) {
    throw new Error('Pré-analyse non trouvée');
  }

  // CRITICAL: Verify the pre-analysis belongs to the correct patient
  if (existingPreAnalysis.patient_profile_id !== patientProfileId) {
    throw new Error('Violation d\'isolation: La pré-analyse n\'appartient pas à ce patient');
  }

  // CRITICAL: Verify the ID matches
  if (existingPreAnalysis.id !== preAnalysisId) {
    throw new Error('Violation d\'isolation: L\'ID de la pré-analyse ne correspond pas');
  }

  // CRITICAL: Update status WITHOUT modifying text_input
  // text_input must remain clean (only initial symptoms)
  // Chat history is loaded separately via pre_analysis_id
  const { error } = await supabase
    .from('pre_analyses')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      ai_processing_status: 'pending',
      // CRITICAL: Do NOT update text_input - keep it clean
      // text_input should only contain initial symptoms, not chat content
    })
    .eq('id', preAnalysisId)
    .eq('patient_profile_id', patientProfileId); // RLS CHECK + Isolation verification

  if (error) {
    throw new Error(`Erreur lors de la soumission: ${error.message}. Code: ${error.code}`);
  }
}

/**
 * Get pre-analysis by ID
 */
export async function getPreAnalysis(preAnalysisId: string): Promise<PreAnalysis | null> {
  const { data, error } = await supabase
    .from('pre_analyses')
    .select('*')
    .eq('id', preAnalysisId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Erreur lors du chargement: ${error.message}`);
  }

  return data as PreAnalysis;
}

/**
 * Get pre-analysis with patient profile data
 */
export async function getPreAnalysisWithProfile(preAnalysisId: string) {
  const { data, error } = await supabase
    .from('pre_analyses')
    .select('*, patient_profiles(*, profiles(*))')
    .eq('id', preAnalysisId)
    .single();

  if (error) {
    throw new Error(`Erreur lors du chargement: ${error.message}`);
  }

  return data;
}

/**
 * Get recent pre-analyses for a patient
 * Returns analyses ordered by creation date (most recent first)
 */
export async function getRecentPreAnalyses(
  patientProfileId: string,
  limit: number = 10
): Promise<PreAnalysis[]> {
  const { data, error } = await supabase
    .from('pre_analyses')
    .select('*')
    .eq('patient_profile_id', patientProfileId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Erreur lors du chargement des analyses: ${error.message}`);
  }

  return (data || []) as PreAnalysis[];
}

/**
 * Get pre-analysis with AI report data
 */
export async function getPreAnalysisWithReport(preAnalysisId: string) {
  const { data, error } = await supabase
    .from('pre_analyses')
    .select(`
      *,
      ai_reports (
        id,
        overall_severity,
        overall_confidence,
        primary_diagnosis,
        created_at
      )
    `)
    .eq('id', preAnalysisId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Erreur lors du chargement: ${error.message}`);
  }

  return data;
}

