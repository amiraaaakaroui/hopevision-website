import { useState } from 'react';
import { Brain, Stethoscope, Building, MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Screen } from '../../App';
import { supabase } from '../../lib/supabaseClient';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function SignupDoctorStep2({ onNavigate }: Props) {
  const [formData, setFormData] = useState({
    specialty: '',
    referralSource: '',
    registrationNumber: '',
    establishment: '',
    city: '',
    country: 'Tunisie',
    practiceType: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const specialties = [
    'Médecine générale',
    'Cardiologie',
    'Pneumologie',
    'Dermatologie',
    'Ophtalmologie',
    'ORL',
    'Radiologie',
    'Neurologie',
    'Pédiatrie',
    'Gynécologie',
    'Psychiatrie',
    'Autre'
  ];

  const referralOptions = ['Google', 'Réseaux sociaux', 'Médecin', 'Hôpital', 'Congrès médical', 'Publication scientifique', 'Autre'];
  const practiceTypes = ['Présentiel', 'Téléconsultation', 'Mixte'];
  const countries = ['Tunisie', 'France', 'Maroc', 'Algérie'];

  const togglePracticeType = (type: string) => {
    if (formData.practiceType.includes(type)) {
      setFormData({ ...formData, practiceType: formData.practiceType.filter(t => t !== type) });
    } else {
      setFormData({ ...formData, practiceType: [...formData.practiceType, type] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Session expirée. Veuillez vous reconnecter.');

      // Get profile ID and verify role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('user_id', user.id)
        .maybeSingle();

      // CRITICAL FIX: If profile doesn't exist, create it with doctor role
      let profileId: string | undefined;
      
      if (profileError || !profile) {
        console.log('[SignupDoctorStep2] Profile does not exist, creating it...');
        const userMetadata = user.user_metadata || {};
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            role: 'doctor',
            full_name: userMetadata.full_name || user.email || 'Utilisateur',
            email: user.email || '',
            country: formData.country || null,
            is_deleted: false
          })
          .select('id, role')
          .single();
        
        if (createError) {
          console.error('[SignupDoctorStep2] Error creating profile:', createError);
          throw new Error('Erreur lors de la création du profil. Veuillez réessayer.');
        }
        
        if (!newProfile) {
          throw new Error('Impossible de créer le profil. Veuillez réessayer.');
        }
        
        profileId = newProfile.id;
        console.log('[SignupDoctorStep2] Profile created:', profileId);
        sessionStorage.setItem('signup-doctor-profile-id', profileId);
      } else {
        // CRITICAL FIX: Verify that profile has doctor role
        if (profile.role !== 'doctor') {
          throw new Error(`Ce compte n'est pas un compte médecin. Rôle actuel: ${profile.role}`);
        }
        profileId = profile.id;
        console.log('[SignupDoctorStep2] Profile found:', profileId);
        sessionStorage.setItem('signup-doctor-profile-id', profileId);
      }

      if (!profileId) {
        throw new Error('Impossible de trouver ou créer le profil. Veuillez recommencer.');
      }

      // Update profiles with country and referral_source
      console.log('[SignupDoctorStep2] Updating profile with country and referral_source...');
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          country: formData.country,
          referral_source: formData.referralSource || null
        })
        .eq('user_id', user.id);

      if (profileUpdateError) {
        console.error('[SignupDoctorStep2] Error updating profile:', profileUpdateError);
        throw new Error(`Erreur lors de la mise à jour du profil: ${profileUpdateError.message}`);
      }
      console.log('[SignupDoctorStep2] Profile updated successfully');

      // Check if doctor_profile exists
      const { data: existingDoctorProfile, error: doctorProfileCheckError } = await supabase
        .from('doctor_profiles')
        .select('id')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (doctorProfileCheckError && doctorProfileCheckError.code !== 'PGRST116') {
        console.error('[SignupDoctorStep2] Error checking doctor profile:', doctorProfileCheckError);
      }

      // Prepare doctor_profiles data
      const doctorProfileData: any = {
        profile_id: profileId,
        specialty: formData.specialty,
        rpps_number: formData.registrationNumber,
        license_number: formData.registrationNumber,
      };
      
      // Add city if provided (column may not exist in some DB schemas)
      if (formData.city) {
        doctorProfileData.city = formData.city;
      }

      // Use UPSERT to handle both INSERT and UPDATE cases
      console.log('[SignupDoctorStep2] Upserting doctor profile data:', doctorProfileData);
      const { error: upsertError } = await supabase
        .from('doctor_profiles')
        .upsert(doctorProfileData, {
          onConflict: 'profile_id',
        })
        .select();

      if (upsertError) {
        console.error('[SignupDoctorStep2] Upsert error:', upsertError);

        // Check if error is about missing column (establishment or city)
        if (upsertError.message?.includes('column') && upsertError.message?.includes('does not exist')) {
          console.warn('[SignupDoctorStep2] Column does not exist, retrying without optional columns...');
          
          // Retry with only core fields (without city)
          const coreDoctorData = {
            profile_id: profileId,
            specialty: formData.specialty,
            rpps_number: formData.registrationNumber,
            license_number: formData.registrationNumber,
          };
          
          const { error: retryError } = await supabase
            .from('doctor_profiles')
            .upsert(coreDoctorData, {
              onConflict: 'profile_id',
            });
            
          if (retryError) {
            // Check for RPPS uniqueness constraint violation
            if (retryError.code === '23505' && retryError.message?.includes('rpps_number')) {
              setError('Ce numéro RPPS est déjà utilisé par un autre compte. Veuillez vérifier votre numéro.');
              setLoading(false);
              return;
            }
            throw retryError;
          }
          
          // Successfully updated without optional columns - warn user
          console.warn('[SignupDoctorStep2] Profile updated successfully, but optional fields (city) were not saved. Consider running database migration.');
        } else if (upsertError.code === '23505' && upsertError.message?.includes('rpps_number')) {
          // Check for RPPS uniqueness constraint violation
          setError('Ce numéro RPPS est déjà utilisé par un autre compte. Veuillez vérifier votre numéro.');
          setLoading(false);
          return; // Don't navigate - let user fix the error
        } else {
          throw new Error(`Erreur lors de la sauvegarde des informations professionnelles: ${upsertError.message}`);
        }
      } else {
        console.log('[SignupDoctorStep2] Doctor profile saved successfully');
      }

      // Store step2 data in sessionStorage for Step 3 (optional metadata)
      const step1Data = sessionStorage.getItem('signup-doctor-step1');
      if (step1Data) {
        const allData = { ...JSON.parse(step1Data), ...formData };
        sessionStorage.setItem('signup-doctor-step2', JSON.stringify(allData));
      }

      onNavigate('signup-doctor-step3');
    } catch (err: any) {
      console.error('Step 2 error:', err);
      setError(err.message || 'Erreur lors de la sauvegarde. Veuillez réessayer.');
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
          <p className="text-gray-600 text-center mb-8">Complétez votre profil médecin</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Specialty Field */}
            <div>
              <label className="block text-gray-700 mb-2">Spécialité principale *</label>
              <select
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
              >
                <option value="">Sélectionnez votre spécialité</option>
                {specialties.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* RPPS Number Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro RPPS / Numéro d'inscription *
              </label>
              <input
                type="text"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="12345678901"
                required
              />
              <p className="mt-1 text-xs text-gray-500">Votre numéro d'inscription au Répertoire Partagé des Professionnels de Santé</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Établissement / Cabinet
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.establishment}
                  onChange={(e) => setFormData({ ...formData, establishment: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Hôpital Central de Tunis"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ville
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tunis"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pays
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {countries.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de pratique
              </label>
              <div className="flex flex-wrap gap-3">
                {practiceTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => togglePracticeType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${formData.practiceType.includes(type)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Referral Source Field - Moved to end as requested */}
            <div>
              <label className="block text-gray-700 mb-2">Comment avez-vous entendu parler de HopeVisionAI ? *</label>
              <select
                value={formData.referralSource}
                onChange={(e) => setFormData({ ...formData, referralSource: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
              >
                <option value="">Sélectionnez une option</option>
                {referralOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
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
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 py-3"
                disabled={loading || !formData.registrationNumber}
              >
                {loading ? 'Enregistrement...' : 'Continuer → Étape 3'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
