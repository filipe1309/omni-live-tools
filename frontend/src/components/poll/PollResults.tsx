import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useLanguage } from '@/i18n';
import type { PollState } from '@/types';
import { CONFETTI, TIMER_THRESHOLDS } from '@/constants';

interface PollResultsProps {
  pollState: PollState;
  getPercentage: (optionId: number) => number;
  getTotalVotes: () => number;
  showStatusBar?: boolean;
  compact?: boolean;
}

// Confetti celebration function
const triggerConfetti = () => {
  const animationEnd = Date.now() + CONFETTI.DURATION;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = CONFETTI.PARTICLE_COUNT_MULTIPLIER * (timeLeft / CONFETTI.DURATION);

    // Confetti from left side
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: CONFETTI.COLORS,
    });

    // Confetti from right side
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: CONFETTI.COLORS,
    });
  }, CONFETTI.INTERVAL);
};

export function PollResults ({ pollState, getPercentage, getTotalVotes, showStatusBar = true, compact = false }: PollResultsProps) {
  const totalVotes = getTotalVotes();
  const hasTriggeredConfetti = useRef(false);
  const { t } = useLanguage();

  // Find winner(s) - only when poll is finished
  const maxVotes = Math.max(...Object.values(pollState.votes), 0);
  const winnerIds = pollState.finished && totalVotes > 0
    ? pollState.options
      .filter(opt => pollState.votes[opt.id] === maxVotes && maxVotes > 0)
      .map(opt => opt.id)
    : [];

  // Trigger confetti when poll finishes with votes
  useEffect(() => {
    if (pollState.finished && totalVotes > 0 && winnerIds.length > 0 && !hasTriggeredConfetti.current) {
      hasTriggeredConfetti.current = true;
      triggerConfetti();
    }
  }, [pollState.finished, totalVotes, winnerIds.length]);

  // Reset confetti flag when countdown starts (new poll) or poll starts running
  useEffect(() => {
    if (pollState.isRunning || pollState.countdown !== undefined) {
      hasTriggeredConfetti.current = false;
    }
  }, [pollState.isRunning, pollState.countdown]);

  // Get timer CSS classes based on remaining time
  const getTimerClasses = () => {
    if (!pollState.isRunning) return 'text-slate-400';
    if (pollState.timeLeft <= TIMER_THRESHOLDS.CRITICAL) return 'timer-critical';
    if (pollState.timeLeft <= TIMER_THRESHOLDS.WARNING) return 'timer-warning';
    return 'text-tiktok-cyan';
  };

  // Get status display
  const getStatusDisplay = () => {
    if (pollState.countdown !== undefined) {
      return { text: pollState.countdown === 0 ? t.poll.go : `${pollState.countdown}...`, className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500 animate-pulse' };
    }
    if (pollState.isRunning) {
      return { text: t.poll.status.inProgress, className: 'bg-green-500/20 text-green-400 border-green-500 animate-pulse' };
    }
    if (pollState.finished) {
      return { text: t.poll.status.finished, className: 'bg-blue-500/20 text-blue-400 border-blue-500' };
    }
    return { text: t.poll.status.waiting, className: 'bg-slate-500/20 text-slate-400 border-slate-500' };
  };

  const status = getStatusDisplay();

  // Check if countdown is active
  const isCountingDown = pollState.countdown !== undefined;

  return (
    <div className="space-y-4 relative">
      {/* Countdown Overlay */}
      {isCountingDown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="text-center animate-pulse">
            {pollState.countdown === 0 ? (
              <div className="text-9xl font-black text-green-400 animate-bounce drop-shadow-[0_0_30px_rgba(74,222,128,0.8)]">
                {t.poll.go}
              </div>
            ) : (
              <>
                <div className="text-2xl text-slate-300 mb-4">{t.poll.startingIn}</div>
                <div className="text-[12rem] font-black text-yellow-400 leading-none drop-shadow-[0_0_30px_rgba(250,204,21,0.8)] animate-bounce">
                  {pollState.countdown}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Status Bar */}
      {showStatusBar && (
        <div className="flex items-center justify-around flex-wrap gap-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
          <div className="text-center">
            <span className="block text-xs text-slate-400 mb-1">{pollState.isRunning ? t.poll.timeRemaining : t.poll.configuredTime}</span>
            <span className={`font-mono text-3xl font-bold ${getTimerClasses()}`}>
              {pollState.isRunning ? `${pollState.timeLeft}s` : (pollState.timer > 0 ? `${pollState.timer}s` : '--')}
            </span>
          </div>
          <div className="text-center">
            <span className="block text-xs text-slate-400 mb-1">{t.poll.totalVotes}</span>
            <span className="font-bold text-purple-400 text-3xl">{totalVotes}</span>
          </div>
          <div className="text-center">
            <span className="block text-xs text-slate-400 mb-1">Status</span>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${status.className}`}>
              {status.text}
            </span>
          </div>
        </div>
      )}

      {/* Question */}
      {pollState.question && (
        <div className={`relative overflow-hidden rounded-xl border-l-4 transition-all duration-500 ${pollState.isRunning
            ? pollState.timeLeft <= TIMER_THRESHOLDS.CRITICAL
              ? 'bg-red-500/20 border-red-500 animate-pulse shadow-lg shadow-red-500/20'
              : pollState.timeLeft <= TIMER_THRESHOLDS.WARNING
                ? 'bg-yellow-500/15 border-yellow-500 shadow-lg shadow-yellow-500/10'
                : 'bg-green-500/10 border-green-500'
            : 'bg-purple-500/10 border-purple-500'
          }`}>
          {/* Animated Timer Bar */}
          {pollState.isRunning && pollState.timer > 0 && (
            <div
              className={`absolute bottom-0 left-0 h-1.5 transition-all duration-1000 ease-linear ${pollState.timeLeft <= TIMER_THRESHOLDS.CRITICAL
                  ? 'bg-gradient-to-r from-red-600 to-red-400 animate-pulse'
                  : pollState.timeLeft <= TIMER_THRESHOLDS.WARNING
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                    : 'bg-gradient-to-r from-green-500 to-tiktok-cyan'
                }`}
              style={{
                width: `${(pollState.timeLeft / pollState.timer) * 100}%`,
              }}
            />
          )}
          {/* Static bar when not running */}
          {!pollState.isRunning && (
            <div
              className="absolute bottom-0 left-0 h-1.5 w-full bg-gradient-to-r from-purple-600/50 to-purple-400/50"
            />
          )}
          <div className="text-center py-5 px-6">
            <h3 className={`text-3xl font-bold transition-colors duration-500 ${pollState.isRunning
                ? pollState.timeLeft <= TIMER_THRESHOLDS.CRITICAL
                  ? 'text-red-300'
                  : pollState.timeLeft <= TIMER_THRESHOLDS.WARNING
                    ? 'text-yellow-300'
                    : 'text-white'
                : 'text-white'
              }`}>{pollState.question}</h3>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="space-y-4">
        {pollState.options.map((option) => {
          const percentage = getPercentage(option.id);
          const votes = pollState.votes[option.id] || 0;
          const isWinner = winnerIds.includes(option.id);
          const percentageFixed = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : '0.0';

          return (
            <div
              key={option.id}
              className={`relative overflow-hidden rounded-xl transition-all duration-300 border ${isWinner
                  ? 'border-yellow-400 bg-yellow-500/10 animate-winner-glow'
                  : 'border-slate-700/50 bg-slate-800/50 hover:bg-slate-800/70 hover:border-slate-600/50'
                }`}
            >
              {/* Background Progress Bar */}
              <div
                className={`absolute inset-0 transition-all duration-500 ease-out ${isWinner
                    ? 'bg-gradient-to-r from-yellow-500/30 to-yellow-400/10'
                    : 'bg-gradient-to-r from-purple-600/30 to-purple-400/10'
                  }`}
                style={{ width: `${percentage}%` }}
              />

              {/* Content */}
              <div className={`relative flex items-center justify-between ${compact ? 'p-4' : 'p-6'}`}>
                <div className="flex items-center gap-5">
                  <span className={`${compact ? 'w-12 h-12 text-xl' : 'w-14 h-14 text-2xl'} flex items-center justify-center rounded-full font-bold text-white flex-shrink-0 ${isWinner
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-slate-900'
                      : 'bg-gradient-to-br from-purple-600 to-purple-400'
                    }`}>
                    {option.id}
                  </span>
                  <span className={`font-semibold text-white ${compact ? 'text-xl' : 'text-2xl'}`}>
                    {option.text}
                    {isWinner && <span className="ml-2">👑</span>}
                  </span>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className={`font-bold ${isWinner ? 'text-yellow-400' : 'text-tiktok-cyan'} ${compact ? 'text-xl' : 'text-2xl'}`}>
                    {votes} {t.poll.votes}
                  </span>
                  <span className="text-slate-400 text-xl ml-2">
                    ({percentageFixed}%)
                  </span>
                </div>
              </div>

              {/* Progress Bar Track */}
              <div className="h-2 bg-slate-900/50">
                <div
                  className={`h-full transition-all duration-500 ease-out rounded-r ${isWinner
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                      : 'bg-gradient-to-r from-purple-600 to-purple-400'
                    }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer stats */}
      {!compact && (
        <div className="text-center text-slate-400 text-xl pt-4 border-t border-slate-700">
          {t.poll.totalVotes}: <span className="font-bold text-white">{totalVotes}</span>
          <span className="mx-3">•</span>
          {t.poll.uniqueVoters}: <span className="font-bold text-white">{pollState.voters.size}</span>
        </div>
      )}
    </div>
  );
}
