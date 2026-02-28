import type { ChatItem } from '@/types';

interface ObsChatMessageProps {
  item: ChatItem;
  fontColor?: string;
}

/**
 * Chat message component for OBS overlay
 * Matches the style from public/app.js addChatItem function
 */
export function ObsChatMessage ({ item, fontColor }: ObsChatMessageProps) {
  const isTwitch = item.platform === 'twitch';
  const isYouTube = item.platform === 'youtube';
  
  // Strip leading @ from uniqueId for profile URL
  const handle = item.user.uniqueId.startsWith('@') 
    ? item.user.uniqueId.slice(1) 
    : item.user.uniqueId;
  
  // Display nickname if available, otherwise fall back to handle
  const displayName = item.user.nickname || handle;
  
  let profileUrl: string;
  if (isTwitch) {
    profileUrl = `https://www.twitch.tv/${handle}`;
  } else if (isYouTube) {
    profileUrl = `https://www.youtube.com/channel/${item.user.userId}`;
  } else {
    profileUrl = `https://www.tiktok.com/@${handle}`;
  }

  const hasProfilePicture = item.user.profilePictureUrl && item.user.profilePictureUrl.trim() !== '';
  const initial = (item.user.nickname || item.user.uniqueId || '?').charAt(0).toUpperCase();

  // Platform colors
  let platformColor = '#00f2ea'; // TikTok cyan
  if (isTwitch) {
    platformColor = '#9146ff'; // Twitch purple
  } else if (isYouTube) {
    platformColor = '#ff0000'; // YouTube red
  }

  return (
    <div className="flex items-start gap-2">
      {hasProfilePicture ? (
        <img
          src={item.user.profilePictureUrl}
          alt=""
          className="w-5 h-5 rounded-full flex-shrink-0"
        />
      ) : (
        <div
          className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
          style={{
            backgroundColor: platformColor,
            color: '#fff'
          }}
        >
          {initial}
        </div>
      )}
      <span>
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold hover:underline"
          style={{ color: isTwitch ? '#9146ff' : isYouTube ? '#ff0000' : 'rgb(102,143,217)' }}
        >
          {displayName}
        </a>
        <span>: </span>
        <span
          className="break-all"
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
