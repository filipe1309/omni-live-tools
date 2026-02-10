import { useCallback, useState, useEffect, useRef } from 'react';
import { useMultiPlatformConnection, usePoll, useToast } from '@/hooks';
import { useLanguage, interpolate } from '@/i18n';
import { MultiPlatformConnectionForm, PollSetup, PollResults, VoteLog } from '@/components';
import type { ChatMessage, PollOption, UnifiedChatMessage, PlatformType } from '@/types';
import type { SetupConfig } from '@/hooks/usePoll';
import { POLL_TIMER, DEFAULT_QUESTION } from '@/constants';
import { safeSetItem } from '@/utils';

export function PollPage() {
  const { pollState, voteLog, startPoll, stopPoll, resetPoll, processVote, clearVoteLog, getTotalVotes, getPercentage, openResultsPopup, broadcastSetupConfig, setConnectionStatus, onConfigUpdate, onReconnect } = usePoll();
  const toast = useToast();
  const { t } = useLanguage();
  // Track current username in the input field for reconnection (TikTok)
  const [currentUsername, setCurrentUsername] = useState(() => {
    const saved = localStorage.getItem('tiktok-poll-uniqueId');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return saved; // fallback to raw value if not valid JSON
      }
    }
    return 'jamesbonfim';
  });

  // Track current channel for Twitch
  const [currentTwitchChannel, setCurrentTwitchChannel] = useState(() => {
    const saved = localStorage.getItem('twitch-poll-channel');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return saved;
      }
    }
    return '';
  });

  // Track selected platforms
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>(() => {
    const saved = localStorage.getItem('poll-selectedPlatforms');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return ['tiktok'] as PlatformType[];
      }
    }
    return ['tiktok'] as PlatformType[];
  });

  // Auto-reconnect state
  const [autoReconnect, setAutoReconnect] = useState(() => {
    const saved = localStorage.getItem('tiktok-poll-autoReconnect');
    return saved === 'true';
  });
  const autoReconnectRef = useRef(autoReconnect);
  useEffect(() => {
    autoReconnectRef.current = autoReconnect;
  }, [autoReconnect]);

  // Pending reconnect flag - set to true when we need to reconnect after socket comes back
  const [pendingReconnect, setPendingReconnect] = useState(false);
  
  // Keep a ref to the current username for the reconnect callback
  const currentUsernameRef = useRef(currentUsername);
  useEffect(() => {
    currentUsernameRef.current = currentUsername;
  }, [currentUsername]);

  // Keep a ref to the current Twitch channel for reconnect
  const currentTwitchChannelRef = useRef(currentTwitchChannel);
  useEffect(() => {
    currentTwitchChannelRef.current = currentTwitchChannel;
  }, [currentTwitchChannel]);
  
  // Load saved setup config from localStorage
  const loadSavedSetupConfig = (): SetupConfig | null => {
    const saved = localStorage.getItem('tiktok-poll-setupConfig');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  };

  // Load full options config (all options + selected state)
  const loadFullOptionsConfig = (): { allOptions: string[]; selectedOptions: boolean[] } | null => {
    const saved = localStorage.getItem('tiktok-poll-fullOptions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  };
  
  // Track current setup configuration for preview
  // Start with saved config or null to let PollSetup component initialize via onChange
  const [setupConfig, setSetupConfig] = useState<{
    question: string;
    options: PollOption[];
    timer: number;
  } | null>(loadSavedSetupConfig);
  
  // Track external config updates from popup
  const [externalConfig, setExternalConfig] = useState<{
    question: string;
    options: PollOption[];
    timer: number;
  } | null>(loadSavedSetupConfig);

  // Full options config for persistence (all 12 options + selection state)
  const savedFullOptions = loadFullOptionsConfig();

  // Flag to skip first onChange if we have saved config (to prevent overwriting)
  const hasInitializedRef = useRef(false);
  const hasSavedConfig = useRef(!!loadSavedSetupConfig());

  // Use ref to track poll state for stable callback
  const pollStateRef = useRef(pollState);
  useEffect(() => {
    pollStateRef.current = pollState;
  }, [pollState]);

  // Register callback to receive config updates from popup
  useEffect(() => {
    onConfigUpdate((config: SetupConfig) => {
      console.log('[PollPage] Received config update from popup:', config);
      setExternalConfig(config);
      setSetupConfig(config);
    });
  }, [onConfigUpdate]);

  const handleSetupChange = useCallback((question: string, options: PollOption[], timer: number, allOptions?: string[], selectedOptions?: boolean[]) => {
    // Skip the first onChange if we have saved config (PollSetup sends default values on mount)
    if (hasSavedConfig.current && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      return;
    }
    hasInitializedRef.current = true;
    
    const newConfig = {
      question,
      options, // Options already have their original IDs preserved
      timer,
    };
    setSetupConfig(newConfig);
    // Save to localStorage for persistence across reloads
    const configResult = safeSetItem('tiktok-poll-setupConfig', newConfig);
    if (!configResult.success && configResult.error) {
      toast.warning(configResult.error);
    }
    // Save full options config (all options + selection state)
    if (allOptions && selectedOptions) {
      const optionsResult = safeSetItem('tiktok-poll-fullOptions', { allOptions, selectedOptions });
      if (!optionsResult.success && optionsResult.error) {
        toast.warning(optionsResult.error);
      }
    }
    // Clear external config when local changes are made
    setExternalConfig(null);
    // Always update the setup config ref, regardless of poll state
    // This ensures request-state always has the latest config
    // Pass fullOptions to keep popup in sync
    const fullOptions = allOptions && selectedOptions 
      ? { allOptions, selectedOptions } 
      : undefined;
    broadcastSetupConfig(newConfig, fullOptions);
  }, [broadcastSetupConfig]);

  // Handle unified chat from any platform
  const handleUnifiedChat = useCallback((msg: UnifiedChatMessage) => {
    if (pollState.isRunning) {
      // Convert unified message to chat message format for processVote
      const chatMsg: ChatMessage = {
        userId: msg.odlUserId,
        uniqueId: msg.username,
        nickname: msg.displayName,
        profilePictureUrl: msg.profilePictureUrl || '',
        followRole: 0,
        userBadges: msg.badges?.map(b => ({ type: b.id, name: b.name || b.id })) || [],
        isModerator: msg.isMod || false,
        isNewGifter: false,
        isSubscriber: msg.isSubscriber || false,
        topGifterRank: null,
        comment: msg.message,
        timestamp: msg.timestamp,
      };
      processVote(chatMsg, msg.platform);
    }
  }, [pollState.isRunning, processVote]);

  // Handle chat from TikTok (original format, for backwards compatibility)
  const handleTikTokChat = useCallback((msg: ChatMessage) => {
    if (pollState.isRunning) {
      processVote(msg, 'tiktok' as PlatformType);
    }
  }, [pollState.isRunning, processVote]);

  // Auto-reconnect handler when connection is lost
  const handleDisconnect = useCallback((platform: PlatformType) => {
    console.log(`[PollPage] ${platform} connection lost, autoReconnect:`, autoReconnectRef.current);
  }, []);

  // Auto-reconnect handler when socket reconnects after disconnection
  const handleSocketReconnect = useCallback(() => {
    console.log('[PollPage] Socket reconnected callback fired, autoReconnect:', autoReconnectRef.current);
    if (autoReconnectRef.current) {
      console.log('[PollPage] Setting pendingReconnect to true');
      setPendingReconnect(true);
    }
  }, []);

  const connection = useMultiPlatformConnection({
    onChat: handleUnifiedChat,
    onTikTokChat: handleTikTokChat,
    onDisconnect: handleDisconnect,
    onSocketReconnect: handleSocketReconnect,
  });

  // Handle pending reconnect when connection object is available
  useEffect(() => {
    if (pendingReconnect && autoReconnectRef.current) {
      console.log('[PollPage] Processing pending reconnect');
      setPendingReconnect(false);
      
      // Small delay to ensure everything is ready
      const timeoutId = setTimeout(() => {
        if (!autoReconnectRef.current) return;
        
        // Reconnect to TikTok if it was selected and we have a username
        if (selectedPlatforms.includes('tiktok' as PlatformType) && currentUsernameRef.current) {
          console.log('[PollPage] Attempting TikTok auto-reconnect to:', currentUsernameRef.current);
          connection.tiktok.connect(currentUsernameRef.current, { enableExtendedGiftInfo: false })
            .then(() => {
              toast.success(interpolate(t.toast.tiktokReconnected, { username: currentUsernameRef.current }));
            })
            .catch((error: unknown) => {
              console.error('[PollPage] TikTok auto-reconnect failed:', error);
            });
        }
        
        // Reconnect to Twitch if it was selected and we have a channel
        if (selectedPlatforms.includes('twitch' as PlatformType) && currentTwitchChannelRef.current) {
          console.log('[PollPage] Attempting Twitch auto-reconnect to:', currentTwitchChannelRef.current);
          connection.twitch.connect(currentTwitchChannelRef.current)
            .then(() => {
              toast.success(interpolate(t.toast.twitchReconnected, { channel: currentTwitchChannelRef.current }));
            })
            .catch((error: unknown) => {
              console.error('[PollPage] Twitch auto-reconnect failed:', error);
            });
        }
      }, 1500);

      return () => clearTimeout(timeoutId);
    }
  }, [pendingReconnect, connection, toast]);

  // Polling auto-reconnect: try every 10 seconds if disconnected and auto-reconnect is enabled
  useEffect(() => {
    if (!autoReconnect) return;
    if (connection.isAnyConnected) return;
    
    const tiktokSelected = selectedPlatforms.includes('tiktok' as PlatformType);
    const twitchSelected = selectedPlatforms.includes('twitch' as PlatformType);
    
    // Check if we have any credentials to reconnect with
    const hasTikTokCredentials = tiktokSelected && currentUsernameRef.current;
    const hasTwitchCredentials = twitchSelected && currentTwitchChannelRef.current;
    
    if (!hasTikTokCredentials && !hasTwitchCredentials) return;

    console.log('[PollPage] Starting auto-reconnect polling (every 10s)');
    
    // Try to reconnect immediately on first run
    const attemptReconnect = () => {
      if (!autoReconnectRef.current) return;
      
      // Reconnect TikTok if needed
      if (tiktokSelected && currentUsernameRef.current && !connection.tiktok.isConnected && connection.tiktok.status !== 'connecting') {
        console.log('[PollPage] Auto-reconnect attempt to TikTok:', currentUsernameRef.current);
        connection.tiktok.connect(currentUsernameRef.current, { enableExtendedGiftInfo: false })
          .then(() => {
            console.log('[PollPage] TikTok auto-reconnect successful!');
            toast.success(interpolate(t.toast.tiktokReconnected, { username: currentUsernameRef.current }));
          })
          .catch((error: unknown) => {
            console.log('[PollPage] TikTok auto-reconnect failed, will retry:', error);
          });
      }
      
      // Reconnect Twitch if needed
      if (twitchSelected && currentTwitchChannelRef.current && !connection.twitch.isConnected && connection.twitch.status !== 'connecting') {
        console.log('[PollPage] Auto-reconnect attempt to Twitch:', currentTwitchChannelRef.current);
        connection.twitch.connect(currentTwitchChannelRef.current)
          .then(() => {
            console.log('[PollPage] Twitch auto-reconnect successful!');
            toast.success(interpolate(t.toast.twitchReconnected, { channel: currentTwitchChannelRef.current }));
          })
          .catch((error: unknown) => {
            console.log('[PollPage] Twitch auto-reconnect failed, will retry:', error);
          });
      }
    };

    // First attempt after 3 seconds
    const initialTimeout = setTimeout(attemptReconnect, 3000);
    
    // Then retry every 10 seconds
    const intervalId = setInterval(attemptReconnect, 10000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, [autoReconnect, connection.isAnyConnected, connection.tiktok.isConnected, connection.twitch.isConnected, connection.tiktok.status, connection.twitch.status, selectedPlatforms, connection, toast]);

  // Keep connection ref updated for popup reconnect callback
  const connectionRef = useRef(connection);
  useEffect(() => {
    connectionRef.current = connection;
  }, [connection]);

  // Broadcast connection status to popup (connected if any platform is connected)
  useEffect(() => {
    setConnectionStatus(connection.isAnyConnected);
  }, [connection.isAnyConnected, setConnectionStatus]);

  // Handle TikTok connect
  const handleTikTokConnect = async (uniqueId: string) => {
    const result = safeSetItem('tiktok-poll-uniqueId', uniqueId);
    if (!result.success && result.error) {
      toast.warning(result.error);
    }
    
    try {
      await connection.tiktok.connect(uniqueId, { enableExtendedGiftInfo: false });
      toast.success(interpolate(t.toast.tiktokConnected, { username: uniqueId }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(interpolate(t.toast.errorConnectingTikTok, { error: errorMessage }));
    }
  };

  // Handle Twitch connect
  const handleTwitchConnect = async (channel: string) => {
    const result = safeSetItem('twitch-poll-channel', channel);
    if (!result.success && result.error) {
      toast.warning(result.error);
    }
    
    try {
      await connection.twitch.connect(channel);
      toast.success(interpolate(t.toast.twitchConnected, { channel }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(interpolate(t.toast.errorConnectingTwitch, { error: errorMessage }));
    }
  };

  // Handle platform selection change
  const handlePlatformChange = (platforms: PlatformType[]) => {
    setSelectedPlatforms(platforms);
    safeSetItem('poll-selectedPlatforms', platforms);
  };

  const handleAutoReconnectChange = (enabled: boolean) => {
    setAutoReconnect(enabled);
    localStorage.setItem('tiktok-poll-autoReconnect', String(enabled));
    if (enabled) {
      toast.success(t.connection.autoReconnectEnabled);
    }
  };

  // Register reconnect callback for popup - only once on mount
  useEffect(() => {
    onReconnect(() => {
      console.log('[PollPage] Reconnect requested from popup');
      
      // Reconnect TikTok if selected and has username
      if (selectedPlatforms.includes('tiktok' as PlatformType) && currentUsernameRef.current) {
        console.log('[PollPage] Reconnecting TikTok to:', currentUsernameRef.current);
        connectionRef.current.tiktok.connect(currentUsernameRef.current, { enableExtendedGiftInfo: false });
      }
      
      // Reconnect Twitch if selected and has channel
      if (selectedPlatforms.includes('twitch' as PlatformType) && currentTwitchChannelRef.current) {
        console.log('[PollPage] Reconnecting Twitch to:', currentTwitchChannelRef.current);
        connectionRef.current.twitch.connect(currentTwitchChannelRef.current);
      }
    });
  }, [onReconnect]);

  const handleStartPoll = (question: string, options: PollOption[], timer: number) => {
    startPoll(question, options, timer);
  };

  // Ensure setupConfig is available before rendering
  const currentSetupConfig = setupConfig || {
    question: DEFAULT_QUESTION,
    options: [
      { id: 1, text: 'Sim' },
      { id: 2, text: 'Não' },
    ],
    timer: POLL_TIMER.DEFAULT,
  };

  // Check if poll is active (has been configured)
  const isPollActive = pollState.question || pollState.options.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-[#e90048]">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🗳️ {t.poll.title}
          </h1>
          <p className="text-slate-400 text-lg">
            {t.poll.description}
          </p>
        </div>

        {/* Connection Section */}
        <div className={`card mb-6 border transition-all duration-300 ${
          connection.isAnyConnected 
            ? 'border-green-500/50 bg-green-500/5' 
            : 'border-slate-700/50'
        }`}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">🔗 {t.poll.connection}</h2>
              {/* Connection Status Indicator */}
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                connection.isAnyConnected 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  connection.isAnyConnected 
                    ? 'bg-green-400 animate-pulse' 
                    : 'bg-slate-500'
                }`} />
                {connection.isAnyConnected 
                  ? `${connection.connectedPlatforms.length} ${t.common.platforms}` 
                  : t.common.disconnected}
              </div>
            </div>
          </div>
          <MultiPlatformConnectionForm
            tiktok={{
              status: connection.tiktok.status,
              onConnect: handleTikTokConnect,
              onDisconnect: connection.tiktok.disconnect,
              username: currentUsername,
              onUsernameChange: setCurrentUsername,
              errorMessage: connection.tiktok.error,
            }}
            twitch={{
              status: connection.twitch.status,
              onConnect: handleTwitchConnect,
              onDisconnect: connection.twitch.disconnect,
              channel: currentTwitchChannel,
              onChannelChange: setCurrentTwitchChannel,
              errorMessage: connection.twitch.error,
            }}
            selectedPlatforms={selectedPlatforms}
            onPlatformChange={handlePlatformChange}
            autoReconnect={autoReconnect}
            onAutoReconnectChange={handleAutoReconnectChange}
          />
        </div>

        {/* Configuration Section */}
        <div className={`card mb-6 border border-slate-700/50 transition-all duration-300 ${!connection.isAnyConnected ? 'blur-sm opacity-50 pointer-events-none' : ''}`}>
          <h2 className="text-xl font-bold text-white mb-4 pb-4 border-b border-slate-700/50">
            ⚙️ {t.poll.configuration}
          </h2>
          <PollSetup
            onStart={handleStartPoll}
            onChange={handleSetupChange}
            disabled={!connection.isAnyConnected || pollState.isRunning}
            showStartButton={false}
            externalConfig={externalConfig}
            initialQuestion={loadSavedSetupConfig()?.question}
            initialOptions={savedFullOptions?.allOptions}
            initialSelectedOptions={savedFullOptions?.selectedOptions}
            initialTimer={loadSavedSetupConfig()?.timer}
          />
        </div>

        {/* Controls Section - Centered */}
        <div className={`card mb-6 bg-purple-500/10 border-2 border-purple-500/30 transition-all duration-300 ${!connection.isAnyConnected ? 'blur-sm opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button 
              onClick={() => handleStartPoll(
                currentSetupConfig.question,
                currentSetupConfig.options,
                currentSetupConfig.timer
              )}
              disabled={!connection.isAnyConnected || pollState.isRunning}
              className="px-8 py-3 text-lg font-bold rounded-xl bg-gradient-to-r from-green-400 to-blue-500 text-white hover:from-green-500 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ▶️ {t.poll.startPoll}
            </button>
            <button 
              onClick={stopPoll}
              disabled={!pollState.isRunning}
              className="px-8 py-3 text-lg font-bold rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ⏹️ {t.poll.stopPoll}
            </button>
            <button 
              onClick={resetPoll}
              className="btn-secondary px-8 py-3 text-lg"
            >
              🔄 {t.poll.resetPoll}
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className={`card mb-6 border border-slate-700/50 transition-all duration-300 ${!connection.isAnyConnected ? 'blur-sm opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700/50">
            <h2 className="text-xl font-bold text-white">📊 {t.poll.results}</h2>
            <button 
              onClick={openResultsPopup}
              className="btn-secondary text-sm"
              title={t.poll.popoutTitle}
            >
              🖥️ {t.poll.popout}
            </button>
          </div>
          
          {isPollActive ? (
            <PollResults
              pollState={pollState}
              getPercentage={getPercentage}
              getTotalVotes={getTotalVotes}
            />
          ) : (
            <PollResults
              pollState={{
                ...pollState,
                question: currentSetupConfig.question,
                options: currentSetupConfig.options,
                votes: currentSetupConfig.options.reduce((acc, opt) => ({ ...acc, [opt.id]: 0 }), {}),
                timer: currentSetupConfig.timer
              }}
              getPercentage={() => 0}
              getTotalVotes={() => 0}
            />
          )}
        </div>

        {/* Vote Log Section */}
        <div className={`card border border-slate-700/50 transition-all duration-300 ${!connection.isAnyConnected ? 'blur-sm opacity-50 pointer-events-none' : ''}`}>
          <h2 className="text-xl font-bold text-white mb-4 pb-4 border-b border-slate-700/50">
            📝 {t.poll.voteLog}
          </h2>
          <VoteLog 
            entries={voteLog} 
            maxHeight="300px"
            onClear={clearVoteLog}
          />
        </div>
      </div>
    </div>
  );
}
