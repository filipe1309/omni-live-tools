import { TIMER_THRESHOLDS } from '@/constants';

interface PollQuestionProps {
  question: string;
  isRunning: boolean;
  timeLeft: number;
  timer: number;
  className?: string;
}

export function PollQuestion ({ question, isRunning, timeLeft, timer, className = '' }: PollQuestionProps) {
  const getContainerClasses = () => {
    if (isRunning) {
      if (timeLeft <= TIMER_THRESHOLDS.CRITICAL) {
        return 'bg-red-500/20 border-red-500 animate-pulse shadow-lg shadow-red-500/20';
      }
      if (timeLeft <= TIMER_THRESHOLDS.WARNING) {
        return 'bg-yellow-500/15 border-yellow-500 shadow-lg shadow-yellow-500/10';
      }
      return 'bg-green-500/10 border-green-500';
    }
    return 'bg-purple-500/10 border-purple-500';
  };

  const getTimerBarClasses = () => {
    if (timeLeft <= TIMER_THRESHOLDS.CRITICAL) {
      return 'bg-gradient-to-r from-red-600 to-red-400 animate-pulse';
    }
    if (timeLeft <= TIMER_THRESHOLDS.WARNING) {
      return 'bg-gradient-to-r from-yellow-500 to-yellow-400';
    }
    return 'bg-gradient-to-r from-green-500 to-tiktok-cyan';
  };

  const getTextClasses = () => {
    if (isRunning) {
      if (timeLeft <= TIMER_THRESHOLDS.CRITICAL) return 'text-red-300';
      if (timeLeft <= TIMER_THRESHOLDS.WARNING) return 'text-yellow-300';
    }
    return 'text-white';
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border-l-4 transition-all duration-500 ${getContainerClasses()} ${className}`}
    >
      {/* Animated Timer Bar */}
      {isRunning && timer > 0 && (
        <div
          className={`absolute bottom-0 left-0 h-1.5 transition-all duration-1000 ease-linear ${getTimerBarClasses()}`}
          style={{
            width: `${(timeLeft / timer) * 100}%`,
          }}
        />
      )}
      {/* Static bar when not running */}
      {!isRunning && (
        <div className="absolute bottom-0 left-0 h-1.5 w-full bg-gradient-to-r from-purple-600/50 to-purple-400/50" />
      )}
      <div className="text-center py-5 px-6">
        <h3 className={`font-bold transition-colors duration-500 ${getTextClasses()}`}>
          {question}
        </h3>
      </div>
    </div>
  );
}
