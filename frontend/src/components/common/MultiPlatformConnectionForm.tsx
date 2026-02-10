import { useRef, FormEvent, KeyboardEvent } from 'react';
import type { ConnectionStatus } from '@/hooks';
import { useLanguage } from '@/i18n';
import { PlatformType } from '@/types';
import { PlatformSelector, TikTokIcon, TwitchIcon } from './PlatformSelector';

interface TikTokConnectionConfig {
  status: ConnectionStatus;
  onConnect: (username: string) => void;
  onDisconnect: () => void;
  username: string;
  onUsernameChange: (username: string) => void;
  errorMessage?: string | null;
}

interface TwitchConnectionConfig {
  status: ConnectionStatus;
  onConnect: (channel: string) => void;
  onDisconnect: () => void;
  channel: string;
  onChannelChange: (channel: string) => void;
  errorMessage?: string | null;
}

interface MultiPlatformConnectionFormProps {
  tiktok: TikTokConnectionConfig;
  twitch: TwitchConnectionConfig;
  selectedPlatforms: PlatformType[];
  onPlatformChange: (platforms: PlatformType[]) => void;
  autoReconnect?: boolean;
  onAutoReconnectChange?: (enabled: boolean) => void;
}

/**
 * Multi-platform connection form for TikTok and Twitch
 * Allows users to connect to one or both platforms simultaneously
 */
export function MultiPlatformConnectionForm({
  tiktok,
  twitch,
  selectedPlatforms,
  onPlatformChange,
  autoReconnect = false,
  onAutoReconnectChange,
}: MultiPlatformConnectionFormProps) {
  const tiktokInputRef = useRef<HTMLInputElement>(null);
  const twitchInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

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

  const handleTikTokSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (tiktok.status === 'connected') {
      tiktok.onDisconnect();
    } else if (tiktok.username.trim()) {
      tiktok.onConnect(tiktok.username.trim());
    }
  };

  const handleTwitchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (twitch.status === 'connected') {
      twitch.onDisconnect();
    } else if (twitch.channel.trim()) {
      twitch.onConnect(twitch.channel.trim());
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

  // Check if any platform is connecting
  const isConnecting = 
    (showTikTok && tiktok.status === 'connecting') || 
    (showTwitch && twitch.status === 'connecting');

  return (
    <div className="space-y-4">
      {/* Platform Selector */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <PlatformSelector
          selectedPlatforms={selectedPlatforms}
          onChange={onPlatformChange}
          disabled={isConnecting}
          tiktokConnected={tiktok.status === 'connected'}
          twitchConnected={twitch.status === 'connected'}
        />

        {/* Auto-reconnect checkbox */}
        {onAutoReconnectChange && (
          <div className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
            autoReconnect 
              ? 'bg-purple-900/30 border-purple-500/50' 
              : 'bg-slate-900/50 border-slate-700/50'
          }`}>
            <button
              type="button"
              onClick={() => onAutoReconnectChange(!autoReconnect)}
              className={`w-5 h-5 flex items-center justify-center rounded border-2 transition-all flex-shrink-0 text-sm ${
                autoReconnect
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
        )}
      </div>

      {/* Connection Forms */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* TikTok Connection */}
        {showTikTok && (
          <div className={`p-4 rounded-lg border-2 transition-all ${
            tiktok.status === 'connected'
              ? 'border-tiktok-cyan/50 bg-tiktok-cyan/5'
              : 'border-slate-700/50 bg-slate-800/30'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <TikTokIcon className="w-5 h-5 text-tiktok-cyan" />
              <span className="font-semibold text-white">TikTok</span>
              <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold border ${statusConfig[tiktok.status].className}`}>
                {statusConfig[tiktok.status].text}
              </span>
            </div>

            <form onSubmit={handleTikTokSubmit} className="flex gap-2">
              <input
                ref={tiktokInputRef}
                type="text"
                value={tiktok.username}
                onChange={(e) => tiktok.onUsernameChange(e.target.value)}
                onKeyUp={handleTikTokKeyUp}
                placeholder={t.connection.userPlaceholder}
                className="input-field flex-1"
                disabled={tiktok.status === 'connecting'}
              />
              <button
                type="submit"
                disabled={tiktok.status === 'connecting' || (!tiktok.username.trim() && tiktok.status !== 'connected')}
                className={`px-4 py-2 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  tiktok.status === 'connected'
                    ? 'bg-red-600 text-white hover:bg-red-500'
                    : 'bg-tiktok-cyan text-black hover:bg-tiktok-cyan/80'
                }`}
              >
                {tiktok.status === 'connecting' ? '...' : tiktok.status === 'connected' ? t.common.disconnect : t.common.connect}
              </button>
            </form>

            {/* TikTok Error */}
            {tiktok.status === 'error' && tiktok.errorMessage && (
              <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-300">
                {tiktok.errorMessage}
              </div>
            )}

            {/* Connected indicator */}
            {tiktok.status === 'connected' && (
              <div className="mt-2 text-sm text-tiktok-cyan">
                {t.chat.connectedTo} @{tiktok.username}
              </div>
            )}
          </div>
        )}

        {/* Twitch Connection */}
        {showTwitch && (
          <div className={`p-4 rounded-lg border-2 transition-all ${
            twitch.status === 'connected'
              ? 'border-purple-500/50 bg-purple-500/5'
              : 'border-slate-700/50 bg-slate-800/30'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <TwitchIcon className="w-5 h-5 text-purple-400" />
              <span className="font-semibold text-white">Twitch</span>
              <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold border ${statusConfig[twitch.status].className}`}>
                {statusConfig[twitch.status].text}
              </span>
            </div>

            <form onSubmit={handleTwitchSubmit} className="flex gap-2">
              <input
                ref={twitchInputRef}
                type="text"
                value={twitch.channel}
                onChange={(e) => twitch.onChannelChange(e.target.value)}
                onKeyUp={handleTwitchKeyUp}
                placeholder={t.connection.channelPlaceholder}
                className="input-field flex-1"
                disabled={twitch.status === 'connecting'}
              />
              <button
                type="submit"
                disabled={twitch.status === 'connecting' || (!twitch.channel.trim() && twitch.status !== 'connected')}
                className={`px-4 py-2 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  twitch.status === 'connected'
                    ? 'bg-red-600 text-white hover:bg-red-500'
                    : 'bg-purple-600 text-white hover:bg-purple-500'
                }`}
              >
                {twitch.status === 'connecting' ? '...' : twitch.status === 'connected' ? t.common.disconnect : t.common.connect}
              </button>
            </form>

            {/* Twitch Error */}
            {twitch.status === 'error' && twitch.errorMessage && (
              <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-300">
                {twitch.errorMessage}
              </div>
            )}

            {/* Connected indicator */}
            {twitch.status === 'connected' && (
              <div className="mt-2 text-sm text-purple-400">
                {t.chat.connectedTo} #{twitch.channel}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
