import React, { createContext, useContext, useEffect, useState } from 'react';
import { getIsRTL, toggleLanguage, setLanguage, getLanguage } from '../i18n/config';

interface LanguageContextType {
  isRTL: boolean;
  language: string;
  toggleLanguage: () => Promise<void>;
  setLanguage: (lang: string) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isRTL, setIsRTL] = useState(getIsRTL());
  const [language, setLanguageState] = useState(getLanguage());

  useEffect(() => {
    // Update RTL state whenever language changes
    setIsRTL(getIsRTL());
  }, [language]);

  const handleToggleLanguage = async () => {
    await toggleLanguage();
    setLanguageState(getLanguage());
    setIsRTL(getIsRTL());
  };

  const handleSetLanguage = async (lang: string) => {
    await setLanguage(lang);
    setLanguageState(getLanguage());
    setIsRTL(getIsRTL());
  };

  return (
    <LanguageContext.Provider
      value={{
        isRTL,
        language,
        toggleLanguage: handleToggleLanguage,
        setLanguage: handleSetLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
