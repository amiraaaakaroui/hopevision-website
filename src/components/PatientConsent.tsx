import { Brain, Globe, Shield, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Screen } from '../App';
import { useState } from 'react';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function PatientConsent({ onNavigate }: Props) {
  const [rgpdConsent, setRgpdConsent] = useState(false);
  const [dataConsent, setDataConsent] = useState(false);
  const [language, setLanguage] = useState('fr');

  const canProceed = rgpdConsent && dataConsent;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-gray-900">HopeVisionAI</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Étape 1 sur 4</span>
            <span className="text-sm text-gray-600">Consentement</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-blue-600 rounded-full" style={{ width: '25%' }}></div>
          </div>
        </div>

        <Card className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-gray-900">Consentement et Préférences</h2>
              <p className="text-gray-600">Vos données sont protégées et sécurisées</p>
            </div>
          </div>

          {/* Language Selection */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <Label className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-gray-600" />
              Langue de l'interface
            </Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">🇫🇷 Français</SelectItem>
                <SelectItem value="en">🇬🇧 English</SelectItem>
                <SelectItem value="ar">🇹🇳 العربية</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Consent Checkboxes */}
          <div className="space-y-6">
            <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Checkbox 
                id="rgpd" 
                checked={rgpdConsent}
                onCheckedChange={(checked) => setRgpdConsent(checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor="rgpd" className="cursor-pointer text-gray-900">
                  J'accepte la politique de confidentialité et le traitement de mes données (RGPD)
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Vos données personnelles et médicales sont chiffrées, stockées de manière sécurisée 
                  et ne seront jamais partagées sans votre consentement explicite.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Checkbox 
                id="data" 
                checked={dataConsent}
                onCheckedChange={(checked) => setDataConsent(checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor="data" className="cursor-pointer text-gray-900">
                  J'autorise l'utilisation de mes données anonymisées pour améliorer l'IA
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Vos données seront totalement anonymisées et utilisées uniquement pour améliorer 
                  la précision des modèles d'intelligence artificielle.
                </p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="mb-1">
                  HopeVisionAI est conforme aux normes RGPD et certifié HDS (Hébergeur de Données de Santé).
                </p>
                <p>
                  Vous pouvez demander l'accès, la modification ou la suppression de vos données à tout moment.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-8">
            <Button variant="outline" onClick={() => onNavigate('patient-landing')}>
              Retour
            </Button>
            <Button 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={!canProceed}
              onClick={() => onNavigate('patient-symptoms')}
            >
              Continuer
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
