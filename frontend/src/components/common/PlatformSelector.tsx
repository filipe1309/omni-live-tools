import { PlatformType } from '@/types';

interface PlatformSelectorProps {
  selectedPlatforms: PlatformType[];
  onChange: (platforms: PlatformType[]) => void;
  disabled?: boolean;
  tiktokConnected?: boolean;
  twitchConnected?: boolean;
}

/**
 * Component for selecting which platforms to connect to
 * Supports selecting TikTok, Twitch, or both
 */
export function PlatformSelector({
  selectedPlatforms,
  onChange,
  disabled = false,
  tiktokConnected = false,
  twitchConnected = false,
}: PlatformSelectorProps) {
  const isTikTokSelected = selectedPlatforms.includes(PlatformType.TIKTOK);
  const isTwitchSelected = selectedPlatforms.includes(PlatformType.TWITCH);

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
      <span className="text-sm text-slate-400 mr-2">Plataformas:</span>
      
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

// Export icons for use elsewhere
export { TikTokIcon, TwitchIcon };
