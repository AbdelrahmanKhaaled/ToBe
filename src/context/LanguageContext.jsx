import { createContext, useContext, useEffect, useState } from 'react';
import i18n from '@/i18n';

const LanguageContext = createContext(null);

const STORAGE_KEY = 'dashboard_lang';
const DEFAULT_LANG = 'en';

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(DEFAULT_LANG);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'ar' || stored === 'en') {
      setLang(stored);
      i18n.changeLanguage(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const setLanguage = (next) => {
    const value = next === 'ar' ? 'ar' : 'en';
    setLang(value);
    localStorage.setItem(STORAGE_KEY, value);
    i18n.changeLanguage(value);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

