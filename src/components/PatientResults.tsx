import { Brain, HelpCircle, AlertCircle, CheckCircle, Info, MessageSquare, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Screen } from '../App';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { AIReport, DiagnosticHypothesis } from '../types/database';

interface Props {
  onNavigate: (screen: Screen) => void;
}

interface ResultItem {
  disease: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  keywords: string[];
  explanation: string;
}

export function PatientResults({ onNavigate }: Props) {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [preAnalysisId, setPreAnalysisId] = useState<string | null>(null);

  useEffect(() => {
    // Get pre_analysis_id from sessionStorage
    const storedId = sessionStorage.getItem('currentPreAnalysisId');
    if (storedId) {
      setPreAnalysisId(storedId);
      loadAIReportWithGeneration(storedId);
    } else {
      setLoading(false);
    }
  }, []);

  const loadAIReportWithGeneration = async (preAnalysisId: string) => {
    try {
      // FIXED: Add retry logic with exponential backoff
      const maxRetries = 5;
      let retryCount = 0;
      let reportExists = false;

      while (retryCount < maxRetries && !reportExists) {
        // Check if report exists
        const { data: existingReport, error: checkError } = await supabase
          .from('ai_reports')
          .select('id')
          .eq('pre_analysis_id', preAnalysisId)
          .maybeSingle();

        if (checkError) {
          console.error('[PatientResults] Error checking report:', checkError);
        }

        if (existingReport) {
          reportExists = true;
          break;
        }

        // Check pre-analysis status
        const { data: preAnalysis, error: preAnalysisError } = await supabase
          .from('pre_analyses')
          .select('status, ai_processing_status')
          .eq('id', preAnalysisId)
          .single();

        if (preAnalysisError) {
          console.error('[PatientResults] Error loading pre-analysis:', preAnalysisError);
          break;
        }

        if (preAnalysis) {
          if (preAnalysis.ai_processing_status === 'processing') {
            // Still processing, wait and retry
            const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s
            await new Promise(resolve => setTimeout(resolve, delay));
            retryCount++;
            continue;
          }

          if (preAnalysis.status === 'submitted' || preAnalysis.status === 'draft' || preAnalysis.ai_processing_status === 'pending') {
            // Generate AI report
            console.log('[PatientResults] Generating AI report (attempt', retryCount + 1, ')...');
            try {
              const { generateAndSaveAIReport } = await import('../services/aiReportService');
              await generateAndSaveAIReport(preAnalysisId);
              console.log('[PatientResults] AI report generated successfully');
              
              // Wait a bit for DB to be consistent
              await new Promise(resolve => setTimeout(resolve, 500));
              reportExists = true;
              break;
            } catch (error: any) {
              console.error('[PatientResults] Error generating report:', error);
              
              // If it's a processing error, wait and retry
              if (error.message?.includes('processing') && retryCount < maxRetries - 1) {
                const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
                await new Promise(resolve => setTimeout(resolve, delay));
                retryCount++;
                continue;
              }
              
              alert(`Erreur lors de la génération du rapport AI: ${error.message || 'Erreur inconnue'}`);
              setLoading(false);
              return;
            }
          } else if (preAnalysis.ai_processing_status === 'failed') {
            alert('La génération du rapport AI a échoué. Veuillez réessayer.');
            setLoading(false);
            return;
          }
        }

        retryCount++;
        if (retryCount < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      // Load the report
      await loadAIReport(preAnalysisId);
    } catch (error: any) {
      console.error('[PatientResults] Error loading report:', error);
      alert(`Erreur lors du chargement du rapport: ${error.message || 'Erreur inconnue'}`);
      setLoading(false);
    }
  };

  const loadAIReport = async (preAnalysisId: string) => {
    try {
      // Load AI report with diagnostic hypotheses
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
        // If report doesn't exist yet, it might still be processing
        console.log('AI report not found, may still be processing');
        setLoading(false);
        return;
      }

      if (report) {
        setAiReport(report as AIReport);
        
        // Format hypotheses as results
        const hypotheses = (report.diagnostic_hypotheses || []) as DiagnosticHypothesis[];
        const formattedResults: ResultItem[] = hypotheses
          .filter(h => !h.is_excluded)
          .map(h => ({
            disease: h.disease_name,
            confidence: h.confidence,
            severity: h.severity || 'medium',
            keywords: h.keywords || [],
            explanation: h.explanation || 'Analyse basée sur les symptômes décrits.'
          }))
          .sort((a, b) => b.confidence - a.confidence);

        setResults(formattedResults);
      }
    } catch (error) {
      console.error('Error loading AI report:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-600';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high': return 'Urgence élevée';
      case 'medium': return 'Consultation recommandée';
      case 'low': return 'Surveillance';
      default: return 'Inconnu';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertCircle className="w-5 h-5" />;
      case 'medium': return <Info className="w-5 h-5" />;
      case 'low': return <CheckCircle className="w-5 h-5" />;
      default: return null;
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
            <span className="text-sm text-gray-600">Étape 4 sur 6</span>
            <span className="text-sm text-gray-600">Résultats de l'analyse IA</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-blue-600 rounded-full" style={{ width: '67%' }}></div>
          </div>
        </div>

        {/* Alert */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-yellow-900">
              <span className="font-medium">Attention :</span> Ces résultats sont une aide à la décision et ne remplacent pas un diagnostic médical. 
              Consultez un professionnel de santé pour une évaluation complète.
            </p>
          </div>
        </div>

        {/* Overall Severity */}
        {aiReport && (
          <Card className={`p-6 mb-6 border-l-4 ${
            aiReport.overall_severity === 'high' ? 'border-red-500' :
            aiReport.overall_severity === 'medium' ? 'border-yellow-500' :
            'border-green-500'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  aiReport.overall_severity === 'high' ? 'bg-red-100' :
                  aiReport.overall_severity === 'medium' ? 'bg-yellow-100' :
                  'bg-green-100'
                }`}>
                  <Info className={`w-6 h-6 ${
                    aiReport.overall_severity === 'high' ? 'text-red-600' :
                    aiReport.overall_severity === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`} />
                </div>
                <div>
                  <h3 className="text-gray-900">Niveau de gravité détecté</h3>
                  <p className="text-gray-600">
                    {aiReport.recommendation_action || 'Consultation médicale recommandée'}
                  </p>
                </div>
              </div>
              <Badge className={
                aiReport.overall_severity === 'high' ? 'bg-red-600' :
                aiReport.overall_severity === 'medium' ? 'bg-yellow-500' :
                'bg-green-600'
              }>
                {aiReport.overall_severity === 'high' ? 'Élevé' :
                 aiReport.overall_severity === 'medium' ? 'Modéré' :
                 'Faible'}
              </Badge>
            </div>
          </Card>
        )}

        {/* Results Cards */}
        {loading ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Chargement des résultats...</p>
          </Card>
        ) : results.length > 0 ? (
          <div className="space-y-4 mb-8">
            {results.map((result, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-gray-900">{result.disease}</h3>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="text-blue-600 hover:text-blue-700">
                          <HelpCircle className="w-5 h-5" />
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Pourquoi ce diagnostic ?</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-2">Explication de l'IA :</p>
                            <p className="text-gray-900">{result.explanation}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-2">Mots-clés détectés :</p>
                            <div className="flex flex-wrap gap-2">
                              {result.keywords.map((keyword, i) => (
                                <Badge key={i} variant="outline" className="bg-blue-50">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Note :</span> L'analyse se base sur les symptômes décrits, 
                              l'historique médical et des modèles entraînés sur des millions de cas cliniques.
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${getSeverityColor(result.severity)} text-white`}>
                      {getSeverityIcon(result.severity)}
                      <span className="text-xs">{getSeverityLabel(result.severity)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl text-blue-600 mb-1">{result.confidence}%</div>
                  <div className="text-sm text-gray-600">Confiance</div>
                </div>
              </div>
              
              <Progress value={result.confidence} className="mb-3" />
              
              <div className="flex flex-wrap gap-2">
                {result.keywords.map((keyword, i) => (
                  <Badge key={i} variant="secondary">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center mb-8">
            <p className="text-gray-500 mb-4">Aucun résultat disponible</p>
            <p className="text-sm text-gray-400">
              L'analyse IA est peut-être encore en cours de traitement.
            </p>
          </Card>
        )}

        {/* Info Box */}
        <Card className="p-6 bg-blue-50 border-blue-200 mb-6">
          <div className="flex items-start gap-3">
            <Brain className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="text-gray-900 mb-2">Comment fonctionne l'analyse IA ?</h3>
              <p className="text-gray-700 mb-3">
                Notre intelligence artificielle analyse vos symptômes en croisant plusieurs sources de données :
              </p>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Analyse sémantique de votre description textuelle</li>
                <li>• Détection de patterns vocaux (essoufflement, hésitation)</li>
                <li>• Analyse d'images médicales via deep learning</li>
                <li>• Comparaison avec des millions de cas cliniques similaires</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 mt-8">
          <Button 
            variant="outline"
            onClick={() => onNavigate('patient-chat-precision')}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Retour aux questions
          </Button>
          <Button 
            variant="outline"
            onClick={() => onNavigate('patient-timeline')}
          >
            <Clock className="w-4 h-4 mr-2" />
            Voir ma timeline
          </Button>
          <Button 
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              if (preAnalysisId) {
                sessionStorage.setItem('currentPreAnalysisId', preAnalysisId);
              }
              onNavigate('patient-detailed-report');
            }}
            disabled={!aiReport}
          >
            Générer un rapport détaillé
          </Button>
        </div>
      </div>
    </div>
  );
}