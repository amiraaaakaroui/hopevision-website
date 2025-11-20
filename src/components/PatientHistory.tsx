import { Brain, Calendar, FileText, AlertCircle, Bell, Activity, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Screen } from '../App';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function PatientHistory({ onNavigate }: Props) {
  const timeline = [
    {
      date: '31 Oct 2025',
      type: 'consultation',
      title: 'Pré-analyse IA - Pneumonie atypique',
      doctor: 'En attente de consultation',
      status: 'pending',
      details: 'Confiance: 71% - Consultation recommandée'
    },
    {
      date: '15 Oct 2025',
      type: 'alert',
      title: 'Rappel vaccination',
      doctor: 'Rappel grippe saisonnière',
      status: 'reminder',
      details: 'Vaccination recommandée avant début novembre'
    },
    {
      date: '2 Oct 2025',
      type: 'consultation',
      title: 'Consultation Dr Ayari',
      doctor: 'Dr Karim Ayari',
      status: 'completed',
      details: 'Fatigue chronique - Analyses prescrites'
    },
    {
      date: '12 Sep 2025',
      type: 'analysis',
      title: 'Résultats analyses sanguines',
      doctor: 'Laboratoire Central',
      status: 'completed',
      details: 'CRP: 38 mg/L (légèrement élevé)'
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation': return <FileText className="w-5 h-5" />;
      case 'alert': return <Bell className="w-5 h-5" />;
      case 'analysis': return <Activity className="w-5 h-5" />;
      default: return <Calendar className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consultation': return 'bg-blue-100 text-blue-600';
      case 'alert': return 'bg-yellow-100 text-yellow-600';
      case 'analysis': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-yellow-500">En attente</Badge>;
      case 'completed': return <Badge className="bg-green-600">Terminé</Badge>;
      case 'reminder': return <Badge variant="outline">Rappel</Badge>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-gray-900">HopeVisionAI</h1>
              <p className="text-xs text-gray-500">Espace Patient</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Patient Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                    NB
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-gray-900">Nadia Ben Salem</h3>
                  <p className="text-gray-600">34 ans</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Groupe sanguin</span>
                  <span className="text-gray-900">A+</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Allergies</span>
                  <span className="text-gray-900">Pénicilline</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Dernière visite</span>
                  <span className="text-gray-900">2 Oct 2025</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-gray-900 mb-4">Actions rapides</h3>
              <div className="space-y-3">
                <Button 
                  className="w-full justify-start bg-blue-600 hover:bg-blue-700"
                  onClick={() => onNavigate('patient-consent')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Nouvelle pré-analyse
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => onNavigate('patient-timeline')}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Voir ma timeline
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Mes rendez-vous
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="w-4 h-4 mr-2" />
                  Mes analyses
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="text-gray-900 mb-1">Rappel</h3>
                  <p className="text-sm text-gray-700">
                    Vous avez une pré-analyse en attente. Planifiez une consultation.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Timeline */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-gray-900 mb-2">Historique de santé</h2>
              <p className="text-gray-600">Consultations, analyses et rappels</p>
            </div>

            <div className="space-y-4">
              {timeline.map((item, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeColor(item.type)}`}>
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-gray-900 mb-1">{item.title}</h3>
                          <p className="text-sm text-gray-600">{item.doctor}</p>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{item.details}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {item.date}
                        </div>
                        <Button variant="ghost" size="sm">
                          Voir détails
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              <Card className="p-4 text-center">
                <div className="text-2xl text-blue-600 mb-1">12</div>
                <div className="text-sm text-gray-600">Consultations</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl text-green-600 mb-1">8</div>
                <div className="text-sm text-gray-600">Analyses</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl text-yellow-600 mb-1">2</div>
                <div className="text-sm text-gray-600">Rappels actifs</div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}