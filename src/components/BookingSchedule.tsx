import { ArrowLeft, Calendar as CalendarIcon, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Screen } from '../App';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { bookingService, type DoctorAvailability } from '../services/bookingService';
import { medinService } from '../services/medinService';
import type { ExternalDoctor } from '../services/medinService';

interface Props {
  onNavigate: (screen: Screen) => void;
}

interface DateOption {
  date: string; // YYYY-MM-DD
  day: string; // Jour de la semaine abrégé
  dayNum: string; // Numéro du jour
  slots: number; // Nombre de créneaux disponibles
  isPast: boolean;
}

export function BookingSchedule({ onNavigate }: Props) {
  const { currentProfile } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availability, setAvailability] = useState<DoctorAvailability | null>(null);
  const [doctor, setDoctor] = useState<ExternalDoctor | null>(null);
  const [doctorName, setDoctorName] = useState<string>('');
  const [doctorSpecialty, setDoctorSpecialty] = useState<string>('');
  const [doctorPrice, setDoctorPrice] = useState<number>(0);
  const [serviceType, setServiceType] = useState<string>('');
  const [patientName, setPatientName] = useState<string>('');
  const [dates, setDates] = useState<DateOption[]>([]);

  useEffect(() => {
    loadBookingContext();
  }, []);

  useEffect(() => {
    if (selectedDate && doctor) {
      loadAvailability(selectedDate);
    }
  }, [selectedDate, doctor]);

  const loadBookingContext = async () => {
    try {
      setLoading(true);

      // Récupérer le médecin sélectionné depuis sessionStorage
      const doctorId = sessionStorage.getItem('selectedDoctorId');
      const storedDoctorName = sessionStorage.getItem('selectedDoctorName') || '';
      const storedDoctorSpecialty = sessionStorage.getItem('selectedDoctorSpecialty') || '';
      const storedDoctorPrice = sessionStorage.getItem('selectedDoctorPrice') || '0';
      const storedServiceType = sessionStorage.getItem('selectedServiceType') || 'teleconsult';

      setDoctorName(storedDoctorName);
      setDoctorSpecialty(storedDoctorSpecialty);
      setDoctorPrice(parseFloat(storedDoctorPrice));
      setServiceType(storedServiceType);

      // Charger le nom du patient
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, date_of_birth')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profileData?.full_name) {
          setPatientName(profileData.full_name);
        }
      }

      // Charger les infos complètes du médecin
      if (doctorId) {
        const doctorData = await medinService.getDoctorById(doctorId);
        if (doctorData) {
          setDoctor(doctorData);
        } else {
          // Si pas trouvé dans external_doctors, chercher dans doctor_profiles
          // Pour MVP, on continue avec les données de sessionStorage
          console.warn('[BookingSchedule] Doctor not found in external_doctors, using sessionStorage data');
        }
      }

      // Générer les 14 prochains jours
      const dateOptions = generateDateOptions();
      setDates(dateOptions);

      // Sélectionner le premier jour disponible par défaut (après génération)
      const firstAvailableDate = dateOptions.find(d => !d.isPast && d.slots > 0);
      if (firstAvailableDate) {
        setSelectedDate(firstAvailableDate.date);
      }
    } catch (error) {
      console.error('[BookingSchedule] Error loading context:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDateOptions = (): DateOption[] => {
    const options: DateOption[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Réinitialiser l'heure pour comparaison
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    for (let i = 0; i < 14; i++) { // 14 prochains jours
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dateStr = date.toISOString().split('T')[0];
      const dayName = dayNames[date.getDay()];
      const dayNum = date.getDate().toString();
      // Considérer passé si c'est aujourd'hui et qu'il est après 18h
      const now = new Date();
      const isPast = i === 0 && now.getHours() >= 18;

      options.push({
        date: dateStr,
        day: dayName,
        dayNum,
        slots: 0, // Sera mis à jour après chargement des disponibilités
        isPast: isPast,
      });
    }

    return options;
  };

  const loadAvailability = async (date: string) => {
    if (!doctor) return;

    try {
      setLoadingSlots(true);
      const availabilityData = await bookingService.getDoctorAvailability(
        doctor.id,
        date,
        30 // 30 minutes par défaut
      );
      setAvailability(availabilityData);

      // Mettre à jour le nombre de créneaux disponibles pour cette date
      const availableCount = availabilityData.availableSlots.filter(s => s.available).length;
      setDates(prev => prev.map(d => 
        d.date === date ? { ...d, slots: availableCount } : d
      ));
    } catch (error) {
      console.error('[BookingSchedule] Error loading availability:', error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const groupTimeSlots = (slots: { time: string; available: boolean }[]) => {
    const morning: { time: string; available: boolean }[] = [];
    const afternoon: { time: string; available: boolean }[] = [];

    slots.forEach(slot => {
      const hour = parseInt(slot.time.split(':')[0]);
      if (hour < 13) {
        morning.push(slot);
      } else {
        afternoon.push(slot);
      }
    });

    return { morning, afternoon };
  };

  const handleDateSelect = (date: string) => {
    // Vérifier que la date n'est pas dans le passé
    const selectedDateObj = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDateObj < today) {
      return; // Ne pas permettre de sélectionner une date passée
    }

    setSelectedDate(date);
    setSelectedTime(''); // Réinitialiser l'heure sélectionnée
  };

  const handleContinue = () => {
    if (selectedDate && selectedTime && doctor) {
      // Sauvegarder la date et l'heure sélectionnées
      sessionStorage.setItem('selectedAppointmentDate', selectedDate);
      sessionStorage.setItem('selectedAppointmentTime', selectedTime);
      onNavigate('booking-payment');
    }
  };

  const { morning, afternoon } = availability 
    ? groupTimeSlots(availability.availableSlots)
    : { morning: [], afternoon: [] };

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
                onClick={() => onNavigate('booking-provider-selection')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div className="w-1 h-8 bg-gray-200"></div>
              <div>
                <h1 className="text-gray-900">Choisir un créneau</h1>
                <p className="text-xs text-gray-500">
                  {doctorName || 'Médecin'} • {serviceType === 'teleconsult' ? 'Téléconsultation' : 'Consultation au cabinet'}
                </p>
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
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                3
              </div>
              <span className="text-gray-900">Horaire</span>
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
          {/* Calendar & Slots */}
          <div className="lg:col-span-2 space-y-6">
            {/* Date Selection */}
            <Card className="p-6">
              <h3 className="text-gray-900 mb-4">Sélectionner une date</h3>
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                  <p className="text-sm text-gray-600">Chargement...</p>
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-2">
                  {dates.map((dateOption) => {
                    const isSelected = selectedDate === dateOption.date;
                    const isDisabled = dateOption.isPast || dateOption.slots === 0;

                    return (
                      <button
                        key={dateOption.date}
                        onClick={() => handleDateSelect(dateOption.date)}
                        disabled={isDisabled}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50'
                            : isDisabled
                            ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <p className="text-xs text-gray-600 mb-1">{dateOption.day}</p>
                        <p className="text-lg text-gray-900">{dateOption.dayNum}</p>
                        {dateOption.slots > 0 && !dateOption.isPast && (
                          <p className="text-xs text-green-600 mt-1">{dateOption.slots} créneaux</p>
                        )}
                        {dateOption.isPast && (
                          <p className="text-xs text-gray-400 mt-1">Passé</p>
                        )}
                        {dateOption.slots === 0 && !dateOption.isPast && (
                          <p className="text-xs text-gray-400 mt-1">Complet</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Time Slots */}
            {selectedDate && (
              <Card className="p-6">
                <h3 className="text-gray-900 mb-4">
                  Créneaux disponibles - {selectedDate ? formatDate(selectedDate) : ''}
                </h3>
                
                {loadingSlots ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <p className="text-sm text-gray-600">Chargement des créneaux...</p>
                  </div>
                ) : availability && availability.availableSlots.length > 0 ? (
                  <div className="space-y-6">
                    {morning.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="w-4 h-4 text-gray-600" />
                          <h4 className="text-gray-900">Matin</h4>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {morning.map((slot) => (
                            <button
                              key={slot.time}
                              onClick={() => setSelectedTime(slot.time)}
                              disabled={!slot.available}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                selectedTime === slot.time
                                  ? 'border-blue-600 bg-blue-600 text-white'
                                  : !slot.available
                                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed line-through'
                                  : 'border-gray-200 hover:border-blue-300 text-gray-900'
                              }`}
                            >
                              {slot.time}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {afternoon.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="w-4 h-4 text-gray-600" />
                          <h4 className="text-gray-900">Après-midi</h4>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {afternoon.map((slot) => (
                            <button
                              key={slot.time}
                              onClick={() => setSelectedTime(slot.time)}
                              disabled={!slot.available}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                selectedTime === slot.time
                                  ? 'border-blue-600 bg-blue-600 text-white'
                                  : !slot.available
                                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed line-through'
                                  : 'border-gray-200 hover:border-blue-300 text-gray-900'
                              }`}
                            >
                              {slot.time}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">Aucun créneau disponible pour cette date.</p>
                    <p className="text-sm text-gray-500">Veuillez sélectionner une autre date.</p>
                  </div>
                )}

                <div className="flex items-center gap-6 mt-6 pt-6 border-t border-gray-200 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 bg-blue-600 rounded"></div>
                    <span className="text-gray-600">Sélectionné</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-200 rounded"></div>
                    <span className="text-gray-600">Disponible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-200 bg-gray-50 rounded"></div>
                    <span className="text-gray-600">Réservé</span>
                  </div>
                </div>
              </Card>
            )}

            {!selectedDate && (
              <Card className="p-6">
                <p className="text-gray-600 text-center">Veuillez sélectionner une date pour voir les créneaux disponibles.</p>
              </Card>
            )}

            <div className="flex items-center justify-end gap-3">
              <Button 
                variant="outline"
                onClick={() => onNavigate('booking-provider-selection')}
              >
                Retour
              </Button>
              <Button 
                disabled={!selectedTime || !selectedDate}
                onClick={handleContinue}
              >
                Continuer
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-gray-900 mb-4">Récapitulatif</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Praticien</p>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      {doctor?.image_url ? (
                        <AvatarImage src={doctor.image_url} alt={doctorName} />
                      ) : null}
                      <AvatarFallback className="bg-indigo-100 text-indigo-600">
                        {doctorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-gray-900">{doctorName}</p>
                      <p className="text-xs text-gray-500">{doctorSpecialty}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Type de consultation</p>
                  <Badge>
                    {serviceType === 'teleconsult' ? 'Téléconsultation' : 
                     serviceType === 'cabinet' ? 'Consultation au cabinet' :
                     serviceType === 'lab' ? 'Examens de laboratoire' :
                     serviceType === 'followup' ? 'Consultation de suivi' :
                     'Consultation'}
                  </Badge>
                </div>

                {selectedDate && selectedTime && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Créneau sélectionné</p>
                    <div className="flex items-center gap-2 text-blue-600">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{selectedDate ? formatDate(selectedDate) : ''}</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-600 mt-1">
                      <Clock className="w-4 h-4" />
                      <span>{selectedTime}</span>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Durée estimée</p>
                  <p className="text-gray-900">30 minutes</p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Tarif</p>
                  <p className="text-2xl text-gray-900">
                    {doctorPrice > 0 ? `${doctorPrice} TND` : 'Sur devis'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="text-gray-900 mb-3">Patient concerné</h3>
              <div className="flex items-center gap-3 mb-4">
                <Avatar>
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {patientName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-gray-900">{patientName}</p>
                </div>
              </div>
              <div className="pt-3 border-t border-blue-200 text-sm">
                <p className="text-gray-700">
                  Le rapport médical détaillé sera partagé avec {doctorName.split(' ')[0] || 'le médecin'} avant la consultation.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-gray-900 mb-3">Avant la consultation</h3>
              <div className="space-y-2 text-sm text-gray-700">
                {serviceType === 'teleconsult' ? (
                  <>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <p>Vérifiez votre connexion internet</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <p>Préparez vos questions</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <p>Le lien de vidéoconférence sera envoyé par email</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <p>Arrivez 10 minutes avant le rendez-vous</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <p>Apportez votre carte vitale</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <p>Préparez vos questions</p>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
