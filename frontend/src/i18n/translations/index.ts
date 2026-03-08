// Re-export only the type for type-checking
export type { TranslationKeys } from './pt-BR';

// Lazy loading translations - only load when needed
export const loadTranslation = async (language: 'pt-BR' | 'en' | 'es') => {
  switch (language) {
    case 'pt-BR':
      return (await import('./pt-BR')).ptBR;
    case 'en':
      return (await import('./en')).en;
    case 'es':
      return (await import('./es')).es;
  }
};
