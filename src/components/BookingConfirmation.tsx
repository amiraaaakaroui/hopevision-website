import { CheckCircle, Calendar, Clock, Video, Download, Share2, ArrowRight, FileText, Bell, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { Screen } from '../App';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { bookingService } from '../services/bookingService';
import { medinService } from '../services/medinService';
import type { Appointment } from '../types/database';
import type { ExternalDoctor } from '../services/medinService';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function BookingConfirmation({ onNavigate }: Props) {
  const { currentProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [doctor, setDoctor] = useState<ExternalDoctor | null>(null);
  const [doctorName, setDoctorName] = useState<string>('');
  const [doctorSpecialty, setDoctorSpecialty] = useState<string>('');
  const [patientName, setPatientName] = useState<string>('');
  const [serviceType, setServiceType] = useState<string>('');
  const [appointmentReference, setAppointmentReference] = useState<string>('');

  useEffect(() => {
    loadAppointmentData();
  }, []);

  const loadAppointmentData = async () => {
    try {
      setLoading(true);

      // Récupérer l'ID du rendez-vous créé depuis sessionStorage
      const appointmentId = sessionStorage.getItem('createdAppointmentId');
      
      if (!appointmentId) {
        // Si pas d'ID, essayer de récupérer depuis les données de sessionStorage
        // et créer le rendez-vous si nécessaire (fallback)
        console.warn('[BookingConfirmation] No appointment ID found, trying to load from context');
        return;
      }

      // Charger le rendez-vous depuis la base de données
      const appointmentData = await bookingService.getAppointmentById(appointmentId);
      if (appointmentData) {
        setAppointment(appointmentData);
        
        // Générer la référence de réservation
        const ref = `#RDV-${appointmentData.id.substring(0, 8).toUpperCase()}`;
        setAppointmentReference(ref);

        // Charger les infos du médecin
        const doctorData = await medinService.getDoctorById(appointmentData.doctor_profile_id);
        if (doctorData) {
          setDoctor(doctorData);
          setDoctorName(doctorData.name);
          setDoctorSpecialty(doctorData.specialty);
        } else {
          // Si pas trouvé dans external_doctors, chercher dans doctor_profiles
          const { data: doctorProfileData } = await supabase
            .from('doctor_profiles')
            .select(`
              specialty,
              profiles (
                full_name
              )
            `)
            .eq('id', appointmentData.doctor_profile_id)
            .maybeSingle();

          if (doctorProfileData) {
            setDoctorName((doctorProfileData as any).profiles?.full_name || 'Médecin');
            setDoctorSpecialty((doctorProfileData as any).specialty || '');
          }
        }
      }

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

      // Récupérer le type de service
      const storedServiceType = sessionStorage.getItem('selectedServiceType') || 'teleconsult';
      setServiceType(storedServiceType);
    } catch (error) {
      console.error('[BookingConfirmation] Error loading appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const formatTime = (timeStr: string): string => {
    if (!timeStr) return '';
    return timeStr.slice(0, 5); // HH:mm
  };

  const formatAppointmentTime = (dateStr: string, timeStr: string): string => {
    const time = formatTime(timeStr);
    const endTime = addMinutes(time, 30);
    return `${time} - ${endTime}`;
  };

  const addMinutes = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Chargement de la confirmation...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Card className="p-8 text-center">
            <p className="text-gray-700 mb-4">Rendez-vous non trouvé.</p>
            <Button onClick={() => onNavigate('patient-dashboard')}>
              Retour au tableau de bord
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-gray-900">Réservation confirmée !</h1>
                <p className="text-xs text-gray-500">Référence: {appointmentReference}</p>
              </div>
            </div>
            <Button onClick={() => onNavigate('patient-dashboard')}>
              Retour au tableau de bord
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Success Message */}
        <Card className="p-8 mb-8 bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-gray-900 mb-3">Consultation réservée avec succès</h2>
            <p className="text-gray-700 mb-6">
              {patientName} a reçu une notification avec tous les détails. 
              {appointment.report_shared && ' Le rapport médical a été automatiquement partagé avec le médecin.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Badge className="bg-green-600">
                {appointment.payment_status === 'paid' ? 'Paiement confirmé' : 'Paiement en attente'}
              </Badge>
              {appointment.report_shared && (
                <Badge className="bg-blue-600">Rapport partagé</Badge>
              )}
              <Badge className="bg-indigo-600">Patient notifié</Badge>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Appointment Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h3 className="text-gray-900 mb-6">Détails de la consultation</h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-14 h-14">
                    {doctor?.image_url ? (
                      <AvatarImage src={doctor.image_url} alt={doctorName} />
                    ) : null}
                    <AvatarFallback className="bg-indigo-100 text-indigo-600 text-lg">
                      {doctorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="text-gray-900 mb-1">{doctorName}</h4>
                    <p className="text-sm text-gray-600 mb-3">{doctorSpecialty}</p>
                    <div className="flex flex-wrap gap-3">
                      {appointment.scheduled_date && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(appointment.scheduled_date)}</span>
                        </div>
                      )}
                      {appointment.scheduled_time && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Clock className="w-4 h-4" />
                          <span>{formatAppointmentTime(appointment.scheduled_date, appointment.scheduled_time)}</span>
                        </div>
                      )}
                      <Badge>
                        {appointment.appointment_type === 'teleconsultation' ? (
                          <>
                            <Video className="w-3 h-3 mr-1" />
                            Téléconsultation
                          </>
                        ) : appointment.appointment_type === 'in_person' ? (
                          'Consultation au cabinet'
                        ) : appointment.appointment_type === 'lab_exam' ? (
                          'Examens de laboratoire'
                        ) : (
                          'Consultation de suivi'
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-gray-900 mb-3">Patient</h4>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {patientName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-gray-900">{patientName}</p>
                      {currentProfile?.patientProfileId && (
                        <p className="text-sm text-gray-600">ID: PAT-{currentProfile.patientProfileId.substring(0, 8).toUpperCase()}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {appointment.ai_report_id && (
                  <div>
                    <h4 className="text-gray-900 mb-3">Contexte médical partagé</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">Rapport médical IA partagé</p>
                          <p className="text-xs text-gray-600">
                            {appointment.report_shared_at 
                              ? `Partagé le ${new Date(appointment.report_shared_at).toLocaleDateString('fr-FR')}`
                              : 'Partagé automatiquement'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">Anamnèse complète IA</p>
                          <p className="text-xs text-gray-600">Données de pré-analyse incluses</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                <div>
                  <h4 className="text-gray-900 mb-3">Instructions pour le patient</h4>
                  <Card className="p-4 bg-yellow-50 border-yellow-200">
                    <div className="space-y-2 text-sm text-gray-700">
                      {appointment.appointment_type === 'teleconsultation' ? (
                        <>
                          <div className="flex items-start gap-2">
                            <Bell className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <p>Un rappel sera envoyé 1 heure avant la consultation</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <Video className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <p>Le lien de vidéoconférence sera disponible 15 minutes avant</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <p>Préparer la carte vitale et la liste des questions</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start gap-2">
                            <Bell className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <p>Un rappel sera envoyé 1 heure avant la consultation</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <Calendar className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <p>Arrivez 10 minutes avant le rendez-vous</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <p>Apportez votre carte vitale et la liste des questions</p>
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            </Card>

            {/* Next Steps */}
            <Card className="p-6">
              <h3 className="text-gray-900 mb-4">Prochaines étapes recommandées</h3>
              <div className="space-y-3">
                <button 
                  className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                  onClick={() => onNavigate('patient-dashboard')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-gray-900">Voir mes rendez-vous</p>
                      <p className="text-sm text-gray-600">Consulter votre planning</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-600" />
                </button>
                
                <button 
                  className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
                  onClick={() => {
                    const preAnalysisId = sessionStorage.getItem('currentPreAnalysisId');
                    if (preAnalysisId) {
                      sessionStorage.setItem('currentPreAnalysisId', preAnalysisId);
                      onNavigate('patient-detailed-report');
                    } else {
                      onNavigate('patient-history');
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-gray-900">Consulter mon rapport médical</p>
                      <p className="text-sm text-gray-600">Voir les détails de l'analyse IA</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-green-600" />
                </button>
              </div>
            </Card>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-gray-900 mb-4">Actions rapides</h3>
              <div className="space-y-3">
                <Button className="w-full" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger le récapitulatif
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => {
                    const preAnalysisId = sessionStorage.getItem('currentPreAnalysisId');
                    if (preAnalysisId) {
                      sessionStorage.setItem('currentPreAnalysisId', preAnalysisId);
                      onNavigate('patient-timeline');
                    } else {
                      onNavigate('patient-history');
                    }
                  }}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Voir la timeline patient
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="text-gray-900 mb-3">Référence de réservation</h3>
              <div className="text-center mb-4">
                <p className="text-3xl text-blue-600 tracking-wide">{appointmentReference}</p>
              </div>
              <p className="text-sm text-gray-700 text-center">
                Conservez cette référence pour toute modification ou annulation
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-gray-900 mb-3">Paiement</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Montant</span>
                  <span className="text-gray-900">
                    {appointment.price ? `${appointment.price} TND` : 'Sur devis'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mode</span>
                  <span className="text-gray-900">
                    {appointment.payment_method === 'card' ? 'Carte bancaire' :
                     appointment.payment_method === 'on_site' ? 'Sur place' :
                     appointment.payment_method === 'insurance' ? 'Mutuelle' :
                     'À définir'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Statut</span>
                  <Badge className={
                    appointment.payment_status === 'paid' ? 'bg-green-600' :
                    appointment.payment_status === 'pending' ? 'bg-yellow-600' :
                    'bg-gray-600'
                  }>
                    {appointment.payment_status === 'paid' ? 'Confirmé' :
                     appointment.payment_status === 'pending' ? 'En attente' :
                     appointment.payment_status || 'À définir'}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID</span>
                  <span className="text-gray-900 text-xs">
                    {appointment.id.substring(0, 12).toUpperCase()}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-green-50 border-green-200">
              <h3 className="text-gray-900 mb-3">Notifications envoyées</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Email de confirmation</span>
                </div>
                {appointment.appointment_type === 'teleconsultation' && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>SMS avec lien vidéo</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Notification app mobile</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Ajout au calendrier</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
