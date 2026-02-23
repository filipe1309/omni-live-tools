import { useRef, useEffect } from 'react';
import { ProfilePicture } from '../common/ProfilePicture';
import { Username } from '../common/Username';
import { TikTokIcon, TwitchIcon, YouTubeIcon } from '../common/PlatformSelector';
import { useLanguage } from '@/i18n';
import type { ChatItem } from '@/types';

interface ChatQueueContainerProps {
  items: ChatItem[];
  title: string;
  onRemove: (id: string) => void;
  onSendToOverlay?: (item: ChatItem) => void;
  featuredMessageId?: string | null;
  maxHeight?: string;
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

interface QueueMessageProps {
  item: ChatItem;
  onRemove: (id: string) => void;
  onSendToOverlay?: (item: ChatItem) => void;
  isOnOverlay?: boolean;
}

function QueueMessage({ item, onRemove, onSendToOverlay, isOnOverlay }: QueueMessageProps) {
  const initial = (item.user.nickname || item.user.uniqueId || '?').charAt(0);
  const isSuperchat = item.isSuperchat;
  
  return (
    <div className={`flex items-start gap-3 py-2 px-3 rounded-lg animate-fade-in group ${isSuperchat ? 'bg-yellow-500/20 border border-yellow-500/40 hover:bg-yellow-500/30' : 'hover:bg-slate-700/30'} ${isOnOverlay ? 'ring-2 ring-cyan-400/50' : ''}`}>
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
      <div className="flex items-center gap-1 flex-shrink-0">
        {onSendToOverlay && (
          <button
            onClick={() => onSendToOverlay(item)}
            className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded flex-shrink-0 ${
              isOnOverlay 
                ? 'bg-cyan-500/30 text-cyan-300' 
                : 'hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300'
            }`}
            title={isOnOverlay ? 'On overlay' : 'Send to overlay'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
          </button>
        )}
        <button
          onClick={() => onRemove(item.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 flex-shrink-0"
          title="Remove from queue"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function ChatQueueContainer({ items, title, onRemove, onSendToOverlay, featuredMessageId, maxHeight = 'calc(100vh - 320px)' }: ChatQueueContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  // Auto-scroll to bottom when new items arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [items.length]);

  return (
    <div className="card flex flex-col">
      {title && (
        <h3 className="text-lg font-bold text-center mb-4 pb-3 border-b border-slate-700">
          {title}
        </h3>
      )}
      
      <div 
        ref={containerRef}
        className="chat-container overflow-y-auto space-y-1"
        style={{ maxHeight }}
      >
        {items.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            {t.chat.noQueueMessages}
          </div>
        ) : (
          items.map((item) => (
            <QueueMessage 
              key={item.id} 
              item={item} 
              onRemove={onRemove} 
              onSendToOverlay={onSendToOverlay}
              isOnOverlay={featuredMessageId === item.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
