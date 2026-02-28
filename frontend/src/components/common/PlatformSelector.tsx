import { PlatformType } from '@/types';
import { useLanguage } from '@/i18n';

interface PlatformSelectorProps {
  selectedPlatforms: PlatformType[];
  onChange: (platforms: PlatformType[]) => void;
  disabled?: boolean;
  tiktokConnected?: boolean;
  twitchConnected?: boolean;
  youtubeConnected?: boolean;
  kickConnected?: boolean;
}

/**
 * Component for selecting which platforms to connect to
 * Supports selecting TikTok, Twitch, YouTube, or any combination
 */
export function PlatformSelector({
  selectedPlatforms,
  onChange,
  disabled = false,
  tiktokConnected = false,
  twitchConnected = false,
  youtubeConnected = false,
  kickConnected = false,
}: PlatformSelectorProps) {
  const { t } = useLanguage();
  const isTikTokSelected = selectedPlatforms.includes(PlatformType.TIKTOK);
  const isTwitchSelected = selectedPlatforms.includes(PlatformType.TWITCH);
  const isYouTubeSelected = selectedPlatforms.includes(PlatformType.YOUTUBE);
  const isKickSelected = selectedPlatforms.includes(PlatformType.KICK);

  const togglePlatform = (platform: PlatformType) => {
    if (disabled) return;

    if (selectedPlatforms.includes(platform)) {
      // Don't allow deselecting if it's the only one selected
      if (selectedPlatforms.length === 1) return;
      onChange(selectedPlatforms.filter(p => p !== platform));
    } else {
      onChange([...selectedPlatforms, platform]);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-400 mr-2">{t.connection.platformsLabel}:</span>
      
      {/* TikTok Button */}
      <button
        type="button"
        onClick={() => togglePlatform(PlatformType.TIKTOK)}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all
          ${isTikTokSelected 
            ? 'border-tiktok-cyan bg-tiktok-cyan/10 text-tiktok-cyan' 
            : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-slate-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <TikTokIcon className="w-5 h-5" />
        <span className="text-sm font-medium">TikTok</span>
        {tiktokConnected && (
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        )}
      </button>

      {/* Twitch Button */}
      <button
        type="button"
        onClick={() => togglePlatform(PlatformType.TWITCH)}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all
          ${isTwitchSelected 
            ? 'border-purple-500 bg-purple-500/10 text-purple-400' 
            : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-slate-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <TwitchIcon className="w-5 h-5" />
        <span className="text-sm font-medium">Twitch</span>
        {twitchConnected && (
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        )}
      </button>

      {/* YouTube Button */}
      <button
        type="button"
        onClick={() => togglePlatform(PlatformType.YOUTUBE)}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all
          ${isYouTubeSelected 
            ? 'border-red-500 bg-red-500/10 text-red-400' 
            : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-slate-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <YouTubeIcon className="w-5 h-5" />
        <span className="text-sm font-medium">YouTube</span>
        {youtubeConnected && (
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        )}
      </button>

      {/* Kick Button */}
      <button
        type="button"
        onClick={() => togglePlatform(PlatformType.KICK)}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all
          ${isKickSelected 
            ? 'border-green-500 bg-green-500/10 text-green-400' 
            : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-slate-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <KickIcon className="w-5 h-5" />
        <span className="text-sm font-medium">Kick</span>
        {kickConnected && (
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        )}
      </button>
    </div>
  );
}

// TikTok Icon Component
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

// Twitch Icon Component
function TwitchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
    </svg>
  );
}

// YouTube Icon Component
function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

// Kick Icon Component
function KickIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M1.333 0v24h5.12V13.6L12.907 24h6.187l-7.68-12 7.68-12h-6.187L6.453 10.4V0z" />
    </svg>
  );
}

// Export icons for use elsewhere
export { TikTokIcon, TwitchIcon, YouTubeIcon, KickIcon };
