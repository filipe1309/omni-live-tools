import { FormEvent, KeyboardEvent, useRef, useState, useEffect } from 'react';
import { useConnectionContext } from '@/hooks';
import { useLanguage } from '@/i18n';
import { PlatformType } from '@/types';
import { PlatformSelector, TikTokIcon, TwitchIcon, YouTubeIcon, KickIcon } from './PlatformSelector';
import { LanguageSelector } from './LanguageSelector';

interface ConnectionModalProps {
  /** If true, modal is controlled externally */
  isOpen?: boolean;
  /** Called when user closes the modal (only when isOpen is provided) */
  onClose?: () => void;
}

/**
 * Modal for establishing connections to TikTok/Twitch
 * Shows as an overlay with blurred background until at least one connection is established
 * Can be controlled externally via isOpen/onClose props
 */
export function ConnectionModal ({ isOpen, onClose }: ConnectionModalProps) {
  const {
    tiktok,
    twitch,
    youtube,
    kick,
    selectedPlatforms,
    setSelectedPlatforms,
    setTikTokUsername,
    setTwitchChannel,
    setYouTubeVideo,
    setKickChannel,
    isAnyConnected,
    autoReconnect,
    setAutoReconnect,
  } = useConnectionContext();

  const { t } = useLanguage();
  const tiktokInputRef = useRef<HTMLInputElement>(null);
  const twitchInputRef = useRef<HTMLInputElement>(null);
  const youtubeInputRef = useRef<HTMLInputElement>(null);
  const kickInputRef = useRef<HTMLInputElement>(null);

  // State for manual dismiss in uncontrolled mode
  const [dismissedUncontrolled, setDismissedUncontrolled] = useState(false);

  // Track if any selected platform was disconnected when modal opened (for auto-close logic)
  const [hadDisconnectedOnOpen, setHadDisconnectedOnOpen] = useState(false);

  // Reset dismissed state if all connections are lost (to show modal again)
  useEffect(() => {
    if (!isAnyConnected) {
      setDismissedUncontrolled(false);
    }
  }, [isAnyConnected]);

  const statusConfig = {
    disconnected: {
      text: t.common.disconnected,
      className: 'bg-red-500/20 text-red-400 border-red-500',
    },
    connecting: {
      text: t.common.connecting,
      className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500 animate-pulse',
    },
    connected: {
      text: t.common.connected,
      className: 'bg-green-500/20 text-green-400 border-green-500',
    },
    error: {
      text: t.common.error,
      className: 'bg-red-500/20 text-red-400 border-red-500',
    },
  };

  const showTikTok = selectedPlatforms.includes(PlatformType.TIKTOK);
  const showTwitch = selectedPlatforms.includes(PlatformType.TWITCH);
  const showYouTube = selectedPlatforms.includes(PlatformType.YOUTUBE);
  const showKick = selectedPlatforms.includes(PlatformType.KICK);

  const handleTikTokSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (tiktok.status === 'connected') {
      tiktok.disconnect();
    } else if (tiktok.username.trim()) {
      try {
        await tiktok.connect(tiktok.username.trim());
      } catch {
        // Error handling is done in the context
      }
    }
  };

  const handleTwitchSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (twitch.status === 'connected') {
      twitch.disconnect();
    } else if (twitch.channelName.trim()) {
      try {
        await twitch.connect(twitch.channelName.trim());
      } catch {
        // Error handling is done in the context
      }
    }
  };

  const handleTikTokKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTikTokSubmit(e);
    }
  };

  const handleTwitchKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTwitchSubmit(e);
    }
  };

  const handleYouTubeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (youtube.status === 'connected') {
      youtube.disconnect();
    } else if (youtube.videoInput.trim()) {
      try {
        await youtube.connect(youtube.videoInput.trim());
      } catch {
        // Error handling is done in the context
      }
    }
  };

  const handleYouTubeKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleYouTubeSubmit(e);
    }
  };

  const handleKickSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (kick.status === 'connected') {
      kick.disconnect();
    } else if (kick.channelName.trim()) {
      try {
        await kick.connect(kick.channelName.trim());
      } catch {
        // Error handling is done in the context
      }
    }
  };

  const handleKickKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleKickSubmit(e);
    }
  };

  const isConnecting =
    (showTikTok && tiktok.status === 'connecting') ||
    (showTwitch && twitch.status === 'connecting') ||
    (showYouTube && youtube.status === 'connecting') ||
    (showKick && kick.status === 'connecting');

  // Check if all selected platforms are connected
  const areAllSelectedConnected =
    (!showTikTok || tiktok.status === 'connected') &&
    (!showTwitch || twitch.status === 'connected') &&
    (!showYouTube || youtube.status === 'connected') &&
    (!showKick || kick.status === 'connected');

  // Check if any selected platform is currently disconnected
  const hasAnySelectedDisconnected =
    (showTikTok && tiktok.status !== 'connected') ||
    (showTwitch && twitch.status !== 'connected') ||
    (showYouTube && youtube.status !== 'connected') ||
    (showKick && kick.status !== 'connected');

  // Determine if modal should be shown
  // If isOpen is provided (controlled mode), use it
  // Otherwise, show when ALL selected platforms are connected (not just any)
  // This allows users to connect multiple platforms before auto-closing
  const isControlled = isOpen !== undefined;

  // Track when modal opens and capture if any platform was disconnected at that moment
  // This prevents auto-close when user just wants to view/manage existing connections
  useEffect(() => {
    if (isControlled && isOpen) {
      setHadDisconnectedOnOpen(hasAnySelectedDisconnected);
    }
  // Only run when isOpen changes to true, not on connection status changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isControlled, isOpen]);

  // Also track disconnections that happen while modal is open
  // (e.g., user disconnects a platform or adds a new unconnected platform)
  useEffect(() => {
    if (isControlled && isOpen && hasAnySelectedDisconnected) {
      setHadDisconnectedOnOpen(true);
    }
  }, [isControlled, isOpen, hasAnySelectedDisconnected]);

  // Auto-close controlled modal when all selected platforms are connected
  // Only if there was at least one disconnected platform when modal opened or during session
  useEffect(() => {
    if (isControlled && isOpen && hadDisconnectedOnOpen && areAllSelectedConnected && selectedPlatforms.length > 0 && onClose) {
      onClose();
    }
  }, [isControlled, isOpen, hadDisconnectedOnOpen, areAllSelectedConnected, selectedPlatforms.length, onClose]);

  const shouldShow = isControlled ? isOpen : !areAllSelectedConnected && !dismissedUncontrolled;

  if (!shouldShow) {
    return null;
  }

  // Allow closing when at least one platform is connected (both controlled and uncontrolled mode)
  const canClose = isAnyConnected;

  const handleClose = () => {
    if (isControlled && onClose) {
      onClose();
    } else if (!isControlled) {
      setDismissedUncontrolled(true);
    }
  };

  const handleBackdropClick = () => {
    if (canClose) {
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-16">
      {/* Blurred backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-md"
        onClick={handleBackdropClick}
      />

      {/* Modal content */}
      <div className="relative bg-slate-800 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl border border-slate-700 my-auto max-h-[90vh] overflow-y-auto">
        {/* Top bar with language selector and close button */}
        <div className="absolute top-4 right-4 flex items-center gap-3">
          <LanguageSelector />
          {/* Close button - show when at least one platform is connected */}
          {canClose && (
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-white transition-colors text-xl"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>

        <div className="text-center mb-6 mt-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-tiktok-red to-tiktok-cyan bg-clip-text text-transparent mb-2">
            {isControlled ? t.connectionModal.manageTitle : t.connectionModal.title}
          </h2>
          <p className="text-slate-400 text-sm">
            {isControlled ? t.connectionModal.manageDescription : t.connectionModal.description}
          </p>
        </div>

        <div className="space-y-4">
          {/* Platform Selector */}
          <div className="flex justify-center">
            <PlatformSelector
              selectedPlatforms={selectedPlatforms}
              onChange={setSelectedPlatforms}
              disabled={isConnecting}
              tiktokConnected={tiktok.status === 'connected'}
              twitchConnected={twitch.status === 'connected'}
              youtubeConnected={youtube.status === 'connected'}
              kickConnected={kick.status === 'connected'}
            />
          </div>

          {/* Connection Forms */}
          <div className="space-y-4">
            {/* TikTok Connection */}
            {showTikTok && (
              <div className={`p-4 rounded-lg border-2 transition-all ${tiktok.status === 'connected'
                ? 'border-tiktok-cyan/50 bg-tiktok-cyan/5'
                : 'border-slate-700/50 bg-slate-700/30'
                }`}>
                <div className="flex items-center gap-2 mb-3">
                  <TikTokIcon className="w-5 h-5 text-tiktok-cyan" />
                  <span className="font-semibold text-white">TikTok</span>
                  <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold border ${statusConfig[tiktok.status].className}`}>
                    {statusConfig[tiktok.status].text}
                  </span>
                </div>

                <form onSubmit={handleTikTokSubmit} className="flex flex-wrap gap-2">
                  <input
                    ref={tiktokInputRef}
                    type="text"
                    value={tiktok.username}
                    onChange={(e) => setTikTokUsername(e.target.value)}
                    onKeyUp={handleTikTokKeyUp}
                    placeholder={t.connection.userPlaceholder}
                    className="input-field flex-1 min-w-0 disabled:cursor-not-allowed"
                    disabled={tiktok.status === 'connecting' || tiktok.status === 'connected'}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={tiktok.status === 'connecting' || (!tiktok.username.trim() && tiktok.status !== 'connected')}
                    className={`px-4 py-2 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${tiktok.status === 'connected'
                      ? 'bg-red-600 text-white hover:bg-red-500'
                      : 'bg-[#69d2e7] text-slate-900 hover:bg-[#5bc0d5]'
                      }`}
                  >
                    {tiktok.status === 'connecting' ? '...' : tiktok.status === 'connected' ? t.common.disconnect : t.common.connect}
                  </button>
                </form>

                {tiktok.status === 'error' && tiktok.error && (
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-300">
                    {tiktok.error}
                  </div>
                )}
              </div>
            )}

            {/* Twitch Connection */}
            {showTwitch && (
              <div className={`p-4 rounded-lg border-2 transition-all ${twitch.status === 'connected'
                ? 'border-purple-500/50 bg-purple-500/5'
                : 'border-slate-700/50 bg-slate-700/30'
                }`}>
                <div className="flex items-center gap-2 mb-3">
                  <TwitchIcon className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold text-white">Twitch</span>
                  <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold border ${statusConfig[twitch.status].className}`}>
                    {statusConfig[twitch.status].text}
                  </span>
                </div>

                <form onSubmit={handleTwitchSubmit} className="flex flex-wrap gap-2">
                  <input
                    ref={twitchInputRef}
                    type="text"
                    value={twitch.channelName}
                    onChange={(e) => setTwitchChannel(e.target.value)}
                    onKeyUp={handleTwitchKeyUp}
                    placeholder={t.connection.channelPlaceholder}
                    className="input-field flex-1 min-w-0 disabled:cursor-not-allowed"
                    disabled={twitch.status === 'connecting' || twitch.status === 'connected'}
                  />
                  <button
                    type="submit"
                    disabled={twitch.status === 'connecting' || (!twitch.channelName.trim() && twitch.status !== 'connected')}
                    className={`px-4 py-2 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${twitch.status === 'connected'
                      ? 'bg-red-600 text-white hover:bg-red-500'
                      : 'bg-[#b19cd9] text-slate-900 hover:bg-[#a388ee]'
                      }`}
                  >
                    {twitch.status === 'connecting' ? '...' : twitch.status === 'connected' ? t.common.disconnect : t.common.connect}
                  </button>
                </form>

                {twitch.status === 'error' && twitch.error && (
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-300">
                    {twitch.error}
                  </div>
                )}
              </div>
            )}

            {/* YouTube Connection */}
            {showYouTube && (
              <div className={`p-4 rounded-lg border-2 transition-all ${youtube.status === 'connected'
                ? 'border-red-500/50 bg-red-500/5'
                : 'border-slate-700/50 bg-slate-700/30'
                }`}>
                <div className="flex items-center gap-2 mb-3">
                  <YouTubeIcon className="w-5 h-5 text-red-500" />
                  <span className="font-semibold text-white">YouTube</span>
                  <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold border ${statusConfig[youtube.status].className}`}>
                    {statusConfig[youtube.status].text}
                  </span>
                </div>

                <form onSubmit={handleYouTubeSubmit} className="flex flex-wrap gap-2">
                  <input
                    ref={youtubeInputRef}
                    type="text"
                    value={youtube.videoInput}
                    onChange={(e) => setYouTubeVideo(e.target.value)}
                    onKeyUp={handleYouTubeKeyUp}
                    placeholder={t.connection.videoPlaceholder || 'Video ID or URL'}
                    className="input-field flex-1 min-w-0 disabled:cursor-not-allowed"
                    disabled={youtube.status === 'connecting' || youtube.status === 'connected'}
                  />
                  <button
                    type="submit"
                    disabled={youtube.status === 'connecting' || (!youtube.videoInput.trim() && youtube.status !== 'connected')}
                    className={`px-4 py-2 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${youtube.status === 'connected'
                      ? 'bg-red-600 text-white hover:bg-red-500'
                      : 'bg-[#ee6055] text-white hover:bg-[#e04d42]'
                      }`}
                  >
                    {youtube.status === 'connecting' ? '...' : youtube.status === 'connected' ? t.common.disconnect : t.common.connect}
                  </button>
                </form>

                {youtube.status === 'error' && youtube.error && (
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-300">
                    {youtube.error}
                  </div>
                )}
              </div>
            )}

            {/* Kick Connection */}
            {showKick && (
              <div className={`p-4 rounded-lg border-2 transition-all ${kick.status === 'connected'
                ? 'border-green-500/50 bg-green-500/5'
                : 'border-slate-700/50 bg-slate-700/30'
                }`}>
                <div className="flex items-center gap-2 mb-3">
                  <KickIcon className="w-5 h-5 text-green-400" />
                  <span className="font-semibold text-white">Kick</span>
                  <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold border ${statusConfig[kick.status].className}`}>
                    {statusConfig[kick.status].text}
                  </span>
                </div>

                <form onSubmit={handleKickSubmit} className="flex flex-wrap gap-2">
                  <input
                    ref={kickInputRef}
                    type="text"
                    value={kick.channelName}
                    onChange={(e) => setKickChannel(e.target.value)}
                    onKeyUp={handleKickKeyUp}
                    placeholder={t.connection.kickChannel || 'Kick channel name'}
                    className="input-field flex-1 min-w-0 disabled:cursor-not-allowed"
                    disabled={kick.status === 'connecting' || kick.status === 'connected'}
                  />
                  <button
                    type="submit"
                    disabled={kick.status === 'connecting' || (!kick.channelName.trim() && kick.status !== 'connected')}
                    className={`px-4 py-2 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${kick.status === 'connected'
                      ? 'bg-red-600 text-white hover:bg-red-500'
                      : 'bg-[#53fc18] text-slate-900 hover:bg-[#4ae615]'
                      }`}
                  >
                    {kick.status === 'connecting' ? '...' : kick.status === 'connected' ? t.common.disconnect : t.common.connect}
                  </button>
                </form>

                {kick.status === 'connecting' && (
                  <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-sm text-yellow-300">
                    ⏳ {t.connection.kickConnectionWarning}
                  </div>
                )}

                {kick.status === 'error' && kick.error && (
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-300">
                    {kick.error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Auto-reconnect option */}
          <div className={`flex items-center justify-center gap-3 p-3 rounded-lg border transition-all ${autoReconnect
            ? 'bg-purple-900/30 border-purple-500/50'
            : 'bg-slate-700/30 border-slate-700/50'
            }`}>
            <button
              type="button"
              onClick={() => setAutoReconnect(!autoReconnect)}
              className={`w-5 h-5 flex items-center justify-center rounded border-2 transition-all flex-shrink-0 text-sm ${autoReconnect
                ? 'bg-purple-600 border-purple-500 text-white'
                : 'bg-slate-800 border-slate-600 text-transparent hover:border-slate-500'
                }`}
            >
              {autoReconnect && '✓'}
            </button>
            <span className="text-sm text-slate-300">
              🔄 {t.connection.autoReconnect}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
