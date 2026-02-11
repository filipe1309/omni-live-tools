import { useState, useEffect, useCallback, useMemo } from 'react';
import type { PollState, PollOption } from '@/types';
import type { SerializablePollState, SetupConfig } from '@/hooks/usePoll';
import { PollSetup } from '@/components/poll/PollSetup';
import { SpotlightTrophyCelebration } from '@/components/poll/SpotlightTrophyCelebration';
import { CountdownOverlay } from '@/components/poll/CountdownOverlay';
import { PollQuestion } from '@/components/poll/PollQuestion';
import { PollOptionCard } from '@/components/poll/PollOptionCard';
import { PollControlButtons } from '@/components/poll/PollControlButtons';
import { usePollDisplay } from '@/hooks/usePollDisplay';
import { POLL_TIMER, DEFAULT_QUESTION, POLL_SHORTCUTS, matchesShortcut } from '@/constants';
import { useLanguage } from '@/i18n';

const DEFAULT_OPTIONS: PollOption[] = [
  { id: 1, text: 'Sim' },
  { id: 2, text: 'Não' },
];

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

// Load full options config from localStorage (all options + selected state)
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

// Generate unique tab ID
const TAB_ID = `poll-results-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const LEADER_KEY = 'poll-results-leader';
const LEADER_HEARTBEAT_INTERVAL = 2000;
const LEADER_TIMEOUT = 5000;

export function PollResultsPage () {
  const { t } = useLanguage();
  const [pollState, setPollState] = useState<PollState>(initialPollState);
  const [setupConfig, setSetupConfig] = useState<SetupConfig | null>(loadSavedSetupConfig);
  const [isWaiting, setIsWaiting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isAutoReconnectEnabled, setIsAutoReconnectEnabled] = useState(() => {
    return localStorage.getItem('tiktok-poll-autoReconnect') === 'true';
  });
  const [channelRef, setChannelRef] = useState<BroadcastChannel | null>(null);
  const [isLeader, setIsLeader] = useState(false);

  // Full options for the PollSetup component - use state so it can be updated from broadcast
  const [fullOptionsConfig, setFullOptionsConfig] = useState<{
    allOptions: string[];
    selectedOptions: boolean[];
  } | null>(loadFullOptionsConfig);

  // Serialize options to string for stable comparison in useMemo
  const pollOptionsKey = JSON.stringify(pollState.options);
  const setupOptionsKey = JSON.stringify(setupConfig?.options || []);

  // Use pollState.options ONLY when poll is actively running, otherwise use setupConfig for live preview
  const displayOptions = useMemo<PollOption[]>(() => {
    if (pollState.isRunning && pollState.options.length > 0) {
      return pollState.options;
    }
    if (setupConfig?.options && setupConfig.options.length > 0) {
      return setupConfig.options;
    }
    return DEFAULT_OPTIONS;
    // Use serialized keys for stable dependency comparison
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollState.isRunning, pollOptionsKey, setupOptionsKey]);

  // Use shared hook for display logic
  const {
    totalVotes,
    getPercentage,
    winnerIds,
    winnerText,
    showCelebration,
    handleCelebrationComplete,
    isCountingDown,
  } = usePollDisplay({ pollState, displayOptions });

  const displayQuestion =
    pollState.isRunning ? pollState.question : setupConfig?.question || DEFAULT_QUESTION;

  // Leader election - only the leader tab polls for updates
  useEffect(() => {
    const tryBecomeLeader = () => {
      const leaderData = localStorage.getItem(LEADER_KEY);
      const now = Date.now();

      if (!leaderData) {
        // No leader, become leader
        localStorage.setItem(LEADER_KEY, JSON.stringify({ id: TAB_ID, timestamp: now }));
        setIsLeader(true);
        return true;
      }

      try {
        const leader = JSON.parse(leaderData);
        if (leader.id === TAB_ID) {
          // We are already the leader, update heartbeat
          localStorage.setItem(LEADER_KEY, JSON.stringify({ id: TAB_ID, timestamp: now }));
          setIsLeader(true);
          return true;
        }

        // Check if leader is stale (timed out)
        if (now - leader.timestamp > LEADER_TIMEOUT) {
          // Leader timed out, take over
          localStorage.setItem(LEADER_KEY, JSON.stringify({ id: TAB_ID, timestamp: now }));
          setIsLeader(true);
          return true;
        }

        // Another tab is the active leader
        setIsLeader(false);
        return false;
      } catch {
        // Invalid data, become leader
        localStorage.setItem(LEADER_KEY, JSON.stringify({ id: TAB_ID, timestamp: now }));
        setIsLeader(true);
        return true;
      }
    };

    // Try to become leader immediately
    tryBecomeLeader();

    // Heartbeat interval - leader refreshes, followers check if leader is alive
    const heartbeatInterval = setInterval(tryBecomeLeader, LEADER_HEARTBEAT_INTERVAL);

    // Listen for storage changes (when another tab becomes leader or updates state)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LEADER_KEY) {
        tryBecomeLeader();
      }
      // Listen for auto-reconnect setting changes
      if (e.key === 'tiktok-poll-autoReconnect') {
        setIsAutoReconnectEnabled(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Cleanup: if we're the leader, release leadership
    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('storage', handleStorageChange);

      // Release leadership if we were the leader
      const leaderData = localStorage.getItem(LEADER_KEY);
      if (leaderData) {
        try {
          const leader = JSON.parse(leaderData);
          if (leader.id === TAB_ID) {
            localStorage.removeItem(LEADER_KEY);
          }
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

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
          setIsConnected(data.isConnected);
          // Reset reconnecting state when connection status changes
          if (data.isConnected) {
            setIsReconnecting(false);
          }
        }
      };

      // Only the leader tab polls for updates to avoid race conditions
      if (isLeader) {
        channel.postMessage({ type: 'request-state' });

        // Poll for updates every 500ms as a backup for pushed updates
        // Primary updates come via broadcast, this catches missed messages
        pollInterval = setInterval(() => {
          if (channel) {
            channel.postMessage({ type: 'request-state' });
          }
        }, 500);
      }

      return () => {
        if (pollInterval) {
          clearInterval(pollInterval);
        }
        channel?.close();
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      channel?.close();
    };
  }, [isLeader]);

  const sendCommand = useCallback(
    (command: 'start' | 'stop' | 'reset') => {
      if (!channelRef) return;
      channelRef.postMessage({ type: 'poll-command', command });
    },
    [channelRef]
  );

  // Keyboard shortcuts for poll control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Start: Space or Enter (or custom shortcut)
      if (matchesShortcut(e, POLL_SHORTCUTS.START)) {
        e.preventDefault();
        if (isConnected && !pollState.isRunning && pollState.countdown === undefined) {
          sendCommand('start');
        }
        return;
      }

      // Stop: Escape (or custom shortcut)
      if (matchesShortcut(e, POLL_SHORTCUTS.STOP)) {
        if (pollState.isRunning) {
          sendCommand('stop');
        }
        return;
      }

      // Reset: R (or custom shortcut)
      if (matchesShortcut(e, POLL_SHORTCUTS.RESET)) {
        if (!pollState.isRunning) {
          sendCommand('reset');
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConnected, pollState.isRunning, pollState.countdown, sendCommand]);

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
      selectedOptions?: boolean[]
    ) => {
      if (!channelRef) return;
      channelRef.postMessage({
        type: 'config-update',
        config: { question, options, timer },
      });
      // Also update local setupConfig
      setSetupConfig({ question, options, timer });
      // Save to localStorage for persistence
      localStorage.setItem('tiktok-poll-setupConfig', JSON.stringify({ question, options, timer }));
      if (allOptions && selectedOptions) {
        localStorage.setItem(
          'tiktok-poll-fullOptions',
          JSON.stringify({ allOptions, selectedOptions })
        );
      }
    },
    [channelRef]
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-[#e90048] flex flex-col p-5 relative">
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
        <div className="p-4 bg-slate-800/50 rounded-xl border border-tiktok-cyan/30">
          <PollSetup
            onStart={() => { }} // Not used - we have separate control buttons
            onChange={handleSetupChange}
            disabled={pollState.isRunning}
            showStartButton={false}
            externalConfig={setupConfig}
            externalFullOptions={fullOptionsConfig}
            initialQuestion={setupConfig?.question}
            initialOptions={fullOptionsConfig?.allOptions}
            initialSelectedOptions={fullOptionsConfig?.selectedOptions}
            initialTimer={setupConfig?.timer}
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
          variant="results-page"
        />

        {/* Results Section */}
        <div className="flex-1 space-y-3 relative">
          {/* Spotlight + Trophy Celebration */}
          {showCelebration && (
            <SpotlightTrophyCelebration
              onComplete={handleCelebrationComplete}
              winnerText={winnerText}
            />
          )}

          {/* Countdown Overlay */}
          {isCountingDown && <CountdownOverlay countdown={pollState.countdown!} />}

          {/* Question */}
          <PollQuestion
            question={displayQuestion || t.pollResults.voteNow}
            isRunning={pollState.isRunning}
            timeLeft={pollState.timeLeft}
            timer={pollState.timer}
            className="[&_h3]:text-5xl"
          />

          {/* Results */}
          <div className="space-y-3 flex-1 min-h-[440px]">
            {displayOptions.map((option) => {
              const percentage = pollState.options.length > 0 ? getPercentage(option.id) : 0;

              return (
                <PollOptionCard
                  key={option.id}
                  option={option}
                  votes={pollState.votes[option.id] || 0}
                  percentage={percentage}
                  totalVotes={totalVotes}
                  isWinner={winnerIds.includes(option.id)}
                  size="large"
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Disconnected Modal Component
interface DisconnectedModalProps {
  isReconnecting: boolean;
  isAutoReconnectEnabled: boolean;
  onReconnect: () => void;
}

function DisconnectedModal ({
  isReconnecting,
  isAutoReconnectEnabled,
  onReconnect,
}: DisconnectedModalProps) {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blur Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Modal Content */}
      <div
        className={`relative z-10 bg-slate-800/95 border-2 rounded-2xl p-10 shadow-2xl max-w-md mx-4 text-center ${isReconnecting || isAutoReconnectEnabled
            ? 'border-yellow-500/50 shadow-yellow-500/20'
            : 'border-red-500/50 shadow-red-500/20 animate-pulse'
          }`}
      >
        {isReconnecting || isAutoReconnectEnabled ? (
          <>
            <div className="text-6xl mb-6 animate-spin">🔄</div>
            <h2 className="text-3xl font-bold text-yellow-400 mb-4">
              {isAutoReconnectEnabled
                ? t.pollResults.autoReconnectTitle
                : t.pollResults.reconnecting}
            </h2>
            <p className="text-slate-400 text-lg mb-8">
              {isAutoReconnectEnabled
                ? t.pollResults.autoReconnectActive
                : t.pollResults.attemptingReconnect}
            </p>
            <div className="flex justify-center gap-2">
              <div
                className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              ></div>
              <div
                className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              ></div>
              <div
                className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              ></div>
            </div>
            {isAutoReconnectEnabled && (
              <p className="text-slate-500 text-sm mt-6">
                {t.pollResults.autoReconnectEnabledMainPage}
              </p>
            )}
          </>
        ) : (
          <>
            <div className="text-6xl mb-6">⚠️</div>
            <h2 className="text-3xl font-bold text-red-400 mb-4">{t.pollResults.disconnected}</h2>
            <p className="text-slate-400 text-lg mb-8">{t.pollResults.connectionLost}</p>
            <button
              onClick={onReconnect}
              className="px-10 py-4 text-xl font-bold rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-400 hover:to-red-400 transition-all hover:scale-105 shadow-lg shadow-red-500/30"
            >
              {t.pollResults.reconnectButton}
            </button>
            <p className="text-slate-500 text-sm mt-6">{t.pollResults.autoReconnectTip}</p>
          </>
        )}
      </div>
    </div>
  );
}
