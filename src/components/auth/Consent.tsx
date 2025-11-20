import { Brain, Shield, Lock, Eye, Database, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Screen } from '../../App';

interface Props {
  onNavigate: (screen: Screen) => void;
  userType?: 'patient' | 'doctor' | 'hospital';
}

export function Consent({ onNavigate, userType = 'patient' }: Props) {
  const handleAccept = () => {
    // Navigate to appropriate dashboard based on user type
    if (userType === 'patient') {
      onNavigate('patient-landing');
    } else if (userType === 'doctor') {
      onNavigate('doctor-dashboard');
    } else {
      onNavigate('admin-dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl text-gray-900">HopeVisionAI</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Card className="p-8 md:p-12 bg-white">
          {/* Icon */}
          <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-blue-600" />
          </div>

          {/* Title */}
          <h1 className="text-gray-900 text-center mb-3">
            Votre confidentialité avant tout
          </h1>
          <p className="text-xl text-gray-600 text-center mb-12">
            Comprendre comment nous protégeons vos données de santé
          </p>

          {/* Commitments Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-gray-900 mb-2">Chiffrement de bout en bout</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Toutes vos données sont chiffrées avec les dernières technologies (AES-256) 
                avant d'être stockées. Même nous ne pouvons pas y accéder sans autorisation.
              </p>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-xl p-6">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <Database className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-gray-900 mb-2">Hébergement certifié HDS</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Vos données de santé sont hébergées sur des serveurs en France, certifiés 
                Hébergeur de Données de Santé (HDS) et conformes RGPD.
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-100 rounded-xl p-6">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-gray-900 mb-2">IA transparente</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Notre intelligence artificielle fournit des explications claires pour chaque 
                analyse. Vous gardez toujours le contrôle de vos informations.
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-100 rounded-xl p-6">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-gray-900 mb-2">Aide à la décision uniquement</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                L'IA ne remplace jamais le médecin. Elle propose des analyses pour aider 
                les professionnels de santé, la décision finale leur appartient toujours.
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
            <h3 className="text-gray-900 mb-4">Vos droits :</h3>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span><strong>Accès :</strong> Consultez toutes vos données à tout moment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span><strong>Rectification :</strong> Modifiez vos informations personnelles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span><strong>Suppression :</strong> Demandez la suppression de votre compte et de vos données</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span><strong>Portabilité :</strong> Récupérez vos données dans un format standard</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span><strong>Opposition :</strong> Refusez l'utilisation de vos données pour certains traitements</span>
              </li>
            </ul>
          </div>

          {/* Important Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
            <p className="text-sm text-yellow-900">
              <strong>Important :</strong> HopeVisionAI est une plateforme de démonstration et ne doit pas être utilisée 
              pour collecter des données de santé réelles sans supervision médicale appropriée.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={handleAccept}
              className="flex-1 bg-blue-600 hover:bg-blue-700 py-4"
            >
              J'accepte et continuer
            </Button>
            <Button 
              variant="outline"
              className="sm:w-48"
              onClick={() => window.open('#', '_blank')}
            >
              Lire la politique complète
            </Button>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-gray-500 text-center mt-6">
            En continuant, vous acceptez nos{' '}
            <a href="#" className="text-blue-600 hover:underline">Conditions d'utilisation</a>
            {' '}et notre{' '}
            <a href="#" className="text-blue-600 hover:underline">Politique de confidentialité</a>
          </p>
        </Card>
      </div>
    </div>
  );
}
