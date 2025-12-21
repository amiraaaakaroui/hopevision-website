import { useState } from 'react';
import { Brain, Stethoscope, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Screen } from '../../App';
import { supabase } from '../../lib/supabaseClient';


interface Props {
  onNavigate: (screen: Screen) => void;
}

export function SignupDoctorStep1({ onNavigate }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    confirmProfessional: false
  });
  const [showPassword, setShowPassword] = useState(false);



  const handleGoogleSignup = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/?role=doctor`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Erreur Google signup médecin:', error.message);
        setError('Erreur lors de la connexion avec Google. Veuillez réessayer.');
        setLoading(false);
      }
      // If successful, browser will redirect to Google
    } catch (err: any) {
      console.error('Erreur Google signup:', err);
      setError('Erreur lors de la connexion avec Google.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password match and professional confirmation
    if (formData.password !== formData.confirmPassword || !formData.confirmProfessional) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // EMAIL SIGNUP MODE: Create new account
      // 1. Create auth user
      // NOTE: signUp() may or may not return a session depending on email confirmation settings
      // We store role in metadata so the database trigger can create the profile after email confirmation

      // ROBUST FIX: Add role to the redirect URL. This ensures that even if sessionStorage is lost
      // (e.g. opening email on mobile or new tab), the App knows this is a doctor confirmation.
      const redirectTo = `${window.location.origin}/?role=doctor`;

      console.log('[SignupDoctorStep1] Signing up with redirect:', redirectTo);

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            full_name: `${formData.firstName} ${formData.lastName}`,
            role: 'doctor', // Store role in metadata for trigger
            signup_step1_data: JSON.stringify(formData), // Store form data for Step 2/3 after confirmation
          }
        }
      });

      // CRITICAL: Check for errors and ensure user was created
      if (signUpError) {
        console.error('[SignupDoctorStep1] SignUp error:', signUpError);
        // Check if it's a user already exists error
        if (signUpError.message?.includes('already registered') || signUpError.message?.includes('already exists')) {
          throw new Error('Cet email est déjà enregistré. Veuillez vous connecter ou utiliser un autre email.');
        }
        throw signUpError;
      }

      if (!authData.user) {
        console.error('[SignupDoctorStep1] No user returned from signUp');
        throw new Error('Erreur lors de la création du compte. Aucun utilisateur créé.');
      }

      // Verify user was actually created in auth.users
      console.log('[SignupDoctorStep1] User created successfully:', {
        id: authData.user.id,
        email: authData.user.email,
        email_confirmed_at: authData.user.email_confirmed_at,
        has_session: !!authData.session
      });

      const userId = authData.user.id;

      // 2. Check if email confirmation is required
      // If signUp() returns no session, email confirmation is required
      if (!authData.session) {
        // No session available - this happens when email confirmation is required
        // The database trigger will create the profile automatically after email confirmation
        // Store form data in sessionStorage so Step 2/3 can be completed after confirmation
        sessionStorage.setItem('signup-doctor-step1', JSON.stringify(formData));
        sessionStorage.setItem('signup-doctor-pending-confirmation', 'true');
        sessionStorage.setItem('signup-doctor-email', formData.email);
        sessionStorage.setItem('pending-signup-role', 'doctor'); // Store role for profile creation

        // Show success message - user needs to check email
        setEmailConfirmationRequired(true);
        setError(null);
        setLoading(false);
        return; // Stop here - user must confirm email first
      }

      // 3. If session is available (email confirmation disabled), proceed with profile creation
      const session = authData.session;

      // Verify the session user matches
      if (session.user.id !== userId) {
        throw new Error('Erreur de session: l\'utilisateur ne correspond pas.');
      }

      // 4. Create profile (ONCE - this is the only place profiles row is created if email confirmation is OFF)
      // RLS policy requires: WITH CHECK (user_id = auth.uid())
      // At this point, session is established, so auth.uid() should equal userId
      const profileInsertData = {
        user_id: userId, // Must match auth.uid() for RLS
        role: 'doctor' as const,
        full_name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
      };

      console.log('[SignupDoctorStep1] Profile insert payload:', profileInsertData);

      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert(profileInsertData)
        .select('id')
        .single();

      if (profileError) {
        // If profile already exists (edge case), get it
        if (profileError.code === '23505') { // Unique violation
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', authData.user.id)
            .single();

          if (existingProfile) {
            sessionStorage.setItem('signup-doctor-step1', JSON.stringify(formData));
            sessionStorage.setItem('signup-doctor-profile-id', existingProfile.id);
            onNavigate('signup-doctor-step2');
            return;
          }
        }
        throw profileError;
      }

      if (!newProfile) throw new Error('Erreur lors de la création du profil');

      // Store step1 data and profile ID for step2
      sessionStorage.setItem('signup-doctor-step1', JSON.stringify(formData));
      sessionStorage.setItem('signup-doctor-profile-id', newProfile.id);

      onNavigate('signup-doctor-step2');
    } catch (err: any) {
      console.error('[SignupDoctorStep1] Signup error:', err);

      // Provide user-friendly error messages
      let errorMessage = 'Erreur lors de la création du compte. Veuillez réessayer.';

      if (err.message) {
        errorMessage = err.message;
      } else if (err.code) {
        switch (err.code) {
          case 'user_already_registered':
            errorMessage = 'Cet email est déjà enregistré. Veuillez vous connecter.';
            break;
          case 'signup_disabled':
            errorMessage = 'L\'inscription est temporairement désactivée. Veuillez contacter le support.';
            break;
          default:
            errorMessage = `Erreur: ${err.code}. Veuillez réessayer.`;
        }
      }

      setError(errorMessage);
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

          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Inscription Médecin</h2>
          <p className="text-gray-600 text-center mb-8">Rejoignez la communauté HopeVisionAI</p>

          {/* Google Sign-up Button */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full mb-4 flex items-center justify-center gap-3 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google"
              className="w-5 h-5"
            />
            <span>Continuer avec Google</span>
          </button>

          {/* Separator */}
          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-gray-200" />
            <span className="px-4 text-xs text-gray-500 uppercase font-medium">ou</span>
            <div className="flex-grow h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Prénom</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Karim" required />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Nom</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ayari" required />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">E-mail professionnel</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="dr.ayari@hopital.tn" required />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" minLength={8} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Confirmer</label>
                <input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" required />
              </div>
            </div>



            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={formData.confirmProfessional} onChange={(e) => setFormData({ ...formData, confirmProfessional: e.target.checked })} className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1" required />
                <span className="text-sm text-gray-700">
                  Je confirme être un professionnel de santé autorisé à exercer.
                </span>
              </label>
            </div>

            {/* Email Confirmation Required Message */}
            {emailConfirmationRequired && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">
                      Vérification de l'email requise
                    </h3>
                    <p className="text-sm text-blue-800 mb-2">
                      Nous avons envoyé un email de confirmation à <strong>{formData.email}</strong>.
                      Veuillez cliquer sur le lien dans l'email pour confirmer votre compte.
                    </p>
                    <p className="text-xs text-blue-700">
                      Une fois votre email confirmé, vous pourrez continuer avec les étapes suivantes.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-3" disabled={!formData.confirmProfessional || formData.password !== formData.confirmPassword || loading || emailConfirmationRequired}>
              {loading ? 'Création du compte...' : emailConfirmationRequired ? 'Vérifiez votre email' : 'Continuer → Étape 2'}
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
