import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import frTranslations from '../translations/fr.json';
import enTranslations from '../translations/en.json';

export type Language = 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Export hook separately for Fast Refresh compatibility
function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export { useLanguage };

interface LanguageProviderProps {
  children: ReactNode;
}

const translations: Record<Language, any> = {
  fr: frTranslations,
  en: enTranslations,
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Try to get from localStorage, default to French
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hopevision-language');
      return (saved === 'en' || saved === 'fr') ? saved : 'fr';
    }
    return 'fr';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hopevision-language', lang);
    }
  };

  const t = useMemo(() => {
    return (key: string, params?: Record<string, string | number>): string => {
      const keys = key.split('.');
      let value: any = translations[language];
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          console.warn(`Translation key "${key}" not found for language "${language}"`);
          return key;
        }
      }

      if (typeof value !== 'string') {
        return key;
      }

      // Replace parameters if provided
      if (params) {
        return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
          return params[paramKey]?.toString() || match;
        });
      }

      return value;
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
