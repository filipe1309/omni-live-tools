import { useState, useCallback } from 'react';
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

  const menuCards = [
    {
      to: '/chat',
      icon: '💬',
      title: t.home.cards.chatReader.title,
      description: t.home.cards.chatReader.description,
    },
    {
      to: '/overlay',
      icon: '🎬',
      title: t.home.cards.overlay.title,
      description: t.home.cards.overlay.description,
    },
    {
      to: '/poll',
      icon: '🗳️',
      title: t.home.cards.poll.title,
      description: t.home.cards.poll.description,
    },
  ];

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      {!showSplash && <ConnectionModal />}
      <div className={`container mx-auto px-4 py-8 transition-all duration-300 ${!isAnyConnected && !showSplash ? 'blur-sm pointer-events-none select-none' : ''}`}>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-tiktok-red to-tiktok-cyan bg-clip-text text-transparent mb-4">
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
          {menuCards.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className="group card hover:scale-105 hover:shadow-xl hover:shadow-tiktok-red/10 transition-all duration-300"
            >
              <div className="text-5xl mb-4">{card.icon}</div>
              <h2 className="text-xl font-bold text-white mb-2 group-hover:text-tiktok-cyan transition-colors">
                {card.title}
              </h2>
              <p className="text-slate-400 text-sm">{card.description}</p>
            </Link>
          ))}
        </div>

        <footer className="text-center mt-16 text-slate-500 text-sm">
          <p>
            {t.home.footer.source}{' '}
            <a
              href="https://github.com/filipe1309/omni-live-tools"
              className="text-tiktok-cyan hover:underline"
              target="_blank"
            >
              https://github.com/filipe1309/omni-live-tools
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}
