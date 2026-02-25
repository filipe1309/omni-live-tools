interface UsernameProps {
  uniqueId: string;
  userId?: string;
  platform?: 'tiktok' | 'twitch' | 'youtube';
  className?: string;
}

export function Username({ uniqueId, userId, platform = 'tiktok', className = '' }: UsernameProps) {
  // Strip leading @ from uniqueId to avoid double @@ display
  const displayName = uniqueId.startsWith('@') ? uniqueId.slice(1) : uniqueId;
  
  let profileUrl: string;
  if (platform === 'twitch') {
    profileUrl = `https://www.twitch.tv/${displayName}`;
  } else if (platform === 'youtube') {
    // Use channel URL if userId (channelId) is available, otherwise fallback to handle
    profileUrl = userId 
      ? `https://www.youtube.com/channel/${userId}`
      : `https://www.youtube.com/@${displayName}`;
  } else {
    profileUrl = `https://www.tiktok.com/@${displayName}`;
  }
  
  let colorClass: string;
  if (platform === 'twitch') {
    colorClass = 'text-purple-400';
  } else if (platform === 'youtube') {
    colorClass = 'text-red-500';
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
      @{displayName}
    </a>
  );
}
