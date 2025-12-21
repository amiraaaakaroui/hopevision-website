/**
 * Patient Data Service
 * Handles loading patient-related data (reports, pre-analyses, etc.)
 * Separated from UI components for Clean Architecture
 */

import { supabase } from '../lib/supabaseClient';
import type { AIReport, DiagnosticHypothesis, PreAnalysis } from '../types/database';
import { generateAndSaveAIReport } from './aiReportService';

export interface ResultItem {
  disease: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  keywords: string[];
  explanation: string;
}

export interface LoadAIReportParams {
  preAnalysisId: string;
  maxRetries?: number;
  retryDelay?: number;
}

export interface LoadAIReportResult {
  report: AIReport | null;
  hypotheses: DiagnosticHypothesis[];
  results: ResultItem[];
}

/**
 * Check if AI report exists for a pre-analysis
 */
async function checkReportExists(preAnalysisId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('ai_reports')
    .select('id')
    .eq('pre_analysis_id', preAnalysisId)
    .maybeSingle();

  return !error && !!data;
}

/**
 * Check pre-analysis status
 */
async function checkPreAnalysisStatus(preAnalysisId: string): Promise<{
  status: string;
  ai_processing_status: string | null;
} | null> {
  const { data, error } = await supabase
    .from('pre_analyses')
    .select('status, ai_processing_status')
    .eq('id', preAnalysisId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Wait with exponential backoff
 */
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(retryCount: number, maxDelay: number = 10000): number {
  return Math.min(1000 * Math.pow(2, retryCount), maxDelay);
}

/**
 * Load AI report with automatic generation if needed
 */
export async function loadAIReportWithGeneration({
  preAnalysisId,
  maxRetries = 5,
  retryDelay = 2000,
}: LoadAIReportParams): Promise<LoadAIReportResult> {
  let retryCount = 0;
  let reportExists = false;

  while (retryCount < maxRetries && !reportExists) {
    // Check if report exists
    reportExists = await checkReportExists(preAnalysisId);

    if (reportExists) {
      break;
    }

    // Check pre-analysis status
    const preAnalysisStatus = await checkPreAnalysisStatus(preAnalysisId);

    if (!preAnalysisStatus) {
      throw new Error('Pré-analyse non trouvée');
    }

    if (preAnalysisStatus.ai_processing_status === 'processing') {
      // Still processing, wait and retry
      const delay = calculateBackoffDelay(retryCount);
      await wait(delay);
      retryCount++;
      continue;
    }

    if (
      preAnalysisStatus.status === 'submitted' ||
      preAnalysisStatus.status === 'draft' ||
      preAnalysisStatus.ai_processing_status === 'pending'
    ) {
      // Generate AI report
      try {
        await generateAndSaveAIReport(preAnalysisId);
        await wait(500); // Wait for DB consistency
        reportExists = true;
        break;
      } catch (error: any) {
        console.error('[PatientDataService] Error generating report:', error);

        // If it's a processing error, wait and retry
        if (error.message?.includes('processing') && retryCount < maxRetries - 1) {
          const delay = calculateBackoffDelay(retryCount);
          await wait(delay);
          retryCount++;
          continue;
        }

        throw error;
      }
    } else if (preAnalysisStatus.ai_processing_status === 'failed') {
      throw new Error('La génération du rapport AI a échoué');
    }

    retryCount++;
    if (retryCount < maxRetries) {
      const delay = calculateBackoffDelay(retryCount);
      await wait(delay);
    }
  }

  // Load the report
  return await loadAIReport(preAnalysisId);
}

/**
 * Load AI report and format results
 */
export async function loadAIReport(preAnalysisId: string): Promise<LoadAIReportResult> {
  const { data: report, error: reportError } = await supabase
    .from('ai_reports')
    .select(`
      *,
      diagnostic_hypotheses (
        *
      )
    `)
    .eq('pre_analysis_id', preAnalysisId)
    .single();

  if (reportError) {
    // Report doesn't exist yet
    return {
      report: null,
      hypotheses: [],
      results: [],
    };
  }

  if (!report) {
    return {
      report: null,
      hypotheses: [],
      results: [],
    };
  }

  const aiReport = report as AIReport;
  const hypotheses = (report.diagnostic_hypotheses || []) as DiagnosticHypothesis[];

  // Format hypotheses as results
  const results: ResultItem[] = hypotheses
    .filter(h => !h.is_excluded)
    .map(h => ({
      disease: h.disease_name,
      confidence: h.confidence,
      severity: h.severity || 'medium',
      keywords: h.keywords || [],
      explanation: h.explanation || 'Analyse basée sur les symptômes décrits.',
    }))
    .sort((a, b) => b.confidence - a.confidence);

  return {
    report: aiReport,
    hypotheses,
    results,
  };
}

