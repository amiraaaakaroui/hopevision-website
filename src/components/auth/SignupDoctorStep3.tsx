import { useState } from 'react';
import { Brain, Stethoscope, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Screen } from '../../App';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function SignupDoctorStep3({ onNavigate }: Props) {
  const [preferences, setPreferences] = useState({
    receiveAICases: true,
    participateCollaboration: true,
    visibleToPatients: false
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      onNavigate('auth-email-verification');
    }, 3000);
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
            <button onClick={() => onNavigate('signup-doctor-step2')} className="text-gray-600 hover:text-gray-900 text-sm">
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
                <div className="w-12 h-1 bg-blue-600"></div>
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">✓</div>
                <div className="w-12 h-1 bg-blue-600"></div>
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">3</div>
              </div>
              <p className="text-center text-gray-600 text-sm">Étape 3/3</p>
            </div>

            <Card className="p-8 bg-white">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Stethoscope className="w-8 h-8 text-blue-600" />
              </div>

              <h2 className="text-gray-900 text-center mb-2">Préférences de collaboration</h2>
              <p className="text-gray-600 text-center mb-8">Personnalisez votre expérience HopeVisionAI</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.receiveAICases}
                        onChange={(e) => setPreferences({...preferences, receiveAICases: e.target.checked})}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                      />
                      <div>
                        <span className="text-gray-900">Recevoir des cas pré-analysés par l'IA</span>
                        <p className="text-sm text-gray-600 mt-1">
                          Gagnez du temps avec des diagnostics préliminaires et des recommandations intelligentes
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.participateCollaboration}
                        onChange={(e) => setPreferences({...preferences, participateCollaboration: e.target.checked})}
                        className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 mt-1"
                      />
                      <div>
                        <span className="text-gray-900">Participer au hub de collaboration médicale</span>
                        <p className="text-sm text-gray-600 mt-1">
                          Échangez avec vos pairs et obtenez des avis spécialisés sur des cas complexes
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.visibleToPatients}
                        onChange={(e) => setPreferences({...preferences, visibleToPatients: e.target.checked})}
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-1"
                      />
                      <div>
                        <span className="text-gray-900">Être visible pour les patients en recherche de spécialiste</span>
                        <p className="text-sm text-gray-600 mt-1">
                          Apparaissez dans les recommandations de médecins pour élargir votre patientèle
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-3">
                  Valider mon compte
                </Button>
              </form>
            </Card>
          </>
        ) : (
          <Card className="p-8 bg-white text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>

            <h2 className="text-gray-900 mb-3">Compte créé avec succès !</h2>
            <p className="text-gray-600 mb-6">
              Votre compte sera vérifié par notre équipe dans les prochaines heures.
              Vous pouvez déjà explorer votre espace Médecin.
            </p>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                💡 Vous recevrez un e-mail de confirmation une fois votre compte validé par nos équipes.
              </p>
            </div>

            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-sm text-gray-500 mt-3">Redirection en cours...</p>
          </Card>
        )}
      </div>
    </div>
  );
}
