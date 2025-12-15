import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './locales/en.json';
import ar from './locales/ar.json';

// Get device language
const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';

// Determine if device uses RTL language
const isRTL = deviceLanguage === 'ar';

const resources = {
  en: { translation: en },
  ar: { translation: ar },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: deviceLanguage.startsWith('ar') ? 'ar' : 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    ns: ['translation'],
    defaultNS: 'translation',
  });

export const getIsRTL = (): boolean => {
  return i18n.language === 'ar';
};

export const toggleLanguage = async (): Promise<void> => {
  const currentLanguage = i18n.language;
  const newLanguage = currentLanguage === 'ar' ? 'en' : 'ar';
  await i18n.changeLanguage(newLanguage);
};

export const setLanguage = async (language: string): Promise<void> => {
  await i18n.changeLanguage(language);
};

export const getLanguage = (): string => {
  return i18n.language;
};

export default i18n;
