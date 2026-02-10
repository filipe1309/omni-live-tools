import { ProfilePicture } from '../common/ProfilePicture';
import { Username } from '../common/Username';
import type { ChatItem } from '@/types';

interface ChatMessageProps {
  item: ChatItem;
}

export function ChatMessage({ item }: ChatMessageProps) {
  return (
    <div className="flex items-start gap-3 py-2 px-3 hover:bg-slate-700/30 rounded-lg animate-fade-in">
      <ProfilePicture src={item.user.profilePictureUrl} size="sm" />
      <div className="flex-1 min-w-0">
        <span className="font-medium">
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
