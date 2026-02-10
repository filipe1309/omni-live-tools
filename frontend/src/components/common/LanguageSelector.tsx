import { useLanguage, type Language } from '@/i18n';

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as Language);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-400 hidden sm:inline">🌐</span>
      <select
        value={language}
        onChange={handleChange}
        className="bg-slate-700 text-slate-200 text-sm rounded-lg border border-slate-600 px-2 py-1.5 focus:ring-tiktok-cyan focus:border-tiktok-cyan cursor-pointer hover:bg-slate-600 transition-colors"
        aria-label={t.language.label}
      >
        <option value="pt-BR">🇧🇷 {t.language.portuguese}</option>
        <option value="en">🇺🇸 {t.language.english}</option>
      </select>
    </div>
  );
}
