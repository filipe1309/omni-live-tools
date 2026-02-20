import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n';
import { useConnectionContext } from '@/hooks';
import { LanguageSelector } from '../common/LanguageSelector';
import { TikTokIcon, TwitchIcon } from '../common';

export function Header () {
  const { t } = useLanguage();
  const { tiktok, twitch, isAnyConnected, setShowConnectionModal } = useConnectionContext();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <header className={`border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/omni-logo.jpg" alt="Omni Logo" className="w-10 h-10 rounded-xl object-cover" />
            <div>
              <h1 className="text-xl font-bold text-white">{t.header.title}</h1>
              <p className="text-xs text-slate-400">{t.header.subtitle}</p>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/chat"
                className="text-slate-300 neon-flicker-hover"
              >
                {t.header.nav.chatReader}
              </Link>
              <Link
                to="/overlay"
                className="text-slate-300 neon-flicker-hover"
              >
                {t.header.nav.overlay}
              </Link>
              <Link
                to="/poll"
                className="text-slate-300 neon-flicker-hover"
              >
                {t.header.nav.livePoll}
              </Link>
            </nav>

            {/* Connection Status Button */}
            <button
              onClick={() => setShowConnectionModal(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${isAnyConnected
                  ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20'
                  : 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
                }`}
              title={t.connectionModal.manageTitle}
            >
              {isAnyConnected ? (
                <>
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="hidden sm:flex items-center gap-1 text-sm">
                    {tiktok.isConnected && <TikTokIcon className="w-4 h-4 text-tiktok-cyan" />}
                    {twitch.isConnected && <TwitchIcon className="w-4 h-4 text-purple-400" />}
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                  <span className="text-sm text-red-400">{t.common.disconnected}</span>
                </>
              )}
            </button>

            <LanguageSelector />
          </div>
        </div>
      </div>
    </header>
  );
}
