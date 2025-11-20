import { useState } from 'react';
import { Brain, Heart, Calendar, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Screen } from '../../App';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function SignupPatientStep2({ onNavigate }: Props) {
  const [formData, setFormData] = useState({
    birthDate: '',
    gender: '',
    allergies: [] as string[],
    chronicDiseases: [] as string[],
    receiveReminders: true
  });
  const [allergyInput, setAllergyInput] = useState('');
  const [diseaseInput, setDiseaseInput] = useState('');

  const commonAllergies = ['Pénicilline', 'Arachides', 'Pollen', 'Lactose'];
  const commonDiseases = ['Asthme', 'Diabète', 'Hypertension', 'Aucune'];

  const addAllergy = (allergy: string) => {
    if (allergy && !formData.allergies.includes(allergy)) {
      setFormData({...formData, allergies: [...formData.allergies, allergy]});
      setAllergyInput('');
    }
  };

  const removeAllergy = (allergy: string) => {
    setFormData({...formData, allergies: formData.allergies.filter(a => a !== allergy)});
  };

  const addDisease = (disease: string) => {
    if (disease && !formData.chronicDiseases.includes(disease)) {
      setFormData({...formData, chronicDiseases: [...formData.chronicDiseases, disease]});
      setDiseaseInput('');
    }
  };

  const removeDisease = (disease: string) => {
    setFormData({...formData, chronicDiseases: formData.chronicDiseases.filter(d => d !== disease)});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('auth-email-verification');
  };

  const handleSkip = () => {
    onNavigate('auth-email-verification');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl text-gray-900">HopeVisionAI</span>
          </div>
          <button 
            onClick={() => onNavigate('signup-patient-step1')}
            className="text-gray-600 hover:text-gray-900 text-sm"
          >
            ← Retour
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">
              ✓
            </div>
            <div className="w-16 h-1 bg-blue-600"></div>
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">
              2
            </div>
          </div>
          <p className="text-center text-gray-600 text-sm">Étape 2/2</p>
        </div>

        <Card className="p-8 bg-white">
          {/* Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-green-600" />
          </div>

          {/* Title */}
          <h2 className="text-gray-900 text-center mb-2">
            Vos informations de santé
          </h2>
          <p className="text-gray-600 text-center mb-2">
            (Optionnel)
          </p>
          <p className="text-sm text-gray-500 text-center mb-8">
            Ces données améliorent la pertinence des analyses. Vous pouvez les modifier plus tard.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Birth Date & Gender */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Date de naissance</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Sexe</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="">Sélectionner</option>
                  <option value="F">Femme</option>
                  <option value="M">Homme</option>
                  <option value="O">Autre</option>
                  <option value="N">Préfère ne pas répondre</option>
                </select>
              </div>
            </div>

            {/* Allergies */}
            <div>
              <label className="block text-gray-700 mb-2">Allergies principales</label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {commonAllergies.map(allergy => (
                  <button
                    key={allergy}
                    type="button"
                    onClick={() => addAllergy(allergy)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      formData.allergies.includes(allergy)
                        ? 'bg-red-100 border-red-300 text-red-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-red-300'
                    }`}
                  >
                    {allergy}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAllergy(allergyInput);
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ajouter une allergie..."
                />
                <Button
                  type="button"
                  onClick={() => addAllergy(allergyInput)}
                  variant="outline"
                  className="px-4"
                >
                  Ajouter
                </Button>
              </div>
              {formData.allergies.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {formData.allergies.map(allergy => (
                    <span
                      key={allergy}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                    >
                      {allergy}
                      <button
                        type="button"
                        onClick={() => removeAllergy(allergy)}
                        className="hover:text-red-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Chronic Diseases */}
            <div>
              <label className="block text-gray-700 mb-2">Maladies chroniques</label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {commonDiseases.map(disease => (
                  <button
                    key={disease}
                    type="button"
                    onClick={() => addDisease(disease)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      formData.chronicDiseases.includes(disease)
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    {disease}
                  </button>
                ))}
              </div>
              {formData.chronicDiseases.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {formData.chronicDiseases.map(disease => (
                    <span
                      key={disease}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {disease}
                      <button
                        type="button"
                        onClick={() => removeDisease(disease)}
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Reminders Toggle */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.receiveReminders}
                  onChange={(e) => setFormData({...formData, receiveReminders: e.target.checked})}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                />
                <div>
                  <span className="text-gray-900">Recevoir des rappels de santé</span>
                  <p className="text-sm text-gray-600 mt-1">
                    Vaccins, contrôles périodiques, résultats d'analyse disponibles
                  </p>
                </div>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <Button 
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 py-3"
              >
                Terminer et accéder à mon espace Patient
              </Button>
              <Button 
                type="button"
                variant="outline"
                onClick={handleSkip}
                className="px-8"
              >
                Passer
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
