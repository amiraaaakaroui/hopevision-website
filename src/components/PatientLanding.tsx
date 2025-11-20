import { Heart, Brain, Shield, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Screen } from '../App';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function PatientLanding({ onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-gray-900">HopeVisionAI</h1>
              <p className="text-xs text-gray-500">Aide à la décision médicale</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => onNavigate('patient-history')}>
            Se connecter
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full mb-6">
              <Shield className="w-4 h-4" />
              <span className="text-sm">Conforme RGPD & HDS</span>
            </div>
            <h2 className="text-gray-900 mb-4">
              Votre santé, notre priorité
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Une plateforme d'aide à la décision médicale multimodale qui analyse vos symptômes 
              par texte, voix et image pour vous orienter vers les meilleurs soins.
            </p>
            <div className="flex gap-4">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => onNavigate('patient-consent')}
              >
                Commencer ma pré-analyse
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => onNavigate('patient-history')}>
                Se connecter
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 p-8 flex items-center justify-center">
              <div className="relative">
                <Heart className="w-32 h-32 text-blue-600" />
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <Brain className="w-8 h-8 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-gray-900 mb-2">IA Multimodale</h3>
            <p className="text-gray-600">
              Analysez vos symptômes par texte, voix ou image pour un diagnostic précis.
            </p>
          </Card>

          <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-gray-900 mb-2">Suivi Personnalisé</h3>
            <p className="text-gray-600">
              Accédez à votre historique médical et recevez des rappels intelligents.
            </p>
          </Card>

          <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-gray-900 mb-2">Sécurité Maximale</h3>
            <p className="text-gray-600">
              Vos données sont chiffrées et conformes aux normes RGPD et HDS.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
