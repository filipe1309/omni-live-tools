import { useState, useRef, useEffect } from 'react';
import { useLanguage, type Language } from '@/i18n';

export function LanguageSelector () {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'pt-BR' as Language, flag: '🇧🇷', label: t.language.portuguese },
    { code: 'en' as Language, flag: '🇺🇸', label: t.language.english },
    { code: 'es' as Language, flag: '🇪🇸', label: t.language.spanish },
  ];

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="nav-item nav-language"
        aria-label={t.language.label}
        aria-expanded={isOpen}
      >
        <div className="nav-item-content">
          <span className="nav-icon">
            <span className="text-lg">{currentLang.flag}</span>
          </span>
          <span className="nav-title">{currentLang.label}</span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden z-50 min-w-[140px]">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${lang.code === language
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
