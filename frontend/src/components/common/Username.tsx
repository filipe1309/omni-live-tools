interface UsernameProps {
  uniqueId: string;
  platform?: 'tiktok' | 'twitch';
  className?: string;
}

export function Username({ uniqueId, platform = 'tiktok', className = '' }: UsernameProps) {
  const profileUrl = platform === 'twitch'
    ? `https://www.twitch.tv/${uniqueId}`
    : `https://www.tiktok.com/@${uniqueId}`;
  
  const colorClass = platform === 'twitch' 
    ? 'text-purple-400' 
    : 'text-tiktok-cyan';

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
