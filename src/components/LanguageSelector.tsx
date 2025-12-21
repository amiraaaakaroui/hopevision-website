import React, { useState } from 'react';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { Globe, Check } from 'lucide-react';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages: { code: Language; label: string; nativeLabel: string }[] = [
    { code: 'fr', label: 'French', nativeLabel: 'Français' },
    { code: 'en', label: 'English', nativeLabel: 'English' },
  ];

  const currentLang = languages.find(lang => lang.code === language);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors text-sm font-medium"
        title={t('common.language')}
      >
        <Globe className="w-4 h-4" />
        <span className="uppercase hidden sm:inline">{language === 'fr' ? 'FR' : 'EN'}</span>
        <span className="uppercase sm:hidden">{language === 'fr' ? 'FR' : 'EN'}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{lang.nativeLabel}</span>
                  <span className="text-xs text-slate-500">{lang.label}</span>
                </div>
                {language === lang.code && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
