import { useState, useRef, useEffect } from 'react';
import { Brain, Mail, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Screen } from '../../App';

interface Props {
  onNavigate: (screen: Screen) => void;
  email?: string;
  userType?: 'patient' | 'doctor' | 'hospital';
}

export function EmailVerification({ onNavigate, email = 'nadia.bensalem@mail.com', userType = 'patient' }: Props) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    setVerified(true);
    setTimeout(() => {
      onNavigate('auth-consent');
    }, 2000);
  };

  const handleResend = () => {
    setCode(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
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
        </div>
      </div>

      {/* Main Card */}
      <Card className="w-full max-w-md mt-20 p-8 bg-white">
        {!verified ? (
          <>
            {/* Icon */}
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>

            {/* Title */}
            <h2 className="text-gray-900 text-center mb-2">
              Vérification de votre e-mail
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Nous avons envoyé un code de vérification à<br />
              <strong>{email}</strong>
            </p>

            {/* OTP Inputs */}
            <div className="flex gap-3 justify-center mb-6">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ))}
            </div>

            {/* Verify Button */}
            <Button 
              onClick={handleVerify}
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 mb-4"
              disabled={code.some(d => !d)}
            >
              Valider mon compte
            </Button>

            {/* Resend */}
            <p className="text-center text-gray-600 text-sm">
              Vous n'avez pas reçu le code ?{' '}
              <button
                onClick={handleResend}
                className="text-blue-600 hover:text-blue-700"
              >
                Renvoyer
              </button>
            </p>
          </>
        ) : (
          <>
            {/* Success Icon */}
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            {/* Success Message */}
            <h2 className="text-gray-900 text-center mb-2">
              E-mail vérifié !
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Votre compte a été vérifié avec succès.
              Redirection en cours...
            </p>

            {/* Loading spinner */}
            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
