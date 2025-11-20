import { useState } from 'react';
import { Brain, Stethoscope, Upload, Building, MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Screen } from '../../App';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function SignupDoctorStep2({ onNavigate }: Props) {
  const [formData, setFormData] = useState({
    registrationNumber: '',
    establishment: '',
    city: '',
    country: 'Tunisie',
    practiceType: [] as string[]
  });

  const practiceTypes = ['Présentiel', 'Téléconsultation', 'Mixte'];
  const countries = ['Tunisie', 'France', 'Maroc', 'Algérie'];

  const togglePracticeType = (type: string) => {
    if (formData.practiceType.includes(type)) {
      setFormData({...formData, practiceType: formData.practiceType.filter(t => t !== type)});
    } else {
      setFormData({...formData, practiceType: [...formData.practiceType, type]});
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('signup-doctor-step3');
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
          <button onClick={() => onNavigate('signup-doctor-step1')} className="text-gray-600 hover:text-gray-900 text-sm">
            ← Retour
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">✓</div>
            <div className="w-12 h-1 bg-blue-600"></div>
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">2</div>
            <div className="w-12 h-1 bg-gray-300"></div>
            <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center">3</div>
          </div>
          <p className="text-center text-gray-600 text-sm">Étape 2/3</p>
        </div>

        <Card className="p-8 bg-white">
          <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Stethoscope className="w-8 h-8 text-blue-600" />
          </div>

          <h2 className="text-gray-900 text-center mb-2">Informations professionnelles</h2>
          <p className="text-gray-600 text-center mb-8">Ces informations permettent de vérifier votre identité</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-700 mb-2">Numéro d'inscription à l'Ordre / Conseil</label>
              <input
                type="text"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 12345678"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Établissement principal</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.establishment}
                  onChange={(e) => setFormData({...formData, establishment: e.target.value})}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="CHU, Clinique, Cabinet..."
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Ville</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tunis"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Pays</label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Type de pratique</label>
              <div className="flex gap-3">
                {practiceTypes.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => togglePracticeType(type)}
                    className={`flex-1 px-4 py-3 border-2 rounded-lg transition-colors ${
                      formData.practiceType.includes(type)
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Justificatif professionnel</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-700 mb-1">Téléverser un justificatif</p>
                <p className="text-sm text-gray-500">Carte professionnelle, attestation d'exercice...</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onNavigate('signup-doctor-step1')}
                className="flex-1"
              >
                ← Retour
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                Continuer → Étape 3
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
