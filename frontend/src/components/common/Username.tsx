import { PlatformType } from '@/types';

interface UsernameProps {
  uniqueId: string;
  nickname?: string;
  userId?: string;
  platform?: PlatformType;
  className?: string;
}

export function Username({ uniqueId, nickname, userId, platform = PlatformType.TIKTOK, className = '' }: UsernameProps) {
  // Handle undefined uniqueId and strip leading @ to avoid double @@ display
  const safeUniqueId = uniqueId || 'unknown';
  const handle = safeUniqueId.startsWith('@') ? safeUniqueId.slice(1) : safeUniqueId;
  
  // Display nickname if available, otherwise fall back to uniqueId
  const displayName = nickname || handle;
  
  let profileUrl: string;
  if (platform === PlatformType.TWITCH) {
    profileUrl = `https://www.twitch.tv/${handle}`;
  } else if (platform === PlatformType.YOUTUBE) {
    // Use channel URL if userId (channelId) is available, otherwise fallback to handle
    profileUrl = userId 
      ? `https://www.youtube.com/channel/${userId}`
      : `https://www.youtube.com/@${handle}`;
  } else if (platform === PlatformType.KICK) {
    profileUrl = `https://kick.com/${handle}`;
  } else {
    profileUrl = `https://www.tiktok.com/@${handle}`;
  }
  
  let colorClass: string;
  if (platform === PlatformType.TWITCH) {
    colorClass = 'text-purple-400';
  } else if (platform === PlatformType.YOUTUBE) {
    colorClass = 'text-red-500';
  } else if (platform === PlatformType.KICK) {
    colorClass = 'text-green-400';
  } else {
    colorClass = 'text-tiktok-cyan';
  }

  return (
    <a
      href={profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`${colorClass} hover:underline font-medium ${className}`}
    >
      {displayName}
    </a>
  );
}
