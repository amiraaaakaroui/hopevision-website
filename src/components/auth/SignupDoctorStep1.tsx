import { useState } from 'react';
import { Brain, Stethoscope, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Screen } from '../../App';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function SignupDoctorStep1({ onNavigate }: Props) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    specialty: '',
    referralSource: '',
    confirmProfessional: false
  });
  const [showPassword, setShowPassword] = useState(false);

  const specialties = [
    'Médecine générale',
    'Cardiologie',
    'Pneumologie',
    'Neurologie',
    'Pédiatrie',
    'Gynécologie',
    'Dermatologie',
    'Psychiatrie',
    'Radiologie',
    'Autre'
  ];

  const referralOptions = ['Google', 'Réseaux sociaux', 'Médecin', 'Hôpital', 'Congrès médical', 'Publication scientifique', 'Autre'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password === formData.confirmPassword && formData.confirmProfessional) {
      onNavigate('signup-doctor-step2');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl text-gray-900">HopeVisionAI</span>
          </div>
          <button onClick={() => onNavigate('role-selection')} className="text-gray-600 hover:text-gray-900 text-sm">
            ← Retour
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">1</div>
            <div className="w-12 h-1 bg-gray-300"></div>
            <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center">2</div>
            <div className="w-12 h-1 bg-gray-300"></div>
            <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center">3</div>
          </div>
          <p className="text-center text-gray-600 text-sm">Étape 1/3</p>
        </div>

        <Card className="p-8 bg-white">
          <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Stethoscope className="w-8 h-8 text-blue-600" />
          </div>

          <h2 className="text-gray-900 text-center mb-2">Créer mon compte Médecin</h2>
          <p className="text-gray-600 text-center mb-8">Rejoignez la communauté médicale HopeVisionAI</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Prénom</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Karim" required />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Nom</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ayari" required />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">E-mail professionnel</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="dr.ayari@hopital.tn" required />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" minLength={8} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Confirmer</label>
                <input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" required />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Spécialité principale</label>
              <select value={formData.specialty} onChange={(e) => setFormData({...formData, specialty: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" required>
                <option value="">Sélectionnez votre spécialité</option>
                {specialties.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Comment avez-vous entendu parler de HopeVisionAI ?</label>
              <select value={formData.referralSource} onChange={(e) => setFormData({...formData, referralSource: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" required>
                <option value="">Sélectionnez une option</option>
                {referralOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={formData.confirmProfessional} onChange={(e) => setFormData({...formData, confirmProfessional: e.target.checked})} className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1" required />
                <span className="text-sm text-gray-700">
                  Je confirme être un professionnel de santé autorisé à exercer.
                </span>
              </label>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-3" disabled={!formData.confirmProfessional || formData.password !== formData.confirmPassword}>
              Continuer → Étape 2
            </Button>
          </form>

          <p className="text-center text-gray-600 text-sm mt-6">
            Vous avez déjà un compte ?{' '}
            <button onClick={() => onNavigate('auth-login-doctor')} className="text-blue-600 hover:text-blue-700">Se connecter</button>
          </p>
        </Card>
      </div>
    </div>
  );
}
