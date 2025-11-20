import { ArrowLeft, User, Save, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Screen } from '../App';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function DoctorNewPatient({ onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onNavigate('doctor-patient-management')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div className="w-1 h-8 bg-gray-200"></div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-gray-900">Nouveau patient cabinet</h1>
                  <p className="text-xs text-gray-500">Créer un dossier et lancer l'analyse IA</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">
                Annuler
              </Button>
              <Button onClick={() => onNavigate('doctor-patient-file')}>
                <Save className="w-4 h-4 mr-2" />
                Créer et analyser
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-gray-900 mb-6">Informations patient</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lastName">Nom *</Label>
                    <Input id="lastName" placeholder="Ben Salem" className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="firstName">Prénom *</Label>
                    <Input id="firstName" placeholder="Nadia" className="mt-2" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="age">Âge *</Label>
                    <Input id="age" type="number" placeholder="34" className="mt-2" />
                  </div>
                  <div>
                    <Label>Sexe *</Label>
                    <Select>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="f">Féminin</SelectItem>
                        <SelectItem value="m">Masculin</SelectItem>
                        <SelectItem value="o">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="bloodType">Groupe sanguin</Label>
                    <Input id="bloodType" placeholder="A+" className="mt-2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input id="phone" placeholder="+216 XX XXX XXX" className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="patient@example.com" className="mt-2" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Adresse</Label>
                  <Input id="address" placeholder="Tunis, Tunisie" className="mt-2" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-gray-900 mb-6">Antécédents médicaux</h2>
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="medical">Antécédents médicaux</Label>
                  <Textarea 
                    id="medical"
                    placeholder="Ex: Asthme léger, Anémie..."
                    className="mt-2 min-h-[80px]"
                  />
                </div>

                <div>
                  <Label htmlFor="surgical">Antécédents chirurgicaux</Label>
                  <Textarea 
                    id="surgical"
                    placeholder="Ex: Appendicectomie (2018)..."
                    className="mt-2 min-h-[80px]"
                  />
                </div>

                <div>
                  <Label htmlFor="allergies">Allergies connues</Label>
                  <Input 
                    id="allergies"
                    placeholder="Ex: Pénicilline, Latex..."
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="medications">Médicaments en cours</Label>
                  <Textarea 
                    id="medications"
                    placeholder="Liste des traitements actuels..."
                    className="mt-2 min-h-[80px]"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-gray-900 mb-6">Motif de consultation</h2>
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="symptoms">Description des symptômes *</Label>
                  <Textarea 
                    id="symptoms"
                    placeholder="Décrivez les symptômes actuels du patient..."
                    className="mt-2 min-h-[120px]"
                  />
                </div>

                <div>
                  <Label htmlFor="duration">Durée des symptômes</Label>
                  <Input 
                    id="duration"
                    placeholder="Ex: 5 jours"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Urgence perçue</Label>
                  <RadioGroup defaultValue="medium" className="mt-2 space-y-2">
                    <div className="flex items-center space-x-2 p-3 border-2 border-gray-200 rounded-lg">
                      <RadioGroupItem value="low" id="low" />
                      <Label htmlFor="low" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-900">Faible - Consultation de routine</span>
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border-2 border-gray-200 rounded-lg">
                      <RadioGroupItem value="medium" id="medium" />
                      <Label htmlFor="medium" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-900">Modérée - Consultation rapide</span>
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border-2 border-gray-200 rounded-lg">
                      <RadioGroupItem value="high" id="high" />
                      <Label htmlFor="high" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-900">Élevée - Urgence</span>
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-gray-900 mb-2">Analyse IA automatique</h3>
                  <p className="text-sm text-gray-700">
                    Une fois le dossier créé, l'IA analysera automatiquement les symptômes 
                    et proposera un diagnostic préliminaire.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-gray-900 mb-4">Prochaines étapes</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-blue-600">1</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Le patient sera ajouté à votre liste "Patients cabinet"
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-blue-600">2</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    L'IA analysera les symptômes décrits
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-blue-600">3</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Vous pourrez compléter avec l'anamnèse IA et les examens
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-blue-600">4</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Le dossier sera disponible dans le pipeline de décision
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-gray-900 mb-4">Champs requis</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-700">Nom et Prénom</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-700">Âge et Sexe</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-700">Description des symptômes</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
