import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { PollState, PollOption, SerializablePollState, SetupConfig } from '@/types';
import { PollSetup } from '@/components/poll/PollSetup';
import { PollResults } from '@/components/poll/PollResults';
import { PollControlButtons } from '@/components/poll/PollControlButtons';
import { DisconnectedModal } from '@/components/poll/DisconnectedModal';
import { AnimatedBorder } from '@/components/poll/AnimatedBorder';
import { SpotlightTrophyCelebration } from '@/components/poll/SpotlightTrophyCelebration';
import { CountdownOverlay } from '@/components/poll/CountdownOverlay';
import { LoadScreen } from '@/components';
import { usePollDisplay } from '@/hooks/usePollDisplay';
import { usePollKeyboardShortcuts } from '@/hooks/usePollKeyboardShortcuts';
import { useLeaderElection } from '@/hooks/useLeaderElection';
import { useBackgroundKeepAlive } from '@/hooks/useBackgroundKeepAlive';
import { POLL_TIMER, DEFAULT_QUESTION, DEFAULT_POLL_OPTIONS, STORAGE_KEYS } from '@/constants';
import { useLanguage } from '@/i18n';

const initialPollState: PollState = {
  isRunning: false,
  finished: false,
  question: '',
  options: [],
  votes: {},
  voters: new Set(),
  timer: POLL_TIMER.DEFAULT,
  timeLeft: 0,
  countdown: undefined,
};

// Read connection status from localStorage (fallback for when BroadcastChannel is throttled)
const getConnectionStatusFromStorage = (): { isConnected: boolean; timestamp: number } | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CONNECTION_STATUS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
};
// Load full options config from localStorage (all options + selected state)
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

const LEADER_KEY = 'poll-results-leader';

