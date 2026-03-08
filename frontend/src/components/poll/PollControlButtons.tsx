import { useTranslation } from '@/i18n';
import { POLL_SHORTCUT_LABELS } from '@/constants';

interface PollControlButtonsProps {
  onStart?: () => void;
  onStop?: () => void;
  onReset?: () => void;
  isConnected?: boolean;
  isRunning: boolean;
  isCountingDown: boolean;
  size?: 'sm' | 'lg';
}

export function PollControlButtons ({
  onStart,
  onStop,
  onReset,
  isConnected = true,
  isRunning,
  isCountingDown,
  size = 'sm',
}: PollControlButtonsProps) {
  const { t } = useTranslation();

  const isLarge = size === 'lg';
  const buttonSize = isLarge ? 'px-8 py-3 text-lg rounded-xl' : 'px-4 py-1 text-sm rounded-md';
  const kbdSize = isLarge ? 'ml-2 px-2 py-0.5 text-sm' : 'ml-1 px-1.5 py-0.5 text-xs';
  const gapSize = isLarge ? 'gap-4' : 'gap-2';

  const labels = {
    start: `▶️ ${t.poll.startPoll}`,
    stop: `⏹️ ${t.poll.stopPoll}`,
    reset: `🔄 ${t.poll.resetPoll}`,
  };

  return (
    <div className={`flex items-center justify-center ${gapSize} p-2 bg-purple-500/10 rounded-lg border border-purple-500/30`}>
      {onStart && (
        <button
          onClick={onStart}
          disabled={!isConnected || isRunning || isCountingDown}
          className={`${buttonSize} font-bold bg-gradient-to-r from-green-400 to-blue-500 text-white hover:from-green-500 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          title={`${POLL_SHORTCUT_LABELS.START} / Enter`}
        >
          {labels.start}{' '}
          <kbd className={`${kbdSize} bg-white/20 rounded`}>
            {POLL_SHORTCUT_LABELS.START}
          </kbd>
        </button>
      )}
      {onStop && (
        <button
          onClick={onStop}
          disabled={!isRunning && !isCountingDown}
          className={`${buttonSize} font-bold bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          title={POLL_SHORTCUT_LABELS.STOP}
        >
          {labels.stop}{' '}
          <kbd className={`${kbdSize} bg-white/20 rounded`}>
            {POLL_SHORTCUT_LABELS.STOP}
          </kbd>
        </button>
      )}
      {onReset && (
        <button
          onClick={onReset}
          disabled={isRunning}
          className={`${buttonSize} font-bold bg-slate-700 text-white hover:bg-slate-600 transition-all border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed`}
          title={POLL_SHORTCUT_LABELS.RESET}
        >
          {labels.reset}{' '}
          <kbd className={`${kbdSize} bg-white/20 rounded`}>
            {POLL_SHORTCUT_LABELS.RESET}
          </kbd>
        </button>
      )}
    </div>
  );
}
