interface UsernameProps {
  uniqueId: string;
  platform?: 'tiktok' | 'twitch' | 'youtube';
  className?: string;
}

export function Username({ uniqueId, platform = 'tiktok', className = '' }: UsernameProps) {
  let profileUrl: string;
  if (platform === 'twitch') {
    profileUrl = `https://www.twitch.tv/${uniqueId}`;
  } else if (platform === 'youtube') {
    profileUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(uniqueId)}`;
  } else {
    profileUrl = `https://www.tiktok.com/@${uniqueId}`;
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
      @{uniqueId}
    </a>
  );
}
