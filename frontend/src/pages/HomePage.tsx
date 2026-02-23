import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n';
import { SplashScreen, ConnectionModal, Footer } from '@/components';
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
      <div className={`flex-1 flex flex-col transition-all duration-300 ${!isAnyConnected && !showSplash ? 'blur-sm pointer-events-none select-none' : ''}`}>
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

        <Footer />
      </div>
    </>
  );
}
