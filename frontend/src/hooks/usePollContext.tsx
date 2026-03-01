import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type {
  PollState,
  PollOption,
  VoteEntry,
  ChatMessage,
  PlatformType,
  SetupConfig,
  FullOptionsConfig,
  SerializablePollState,
  UnifiedChatMessage,
} from '@/types';
import { POLL_TIMER, DEFAULT_QUESTION, STORAGE_KEYS, POLL_FONT_SIZE } from '@/constants';
import { usePollTimer } from './usePollTimer';
import { useConnectionContext } from './useConnectionContext';

const CHANNEL_NAME = 'poll-results-channel';

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

// Initialize setupConfig OUTSIDE component to prevent recreation on every render
const INITIAL_SETUP_CONFIG: SetupConfig = {
  question: DEFAULT_QUESTION,
  options: [
    { id: 1, text: 'Sim' },
    { id: 2, text: 'Não' },
  ],
  timer: POLL_TIMER.DEFAULT,
  resultsFontSize: POLL_FONT_SIZE.DEFAULT,
};

// Load fullOptionsConfig from localStorage
const loadInitialFullOptionsConfig = (): FullOptionsConfig | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.FULL_OPTIONS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
};

// Load setupConfig from localStorage
const loadInitialSetupConfig = (): SetupConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SETUP_CONFIG);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore parse errors
  }
  return INITIAL_SETUP_CONFIG;
};

/** Converts PollState to serializable format for BroadcastChannel */
function toSerializableState(
  state: PollState,
  forceFinished?: boolean
): SerializablePollState {
  const hasVotes = Object.values(state.votes).some(v => v > 0);
  return {
    isRunning: state.isRunning,
    finished:
      forceFinished ??
      (state.finished ||
        (!state.isRunning && state.options.length > 0 && hasVotes && state.countdown === undefined)),
    question: state.question,
    options: state.options,
    votes: state.votes,
    votersArray: Array.from(state.voters),
    timer: state.timer,
    timeLeft: state.timeLeft,
    countdown: state.countdown,
  };
}

interface PollContextValue {
  pollState: PollState;
  voteLog: VoteEntry[];
  startPoll: (question: string, options: PollOption[], timer?: number) => void;
  stopPoll: () => void;
  resetPoll: () => void;
  processVote: (message: ChatMessage, platform?: PlatformType) => void;
  clearVoteLog: () => void;
  getTotalVotes: () => number;
  getWinner: () => PollOption | null;
  getPercentage: (optionId: number) => number;
  openResultsPopup: () => void;
  broadcastSetupConfig: (
    config: SetupConfig,
    fullOptions?: FullOptionsConfig
  ) => void;
  setConnectionStatus: (isConnected: boolean) => void;
  onConfigUpdate: (callback: (config: SetupConfig, fullOptions?: FullOptionsConfig) => void) => void;
  onReconnect: (callback: () => void) => void;
}

const PollContext = createContext<PollContextValue | null>(null);

interface PollProviderProps {
  children: React.ReactNode;
}

