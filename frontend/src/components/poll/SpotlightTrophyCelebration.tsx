import { useEffect } from 'react';
import Lottie from 'lottie-react';
import { CONFETTI } from '@/constants';
import { useTranslation } from '@/i18n';
import winnerBadgeAnimation from '@/assets/animations/winner-badge.json';

interface SpotlightTrophyCelebrationProps {
  onComplete: () => void;
  winnerText: string;
}

export function SpotlightTrophyCelebration ({ onComplete, winnerText }: SpotlightTrophyCelebrationProps) {
  const { t } = useTranslation();
  useEffect(() => {
    const timer = setTimeout(onComplete, CONFETTI.DURATION);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="absolute inset-0 z-[9999] pointer-events-none overflow-hidden rounded-xl">
      {/* Dark overlay with spotlight gradient */}
      <div
        className="absolute inset-0 animate-fade-in"
        style={{
          background: 'radial-gradient(circle at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.8) 15%, rgba(0,0,0,0.92) 50%, rgba(0,0,0,0.98) 100%)',
        }}
      />

      {/* Spotlight beam effect */}
      <div
        className="absolute inset-0 animate-pulse"
        style={{
          background: 'radial-gradient(ellipse 30% 40% at center 40%, rgba(255,215,0,0.15) 0%, transparent 70%)',
        }}
      />

      {/* Sparkles around trophy */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute text-3xl animate-sparkle"
            style={{
              transform: `rotate(${i * 45}deg) translateY(-100px)`,
              animationDelay: `${i * 100}ms`,
            }}
          >
            ✨
          </div>
        ))}
      </div>

      {/* Trophy Lottie animation + winner text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-48 h-48 mx-auto drop-shadow-[0_0_60px_rgba(255,215,0,0.8)]">
            <Lottie
              animationData={winnerBadgeAnimation}
              loop={false}
              autoplay
            />
          </div>
          <div className="text-3xl font-black text-yellow-400 mt-1 animate-bounce drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]">
            {t.poll.winner}
          </div>
          <div className="text-6xl font-black mt-1 leading-normal drop-shadow-[0_0_40px_rgba(255,215,0,0.8)] animate-winner-text bg-gradient-to-r from-yellow-300 via-white to-yellow-300 bg-clip-text text-transparent">
            {winnerText}
          </div>
        </div>
      </div>

      {/* Light rays */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-[150%] bg-gradient-to-t from-transparent via-yellow-400/20 to-transparent animate-ray"
            style={{
              transform: `rotate(${i * 30}deg)`,
              animationDelay: `${i * 50}ms`,
            }}
          />
        ))}
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: rotate(var(--rotation)) translateY(-100px) scale(0.5);
          }
          50% {
            opacity: 1;
            transform: rotate(var(--rotation)) translateY(-120px) scale(1.2);
          }
        }
        
        @keyframes ray {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 0.6;
          }
        }
        
        @keyframes fade-in {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        
        @keyframes winner-text {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.8);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        
        .animate-sparkle {
          animation: sparkle 1.2s ease-in-out infinite;
        }
        
        .animate-ray {
          animation: ray 2s ease-in-out infinite;
        }
        
        .animate-winner-text {
          animation: winner-text 0.5s ease-out 0.6s forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
