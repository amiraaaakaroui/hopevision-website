import { useState } from 'react';
import { Brain, Heart, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Screen } from '../../App';
import { supabase } from '../../lib/supabaseClient';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function LoginPatient({ onNavigate }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/?role=patient`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Erreur Google login patient:', error.message);
        setError('Erreur lors de la connexion avec Google. Veuillez réessayer.');
        setLoading(false);
      }
      // If successful, browser will redirect to Google
    } catch (err: any) {
      console.error('Erreur Google login:', err);
      setError('Erreur lors de la connexion avec Google.');
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Check if user is already logged in (e.g., after email confirmation)
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession?.user) {
        // User already has a session, skip signIn and check profile directly
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('user_id', existingSession.user.id)
          .eq('is_deleted', false)
          .maybeSingle();

        if (profile?.role === 'patient') {
          // Check profile completeness
          const { data: patientProfile } = await supabase
            .from('patient_profiles')
            .select('gender')
            .eq('profile_id', profile.id)
            .maybeSingle();

          const { data: fullProfile } = await supabase
            .from('profiles')
            .select('date_of_birth')
            .eq('id', profile.id)
            .single();

          const isIncomplete = !fullProfile?.date_of_birth || !patientProfile?.gender;

          if (isIncomplete) {
            onNavigate('signup-patient-step2');
          } else {
            onNavigate('patient-history');
          }
          setLoading(false);
          return;
        }
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (data.user) {
        // Check if user has a profile
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('user_id', data.user.id)
          .eq('is_deleted', false)
          .maybeSingle();

        // If profile doesn't exist, try to create it (fallback if trigger didn't run)
        if (!profile && !profileError) {
          // Get user metadata to determine role
          const userMetadata = data.user.user_metadata || {};
          const role = userMetadata.role || 'patient'; // Default to patient

          // Create profile (RLS allows this because user_id = auth.uid())
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              user_id: data.user.id,
              role: role,
              full_name: userMetadata.full_name || data.user.email || 'Utilisateur',
              email: data.user.email || '',
              country: userMetadata.country || null,
            })
            .select('id, role')
            .single();

          if (!createError && newProfile) {
            profile = newProfile;

            // Create patient_profile if role is patient
            if (role === 'patient') {
              await supabase
                .from('patient_profiles')
                .insert({ profile_id: newProfile.id })
                .select('id')
                .maybeSingle();
            }
          }
        }

        if (profile?.role === 'patient') {
          // Check if patient_profile exists and is complete
          const { data: patientProfile } = await supabase
            .from('patient_profiles')
            .select('gender')
            .eq('profile_id', profile.id)
            .maybeSingle();

          // Check if profile is incomplete (only required fields: date_of_birth and gender)
          const { data: fullProfile } = await supabase
            .from('profiles')
            .select('date_of_birth')
            .eq('id', profile.id)
            .single();

          const isIncomplete = !fullProfile?.date_of_birth || !patientProfile?.gender;

          if (isIncomplete) {
            // Profile incomplete - redirect to onboarding
            onNavigate('signup-patient-step2');
          } else {
            // Check if there's pending signup data
            const pendingSignup = sessionStorage.getItem('signup-patient-step1');
            if (pendingSignup) {
              onNavigate('signup-patient-step2');
            } else {
              // Normal login - navigation will be handled by App.tsx
              onNavigate('patient-history');
            }
          }
        } else if (profile?.role) {
          setError(`Ce compte n'est pas un compte patient. Veuillez utiliser la connexion ${profile.role === 'doctor' ? 'médecin' : 'admin'}.`);
        } else {
          setError('Profil non trouvé. Veuillez contacter le support.');
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Erreur lors de la connexion. Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl text-gray-900">HopeVisionAI</span>
          </div>
          <button
            onClick={() => onNavigate('role-selection')}
            className="text-gray-600 hover:text-gray-900 text-sm"
          >
            ← Retour
          </button>
        </div>
      </div>

      {/* Main Card */}
      <Card className="w-full max-w-md mt-20 p-8 bg-white">
        {/* Icon */}
        <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-6">
          <Heart className="w-8 h-8 text-green-600" />
        </div>

        {/* Title */}
        <h2 className="text-gray-900 text-center mb-2">
          Connexion Patient
        </h2>
        <p className="text-gray-600 text-center mb-8">
          Accédez à votre espace de santé personnel
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full mb-4 flex items-center justify-center gap-3 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google"
            className="w-5 h-5"
          />
          <span>Se connecter avec Google</span>
        </button>

        {/* Separator */}
        <div className="flex items-center my-6">
          <div className="flex-grow h-px bg-gray-200" />
          <span className="px-4 text-xs text-gray-500 uppercase font-medium">ou</span>
          <div className="flex-grow h-px bg-gray-200" />
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-gray-700 mb-2">
              Adresse e-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="votre.email@exemple.com"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Se souvenir de moi</span>
            </label>
            <button
              type="button"
              onClick={() => onNavigate('auth-forgot-password')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Mot de passe oublié ?
            </button>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 py-3"
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter à mon espace Patient'}
          </Button>
        </form>

        {/* Signup Link */}
        <p className="text-center text-gray-600 text-sm mt-6">
          Pas encore de compte ?{' '}
          <button
            onClick={() => onNavigate('signup-patient-step1')}
            className="text-blue-600 hover:text-blue-700"
          >
            Créer un compte
          </button>
        </p>

        {/* Security Notice */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-800 text-center">
            🔒 Vos données de santé sont chiffrées et protégées (HDS / RGPD)
          </p>
        </div>
      </Card>
    </div>
  );
}
