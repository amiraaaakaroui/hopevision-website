import { useState, useEffect } from 'react';
import { Brain, Heart, Calendar, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Screen } from '../../App';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  onNavigate: (screen: Screen) => void;
}

interface Step1Data {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  country: string;
  referralSource: string;
  acceptTerms: boolean;
}

export function SignupPatientStep2({ onNavigate }: Props) {
  const { currentProfile, authUser } = useAuth();
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load existing profile data if available (for editing or completing profile)
    const loadExistingProfile = async () => {
      // Wait a bit for auth to initialize after email confirmation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check auth again after delay
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        // No session - redirect to login silently (don't show error)
        onNavigate('auth-login-patient');
        return;
      }

      if (!currentProfile?.patientProfileId) {
        // Profile not loaded yet, wait a bit more
        setTimeout(() => {
          loadExistingProfile();
        }, 500);
        return;
      }

      try {
        // Load patient profile
        const { data: patientProfile } = await supabase
          .from('patient_profiles')
          .select('*')
          .eq('id', currentProfile.patientProfileId)
          .single();

        // Load profile for date_of_birth
        const { data: profile } = await supabase
          .from('profiles')
          .select('date_of_birth')
          .eq('id', currentProfile.profile.id)
          .single();

        if (patientProfile && profile) {
          // Pre-fill form with existing data
          setFormData({
            birthDate: profile.date_of_birth || '',
            gender: patientProfile.gender === 'female' ? 'F' : patientProfile.gender === 'male' ? 'M' : patientProfile.gender === 'other' ? 'O' : '',
            allergies: patientProfile.allergies || [],
            chronicDiseases: patientProfile.medical_history ? patientProfile.medical_history.split(', ') : [],
            receiveReminders: true,
            bloodGroup: patientProfile.blood_group || '',
            weight: patientProfile.weight_kg?.toString() || '',
            height: patientProfile.height_cm?.toString() || '',
          });
        }
      } catch (error) {
        // Silently fail - form will start empty
      }
    };

    // Load step1 data from sessionStorage (may not exist if coming from login/edit)
    const stored = sessionStorage.getItem('signup-patient-step1');
    if (stored) {
      try {
        setStep1Data(JSON.parse(stored));
      } catch (e) {
        // Invalid JSON, ignore
      }
    }

    // Load existing profile data (with delay to allow auth to initialize)
    const timer = setTimeout(() => {
      loadExistingProfile();
    }, 300);

    return () => clearTimeout(timer);
  }, [onNavigate, authUser, currentProfile]);
  const [formData, setFormData] = useState({
    birthDate: '',
    gender: '',
    allergies: [] as string[],
    chronicDiseases: [] as string[],
    receiveReminders: true,
    bloodGroup: '',
    weight: '',
    height: ''
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check session before proceeding
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setError('Veuillez vous connecter pour continuer.');
      setTimeout(() => onNavigate('auth-login-patient'), 2000);
      return;
    }

    // Validate required fields
    if (!formData.birthDate || !formData.gender) {
      setError('Veuillez remplir les champs obligatoires (Date de naissance et Sexe).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get profile ID from sessionStorage (set in Step1 or OAuth callback) or from currentProfile
      let profileId: string | undefined;
      
      // First, try sessionStorage (set by Step1 or OAuth callback in App.tsx)
      const storedProfileId = sessionStorage.getItem('signup-patient-profile-id');
      if (storedProfileId) {
        profileId = storedProfileId;
        console.log('[SignupPatientStep2] Using profileId from sessionStorage:', profileId);
      } else if (currentProfile?.profile?.id) {
        // Second, try currentProfile from useAuth hook
        profileId = currentProfile.profile.id;
        console.log('[SignupPatientStep2] Using profileId from currentProfile:', profileId);
        // Store it in sessionStorage for future use
        sessionStorage.setItem('signup-patient-profile-id', profileId);
      } else {
        // Fallback: query for the profile directly from database
        console.log('[SignupPatientStep2] ProfileId not found, querying database...');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('user_id', authUser.id)
          .eq('is_deleted', false)
          .single();
        
        if (profileError) {
          console.error('[SignupPatientStep2] Error fetching profile:', profileError);
          
          // If profile doesn't exist, create it (for Google OAuth users who skipped Step1)
          if (profileError.code === 'PGRST116') {
            console.log('[SignupPatientStep2] Profile does not exist, creating it...');
            const userMetadata = authUser.user_metadata || {};
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                user_id: authUser.id,
                role: 'patient',
                full_name: userMetadata.full_name || authUser.email || 'Utilisateur',
                email: authUser.email || '',
                country: userMetadata.country || null,
                is_deleted: false
              })
              .select('id')
              .single();
            
            if (createError) {
              console.error('[SignupPatientStep2] Error creating profile:', createError);
              throw new Error('Erreur lors de la création du profil. Veuillez réessayer.');
            }
            
            if (!newProfile) {
              throw new Error('Impossible de créer le profil. Veuillez réessayer.');
            }
            
            profileId = newProfile.id;
            console.log('[SignupPatientStep2] Profile created:', profileId);
            sessionStorage.setItem('signup-patient-profile-id', profileId);
            
            // Create patient_profile
            const { error: patientProfileError } = await supabase
              .from('patient_profiles')
              .insert({ profile_id: profileId })
              .select('id')
              .single();
            
            if (patientProfileError && patientProfileError.code !== '23505') {
              // 23505 = duplicate key, which is OK
              console.error('[SignupPatientStep2] Error creating patient_profile:', patientProfileError);
            }
          } else {
            throw new Error('Profil non trouvé. Veuillez recommencer.');
          }
        } else if (profile) {
          // CRITICAL FIX: Check and correct role if wrong
          if (profile.role !== 'patient') {
            console.error('[SignupPatientStep2] Profile has wrong role:', profile.role, 'Expected: patient. Attempting to fix...');
            
            // Try to update the role to patient
            const { error: roleUpdateError } = await supabase
              .from('profiles')
              .update({ role: 'patient' })
              .eq('user_id', authUser.id);
            
            if (roleUpdateError) {
              console.error('[SignupPatientStep2] Error updating role to patient:', roleUpdateError);
              throw new Error(`Ce compte existe déjà avec le rôle ${profile.role}. Veuillez utiliser un autre email ou contacter le support.`);
            }
            
            // If it was a doctor profile, delete it and create patient profile
            if (profile.role === 'doctor') {
              await supabase.from('doctor_profiles').delete().eq('profile_id', profile.id);
              
              // Check if patient_profile exists, create if not
              const { data: existingPatientProfile } = await supabase
                .from('patient_profiles')
                .select('id')
                .eq('profile_id', profile.id)
                .maybeSingle();
              
              if (!existingPatientProfile) {
                await supabase
                  .from('patient_profiles')
                  .insert({ profile_id: profile.id })
                  .select('id')
                  .maybeSingle();
              }
            }
            
            console.log('[SignupPatientStep2] Profile role corrected to patient');
          }
          
          profileId = profile.id;
          console.log('[SignupPatientStep2] Profile found in database:', profileId);
          sessionStorage.setItem('signup-patient-profile-id', profileId);
        }
      }

      if (!profileId) {
        throw new Error('Impossible de trouver ou créer le profil. Veuillez recommencer.');
      }
      
      console.log('[SignupPatientStep2] Using profileId:', profileId);

      // 1. Update profiles with date_of_birth (required field)
      // RLS policy allows UPDATE when user_id = auth.uid()
      console.log('[SignupPatientStep2] Updating profile with date_of_birth...');
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ date_of_birth: formData.birthDate })
        .eq('user_id', authUser.id); // RLS requires user_id = auth.uid()

      if (profileUpdateError) {
        console.error('[SignupPatientStep2] Error updating profile:', profileUpdateError);
        throw new Error(`Erreur lors de la mise à jour du profil: ${profileUpdateError.message}`);
      }
      console.log('[SignupPatientStep2] Profile updated successfully');

      // 2. Upsert patient_profiles with health info (avoids duplicate key error)
      // RLS policy allows INSERT/UPDATE when profile_id belongs to current user
      const patientProfileData: any = {
        profile_id: profileId, // Always include profile_id for upsert
      };

      if (formData.gender) {
        patientProfileData.gender = formData.gender === 'F' ? 'female' : formData.gender === 'M' ? 'male' : formData.gender === 'O' ? 'other' : null;
      }
      if (formData.bloodGroup) {
        patientProfileData.blood_group = formData.bloodGroup;
      }
      if (formData.weight) {
        patientProfileData.weight_kg = parseFloat(formData.weight);
      }
      if (formData.height) {
        patientProfileData.height_cm = parseFloat(formData.height);
      }
      if (formData.allergies && formData.allergies.length > 0) {
        patientProfileData.allergies = formData.allergies;
      }
      if (formData.chronicDiseases && formData.chronicDiseases.length > 0) {
        patientProfileData.medical_history = formData.chronicDiseases.join(', ');
      }

      // Use upsert to avoid duplicate key error
      // If row exists → UPDATE, if not → INSERT
      // RLS policy allows both operations when profile_id = get_user_profile()
      console.log('[SignupPatientStep2] Upserting patient profile data:', patientProfileData);
      const { error: patientProfileError, data: patientProfileResult } = await supabase
        .from('patient_profiles')
        .upsert(patientProfileData, {
          onConflict: 'profile_id', // Use unique constraint on profile_id
        })
        .select();

      if (patientProfileError) {
        console.error('[SignupPatientStep2] Error upserting patient profile:', patientProfileError);
        throw new Error(`Erreur lors de la sauvegarde des informations médicales: ${patientProfileError.message}`);
      }
      console.log('[SignupPatientStep2] Patient profile saved successfully:', patientProfileResult);

      // Create a timeline event for profile completion
      if (currentProfile?.patientProfileId) {
        await supabase
          .from('timeline_events')
          .insert({
            patient_profile_id: currentProfile.patientProfileId,
            event_type: 'profile_completion',
            event_title: 'Inscription sur HopeVisionAI',
            event_description: 'Profil complété avec succès',
            event_date: new Date().toISOString(),
            status: 'completed',
          })
          .select('id')
          .maybeSingle();
      }

      // Clear sessionStorage
      sessionStorage.removeItem('signup-patient-step1');
      sessionStorage.removeItem('signup-patient-profile-id');
      sessionStorage.removeItem('signup-patient-pending-confirmation');

      // Navigate to patient history - App.tsx will handle auth state refresh
      onNavigate('patient-history');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde des informations. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
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
            onClick={() => {
              // If coming from signup flow, go back to step1; otherwise go to dashboard
              const pendingSignup = sessionStorage.getItem('signup-patient-step1');
              if (pendingSignup) {
                onNavigate('signup-patient-step1');
              } else {
                onNavigate('patient-history');
              }
            }}
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
            Complétez votre profil
          </h2>
          <p className="text-gray-600 text-center mb-2">
            Informations de santé
          </p>
          <p className="text-sm text-gray-500 text-center mb-8">
            Ces informations sont nécessaires pour personnaliser votre suivi médical. Vous pourrez les modifier plus tard.
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Birth Date & Gender */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Date de naissance <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Sexe <span className="text-red-500">*</span></label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  required
                >
                  <option value="">Sélectionner</option>
                  <option value="F">Femme</option>
                  <option value="M">Homme</option>
                  <option value="O">Autre</option>
                  <option value="N">Préfère ne pas répondre</option>
                </select>
              </div>
            </div>

            {/* Blood Group & Physical Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Groupe sanguin</label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="">Sélectionner</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Poids (kg)</label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="70"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Taille (cm)</label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({...formData, height: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="170"
                  min="0"
                  step="1"
                />
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
                disabled={loading || !formData.birthDate || !formData.gender}
              >
                {loading ? 'Enregistrement...' : 'Terminer et accéder à mon espace Patient'}
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-4">
              <span className="text-red-500">*</span> Champs obligatoires
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
