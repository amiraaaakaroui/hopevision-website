import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface CalendlyModalProps {
  onClose: () => void;
  calendlyUrl?: string;
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
      aria-labelledby="calendly-modal-title"
    >
      <div ref={modalRef} className="w-full max-w-4xl outline-none" tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// MODALE CALENDLY
// ----------------------------------------------------------------------
export function CalendlyModal({ onClose, calendlyUrl = 'https://calendly.com/amirakaroui20/demo-hopevisionai' }: CalendlyModalProps) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  // Handle iframe errors
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('error', () => {
        setIsLoading(false);
      });
    }
  }, []);

  // Construct Calendly embed URL
  // Calendly embed format: https://calendly.com/USERNAME/EVENT_NAME/embed
  const embedUrl = calendlyUrl.includes('/embed') 
    ? calendlyUrl 
    : `${calendlyUrl}/embed`;

  return (
    <ModalWrapper onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full h-[90vh] max-h-[800px] relative animate-scale-in ring-1 ring-slate-900/5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
          <h2 id="calendly-modal-title" className="text-xl font-bold text-slate-900">
            {t('calendly.title')}
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={t('calendly.close')}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content with Loader */}
        <div className="relative w-full h-[calc(90vh-73px)]">
          {/* Loader */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-slate-600 font-medium">{t('calendly.loading')}</p>
              </div>
            </div>
          )}

          {/* Calendly Iframe */}
          <iframe
            ref={iframeRef}
            src={embedUrl}
            className="w-full h-full border-0"
            title={t('calendly.title')}
            onLoad={handleIframeLoad}
            allow="camera; microphone; geolocation"
            style={{ minHeight: '650px' }}
          />
        </div>
      </div>
    </ModalWrapper>
  );
}
