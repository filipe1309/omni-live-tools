import { useRef, useEffect, useState } from 'react';
import { ProfilePicture } from '../common/ProfilePicture';
import type { VoteEntry } from '@/types';

interface VoteLogProps {
  entries: VoteEntry[];
  maxHeight?: string;
  onClear?: () => void;
}

export function VoteLog({ entries, maxHeight = '300px', onClear }: VoteLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showVotes, setShowVotes] = useState(true);

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
          Mostrar votos individuais
        </label>
        {onClear && (
          <button 
            onClick={onClear}
            className="btn-secondary text-sm px-3 py-1.5"
          >
            🗑️ Limpar Registro
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
              Nenhum voto ainda...
            </div>
          ) : (
            <div className="space-y-2">
              {[...entries].reverse().map((entry) => (
                <div 
                  key={entry.id}
                  className="flex items-center gap-3 py-2 px-3 bg-slate-800/50 rounded-lg animate-slide-in border border-slate-700/30"
                >
                  <ProfilePicture src={entry.user.profilePictureUrl} size="sm" />
                  
                  <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                    <span className="text-tiktok-cyan font-bold truncate">
                      @{entry.user.uniqueId}
                    </span>
                    <span className="text-slate-400">votou em</span>
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
          Votos ocultos
        </div>
      )}
    </div>
  );
}
