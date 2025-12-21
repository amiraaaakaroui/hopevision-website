/**
 * Analysis Workflow Service
 * Handles the workflow for starting new pre-analyses
 * Ensures clean state and prevents data leakage between sessions
 */

import { createPreAnalysis } from './preAnalysisService';
import type { PreAnalysisInput } from './preAnalysisService';

export interface StartNewAnalysisParams {
  patientProfileId: string;
  input?: PreAnalysisInput; // Optional initial data
}

/**
 * Start a NEW pre-analysis workflow
 * CRITICAL: This function ensures a clean state by:
 * 1. Clearing any existing pre_analysis_id from sessionStorage
 * 2. Creating a NEW pre-analysis in the database
 * 3. Storing the NEW ID in sessionStorage
 * 
 * This prevents loading old chat history when starting a new analysis.
 */
export async function startNewAnalysis({
  patientProfileId,
  input,
}: StartNewAnalysisParams): Promise<string> {
  console.log('[AnalysisWorkflow] 🆕 Starting NEW pre-analysis workflow');
  
  // CRITICAL: Clear any existing pre_analysis_id from sessionStorage
  // This ensures we don't reuse old IDs
  const oldPreAnalysisId = sessionStorage.getItem('currentPreAnalysisId');
  if (oldPreAnalysisId) {
    console.log(`[AnalysisWorkflow] 🧹 Clearing old pre_analysis_id from sessionStorage: ${oldPreAnalysisId}`);
    sessionStorage.removeItem('currentPreAnalysisId');
  }

  // CRITICAL: Create a NEW pre-analysis with minimal initial data
  // Status is 'draft' - will be updated when user submits symptoms
  const newPreAnalysis = await createPreAnalysis({
    patientProfileId,
    input: input || {
      // Empty initial data - user will fill it in PatientSymptoms
      textInput: undefined,
      selectedChips: undefined,
      imageUrls: undefined,
      documentUrls: undefined,
      voiceTranscript: undefined,
    },
  });

  console.log(`[AnalysisWorkflow] ✅ Created NEW pre-analysis with ID: ${newPreAnalysis.id}`);

  // CRITICAL: Store the NEW ID in sessionStorage
  sessionStorage.setItem('currentPreAnalysisId', newPreAnalysis.id);
  console.log(`[AnalysisWorkflow] 💾 Stored new pre_analysis_id in sessionStorage: ${newPreAnalysis.id}`);

  return newPreAnalysis.id;
}

/**
 * Clear current analysis session
 * Call this when user returns to dashboard or finishes an analysis
 */
export function clearAnalysisSession(): void {
  console.log('[AnalysisWorkflow] 🧹 Clearing analysis session');
  const preAnalysisId = sessionStorage.getItem('currentPreAnalysisId');
  if (preAnalysisId) {
    console.log(`[AnalysisWorkflow] Removing pre_analysis_id from sessionStorage: ${preAnalysisId}`);
    sessionStorage.removeItem('currentPreAnalysisId');
  }
}

/**
 * Get current pre-analysis ID from sessionStorage
 * Returns null if no active analysis
 */
export function getCurrentPreAnalysisId(): string | null {
  return sessionStorage.getItem('currentPreAnalysisId');
}