export function PollResultsPage () {
  const { t } = useLanguage();
  const [showLoadScreen, setShowLoadScreen] = useState(true);
  const [pollState, setPollState] = useState<PollState>(initialPollState);
  const [setupConfig, setSetupConfig] = useState<SetupConfig | null>(loadSavedSetupConfig);
  const [isWaiting, setIsWaiting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isAutoReconnectEnabled, setIsAutoReconnectEnabled] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.AUTO_RECONNECT) === 'true';
  });
  const [channelRef, setChannelRef] = useState<BroadcastChannel | null>(null);

  // Keep animations running even when window is in background (for screen sharing)
  useBackgroundKeepAlive(true);

  // Leader election - only the leader tab polls for updates
  const { isLeader } = useLeaderElection({
    leaderKey: LEADER_KEY,
    onAutoReconnectChange: setIsAutoReconnectEnabled,
  });

  // Full options for the PollSetup component - use state so it can be updated from broadcast
  const [fullOptionsConfig, setFullOptionsConfig] = useState<{
    allOptions: string[];
    selectedOptions: boolean[];
  } | null>(loadFullOptionsConfig);

  // Check if countdown is active
  const isCountingDown = pollState.countdown !== undefined;

  // Determine if poll is actively running (for showing real vs preview data)
  const isPollActive = pollState.isRunning || pollState.finished;

  // Helper to calculate total votes
  const getTotalVotes = useCallback(() => {
    return Object.values(pollState.votes).reduce((sum, count) => sum + count, 0);
  }, [pollState.votes]);

  // Helper to calculate percentage for an option
  const getPercentage = useCallback(
    (optionId: number) => {
      const total = getTotalVotes();
      if (total === 0) return 0;
      return ((pollState.votes[optionId] || 0) / total) * 100;
    },
    [pollState.votes, getTotalVotes]
  );

  // Build the effective poll state for PollResults component
  // When poll is active, use real pollState; otherwise use preview data from setupConfig
  const effectivePollState = useMemo<PollState>(() => {
    if (isPollActive) {
      return pollState;
    }
    // Preview mode: use setupConfig values
    const previewOptions = setupConfig?.options && setupConfig.options.length > 0
      ? setupConfig.options
      : DEFAULT_POLL_OPTIONS;
    return {
      ...pollState,
      question: setupConfig?.question || DEFAULT_QUESTION,
      options: previewOptions,
      votes: previewOptions.reduce((acc, opt) => ({ ...acc, [opt.id]: 0 }), {} as Record<number, number>),
      timer: setupConfig?.timer ?? POLL_TIMER.DEFAULT,
    };
  }, [isPollActive, pollState, setupConfig]);

  // Use usePollDisplay for celebration state (renders overlays at container level)
  const {
    winnerText,
    showCelebration,
    handleCelebrationComplete,
  } = usePollDisplay({ pollState: effectivePollState });

  // Track if we've received connection status
  const hasReceivedConnectionStatus = useRef(false);

  // Initialize BroadcastChannel once on mount
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

    try {
      channel = new BroadcastChannel('poll-results-channel');
      setChannelRef(channel);

      channel.onmessage = (event) => {
        const data = event.data;

        if (data.type === 'poll-update') {
          const state = data.state as SerializablePollState;
          setPollState({
            isRunning: state.isRunning,
            finished: state.finished,
            question: state.question,
            options: state.options,
            votes: state.votes,
            voters: new Set(state.votersArray || []),
            timer: state.timer,
            timeLeft: state.timeLeft,
            countdown: state.countdown,
          });
          setIsWaiting(false);
        } else if (data.type === 'setup-config') {
          // Always update setupConfig immediately - display logic handles what to show
          const config = data.config as SetupConfig;
          setSetupConfig(config);
          // Also update fullOptionsConfig if provided
          if (data.fullOptions) {
            setFullOptionsConfig(data.fullOptions);
          }
          setIsWaiting(false);
        } else if (data.type === 'connection-status') {
          hasReceivedConnectionStatus.current = true;
          setIsConnected(data.isConnected);
          // Reset reconnecting state when connection status changes
          if (data.isConnected) {
            setIsReconnecting(false);
          }
        }
      };

      // Send initial request-state to get current status
      channel.postMessage({ type: 'request-state' });

      // Retry after a short delay in case the main app wasn't ready
      retryTimeout = setTimeout(() => {
        if (!hasReceivedConnectionStatus.current && channel) {
          channel.postMessage({ type: 'request-state' });
        }
      }, 500);

      return () => {
        if (retryTimeout) clearTimeout(retryTimeout);
        channel?.close();
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e);
    }

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      channel?.close();
    };
  }, []);

  // Set up polling interval only when this tab is the leader
  useEffect(() => {
    if (!isLeader || !channelRef) return;

    // Poll for updates every 2s as a backup for pushed updates
    // Primary updates come via broadcast in real-time, this only catches edge cases
    const pollInterval = setInterval(() => {
      if (channelRef) {
        channelRef.postMessage({ type: 'request-state' });
      }
    }, 2000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [isLeader, channelRef]);

  // Fallback: Check localStorage for connection status
  // This handles browser throttling scenarios where BroadcastChannel messages don't arrive
  useEffect(() => {
    // Check localStorage every 5 seconds as a fallback
    const checkLocalStorage = () => {
      const storedStatus = getConnectionStatusFromStorage();
      if (storedStatus) {
        // Only use localStorage if it's recent (within 30 seconds)
        const isRecent = Date.now() - storedStatus.timestamp < 30000;
        if (isRecent && storedStatus.isConnected !== isConnected) {
          console.log('[PollResultsPage] Using localStorage fallback for connection status:', storedStatus.isConnected);
          setIsConnected(storedStatus.isConnected);
          if (storedStatus.isConnected) {
            setIsReconnecting(false);
          }
        }
      }
    };

    // Listen for storage events (triggered when main window updates localStorage)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.CONNECTION_STATUS) {
        checkLocalStorage();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Check immediately on mount
    checkLocalStorage();

    // Then poll every 5 seconds
    const fallbackInterval = setInterval(checkLocalStorage, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(fallbackInterval);
    };
  }, [isConnected]);

  const sendCommand = useCallback(
    (command: 'start' | 'stop' | 'reset') => {
      if (!channelRef) return;
      channelRef.postMessage({ type: 'poll-command', command });
    },
    [channelRef]
  );

  // Keyboard shortcuts for poll control
  usePollKeyboardShortcuts({
    onStart: () => sendCommand('start'),
    onStop: () => sendCommand('stop'),
    onReset: () => sendCommand('reset'),
    isConnected,
    isRunning: pollState.isRunning,
    isCountingDown,
  });

  const sendReconnect = () => {
    console.log('[PollResultsPage] Sending reconnect message, channelRef:', !!channelRef);
    if (!channelRef) {
      console.log('[PollResultsPage] No channelRef, cannot send reconnect');
      return;
    }
    setIsReconnecting(true);
    channelRef.postMessage({ type: 'reconnect' });
    console.log('[PollResultsPage] Reconnect message sent');

    // Reset reconnecting state after timeout if still not connected
    setTimeout(() => {
      setIsReconnecting(false);
    }, 10000);
  };

  // Broadcast config changes back to PollPage (used by PollSetup onChange)
  const handleSetupChange = useCallback(
    (
      question: string,
      options: PollOption[],
      timer: number,
      allOptions?: string[],
      selectedOptions?: boolean[],
      showStatusBar?: boolean,
      showBorder?: boolean,
      resultsFontSize?: number
    ) => {
      if (!channelRef) return;
      const newFullOptions = allOptions && selectedOptions 
        ? { allOptions, selectedOptions } 
        : undefined;
      const newConfig = { question, options, timer, showStatusBar, showBorder, resultsFontSize };
      channelRef.postMessage({
        type: 'config-update',
        config: newConfig,
        fullOptions: newFullOptions,
      });
      // Also update local setupConfig
      setSetupConfig(newConfig);
      // Save to localStorage for persistence
      localStorage.setItem(STORAGE_KEYS.SETUP_CONFIG, JSON.stringify(newConfig));
      if (newFullOptions) {
        setFullOptionsConfig(newFullOptions);
        localStorage.setItem(
          STORAGE_KEYS.FULL_OPTIONS,
          JSON.stringify(newFullOptions)
        );
      }
    },
    [channelRef]
  );

  // Inline edit handler for question (from PollQuestion double-click)
  const handleQuestionInlineEdit = useCallback(
    (newQuestion: string) => {
      if (!setupConfig) return;
      const newConfig = { ...setupConfig, question: newQuestion };
      setSetupConfig(newConfig);
      localStorage.setItem(STORAGE_KEYS.SETUP_CONFIG, JSON.stringify(newConfig));
      if (channelRef) {
        channelRef.postMessage({
          type: 'config-update',
          config: newConfig,
          fullOptions: fullOptionsConfig || undefined,
        });
      }
    },
    [channelRef, setupConfig, fullOptionsConfig]
  );

  // Inline edit handler for option text (from PollOptionCard double-click)
  const handleOptionInlineEdit = useCallback(
    (optionId: number, newText: string) => {
      if (!setupConfig) return;

      // Update options in setupConfig
      const newOptions = setupConfig.options.map((opt) =>
        opt.id === optionId ? { ...opt, text: newText } : opt
      );
      const newConfig = { ...setupConfig, options: newOptions };
      setSetupConfig(newConfig);
      localStorage.setItem(STORAGE_KEYS.SETUP_CONFIG, JSON.stringify(newConfig));

      // Also update fullOptionsConfig if available
      if (fullOptionsConfig) {
        // Find the index in allOptions that corresponds to this option ID
        // Option IDs are 1-based, and correspond to position in allOptions
        const optionIndex = optionId - 1;
        if (optionIndex >= 0 && optionIndex < fullOptionsConfig.allOptions.length) {
          const newAllOptions = [...fullOptionsConfig.allOptions];
          newAllOptions[optionIndex] = newText;
          const newFullConfig = { ...fullOptionsConfig, allOptions: newAllOptions };
          setFullOptionsConfig(newFullConfig);
          localStorage.setItem(STORAGE_KEYS.FULL_OPTIONS, JSON.stringify(newFullConfig));
        }
      }

      if (channelRef) {
        channelRef.postMessage({
          type: 'config-update',
          config: newConfig,
          fullOptions: fullOptionsConfig ? {
            ...fullOptionsConfig,
            allOptions: fullOptionsConfig.allOptions.map((text, idx) =>
              idx === optionId - 1 ? newText : text
            ),
          } : undefined,
        });
      }
    },
    [channelRef, setupConfig, fullOptionsConfig]
  );

  if (isWaiting && !setupConfig && pollState.options.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-[#e90048] flex flex-col p-5">
        <div className="text-center mb-5">
          <h1 className="text-4xl font-bold text-white">{t.pollResults.title}</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <div className="text-8xl mb-4 animate-spin">🔄</div>
            <div className="text-3xl">{t.pollResults.waitingForData}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {showLoadScreen && <LoadScreen onComplete={() => setShowLoadScreen(false)} />}
      <div className="min-h-screen w-full bg-poll-gradient flex flex-col p-5 relative">
        {/* Disconnected Modal with Blur Background */}
        {!isConnected && (
          <DisconnectedModal
            isReconnecting={isReconnecting}
            isAutoReconnectEnabled={isAutoReconnectEnabled}
            onReconnect={sendReconnect}
          />
        )}

        <div className="flex-1 flex flex-col gap-4">
          {/* Setup Section - Above Results */}
          <div className={`p-4 bg-slate-800/50 rounded-xl border border-tiktok-cyan/30 ${pollState.isRunning || isCountingDown ? 'cursor-not-allowed [&_*]:cursor-not-allowed' : ''}`}>
            <PollSetup
              onStart={() => { }} // Not used - we have separate control buttons
              onChange={handleSetupChange}
              disabled={pollState.isRunning || isCountingDown}
              showStartButton={false}
              hideStatusBarToggle={true}
              externalConfig={setupConfig}
              externalFullOptions={fullOptionsConfig}
              initialQuestion={setupConfig?.question}
              initialOptions={fullOptionsConfig?.allOptions}
              initialSelectedOptions={fullOptionsConfig?.selectedOptions}
              initialTimer={setupConfig?.timer}
              initialShowBorder={setupConfig?.showBorder}
              initialResultsFontSize={setupConfig?.resultsFontSize}
            />
          </div>

          {/* Control Buttons */}
          <PollControlButtons
            onStart={() => sendCommand('start')}
            onStop={() => sendCommand('stop')}
            onReset={() => sendCommand('reset')}
            isConnected={isConnected}
            isRunning={pollState.isRunning}
            isCountingDown={isCountingDown}
          />

          {/* Results Section with Animated Border */}
          <AnimatedBorder visible={setupConfig?.showBorder ?? false} borderWidth={6} className="flex-1">
            <div className="flex-1 relative p-4 bg-slate-900 rounded-xl min-h-[450px]">
              {/* Spotlight + Trophy Celebration - rendered at container level for full coverage */}
              {showCelebration && (
                <SpotlightTrophyCelebration
                  onComplete={handleCelebrationComplete}
                  winnerText={winnerText}
                />
              )}

              {/* Countdown Overlay */}
              {isCountingDown && <CountdownOverlay countdown={pollState.countdown!} />}

              <PollResults
                pollState={effectivePollState}
                getPercentage={isPollActive ? getPercentage : () => 0}
                getTotalVotes={isPollActive ? getTotalVotes : () => 0}
                showStatusBar={false}
                size="large"
                fontSize={setupConfig?.resultsFontSize}
                editable={true}
                onQuestionChange={handleQuestionInlineEdit}
                onOptionTextChange={handleOptionInlineEdit}
                hideOverlays={true}
              />
            </div>
          </AnimatedBorder>
        </div>
      </div>
    </>
  );
}
