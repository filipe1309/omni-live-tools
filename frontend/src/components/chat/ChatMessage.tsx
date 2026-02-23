import { ProfilePicture } from '../common/ProfilePicture';
import { Username } from '../common/Username';
import { TikTokIcon, TwitchIcon, YouTubeIcon } from '../common/PlatformSelector';
import type { ChatItem } from '@/types';

interface ChatMessageProps {
  item: ChatItem;
  onAddToQueue?: (item: ChatItem) => void;
}

function PlatformBadge({ platform }: { platform?: 'tiktok' | 'twitch' | 'youtube' }) {
  if (!platform) return null;
  
  if (platform === 'tiktok') {
    return <TikTokIcon className="w-4 h-4 text-cyan-400 flex-shrink-0" />;
  }
  if (platform === 'youtube') {
    return <YouTubeIcon className="w-4 h-4 text-red-500 flex-shrink-0" />;
  }
  return <TwitchIcon className="w-4 h-4 text-purple-400 flex-shrink-0" />;
}

export function ChatMessage({ item, onAddToQueue }: ChatMessageProps) {
  const initial = (item.user.nickname || item.user.uniqueId || '?').charAt(0);
  const isSuperchat = item.isSuperchat;
  
  return (
    <div className={`flex items-start gap-3 py-2 px-3 rounded-lg animate-fade-in group ${isSuperchat ? 'bg-yellow-500/20 border border-yellow-500/40 hover:bg-yellow-500/30' : 'hover:bg-slate-700/30'}`}>
      {isSuperchat && (
        <span className="text-yellow-400 flex-shrink-0" title="Super Chat">
          💰
        </span>
      )}
      <ProfilePicture 
        src={item.user.profilePictureUrl} 
        size="sm" 
        fallbackInitial={initial}
      />
      <div className="flex-1 min-w-0">
        <span className="font-medium inline-flex items-center gap-1">
          {item.platform && <PlatformBadge platform={item.platform} />}
          <Username uniqueId={item.user.uniqueId} platform={item.platform} />
        </span>
        <span className="text-slate-400 mx-1">:</span>
        <span 
          className="break-words"
          style={{ color: item.color || 'inherit' }}
        >
          {item.content}
        </span>
      </div>
      {onAddToQueue && (
        <button
          onClick={() => onAddToQueue(item)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-emerald-500/20 rounded text-emerald-400 hover:text-emerald-300 flex-shrink-0"
          title="Add to queue"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
          </svg>
        </button>
      )}
    </div>
  );
}
