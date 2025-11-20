import { CheckCircle, Calendar, Clock, Video, Download, Share2, ArrowRight, FileText, Bell } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { Screen } from '../App';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function BookingConfirmation({ onNavigate }: Props) {
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
                <p className="text-xs text-gray-500">Référence: #RDV-2025-00234</p>
              </div>
            </div>
            <Button onClick={() => onNavigate('doctor-dashboard')}>
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
              La patiente Nadia Ben Salem a reçu une notification avec tous les détails. 
              Le rapport médical a été automatiquement partagé avec le Dr Ayari.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Badge className="bg-green-600">Paiement confirmé</Badge>
              <Badge className="bg-blue-600">Rapport partagé</Badge>
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
                    <AvatarFallback className="bg-indigo-100 text-indigo-600 text-lg">
                      KA
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="text-gray-900 mb-1">Dr Karim Ayari</h4>
                    <p className="text-sm text-gray-600 mb-3">Médecine Générale</p>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Calendar className="w-4 h-4" />
                        <span>Vendredi 1 Novembre 2025</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Clock className="w-4 h-4" />
                        <span>16:00 - 16:30</span>
                      </div>
                      <Badge>
                        <Video className="w-3 h-3 mr-1" />
                        Téléconsultation
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
                        NB
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-gray-900">Nadia Ben Salem</p>
                      <p className="text-sm text-gray-600">34 ans • ID: PAT-2025-00234</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-gray-900 mb-3">Contexte médical partagé</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">Diagnostic IA: Pneumonie atypique</p>
                        <p className="text-xs text-gray-600">Confiance: 78%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">Anamnèse complète IA</p>
                        <p className="text-xs text-gray-600">5 questions • 100% complété</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">Analyses biomédicales</p>
                        <p className="text-xs text-gray-600">CRP 38 mg/L, Température 38.4°C</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">Rapport détaillé XAI</p>
                        <p className="text-xs text-gray-600">Multimodal (Texte, Voix, Bio)</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-gray-900 mb-3">Instructions pour le patient</h4>
                  <Card className="p-4 bg-yellow-50 border-yellow-200">
                    <div className="space-y-2 text-sm text-gray-700">
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
                  onClick={() => onNavigate('booking-service-selection')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-gray-900">Réserver des examens de laboratoire</p>
                      <p className="text-sm text-gray-600">Radiographie thoracique recommandée</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-600" />
                </button>
                
                <button 
                  className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
                  onClick={() => onNavigate('booking-service-selection')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-gray-900">Consultation de suivi (J+7)</p>
                      <p className="text-sm text-gray-600">Contrôle après traitement</p>
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
                <Button className="w-full" variant="outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager avec le patient
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => onNavigate('patient-timeline')}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Voir la timeline patient
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="text-gray-900 mb-3">Référence de réservation</h3>
              <div className="text-center mb-4">
                <p className="text-3xl text-blue-600 tracking-wide">#RDV-2025-00234</p>
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
                  <span className="text-gray-900">45 TND</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mode</span>
                  <span className="text-gray-900">Carte bancaire</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Statut</span>
                  <Badge className="bg-green-600">Confirmé</Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID</span>
                  <span className="text-gray-900 text-xs">TXN-2025-45678</span>
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
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>SMS avec lien vidéo</span>
                </div>
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
