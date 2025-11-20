import { Brain, Shield, Mail, Lock, Smartphone } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp';
import { Screen } from '../App';
import { useState } from 'react';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function DoctorLogin({ onNavigate }: Props) {
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [email, setEmail] = useState('dr.ayari@hopevision.tn');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    setStep('otp');
  };

  const handleOTPVerify = () => {
    onNavigate('doctor-dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center">
              <Brain className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-gray-900 mb-2">HopeVisionAI</h1>
          <p className="text-gray-600">Espace Professionnel de Santé</p>
        </div>

        <Card className="p-8">
          {step === 'credentials' ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-gray-900">Connexion sécurisée</h2>
                  <p className="text-sm text-gray-600">Authentification à deux facteurs</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email professionnel</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@hopevision.tn"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span className="text-gray-600">Se souvenir de moi</span>
                  </label>
                  <a href="#" className="text-blue-600 hover:text-blue-700">
                    Mot de passe oublié ?
                  </a>
                </div>

                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleLogin}
                >
                  Continuer
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-gray-900 mb-2">Code de vérification</h2>
                <p className="text-gray-600">
                  Entrez le code à 6 chiffres envoyé sur votre téléphone
                  <br />
                  <span className="text-gray-900">+216 ** *** 789</span>
                </p>
              </div>

              <div className="flex justify-center mb-6">
                <InputOTP maxLength={6}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="text-center text-sm text-gray-600 mb-6">
                Vous n'avez pas reçu le code ?{' '}
                <button className="text-blue-600 hover:text-blue-700">
                  Renvoyer
                </button>
              </div>

              <div className="space-y-3">
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleOTPVerify}
                >
                  Vérifier et se connecter
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setStep('credentials')}
                >
                  Retour
                </Button>
              </div>
            </>
          )}

          {/* Security Info */}
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-green-800">
                Connexion sécurisée avec authentification à deux facteurs (2FA) 
                conforme aux normes HDS et RGPD.
              </p>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>En vous connectant, vous acceptez nos</p>
          <a href="#" className="text-blue-600 hover:text-blue-700">
            Conditions d'utilisation professionnelle
          </a>
        </div>
      </div>
    </div>
  );
}
