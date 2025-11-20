import { ArrowLeft, MapPin, Star, Clock, Award, CheckCircle, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Screen } from '../App';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function BookingProviderSelection({ onNavigate }: Props) {
  const providers = [
    {
      name: 'Dr Karim Ayari',
      specialty: 'Médecine Générale',
      rating: 4.8,
      reviews: 245,
      distance: '2.3 km',
      nextAvailable: 'Aujourd\'hui 16h',
      price: '45 TND',
      certifications: ['Télémédecine', 'HopeVisionAI'],
      recommended: true
    },
    {
      name: 'Dr Sarah Trabelsi',
      specialty: 'Pneumologie',
      rating: 4.9,
      reviews: 312,
      distance: '4.1 km',
      nextAvailable: 'Demain 10h',
      price: '65 TND',
      certifications: ['Spécialiste', 'HopeVisionAI'],
      recommended: true
    },
    {
      name: 'Dr Mohamed Gharbi',
      specialty: 'Médecine Générale',
      rating: 4.7,
      reviews: 189,
      distance: '1.8 km',
      nextAvailable: 'Aujourd\'hui 18h30',
      price: '40 TND',
      certifications: ['Télémédecine'],
      recommended: false
    },
    {
      name: 'Centre Médical El Menzah',
      specialty: 'Cabinet Médical',
      rating: 4.6,
      reviews: 456,
      distance: '3.5 km',
      nextAvailable: 'Demain 14h',
      price: '50 TND',
      certifications: ['Multi-spécialités'],
      recommended: false
    }
  ];

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
                onClick={() => onNavigate('booking-service-selection')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div className="w-1 h-8 bg-gray-200"></div>
              <div>
                <h1 className="text-gray-900">Sélectionner un prestataire</h1>
                <p className="text-xs text-gray-500">Téléconsultation • Nadia Ben Salem</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-gray-600">Choix prestation</span>
            </div>
            <div className="flex-1 h-1 bg-blue-600 mx-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                2
              </div>
              <span className="text-gray-900">Prestataire</span>
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Filters */}
          <div className="lg:col-span-3">
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-4">
                <Input 
                  placeholder="Rechercher un médecin ou centre..." 
                  className="flex-1"
                />
                <Select defaultValue="distance">
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="distance">Distance</SelectItem>
                    <SelectItem value="rating">Note</SelectItem>
                    <SelectItem value="price">Prix</SelectItem>
                    <SelectItem value="availability">Disponibilité</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes spécialités</SelectItem>
                    <SelectItem value="general">Médecine générale</SelectItem>
                    <SelectItem value="specialist">Spécialistes</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Plus de filtres
                </Button>
              </div>
            </Card>
          </div>

          {/* Providers List */}
          <div className="lg:col-span-2 space-y-4">
            {providers.map((provider, idx) => (
              <Card 
                key={idx}
                className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                  provider.recommended ? 'border-2 border-blue-500 bg-blue-50' : ''
                }`}
              >
                {provider.recommended && (
                  <Badge className="bg-blue-600 mb-4">Recommandé par l'IA</Badge>
                )}
                
                <div className="flex items-start gap-4">
                  <Avatar className="w-14 h-14">
                    <AvatarFallback className="bg-indigo-100 text-indigo-600 text-lg">
                      {provider.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-gray-900 mb-1">{provider.name}</h3>
                        <p className="text-sm text-gray-600">{provider.specialty}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-blue-600 mb-1">{provider.price}</p>
                        <p className="text-xs text-gray-500">par consultation</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        <span className="text-sm text-gray-900">{provider.rating}</span>
                        <span className="text-sm text-gray-500">({provider.reviews} avis)</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {provider.distance}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <Clock className="w-4 h-4" />
                        {provider.nextAvailable}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4">
                      {provider.certifications.map((cert, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          <Award className="w-3 h-3 mr-1" />
                          {cert}
                        </Badge>
                      ))}
                    </div>
                    
                    <Button 
                      className={`w-full ${
                        provider.recommended 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : ''
                      }`}
                      variant={provider.recommended ? 'default' : 'outline'}
                      onClick={() => onNavigate('booking-schedule')}
                    >
                      Voir les disponibilités
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-gray-900 mb-4">Critères de recommandation</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">Spécialité adaptée au diagnostic</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">Proximité géographique</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">Note et retours patients</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">Disponibilité rapide</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-yellow-50 border-yellow-200">
              <h3 className="text-gray-900 mb-3">Rapport médical partagé</h3>
              <p className="text-sm text-gray-700 mb-4">
                Le rapport complet incluant le diagnostic IA sera automatiquement 
                transmis au prestataire choisi.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Diagnostic: Pneumonie atypique (78%)</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Analyses biomédicales</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Anamnèse complète</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-gray-900 mb-4">Informations</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <p>• Tous les prestataires sont certifiés et vérifiés</p>
                <p>• Les tarifs sont fixes et sans surprise</p>
                <p>• Annulation gratuite jusqu'à 24h avant</p>
                <p>• Consultation remboursable selon votre mutuelle</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
