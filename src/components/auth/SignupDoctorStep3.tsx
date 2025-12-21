import { useState, useEffect } from 'react';
import { Brain, Stethoscope, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Screen } from '../../App';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  onNavigate: (screen: Screen) => void;
}

interface DoctorSignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  specialty: string;
  registrationNumber: string;
  establishment: string;
  city: string;
  country: string;
  practiceType: string[];
}

export function SignupDoctorStep3({ onNavigate }: Props) {
  const { currentProfile, authUser } = useAuth();
  const [preferences, setPreferences] = useState({
    receiveAICases: true,
    participateCollaboration: true,
    visibleToPatients: false
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupData, setSignupData] = useState<DoctorSignupData | null>(null);

  useEffect(() => {
    // Load doctor data from database instead of sessionStorage
    const loadDoctorData = async () => {
      if (!authUser) {
        setError('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      try {
        // Get profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*, doctor_profiles(*)')
          .eq('user_id', authUser.id)
          .single();

        if (profileError || !profile) {
          setError('Profil non trouvé. Veuillez recommencer.');
          return;
        }

        // Construct signup data from DB
        const nameParts = (profile.full_name || '').split(' ');
        const dbData: DoctorSignupData = {
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: profile.email || '',
          password: '', // Not needed for Step 3
          specialty: profile.doctor_profiles?.specialty || '',
          registrationNumber: profile.doctor_profiles?.rpps_number || '',
          establishment: '',  // Not stored in DB
          city: '',  // Not stored in DB
          country: profile.country || 'Tunisie',
          practiceType: [],  // Not stored in DB
        };

        setSignupData(dbData);
      } catch (err) {
        console.error('Error loading doctor data:', err);
        setError('Erreur lors du chargement des données.');
      }
    };

    loadDoctorData();
  }, [authUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupData || !authUser) {
      setError('Session expirée. Veuillez recommencer.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get profile ID from sessionStorage (set in Step1) or from currentProfile
      let profileId: string | undefined;

      const storedProfileId = sessionStorage.getItem('signup-doctor-profile-id');
      if (storedProfileId) {
        profileId = storedProfileId;
      } else if (currentProfile?.profile?.id) {
        profileId = currentProfile.profile.id;
      } else {
        // Fallback: query for the profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', authUser.id)
          .single();

        if (profileError) throw new Error('Profil non trouvé. Veuillez recommencer.');
        profileId = profile.id;
      }

      if (!profileId) {
        throw new Error('Impossible de trouver le profil. Veuillez recommencer.');
      }

      // Step 3 is for preferences only - Step 2 already saved rpps_number
      // No need to update profiles.country (already done in Step 2)

      // Update doctor_profiles with preferences only (if you have preference fields)
      // For now, just ensure the doctor_profile exists (created by trigger in Step 1)
      const { data: existingDoctorProfile } = await supabase
        .from('doctor_profiles')
        .select('id')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (!existingDoctorProfile) {
        // Edge case: if doctor_profile doesn't exist, create it
        // This shouldn't happen if trigger worked, but handle gracefully
        const { error: doctorProfileError } = await supabase
          .from('doctor_profiles')
          .insert({
            profile_id: profileId,
            specialty: signupData.specialty || 'Médecine Générale',
            is_verified: false,
          });

        if (doctorProfileError) throw doctorProfileError;
      }

      // TODO: If you add preference fields to doctor_profiles (e.g., ai_assistance_enabled, collaboration_enabled)
      // Update them here:
      // await supabase
      //   .from('doctor_profiles')
      //   .update({ ai_assistance_enabled: preferences.aiAssistance })
      //   .eq('profile_id', profileId);

      // Clear sessionStorage
      sessionStorage.removeItem('signup-doctor-step1');
      sessionStorage.removeItem('signup-doctor-step2');
      sessionStorage.removeItem('signup-doctor-profile-id');

      setSubmitted(true);
      // Navigate to dashboard after brief delay
      setTimeout(() => {
        onNavigate('doctor-dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('Signup Step 3 error:', err);
      setError(err.message || 'Erreur lors de la sauvegarde des informations. Veuillez réessayer.');
    } finally {
      setLoading(false);
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

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.receiveAICases}
                        onChange={(e) => setPreferences({ ...preferences, receiveAICases: e.target.checked })}
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
                        onChange={(e) => setPreferences({ ...preferences, participateCollaboration: e.target.checked })}
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
                        onChange={(e) => setPreferences({ ...preferences, visibleToPatients: e.target.checked })}
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

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 py-3"
                  disabled={loading}
                >
                  {loading ? 'Création du compte...' : 'Valider mon compte'}
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
