import { useLanguage } from '@/i18n';

interface PollStatusBarProps {
  isRunning: boolean;
  timeLeft: number;
  timer: number;
  totalVotes: number;
  timerClasses: string;
  status: {
    text: string;
    className: string;
  };
}

export function PollStatusBar ({
  isRunning,
  timeLeft,
  timer,
  totalVotes,
  timerClasses,
  status,
}: PollStatusBarProps) {
  const { t } = useLanguage();

  const timerDisplay = isRunning
    ? `${timeLeft}s`
    : timer > 0
      ? `${timer}s`
      : '--';

  return (
    <div className="flex items-center justify-around flex-wrap gap-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
      <div className="text-center">
        <span className="block text-xs text-slate-400 mb-1">
          {isRunning ? t.poll.timeRemaining : t.poll.configuredTime}
        </span>
        <span className={`font-mono text-3xl font-bold ${timerClasses}`}>
          {timerDisplay}
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
  );
}
