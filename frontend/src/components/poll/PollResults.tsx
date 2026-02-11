import { useEffect } from 'react';
import { useLanguage } from '@/i18n';
import type { PollState } from '@/types';
import { POLL_SHORTCUTS, matchesShortcut } from '@/constants';
import { usePollDisplay } from '@/hooks/usePollDisplay';
import { SpotlightTrophyCelebration } from './SpotlightTrophyCelebration';
import { CountdownOverlay } from './CountdownOverlay';
import { PollQuestion } from './PollQuestion';
import { PollOptionCard } from './PollOptionCard';
import { PollControlButtons } from './PollControlButtons';

interface PollResultsProps {
  pollState: PollState;
  getPercentage: (optionId: number) => number;
  getTotalVotes: () => number;
  showStatusBar?: boolean;
  compact?: boolean;
  // Optional control callbacks for keyboard shortcuts
  onStart?: () => void;
  onStop?: () => void;
  onReset?: () => void;
  isConnected?: boolean;
  showControlButtons?: boolean;
}

export function PollResults({
  pollState,
  getPercentage,
  getTotalVotes,
  showStatusBar = true,
  compact = false,
  onStart,
  onStop,
  onReset,
  isConnected = true,
  showControlButtons = false,
}: PollResultsProps) {
  const totalVotes = getTotalVotes();
  const { t } = useLanguage();

  const {
    winnerIds,
    winnerText,
    showCelebration,
    handleCelebrationComplete,
    getTimerClasses,
    getStatusDisplay,
    isCountingDown,
  } = usePollDisplay({ pollState });

  // Keyboard shortcuts for poll control
  useEffect(() => {
    if (!onStart && !onStop && !onReset) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Start: Space or Enter (or custom shortcut)
      if (matchesShortcut(e, POLL_SHORTCUTS.START)) {
        e.preventDefault();
        if (onStart && isConnected && !pollState.isRunning && pollState.countdown === undefined) {
          onStart();
        }
        return;
      }

      // Stop: Escape (or custom shortcut)
      if (matchesShortcut(e, POLL_SHORTCUTS.STOP)) {
        if (onStop && pollState.isRunning) {
          onStop();
        }
        return;
      }

      // Reset: R (or custom shortcut)
      if (matchesShortcut(e, POLL_SHORTCUTS.RESET)) {
        if (onReset && !pollState.isRunning) {
          onReset();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConnected, pollState.isRunning, pollState.countdown, onStart, onStop, onReset]);

  const status = getStatusDisplay();

  return (
    <div className="space-y-4 relative">
      {/* Spotlight + Trophy Celebration */}
      {showCelebration && (
        <SpotlightTrophyCelebration onComplete={handleCelebrationComplete} winnerText={winnerText} />
      )}

      {/* Countdown Overlay - positioned within Results Section */}
      {isCountingDown && <CountdownOverlay countdown={pollState.countdown!} />}

      {/* Control Buttons */}
      {showControlButtons && (onStart || onStop || onReset) && (
        <PollControlButtons
          onStart={onStart}
          onStop={onStop}
          onReset={onReset}
          isConnected={isConnected}
          isRunning={pollState.isRunning}
          isCountingDown={isCountingDown}
        />
      )}

      {/* Status Bar */}
      {showStatusBar && (
        <div className="flex items-center justify-around flex-wrap gap-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
          <div className="text-center">
            <span className="block text-xs text-slate-400 mb-1">
              {pollState.isRunning ? t.poll.timeRemaining : t.poll.configuredTime}
            </span>
            <span className={`font-mono text-3xl font-bold ${getTimerClasses()}`}>
              {pollState.isRunning
                ? `${pollState.timeLeft}s`
                : pollState.timer > 0
                  ? `${pollState.timer}s`
                  : '--'}
            </span>
          </div>
          <div className="text-center">
            <span className="block text-xs text-slate-400 mb-1">{t.poll.totalVotes}</span>
            <span className="font-bold text-purple-400 text-3xl">{totalVotes}</span>
          </div>
          <div className="text-center">
            <span className="block text-xs text-slate-400 mb-1">Status</span>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${status.className}`}
            >
              {status.text}
            </span>
          </div>
        </div>
      )}

      {/* Question */}
      {pollState.question && (
        <PollQuestion
          question={pollState.question}
          isRunning={pollState.isRunning}
          timeLeft={pollState.timeLeft}
          timer={pollState.timer}
          className="[&_h3]:text-3xl"
        />
      )}

      {/* Results */}
      <div className="space-y-4">
        {pollState.options.map((option) => (
          <PollOptionCard
            key={option.id}
            option={option}
            votes={pollState.votes[option.id] || 0}
            percentage={getPercentage(option.id)}
            totalVotes={totalVotes}
            isWinner={winnerIds.includes(option.id)}
            size={compact ? 'compact' : 'normal'}
          />
        ))}
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
