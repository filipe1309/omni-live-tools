import type { PollState } from '@/types';
import { usePollDisplay } from '@/hooks/usePollDisplay';
import { usePollKeyboardShortcuts } from '@/hooks/usePollKeyboardShortcuts';
import { SpotlightTrophyCelebration } from './SpotlightTrophyCelebration';
import { CountdownOverlay } from './CountdownOverlay';
import { PollQuestion } from './PollQuestion';
import { PollOptionCard } from './PollOptionCard';
import { PollControlButtons } from './PollControlButtons';
import { PollStatusBar } from './PollStatusBar';

interface PollResultsProps {
  pollState: PollState;
  getPercentage: (optionId: number) => number;
  getTotalVotes: () => number;
  showStatusBar?: boolean;
  compact?: boolean;
  size?: 'normal' | 'large';
  fontSize?: number;
  // Optional control callbacks for keyboard shortcuts
  onStart?: () => void;
  onStop?: () => void;
  onReset?: () => void;
  isConnected?: boolean;
  showControlButtons?: boolean;
  // Inline editing props
  editable?: boolean;
  onQuestionChange?: (newQuestion: string) => void;
  onOptionTextChange?: (optionId: number, newText: string) => void;
}

export function PollResults ({
  pollState,
  getPercentage,
  getTotalVotes,
  showStatusBar = true,
  compact = false,
  size = 'normal',
  fontSize,
  onStart,
  onStop,
  onReset,
  isConnected = true,
  showControlButtons = false,
  editable = false,
  onQuestionChange,
  onOptionTextChange,
}: PollResultsProps) {
  const totalVotes = getTotalVotes();

  const isLarge = size === 'large';
  const questionClass = isLarge ? '[&_h3]:text-5xl' : '[&_h3]:text-3xl';
  const optionSize = compact ? 'compact' : (isLarge ? 'large' : 'normal');

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
  usePollKeyboardShortcuts({
    onStart,
    onStop,
    onReset,
    isConnected,
    isRunning: pollState.isRunning,
    isCountingDown,
  });

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
        <PollStatusBar
          isRunning={pollState.isRunning}
          timeLeft={pollState.timeLeft}
          timer={pollState.timer}
          totalVotes={totalVotes}
          timerClasses={getTimerClasses()}
          status={status}
        />
      )}

      {/* Question */}
      {pollState.question && (
        <PollQuestion
          question={pollState.question}
          isRunning={pollState.isRunning}
          timeLeft={pollState.timeLeft}
          timer={pollState.timer}
          className={questionClass}
          editable={editable && !pollState.isRunning && !isCountingDown}
          onQuestionChange={onQuestionChange}
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
            size={optionSize}
            fontSize={fontSize}
            editable={editable && !pollState.isRunning && !isCountingDown}
            onOptionTextChange={onOptionTextChange}
          />
        ))}
      </div>
    </div>
  );
}
