import { ArrowLeft, Calendar as CalendarIcon, Clock, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Screen } from '../App';
import { useState } from 'react';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function BookingSchedule({ onNavigate }: Props) {
  const [selectedDate, setSelectedDate] = useState('2025-11-01');
  const [selectedTime, setSelectedTime] = useState('');

  const dates = [
    { date: '2025-11-01', day: 'Ven', dayNum: '1', slots: 8 },
    { date: '2025-11-02', day: 'Sam', dayNum: '2', slots: 5 },
    { date: '2025-11-03', day: 'Dim', dayNum: '3', slots: 0 },
    { date: '2025-11-04', day: 'Lun', dayNum: '4', slots: 12 },
    { date: '2025-11-05', day: 'Mar', dayNum: '5', slots: 9 },
    { date: '2025-11-06', day: 'Mer', dayNum: '6', slots: 7 },
    { date: '2025-11-07', day: 'Jeu', dayNum: '7', slots: 11 }
  ];

  const timeSlots = {
    morning: [
      { time: '09:00', available: true },
      { time: '09:30', available: true },
      { time: '10:00', available: false },
      { time: '10:30', available: true },
      { time: '11:00', available: true },
      { time: '11:30', available: false }
    ],
    afternoon: [
      { time: '14:00', available: true },
      { time: '14:30', available: true },
      { time: '15:00', available: true },
      { time: '15:30', available: false },
      { time: '16:00', available: true },
      { time: '16:30', available: true },
      { time: '17:00', available: true },
      { time: '17:30', available: false }
    ]
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
                onClick={() => onNavigate('booking-provider-selection')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div className="w-1 h-8 bg-gray-200"></div>
              <div>
                <h1 className="text-gray-900">Choisir un créneau</h1>
                <p className="text-xs text-gray-500">Dr Karim Ayari • Téléconsultation</p>
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
              <div className="grid grid-cols-7 gap-2">
                {dates.map((date) => (
                  <button
                    key={date.date}
                    onClick={() => setSelectedDate(date.date)}
                    disabled={date.slots === 0}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedDate === date.date
                        ? 'border-blue-600 bg-blue-50'
                        : date.slots === 0
                        ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <p className="text-xs text-gray-600 mb-1">{date.day}</p>
                    <p className="text-lg text-gray-900">{date.dayNum}</p>
                    {date.slots > 0 && (
                      <p className="text-xs text-green-600 mt-1">{date.slots} créneaux</p>
                    )}
                    {date.slots === 0 && (
                      <p className="text-xs text-gray-400 mt-1">Complet</p>
                    )}
                  </button>
                ))}
              </div>
            </Card>

            {/* Time Slots */}
            <Card className="p-6">
              <h3 className="text-gray-900 mb-4">
                Créneaux disponibles - Vendredi 1 Novembre 2025
              </h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <h4 className="text-gray-900">Matin</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {timeSlots.morning.map((slot) => (
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

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <h4 className="text-gray-900">Après-midi</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {timeSlots.afternoon.map((slot) => (
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
              </div>

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

            <div className="flex items-center justify-end gap-3">
              <Button 
                variant="outline"
                onClick={() => onNavigate('booking-provider-selection')}
              >
                Retour
              </Button>
              <Button 
                disabled={!selectedTime}
                onClick={() => onNavigate('booking-payment')}
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
                      <AvatarFallback className="bg-indigo-100 text-indigo-600">
                        KA
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-gray-900">Dr Karim Ayari</p>
                      <p className="text-xs text-gray-500">Médecine Générale</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Type de consultation</p>
                  <Badge>Téléconsultation</Badge>
                </div>

                {selectedTime && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Créneau sélectionné</p>
                    <div className="flex items-center gap-2 text-blue-600">
                      <CalendarIcon className="w-4 h-4" />
                      <span>Vendredi 1 Nov 2025</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-600 mt-1">
                      <Clock className="w-4 h-4" />
                      <span>{selectedTime}</span>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Durée estimée</p>
                  <p className="text-gray-900">15-30 minutes</p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Tarif</p>
                  <p className="text-2xl text-gray-900">45 TND</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="text-gray-900 mb-3">Patient concerné</h3>
              <div className="flex items-center gap-3 mb-4">
                <Avatar>
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    NB
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-gray-900">Nadia Ben Salem</p>
                  <p className="text-xs text-gray-600">34 ans</p>
                </div>
              </div>
              <div className="pt-3 border-t border-blue-200 text-sm">
                <p className="text-gray-700">
                  Le rapport médical détaillé sera partagé avec le Dr Ayari avant la consultation.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-gray-900 mb-3">Avant la consultation</h3>
              <div className="space-y-2 text-sm text-gray-700">
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
                  <p>Ayez votre carte vitale à portée</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
