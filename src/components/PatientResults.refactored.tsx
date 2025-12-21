/**
 * PatientResults Component - REFACTORED VERSION
 * Clean Architecture: UI only, all business logic in services
 */

import { Brain, HelpCircle, AlertCircle, CheckCircle, Info, MessageSquare, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Screen } from '../App';
import { useEffect, useState } from 'react';
import { loadAIReportWithGeneration } from '../services/patientDataService';
import type { AIReport } from '../types/database';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedId = sessionStorage.getItem('currentPreAnalysisId');
    if (storedId) {
      setPreAnalysisId(storedId);
      loadReportData(storedId);
    } else {
      setLoading(false);
    }
  }, []);

  const loadReportData = async (preAnalysisId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Use service for loading report with automatic generation
      const { report, results: formattedResults } = await loadAIReportWithGeneration({
        preAnalysisId,
        maxRetries: 5,
      });

      setAiReport(report);
      setResults(formattedResults);
    } catch (err: any) {
      console.error('[PatientResults] Error loading report:', err);
      setError(err.message || 'Erreur lors du chargement du rapport');
    } finally {
      setLoading(false);
    }
  };

  // Utility functions (UI helpers - can stay in component or move to utils)
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

  // UI rendering (no business logic)
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

        {/* Error Display */}
        {error && (
          <Card className="p-6 mb-6 border-red-200 bg-red-50">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-red-900 font-medium">Erreur</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </Card>
        )}

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
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
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
              {error ? error : "L'analyse IA est peut-être encore en cours de traitement."}
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

