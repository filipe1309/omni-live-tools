import { useState, useEffect, useCallback, useMemo } from 'react';
import type { PollState, PollOption, SerializablePollState, SetupConfig } from '@/types';
import { PollSetup } from '@/components/poll/PollSetup';
import { SpotlightTrophyCelebration } from '@/components/poll/SpotlightTrophyCelebration';
import { CountdownOverlay } from '@/components/poll/CountdownOverlay';
import { PollQuestion } from '@/components/poll/PollQuestion';
import { PollOptionCard } from '@/components/poll/PollOptionCard';
import { PollControlButtons } from '@/components/poll/PollControlButtons';
import { DisconnectedModal } from '@/components/poll/DisconnectedModal';
import { LoadScreen } from '@/components';
import { usePollDisplay } from '@/hooks/usePollDisplay';
import { usePollKeyboardShortcuts } from '@/hooks/usePollKeyboardShortcuts';
import { useLeaderElection } from '@/hooks/useLeaderElection';
import { useBackgroundKeepAlive } from '@/hooks/useBackgroundKeepAlive';
import { POLL_TIMER, DEFAULT_QUESTION, DEFAULT_POLL_OPTIONS } from '@/constants';
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
    return localStorage.getItem('tiktok-poll-autoReconnect') === 'true';
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
    return DEFAULT_POLL_OPTIONS;
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

  // Inline edit handler for question (from PollQuestion double-click)
  const handleQuestionInlineEdit = useCallback(
    (newQuestion: string) => {
      if (!setupConfig) return;
      const newConfig = { ...setupConfig, question: newQuestion };
      setSetupConfig(newConfig);
      localStorage.setItem('tiktok-poll-setupConfig', JSON.stringify(newConfig));
      if (channelRef) {
        channelRef.postMessage({
          type: 'config-update',
          config: newConfig,
        });
      }
    },
    [channelRef, setupConfig]
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
      localStorage.setItem('tiktok-poll-setupConfig', JSON.stringify(newConfig));

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
          localStorage.setItem('tiktok-poll-fullOptions', JSON.stringify(newFullConfig));
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
          <div className="p-4 bg-slate-800/50 rounded-xl border border-tiktok-cyan/30">
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
              editable={!pollState.isRunning && !isCountingDown}
              onQuestionChange={handleQuestionInlineEdit}
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
                    editable={!pollState.isRunning && !isCountingDown}
                    onOptionTextChange={handleOptionInlineEdit}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
