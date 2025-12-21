import React, { useState, useEffect, useRef } from 'react';
import {
  Stethoscope, Activity, Brain, ShieldCheck, Users, FileText, Mic, ImageIcon, Menu, X, Network, Lock, HeartPulse, ArrowRight, Star, Smartphone, ChevronDown, ChevronUp, ChevronRight, Clock, Check, Send, Camera, Paperclip, Calendar, Video, MapPin, RefreshCw, ClipboardList, Upload, Scan, FlaskConical, MessageCircle, AlertCircle, Search, MoreVertical, Eye, EyeOff, Building2, CheckCircle2, BriefcaseMedical
} from 'lucide-react';
import { Screen } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { BetaWaitlistModal } from './BetaWaitlistModal';
import { CalendlyModal } from './CalendlyModal';

interface Props {
  onNavigate: (screen: Screen) => void;
}

// --- HOOK POUR L'ANIMATION AU SCROLL ---
const useScrollReveal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => setIsVisible(entry.isIntersecting));
    });
    const currentRef = domRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  return [isVisible, domRef] as const;
};

// --- COMPOSANT ANIMATED COUNTER ---
const AnimatedCounter = ({ end, suffix = "", prefix = "" }: { end: string | number, suffix?: string, prefix?: string }) => {
  const [count, setCount] = useState(0);
  const domRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const currentElement = domRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const endNum = parseInt(end.toString().replace(/[^0-9]/g, '')) || 0;
          if (endNum === 0) { setCount(typeof end === 'number' ? end : 0); return; }

          let timer = setInterval(() => {
            start += Math.ceil(endNum / 50);
            if (start >= endNum) {
              start = endNum;
              clearInterval(timer);
            }
            setCount(start);
          }, 30);

          if (currentElement) observer.unobserve(currentElement);
        }
      },
      { threshold: 0.5 }
    );

    if (currentElement) observer.observe(currentElement);

    return () => {
      if (currentElement) observer.unobserve(currentElement);
    };
  }, [end]);

  return <span ref={domRef}>{prefix}{count}{suffix}</span>;
};

