import { Brain, Calendar, MapPin, Star, Video, FileText, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Screen } from '../App';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function PatientOrientation({ onNavigate }: Props) {
  const doctors = [
    {
      name: 'Dr Karim Ayari',
      specialty: 'Médecine Générale',
      availability: 'Disponible maintenant',
      rating: 4.8,
      reviews: 234,
      status: 'available',
      nextSlot: 'Aujourd\'hui 14:30'
    },
    {
      name: 'Dr Salma Mansouri',
      specialty: 'Pneumologie',
      availability: 'Disponible dans 2h',
      rating: 4.9,
      reviews: 187,
      status: 'soon',
      nextSlot: 'Aujourd\'hui 16:00'
    },
    {
      name: 'Dr Ahmed Khalil',
      specialty: 'Médecine Interne',
      availability: 'Demain matin',
      rating: 4.7,
      reviews: 156,
      status: 'later',
      nextSlot: 'Demain 09:00'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-600';
      case 'soon': return 'bg-yellow-500';
      case 'later': return 'bg-gray-400';
      default: return 'bg-gray-400';
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
            <span className="text-sm text-gray-600">Étape 6 sur 6</span>
            <span className="text-sm text-gray-600">Orientation médicale</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-blue-600 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Recommendation */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-gray-900 mb-2">Votre rapport de pré-analyse est prêt</h3>
              <p className="text-gray-700 mb-4">
                Basé sur vos symptômes, nous recommandons une consultation avec un médecin généraliste 
                ou un pneumologue. Votre rapport détaillé sera automatiquement partagé avec le professionnel choisi.
              </p>
              <div className="flex gap-3">
                <Badge variant="outline" className="bg-white">
                  <FileText className="w-3 h-3 mr-1" />
                  Rapport IA inclus
                </Badge>
                <Badge variant="outline" className="bg-white">
                  <Calendar className="w-3 h-3 mr-1" />
                  Historique médical
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        <h2 className="text-gray-900 mb-6">Médecins disponibles</h2>

        {/* Doctors List */}
        <div className="space-y-4 mb-8">
          {doctors.map((doctor, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-6">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                    {doctor.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-gray-900 mb-1">{doctor.name}</h3>
                      <p className="text-gray-600">{doctor.specialty}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full ${getStatusColor(doctor.status)} text-white text-sm`}>
                      {doctor.availability}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-gray-900">{doctor.rating}</span>
                      <span className="text-gray-500">({doctor.reviews} avis)</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">{doctor.nextSlot}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">Téléconsultation</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Voir profil
                    </Button>
                    <Button 
                      size="sm"
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                      onClick={() => onNavigate('booking-service-selection')}
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Partager le rapport et réserver
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Info */}
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-gray-900 mb-2">Votre rapport sera partagé automatiquement</h3>
              <p className="text-gray-700 text-sm">
                Le médecin aura accès à votre pré-analyse IA, vos symptômes détaillés, et votre historique médical 
                avant même le début de la consultation pour un diagnostic plus rapide et précis.
              </p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 mt-8">
          <Button variant="outline" onClick={() => onNavigate('patient-results')}>
            Retour aux résultats
          </Button>
          <Button 
            variant="outline"
            onClick={() => onNavigate('patient-history')}
          >
            Voir mon historique
          </Button>
        </div>
      </div>
    </div>
  );
}