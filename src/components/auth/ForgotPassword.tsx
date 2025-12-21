import { useState } from 'react';
import { Brain, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Screen } from '../../App';
import { supabase } from '../../lib/supabaseClient';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function ForgotPassword({ onNavigate }: Props) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/auth-reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (resetError) throw resetError;

      setSubmitted(true);
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Erreur lors de l\'envoi de l\'e-mail. Veuillez réessayer.');
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
        {!submitted ? (
          <>
            {/* Icon */}
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>

            {/* Title */}
            <h2 className="text-gray-900 text-center mb-2">
              Mot de passe oublié ?
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Entrez votre e-mail pour recevoir un lien de réinitialisation
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
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

              <Button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 py-3"
                disabled={loading}
              >
                {loading ? 'Envoi...' : 'Envoyer un lien de réinitialisation'}
              </Button>
            </form>

            {/* Back to login */}
            <button
              onClick={() => onNavigate('role-selection')}
              className="w-full mt-6 flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </button>
          </>
        ) : (
          <>
            {/* Success Icon */}
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            {/* Success Message */}
            <h2 className="text-gray-900 text-center mb-2">
              E-mail envoyé !
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Si un compte existe avec l'adresse <strong>{email}</strong>, 
              un lien de réinitialisation vous a été envoyé.
            </p>

            <p className="text-sm text-gray-500 text-center mb-6">
              Vérifiez votre boîte de réception et vos courriers indésirables.
            </p>

            <Button 
              onClick={() => onNavigate('role-selection')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Retour à la connexion
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
