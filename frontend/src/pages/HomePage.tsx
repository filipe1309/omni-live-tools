import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n';
import { SplashScreen, ConnectionModal } from '@/components';
import { useConnectionContext } from '@/hooks';

export function HomePage () {
  const { t } = useLanguage();
  const { isAnyConnected } = useConnectionContext();
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash once per session
    return !sessionStorage.getItem('splashShown');
  });

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem('splashShown', 'true');
    setShowSplash(false);
  }, []);

  const [cardsVisible, setCardsVisible] = useState(false);

  useEffect(() => {
    if (!showSplash && isAnyConnected) {
      // Trigger entrance animation after connection is established
      const timer = setTimeout(() => setCardsVisible(true), 100);
      return () => clearTimeout(timer);
    } else if (!isAnyConnected) {
      // Reset animation when disconnected
      setCardsVisible(false);
    }
  }, [showSplash, isAnyConnected]);

  const menuCards = [
    {
      to: '/chat',
      icon: '💬',
      title: t.home.cards.chatReader.title,
      description: t.home.cards.chatReader.description,
      gradient: { from: '#00f5d4', to: '#22d3ee' },
    },
    {
      to: '/overlay',
      icon: '🎬',
      title: t.home.cards.overlay.title,
      description: t.home.cards.overlay.description,
      gradient: { from: '#ff0050', to: '#fb923c' },
    },
    {
      to: '/poll',
      icon: '🗳️',
      title: t.home.cards.poll.title,
      description: t.home.cards.poll.description,
      gradient: { from: '#8b5cf6', to: '#ec4899' },
    },
  ];

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      {!showSplash && <ConnectionModal />}
      <div className={`h-full flex flex-col transition-all duration-300 ${!isAnyConnected && !showSplash ? 'blur-sm pointer-events-none select-none' : ''}`}>
        <div className="container mx-auto px-4 py-4 flex-1 flex flex-col justify-center">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-tiktok-red to-tiktok-cyan bg-clip-text text-transparent mb-2">
              {t.home.title}
            </h1>
            <p className="text-slate-400 max-w-2xl mx-auto">
              {t.home.description}{' '}
              <a href="https://www.tiktok.com/live" className="text-tiktok-cyan hover:underline" target="_blank" rel="noopener noreferrer">
                TikTok
              </a>{' '}
              {t.home.and}{' '}
              <a href="https://www.twitch.tv/" className="text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer">
                Twitch.
              </a>
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {menuCards.map((card, index) => (
              <Link
                key={card.to}
                to={card.to}
                className={`group relative p-[2px] rounded-xl transition-all duration-500 hover:scale-105
                  ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{
                  transitionDelay: cardsVisible ? `${index * 150}ms` : '0ms',
                  background: 'linear-gradient(to right, rgb(51, 65, 85), rgb(51, 65, 85))'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `linear-gradient(to right, ${card.gradient.from}, ${card.gradient.to})`;
                  e.currentTarget.style.boxShadow = `0 20px 25px -5px ${card.gradient.from}33, 0 8px 10px -6px ${card.gradient.from}33`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, rgb(51, 65, 85), rgb(51, 65, 85))';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="card h-full bg-slate-800 rounded-xl">
                  <div className="text-5xl mb-4 icon-bounce-float">{card.icon}</div>
                  <h2
                    className="text-xl font-bold mb-2 text-white transition-colors"
                    style={{ '--hover-color': card.gradient.from } as React.CSSProperties}
                  >
                    <span className="group-hover:hidden">{card.title}</span>
                    <span
                      className="hidden group-hover:inline text-transparent bg-clip-text"
                      style={{ backgroundImage: `linear-gradient(to right, ${card.gradient.from}, ${card.gradient.to})` }}
                    >
                      {card.title}
                    </span>
                  </h2>
                  <p className="text-slate-400 text-sm">{card.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Full Footer Bar */}
        <footer className="px-4 py-6 bg-slate-800/50 border-t border-slate-700/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left - Branding */}
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎬</span>
              <div>
                <span className="font-bold text-white">OmniLIVE Tools</span>
                <span className="ml-2 px-2 py-0.5 text-xs font-mono bg-slate-700 text-slate-300 rounded">
                  v1.12.0
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
      </div>
    </>
  );
}
