import { useState } from 'react';
import { Brain, Building2, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Screen } from '../../App';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function SignupHospitalStep2({ onNavigate }: Props) {
  const [formData, setFormData] = useState({
    bedsCount: '',
    specialties: [] as string[],
    objective: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const specialtiesList = [
    'Médecine générale',
    'Urgences',
    'Chirurgie',
    'Cardiologie',
    'Pédiatrie',
    'Gynécologie',
    'Radiologie',
    'Oncologie'
  ];

  const objectives = [
    'Aide à la décision IA',
    'Télémédecine',
    'Recherche clinique',
    'Formation médicale',
    'Gestion administrative',
    'Autre'
  ];

  const toggleSpecialty = (specialty: string) => {
    if (formData.specialties.includes(specialty)) {
      setFormData({...formData, specialties: formData.specialties.filter(s => s !== specialty)});
    } else {
      setFormData({...formData, specialties: [...formData.specialties, specialty]});
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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
          {!submitted && (
            <button onClick={() => onNavigate('signup-hospital-step1')} className="text-gray-600 hover:text-gray-900 text-sm">
              ← Retour
            </button>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {!submitted ? (
          <>
            <div className="mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">✓</div>
                <div className="w-16 h-1 bg-blue-600"></div>
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">2</div>
              </div>
              <p className="text-center text-gray-600 text-sm">Étape 2/2</p>
            </div>

            <Card className="p-8 bg-white">
              <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-8 h-8 text-indigo-600" />
              </div>

              <h2 className="text-gray-900 text-center mb-2">Détails de l'établissement</h2>
              <p className="text-gray-600 text-center mb-8">
                Aidez-nous à personnaliser votre expérience
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-700 mb-2">Nombre de lits (approximatif)</label>
                  <input
                    type="number"
                    value={formData.bedsCount}
                    onChange={(e) => setFormData({...formData, bedsCount: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 250"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Spécialités principales</label>
                  <div className="grid grid-cols-2 gap-3">
                    {specialtiesList.map(specialty => (
                      <button
                        key={specialty}
                        type="button"
                        onClick={() => toggleSpecialty(specialty)}
                        className={`px-4 py-3 border-2 rounded-lg text-sm transition-colors ${
                          formData.specialties.includes(specialty)
                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                            : 'border-gray-300 text-gray-700 hover:border-blue-300'
                        }`}
                      >
                        {specialty}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Objectif principal</label>
                  <select
                    value={formData.objective}
                    onChange={(e) => setFormData({...formData, objective: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  >
                    <option value="">Sélectionnez un objectif</option>
                    {objectives.map(obj => <option key={obj} value={obj}>{obj}</option>)}
                  </select>
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-3">
                  Demander une démo
                </Button>
              </form>
            </Card>
          </>
        ) : (
          <Card className="p-8 bg-white text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>

            <h2 className="text-gray-900 mb-3">Demande envoyée avec succès !</h2>
            <p className="text-gray-600 mb-6">
              Notre équipe commerciale vous contactera dans les prochaines 24h pour organiser une démonstration personnalisée de HopeVisionAI.
            </p>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-6 text-left">
              <h3 className="text-gray-900 mb-3">En attendant :</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">✓</span>
                  <span>Consultez notre <a href="#" className="text-blue-600 hover:underline">documentation technique</a></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">✓</span>
                  <span>Découvrez nos <a href="#" className="text-blue-600 hover:underline">études de cas</a></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">✓</span>
                  <span>Explorez les <a href="#" className="text-blue-600 hover:underline">APIs disponibles</a></span>
                </li>
              </ul>
            </div>

            <Button onClick={() => onNavigate('landing')} className="w-full bg-blue-600 hover:bg-blue-700">
              Retour à l'accueil
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
