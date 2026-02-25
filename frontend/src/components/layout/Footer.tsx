import { useLanguage } from '@/i18n';

export function Footer () {
  const { t } = useLanguage();

  return (
    <footer className="px-4 py-6 bg-slate-800/50 border-t border-slate-700/50 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left - Branding */}
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎬</span>
          <div>
            <span className="font-bold text-white">OmniLIVE Tools</span>
            <span className="ml-2 px-2 py-0.5 text-xs font-mono bg-slate-700 text-slate-300 rounded">
              v{__APP_VERSION__}
            </span>
          </div>
        </div>

        {/* Right - Social Links */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/filipe1309/omni-live-tools"
            className="group flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all hover:scale-105"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            <span className="text-white text-sm font-medium">{t.home.footer.viewSource}</span>
            <svg className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
