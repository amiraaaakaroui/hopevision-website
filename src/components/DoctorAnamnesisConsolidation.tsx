import { ArrowLeft, CheckCircle, AlertTriangle, MessageSquare, Download, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Screen } from '../App';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function DoctorAnamnesisConsolidation({ onNavigate }: Props) {
  const anamnesisData = [
    {
      question: "La toux est-elle productive ?",
      answer: "Non",
      status: "complete",
      aiImpact: "Confirme pneumonie atypique plutôt que bactérienne classique"
    },
    {
      question: "Douleurs thoraciques lors de la respiration ?",
      answer: "Oui, légères",
      status: "complete",
      aiImpact: "Suggère une atteinte pleurale minime"
    },
    {
      question: "Intensité de la fatigue (0-10)",
      answer: "7/10",
      status: "complete",
      aiImpact: "Impact systémique modéré à élevé"
    },
    {
      question: "Contact avec personne malade ?",
      answer: "Oui, il y a 7 jours",
      status: "complete",
      aiImpact: "Compatible avec période d'incubation"
    },
    {
      question: "Sueurs nocturnes ?",
      answer: "Non",
      status: "complete",
      aiImpact: "Écarte tuberculose et infections chroniques"
    }
  ];

  const missingInfo = [
    {
      category: "Antécédents vaccinaux",
      question: "Statut vaccinal COVID-19 et grippe",
      priority: "medium",
      reason: "Important pour orienter le diagnostic différentiel"
    },
    {
      category: "Exposition professionnelle",
      question: "Profession et exposition à des agents pathogènes",
      priority: "low",
      reason: "Peut orienter vers pneumonie professionnelle"
    },
    {
      category: "Voyages récents",
      question: "Déplacements dans les 3 dernières semaines",
      priority: "medium",
      reason: "Évaluer risque d'agents pathogènes exotiques"
    }
  ];

  const consolidatedDiagnosis = {
    primary: "Pneumonie atypique à Mycoplasma pneumoniae",
    confidence: 78,
    reasoning: "Toux sèche persistante, absence de production, fièvre modérée, contact récent, fatigue marquée"
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onNavigate('doctor-anamnesis-ai')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à l'anamnèse
              </Button>
              <div className="w-1 h-8 bg-gray-200"></div>
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    NB
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-gray-900">Consolidation de l'anamnèse</h1>
                  <p className="text-xs text-gray-500">Nadia Ben Salem • 34 ans</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
              <Button 
                size="sm"
                onClick={() => onNavigate('doctor-patient-file')}
              >
                Intégrer au dossier
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Consolidated Diagnosis */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-gray-900">Diagnostic consolidé par l'IA</h2>
              </div>
              <h3 className="text-gray-900 mb-3">{consolidatedDiagnosis.primary}</h3>
              <p className="text-gray-700 mb-4">{consolidatedDiagnosis.reasoning}</p>
              <div className="flex items-center justify-between pt-4 border-t border-blue-200">
                <span className="text-sm text-gray-600">Confiance après anamnèse</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-white h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full" 
                      style={{ width: `${consolidatedDiagnosis.confidence}%` }}
                    ></div>
                  </div>
                  <span className="text-blue-600">{consolidatedDiagnosis.confidence}%</span>
                </div>
              </div>
            </Card>

            {/* Anamnesis Recap */}
            <Card className="p-6">
              <h3 className="text-gray-900 mb-4">Récapitulatif des réponses</h3>
              <div className="space-y-4">
                {anamnesisData.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-gray-900">{item.question}</p>
                        <Badge variant="outline" className="ml-2">{item.answer}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{item.aiImpact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Next Steps */}
            <Card className="p-6">
              <h3 className="text-gray-900 mb-4">Actions recommandées</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <p className="text-gray-900 mb-1">Radiographie thoracique</p>
                    <p className="text-sm text-gray-600">Confirmer le diagnostic et évaluer l'étendue</p>
                  </div>
                  <Button size="sm" onClick={() => onNavigate('booking-service-selection')}>
                    Prescrire
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <p className="text-gray-900 mb-1">PCR Mycoplasma pneumoniae</p>
                    <p className="text-sm text-gray-600">Confirmation étiologique spécifique</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Prescrire
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Missing Information */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <h3 className="text-gray-900">Informations manquantes</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Données complémentaires qui pourraient affiner le diagnostic
              </p>
              <div className="space-y-3">
                {missingInfo.map((info, idx) => (
                  <Card key={idx} className="p-4 border-2 border-dashed border-gray-300">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-gray-900 text-sm">{info.category}</h4>
                      <Badge 
                        variant="outline"
                        className={info.priority === 'medium' ? 'border-yellow-500 text-yellow-700' : 'border-gray-400'}
                      >
                        {info.priority === 'medium' ? 'Utile' : 'Optionnel'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{info.question}</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => onNavigate('doctor-chat-relay')}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Demander au patient
                    </Button>
                  </Card>
                ))}
              </div>
            </Card>

            {/* Summary Stats */}
            <Card className="p-6 bg-green-50 border-green-200">
              <h3 className="text-gray-900 mb-4">Statistiques</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Questions posées</span>
                  <span className="text-gray-900">5/5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Taux de complétion</span>
                  <span className="text-green-600">100%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Durée</span>
                  <span className="text-gray-900">3 min 20s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Hypothèses écartées</span>
                  <span className="text-gray-900">3</span>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="space-y-2">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => onNavigate('doctor-chat-relay')}
              >
                <Send className="w-4 h-4 mr-2" />
                Envoyer message au patient
              </Button>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => onNavigate('doctor-detailed-report')}
              >
                Générer rapport détaillé
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
