interface ConnectionStatusBannerProps {
  tiktok: {
    isConnected: boolean;
    username?: string;
  };
  twitch: {
    isConnected: boolean;
    channel?: string | null;
  };
  className?: string;
  compact?: boolean;
}

export function ConnectionStatusBanner ({ tiktok, twitch, className = '', compact = false }: ConnectionStatusBannerProps) {
  const hasConnections = tiktok.isConnected || twitch.isConnected;

  if (!hasConnections) {
    return null;
  }

  const paddingClass = compact ? 'px-3 py-1.5' : 'px-4 py-2';
  const gapClass = compact ? 'gap-2' : 'gap-3';

  return (
    <div className={`flex flex-wrap ${gapClass} ${className}`}>
      {tiktok.isConnected && (
        <div className={`${paddingClass} bg-tiktok-cyan/10 border border-tiktok-cyan/30 rounded-lg text-tiktok-cyan text-sm flex items-center gap-2`}>
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          TikTok: @{tiktok.username}
        </div>
      )}
      {twitch.isConnected && (
        <div className={`${paddingClass} bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400 text-sm flex items-center gap-2`}>
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Twitch: #{twitch.channel}
        </div>
      )}
    </div>
  );
}
