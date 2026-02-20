import { FormEvent, KeyboardEvent, useRef } from 'react';
import { useConnectionContext } from '@/hooks';
import { useLanguage } from '@/i18n';
import { PlatformType } from '@/types';
import { PlatformSelector, TikTokIcon, TwitchIcon } from './PlatformSelector';

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
    selectedPlatforms,
    setSelectedPlatforms,
    setTikTokUsername,
    setTwitchChannel,
    isAnyConnected,
  } = useConnectionContext();

  const { t } = useLanguage();
  const tiktokInputRef = useRef<HTMLInputElement>(null);
  const twitchInputRef = useRef<HTMLInputElement>(null);

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

  const isConnecting =
    (showTikTok && tiktok.status === 'connecting') ||
    (showTwitch && twitch.status === 'connecting');

  // Determine if modal should be shown
  // If isOpen is provided (controlled mode), use it
  // Otherwise, show when not connected (uncontrolled mode for initial connection)
  const isControlled = isOpen !== undefined;
  const shouldShow = isControlled ? isOpen : !isAnyConnected;

  if (!shouldShow) {
    return null;
  }

  const handleBackdropClick = () => {
    // Only allow closing via backdrop if in controlled mode and connected
    if (isControlled && isAnyConnected && onClose) {
      onClose();
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
      <div className="relative bg-slate-800 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl border border-slate-700 my-auto">
        {/* Close button - only show when in controlled mode and connected */}
        {isControlled && isAnyConnected && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors text-xl"
            aria-label="Close"
          >
            ✕
          </button>
        )}

        <div className="text-center mb-6">
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
                    className="input-field flex-1 min-w-0"
                    disabled={tiktok.status === 'connecting'}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={tiktok.status === 'connecting' || (!tiktok.username.trim() && tiktok.status !== 'connected')}
                    className={`px-4 py-2 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${tiktok.status === 'connected'
                      ? 'bg-red-600 text-white hover:bg-red-500'
                      : 'bg-tiktok-cyan text-black hover:bg-tiktok-cyan/80'
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
                    className="input-field flex-1 min-w-0"
                    disabled={twitch.status === 'connecting'}
                  />
                  <button
                    type="submit"
                    disabled={twitch.status === 'connecting' || (!twitch.channelName.trim() && twitch.status !== 'connected')}
                    className={`px-4 py-2 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${twitch.status === 'connected'
                      ? 'bg-red-600 text-white hover:bg-red-500'
                      : 'bg-purple-600 text-white hover:bg-purple-500'
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
          </div>
        </div>
      </div>
    </div>
  );
}
