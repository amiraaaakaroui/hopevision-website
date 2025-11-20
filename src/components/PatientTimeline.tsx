import { ArrowLeft, CheckCircle, Clock, FileText, Calendar, Activity, Download, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { Screen } from '../App';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function PatientTimeline({ onNavigate }: Props) {
  const timeline = [
    {
      id: 1,
      status: 'completed',
      title: 'Pré-analyse IA',
      description: 'Analyse multimodale des symptômes',
      date: '31 Oct 2025',
      time: '14:30',
      details: [
        'Symptômes saisis et analysés',
        'Pattern vocal détecté',
        'Marqueurs bio extraits',
        'Diagnostic IA: Pneumonie atypique (78%)'
      ],
      icon: Activity,
      color: 'green'
    },
    {
      id: 2,
      status: 'completed',
      title: 'Anamnèse IA complétée',
      description: 'Questionnaire médical assisté',
      date: '31 Oct 2025',
      time: '14:45',
      details: [
        '5 questions répondues',
        '3 hypothèses écartées',
        'Confiance augmentée à 78%',
        'Informations consolidées'
      ],
      icon: FileText,
      color: 'green'
    },
    {
      id: 3,
      status: 'completed',
      title: 'Rapport médical généré',
      description: 'Rapport détaillé avec XAI multimodal',
      date: '31 Oct 2025',
      time: '15:00',
      details: [
        'Diagnostic consolidé',
        'Explications XAI',
        'Plan d\'action défini',
        'Traçabilité IA/Médecin'
      ],
      icon: FileText,
      color: 'green'
    },
    {
      id: 4,
      status: 'active',
      title: 'Consultation programmée',
      description: 'Téléconsultation avec Dr Karim Ayari',
      date: '1 Nov 2025',
      time: '16:00',
      details: [
        'Praticien: Dr Karim Ayari',
        'Type: Téléconsultation',
        'Durée: 15-30 min',
        'Rapport partagé avec le médecin'
      ],
      icon: Calendar,
      color: 'blue'
    },
    {
      id: 5,
      status: 'pending',
      title: 'Examens complémentaires',
      description: 'Radiographie thoracique et PCR',
      date: 'À planifier',
      time: 'Urgent - 24-48h',
      details: [
        'Radiographie thoracique (prioritaire)',
        'PCR Mycoplasma pneumoniae',
        'PCR COVID-19 (diagnostic différentiel)',
        'Prescription en attente de validation'
      ],
      icon: Activity,
      color: 'yellow'
    },
    {
      id: 6,
      status: 'pending',
      title: 'Résultats et ajustement',
      description: 'Intégration des résultats au dossier',
      date: 'À venir',
      time: '2-3 jours',
      details: [
        'Réception des résultats d\'examens',
        'Analyse automatique par l\'IA',
        'Validation médicale',
        'Ajustement du traitement si nécessaire'
      ],
      icon: FileText,
      color: 'gray'
    },
    {
      id: 7,
      status: 'pending',
      title: 'Consultation de suivi',
      description: 'Contrôle après traitement (J+7)',
      date: '8 Nov 2025',
      time: 'À réserver',
      details: [
        'Évaluation de l\'évolution',
        'Ajustement thérapeutique',
        'Validation de la guérison',
        'Clôture du dossier'
      ],
      icon: Calendar,
      color: 'gray'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'active':
        return <Clock className="w-6 h-6 text-blue-600 animate-pulse" />;
      case 'pending':
        return <AlertCircle className="w-6 h-6 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 border-green-200';
      case 'active': return 'bg-blue-50 border-blue-200';
      case 'pending': return 'bg-gray-50 border-gray-200';
      default: return 'bg-gray-50';
    }
  };

  const completedSteps = timeline.filter(t => t.status === 'completed').length;
  const totalSteps = timeline.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

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
                onClick={() => onNavigate('patient-history')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div className="w-1 h-8 bg-gray-200"></div>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    NB
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-gray-900">Timeline de prise en charge</h1>
                  <p className="text-xs text-gray-500">Nadia Ben Salem • ID: PAT-2025-00234</p>
                </div>
              </div>
            </div>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter la timeline
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Timeline */}
          <div className="lg:col-span-2">
            <Card className="p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-gray-900">Progression globale</h2>
                <span className="text-blue-600">{completedSteps}/{totalSteps} étapes</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </Card>

            <div className="space-y-6">
              {timeline.map((item, index) => (
                <div key={item.id} className="relative">
                  {/* Connecting Line */}
                  {index < timeline.length - 1 && (
                    <div className="absolute left-[23px] top-[60px] w-0.5 h-full bg-gray-200"></div>
                  )}
                  
                  <Card className={`p-6 ${getStatusColor(item.status)}`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        item.status === 'completed' 
                          ? 'bg-green-100' 
                          : item.status === 'active'
                          ? 'bg-blue-100'
                          : 'bg-gray-100'
                      }`}>
                        {getStatusIcon(item.status)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-gray-900 mb-1">{item.title}</h3>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </div>
                          <Badge className={
                            item.status === 'completed' 
                              ? 'bg-green-600' 
                              : item.status === 'active'
                              ? 'bg-blue-600'
                              : 'bg-gray-400'
                          }>
                            {item.status === 'completed' ? 'Terminé' : item.status === 'active' ? 'En cours' : 'À venir'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {item.date}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {item.time}
                          </div>
                        </div>

                        <div className="space-y-2">
                          {item.details.map((detail, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              {item.status === 'completed' ? (
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                              ) : (
                                <div className="w-4 h-4 flex-shrink-0 mt-0.5">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full m-1"></div>
                                </div>
                              )}
                              <p className="text-sm text-gray-700">{detail}</p>
                            </div>
                          ))}
                        </div>

                        {item.status === 'active' && (
                          <div className="mt-4 pt-4 border-t border-blue-200">
                            <Button 
                              size="sm"
                              onClick={() => onNavigate('booking-service-selection')}
                            >
                              Gérer la consultation
                            </Button>
                          </div>
                        )}

                        {item.status === 'pending' && item.id === 5 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => onNavigate('booking-service-selection')}
                            >
                              Réserver les examens
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-gray-900 mb-4">Résumé du cas</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Diagnostic</span>
                  <span className="text-gray-900">Pneumonie atypique</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Confiance IA</span>
                  <span className="text-blue-600">78%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gravité</span>
                  <Badge className="bg-yellow-500">Modérée</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Médecin</span>
                  <span className="text-gray-900">Dr Karim Ayari</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="text-gray-900 mb-3">Étape actuelle</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-gray-900">Consultation programmée</p>
                  <p className="text-sm text-gray-600">1 Nov 2025 à 16:00</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                Votre consultation avec le Dr Karim Ayari est confirmée. 
                Un lien de vidéoconférence vous sera envoyé 15 minutes avant.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-gray-900 mb-4">Statistiques</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Durée totale</span>
                  <span className="text-gray-900">8 jours prévus</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Consultations</span>
                  <span className="text-gray-900">2 prévues</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Examens</span>
                  <span className="text-gray-900">3 prescrits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Documents</span>
                  <span className="text-gray-900">1 rapport</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-yellow-50 border-yellow-200">
              <h3 className="text-gray-900 mb-3">Actions requises</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p>Préparer les questions pour la consultation</p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p>Réserver les examens complémentaires</p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p>Vérifier la connexion internet</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
