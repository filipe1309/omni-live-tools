import type { ChatItem } from '@/types';

interface ObsChatMessageProps {
  item: ChatItem;
  fontColor?: string;
}

/**
 * Chat message component for OBS overlay
 * Matches the style from public/app.js addChatItem function
 */
export function ObsChatMessage({ item, fontColor }: ObsChatMessageProps) {
  return (
    <div className="flex items-start gap-2">
      <img
        src={item.user.profilePictureUrl}
        alt=""
        className="w-5 h-5 rounded-full flex-shrink-0"
      />
      <span>
        <a
          href={`https://www.tiktok.com/@${item.user.uniqueId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[rgb(102,143,217)] font-bold hover:underline"
        >
          {item.user.uniqueId}
        </a>
        <span>: </span>
        <span
          style={{
            color: item.color || fontColor || 'inherit',
          }}
        >
          {item.content}
        </span>
      </span>
    </div>
  );
}
