import React, { useState, useEffect, useRef } from 'react';
import { X, User, Stethoscope, Building2, Mail, Phone, AlertCircle, Check, ChevronRight, Calendar } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { submitWaitlist, WaitlistSubmission } from '../services/waitlistService';

interface BetaWaitlistModalProps {
  onClose: () => void;
  onRedirectToDemo?: () => void;
}

// ----------------------------------------------------------------------
// WRAPPER MODALE
// ----------------------------------------------------------------------
function ModalWrapper({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements && focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="waitlist-modal-title"
    >
      <div ref={modalRef} className="w-full max-w-md outline-none" tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// MODALE WAITLIST (Formulaire Enrichi)
// ----------------------------------------------------------------------
export function BetaWaitlistModal({ onClose, onRedirectToDemo }: BetaWaitlistModalProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [role, setRole] = useState<'patient' | 'doctor' | 'hospital'>('patient');
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dynamicField, setDynamicField] = useState('');

  const [emailError, setEmailError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    
    if (!validateEmail(email)) {
      setEmailError(true);
      return;
    }

    if (!fullName.trim()) {
      setSubmitError(t('waitlist.errors.generic'));
      return;
    }

    setIsLoading(true);
    setEmailError(false);

    try {
      const submissionData: WaitlistSubmission = {
        role,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        ...(role === 'doctor' && dynamicField ? { specialty: dynamicField.trim() } : {}),
        ...(role === 'hospital' && dynamicField ? { institution_name: dynamicField.trim() } : {}),
      };

      const result = await submitWaitlist(submissionData);

      if (result.success) {
        setIsLoading(false);
        setStep('success');
      } else {
        setIsLoading(false);
        // Translate error messages
        let errorMessage = '';
        switch (result.errorCode) {
          case 'DUPLICATE_EMAIL':
            errorMessage = t('waitlist.errors.duplicateEmail');
            break;
          case 'NETWORK_ERROR':
            errorMessage = t('waitlist.errors.networkError');
            break;
          default:
            errorMessage = t('waitlist.errors.generic');
        }
        setSubmitError(errorMessage);
      }
    } catch (error) {
      console.error('[BetaWaitlistModal] Error submitting form:', error);
      setIsLoading(false);
      setSubmitError(t('waitlist.errors.generic'));
    }
  };

  return (
    <ModalWrapper onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto relative animate-scale-in ring-1 ring-slate-900/5">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={t('waitlist.close')}
        >
          <X size={20} />
        </button>

        <div className="p-6 md:p-8">
          {step === 'form' ? (
            <>
              <div className="flex justify-center mb-6">
                <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 ring-4 ring-blue-50/50">
                  <User size={32} strokeWidth={1.5} />
                </div>
              </div>
              <h2 id="waitlist-modal-title" className="text-2xl font-bold text-center text-slate-900 mb-2">
                {t('waitlist.title')}
              </h2>
              <p className="text-center text-slate-500 mb-6 text-sm px-2" dangerouslySetInnerHTML={{ __html: t('waitlist.subtitle') }} />

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                
                {/* 1. SÉLECTION DU RÔLE */}
                <div role="group" aria-labelledby="role-label">
                  <label id="role-label" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    {t('waitlist.roleLabel')}
                  </label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                      { id: 'patient' as const, icon: User, label: t('waitlist.roles.patient') },
                      { id: 'doctor' as const, icon: Stethoscope, label: t('waitlist.roles.doctor') },
                      { id: 'hospital' as const, icon: Building2, label: t('waitlist.roles.hospital') }
                    ].map((item) => (
                      <button 
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setRole(item.id);
                          setDynamicField('');
                        }}
                        className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl border transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${
                          role === item.id 
                            ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-600' 
                            : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <item.icon size={20} className="mb-1.5" strokeWidth={1.5} />
                        <span className="text-xs font-medium truncate w-full text-center">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. NOM COMPLET */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    {t('waitlist.fullName')}
                  </label>
                  <div className="relative group">
                    <User className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                      type="text" 
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t('waitlist.fullNamePlaceholder')}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

                {/* 3. CHAMP DYNAMIQUE : SPÉCIALITÉ OU ÉTABLISSEMENT */}
                {role === 'doctor' && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      {t('waitlist.specialty')}
                    </label>
                    <div className="relative group">
                      <Stethoscope className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                      <input 
                        type="text" 
                        value={dynamicField}
                        onChange={(e) => setDynamicField(e.target.value)}
                        placeholder={t('waitlist.specialtyPlaceholder')}
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
                      />
                    </div>
                  </div>
                )}

                {role === 'hospital' && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      {t('waitlist.institutionName')}
                    </label>
                    <div className="relative group">
                      <Building2 className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                      <input 
                        type="text" 
                        value={dynamicField}
                        onChange={(e) => setDynamicField(e.target.value)}
                        placeholder={t('waitlist.institutionPlaceholder')}
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* 4. EMAIL */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    {t('waitlist.email')}
                  </label>
                  <div className="relative group">
                    <Mail className={`absolute left-3 top-3.5 transition-colors ${emailError ? 'text-red-400' : 'text-slate-400 group-focus-within:text-blue-500'}`} size={18} />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setEmailError(false); }}
                      onBlur={() => setEmailError(email ? !validateEmail(email) : false)}
                      placeholder={t('waitlist.emailPlaceholder')}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none transition-all bg-slate-50 focus:bg-white ${
                        emailError 
                          ? 'border-red-300 focus:ring-2 focus:ring-red-200 text-red-900 placeholder-red-300' 
                          : 'border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    />
                    {emailError && (
                      <AlertCircle className="absolute right-3 top-3.5 text-red-500 animate-pulse" size={18} />
                    )}
                  </div>
                  {emailError && (
                    <p className="text-xs text-red-500 mt-1 ml-1">{t('waitlist.emailError')}</p>
                  )}
                </div>

                {/* 5. TÉLÉPHONE (OPTIONNEL) */}
                <div>
                  <label className="flex justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    <span>{t('waitlist.phone')}</span>
                    <span className="text-slate-400 font-normal normal-case italic">{t('waitlist.optional')}</span>
                  </label>
                  <div className="relative group">
                    <Phone className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t('waitlist.phonePlaceholder')}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
                    />
                </div>
              </div>

              {/* Error Message */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 animate-fade-in">
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-red-700">{submitError}</p>
                </div>
              )}

                <button 
                  type="submit" 
                  disabled={isLoading || !fullName.trim() || !email.trim()}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-blue-500/30 mt-2"
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {t('waitlist.submit')} <ChevronRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-6 animate-fade-in">
              <div className="mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-green-50/50">
                <Check className="text-green-600 w-10 h-10" strokeWidth={3} />
              </div>
              
              {role === 'patient' ? (
                <>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {t('waitlist.success.patient.title').replace('{{name}}', fullName.split(' ')[0] || '')}
                  </h3>
                  <p className="text-slate-600 mb-8 text-sm leading-relaxed">
                    {t('waitlist.success.patient.message').replace('{{email}}', email)}
                  </p>
                  <button 
                    onClick={onClose} 
                    autoFocus
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    {t('waitlist.success.back')}
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {t('waitlist.success.professional.title')}
                  </h3>
                  <p className="text-slate-600 mb-6 text-sm">
                    {t('waitlist.success.professional.message').replace('{{name}}', fullName.split(' ')[0] || '')}
                  </p>
                  <div className="space-y-3">
                    {onRedirectToDemo && (
                      <button 
                        onClick={onRedirectToDemo}
                        autoFocus
                        className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2"
                      >
                        <Calendar size={18} />
                        {t('waitlist.success.professional.demoButton')}
                      </button>
                    )}
                    <button 
                      onClick={onClose} 
                      className="block w-full text-slate-400 text-sm hover:text-slate-600 py-2 transition-colors"
                    >
                      {t('waitlist.success.professional.skip')}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
}
