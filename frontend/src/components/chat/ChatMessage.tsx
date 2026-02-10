import { ProfilePicture } from '../common/ProfilePicture';
import { Username } from '../common/Username';
import { TikTokIcon, TwitchIcon } from '../common/PlatformSelector';
import type { ChatItem } from '@/types';

interface ChatMessageProps {
  item: ChatItem;
}

function PlatformBadge({ platform }: { platform?: 'tiktok' | 'twitch' }) {
  if (!platform) return null;
  
  return platform === 'tiktok' ? (
    <TikTokIcon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
  ) : (
    <TwitchIcon className="w-4 h-4 text-purple-400 flex-shrink-0" />
  );
}

export function ChatMessage({ item }: ChatMessageProps) {
  const initial = (item.user.nickname || item.user.uniqueId || '?').charAt(0);
  
  return (
    <div className="flex items-start gap-3 py-2 px-3 hover:bg-slate-700/30 rounded-lg animate-fade-in">
      <ProfilePicture 
        src={item.user.profilePictureUrl} 
        size="sm" 
        fallbackInitial={initial}
      />
      <div className="flex-1 min-w-0">
        <span className="font-medium inline-flex items-center gap-1">
          {item.platform && <PlatformBadge platform={item.platform} />}
          <Username uniqueId={item.user.uniqueId} />
        </span>
        <span className="text-slate-400 mx-1">:</span>
        <span 
          className="break-words"
          style={{ color: item.color || 'inherit' }}
        >
          {item.content}
        </span>
      </div>
    </div>
  );
}
