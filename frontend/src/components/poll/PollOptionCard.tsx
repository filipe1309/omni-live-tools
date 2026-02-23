import { useLanguage } from '@/i18n';
import type { PollOption } from '@/types';

type PollOptionCardSize = 'compact' | 'normal' | 'large';

interface PollOptionCardProps {
  option: PollOption;
  votes: number;
  percentage: number;
  totalVotes: number;
  isWinner: boolean;
  size?: PollOptionCardSize;
}

const sizeConfig = {
  compact: {
    padding: 'p-2',
    badge: 'w-10 h-10 text-lg',
    text: 'text-lg',
    votes: 'text-lg',
    percentText: 'text-lg',
  },
  normal: {
    padding: 'p-3',
    badge: 'w-12 h-12 text-2xl',
    text: 'text-2xl',
    votes: 'text-2xl',
    percentText: 'text-xl',
  },
  large: {
    padding: 'p-3',
    badge: 'w-14 h-14 text-3xl',
    text: 'text-3xl',
    votes: 'text-3xl',
    percentText: 'text-2xl',
  },
};

export function PollOptionCard ({
  option,
  votes,
  percentage,
  totalVotes,
  isWinner,
  size = 'normal',
}: PollOptionCardProps) {
  const { t } = useLanguage();
  const config = sizeConfig[size];
  const percentageFixed = totalVotes > 0 ? percentage.toFixed(1) : '0.0';

  return (
    <div
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
      <div className={`relative flex items-center justify-between ${config.padding}`}>
        <div className="flex items-center gap-5">
          <span
            className={`${config.badge} flex items-center justify-center rounded-full font-bold text-white flex-shrink-0 ${isWinner
              ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-slate-900'
              : 'bg-gradient-to-br from-purple-600 to-purple-400'
              }`}
          >
            {option.id}
          </span>
          <span className={`font-semibold text-white ${config.text}`}>
            {option.text}
            {isWinner && <span className="ml-2">👑</span>}
          </span>
        </div>

        <div className="text-right flex-shrink-0">
          <span
            className={`font-bold ${isWinner ? 'text-yellow-400' : 'text-tiktok-cyan'} ${config.percentText}`}
          >
            {percentageFixed}%
          </span>
          <span className={`text-slate-400 ${config.votes} ml-2`}>({votes} {t.poll.votes})</span>
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="h-1 bg-slate-900/50">
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
}
