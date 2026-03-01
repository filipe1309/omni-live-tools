import { useCallback, useState, useEffect, useRef } from 'react';
import { useConnectionContext, usePollContext, useToast, useBackgroundKeepAlive } from '@/hooks';
import { useLanguage, interpolate } from '@/i18n';
import { PollSetup, PollResults, VoteLog, PollControlButtons, AnimatedBorder } from '@/components';
import type { PollOption, PlatformType, FullOptionsConfig, SetupConfig } from '@/types';
import { POLL_TIMER, DEFAULT_QUESTION, POLL_SHORTCUTS, matchesShortcut, STORAGE_KEYS, POLL_FONT_SIZE } from '@/constants';
import { safeSetItem } from '@/utils';

export function PollPage () {
  const { pollState, voteLog, startPoll, stopPoll, resetPoll, clearVoteLog, getTotalVotes, getPercentage, openResultsPopup, broadcastSetupConfig, setConnectionStatus, onConfigUpdate, onReconnect } = usePollContext();
  const toast = useToast();
  const { t } = useLanguage();

  // Keep animations and timers running even when window is in background (for screen sharing)
  useBackgroundKeepAlive(pollState.isRunning);

  // Use shared connection context
  const {
    tiktok,
    twitch,
    isAnyConnected,
    selectedPlatforms,
    autoReconnect,
    registerDisconnectHandler,
    registerSocketReconnectHandler,
  } = useConnectionContext();

  // Keep ref for stable handler callbacks
  const autoReconnectRef = useRef(autoReconnect);
  useEffect(() => {
    autoReconnectRef.current = autoReconnect;
  }, [autoReconnect]);

  // Pending reconnect flag - set to true when we need to reconnect after socket comes back
  const [pendingReconnect, setPendingReconnect] = useState(false);

  // Load saved setup config from localStorage
  const loadSavedSetupConfig = (): SetupConfig | null => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETUP_CONFIG);
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
    const saved = localStorage.getItem(STORAGE_KEYS.FULL_OPTIONS);
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
  const [setupConfig, setSetupConfig] = useState<SetupConfig | null>(loadSavedSetupConfig);

  // Track external config updates from popup
  const [externalConfig, setExternalConfig] = useState<SetupConfig | null>(loadSavedSetupConfig);

  // Full options config for persistence (all 4 options + selection state)
  const savedFullOptions = loadFullOptionsConfig();

  // Flag to skip first onChange if we have saved config (to prevent overwriting)
  const hasInitializedRef = useRef(false);
  const hasSavedConfig = useRef(!!loadSavedSetupConfig());

  // Register callback to receive config updates from popup
  useEffect(() => {
    onConfigUpdate((config: SetupConfig, fullOptions?: FullOptionsConfig) => {
      console.log('[PollPage] Received config update from popup:', config, 'fullOptions:', fullOptions);
      setExternalConfig(config);
      setSetupConfig(config);
      // Also save to localStorage so the data persists
      safeSetItem(STORAGE_KEYS.SETUP_CONFIG, config);
      if (fullOptions) {
        safeSetItem(STORAGE_KEYS.FULL_OPTIONS, fullOptions);
      }
    });
  }, [onConfigUpdate]);

  const handleSetupChange = useCallback((question: string, options: PollOption[], timer: number, allOptions?: string[], selectedOptions?: boolean[], showStatusBar?: boolean, showBorder?: boolean, resultsFontSize?: number) => {
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
      showStatusBar: showStatusBar ?? true,
      showBorder: showBorder ?? false,
      resultsFontSize: resultsFontSize ?? POLL_FONT_SIZE.DEFAULT,
    };
    setSetupConfig(newConfig);
    // Save to localStorage for persistence across reloads
    const configResult = safeSetItem(STORAGE_KEYS.SETUP_CONFIG, newConfig);
    if (!configResult.success && configResult.error) {
      toast.warning(configResult.error);
    }
    // Save full options config (all options + selection state)
    if (allOptions && selectedOptions) {
      const optionsResult = safeSetItem(STORAGE_KEYS.FULL_OPTIONS, { allOptions, selectedOptions });
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

  // Inline edit handler for question (from PollResults double-click)
  const handleQuestionInlineEdit = useCallback(
    (newQuestion: string) => {
      if (!setupConfig) return;
      const newConfig = { ...setupConfig, question: newQuestion };
      setSetupConfig(newConfig);
      setExternalConfig(newConfig);
      const configResult = safeSetItem(STORAGE_KEYS.SETUP_CONFIG, newConfig);
      if (!configResult.success && configResult.error) {
        toast.warning(configResult.error);
      }
      broadcastSetupConfig(newConfig);
    },
    [setupConfig, broadcastSetupConfig, toast]
  );

  // Inline edit handler for option text (from PollResults double-click)
  const handleOptionInlineEdit = useCallback(
    (optionId: number, newText: string) => {
      if (!setupConfig) return;

      // Update options in setupConfig
      const newOptions = setupConfig.options.map((opt) =>
        opt.id === optionId ? { ...opt, text: newText } : opt
      );
      const newConfig = { ...setupConfig, options: newOptions };
      setSetupConfig(newConfig);
      setExternalConfig(newConfig);
      const configResult = safeSetItem(STORAGE_KEYS.SETUP_CONFIG, newConfig);
      if (!configResult.success && configResult.error) {
        toast.warning(configResult.error);
      }

      // Also update fullOptionsConfig in localStorage
      const currentFullOptions = loadFullOptionsConfig();
      if (currentFullOptions) {
        const optionIndex = optionId - 1;
        if (optionIndex >= 0 && optionIndex < currentFullOptions.allOptions.length) {
          const newAllOptions = [...currentFullOptions.allOptions];
          newAllOptions[optionIndex] = newText;
          const newFullConfig = { ...currentFullOptions, allOptions: newAllOptions };
          const optionsResult = safeSetItem(STORAGE_KEYS.FULL_OPTIONS, newFullConfig);
          if (!optionsResult.success && optionsResult.error) {
            toast.warning(optionsResult.error);
          }
          broadcastSetupConfig(newConfig, newFullConfig);
        } else {
          broadcastSetupConfig(newConfig);
        }
      } else {
        broadcastSetupConfig(newConfig);
      }
    },
    [setupConfig, broadcastSetupConfig, toast]
  );

  // Register event handlers from shared context
  useEffect(() => {
    const unsubscribeDisconnect = registerDisconnectHandler((platform: PlatformType) => {
      console.log(`[PollPage] ${platform} connection lost, autoReconnect:`, autoReconnectRef.current);
    });
    const unsubscribeSocketReconnect = registerSocketReconnectHandler(() => {
      console.log('[PollPage] Socket reconnected callback fired, autoReconnect:', autoReconnectRef.current);
      if (autoReconnectRef.current) {
        console.log('[PollPage] Setting pendingReconnect to true');
        setPendingReconnect(true);
      }
    });

    return () => {
      unsubscribeDisconnect();
      unsubscribeSocketReconnect();
    };
  }, [registerDisconnectHandler, registerSocketReconnectHandler]);

  // Handle pending reconnect when connection object is available
  useEffect(() => {
    if (pendingReconnect && autoReconnectRef.current) {
      console.log('[PollPage] Processing pending reconnect');
      setPendingReconnect(false);

      // Small delay to ensure everything is ready
      const timeoutId = setTimeout(() => {
        if (!autoReconnectRef.current) return;

        // Reconnect to TikTok if it was selected and we have a username
        if (selectedPlatforms.includes('tiktok' as PlatformType) && tiktok.username) {
          console.log('[PollPage] Attempting TikTok auto-reconnect to:', tiktok.username);
          tiktok.connect(tiktok.username)
            .then(() => {
              toast.success(interpolate(t.toast.tiktokReconnected, { username: tiktok.username }));
            })
            .catch((error: unknown) => {
              console.error('[PollPage] TikTok auto-reconnect failed:', error);
            });
        }

        // Reconnect to Twitch if it was selected and we have a channel
        if (selectedPlatforms.includes('twitch' as PlatformType) && twitch.channelName) {
          console.log('[PollPage] Attempting Twitch auto-reconnect to:', twitch.channelName);
          twitch.connect(twitch.channelName)
            .then(() => {
              toast.success(interpolate(t.toast.twitchReconnected, { channel: twitch.channelName }));
            })
            .catch((error: unknown) => {
              console.error('[PollPage] Twitch auto-reconnect failed:', error);
            });
        }
      }, 1500);

      return () => clearTimeout(timeoutId);
    }
  }, [pendingReconnect, tiktok, twitch, selectedPlatforms, toast, t]);

  // Broadcast connection status to popup (connected if any platform is connected)
  useEffect(() => {
    setConnectionStatus(isAnyConnected);
  }, [isAnyConnected, setConnectionStatus]);

  // Register reconnect callback for popup - only once on mount
  useEffect(() => {
    onReconnect(() => {
      console.log('[PollPage] Reconnect requested from popup');

      // Reconnect TikTok if selected and has username
      if (selectedPlatforms.includes('tiktok' as PlatformType) && tiktok.username) {
        console.log('[PollPage] Reconnecting TikTok to:', tiktok.username);
        tiktok.connect(tiktok.username);
      }

      // Reconnect Twitch if selected and has channel
      if (selectedPlatforms.includes('twitch' as PlatformType) && twitch.channelName) {
        console.log('[PollPage] Reconnecting Twitch to:', twitch.channelName);
        twitch.connect(twitch.channelName);
      }
    });
  }, [onReconnect, selectedPlatforms, tiktok, twitch]);

  const handleStartPoll = useCallback((question: string, options: PollOption[], timer: number) => {
    startPoll(question, options, timer);
  }, [startPoll]);

  // Ensure setupConfig is available before rendering
  const currentSetupConfig = setupConfig || {
    question: DEFAULT_QUESTION,
    options: [
      { id: 1, text: 'Sim' },
      { id: 2, text: 'Não' },
    ],
    timer: POLL_TIMER.DEFAULT,
    showStatusBar: true,
    showBorder: false,
  };

  // Keyboard shortcuts for poll control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Start: configured shortcut (e.g., Space, Enter, Ctrl+M)
      if (matchesShortcut(e, POLL_SHORTCUTS.START)) {
        e.preventDefault();
        if (isAnyConnected && !pollState.isRunning && pollState.countdown === undefined) {
          handleStartPoll(currentSetupConfig.question, currentSetupConfig.options, currentSetupConfig.timer);
        }
        return;
      }

      // Stop: configured shortcut (e.g., Escape)
      if (matchesShortcut(e, POLL_SHORTCUTS.STOP)) {
        if (pollState.isRunning || pollState.countdown !== undefined) {
          stopPoll();
        }
        return;
      }

      // Reset: configured shortcut (e.g., R, Ctrl+.)
      if (matchesShortcut(e, POLL_SHORTCUTS.RESET)) {
        if (!pollState.isRunning) {
          resetPoll();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnyConnected, pollState.isRunning, pollState.countdown, currentSetupConfig, stopPoll, resetPoll, handleStartPoll]);

  // Check if poll is active (has been configured)
  const isPollActive = pollState.question || pollState.options.length > 0;

  return (
    <div className="min-h-screen w-full bg-poll-gradient">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-white mb-1">
            🗳️ {t.poll.title}
          </h1>
          <p className="text-slate-400 text-base">
            {t.poll.description}
          </p>
        </div>

        {/* Configuration Section */}
        <div className={`card mb-3 border border-slate-700/50 transition-all duration-300 ${!isAnyConnected ? 'blur-sm opacity-50 pointer-events-none' : ''} ${pollState.isRunning || pollState.countdown !== undefined ? 'cursor-not-allowed [&_*]:cursor-not-allowed' : ''}`}>
          <h2 className="text-lg font-bold text-white mb-2 pb-2 border-b border-slate-700/50">
            ⚙️ {t.poll.configuration}
          </h2>
          <PollSetup
            onStart={handleStartPoll}
            onChange={handleSetupChange}
            disabled={!isAnyConnected || pollState.isRunning || pollState.countdown !== undefined}
            showStartButton={false}
            externalConfig={externalConfig}
            initialQuestion={loadSavedSetupConfig()?.question}
            initialOptions={savedFullOptions?.allOptions}
            initialSelectedOptions={savedFullOptions?.selectedOptions}
            initialTimer={loadSavedSetupConfig()?.timer}
            initialShowStatusBar={loadSavedSetupConfig()?.showStatusBar}
            initialShowBorder={loadSavedSetupConfig()?.showBorder}
            initialResultsFontSize={loadSavedSetupConfig()?.resultsFontSize}
          />
        </div>

        {/* Controls Section - Centered */}
        <div className={`card mb-3 transition-all duration-300 ${!isAnyConnected ? 'blur-sm opacity-50 pointer-events-none' : ''}`}>
          <PollControlButtons
            onStart={() => handleStartPoll(
              currentSetupConfig.question,
              currentSetupConfig.options,
              currentSetupConfig.timer
            )}
            onStop={stopPoll}
            onReset={resetPoll}
            isConnected={isAnyConnected}
            isRunning={pollState.isRunning}
            isCountingDown={pollState.countdown !== undefined}
          />
        </div>

        {/* Results Section */}
        <div className={`card mb-3 border border-slate-700/50 transition-all duration-300 ${!isAnyConnected ? 'blur-sm opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-700/50">
            <h2 className="text-lg font-bold text-white">📊 {t.poll.results}</h2>
            <button
              onClick={openResultsPopup}
              className="btn-secondary text-sm"
              title={t.poll.popoutTitle}
            >
              🖥️ {t.poll.popout}
            </button>
          </div>

          <AnimatedBorder visible={currentSetupConfig.showBorder ?? false} borderWidth={4}>
            <div className={currentSetupConfig.showBorder ? 'p-3 bg-slate-900 rounded-xl' : ''}>
              {isPollActive ? (
                <PollResults
                  pollState={pollState}
                  getPercentage={getPercentage}
                  getTotalVotes={getTotalVotes}
                  showStatusBar={currentSetupConfig.showStatusBar ?? true}
                  size="large"
                  fontSize={currentSetupConfig.resultsFontSize}
                  editable={true}
                  onQuestionChange={handleQuestionInlineEdit}
                  onOptionTextChange={handleOptionInlineEdit}
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
                  showStatusBar={currentSetupConfig.showStatusBar ?? true}
                  size="large"
                  fontSize={currentSetupConfig.resultsFontSize}
                  editable={true}
                  onQuestionChange={handleQuestionInlineEdit}
                  onOptionTextChange={handleOptionInlineEdit}
                />
              )}
            </div>
          </AnimatedBorder>
        </div>

        {/* Vote Log Section */}
        <div className={`card border border-slate-700/50 transition-all duration-300 ${!isAnyConnected ? 'blur-sm opacity-50 pointer-events-none' : ''}`}>
          <h2 className="text-lg font-bold text-white mb-2 pb-2 border-b border-slate-700/50">
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
