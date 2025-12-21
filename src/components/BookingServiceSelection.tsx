import { ArrowLeft, Video, Stethoscope, FlaskConical, Calendar, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Screen } from '../App';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { AIReport } from '../types/database';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function BookingServiceSelection({ onNavigate }: Props) {
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState<string>('');

  useEffect(() => {
    loadBookingContext();
  }, []);

  const loadBookingContext = async () => {
    try {
      setLoading(true);
      
      // Récupérer le pre_analysis_id depuis sessionStorage
      const preAnalysisId = sessionStorage.getItem('currentPreAnalysisId');
      
      if (preAnalysisId) {
        // Charger le rapport IA correspondant
        const { data: reportData, error: reportError } = await supabase
          .from('ai_reports')
          .select('*')
          .eq('pre_analysis_id', preAnalysisId)
          .maybeSingle();

        if (!reportError && reportData) {
          setAiReport(reportData as AIReport);
        }

        // Charger le nom du patient depuis le profil
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (profileData?.full_name) {
            setPatientName(profileData.full_name);
          }
        }
      }
    } catch (error) {
      console.error('[BookingServiceSelection] Error loading context:', error);
    } finally {
      setLoading(false);
    }
  };
  const services = [
    {
      id: 'teleconsult',
      icon: Video,
      title: 'Téléconsultation',
      description: 'Consultation vidéo sécurisée avec partage du rapport médical',
      duration: '15-30 min',
      price: '45 TND',
      available: true,
      recommended: true
    },
    {
      id: 'cabinet',
      icon: Stethoscope,
      title: 'Consultation au cabinet',
      description: 'Rendez-vous en présentiel avec le Dr Karim Ayari',
      duration: '30 min',
      price: '60 TND',
      available: true,
      recommended: false
    },
    {
      id: 'lab',
      icon: FlaskConical,
      title: 'Examens de laboratoire',
      description: 'Radiographie thoracique et PCR selon prescription',
      duration: '1-2 heures',
      price: 'Selon examens',
      available: true,
      recommended: true
    },
    {
      id: 'followup',
      icon: Calendar,
      title: 'Consultation de suivi',
      description: 'Rendez-vous de contrôle après traitement (J+7)',
      duration: '15 min',
      price: '35 TND',
      available: true,
      recommended: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  // Retourner au rapport détaillé patient ou au dashboard
                  const preAnalysisId = sessionStorage.getItem('currentPreAnalysisId');
                  if (preAnalysisId) {
                    onNavigate('patient-detailed-report');
                  } else {
                    onNavigate('patient-dashboard');
                  }
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div className="w-1 h-8 bg-gray-200"></div>
              <div>
                <h1 className="text-gray-900">Réserver une prestation</h1>
                <p className="text-xs text-gray-500">{patientName || 'Patient'}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                1
              </div>
              <span className="text-gray-900">Choix prestation</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 mx-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                2
              </div>
              <span className="text-gray-500">Prestataire</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 mx-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                3
              </div>
              <span className="text-gray-500">Horaire</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 mx-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                4
              </div>
              <span className="text-gray-500">Confirmation</span>
            </div>
          </div>
        </div>

        {/* Context Card */}
        <Card className="p-6 mb-8 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-gray-900 mb-2">Contexte médical</h3>
              {loading ? (
                <p className="text-sm text-gray-700 mb-3">Chargement...</p>
              ) : aiReport ? (
                <>
                  <p className="text-sm text-gray-700 mb-3">
                    Diagnostic: <strong>{aiReport.primary_diagnosis || 'En cours d\'analyse'}</strong>
                    {aiReport.overall_confidence && (
                      <> • Confiance: <strong>{Math.round(aiReport.overall_confidence)}%</strong></>
                    )}
                  </p>
                  <p className="text-sm text-gray-700">
                    Le rapport médical complet sera partagé avec le prestataire choisi pour 
                    assurer une continuité des soins optimale.
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-700 mb-3">
                  Aucun rapport médical disponible. Vous pouvez toujours réserver une consultation.
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {services.map((service) => (
            <Card 
              key={service.id}
              className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                service.recommended ? 'border-2 border-blue-500 bg-blue-50' : ''
              }`}
            >
              {service.recommended && (
                <Badge className="bg-blue-600 mb-4">Recommandé</Badge>
              )}
              
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  service.recommended ? 'bg-blue-600' : 'bg-gray-100'
                }`}>
                  <service.icon className={`w-6 h-6 ${
                    service.recommended ? 'text-white' : 'text-gray-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-900 mb-2">{service.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{service.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{service.duration}</span>
                    </div>
                    <div className="text-blue-600">{service.price}</div>
                  </div>
                </div>
              </div>

              <Button 
                className={`w-full ${
                  service.recommended 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : ''
                }`}
                variant={service.recommended ? 'default' : 'outline'}
                onClick={() => {
                  // Sauvegarder le service sélectionné dans sessionStorage
                  sessionStorage.setItem('selectedServiceType', service.id);
                  sessionStorage.setItem('selectedServiceName', service.title);
                  onNavigate('booking-provider-selection');
                }}
              >
                Sélectionner
              </Button>
            </Card>
          ))}
        </div>

        {/* Info Card */}
        <Card className="p-6 mt-8">
          <h3 className="text-gray-900 mb-4">À savoir</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p>Le rapport médical détaillé sera automatiquement partagé avec le prestataire</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p>Le patient recevra une notification avec tous les détails de la réservation</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p>Vous pouvez réserver plusieurs prestations simultanément</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p>Les résultats des examens seront automatiquement intégrés au dossier patient</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
