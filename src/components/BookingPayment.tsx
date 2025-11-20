import { ArrowLeft, CreditCard, Shield, CheckCircle, Calendar, Clock, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { Screen } from '../App';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function BookingPayment({ onNavigate }: Props) {
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Summary */}
            <Card className="p-6">
              <h3 className="text-gray-900 mb-4">Récapitulatif de la réservation</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-indigo-100 text-indigo-600">
                      KA
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="text-gray-900 mb-1">Dr Karim Ayari</h4>
                    <p className="text-sm text-gray-600 mb-3">Médecine Générale</p>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-4 h-4" />
                        <span>Vendredi 1 Novembre 2025</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="w-4 h-4" />
                        <span>16:00</span>
                      </div>
                      <Badge>Téléconsultation</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl text-gray-900">45 TND</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        NB
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-gray-600">Patient</p>
                      <p className="text-gray-900">Nadia Ben Salem, 34 ans</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Method */}
            <Card className="p-6">
              <h3 className="text-gray-900 mb-4">Mode de paiement</h3>
              
              <RadioGroup defaultValue="card" className="space-y-3">
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
                    placeholder="NADIA BEN SALEM" 
                    className="mt-2"
                  />
                </div>
              </div>
            </Card>

            {/* Terms */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox id="terms" />
                  <Label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer">
                    J'accepte les <span className="text-blue-600">conditions générales</span> et 
                    la <span className="text-blue-600">politique d'annulation</span>
                  </Label>
                </div>
                <div className="flex items-start space-x-3">
                  <Checkbox id="report" defaultChecked />
                  <Label htmlFor="report" className="text-sm text-gray-700 cursor-pointer">
                    Autoriser le partage du rapport médical avec le praticien
                  </Label>
                </div>
                <div className="flex items-start space-x-3">
                  <Checkbox id="reminder" defaultChecked />
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
              >
                Retour
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => onNavigate('booking-confirmation')}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmer et Payer
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
                  <span className="text-gray-900">45 TND</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frais de service</span>
                  <span className="text-gray-900">0 TND</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-900">Total à payer</span>
                  <span className="text-2xl text-gray-900">45 TND</span>
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
            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-gray-900 mb-2">Rapport médical</h3>
                  <p className="text-sm text-gray-700 mb-3">
                    Le rapport complet incluant le diagnostic IA sera automatiquement transmis.
                  </p>
                  <div className="space-y-1 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <span>Diagnostic IA (78%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <span>Anamnèse complète</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <span>Analyses biomédicales</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
