import { useLanguage } from '@/i18n';
import { POLL_SHORTCUT_LABELS } from '@/constants';

interface PollControlButtonsProps {
  onStart?: () => void;
  onStop?: () => void;
  onReset?: () => void;
  isConnected?: boolean;
  isRunning: boolean;
  isCountingDown: boolean;
  variant?: 'default' | 'results-page';
}

export function PollControlButtons ({
  onStart,
  onStop,
  onReset,
  isConnected = true,
  isRunning,
  isCountingDown,
  variant = 'default',
}: PollControlButtonsProps) {
  const { t } = useLanguage();

  const labels = {
    start: variant === 'results-page' ? t.pollResults.start : t.poll.startPoll,
    stop: variant === 'results-page' ? t.pollResults.stop : t.poll.stopPoll,
    reset: variant === 'results-page' ? t.pollResults.restart : t.poll.resetPoll,
  };

  return (
    <div className="flex items-center justify-center gap-2 p-2 bg-purple-500/10 rounded-lg border border-purple-500/30">
      {onStart && (
        <button
          onClick={onStart}
          disabled={!isConnected || isRunning || isCountingDown}
          className="px-4 py-1 text-sm font-bold rounded-md bg-gradient-to-r from-green-400 to-blue-500 text-white hover:from-green-500 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title={`${POLL_SHORTCUT_LABELS.START} / Enter`}
        >
          {labels.start}{' '}
          <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded">
            {POLL_SHORTCUT_LABELS.START}
          </kbd>
        </button>
      )}
      {onStop && (
        <button
          onClick={onStop}
          disabled={!isRunning}
          className="px-4 py-1 text-sm font-bold rounded-md bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title={POLL_SHORTCUT_LABELS.STOP}
        >
          {labels.stop}{' '}
          <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded">
            {POLL_SHORTCUT_LABELS.STOP}
          </kbd>
        </button>
      )}
      {onReset && (
        <button
          onClick={onReset}
          disabled={isRunning}
          className="px-4 py-1 text-sm font-bold rounded-md bg-slate-700 text-white hover:bg-slate-600 transition-all border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title={POLL_SHORTCUT_LABELS.RESET}
        >
          {labels.reset}{' '}
          <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded">
            {POLL_SHORTCUT_LABELS.RESET}
          </kbd>
        </button>
      )}
    </div>
  );
}