export function PollProvider({ children }: PollProviderProps) {
  const [pollState, setPollState] = useState<PollState>(initialPollState);
  const [voteLog, setVoteLog] = useState<VoteEntry[]>([]);
  
  // Get connection status and chat handlers from ConnectionContext
  const { 
    isAnyConnected,
    registerChatHandler,
    registerTikTokChatHandler,
  } = useConnectionContext();

  // Refs for configuration and state
  const popupWindowRef = useRef<Window | null>(null);
  const setupConfigRef = useRef<SetupConfig>(loadInitialSetupConfig());
  const connectionStatusRef = useRef<boolean>(isAnyConnected);
  const pollStateRef = useRef<PollState>(initialPollState);
  const fullOptionsConfigRef = useRef<FullOptionsConfig | null>(loadInitialFullOptionsConfig());
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Keep connectionStatusRef in sync with isAnyConnected (synchronously)
  connectionStatusRef.current = isAnyConnected;

  // Consumer callback refs for config update and reconnect
  const configUpdateCallbackRef = useRef<((config: SetupConfig, fullOptions?: FullOptionsConfig) => void) | null>(null);
  const reconnectCallbackRef = useRef<(() => void) | null>(null);

  // Determine if this is the main window (not a popup)
  // Popup windows have window.opener set to the parent window
  const isMainWindow = typeof window !== 'undefined' && window.opener === null;

  // Keep pollStateRef in sync with pollState
  useEffect(() => {
    pollStateRef.current = pollState;
  }, [pollState]);

  // Broadcast poll state to popup (only from main window)
  const broadcastPollState = useCallback((state: PollState) => {
    if (!channelRef.current || !isMainWindow) return;

    // Don't broadcast if poll hasn't been configured and not in countdown
    if (
      !state.isRunning &&
      !state.finished &&
      state.options.length === 0 &&
      state.countdown === undefined
    ) {
      return;
    }

    channelRef.current.postMessage({
      type: 'poll-update',
      state: toSerializableState(state),
    });
  }, [isMainWindow]);

  // Broadcast setup config for preview (only from main window)
  const broadcastSetupConfigToPopup = useCallback(() => {
    if (!channelRef.current || !isMainWindow) return;

    channelRef.current.postMessage({
      type: 'setup-config',
      config: setupConfigRef.current,
      fullOptions: fullOptionsConfigRef.current,
    });
  }, [isMainWindow]);

  // Broadcast connection status change (only from main window)
  const broadcastConnectionStatus = useCallback((isConnected: boolean) => {
    if (!channelRef.current || !isMainWindow) return;

    channelRef.current.postMessage({
      type: 'connection-status',
      isConnected,
    });
  }, [isMainWindow]);

  // Timer callbacks
  const timerCallbacks = useMemo(
    () => ({
      onCountdownChange: (countdown: number) => {
        setPollState(prev => ({ ...prev, countdown }));

        // Broadcast countdown state - use setupConfig for question/options if not yet set
        const state = pollStateRef.current;
        const stateWithCountdown: PollState = {
          ...state,
          question: state.question || setupConfigRef.current.question,
          options: state.options.length > 0 ? state.options : setupConfigRef.current.options,
          timer: state.timer || setupConfigRef.current.timer,
          timeLeft: state.timeLeft || setupConfigRef.current.timer,
          countdown,
        };
        broadcastPollState(stateWithCountdown);
      },

      onPollStart: (newState: PollState) => {
        setPollState(newState);
        broadcastPollState(newState);
      },

      onTimeLeftChange: (timeLeft: number) => {
        setPollState(prev => {
          const newState = { ...prev, timeLeft };
          broadcastPollState(newState);
          return newState;
        });
      },

      onPollFinish: () => {
        setPollState(prev => {
          const finishedState = { ...prev, isRunning: false, finished: true, timeLeft: 0 };
          broadcastPollState(finishedState);
          return finishedState;
        });
      },
    }),
    [broadcastPollState]
  );

  // Initialize timer hook
  const { startTimer, stopTimer } = usePollTimer(timerCallbacks);

  // Start poll with countdown
  const startPoll = useCallback(
    (question: string, options: PollOption[], timer = POLL_TIMER.DEFAULT) => {
      console.log('[PollContext] startPoll called with options:', options);

      // Initialize votes map
      const initialVotes: Record<number, number> = {};
      options.forEach(opt => {
        initialVotes[opt.id] = 0;
      });

      // Create countdown state
      const countdownState: PollState = {
        isRunning: false,
        finished: false,
        question,
        options,
        votes: initialVotes,
        voters: new Set<string>(),
        timer,
        timeLeft: timer,
        countdown: 3,
      };

      setPollState(countdownState);
      setVoteLog([]);

      // Start timer (handles countdown and poll timer)
      startTimer(question, options, timer);
    },
    [startTimer]
  );

  // Stop poll
  const stopPoll = useCallback(() => {
    stopTimer();
    setPollState(prev => {
      const stoppedState = { ...prev, isRunning: false, finished: true, countdown: undefined };
      broadcastPollState(stoppedState);
      return stoppedState;
    });
  }, [stopTimer, broadcastPollState]);

  // Reset poll
  const resetPoll = useCallback(() => {
    stopTimer();
    setPollState(initialPollState);
    setVoteLog([]);
    broadcastSetupConfigToPopup();
  }, [stopTimer, broadcastSetupConfigToPopup]);

  // Initialize BroadcastChannel - stays open for entire app lifecycle
  // Only the main window (not popup) should respond to request-state
  useEffect(() => {
    // Prevent duplicate listeners in React Strict Mode
    if (channelRef.current) {
      return;
    }

    try {
      channelRef.current = new BroadcastChannel(CHANNEL_NAME);

      channelRef.current.onmessage = (event) => {
        // Only main window responds to state requests from popup
        if (event.data.type === 'request-state') {
          if (!isMainWindow) return; // Popup should not respond to its own requests
          
          const currentState = pollStateRef.current;

          // Only broadcast poll state if poll has been started or is in countdown
          if (currentState.options.length > 0 || currentState.countdown !== undefined) {
            channelRef.current?.postMessage({
              type: 'poll-update',
              state: toSerializableState(currentState),
            });
          } else {
            // Send setup config for preview
            channelRef.current?.postMessage({
              type: 'setup-config',
              config: setupConfigRef.current,
              fullOptions: fullOptionsConfigRef.current,
            });
          }

          // Broadcast connection status
          channelRef.current?.postMessage({
            type: 'connection-status',
            isConnected: connectionStatusRef.current,
          });
        } else if (event.data.type === 'poll-command') {
          if (!isMainWindow) return; // Only main window handles commands
          
          const command = event.data.command as 'start' | 'stop' | 'reset';
          // Note: We can't call startPoll/stopPoll/resetPoll directly here
          // because they would be stale closures. Instead, we use commandHandlersRef
          if (commandHandlersRef.current) {
            commandHandlersRef.current[command]();
          }
        } else if (event.data.type === 'config-update') {
          if (!isMainWindow) return; // Only main window handles config updates
          
          const config = event.data.config as SetupConfig;
          const fullOptions = event.data.fullOptions as FullOptionsConfig | undefined;
          console.log('[PollContext] Received config-update from popup:', config, fullOptions);
          
          // Update our internal refs
          setupConfigRef.current = config;
          if (fullOptions) {
            fullOptionsConfigRef.current = fullOptions;
          }
          
          // Notify the consumer (e.g., PollPage)
          if (configUpdateCallbackRef.current) {
            configUpdateCallbackRef.current(config, fullOptions);
          }
        } else if (event.data.type === 'reconnect') {
          if (!isMainWindow) return; // Only main window handles reconnect
          
          console.log('[PollContext] Received reconnect request from popup');
          if (reconnectCallbackRef.current) {
            reconnectCallbackRef.current();
          }
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e);
    }

    return () => {
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, []);

  // Command handlers ref - updated when functions change
  const commandHandlersRef = useRef<{ start: () => void; stop: () => void; reset: () => void } | null>(null);

  // Keep command handlers up to date
  useEffect(() => {
    commandHandlersRef.current = {
      start: () => {
        if (setupConfigRef.current) {
          startPoll(
            setupConfigRef.current.question,
            setupConfigRef.current.options,
            setupConfigRef.current.timer
          );
        }
      },
      stop: stopPoll,
      reset: resetPoll,
    };
  }, [startPoll, stopPoll, resetPoll]);

  // Broadcast connection status to popup whenever it changes
  useEffect(() => {
    broadcastConnectionStatus(isAnyConnected);
  }, [isAnyConnected, broadcastConnectionStatus]);

  // Set connection status and broadcast (kept for backward compatibility)
  const setConnectionStatus = useCallback(
    (isConnected: boolean) => {
      connectionStatusRef.current = isConnected;
      broadcastConnectionStatus(isConnected);
    },
    [broadcastConnectionStatus]
  );

  // Broadcast setup config changes (for preview in popup)
  const broadcastSetupConfig = useCallback(
    (config: SetupConfig, fullOptions?: FullOptionsConfig) => {
      console.log(
        '[PollContext] broadcastSetupConfig called - OLD:',
        setupConfigRef.current.options,
        'NEW:',
        config.options
      );

      // Only update if the config actually changed
      const currentConfig = setupConfigRef.current;
      const optionsChanged = JSON.stringify(currentConfig.options) !== JSON.stringify(config.options);
      const questionChanged = currentConfig.question !== config.question;
      const timerChanged = currentConfig.timer !== config.timer;
      const showStatusBarChanged = currentConfig.showStatusBar !== config.showStatusBar;
      const showBorderChanged = currentConfig.showBorder !== config.showBorder;

      if (optionsChanged || questionChanged || timerChanged || showStatusBarChanged || showBorderChanged) {
        console.log('[PollContext] Config changed, updating setupConfigRef');
        setupConfigRef.current = config;
      }

      // Update full options config if provided
      if (fullOptions) {
        fullOptionsConfigRef.current = fullOptions;
      }

      // Broadcast to popup
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'setup-config',
          config: setupConfigRef.current,
          fullOptions: fullOptionsConfigRef.current,
        });
      }
    },
    []
  );

  // Open results popup window
  const openResultsPopup = useCallback(() => {
    // Check if popup is already open
    if (popupWindowRef.current && !popupWindowRef.current.closed) {
      popupWindowRef.current.focus();
      return;
    }

    const width = 800;
    const height = 1000;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    popupWindowRef.current = window.open(
      '/poll-results',
      'pollResultsPopup',
      `width=${width},height=${height},left=${left},top=${top},` +
      'toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes'
    );

    // Send initial state after popup loads
    setTimeout(() => {
      broadcastPollState(pollStateRef.current);
    }, 500);
  }, [broadcastPollState]);

  // Process vote from chat
  const processVote = useCallback((message: ChatMessage, platform?: PlatformType) => {
    setPollState(prev => {
      if (!prev.isRunning) return prev;

      const comment = message.comment.trim();
      const voteNumber = parseInt(comment);

      if (isNaN(voteNumber)) return prev;

      const option = prev.options.find(o => o.id === voteNumber);
      if (!option) return prev;

      const uniqueVoterId = platform ? `${platform}:${message.uniqueId}` : message.uniqueId;

      if (prev.voters.has(uniqueVoterId)) return prev;

      const newVoters = new Set(prev.voters);
      newVoters.add(uniqueVoterId);

      const newVotes = { ...prev.votes };
      newVotes[voteNumber] = (newVotes[voteNumber] || 0) + 1;

      const entry: VoteEntry = {
        id: `${uniqueVoterId}-${Date.now()}`,
        user: message,
        optionId: voteNumber,
        optionText: option.text,
        timestamp: new Date(),
        platform,
      };
      setVoteLog(log => [...log.slice(-99), entry]);

      // Broadcast updated state
      const newState = {
        ...prev,
        votes: newVotes,
        voters: newVoters,
      };
      
      // Schedule broadcast to avoid state update conflicts
      setTimeout(() => {
        broadcastPollState(newState);
      }, 0);

      return newState;
    });
  }, [broadcastPollState]);

  const clearVoteLog = useCallback(() => {
    setVoteLog([]);
  }, []);

  const getTotalVotes = useCallback(() => {
    return Object.values(pollState.votes).reduce((sum, count) => sum + count, 0);
  }, [pollState.votes]);

  const getWinner = useCallback(() => {
    const totalVotes = Object.values(pollState.votes).reduce((sum, count) => sum + count, 0);
    if (totalVotes === 0) return null;

    let maxVotes = 0;
    let winnerId = 0;

    Object.entries(pollState.votes).forEach(([id, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        winnerId = parseInt(id);
      }
    });

    return pollState.options.find(o => o.id === winnerId) || null;
  }, [pollState.votes, pollState.options]);

  const getPercentage = useCallback(
    (optionId: number) => {
      const totalVotes = Object.values(pollState.votes).reduce((sum, count) => sum + count, 0);
      if (totalVotes === 0) return 0;
      return Math.round((pollState.votes[optionId] / totalVotes) * 100);
    },
    [pollState.votes]
  );

  // Public callback registration for consumers
  const onConfigUpdate = useCallback((callback: (config: SetupConfig, fullOptions?: FullOptionsConfig) => void) => {
    configUpdateCallbackRef.current = callback;
  }, []);

  const onReconnect = useCallback((callback: () => void) => {
    reconnectCallbackRef.current = callback;
  }, []);

  // Handle unified chat from any platform (only in main window)
  const handleUnifiedChat = useCallback((msg: UnifiedChatMessage) => {
    if (!isMainWindow) return;
    if (pollStateRef.current.isRunning) {
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
  }, [isMainWindow, processVote]);

  // Handle chat from TikTok (original format, for backwards compatibility)
  const handleTikTokChat = useCallback((msg: ChatMessage) => {
    if (!isMainWindow) return;
    if (pollStateRef.current.isRunning) {
      processVote(msg, 'tiktok' as PlatformType);
    }
  }, [isMainWindow, processVote]);

  // Register chat handlers to process votes regardless of which page is active
  useEffect(() => {
    if (!isMainWindow) return;

    const unsubscribeChat = registerChatHandler(handleUnifiedChat);
    const unsubscribeTikTokChat = registerTikTokChatHandler(handleTikTokChat);

    return () => {
      unsubscribeChat();
      unsubscribeTikTokChat();
    };
  }, [isMainWindow, handleUnifiedChat, handleTikTokChat, registerChatHandler, registerTikTokChatHandler]);

  const value: PollContextValue = useMemo(
    () => ({
      pollState,
      voteLog,
      startPoll,
      stopPoll,
      resetPoll,
      processVote,
      clearVoteLog,
      getTotalVotes,
      getWinner,
      getPercentage,
      openResultsPopup,
      broadcastSetupConfig,
      setConnectionStatus,
      onConfigUpdate,
      onReconnect,
    }),
    [
      pollState,
      voteLog,
      startPoll,
      stopPoll,
      resetPoll,
      processVote,
      clearVoteLog,
      getTotalVotes,
      getWinner,
      getPercentage,
      openResultsPopup,
      broadcastSetupConfig,
      setConnectionStatus,
      onConfigUpdate,
      onReconnect,
    ]
  );

  return <PollContext.Provider value={value}>{children}</PollContext.Provider>;
}

export function usePollContext(): PollContextValue {
  const context = useContext(PollContext);
  if (!context) {
    throw new Error('usePollContext must be used within a PollProvider');
  }
  return context;
}
