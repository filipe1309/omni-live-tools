import { useRef, useEffect, useState } from 'react';
import { ProfilePicture, TikTokIcon, TwitchIcon, YouTubeIcon } from '../common';
import { useLanguage } from '@/i18n';
import type { VoteEntry } from '@/types';

interface VoteLogProps {
  entries: VoteEntry[];
  maxHeight?: string;
  onClear?: () => void;
}

/**
 * Platform badge component for vote entries
 */
function PlatformBadge({ platform }: { platform?: 'tiktok' | 'twitch' | 'youtube' }) {
  if (platform === 'twitch') {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-purple-500/20 text-purple-400" title="Twitch">
        <TwitchIcon className="w-3 h-3" />
      </span>
    );
  }
  if (platform === 'youtube') {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-red-500/20 text-red-500" title="YouTube">
        <YouTubeIcon className="w-3 h-3" />
      </span>
    );
  }
  // Default to TikTok
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-tiktok-cyan/20 text-tiktok-cyan" title="TikTok">
      <TikTokIcon className="w-3 h-3" />
    </span>
  );
}

export function VoteLog({ entries, maxHeight = '300px', onClear }: VoteLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showVotes, setShowVotes] = useState(true);
  const { t } = useLanguage();

  // Auto-scroll to top when new entries arrive (newest first)
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }, [entries.length]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
          <input 
            type="checkbox" 
            checked={showVotes}
            onChange={(e) => setShowVotes(e.target.checked)}
            className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-tiktok-cyan focus:ring-tiktok-cyan focus:ring-offset-slate-800"
          />
          {t.poll.showIndividualVotes}
        </label>
        {onClear && (
          <button 
            onClick={onClear}
            className="btn-secondary text-sm px-3 py-1.5"
          >
            🗑️ {t.poll.clearLog}
          </button>
        )}
      </div>

      {/* Vote Log Container */}
      {showVotes && (
        <div 
          ref={containerRef}
          className="overflow-y-auto bg-slate-900/50 rounded-lg p-4 font-mono text-sm"
          style={{ maxHeight, minHeight: '150px' }}
        >
          {entries.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              {t.poll.noVotesYet}
            </div>
          ) : (
            <div className="space-y-2">
              {[...entries].reverse().map((entry) => (
                <div 
                  key={entry.id}
                  className="flex items-center gap-3 py-2 px-3 bg-slate-800/50 rounded-lg animate-slide-in border border-slate-700/30"
                >
                  {/* Platform Badge */}
                  <PlatformBadge platform={entry.platform} />
                  
                  <ProfilePicture 
                    src={entry.user.profilePictureUrl} 
                    size="sm" 
                    fallbackInitial={(entry.user.nickname || entry.user.uniqueId || '?').charAt(0)}
                  />
                  
                  <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                    <span className={`font-bold truncate ${
                      entry.platform === 'twitch' ? 'text-purple-400' : 'text-tiktok-cyan'
                    }`}>
                      {entry.platform === 'twitch' ? '' : '@'}{entry.user.uniqueId}
                    </span>
                    <span className="text-slate-400">{t.poll.votedFor}</span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded text-purple-300 font-semibold">
                      <span className="w-5 h-5 flex items-center justify-center bg-purple-500 rounded-full text-white text-xs">
                        {entry.optionId}
                      </span>
                      {entry.optionText}
                    </span>
                  </div>
                  
                  <span className="text-xs text-slate-500 flex-shrink-0">
                    {entry.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!showVotes && (
        <div className="text-center text-slate-500 py-4 bg-slate-900/30 rounded-lg">
          {t.poll.votesHidden}
        </div>
      )}
    </div>
  );
}
