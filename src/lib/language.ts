import { createContext, useContext } from 'react';

export type Language = 'th' | 'en';
export type Translator = (thai: string, english: string) => string;

export const LANGUAGE_STORAGE_KEY = 'ig-follow-analyzer-language';

export const LanguageContext = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
}>({ language: 'th', setLanguage: () => {} });

const languages: Record<Language, { locale: string; t: Translator }> = {
  th: { locale: 'th-TH', t: (thai) => thai },
  en: { locale: 'en-GB', t: (_, english) => english },
};

export function getLanguageFormat(language: Language) {
  return languages[language];
}

export function useLanguage() {
  const preference = useContext(LanguageContext);
  return { ...preference, ...getLanguageFormat(preference.language) };
}

export function readLanguage(): Language {
  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'en' ? 'en' : 'th';
  } catch {
    return 'th';
  }
}
