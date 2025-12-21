import { Brain, FileText, AlertCircle, Info, CheckCircle2, Clock, TrendingUp, CalendarCheck, Home, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Screen } from '../App';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import type { AIReport, DiagnosticHypothesis, PreAnalysis } from '../types/database';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { clearAnalysisSession } from '../services/analysisWorkflowService';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function PatientDetailedReport({ onNavigate }: Props) {
  const { currentProfile, isPatient } = useAuth();
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [preAnalysis, setPreAnalysis] = useState<PreAnalysis | null>(null);
  const [hypotheses, setHypotheses] = useState<DiagnosticHypothesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preAnalysisId, setPreAnalysisId] = useState<string | null>(null);
  // Cache key: preAnalysisId (used internally) - removed unused state variable
  const [showExitDialog, setShowExitDialog] = useState(false);

  const handleExit = async () => {
    console.log('[PatientDetailedReport] 🚪 Handling exit...');
    
    // CRITICAL: Force update pre-analysis status to 'completed' if report exists
    // This ensures the analysis appears in the dashboard
    if (preAnalysisId && aiReport) {
      try {
        console.log(`[PatientDetailedReport] Updating pre-analysis ${preAnalysisId} status to 'completed'...`);
        const { error: updateError } = await supabase
          .from('pre_analyses')
          .update({ 
            status: 'completed',
            ai_processing_status: 'completed',
            ai_processing_completed_at: new Date().toISOString(),
          })
          .eq('id', preAnalysisId);
        
        if (updateError) {
          console.warn('[PatientDetailedReport] ⚠️ Failed to update pre-analysis status:', updateError);
          // Continue anyway - don't block exit
        } else {
          console.log('[PatientDetailedReport] ✅ Pre-analysis status updated to completed');
        }
      } catch (error: any) {
        console.error('[PatientDetailedReport] ❌ Error updating pre-analysis:', error);
        // Continue anyway - don't block exit
      }
    }
    
    // CRITICAL: Clear sessionStorage (always, even if update failed)
    clearAnalysisSession();
    console.log('[PatientDetailedReport] ✅ Session cleared');
    
    // CRITICAL: Redirect immediately (always, even if update failed)
    onNavigate('patient-history');
    console.log('[PatientDetailedReport] ✅ Redirected to dashboard');
  };

  useEffect(() => {
    if (!isPatient) {
      setError('Vous devez être connecté en tant que patient');
      setLoading(false);
      return;
    }

    const storedId = sessionStorage.getItem('currentPreAnalysisId');
    if (storedId) {
      setPreAnalysisId(storedId);
      
      // Check if we have cached report data (sessionStorage for session, localStorage for persistence)
      const cacheKey = `ai_report_cache_${storedId}`;
      let cachedData = sessionStorage.getItem(cacheKey);
      
      // Also check localStorage for persistence across sessions
      if (!cachedData) {
        try {
          cachedData = localStorage.getItem(cacheKey);
        } catch (e) {
          console.warn('[PatientDetailedReport] localStorage not available, using sessionStorage only');
        }
      }
      
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          // Check if cache is recent (less than 30 minutes old)
          const cacheAge = Date.now() - (parsed.cachedAt || 0);
          if (cacheAge < 30 * 60 * 1000) { // 30 minutes
            console.log('[PatientDetailedReport] Using cached report data (age:', Math.round(cacheAge / 1000), 's)');
            setAiReport(parsed.aiReport);
            setPreAnalysis(parsed.preAnalysis);
            setHypotheses(parsed.hypotheses);
            setLoading(false);
            // Cache key stored in sessionStorage, no need for state
            
            // Load fresh data in background (without blocking UI)
            loadReportData(storedId, true); // silent = true means don't show loading
            
            return; // Use cached data immediately, don't block UI
          } else {
            console.log('[PatientDetailedReport] Cache expired (age:', Math.round(cacheAge / 1000), 's), reloading...');
            sessionStorage.removeItem(cacheKey);
            try {
              localStorage.removeItem(cacheKey);
            } catch (e) {
              // localStorage might not be available
            }
          }
        } catch (e) {
          console.warn('[PatientDetailedReport] Error parsing cache, reloading...', e);
          sessionStorage.removeItem(cacheKey);
          try {
            localStorage.removeItem(cacheKey);
          } catch (e) {
            // localStorage might not be available
          }
        }
      }
      
      // No cache or expired, load fresh data
      loadReportData(storedId, false);
    } else {
      // Try to find the most recent pre-analysis for this patient
      if (currentProfile?.patientProfileId) {
        loadMostRecentPreAnalysis();
      } else {
        setError('Aucune pré-analyse trouvée. Veuillez créer une nouvelle pré-analyse.');
        setLoading(false);
      }
    }
  }, [isPatient, currentProfile]);

  const loadMostRecentPreAnalysis = async () => {
    try {
      if (!currentProfile?.patientProfileId) {
        setError('Profil patient non trouvé');
        setLoading(false);
        return;
      }

      setLoading(true);
      
      // First try to find submitted/completed pre-analyses
      let { data: recentPreAnalysis, error } = await supabase
        .from('pre_analyses')
        .select('id, status')
        .eq('patient_profile_id', currentProfile.patientProfileId)
        .in('status', ['submitted', 'completed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // If not found, try to find draft pre-analyses
      if (error || !recentPreAnalysis) {
        const { data: draftPreAnalysis, error: draftError } = await supabase
          .from('pre_analyses')
          .select('id, status')
          .eq('patient_profile_id', currentProfile.patientProfileId)
          .eq('status', 'draft')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!draftError && draftPreAnalysis) {
          recentPreAnalysis = draftPreAnalysis;
          error = null;
        }
      }

      // If still not found, try any pre-analysis
      if (error || !recentPreAnalysis) {
        const { data: anyPreAnalysis, error: anyError } = await supabase
          .from('pre_analyses')
          .select('id, status')
          .eq('patient_profile_id', currentProfile.patientProfileId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!anyError && anyPreAnalysis) {
          recentPreAnalysis = anyPreAnalysis;
          error = null;
        }
      }

      if (!error && recentPreAnalysis) {
        sessionStorage.setItem('currentPreAnalysisId', recentPreAnalysis.id);
        setPreAnalysisId(recentPreAnalysis.id);
        loadReportData(recentPreAnalysis.id);
      } else {
        console.error('[PatientDetailedReport] No pre-analysis found:', error);
        setError('Aucune pré-analyse trouvée. Veuillez créer une nouvelle pré-analyse en commençant par la saisie de vos symptômes.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('[PatientDetailedReport] Error loading recent pre-analysis:', err);
      setError(`Erreur lors du chargement: ${err.message || 'Erreur inconnue'}`);
      setLoading(false);
    }
  };

  const loadReportData = async (preAnalysisId: string, silent: boolean = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      // Load pre-analysis for symptom summary
      const { data: preAnalysisData, error: preAnalysisError } = await supabase
        .from('pre_analyses')
        .select('*')
        .eq('id', preAnalysisId)
        .single();

      if (preAnalysisError) {
        console.error('[PatientDetailedReport] Error loading pre-analysis:', preAnalysisError);
        throw new Error(`Erreur lors du chargement de la pré-analyse: ${preAnalysisError.message}`);
      }

      if (!preAnalysisData) {
        throw new Error('Pré-analyse non trouvée');
      }

      setPreAnalysis(preAnalysisData as PreAnalysis);

      // CRITICAL: ai_processing_status is in pre_analyses, not ai_reports
      // We already have preAnalysisData loaded above, so we use it directly
      // Check if AI report exists (only check id, not status)
      const { data: existingReport, error: checkError } = await supabase
        .from('ai_reports')
        .select('id')
        .eq('pre_analysis_id', preAnalysisId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('[PatientDetailedReport] Error checking report:', checkError);
        // Don't throw - continue with logic based on preAnalysisData
      }

      // Only generate report if it doesn't exist and is not already processing
      // Don't regenerate if report already exists - just load it
      if (!existingReport) {
        // Check if report is already being processed
        if (preAnalysisData.ai_processing_status === 'processing') {
          console.log('[PatientDetailedReport] Report is already being generated, waiting...');
          // Will retry loading below
        } else if (preAnalysisData.status === 'submitted' || preAnalysisData.status === 'completed') {
          // Pre-analysis is submitted but no report yet - generate it
          console.log('[PatientDetailedReport] Report not found, generating...');
          
          if (!silent) {
            setLoading(true);
          }

          // Update status to processing if not already
          if (preAnalysisData.status !== 'submitted') {
            await supabase
              .from('pre_analyses')
              .update({ 
                status: 'submitted',
                ai_processing_status: 'pending'
              })
              .eq('id', preAnalysisId);
          }

          // Generate AI report
          try {
            const { generateAndSaveAIReport } = await import('../services/aiReportService');
            await generateAndSaveAIReport(preAnalysisId);
            console.log('[PatientDetailedReport] AI report generated successfully');
          } catch (genError: any) {
            console.error('[PatientDetailedReport] Error generating report:', genError);
            if (!silent) {
              setError(`Erreur lors de la génération du rapport: ${genError.message || 'Erreur inconnue'}`);
              setLoading(false);
            }
            return;
          }
        } else {
          // Pre-analysis is not submitted yet - don't generate report
          console.log('[PatientDetailedReport] Pre-analysis not submitted yet, cannot generate report');
          if (!silent) {
            setError('Veuillez d\'abord finaliser votre pré-analyse avant de générer le rapport.');
            setLoading(false);
          }
          return;
        }
      } else {
        console.log('[PatientDetailedReport] Report already exists, loading it...');
      }

      // CRITICAL: Load AI report with robust retry logic
      // Increased timeout and better error handling
      let reportData: any = null;
      let retryCount = 0;
      const maxRetries = 10; // Increased from 5 to 10
      const maxTotalTime = 60000; // 60 seconds total timeout
      const startTime = Date.now();

      while (retryCount < maxRetries && !reportData) {
        // Check if we've exceeded total timeout
        if (Date.now() - startTime > maxTotalTime) {
          console.warn(`[PatientDetailedReport] ⚠️ Timeout after ${maxTotalTime}ms, stopping retries`);
          break;
        }

        const { data, error: reportError } = await supabase
          .from('ai_reports')
          .select(`
            *,
            diagnostic_hypotheses (
              *
            )
          `)
          .eq('pre_analysis_id', preAnalysisId)
          .single();

        if (!reportError && data) {
          reportData = data;
          console.log(`[PatientDetailedReport] ✅ Report loaded successfully after ${retryCount} retries`);
          break;
        }

        if (reportError && reportError.code !== 'PGRST116') {
          console.error('[PatientDetailedReport] Error loading report:', reportError);
          throw new Error(`Erreur lors du chargement du rapport: ${reportError.message}`);
        }

        // Report not found yet, wait and retry
        if (reportError?.code === 'PGRST116') {
          retryCount++;
          if (retryCount < maxRetries && (Date.now() - startTime) < maxTotalTime) {
            // Exponential backoff with max 5s delay
            const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
            console.log(`[PatientDetailedReport] ⏳ Report not found, retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            console.warn(`[PatientDetailedReport] ⚠️ Max retries (${maxRetries}) or timeout reached, stopping`);
            break;
          }
        }
      }

      if (!reportData) {
        // CRITICAL: Check if report is stuck in processing
        const processingTime = preAnalysisData?.ai_processing_started_at 
          ? Date.now() - new Date(preAnalysisData.ai_processing_started_at).getTime()
          : 0;
        
        const isStuck = preAnalysisData?.ai_processing_status === 'processing' && processingTime > 30000;
        
        if (isStuck) {
          console.warn(`[PatientDetailedReport] ⚠️ Report stuck in processing for ${Math.round(processingTime / 1000)}s`);
          setError(`Le rapport est bloqué en génération depuis ${Math.round(processingTime / 1000)} secondes. Utilisez le bouton "Réessayer la génération" ci-dessous.`);
        } else {
          setError('Le rapport IA est en cours de génération. Veuillez patienter quelques instants. Si le problème persiste, utilisez le bouton "Réessayer la génération".');
        }
        setLoading(false);
        return;
      }

      // Set report data (always update to ensure cache is fresh)
      setAiReport(reportData as AIReport);
      const hypothesesData = (reportData.diagnostic_hypotheses || []) as DiagnosticHypothesis[];
      const sortedHypotheses = hypothesesData.filter(h => !h.is_excluded).sort((a, b) => b.confidence - a.confidence);
      setHypotheses(sortedHypotheses);
      
      // Cache the report data in both sessionStorage and localStorage for persistence
      const cacheKey = `ai_report_cache_${preAnalysisId}`;
      const cacheData = {
        aiReport: reportData,
        preAnalysis: preAnalysis,
        hypotheses: sortedHypotheses,
        cachedAt: Date.now(),
      };
      
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
        // Cache key stored in sessionStorage, no need for state
        console.log('[PatientDetailedReport] Report data cached in sessionStorage');
      } catch (cacheError) {
        console.warn('[PatientDetailedReport] Error caching report data in sessionStorage:', cacheError);
      }
      
      // Also cache in localStorage for persistence across sessions
      try {
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        console.log('[PatientDetailedReport] Report data cached in localStorage');
      } catch (cacheError) {
        console.warn('[PatientDetailedReport] Error caching report data in localStorage (non-critical):', cacheError);
        // Non-critical, continue
      }
      
      if (!silent) {
        setLoading(false);
      }
    } catch (err: any) {
      console.error('[PatientDetailedReport] Error loading report:', err);
      if (!silent) {
        setError(err.message || 'Erreur lors du chargement du rapport');
        setLoading(false);
      }
    }
  };

  const primaryHypothesis = hypotheses.find(h => h.is_primary) || hypotheses[0];
  const alternativeHypotheses = hypotheses.filter(h => !h.is_primary && !h.is_excluded);

  const getSeverityLabel = (severity?: string) => {
    switch (severity) {
      case 'high': return 'Urgence élevée';
      case 'medium': return 'Consultation recommandée';
      case 'low': return 'Surveillance';
      default: return 'Consultation recommandée';
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-gray-900">HopeVisionAI</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Étape 5 sur 6</span>
            <span className="text-sm text-gray-600">Rapport détaillé</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-blue-600 rounded-full" style={{ width: '83%' }}></div>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-blue-600" />
            <h2 className="text-gray-900">Rapport d'analyse détaillé</h2>
          </div>
          <p className="text-gray-600">
            {aiReport ? (
              <>Généré le {new Date(aiReport.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} à {new Date(aiReport.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</>
            ) : (
              <>Chargement...</>
            )}
          </p>
        </div>

        {/* Alert */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-yellow-900">
              <span className="font-medium">Rappel important :</span> Ce rapport est une aide à la décision médicale basée sur l'intelligence artificielle. 
              Il ne remplace pas l'avis d'un professionnel de santé qualifié.
            </p>
          </div>
        </div>

        {loading ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Chargement du rapport...</p>
          </Card>
        ) : error ? (
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
            <p className="text-gray-700 mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button 
                variant="outline"
                onClick={() => onNavigate('patient-results')}
              >
                Retour aux résultats
              </Button>
              {preAnalysisId && (
                <Button 
                  onClick={async () => {
                    // CRITICAL: Force regenerate report
                    setLoading(true);
                    setError(null);
                    
                    try {
                      // Reset processing status
                      await supabase
                        .from('pre_analyses')
                        .update({ 
                          ai_processing_status: 'pending',
                          ai_processing_started_at: null,
                        })
                        .eq('id', preAnalysisId);
                      
                      // Reload report data (will trigger regeneration)
                      if (preAnalysisId) {
                        await loadReportData(preAnalysisId, false);
                      }
                    } catch (retryError: any) {
                      console.error('[PatientDetailedReport] Error retrying:', retryError);
                      setError(`Erreur lors de la réessai: ${retryError.message || 'Erreur inconnue'}`);
                      setLoading(false);
                    }
                  }}
                >
                  Réessayer la génération
                </Button>
              )}
            </div>
          </Card>
        ) : !aiReport && !loading ? (
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
            <p className="text-gray-700 mb-4">
              {error || 'Aucun rapport disponible. Le rapport est peut-être en cours de génération.'}
            </p>
            {preAnalysisId && (
              <div className="flex gap-3 justify-center">
                <Button 
                  variant="outline"
                  onClick={() => onNavigate('patient-results')}
                >
                  Retour aux résultats
                </Button>
                <Button 
                  onClick={async () => {
                    if (!preAnalysisId) return;
                    setLoading(true);
                    setError(null);
                    // Reload report data
                    const storedId = sessionStorage.getItem('currentPreAnalysisId') || preAnalysisId;
                    await loadReportData(storedId);
                  }}
                >
                  Réessayer la génération
                </Button>
              </div>
            )}
          </Card>
        ) : aiReport ? (
          <div className="grid gap-6">
            {/* 1. Résumé des symptômes */}
            {preAnalysis && (
              <Card className="p-6">
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  Résumé de vos symptômes
                </h3>
                <div className="space-y-4">
                  {preAnalysis.selected_chips && preAnalysis.selected_chips.length > 0 && (
                    <div className="grid md:grid-cols-2 gap-4">
                      {preAnalysis.selected_chips.slice(0, 4).map((chip, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Symptôme {idx + 1}</p>
                          <p className="text-gray-900">{chip}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {preAnalysis.text_input && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Votre description :</span> "{preAnalysis.text_input}"
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* 2. Hypothèses diagnostiques */}
            {hypotheses.length > 0 && (
              <Card className="p-6">
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-600" />
                  Hypothèses diagnostiques par IA
                </h3>
                <div className="space-y-4">
                  {/* Hypothèse principale */}
                  {primaryHypothesis && (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-white rounded-lg border-2 border-blue-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-gray-900">{primaryHypothesis.disease_name}</h4>
                            <Badge className="bg-blue-600">Hypothèse principale</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getSeverityColor(primaryHypothesis.severity)}>
                              {getSeverityLabel(primaryHypothesis.severity)}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl text-blue-600">{primaryHypothesis.confidence}%</div>
                          <div className="text-sm text-gray-600">Confiance</div>
                        </div>
                      </div>
                      <Progress value={primaryHypothesis.confidence} className="mb-3" />
                      {primaryHypothesis.explanation && (
                        <p className="text-sm text-gray-700 mb-3">{primaryHypothesis.explanation}</p>
                      )}
                      {primaryHypothesis.keywords && primaryHypothesis.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {primaryHypothesis.keywords.map((keyword, idx) => (
                            <Badge key={idx} variant="secondary">{keyword}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hypothèses alternatives */}
                  {alternativeHypotheses.length > 0 && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h5 className="text-gray-900 mb-3">Hypothèses alternatives</h5>
                      <div className="space-y-3">
                        {alternativeHypotheses.map((hypothesis, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-gray-900">{hypothesis.disease_name}</p>
                              <Progress value={hypothesis.confidence} className="mt-1" />
                            </div>
                            <span className="text-gray-600 ml-4">{hypothesis.confidence}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* 3. Explication détaillée */}
            {aiReport.explainability_data && (
              <Card className="p-6">
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Pourquoi cette analyse ?
                </h3>
                <div className="space-y-4">
                  {aiReport.explainability_data.text_analysis && (
                    <div>
                      <h4 className="text-gray-900 mb-2">Éléments détectés par l'IA :</h4>
                      <ul className="space-y-2 text-gray-700">
                        {Array.isArray(aiReport.explainability_data.text_analysis) ? (
                          aiReport.explainability_data.text_analysis.map((item: any, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-blue-600 mt-1">•</span>
                              <span><span className="font-medium">{item.label || 'Élément'} :</span> {item.description || item}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-gray-700">{JSON.stringify(aiReport.explainability_data.text_analysis)}</li>
                        )}
                      </ul>
                    </div>
                  )}
                  {aiReport.summary && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h5 className="text-gray-900 mb-2">Résumé de l'analyse</h5>
                      <p className="text-sm text-gray-700">{aiReport.summary}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* 4. Recommandations */}
            {aiReport.recommendation_action && (
              <Card className={`p-6 border-l-4 ${
                aiReport.overall_severity === 'high' ? 'border-red-500' :
                aiReport.overall_severity === 'medium' ? 'border-yellow-500' :
                'border-green-500'
              }`}>
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className={`w-5 h-5 ${
                    aiReport.overall_severity === 'high' ? 'text-red-600' :
                    aiReport.overall_severity === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`} />
                  Recommandations
                </h3>
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${
                    aiReport.overall_severity === 'high' ? 'bg-red-50' :
                    aiReport.overall_severity === 'medium' ? 'bg-yellow-50' :
                    'bg-green-50'
                  }`}>
                    <h4 className="text-gray-900 mb-2 flex items-center gap-2">
                      <Clock className={`w-5 h-5 ${
                        aiReport.overall_severity === 'high' ? 'text-red-600' :
                        aiReport.overall_severity === 'medium' ? 'text-yellow-600' :
                        'text-green-600'
                      }`} />
                      Action recommandée
                    </h4>
                    <p className="text-gray-700 mb-3">
                      <span className="font-medium">{aiReport.recommendation_action}</span>
                    </p>
                    {aiReport.recommendation_text && (
                      <p className="text-sm text-gray-700">{aiReport.recommendation_text}</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-gray-900 mb-3">En attendant la consultation :</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      {/* Actions recommandées - dynamiques depuis explainability_data */}
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <h5 className="text-green-900 mb-1 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          À faire
                        </h5>
                        {aiReport.explainability_data?.recommended_actions && 
                         Array.isArray(aiReport.explainability_data.recommended_actions) &&
                         aiReport.explainability_data.recommended_actions.length > 0 ? (
                          <ul className="text-sm text-gray-700 space-y-1">
                            {aiReport.explainability_data.recommended_actions.map((action: string, idx: number) => (
                              <li key={idx}>• {action}</li>
                            ))}
                          </ul>
                        ) : (
                          // Fallback si pas d'actions dynamiques
                          <ul className="text-sm text-gray-700 space-y-1">
                            <li>• Repos et hydratation (2L/jour minimum)</li>
                            <li>• Surveiller la température</li>
                            <li>• Aérer régulièrement votre chambre</li>
                            <li>• Paracétamol si fièvre &gt;38.5°C</li>
                          </ul>
                        )}
                      </div>
                      {/* Signes d'alerte - dynamiques depuis explainability_data */}
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <h5 className="text-red-900 mb-1 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Signes d'alerte
                        </h5>
                        <p className="text-sm text-gray-700 mb-1">Consultez en urgence si :</p>
                        {aiReport.explainability_data?.warning_signs && 
                         Array.isArray(aiReport.explainability_data.warning_signs) &&
                         aiReport.explainability_data.warning_signs.length > 0 ? (
                          <ul className="text-sm text-gray-700 space-y-1">
                            {aiReport.explainability_data.warning_signs.map((sign: string, idx: number) => (
                              <li key={idx}>• {sign}</li>
                            ))}
                          </ul>
                        ) : (
                          // Fallback si pas de signes dynamiques
                          <ul className="text-sm text-gray-700 space-y-1">
                            <li>• Difficulté respiratoire importante</li>
                            <li>• Fièvre &gt;39.5°C persistante</li>
                            <li>• Douleur thoracique</li>
                            <li>• Confusion, malaise</li>
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* 5. Prochaines étapes */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="text-gray-900 mb-3">Prochaines étapes</h3>
              <p className="text-gray-700 mb-4">
                Nous vous recommandons de partager ce rapport avec un médecin. Vous pouvez dès maintenant 
                consulter notre réseau de médecins disponibles et prendre rendez-vous.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Info className="w-4 h-4" />
                <span>Ce rapport sera automatiquement partagé avec le médecin que vous consulterez</span>
              </div>
            </Card>
          </div>
        ) : (
          null
        )}

        {/* Action Bar - Réserver ou Quitter */}
        <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Option A: Prendre Rendez-vous (Primaire) */}
            <Button 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              size="lg"
              onClick={() => {
                if (preAnalysisId) {
                  sessionStorage.setItem('currentPreAnalysisId', preAnalysisId);
                }
                // Navigate to booking - adjust screen name if needed
                onNavigate('booking-service-selection');
              }}
              disabled={!aiReport}
            >
              <CalendarCheck className="w-5 h-5 mr-2" />
              Prendre Rendez-vous
            </Button>

            {/* Option B: Enregistrer et Quitter (Secondaire) */}
            <Button 
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => {
                // CRITICAL: Check severity before allowing exit
                if (aiReport?.overall_severity === 'high') {
                  // Show warning dialog for high severity
                  setShowExitDialog(true);
                } else {
                  // Safe to exit
                  handleExit();
                }
              }}
            >
              <Home className="w-5 h-5 mr-2" />
              Enregistrer et Quitter
            </Button>
          </div>
        </div>

        {/* Alert Dialog for High Severity */}
        <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <AlertDialogTitle>Attention : Urgence Potentielle</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-base">
                Votre analyse suggère une urgence potentielle. Nous vous recommandons vivement de voir un médecin rapidement.
                <br /><br />
                Voulez-vous vraiment quitter sans réserver un rendez-vous ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  // CRITICAL: When user clicks "Quitter quand même", call handleExit
                  console.log('[PatientDetailedReport] User chose to quit anyway (high severity)');
                  handleExit();
                }}
              >
                Quitter quand même
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  setShowExitDialog(false);
                  if (preAnalysisId) {
                    sessionStorage.setItem('currentPreAnalysisId', preAnalysisId);
                  }
                  onNavigate('booking-service-selection');
                }}
              >
                Prendre RDV maintenant
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}