const RevealSection = ({ children, className = "", style = {} }: { children: React.ReactNode, className?: string, style?: React.CSSProperties }) => {
  const [isVisible, domRef] = useScrollReveal();
  return (
    <div
      ref={domRef}
      className={`transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        } ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

// --- COMPOSANT SVG IRM CERVEAU ---
const BrainScanSVG = ({ showAnomaly = false, isScanning = false, showOverlay = true }: { showAnomaly?: boolean, isScanning?: boolean, showOverlay?: boolean }) => (
  <div className="w-full h-full bg-black relative overflow-hidden rounded flex items-center justify-center group">
    {/* Grid overlay */}
    <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

    {/* Brain Shape SVG */}
    <svg viewBox="0 0 200 200" className="w-3/4 h-3/4 opacity-90">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Outer Skull */}
      <path d="M100,20 C60,20 30,60 30,100 C30,150 60,180 100,180 C140,180 170,150 170,100 C170,60 140,20 100,20 Z" fill="#1e293b" stroke="#334155" strokeWidth="2" />
      {/* Brain Tissue (Left Hemisphere) */}
      <path d="M98,30 C70,30 45,60 45,100 C45,140 70,165 98,165 C90,140 90,60 98,30 Z" fill="#475569" stroke="#64748b" strokeWidth="1" />
      {/* Brain Tissue (Right Hemisphere) */}
      <path d="M102,30 C130,30 155,60 155,100 C155,140 130,165 102,165 C110,140 110,60 102,30 Z" fill="#475569" stroke="#64748b" strokeWidth="1" />
      {/* Ventricles */}
      <path d="M95,80 Q85,100 95,120 M105,80 Q115,100 105,120" fill="none" stroke="#0f172a" strokeWidth="2" />

      {/* ANOMALY (Visible only if prop is true AND overlay is on) */}
      {showAnomaly && showOverlay && (
        <g className="animate-pulse">
          <circle cx="130" cy="90" r="10" fill="rgba(239, 68, 68, 0.3)" filter="url(#glow)" />
          <circle cx="130" cy="90" r="5" fill="rgba(239, 68, 68, 0.8)" />
          <path d="M130,90 L165,50" stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" />
          <rect x="160" y="35" width="35" height="14" rx="2" fill="#ef4444" />
          <text x="163" y="45" fontSize="7" fill="white" fontFamily="sans-serif" fontWeight="bold">Lésion</text>
        </g>
      )}
    </svg>

    {/* Scanning Line Animation */}
    {isScanning && (
      <div className="absolute inset-0 w-full h-1 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-[scan_2s_linear_infinite]"></div>
    )}

    {/* Metadata Overlay */}
    <div className="absolute top-2 left-2 text-[8px] text-slate-500 font-mono">
      <p>ID: 8492</p>
      <p>SEQ: T2 FLAIR</p>
      <p>SLICE: 14/32</p>
    </div>
  </div>
);

// --- COMPOSANT FAQ ---
const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-200 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex justify-between items-center text-left focus:outline-none group"
      >
        <span className={`text-lg font-medium transition-colors ${isOpen ? 'text-blue-600' : 'text-slate-800 group-hover:text-blue-600'}`}>
          {question}
        </span>
        {isOpen ? <ChevronUp className="text-blue-600" /> : <ChevronDown className="text-slate-400" />}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100 pb-6' : 'max-h-0 opacity-0'}`}>
        <p className="text-slate-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
};

export function Landing({ onNavigate }: Props) {
  const { t } = useLanguage();
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showCalendlyModal, setShowCalendlyModal] = useState(false);
  // Check if user just confirmed email
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [emailConfirmedRole, setEmailConfirmedRole] = useState<'patient' | 'doctor' | null>(null);

  useEffect(() => {
    // Check if email was just confirmed
    const confirmed = sessionStorage.getItem('email-confirmed');
    const role = sessionStorage.getItem('email-confirmed-role') as 'patient' | 'doctor' | null;
    if (confirmed === 'true') {
      setEmailConfirmed(true);
      setEmailConfirmedRole(role);
      // Clear the flags after showing message
      sessionStorage.removeItem('email-confirmed');
      sessionStorage.removeItem('email-confirmed-role');
    }
  }, []);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeScenario, setActiveScenario] = useState<'doctor' | 'patient'>('doctor');

  // --- PATIENT DEMO STATE ---
  const [patientDemoStep, setPatientDemoStep] = useState(0);
  const [patientChatHistory, setPatientChatHistory] = useState<{ type: string, text: string, delay?: number }[]>([]);
  const [patientIsTyping, setPatientIsTyping] = useState(false);

  useEffect(() => {
    if (activeScenario === 'patient' && patientDemoStep === 0) {
      setPatientChatHistory([{ type: 'ai', text: "Bonjour. Je suis l'assistant HopeVision. Décrivez vos symptômes ou choisissez une option :", delay: 0 }]);
    }
  }, [activeScenario, patientDemoStep]);

  const addPatientMessage = (type: string, content: string) => {
    setPatientChatHistory(prev => [...prev, { type, text: content }]);
  };

  // Patient Demo Handlers
  const handlePatientSymptomSelect = (symptom: string) => {
    addPatientMessage('user', symptom);
    setPatientDemoStep(2);
    setPatientIsTyping(true);
    setTimeout(() => {
      setPatientIsTyping(false);
      addPatientMessage('ai', "Entendu. Avez-vous des documents (radio, ordonnance) ou une photo à ajouter pour affiner l'analyse ?");
    }, 1000);
  };

  const handlePatientMultimodalInput = (type: string) => {
    let content = "";
    if (type === 'camera') content = "📸 Photo de la gorge ajoutée";
    if (type === 'doc') content = "📄 Résultats sanguins.pdf ajoutés";
    if (type === 'mic') content = "🎤 Note vocale enregistrée";
    addPatientMessage('user', content);
    setPatientDemoStep(3);
    setPatientIsTyping(true);
    setTimeout(() => {
      setPatientIsTyping(false);
      addPatientMessage('ai', "Merci. Une dernière précision : depuis combien de temps ressentez-vous cela ?");
    }, 1200);
  };

  const handlePatientDurationSelect = (duration: string) => {
    addPatientMessage('user', duration);
    setPatientDemoStep(4);
    setPatientIsTyping(true);
    setTimeout(() => {
      setPatientIsTyping(false);
      setPatientDemoStep(5);
    }, 2000);
  };

  const handlePatientBooking = () => {
    setPatientDemoStep(6);
    setTimeout(() => {
      setPatientDemoStep(7);
    }, 1500);
  };

  const resetPatientDemo = () => {
    setPatientDemoStep(0);
    setPatientChatHistory([]);
  };

  // --- DOCTOR DEMO STATE ---
  const [doctorDemoStep, setDoctorDemoStep] = useState(0);
  const [doctorChatHistory, setDoctorChatHistory] = useState<{ sender: string, text: string, isMe: boolean }[]>([]);
  const [doctorIsProcessing, setDoctorIsProcessing] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true); // Toggle for AI overlay

  useEffect(() => {
    if (activeScenario === 'doctor' && doctorDemoStep === 0) {
      setDoctorChatHistory([]);
      setDoctorIsProcessing(false);
      setShowHeatmap(true);
    }
  }, [activeScenario, doctorDemoStep]);

  const addDoctorChatMessage = (sender: string, text: string, isMe = false) => {
    setDoctorChatHistory(prev => [...prev, { sender, text, isMe }]);
  };

  // Doctor Demo Handlers
  const handleOpenPatient = () => {
    setDoctorDemoStep(1);
  };

  const handleImportData = () => {
    setDoctorIsProcessing(true);
    setTimeout(() => {
      setDoctorIsProcessing(false);
      setDoctorDemoStep(2);
      // Auto advance scan animation
      setTimeout(() => setDoctorDemoStep(3), 3000); // 3s scanning
    }, 1000);
  };

  const handleShowExplainability = () => {
    setDoctorDemoStep(4);
  };

  const handleDoctorCollaborate = () => {
    addDoctorChatMessage("Dr. Ayari (Moi)", "@pneumo Votre avis sur cette IRM ?", true);
    setDoctorIsProcessing(true);
    setTimeout(() => {
      setDoctorIsProcessing(false);
      addDoctorChatMessage("Dr. Mansouri", "L'hypersignal T2 confirme la pneumonie. Validation OK.", false);
    }, 2000);
  };

  const handleValidateDiagnosis = () => {
    setDoctorDemoStep(5);
    setTimeout(() => setDoctorDemoStep(6), 1500);
  };

  const resetDoctorDemo = () => {
    setDoctorDemoStep(0);
    setDoctorChatHistory([]);
    setDoctorIsProcessing(false);
  };

  // Navigation Links
  const navLinks = [
    { name: t('landing.nav.solution'), href: '#solution' },
    { name: t('landing.nav.demo'), href: '#scenarios' },
    { name: t('landing.nav.architecture'), href: '#tech' },
    { name: t('landing.nav.testimonials'), href: '#testimonials' },
    { name: t('landing.nav.faq'), href: '#faq' },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 overflow-x-hidden selection:bg-blue-100 selection:text-blue-900 scroll-smooth">

      {/* --- HEADER --- */}
      <header className="fixed w-full bg-white/90 backdrop-blur-md z-50 border-b border-slate-100 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <img src="/iconlogo.png" alt={t('landing.header.logoAlt')} className="h-10 w-10 object-contain rounded-lg" />
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-cyan-500">
                HopeVisionAI
              </span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-blue-200">
                {t('landing.hero.betaBadge')}
              </span>
            </div>
            <nav className="hidden md:flex space-x-8 items-center">
              {navLinks.map((link) => (
                <a key={link.name} href={link.href} className="text-slate-600 hover:text-blue-600 font-medium transition-colors text-sm uppercase tracking-wide">
                  {link.name}
                </a>
              ))}
              <LanguageSelector />
            </nav>
            <div className="md:hidden flex items-center gap-2">
              <LanguageSelector />
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600 p-2 rounded-md hover:bg-slate-100">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 absolute w-full shadow-xl z-40">
            <div className="px-4 pt-4 pb-6 space-y-2">
              {navLinks.map((link) => (
                <a key={link.name} href={link.href} className="block px-4 py-3 text-base font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" onClick={() => setIsMenuOpen(false)}>
                  {link.name}
                </a>
              ))}
              <div className="pt-4 border-t border-slate-200">
                <div className="px-4 py-2">
                  <LanguageSelector />
                </div>
              </div>
              <div className="pt-6 flex flex-col gap-3">
                <button onClick={() => onNavigate('doctor-login')} className="w-full text-center text-blue-600 font-semibold border border-blue-200 py-3 rounded-xl">{t('landing.hero.emailConfirmed.button').replace(' →', '')}</button>
                <a 
                  href="https://tally.so/r/w8qXQN" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full text-center bg-blue-600 text-white py-3 rounded-xl font-semibold shadow-md hover:bg-blue-700 transition-colors"
                >
                  {t('landing.hero.cta.primary')}
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-16 lg:pt-48 lg:pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[40rem] h-[40rem] rounded-full bg-cyan-100/50 blur-3xl opacity-60 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[30rem] h-[30rem] rounded-full bg-blue-100/50 blur-3xl opacity-60"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 shadow-sm text-blue-700 font-bold text-xs uppercase tracking-wider mb-4 animate-pulse cursor-default">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              {t('landing.hero.betaBadge')} - {t('landing.hero.newVersion')}
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]">
              {t('landing.hero.title')} <br className="hidden md:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600">
                {t('landing.hero.titleHighlight')}
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              {t('landing.hero.subtitle')}
            </p>
            
            {/* Email Confirmation Message */}
            {emailConfirmed && (
              <div className="mb-8 max-w-2xl mx-auto animate-fade-in">
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 shadow-lg">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-green-900 font-bold mb-2">Votre adresse e-mail a été confirmée avec succès !</h3>
                      <p className="text-green-700 text-sm mb-4">
                        {emailConfirmedRole === 'doctor' 
                          ? "Vous pouvez maintenant vous connecter pour compléter votre profil médecin et accéder à votre espace professionnel."
                          : "Vous pouvez maintenant vous connecter pour compléter votre profil patient et accéder à votre espace."
                        }
                      </p>
                      <button 
                        onClick={() => onNavigate(emailConfirmedRole === 'doctor' ? 'auth-login-doctor' : 'auth-login-patient')} 
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-md transition-all transform hover:-translate-y-0.5"
                      >
                        Se connecter →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <button 
                  onClick={() => setShowWaitlistModal(true)}
                  className="px-8 py-4 bg-blue-600 text-white rounded-full font-bold text-lg shadow-xl hover:bg-blue-700 transition-all hover:-translate-y-1 text-center w-full sm:w-auto"
                >
                  {t('landing.hero.cta.primary')}
              </button>
                <button 
                  onClick={() => setShowCalendlyModal(true)}
                  className="px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-full font-bold text-lg hover:bg-blue-50 transition-all hover:-translate-y-1 text-center w-full sm:w-auto"
                >
                  {t('landing.hero.cta.secondary')}
                </button>
              </div>
              <p className="text-xs text-slate-500 max-w-md text-center mt-2">
                {t('landing.hero.cta.expectations')}
              </p>
              <a href="#b2b-section" className="text-sm text-slate-500 hover:text-blue-600 underline decoration-slate-300 underline-offset-4">
                {t('landing.hero.institutionLink')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* --- TRUST BAR --- */}
      <RevealSection className="py-10 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
            {t('landing.trust.title')}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xl"><ShieldCheck className="w-6 h-6 text-blue-600" /> {t('landing.trust.items.security')}</div>
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xl"><Lock className="w-6 h-6 text-green-600" /> {t('landing.trust.items.rgpd')}</div>
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xl"><Network className="w-6 h-6 text-purple-600" /> {t('landing.trust.items.hl7')}</div>
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xl"><Brain className="w-6 h-6 text-cyan-600" /> {t('landing.trust.items.explainable')}</div>
          </div>
        </div>
      </RevealSection>

      {/* --- KEY STATS --- */}
      <section id="stats" className="bg-white py-12 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-100">
            {[
              { label: t('landing.stats.diagnostics'), val: 1200, suffix: "k+", icon: Activity, color: "text-blue-600" },
              { label: t('landing.stats.timeSaved'), val: 30, suffix: "%", icon: Clock, color: "text-green-600" },
              { label: t('landing.stats.accuracy'), val: 98, suffix: "%", icon: Check, color: "text-purple-600" },
              { label: t('landing.stats.doctors'), val: 50, suffix: "", prefix: "+", icon: Network, color: "text-cyan-600" },
            ].map((stat, idx) => (
              <RevealSection key={idx} className="text-center p-4">
                <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                <div className="text-3xl font-extrabold text-slate-900 mb-1">
                  <AnimatedCounter end={stat.val.toString()} suffix={stat.suffix} prefix={(stat as any).prefix || ""} />
                </div>
                <div className="text-sm text-slate-500 font-medium uppercase tracking-wide">{stat.label}</div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* --- PROBLEM & SOLUTION --- */}
      <section id="solution" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <RevealSection>
              <div className="inline-block px-3 py-1 mb-6 bg-red-50 text-red-600 rounded-lg text-xs font-bold uppercase">{t('landing.solution.problem')}</div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6 leading-tight">
                {t('landing.solution.title')}
              </h2>
              <p className="text-slate-600 text-lg mb-6 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('landing.solution.description') }} />

              <div className="space-y-4 mt-8">
                {[
                  { text: t('landing.solution.points.multimodal'), color: "bg-blue-500" },
                  { text: t('landing.solution.points.transparent'), color: "bg-purple-500" },
                  { text: t('landing.solution.points.time'), color: "bg-green-500" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className={`w-2 h-2 rounded-full ${item.color} shadow-[0_0_10px_rgba(0,0,0,0.2)]`}></div>
                    <span className="text-slate-700 font-medium text-lg">{item.text}</span>
                  </div>
                ))}
              </div>
            </RevealSection>

            <RevealSection className="delay-200 relative perspective-1000">
              {/* Multimodal Visualization Graph */}
              <div className="bg-white rounded-3xl shadow-2xl p-10 relative z-10 border border-slate-100 overflow-hidden group hover:shadow-blue-200/50 transition-shadow duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-transparent rounded-full blur-3xl opacity-50 -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-cyan-100 to-transparent rounded-full blur-3xl opacity-50 -ml-10 -mb-10"></div>

                <div className="flex flex-col items-center mb-12 relative z-20">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                    <div className="w-28 h-28 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-xl relative z-10">
                      <Brain className="w-14 h-14 text-white" />
                    </div>
                  </div>
                  <div className="mt-4 px-4 py-1 bg-slate-900 text-white text-xs font-mono rounded-full">
                    Processing...
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 relative z-20">
                  {[
                    { icon: Mic, label: "Voix", sub: "Analyse Sémantique", color: "text-purple-500", bg: "bg-purple-50" },
                    { icon: ImageIcon, label: "Imagerie", sub: "Vision par Ordinateur", color: "text-blue-500", bg: "bg-blue-50" },
                    { icon: FileText, label: "Texte", sub: "NLP Médical", color: "text-orange-500", bg: "bg-orange-50" },
                    { icon: Activity, label: "Signaux", sub: "IoT & Constantes", color: "text-red-500", bg: "bg-red-50" }
                  ].map((item, idx) => (
                    <div key={idx} className={`${item.bg} p-4 rounded-2xl border border-slate-100 flex flex-col items-center text-center transform hover:scale-105 transition-all duration-300 cursor-default`}>
                      <item.icon className={`w-8 h-8 ${item.color} mb-3`} />
                      <h4 className="font-bold text-slate-800">{item.label}</h4>
                      <p className="text-xs text-slate-500 mt-1">{item.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* --- INTERACTIVE SCENARIOS --- */}
      <section id="scenarios" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{t('landing.scenarios.title')}</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">{t('landing.scenarios.subtitle')}</p>
          </RevealSection>

          {/* Toggle Switch */}
          <RevealSection className="flex justify-center mb-16">
            <div className="bg-white p-1.5 rounded-full inline-flex shadow-lg border border-slate-100">
              <button onClick={() => setActiveScenario('doctor')} className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeScenario === 'doctor' ? 'bg-blue-600 text-white shadow-md scale-105' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                <Stethoscope className="w-4 h-4" /> {t('landing.scenarios.doctor')}
              </button>
              <button onClick={() => setActiveScenario('patient')} style={activeScenario === 'patient' ? { backgroundColor: '#00B894' } : {}} className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeScenario === 'patient' ? 'text-white shadow-md scale-105' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                <Users className="w-4 h-4" /> {t('landing.scenarios.patient')}
              </button>
            </div>
          </RevealSection>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 min-h-[680px]">
            {activeScenario === 'doctor' ? (
              // --- DOCTOR SCENARIO ---
              <div className="grid grid-cols-1 lg:grid-cols-2 h-full animate-fade-in">
                <div className="bg-slate-50 relative overflow-hidden flex items-center justify-center p-4 lg:p-12 order-2 lg:order-1">
                  <div className="w-full max-w-2xl h-[600px] bg-white rounded-2xl border border-slate-200 shadow-xl relative overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="bg-slate-800 text-white p-4 z-20 shadow-md flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-blue-400" />
                        <span className="font-bold text-sm tracking-wide">{t('landing.scenarios.doctorDemo.title')}</span>
                      </div>
                      <button onClick={resetDoctorDemo} className="text-slate-300 hover:text-white"><RefreshCw className="w-4 h-4" /></button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-slate-50 p-4 sm:p-6 overflow-y-auto relative">
                      {/* STEP 0: DASHBOARD */}
                      {doctorDemoStep === 0 && (
                        <div className="animate-fade-in">
                          <div className="flex justify-between items-end mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Tableau de Bord</h3>
                            <span className="text-xs text-slate-400">{new Date().toLocaleDateString()}</span>
                          </div>

                          <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 text-center hover:shadow-md transition-shadow">
                              <div className="flex justify-center mb-2 text-blue-500"><ClipboardList className="w-5 h-5" /></div>
                              <span className="text-2xl font-bold text-slate-800 block">12</span>
                              <span className="text-[10px] text-slate-500 uppercase font-bold">{t('landing.scenarios.doctorDemo.pending')}</span>
                            </div>
                            <div className="bg-white p-3 rounded-lg shadow-sm border border-red-100 text-center hover:shadow-md transition-shadow relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-bl"></div>
                              <div className="flex justify-center mb-2 text-red-500"><AlertCircle className="w-5 h-5" /></div>
                              <span className="text-2xl font-bold text-slate-800 block">3</span>
                              <span className="text-[10px] text-red-500 uppercase font-bold">{t('landing.scenarios.doctorDemo.urgent')}</span>
                            </div>
                            <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 text-center hover:shadow-md transition-shadow">
                              <div className="flex justify-center mb-2 text-green-500"><Clock className="w-5 h-5" /></div>
                              <span className="text-2xl font-bold text-slate-800 block">8m</span>
                              <span className="text-[10px] text-slate-500 uppercase font-bold">Tps Moyen</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('landing.scenarios.doctorDemo.queue')}</h4>
                            <div className="flex gap-2">
                              <Search className="w-4 h-4 text-slate-400" />
                              <MoreVertical className="w-4 h-4 text-slate-400" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center hover:border-blue-400 cursor-pointer transition-all shadow-sm hover:shadow-md group" onClick={handleOpenPatient}>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shadow-inner">JD</div>
                                <div>
                                  <div className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Jean Dupont</div>
                                  <div className="text-xs text-slate-500 flex items-center gap-1">ID: #8492 <span className="w-1 h-1 rounded-full bg-slate-300"></span> Pneumo</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">Prioritaire</span>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                              </div>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center opacity-60 grayscale-[50%]">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">AL</div>
                                <div>
                                  <div className="text-sm font-bold text-slate-800">Alice Lambert</div>
                                  <div className="text-xs text-slate-500">ID: #8493 • Cardio</div>
                                </div>
                              </div>
                              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Traité</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* STEP 1: IMPORT */}
                      {doctorDemoStep === 1 && (
                        <div className="animate-fade-in h-full flex flex-col">
                          <div className="flex items-center gap-2 text-slate-400 mb-4 text-xs cursor-pointer hover:text-slate-600" onClick={() => setDoctorDemoStep(0)}>
                            <ArrowRight className="w-3 h-3 rotate-180" /> {t('landing.scenarios.doctorDemo.backToList') || 'Retour liste'}
                          </div>
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h3 className="text-lg font-bold text-slate-800">Jean Dupont</h3>
                              <p className="text-xs text-slate-500">Homme, 54 ans • Motif: Dyspnée persistante</p>
                            </div>
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">JD</div>
                          </div>

                          <div className="flex-1 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/30 flex flex-col items-center justify-center gap-4 hover:bg-blue-50 transition-all cursor-pointer group" onClick={handleImportData}>
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                              <Upload className="w-8 h-8 text-blue-500" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-bold text-blue-800 group-hover:text-blue-600">Importer des données</p>
                              <p className="text-xs text-slate-500 mt-1">Glisser-déposer IRM, PDF, Audio...</p>
                            </div>
                          </div>

                          {doctorIsProcessing && (
                            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-xl">
                              <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                              <p className="text-sm font-bold text-slate-800">{t('landing.scenarios.doctorDemo.import.security')}</p>
                              <p className="text-xs text-slate-500 font-mono mt-1">{t('landing.scenarios.doctorDemo.import.encryption')}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* STEP 2: ANALYZE (SCANNING) */}
                      {doctorDemoStep === 2 && (
                        <div className="animate-fade-in h-full flex flex-col justify-center items-center text-center">
                          <div className="bg-white p-1 rounded-xl shadow-lg border border-slate-100 mb-6 relative">
                            <div className="w-48 h-48 bg-black rounded-lg overflow-hidden relative">
                              <BrainScanSVG isScanning={true} />
                            </div>
                            <div className="absolute -bottom-3 -right-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-md flex items-center gap-1">
                              <Activity className="w-3 h-3 animate-pulse" /> ANALYSE
                            </div>
                          </div>

                          <div className="w-full max-w-xs space-y-3 mt-4">
                            <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                              <div className="flex justify-between text-xs mb-2 font-medium text-slate-700">
                                <span className="flex items-center gap-2"><Scan className="w-3 h-3 text-blue-500" /> Vision (IRM)</span>
                                <span className="text-blue-600">Analyse...</span>
                              </div>
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-full animate-[shimmer_1.5s_infinite]"></div></div>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                              <div className="flex justify-between text-xs mb-2 font-medium text-slate-700">
                                <span className="flex items-center gap-2"><FileText className="w-3 h-3 text-purple-500" /> {t('landing.scenarios.doctorDemo.analysis.nlp')}</span>
                                <span className="text-purple-600">{t('landing.scenarios.doctorDemo.analysis.extracting')}</span>
                              </div>
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-purple-500 w-[60%] animate-[shimmer_2s_infinite]"></div></div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* STEP 3: RESULTS (STATIC VIEW BEFORE EXPLAIN) */}
                      {doctorDemoStep === 3 && (
                        <div className="animate-fade-in pb-16">
                          <h3 className="text-lg font-bold text-slate-800 mb-4">Résultats de l'analyse</h3>

                          <div className="space-y-3 mb-6">
                            <div className="bg-white p-4 rounded-lg border-l-4 border-blue-600 shadow-md cursor-pointer hover:bg-blue-50/30 transition-colors group" onClick={handleShowExplainability}>
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-slate-800 text-sm">{t('landing.scenarios.doctorDemo.analysis.diagnosis')}</h4>
                                <span className="text-[10px] font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full shadow-sm shadow-blue-200">{t('landing.scenarios.doctorDemo.analysis.confidence')}</span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                                <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 w-[94%]"></div>
                              </div>
                              <p className="text-xs text-slate-500 flex items-center gap-1 group-hover:text-blue-600">
                                <ShieldCheck className="w-3 h-3" /> Voir les preuves cliniques (3) <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                              </p>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-l-4 border-slate-300 shadow-sm opacity-60">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-slate-600 text-sm">Bronchite Aiguë</h4>
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">12% IA</span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-slate-400 w-[12%]"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* STEP 4: EXPLAINABILITY (HEATMAP) & COLLAB */}
                      {doctorDemoStep === 4 && (
                        <div className="animate-fade-in pb-20">
                          <div className="flex items-center gap-2 text-slate-400 mb-4 text-xs cursor-pointer hover:text-slate-600" onClick={() => setDoctorDemoStep(3)}>
                            <ArrowRight className="w-3 h-3 rotate-180" /> Retour
                          </div>
                          <h3 className="text-lg font-bold text-slate-800 mb-4">Analyse Détaillée (White Box)</h3>

                          <div className="grid grid-cols-2 gap-3 mb-6">
                            {/* Heatmap Visualization with Toggle */}
                            <div className="bg-white p-2 rounded-lg border border-red-100 shadow-md relative">
                              <div className="flex items-center justify-between mb-2 border-b border-slate-50 pb-1">
                                <div className="flex items-center gap-1">
                                  <Scan className="w-3 h-3 text-red-500" />
                                  <span className="text-[10px] font-bold text-slate-700">Anomalie</span>
                                </div>
                                <button onClick={() => setShowHeatmap(!showHeatmap)} className="text-slate-400 hover:text-slate-600">
                                  {showHeatmap ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                </button>
                              </div>
                              <div className="aspect-square bg-black rounded overflow-hidden relative">
                                <BrainScanSVG showAnomaly={true} showOverlay={showHeatmap} />
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="bg-white p-3 rounded-lg border border-orange-100 shadow-sm h-full">
                                <div className="flex items-center gap-2 mb-3">
                                  <FlaskConical className="w-4 h-4 text-orange-500" />
                                  <span className="text-xs font-bold text-slate-700">Bio-marqueurs</span>
                                </div>
                                <div className="space-y-2">
                                  <div className="bg-orange-50 p-2 rounded border border-orange-100">
                                    <div className="flex justify-between text-[10px] mb-1"><span className="text-slate-500">CRP</span> <span className="text-red-600 font-bold">45 mg/L ↑</span></div>
                                    <div className="h-1 bg-orange-200 rounded-full overflow-hidden"><div className="h-full bg-red-500 w-[80%]"></div></div>
                                  </div>
                                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                    <div className="flex justify-between text-[10px]"><span className="text-slate-500">Leuco</span> <span className="text-slate-700 font-bold">Normal</span></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Collaboration Chat */}
                          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-700 flex items-center gap-1"><MessageCircle className="w-3 h-3" /> Avis Spécialiste</span>
                            </div>
                            <div className="p-3 space-y-3 max-h-32 overflow-y-auto">
                              {doctorChatHistory.map((msg, idx) => (
                                <div key={idx} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                                  <div className={`px-3 py-2 rounded-lg text-xs max-w-[85%] ${msg.isMe ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                    {msg.text}
                                  </div>
                                  <span className="text-[9px] text-slate-400 mt-1">{msg.sender}</span>
                                </div>
                              ))}
                              {doctorIsProcessing && (
                                <div className="flex items-center gap-1 text-xs text-slate-400 italic">
                                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-75"></span>
                                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-150"></span>
                                </div>
                              )}
                            </div>
                            {doctorChatHistory.length === 0 && (
                              <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                                <button onClick={handleDoctorCollaborate} className="text-xs text-blue-600 font-bold hover:bg-blue-50 px-4 py-1 rounded-full transition-colors">Demander avis @pneumo</button>
                              </div>
                            )}
                            {doctorChatHistory.length > 1 && (
                              <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                                <button onClick={handleValidateDiagnosis} className="w-full bg-green-600 text-white text-xs py-2 rounded font-bold shadow-sm hover:bg-green-700 transition-colors">
                                  Valider le diagnostic
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* STEP 6: REPORT */}
                      {doctorDemoStep === 6 && (
                        <div className="animate-slide-up h-full bg-white rounded-t-2xl -mx-4 -mb-4 p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] relative flex flex-col justify-between">
                          <div>
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-slate-200 rounded-full"></div>
                            <div className="flex items-center gap-2 text-green-600 mb-4">
                              <Check className="w-5 h-5 bg-green-100 rounded-full p-1" />
                              <h3 className="font-bold text-slate-800">Rapport Généré avec succès</h3>
                            </div>

                            <div className="space-y-4 text-sm text-slate-600 font-mono bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs shadow-inner">
                              <div className="flex justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-800">CONFIDENTIEL</span>
                                <span>#8492</span>
                              </div>
                              <p><span className="font-bold text-slate-800">Patient:</span> Jean Dupont</p>
                              <p><span className="font-bold text-slate-800">Diagnostic:</span> Pneumonie Atypique</p>
                              <p><span className="font-bold text-slate-800">Preuves IA:</span> Lésion T2 Flair (94%), Bio (CRP+)</p>
                              <p><span className="font-bold text-slate-800">Décision:</span> Traitement antibiotique initié.</p>
                              <div className="h-px bg-slate-200 my-2"></div>
                              <div className="flex justify-between items-center">
                                <p className="text-[10px] text-slate-400 italic">Signé électroniquement</p>
                                <ShieldCheck className="w-3 h-3 text-slate-400" />
                              </div>
                            </div>
                          </div>

                          {/* IN-DEMO CTA (NOUVEAU) */}
                          <div className="mt-6 text-center">
                            <p className="text-xs text-slate-500 mb-3">Convaincu par la simplicité ?</p>
                            <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all transform hover:-translate-y-1">
                              Installer HopeVisionAI pour mon cabinet
                            </button>
                            <div className="mt-3 flex gap-2 justify-center">
                              <button onClick={() => setDoctorDemoStep(0)} className="text-xs text-slate-400 hover:text-slate-600 underline">Recommencer démo</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Workflow Description */}
                <div className="p-10 lg:p-16 flex flex-col justify-center bg-white order-1 lg:order-2">
                  <div className="inline-flex items-center gap-2 text-blue-600 mb-4 font-bold text-sm uppercase tracking-wide">
                    <Activity className="w-4 h-4" /> {t('landing.scenarios.workflow.tag')}
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                    {t('landing.scenarios.workflow.title')}
                  </h3>
                  <p className="text-slate-600 mb-8 text-lg leading-relaxed">
                    {t('landing.scenarios.workflow.description')}
                  </p>
                  <div className="space-y-6 relative">
                    <div className="absolute left-[19px] top-4 bottom-10 w-0.5 bg-slate-100"></div>
                    {[
                      { step: 1, title: t('landing.scenarios.workflow.steps.centralization.title'), text: t('landing.scenarios.workflow.steps.centralization.text'), active: doctorDemoStep >= 1 },
                      { step: 2, title: t('landing.scenarios.workflow.steps.analysis.title'), text: t('landing.scenarios.workflow.steps.analysis.text'), active: doctorDemoStep >= 2 },
                      { step: 3, title: t('landing.scenarios.workflow.steps.collaboration.title'), text: t('landing.scenarios.workflow.steps.collaboration.text'), active: doctorDemoStep >= 4 },
                      { step: 4, title: t('landing.scenarios.workflow.steps.report.title'), text: t('landing.scenarios.workflow.steps.report.text'), active: doctorDemoStep >= 6 },
                    ].map((item, i) => (
                      <div key={i} className={`flex items-start gap-4 relative z-10 transition-opacity duration-500 ${item.active ? 'opacity-100' : 'opacity-40'}`}>
                        <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center flex-shrink-0 font-bold text-sm transition-colors duration-500 ${item.active ? 'border-blue-100 bg-blue-600 text-white' : 'border-slate-50 bg-white text-slate-400'}`}>
                          {item.step}
                        </div>
                        <div className="pt-1">
                          <h4 className={`font-bold text-lg transition-colors duration-500 ${item.active ? 'text-blue-900' : 'text-slate-400'}`}>{item.title}</h4>
                          <p className="text-slate-500 text-sm">{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // --- PATIENT SCENARIO ---
              <div className="grid grid-cols-1 lg:grid-cols-2 h-full animate-fade-in">
                {/* Code Patient (similaire à avant, juste pour la complétude visuelle si on switch) */}
                <div className="relative overflow-hidden flex items-center justify-center p-8 lg:p-12 order-2 lg:order-1" style={{ backgroundColor: '#E8FBF4' }}>
                  <div className="w-full max-w-[340px] h-[680px] bg-white rounded-[2.5rem] border-[8px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col transform hover:scale-[1.02] transition-transform duration-500">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-xl z-30"></div>
                    <div className="text-white p-5 pt-10 pb-4 z-20 shadow-md flex justify-between items-center" style={{ backgroundColor: '#00B894' }}>
                      <div className="flex items-center gap-2"><Brain className="w-5 h-5" /><span className="font-bold text-sm tracking-wide">HopeVision</span></div>
                      <div className="flex gap-2"><div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div><button onClick={resetPatientDemo} className="text-teal-100 hover:text-white"><RefreshCw className="w-4 h-4" /></button></div>
                    </div>
                    <div className="flex-1 bg-slate-50 p-4 space-y-4 overflow-y-auto scrollbar-hide relative">
                      {patientChatHistory.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''} animate-fade-in-up`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.type === 'ai' ? 'bg-teal-100 text-teal-600' : 'bg-blue-100 text-blue-600'}`}>{msg.type === 'ai' ? <Brain className="w-4 h-4" /> : <span className="text-[10px] font-bold">MOI</span>}</div>
                          <div className={`p-3 rounded-2xl text-sm max-w-[85%] shadow-sm leading-relaxed ${msg.type === 'ai' ? 'bg-white rounded-tl-none border border-slate-100 text-slate-700' : 'bg-blue-600 rounded-tr-none text-white'}`}>{msg.text}</div>
                        </div>
                      ))}
                      {patientIsTyping && (<div className="flex gap-3 animate-pulse"><div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0"><Brain className="w-4 h-4 text-teal-600" /></div><div className="bg-slate-200 p-3 rounded-2xl rounded-tl-none text-sm text-slate-500 flex gap-1 items-center w-16"><span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span><span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span></div></div>)}
                      {patientDemoStep === 4 && !patientIsTyping && (<div className="flex flex-col items-center justify-center py-4 animate-fade-in"><div className="w-12 h-12 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin mb-3"></div><p className="text-xs text-slate-500 font-mono">Analyse des symptômes...</p></div>)}
                      {patientDemoStep >= 5 && (
                        <div className="space-y-4 animate-fade-in-up">
                          <div className="bg-white rounded-xl border border-teal-100 shadow-md overflow-hidden">
                            <div className="bg-teal-50 px-4 py-2 border-b border-teal-100 flex justify-between items-center"><span className="text-xs font-bold text-teal-800 uppercase tracking-wider">Pré-Rapport IA</span><span className="bg-orange-100 text-orange-600 text-[10px] px-2 py-0.5 rounded-full font-bold">Priorité Moyenne</span></div>
                            <div className="p-4"><div className="flex justify-between items-start mb-2"><div><h4 className="font-bold text-slate-800 text-sm">Angine bactérienne probable</h4><p className="text-xs text-slate-500">Confiance IA: 92%</p></div><Activity className="w-5 h-5 text-orange-500" /></div><p className="text-xs text-slate-600 mb-3">Symptômes corrélés : Gorge irritée, Fièvre modérée, &gt; 3 jours.</p><div className="text-[10px] bg-slate-50 p-2 rounded text-slate-400 italic flex gap-1"><ShieldCheck className="w-3 h-3" /> Ceci est une aide à la décision, consultez un médecin.</div></div>
                          </div>
                          {patientDemoStep === 5 && (<><div className="bg-blue-50 p-3 rounded-lg flex gap-2 items-center animate-pulse"><Brain className="w-4 h-4 text-blue-600" /><p className="text-xs text-blue-800 font-medium">Je vous recommande un généraliste ou ORL.</p></div><div className="space-y-2">{[{ name: "Dr. M. Alami", spec: "Généraliste", dist: "1.2km", img: "bg-blue-200" }, { name: "Dr. S. Benali", spec: "ORL", dist: "3.5km", img: "bg-green-200" }].map((doc, i) => (<div key={i} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center"><div className="flex gap-3 items-center"><div className={`w-10 h-10 rounded-full ${doc.img} flex items-center justify-center text-xs font-bold text-slate-600`}>{doc.name.charAt(4)}</div><div><h5 className="font-bold text-sm text-slate-800">{doc.name}</h5><p className="text-[10px] text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {doc.dist} • {doc.spec}</p></div></div><button onClick={handlePatientBooking} className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700">Réserver</button></div>))}</div></>)}
                        </div>
                      )}
                      {patientDemoStep === 6 && (<div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm flex items-end z-40"><div className="bg-white w-full rounded-t-2xl p-5 animate-slide-up"><h4 className="font-bold text-slate-800 mb-4">Choisir un créneau</h4><div className="grid grid-cols-3 gap-2 mb-4">{["09:30", "11:00", "14:15"].map(slot => (<button key={slot} className="border border-slate-200 py-2 rounded-lg text-sm hover:bg-blue-50 hover:border-blue-200 text-slate-600">{slot}</button>))}</div><div className="flex gap-2"><button className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2"><Video className="w-4 h-4" /> Visio</button><button className="flex-1 bg-white border border-slate-200 text-slate-700 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2"><MapPin className="w-4 h-4" /> Cabinet</button></div></div></div>)}
                      {patientDemoStep === 7 && (<div className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center z-50 text-center p-6 animate-fade-in"><div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6"><Check className="w-10 h-10 text-green-600" /></div><h3 className="text-2xl font-bold text-slate-800 mb-2">Confirmé !</h3><p className="text-slate-600 text-sm mb-6">Votre pré-rapport a été transmis sécuritairement au Dr. Alami.</p><button onClick={resetPatientDemo} className="text-blue-600 font-bold text-sm hover:underline">Recommencer la démo</button></div>)}
                    </div>
                    <div className="p-3 bg-white border-t border-slate-100 z-30">
                      {patientDemoStep === 0 && (<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">{["Mal de gorge", "Douleur poitrine", "Fièvre élevée"].map((symp, i) => (<button key={i} onClick={() => handlePatientSymptomSelect(symp)} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap hover:bg-blue-100 transition-colors">{symp}</button>))}</div>)}
                      {patientDemoStep === 2 && (<div className="flex items-center justify-between px-2 animate-fade-in"><p className="text-xs text-slate-400 mr-2">Ajouter :</p><div className="flex gap-4"><button onClick={() => handlePatientMultimodalInput('camera')} className="p-2 bg-slate-100 rounded-full hover:bg-teal-100 hover:text-teal-600 transition-colors group relative"><Camera className="w-5 h-5 text-slate-500 group-hover:text-teal-600" /><span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Photo</span></button><button onClick={() => handlePatientMultimodalInput('mic')} className="p-2 bg-slate-100 rounded-full hover:bg-teal-100 hover:text-teal-600 transition-colors group relative"><Mic className="w-5 h-5 text-slate-500 group-hover:text-teal-600" /><span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Vocal</span></button><button onClick={() => handlePatientMultimodalInput('doc')} className="p-2 bg-slate-100 rounded-full hover:bg-teal-100 hover:text-teal-600 transition-colors group relative"><Paperclip className="w-5 h-5 text-slate-500 group-hover:text-teal-600" /><span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Doc</span></button></div></div>)}
                      {patientDemoStep === 3 && (<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide animate-fade-in">{["< 24h", "2-3 jours", "> 1 semaine"].map((dur, i) => (<button key={i} onClick={() => handlePatientDurationSelect(dur)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap hover:bg-slate-200 transition-colors">{dur}</button>))}</div>)}
                      {(patientDemoStep === 1 || patientDemoStep >= 4) && (<div className="h-10 bg-slate-100 rounded-full flex items-center px-4 text-slate-400 text-xs justify-between opacity-50"><span>Répondre...</span><Send className="w-4 h-4" /></div>)}
                    </div>
                  </div>
                </div>
                <div className="p-10 lg:p-16 flex flex-col justify-center bg-white order-1 lg:order-2">
                  <div className="inline-flex items-center gap-2 text-teal-600 mb-4 font-bold text-sm uppercase tracking-wide"><Smartphone className="w-4 h-4" /> {t('landing.scenarios.patientDemo.tag')}</div>
                  <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">{t('landing.scenarios.patientDemo.title')}</h3>
                  <p className="text-slate-600 mb-8 text-lg leading-relaxed">{t('landing.scenarios.patientDemo.description')}</p>
                  <div className="space-y-6">
                    {[{ title: t('landing.scenarios.patientDemo.features.multimodal.title'), text: t('landing.scenarios.patientDemo.features.multimodal.text'), icon: Mic }, { title: t('landing.scenarios.patientDemo.features.reasoning.title'), text: t('landing.scenarios.patientDemo.features.reasoning.text'), icon: Brain }, { title: t('landing.scenarios.patientDemo.features.orientation.title'), text: t('landing.scenarios.patientDemo.features.orientation.text'), icon: Calendar }].map((feat, i) => (<div key={i} className="flex items-start gap-4 group cursor-default"><div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0 mt-1 transition-colors"><feat.icon className="w-5 h-5" /></div><div><h4 className="font-bold text-slate-900 text-lg group-hover:text-teal-600 transition-colors">{feat.title}</h4><p className="text-slate-600 text-sm">{feat.text}</p></div></div>))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --- B2B SECTION --- */}
      {/* ==================================================================
          SECTION OPTIMISÉE : INSTITUTIONS & PAYEURS (B2B)
          ================================================================== */}
      <section id="b2b-section" className="py-24 bg-white relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50/50 -skew-x-12 translate-x-20 -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">{t('landing.b2b.tag')}</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6">
              {t('landing.b2b.title')} <br /><span className="text-blue-600">{t('landing.b2b.titleHighlight')}</span>
            </h3>
            <p className="text-lg text-slate-600">
              {t('landing.b2b.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">

            {/* Card 1: Hôpitaux - Focus: ROI & Sécurité */}
            <div className="group flex flex-col p-8 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-2xl hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>

              {/* Badge Technique */}
              <div className="absolute top-4 right-4 px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase border border-slate-200">
                Compatible HL7 / FHIR
              </div>

              <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                <Building2 size={28} strokeWidth={1.5} />
              </div>

              <h4 className="text-xl font-bold text-slate-900">{t('landing.b2b.hospitals.title')}</h4>
              <p className="text-sm text-blue-600 font-bold mb-6 uppercase tracking-wide mt-1">{t('landing.b2b.hospitals.subtitle')}</p>

              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-start gap-3 text-slate-600 text-sm">
                  <CheckCircle2 size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span dangerouslySetInnerHTML={{ __html: t('landing.b2b.hospitals.points.time') }} />
                </li>
                <li className="flex items-start gap-3 text-slate-600 text-sm">
                  <CheckCircle2 size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span dangerouslySetInnerHTML={{ __html: t('landing.b2b.hospitals.points.security') }} />
                </li>
                <li className="flex items-start gap-3 text-slate-600 text-sm">
                  <CheckCircle2 size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span dangerouslySetInnerHTML={{ __html: t('landing.b2b.hospitals.points.flow') }} />
                </li>
              </ul>

              <button className="w-full py-3.5 px-4 rounded-xl border-2 border-slate-100 text-slate-700 font-bold hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 transition-all text-sm">
                {t('landing.b2b.hospitals.cta')}
              </button>
            </div>

            {/* Card 2: Assureurs - Focus: Coûts & Prévention */}
            <div className="group flex flex-col p-8 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-2xl hover:border-purple-200 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-purple-600"></div>

              {/* Badge Technique */}
              <div className="absolute top-4 right-4 px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase border border-slate-200">
                Modèle PMPM
              </div>

              <div className="h-14 w-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-sm">
                <ShieldCheck size={28} strokeWidth={1.5} />
              </div>

              <h4 className="text-xl font-bold text-slate-900">{t('landing.b2b.insurers.title')}</h4>
              <p className="text-sm text-purple-600 font-bold mb-6 uppercase tracking-wide mt-1">{t('landing.b2b.insurers.subtitle')}</p>

              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-start gap-3 text-slate-600 text-sm">
                  <CheckCircle2 size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span dangerouslySetInnerHTML={{ __html: t('landing.b2b.insurers.points.care') }} />
                </li>
                <li className="flex items-start gap-3 text-slate-600 text-sm">
                  <CheckCircle2 size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span dangerouslySetInnerHTML={{ __html: t('landing.b2b.insurers.points.prevention') }} />
                </li>
                <li className="flex items-start gap-3 text-slate-600 text-sm">
                  <CheckCircle2 size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span dangerouslySetInnerHTML={{ __html: t('landing.b2b.insurers.points.data') }} />
                </li>
              </ul>

              <button className="w-full py-3.5 px-4 rounded-xl border-2 border-slate-100 text-slate-700 font-bold hover:border-purple-600 hover:text-purple-600 hover:bg-purple-50 transition-all text-sm">
                {t('landing.b2b.insurers.cta')}
              </button>
            </div>

            {/* Card 3: Laboratoires - Focus: Data & R&D */}
            <div className="group flex flex-col p-8 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-2xl hover:border-cyan-200 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-cyan-600"></div>

              {/* Badge Technique */}
              <div className="absolute top-4 right-4 px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase border border-slate-200">
                Real World Evidence
              </div>

              <div className="h-14 w-14 bg-cyan-50 rounded-2xl flex items-center justify-center text-cyan-600 mb-6 group-hover:bg-cyan-600 group-hover:text-white transition-colors shadow-sm">
                <FlaskConical size={28} strokeWidth={1.5} />
              </div>

              <h4 className="text-xl font-bold text-slate-900">{t('landing.b2b.labs.title')}</h4>
              <p className="text-sm text-cyan-600 font-bold mb-6 uppercase tracking-wide mt-1">{t('landing.b2b.labs.subtitle')}</p>

              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-start gap-3 text-slate-600 text-sm">
                  <CheckCircle2 size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span dangerouslySetInnerHTML={{ __html: t('landing.b2b.labs.points.data') }} />
                </li>
                <li className="flex items-start gap-3 text-slate-600 text-sm">
                  <CheckCircle2 size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span dangerouslySetInnerHTML={{ __html: t('landing.b2b.labs.points.cohorts') }} />
                </li>
                <li className="flex items-start gap-3 text-slate-600 text-sm">
                  <CheckCircle2 size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span dangerouslySetInnerHTML={{ __html: t('landing.b2b.labs.points.rwe') }} />
                </li>
              </ul>

              <button className="w-full py-3.5 px-4 rounded-xl border-2 border-slate-100 text-slate-700 font-bold hover:border-cyan-600 hover:text-cyan-600 hover:bg-cyan-50 transition-all text-sm">
                {t('landing.b2b.labs.cta')}
              </button>
            </div>

          </div>

          {/* Global B2B CTA - Reassurance */}
          <div
            className="relative mt-16 rounded-2xl p-8 md:p-16 text-center overflow-hidden shadow-2xl group"
            style={{ backgroundColor: '#050B1E' }}
          >

            {/* Effet de lueur (Gradient) en haut pour la profondeur */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center justify-center">

              {/* TITRE */}
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">
                {t('landing.b2b.cta.title')}
              </h3>

              {/* PARAGRAPHE (Correction de couleur forcée ici) */}
              <p
                className="mb-10 max-w-2xl mx-auto text-base md:text-lg leading-relaxed"
                style={{ color: '#cbd5e1' }} /* Force le gris clair (Slate-300) */
              >
                {t('landing.b2b.cta.description')}
              </p>

              {/* BOUTON (Ajusté pour être plus large et plus beau) */}
              <button 
                onClick={() => setShowCalendlyModal(true)}
                className="group/btn inline-flex items-center gap-3 bg-white text-[#050B1E] px-8 py-4 rounded-lg font-bold text-lg shadow-lg hover:shadow-white/25 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <BriefcaseMedical
                  size={22}
                  className="text-blue-800 transition-transform duration-300 group-hover/btn:-rotate-12"
                />
                <span>{t('landing.b2b.cta.button')}</span>
              </button>

            </div>
          </div>
        </div>
      </section>
      {/* ==================================================================
          FIN NOUVELLE SECTION OPTIMISÉE
          ================================================================== */}


      {/* --- TECH & MODULES --- */}
      {/* --- TECH & MODULES --- */}
      <section
        id="tech"
        className="py-16 lg:py-20 relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #050B1E 0%, #030711 50%, #050B1E 100%)'
        }}
      >
        {/* Multi-layered Background Effects */}
        <div className="absolute inset-0">
          {/* Layer 1: Large glows */}
          <div className="absolute top-20 left-1/4 w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25), transparent)', filter: 'blur(100px)' }}></div>
          <div className="absolute bottom-20 right-1/4 w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.25), transparent)', filter: 'blur(100px)' }}></div>

          {/* Layer 2: Medium accent glows */}
          <div className="absolute top-1/3 right-1/3 w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15), transparent)', filter: 'blur(80px)', animation: 'pulse 8s ease-in-out infinite' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <RevealSection className="mb-12 lg:mb-16">
            <div className="max-w-3xl">
              {/* Infrastructure Tag - Better Spacing */}
              <div
                className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full text-sm font-bold uppercase tracking-widest mb-8"
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  color: '#93c5fd',
                  boxShadow: '0 0 20px rgba(59, 130, 246, 0.15)'
                }}
              >
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#60a5fa', boxShadow: '0 0 8px #60a5fa' }}></span>
                {t('landing.tech.tag')}
              </div>

              {/* Title - Single Line, No Box */}
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white tracking-tight leading-tight">
                {t('landing.tech.title')}{' '}
                <span
                  style={{
                    background: 'linear-gradient(135deg, #60a5fa 0%, #22d3ee 50%, #5eead4 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0 0 30px rgba(96, 165, 250, 0.3))'
                  }}
                >
                  {t('landing.tech.titleHighlight')}
                </span>
              </h2>

              <p className="text-lg md:text-xl leading-relaxed max-w-2xl font-normal" style={{ color: '#cbd5e1', lineHeight: '1.7' }}>
                {t('landing.tech.subtitle')}
              </p>
            </div>
          </RevealSection>

          {/* Cards Grid - Properly Spaced */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              { title: t('landing.tech.cards.knowledgeGraph.title'), icon: Brain, iconColor: "#60a5fa", iconBg: "rgba(59, 130, 246, 0.12)", glowColor: "rgba(59, 130, 246, 0.4)", text: t('landing.tech.cards.knowledgeGraph.text') },
              { title: t('landing.tech.cards.security.title'), icon: ShieldCheck, iconColor: "#34d399", iconBg: "rgba(16, 185, 129, 0.12)", glowColor: "rgba(16, 185, 129, 0.4)", text: t('landing.tech.cards.security.text') },
              { title: t('landing.tech.cards.interoperability.title'), icon: Network, iconColor: "#a78bfa", iconBg: "rgba(139, 92, 246, 0.12)", glowColor: "rgba(139, 92, 246, 0.4)", text: t('landing.tech.cards.interoperability.text') },
              { title: t('landing.tech.cards.explainable.title'), icon: Lock, iconColor: "#fbbf24", iconBg: "rgba(251, 191, 36, 0.12)", glowColor: "rgba(251, 191, 36, 0.4)", text: t('landing.tech.cards.explainable.text') },
              { title: t('landing.tech.cards.learning.title'), icon: HeartPulse, iconColor: "#fb7185", iconBg: "rgba(251, 113, 133, 0.12)", glowColor: "rgba(251, 113, 133, 0.4)", text: t('landing.tech.cards.learning.text') },
              { title: t('landing.tech.cards.digitalTwin.title'), icon: Users, iconColor: "#22d3ee", iconBg: "rgba(6, 182, 212, 0.12)", glowColor: "rgba(6, 182, 212, 0.4)", text: t('landing.tech.cards.digitalTwin.text') }
            ].map((item, index) => (
              <RevealSection key={index}>
                <div
                  className="group h-full px-6 py-6 lg:px-8 lg:py-8 rounded-2xl lg:rounded-3xl transition-all duration-700 hover:-translate-y-3 hover:scale-[1.02] relative overflow-hidden cursor-default"
                  style={{
                    backgroundColor: '#0b1220',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(16px)',
                    boxShadow: `
                      0 10px 40px -10px rgba(0, 0, 0, 0.4),
                      0 0 0 1px rgba(255, 255, 255, 0.05) inset,
                      0 1px 0 0 rgba(255, 255, 255, 0.1) inset
                    `,
                    transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                    e.currentTarget.style.boxShadow = `
                      0 20px 60px -10px ${item.glowColor},
                      0 0 0 1px rgba(255, 255, 255, 0.1) inset,
                      0 1px 0 0 rgba(255, 255, 255, 0.15) inset
                    `;
                    e.currentTarget.style.backgroundColor = 'rgba(11, 18, 32, 0.9)';
                    e.currentTarget.style.borderColor = `${item.iconColor}40`;
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                    e.currentTarget.style.boxShadow = `
                      0 10px 40px -10px rgba(0, 0, 0, 0.4),
                      0 0 0 1px rgba(255, 255, 255, 0.05) inset,
                      0 1px 0 0 rgba(255, 255, 255, 0.1) inset
                    `;
                    e.currentTarget.style.backgroundColor = '#0b1220';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                >
                  {/* Top Accent Line */}
                  <div
                    className="absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{
                      background: `linear-gradient(90deg, transparent 0%, ${item.iconColor} 50%, transparent 100%)`
                    }}
                  ></div>

                  {/* Inner glow effect */}
                  <div
                    className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{
                      background: `radial-gradient(circle, ${item.glowColor}, transparent 70%)`,
                      filter: 'blur(60px)'
                    }}
                  ></div>

                  <div className="flex flex-col h-full relative z-10">
                    {/* Icon Container - Rounded Corners */}
                    <div
                      className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center mb-6 lg:mb-8 transition-all duration-700 group-hover:scale-110 group-hover:rotate-6"
                      style={{
                        backgroundColor: item.iconBg,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: `0 8px 24px -8px ${item.glowColor}`
                      }}
                    >
                      <item.icon className="w-8 h-8 lg:w-10 lg:h-10" style={{ color: item.iconColor }} />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-5 text-white leading-tight">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm lg:text-base leading-relaxed font-normal mb-6 lg:mb-8" style={{ color: '#cbd5e1', lineHeight: '1.7' }}>
                      {item.text}
                    </p>

                    {/* Learn More Link */}
                    <div className="mt-auto opacity-0 group-hover:opacity-100 transition-all duration-700 transform translate-y-3 group-hover:translate-y-0">
                      <span
                        className="text-xs lg:text-sm font-bold uppercase tracking-widest flex items-center gap-2.5"
                        style={{ color: item.iconColor }}
                      >
                        En savoir plus <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>




      {/* --- TESTIMONIALS --- */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">{t('landing.testimonials.title')}</h2>
            <p className="text-slate-500">{t('landing.testimonials.subtitle')}</p>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { quote: t('landing.testimonials.items.0.quote'), name: t('landing.testimonials.items.0.name'), title: t('landing.testimonials.items.0.title'), color: "blue" },
              { quote: t('landing.testimonials.items.1.quote'), name: t('landing.testimonials.items.1.name'), title: t('landing.testimonials.items.1.title'), color: "teal" },
              { quote: t('landing.testimonials.items.2.quote'), name: t('landing.testimonials.items.2.name'), title: t('landing.testimonials.items.2.title'), color: "purple" }
            ].map((testimonial, i) => (
              <RevealSection key={i} className={`bg-slate-50 p-8 rounded-2xl border border-slate-100 relative hover:shadow-lg transition-shadow delay-${i * 100}`}>
                <div className="flex text-yellow-400 mb-4 gap-1"><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /></div>
                <p className="text-slate-700 mb-6 italic leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
                  <div className={`w-10 h-10 rounded-full bg-${testimonial.color}-600 flex items-center justify-center text-white font-bold text-sm`}>{testimonial.name.charAt(0)}</div>
                  <div>
                    <div className="font-bold text-slate-900">{testimonial.name}</div>
                    <div className="text-xs text-slate-500">{testimonial.title}</div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-24 bg-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <RevealSection>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              {t('landing.cta.title')}
            </h2>
            <p className="text-blue-100 text-xl mb-10 max-w-2xl mx-auto">
              {t('landing.cta.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <button 
                onClick={() => setShowWaitlistModal(true)}
                className="px-8 py-4 bg-white text-blue-600 rounded-full font-bold text-lg hover:bg-blue-50 transition-all shadow-xl hover:-translate-y-1 text-center w-full sm:w-auto"
              >
                {t('landing.hero.cta.primary')}
              </button>
              <button 
                onClick={() => setShowCalendlyModal(true)}
                className="px-8 py-4 border-2 border-white text-white rounded-full font-bold text-lg hover:bg-white/10 transition-all hover:-translate-y-1 text-center w-full sm:w-auto"
              >
                {t('landing.hero.cta.secondary')}
              </button>
            </div>

            <p className="text-blue-200 text-sm opacity-90 mb-4 max-w-2xl mx-auto">
              {t('landing.hero.cta.expectations')}
            </p>

            <p className="text-blue-200 text-sm opacity-80 flex items-center justify-center gap-4 flex-wrap">
              <span className="flex items-center gap-1"><Check className="w-3 h-3" /> {t('landing.cta.noCard')}</span>
              <span className="flex items-center gap-1"><Check className="w-3 h-3" /> {t('landing.cta.hdsInstall')}</span>
            </p>
          </RevealSection>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section id="faq" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4">
          <RevealSection className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">{t('landing.faq.title')}</h2>
            <p className="text-slate-500">{t('landing.faq.subtitle')}</p>
          </RevealSection>
          <div className="space-y-2">
            <FAQItem
              question={t('landing.faq.items.0.question')}
              answer={t('landing.faq.items.0.answer')}
            />
            <FAQItem
              question={t('landing.faq.items.1.question')}
              answer={t('landing.faq.items.1.answer')}
            />
            <FAQItem
              question={t('landing.faq.items.2.question')}
              answer={t('landing.faq.items.2.answer')}
            />
            <FAQItem
              question={t('landing.faq.items.3.question')}
              answer={t('landing.faq.items.3.answer')}
            />
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-50 pt-16 pb-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 text-center md:text-left">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1">
              <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
                <div className="bg-blue-600 p-1.5 rounded-lg"><Brain className="h-5 w-5 text-white" /></div>
                <span className="text-xl font-bold text-slate-900">HopeVisionAI</span>
              </div>
              <p className="text-slate-500 text-sm">{t('landing.footer.tagline')}</p>
            </div>
            {/* Links simplified for brevity */}
            <div><h4 className="font-bold mb-4">{t('landing.footer.product')}</h4><ul className="text-sm text-slate-600 space-y-2"><li>{t('landing.footer.productLinks.doctors')}</li><li>{t('landing.footer.productLinks.patients')}</li></ul></div>
            <div><h4 className="font-bold mb-4">{t('landing.footer.company')}</h4><ul className="text-sm text-slate-600 space-y-2"><li>{t('landing.footer.companyLinks.about')}</li><li>{t('landing.footer.companyLinks.contact')}</li></ul></div>
            <div><h4 className="font-bold mb-4">{t('landing.footer.legal')}</h4><ul className="text-sm text-slate-600 space-y-2"><li>{t('landing.footer.legalLinks.privacy')}</li><li>{t('landing.footer.legalLinks.hds')}</li></ul></div>
          </div>
          <div className="border-t border-slate-200 pt-8 text-slate-400 text-sm flex justify-between items-center">
            <p>{t('landing.footer.copyright')}</p>
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>{t('landing.footer.operational')}</div>
          </div>
        </div>
      </footer>

      {/* Beta Waitlist Modal */}
      {showWaitlistModal && (
        <BetaWaitlistModal 
          onClose={() => setShowWaitlistModal(false)}
          onRedirectToDemo={() => {
            setShowWaitlistModal(false);
            setShowCalendlyModal(true);
          }}
        />
      )}

      {/* Calendly Modal */}
      {showCalendlyModal && (
        <CalendlyModal 
          onClose={() => setShowCalendlyModal(false)}
          calendlyUrl="https://calendly.com/amirakaroui20/demo-hopevisionai"
        />
      )}
    </div>
  );
}
