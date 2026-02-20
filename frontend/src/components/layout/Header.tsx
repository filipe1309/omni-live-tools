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
            <nav className="hidden md:flex items-center">
              <ul className="nav-animated">
                <li>
                  <Link to="/chat" className="nav-item nav-chat">
                    <div className="nav-item-content">
                      <span className="nav-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </span>
                      <span className="nav-title">{t.header.nav.chatReader}</span>
                    </div>
                  </Link>
                </li>
                <li>
                  <Link to="/overlay" className="nav-item nav-overlay">
                    <div className="nav-item-content">
                      <span className="nav-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <rect x="7" y="7" width="10" height="10" rx="1" ry="1" />
                        </svg>
                      </span>
                      <span className="nav-title">{t.header.nav.overlay}</span>
                    </div>
                  </Link>
                </li>
                <li>
                  <Link to="/poll" className="nav-item nav-poll">
                    <div className="nav-item-content">
                      <span className="nav-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="4" y="14" width="4" height="7" />
                          <rect x="10" y="10" width="4" height="11" />
                          <rect x="16" y="3" width="4" height="18" />
                        </svg>
                      </span>
                      <span className="nav-title">{t.header.nav.livePoll}</span>
                    </div>
                  </Link>
                </li>
              </ul>
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
