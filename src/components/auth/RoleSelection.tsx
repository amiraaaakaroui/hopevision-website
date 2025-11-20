import { Brain, Stethoscope, Building2, Heart, Activity, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Screen } from '../../App';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function RoleSelection({ onNavigate }: Props) {
  const roles = [
    {
      id: 'patient',
      icon: Heart,
      title: 'Patient',
      description: 'Suivi et pré-analyse de vos symptômes',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      hoverBorder: 'hover:border-green-400'
    },
    {
      id: 'doctor',
      icon: Stethoscope,
      title: 'Professionnel de Santé',
      description: 'Diagnostic assisté par IA',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      hoverBorder: 'hover:border-blue-400'
    },
    {
      id: 'hospital',
      icon: Building2,
      title: 'Hôpital / Clinique',
      description: 'Supervision de votre établissement',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      hoverBorder: 'hover:border-indigo-400'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-gray-900">HopeVisionAI</h1>
              <p className="text-xs text-gray-500">Aide à la décision médicale</p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('landing')}
            className="text-gray-600 hover:text-gray-900 text-sm"
          >
            ← Retour au site
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-gray-900 mb-4">
            Accédez à votre espace HopeVisionAI
          </h2>
          <p className="text-xl text-gray-600">
            Choisissez votre profil pour continuer
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {roles.map((role) => (
            <Card 
              key={role.id}
              className={`p-8 ${role.borderColor} ${role.hoverBorder} border-2 transition-all cursor-pointer hover:shadow-lg group`}
            >
              <div className={`w-16 h-16 ${role.bgColor} rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform`}>
                <role.icon className={`w-8 h-8 ${role.color}`} />
              </div>
              <h3 className="text-gray-900 text-center mb-3">
                {role.title}
              </h3>
              <p className="text-gray-600 text-center mb-6">
                {role.description}
              </p>
              <div className="space-y-3">
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    if (role.id === 'patient') onNavigate('auth-login-patient');
                    if (role.id === 'doctor') onNavigate('auth-login-doctor');
                    if (role.id === 'hospital') onNavigate('auth-login-hospital');
                  }}
                >
                  Se connecter
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (role.id === 'patient') onNavigate('signup-patient-step1');
                    if (role.id === 'doctor') onNavigate('signup-doctor-step1');
                    if (role.id === 'hospital') onNavigate('signup-hospital-step1');
                  }}
                >
                  Créer un compte
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Security Notice */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-gray-900 mb-2">Vos données sont protégées</h4>
              <p className="text-gray-600 text-sm">
                Toutes vos données de santé sont chiffrées et hébergées sur des serveurs certifiés HDS 
                en stricte conformité avec le RGPD.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
