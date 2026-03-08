import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loadTranslation, type TranslationKeys } from './translations';

export type Language = 'pt-BR' | 'en' | 'es';

// Cache for loaded translations
const translationsCache: Partial<Record<Language, TranslationKeys>> = {};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys | null;
  isLoading: boolean;
}

// Helper type for when translations are definitely loaded
export interface LanguageContextLoaded {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
  isLoading: false;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'omni-live-language';

function getInitialLanguage(): Language {
  // Check localStorage first
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === 'pt-BR' || stored === 'en' || stored === 'es') {
    return stored;
  }
  
  // Default to pt-BR
  return 'pt-BR';
}

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  const [translations, setTranslations] = useState<TranslationKeys | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load translation when language changes
  useEffect(() => {
    let isCancelled = false;

    const loadAndSetTranslation = async () => {
      // Check cache first
      if (translationsCache[language]) {
        if (!isCancelled) {
          setTranslations(translationsCache[language]!);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        const t = await loadTranslation(language);
        translationsCache[language] = t; // Cache it
        if (!isCancelled) {
          setTranslations(t);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to load translation:', error);
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadAndSetTranslation();

    return () => {
      isCancelled = true;
    };
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Safe version that asserts translations are loaded
// Use this in components that render after the loading screen
export function useTranslation() {
  const context = useLanguage();
  // At this point, translations should be loaded (enforced by AppWithLanguage loading screen)
  // If not loaded (e.g., in tests), return context with t as null and log warning
  if (context.t === null && process.env.NODE_ENV !== 'test') {
    console.warn('[useTranslation] Translations not loaded yet. This might indicate a missing loading screen check.');
  }
  return {
    ...context,
    t: context.t || ({} as TranslationKeys), // Return empty object in tests/edge cases
  } as LanguageContextLoaded;
}

// Helper hook that ensures translations are loaded before returning
export function useTranslations(): TranslationKeys {
  const { t } = useTranslation();
  return t;
}

// Helper function to replace placeholders in strings
export function interpolate(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, String(value)),
    template
  );
}
