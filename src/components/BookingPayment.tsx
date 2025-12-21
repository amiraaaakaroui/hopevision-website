import { ArrowLeft, CreditCard, Shield, CheckCircle, Calendar, Clock, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { Screen } from '../App';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { bookingService, type CreateAppointmentData } from '../services/bookingService';
import { medinService } from '../services/medinService';
import type { ExternalDoctor } from '../services/medinService';
import type { AIReport } from '../types/database';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function BookingPayment({ onNavigate }: Props) {
  const { currentProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Données de réservation depuis sessionStorage
  const [doctor, setDoctor] = useState<ExternalDoctor | null>(null);
  const [doctorName, setDoctorName] = useState<string>('');
  const [doctorSpecialty, setDoctorSpecialty] = useState<string>('');
  const [doctorPrice, setDoctorPrice] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [serviceType, setServiceType] = useState<string>('');
  const [patientName, setPatientName] = useState<string>('');
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [preAnalysisId, setPreAnalysisId] = useState<string | null>(null);
  
  // État du formulaire
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [reportShareAccepted, setReportShareAccepted] = useState(true);
  const [reminderAccepted, setReminderAccepted] = useState(true);

  useEffect(() => {
    loadBookingData();
  }, []);

  const loadBookingData = async () => {
    try {
      setLoading(true);

      // Charger toutes les données depuis sessionStorage
      const doctorId = sessionStorage.getItem('selectedDoctorId');
      const storedDoctorName = sessionStorage.getItem('selectedDoctorName') || '';
      const storedDoctorSpecialty = sessionStorage.getItem('selectedDoctorSpecialty') || '';
      const storedDoctorPrice = sessionStorage.getItem('selectedDoctorPrice') || '0';
      const storedDate = sessionStorage.getItem('selectedAppointmentDate') || '';
      const storedTime = sessionStorage.getItem('selectedAppointmentTime') || '';
      const storedServiceType = sessionStorage.getItem('selectedServiceType') || 'teleconsult';
      const storedPreAnalysisId = sessionStorage.getItem('currentPreAnalysisId');

      setDoctorName(storedDoctorName);
      setDoctorSpecialty(storedDoctorSpecialty);
      setDoctorPrice(parseFloat(storedDoctorPrice));
      setSelectedDate(storedDate);
      setSelectedTime(storedTime);
      setServiceType(storedServiceType);
      setPreAnalysisId(storedPreAnalysisId);

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

      // Charger le médecin complet
      if (doctorId) {
        const doctorData = await medinService.getDoctorById(doctorId);
        if (doctorData) {
          setDoctor(doctorData);
        }
      }

      // Charger le rapport IA si disponible
      if (storedPreAnalysisId) {
        const { data: reportData } = await supabase
          .from('ai_reports')
          .select('*')
          .eq('pre_analysis_id', storedPreAnalysisId)
          .maybeSingle();

        if (reportData) {
          setAiReport(reportData as AIReport);
        }
      }

      // Valider que toutes les données nécessaires sont présentes
      if (!doctorId || !storedDate || !storedTime || !currentProfile?.patientProfileId) {
        setError('Données de réservation incomplètes. Veuillez recommencer.');
      }
    } catch (error) {
      console.error('[BookingPayment] Error loading data:', error);
      setError('Erreur lors du chargement des données.');
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

  const handleSubmit = async () => {
    if (!termsAccepted) {
      setError('Veuillez accepter les conditions générales.');
      return;
    }

    if (!currentProfile?.patientProfileId) {
      setError('Profil patient non trouvé.');
      return;
    }

    const doctorId = sessionStorage.getItem('selectedDoctorId');
    if (!doctorId) {
      setError('Médecin non sélectionné.');
      return;
    }

    if (!selectedDate || !selectedTime) {
      setError('Date et heure non sélectionnées.');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      // Préparer les données du rendez-vous
      const appointmentData: CreateAppointmentData = {
        patient_profile_id: currentProfile.patientProfileId,
        doctor_profile_id: doctorId,
        pre_analysis_id: preAnalysisId || undefined,
        ai_report_id: aiReport?.id || undefined,
        appointment_type: serviceType === 'teleconsult' ? 'teleconsultation' :
                          serviceType === 'cabinet' ? 'in_person' :
                          serviceType === 'lab' ? 'lab_exam' :
                          serviceType === 'followup' ? 'follow_up' : 'teleconsultation',
        scheduled_date: selectedDate,
        scheduled_time: selectedTime,
        duration_minutes: 30,
        location_type: serviceType === 'teleconsult' ? 'online' : 'clinic',
        price: doctorPrice > 0 ? doctorPrice : undefined,
        payment_status: paymentMethod === 'on-site' ? 'pending' : 'paid', // Pour MVP, simuler paiement
        payment_method: paymentMethod === 'card' ? 'card' :
                        paymentMethod === 'on-site' ? 'on_site' :
                        paymentMethod === 'insurance' ? 'insurance' : 'card',
      };

      // Créer le rendez-vous
      const appointment = await bookingService.bookAppointment(appointmentData);

      // Sauvegarder l'ID du rendez-vous pour la page de confirmation
      sessionStorage.setItem('createdAppointmentId', appointment.id);

      // Rediriger vers la confirmation
      onNavigate('booking-confirmation');
    } catch (error: any) {
      console.error('[BookingPayment] Error creating appointment:', error);
      setError(error.message || 'Erreur lors de la création du rendez-vous. Veuillez réessayer.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error && !selectedDate) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
            <p className="text-gray-700 mb-4">{error}</p>
            <Button onClick={() => onNavigate('booking-service-selection')}>
              Recommencer
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
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onNavigate('booking-schedule')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div className="w-1 h-8 bg-gray-200"></div>
              <div>
                <h1 className="text-gray-900">Récapitulatif & Paiement</h1>
                <p className="text-xs text-gray-500">Dernière étape avant confirmation</p>
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
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-gray-600">Prestataire</span>
            </div>
            <div className="flex-1 h-1 bg-blue-600 mx-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-gray-600">Horaire</span>
            </div>
            <div className="flex-1 h-1 bg-blue-600 mx-4"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                4
              </div>
              <span className="text-gray-900">Confirmation</span>
            </div>
          </div>
        </div>

        {error && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Summary */}
            <Card className="p-6">
              <h3 className="text-gray-900 mb-4">Récapitulatif de la réservation</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12">
                    {doctor?.image_url ? (
                      <AvatarImage src={doctor.image_url} alt={doctorName} />
                    ) : null}
                    <AvatarFallback className="bg-indigo-100 text-indigo-600">
                      {doctorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="text-gray-900 mb-1">{doctorName}</h4>
                    <p className="text-sm text-gray-600 mb-3">{doctorSpecialty}</p>
                    <div className="flex flex-wrap gap-3 text-sm">
                      {selectedDate && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(selectedDate)}</span>
                        </div>
                      )}
                      {selectedTime && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(selectedTime)}</span>
                        </div>
                      )}
                      <Badge>
                        {serviceType === 'teleconsult' ? 'Téléconsultation' :
                         serviceType === 'cabinet' ? 'Consultation au cabinet' :
                         serviceType === 'lab' ? 'Examens de laboratoire' :
                         serviceType === 'followup' ? 'Consultation de suivi' :
                         'Consultation'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl text-gray-900">
                      {doctorPrice > 0 ? `${doctorPrice} TND` : 'Sur devis'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {patientName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-gray-600">Patient</p>
                      <p className="text-gray-900">{patientName}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Method */}
            <Card className="p-6">
              <h3 className="text-gray-900 mb-4">Mode de paiement</h3>
              
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                <div className="flex items-center space-x-2 p-4 border-2 border-gray-200 rounded-xl">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-900">Carte bancaire</span>
                      </div>
                      <Badge variant="outline" className="bg-green-50 border-green-300 text-green-700">
                        Recommandé
                      </Badge>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border-2 border-gray-200 rounded-xl">
                  <RadioGroupItem value="on-site" id="on-site" />
                  <Label htmlFor="on-site" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-900">Paiement sur place</span>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border-2 border-gray-200 rounded-xl">
                  <RadioGroupItem value="insurance" id="insurance" />
                  <Label htmlFor="insurance" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-900">Prise en charge mutuelle</span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {paymentMethod === 'card' && (
                <div className="mt-6 space-y-4">
                  <div>
                    <Label htmlFor="cardNumber">Numéro de carte</Label>
                    <Input 
                      id="cardNumber" 
                      placeholder="1234 5678 9012 3456" 
                      className="mt-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry">Date d'expiration</Label>
                      <Input 
                        id="expiry" 
                        placeholder="MM/AA" 
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input 
                        id="cvv" 
                        placeholder="123" 
                        type="password"
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="name">Nom sur la carte</Label>
                    <Input 
                      id="name" 
                      placeholder={patientName.toUpperCase()} 
                      className="mt-2"
                    />
                  </div>
                  <p className="text-xs text-gray-500 italic">
                    Pour le MVP, le paiement est simulé. Aucune transaction réelle ne sera effectuée.
                  </p>
                </div>
              )}
            </Card>

            {/* Terms */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="terms" 
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  />
                  <Label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer">
                    J'accepte les <span className="text-blue-600">conditions générales</span> et 
                    la <span className="text-blue-600">politique d'annulation</span>
                  </Label>
                </div>
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="report" 
                    checked={reportShareAccepted}
                    onCheckedChange={(checked) => setReportShareAccepted(checked === true)}
                  />
                  <Label htmlFor="report" className="text-sm text-gray-700 cursor-pointer">
                    Autoriser le partage du rapport médical avec le praticien
                  </Label>
                </div>
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="reminder" 
                    checked={reminderAccepted}
                    onCheckedChange={(checked) => setReminderAccepted(checked === true)}
                  />
                  <Label htmlFor="reminder" className="text-sm text-gray-700 cursor-pointer">
                    Recevoir un rappel 1 heure avant la consultation
                  </Label>
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-between">
              <Button 
                variant="outline"
                onClick={() => onNavigate('booking-schedule')}
                disabled={processing}
              >
                Retour
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={handleSubmit}
                disabled={processing || !termsAccepted}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirmer et Payer
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Summary */}
            <Card className="p-6">
              <h3 className="text-gray-900 mb-4">Total</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Consultation</span>
                  <span className="text-gray-900">{doctorPrice > 0 ? `${doctorPrice} TND` : 'Sur devis'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frais de service</span>
                  <span className="text-gray-900">0 TND</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-900">Total à payer</span>
                  <span className="text-2xl text-gray-900">
                    {doctorPrice > 0 ? `${doctorPrice} TND` : 'Sur devis'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Refund Policy */}
            <Card className="p-6 bg-yellow-50 border-yellow-200">
              <h3 className="text-gray-900 mb-3">Politique d'annulation</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p>• Annulation gratuite jusqu'à 24h avant</p>
                <p>• Entre 24h et 2h: 50% remboursé</p>
                <p>• Moins de 2h avant: non remboursable</p>
              </div>
            </Card>

            {/* Security */}
            <Card className="p-6 bg-green-50 border-green-200">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-gray-900 mb-2">Paiement sécurisé</h3>
                  <p className="text-sm text-gray-700">
                    Vos données bancaires sont cryptées et sécurisées. 
                    Nous ne conservons aucune information de paiement.
                  </p>
                </div>
              </div>
            </Card>

            {/* Report Sharing */}
            {aiReport && (
              <Card className="p-6 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-gray-900 mb-2">Rapport médical</h3>
                    <p className="text-sm text-gray-700 mb-3">
                      Le rapport complet incluant le diagnostic IA sera automatiquement transmis.
                    </p>
                    <div className="space-y-1 text-sm text-gray-700">
                      {aiReport.primary_diagnosis && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span>
                            Diagnostic IA
                            {aiReport.overall_confidence && ` (${Math.round(aiReport.overall_confidence)}%)`}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span>Anamnèse complète</span>
                      </div>
                      {aiReport.explainability_data && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span>Analyses biomédicales</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
