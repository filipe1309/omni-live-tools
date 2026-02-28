import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type {
  PollState,
  PollOption,
  VoteEntry,
  ChatMessage,
  PlatformType,
  SetupConfig,
  FullOptionsConfig,
} from '@/types';
import { POLL_TIMER, DEFAULT_QUESTION, STORAGE_KEYS } from '@/constants';
import { usePollTimer } from './usePollTimer';
import { usePollSync } from './usePollSync';

// Re-export types for backward compatibility
export type { SerializablePollState, SetupConfig } from '@/types';

interface UsePollReturn {
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
    fullOptions?: { allOptions: string[]; selectedOptions: boolean[] }
  ) => void;
  setConnectionStatus: (isConnected: boolean) => void;
  onConfigUpdate: (callback: (config: SetupConfig, fullOptions?: FullOptionsConfig) => void) => void;
  onReconnect: (callback: () => void) => void;
}

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
  resultsFontSize: 1.5,
};

// Load fullOptionsConfig from localStorage
const loadInitialFullOptionsConfig = (): { allOptions: string[]; selectedOptions: boolean[] } | null => {
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

export function usePoll (): UsePollReturn {
  const [pollState, setPollState] = useState<PollState>(initialPollState);
  const [voteLog, setVoteLog] = useState<VoteEntry[]>([]);

  // Refs for configuration and state
  const popupWindowRef = useRef<Window | null>(null);
  const setupConfigRef = useRef<SetupConfig>(loadInitialSetupConfig());
  const connectionStatusRef = useRef<boolean>(false);
  const pollStateRef = useRef<PollState>(initialPollState);
  const fullOptionsConfigRef = useRef<{ allOptions: string[]; selectedOptions: boolean[] } | null>(
    loadInitialFullOptionsConfig()
  );

  // Keep pollStateRef in sync with pollState
  useEffect(() => {
    pollStateRef.current = pollState;
  }, [pollState]);

  // Setup sync options - memoized to avoid recreating on every render
  const syncOptions = useMemo(
    () => ({
      getCurrentState: () => pollStateRef.current,
      getSetupConfig: () => setupConfigRef.current,
      getFullOptionsConfig: () => fullOptionsConfigRef.current,
      getConnectionStatus: () => connectionStatusRef.current,
    }),
    []
  );

  // Initialize sync hook
  const {
    broadcastPollState,
    broadcastSetupConfig: broadcastSetupConfigToPopup,
    broadcastConnectionStatus,
    setCommandHandlers,
    onConfigUpdate: registerSyncConfigUpdate,
    onReconnect: registerSyncReconnect,
  } = usePollSync(syncOptions);

  // Consumer callback refs for config update and reconnect
  const configUpdateCallbackRef = useRef<((config: SetupConfig, fullOptions?: FullOptionsConfig) => void) | null>(null);
  const reconnectCallbackRef = useRef<(() => void) | null>(null);

  // Register internal handlers with usePollSync that update our refs AND call consumer callbacks
  useEffect(() => {
    registerSyncConfigUpdate((config: SetupConfig, fullOptions?: FullOptionsConfig) => {
      // Update our internal setupConfigRef - this was missing in the refactor!
      console.log('[usePoll] Config update received, updating setupConfigRef:', config, 'fullOptions:', fullOptions);
      setupConfigRef.current = config;
      // Also update fullOptionsConfigRef if provided
      if (fullOptions) {
        fullOptionsConfigRef.current = fullOptions;
      }
      // Then notify the consumer (e.g., PollPage)
      if (configUpdateCallbackRef.current) {
        configUpdateCallbackRef.current(config, fullOptions);
      }
    });

    registerSyncReconnect(() => {
      if (reconnectCallbackRef.current) {
        reconnectCallbackRef.current();
      }
    });
  }, [registerSyncConfigUpdate, registerSyncReconnect]);

  // Public callback registration for consumers
  const onConfigUpdate = useCallback((callback: (config: SetupConfig, fullOptions?: FullOptionsConfig) => void) => {
    configUpdateCallbackRef.current = callback;
  }, []);

  const onReconnect = useCallback((callback: () => void) => {
    reconnectCallbackRef.current = callback;
  }, []);

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
      console.log('[usePoll] startPoll called with options:', options);

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

  // Set connection status and broadcast
  const setConnectionStatus = useCallback(
    (isConnected: boolean) => {
      connectionStatusRef.current = isConnected;
      broadcastConnectionStatus(isConnected);
    },
    [broadcastConnectionStatus]
  );

  // Broadcast setup config changes (for preview in popup)
  const broadcastSetupConfig = useCallback(
    (config: SetupConfig, fullOptions?: { allOptions: string[]; selectedOptions: boolean[] }) => {
      console.log(
        '[usePoll] broadcastSetupConfig called - OLD:',
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
        console.log('[usePoll] Config changed, updating setupConfigRef');
        setupConfigRef.current = config;
      }

      // Update full options config if provided
      if (fullOptions) {
        fullOptionsConfigRef.current = fullOptions;
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

      return {
        ...prev,
        votes: newVotes,
        voters: newVoters,
      };
    });
  }, []);

  const clearVoteLog = useCallback(() => {
    setVoteLog([]);
  }, []);

  const getTotalVotes = useCallback(() => {
    return Object.values(pollState.votes).reduce((sum, count) => sum + count, 0);
  }, [pollState.votes]);

  const getWinner = useCallback(() => {
    const totalVotes = getTotalVotes();
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
  }, [pollState.votes, pollState.options, getTotalVotes]);

  const getPercentage = useCallback(
    (optionId: number) => {
      const totalVotes = getTotalVotes();
      if (totalVotes === 0) return 0;
      return Math.round((pollState.votes[optionId] / totalVotes) * 100);
    },
    [pollState.votes, getTotalVotes]
  );

  // Register command handlers for popup communication
  useEffect(() => {
    setCommandHandlers({
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
    });
  }, [startPoll, stopPoll, resetPoll, setCommandHandlers]);

  return {
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
  };
}
