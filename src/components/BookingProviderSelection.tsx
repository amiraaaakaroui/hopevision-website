import { ArrowLeft, MapPin, Star, Clock, Award, CheckCircle, Filter, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Screen } from '../App';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { medinService, type ExternalDoctor } from '../services/medinService';
import { doctorRecommendationService, type DoctorRecommendation } from '../services/doctorRecommendationService';
import type { AIReport, PatientProfile } from '../types/database';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function BookingProviderSelection({ onNavigate }: Props) {
  const { currentProfile } = useAuth();
  const [doctors, setDoctors] = useState<DoctorRecommendation[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<DoctorRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'rating' | 'price'>('score');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
  const [selectedServiceType, setSelectedServiceType] = useState<string>('');
  const [patientName, setPatientName] = useState<string>('');

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [doctors, searchQuery, sortBy, specialtyFilter]);

  const loadDoctors = async () => {
    try {
      setLoading(true);

      // Récupérer le contexte médical
      const preAnalysisId = sessionStorage.getItem('currentPreAnalysisId');
      const serviceType = sessionStorage.getItem('selectedServiceType') || 'teleconsult';
      setSelectedServiceType(serviceType);

      // Charger le nom du patient
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

      // Charger le rapport IA si disponible
      let report: AIReport | null = null;
      if (preAnalysisId) {
        const { data: reportData } = await supabase
          .from('ai_reports')
          .select('*')
          .eq('pre_analysis_id', preAnalysisId)
          .maybeSingle();

        if (reportData) {
          report = reportData as AIReport;
          setAiReport(report);
        }
      }

      // Charger le profil patient si disponible
      if (currentProfile?.patientProfileId) {
        const { data: patientData } = await supabase
          .from('patient_profiles')
          .select('*')
          .eq('id', currentProfile.patientProfileId)
          .maybeSingle();

        if (patientData) {
          setPatientProfile(patientData as PatientProfile);
        }
      }

      // Obtenir les recommandations de médecins
      if (report) {
        const recommendations = await doctorRecommendationService.recommendDoctors(
          report,
          patientProfile || undefined,
          {
            city: currentProfile?.profile?.country === 'Tunisie' ? undefined : undefined, // À adapter selon besoin
            acceptsTeleconsultation: serviceType === 'teleconsult',
            limit: 20,
          }
        );
        setDoctors(recommendations);
      } else {
        // Si pas de rapport, charger tous les médecins disponibles
        const allDoctors = await medinService.getAllDoctors({
          acceptsTeleconsultation: serviceType === 'teleconsult',
          limit: 20,
        });

        // Convertir en format recommandation sans score
        const doctorsWithoutScore: DoctorRecommendation[] = allDoctors.map(doc => ({
          ...doc,
          recommendationScore: 50, // Score par défaut
          recommendationReason: 'Médecin disponible',
          matchCriteria: {
            specialtyMatch: true,
            severityMatch: true,
            availabilityMatch: true,
            ratingMatch: doc.rating ? doc.rating >= 4.0 : false,
          },
        }));

        setDoctors(doctorsWithoutScore);
      }
    } catch (error) {
      console.error('[BookingProviderSelection] Error loading doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...doctors];

    // Filtre de recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doctor =>
        doctor.name.toLowerCase().includes(query) ||
        doctor.specialty.toLowerCase().includes(query) ||
        doctor.city?.toLowerCase().includes(query)
      );
    }

    // Filtre par spécialité
    if (specialtyFilter !== 'all') {
      if (specialtyFilter === 'general') {
        filtered = filtered.filter(doctor =>
          doctor.specialty.toLowerCase().includes('médecine générale') ||
          doctor.specialty.toLowerCase().includes('généraliste')
        );
      } else if (specialtyFilter === 'specialist') {
        filtered = filtered.filter(doctor =>
          !doctor.specialty.toLowerCase().includes('médecine générale') &&
          !doctor.specialty.toLowerCase().includes('généraliste')
        );
      }
    }

    // Trier
    filtered = doctorRecommendationService.sortRecommendations(filtered, sortBy);

    setFilteredDoctors(filtered);
  };

  const formatPrice = (price?: number | null): string => {
    if (!price) return 'Sur devis';
    return `${price} TND`;
  };

  const formatDistance = (distance?: number | null): string => {
    if (!distance) return 'Distance non disponible';
    return `${distance} km`;
  };

  const getServiceTypeLabel = (): string => {
    const serviceName = sessionStorage.getItem('selectedServiceName') || 'Consultation';
    return serviceName;
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
                onClick={() => onNavigate('booking-service-selection')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div className="w-1 h-8 bg-gray-200"></div>
              <div>
                <h1 className="text-gray-900">Sélectionner un prestataire</h1>
                <p className="text-xs text-gray-500">{getServiceTypeLabel()} • {patientName || 'Patient'}</p>
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score">Recommandation</SelectItem>
                    <SelectItem value="rating">Note</SelectItem>
                    <SelectItem value="price">Prix</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes spécialités</SelectItem>
                    <SelectItem value="general">Médecine générale</SelectItem>
                    <SelectItem value="specialist">Spécialistes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>
          </div>

          {/* Providers List */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <Card className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Chargement des médecins...</p>
              </Card>
            ) : filteredDoctors.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-600 mb-4">Aucun médecin trouvé.</p>
                <Button variant="outline" onClick={loadDoctors}>
                  Réessayer
                </Button>
              </Card>
            ) : (
              filteredDoctors.map((doctor) => {
                const isRecommended = doctor.recommendationScore >= 70;
                const initials = doctor.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase();

                return (
                  <Card 
                    key={doctor.id}
                    className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                      isRecommended ? 'border-2 border-blue-500 bg-blue-50' : ''
                    }`}
                  >
                    {isRecommended && (
                      <Badge className="bg-blue-600 mb-4">
                        ⭐ Recommandé par Léa
                      </Badge>
                    )}
                    
                    <div className="flex items-start gap-4">
                      <Avatar className="w-14 h-14">
                        {doctor.image_url ? (
                          <AvatarImage src={doctor.image_url} alt={doctor.name} />
                        ) : null}
                        <AvatarFallback className="bg-indigo-100 text-indigo-600 text-lg">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-gray-900 mb-1">{doctor.name}</h3>
                            <p className="text-sm text-gray-600">{doctor.specialty}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-blue-600 mb-1 font-semibold">
                              {formatPrice(doctor.consultation_price)}
                            </p>
                            <p className="text-xs text-gray-500">par consultation</p>
                          </div>
                        </div>
                        
                        {isRecommended && doctor.recommendationReason && (
                          <div className="mb-3 p-2 bg-blue-100 rounded text-xs text-blue-800">
                            {doctor.recommendationReason}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 mb-3 flex-wrap">
                          {doctor.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                              <span className="text-sm text-gray-900">{doctor.rating.toFixed(1)}</span>
                              {doctor.total_reviews && (
                                <span className="text-sm text-gray-500">({doctor.total_reviews} avis)</span>
                              )}
                            </div>
                          )}
                          {doctor.city && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <MapPin className="w-4 h-4" />
                              {doctor.city}
                            </div>
                          )}
                          {doctor.accepts_teleconsultation && (
                            <Badge variant="outline" className="text-xs">
                              <Award className="w-3 h-3 mr-1" />
                              Télémédecine
                            </Badge>
                          )}
                          {doctor.is_verified && (
                            <Badge variant="outline" className="text-xs bg-green-50 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                              Vérifié
                            </Badge>
                          )}
                        </div>
                        
                        {doctor.certifications && doctor.certifications.length > 0 && (
                          <div className="flex items-center gap-2 mb-4 flex-wrap">
                            {doctor.certifications.slice(0, 3).map((cert, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                <Award className="w-3 h-3 mr-1" />
                                {cert}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <Button 
                          className={`w-full ${
                            isRecommended 
                              ? 'bg-blue-600 hover:bg-blue-700' 
                              : ''
                          }`}
                          variant={isRecommended ? 'default' : 'outline'}
                          onClick={() => {
                            // Sauvegarder le médecin sélectionné
                            sessionStorage.setItem('selectedDoctorId', doctor.id);
                            sessionStorage.setItem('selectedDoctorName', doctor.name);
                            sessionStorage.setItem('selectedDoctorSpecialty', doctor.specialty);
                            sessionStorage.setItem('selectedDoctorPrice', doctor.consultation_price?.toString() || '0');
                            onNavigate('booking-schedule');
                          }}
                        >
                          Voir les disponibilités
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
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
                  <p className="text-gray-700">Note et retours patients</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">Disponibilité et accessibilité</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">Prix raisonnable</p>
                </div>
              </div>
            </Card>

            {aiReport && (
              <Card className="p-6 bg-yellow-50 border-yellow-200">
                <h3 className="text-gray-900 mb-3">Rapport médical partagé</h3>
                <p className="text-sm text-gray-700 mb-4">
                  Le rapport complet incluant le diagnostic IA sera automatiquement 
                  transmis au prestataire choisi.
                </p>
                <div className="space-y-2 text-sm">
                  {aiReport.primary_diagnosis && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>
                        Diagnostic: {aiReport.primary_diagnosis}
                        {aiReport.overall_confidence && ` (${Math.round(aiReport.overall_confidence)}%)`}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Anamnèse complète</span>
                  </div>
                  {aiReport.explainability_data && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Analyses biomédicales</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

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
