import { useState, useCallback, useRef, useEffect } from 'react';
import type { PollState, PollOption, VoteEntry, ChatMessage } from '@/types';
import { POLL_TIMER, DEFAULT_QUESTION } from '@/constants';

// Serializable version of PollState for BroadcastChannel
export interface SerializablePollState {
  isRunning: boolean;
  finished: boolean;
  question: string;
  options: PollOption[];
  votes: Record<number, number>;
  votersArray: string[];
  timer: number;
  timeLeft: number;
}

// Setup config for preview broadcast
export interface SetupConfig {
  question: string;
  options: PollOption[];
  timer: number;
}

interface UsePollReturn {
  pollState: PollState;
  voteLog: VoteEntry[];
  startPoll: (question: string, options: PollOption[], timer?: number) => void;
  stopPoll: () => void;
  resetPoll: () => void;
  processVote: (message: ChatMessage) => void;
  clearVoteLog: () => void;
  getTotalVotes: () => number;
  getWinner: () => PollOption | null;
  getPercentage: (optionId: number) => number;
  openResultsPopup: () => void;
  broadcastSetupConfig: (config: SetupConfig, fullOptions?: { allOptions: string[]; selectedOptions: boolean[] }) => void;
  setConnectionStatus: (isConnected: boolean) => void;
  onConfigUpdate: (callback: (config: SetupConfig) => void) => void;
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
};

// Initialize setupConfig OUTSIDE component to prevent recreation on every render
const INITIAL_SETUP_CONFIG: SetupConfig = {
  question: DEFAULT_QUESTION,
  options: [
    { id: 1, text: 'Sim' },
    { id: 2, text: 'Não' },
  ],
  timer: POLL_TIMER.DEFAULT,
};

// Load fullOptionsConfig from localStorage
const loadInitialFullOptionsConfig = (): { allOptions: string[]; selectedOptions: boolean[] } | null => {
  try {
    const saved = localStorage.getItem('tiktok-poll-fullOptions');
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
    const saved = localStorage.getItem('tiktok-poll-setupConfig');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore parse errors
  }
  return INITIAL_SETUP_CONFIG;
};

export function usePoll(): UsePollReturn {
  const [pollState, setPollState] = useState<PollState>(initialPollState);
  const [voteLog, setVoteLog] = useState<VoteEntry[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const popupWindowRef = useRef<Window | null>(null);
  // Initialize with saved config from localStorage or defaults
  const setupConfigRef = useRef<SetupConfig>(loadInitialSetupConfig());
  
  const connectionStatusRef = useRef<boolean>(false);
  const pollStateRef = useRef<PollState>(initialPollState);
  // Initialize fullOptionsConfig from localStorage
  const fullOptionsConfigRef = useRef<{ allOptions: string[]; selectedOptions: boolean[] } | null>(loadInitialFullOptionsConfig());
  const commandHandlersRef = useRef<{
    start: () => void;
    stop: () => void;
    reset: () => void;
  } | null>(null);
  const configUpdateCallbackRef = useRef<((config: SetupConfig) => void) | null>(null);
  const reconnectCallbackRef = useRef<(() => void) | null>(null);

  // Register callback for config updates from popup
  const onConfigUpdate = useCallback((callback: (config: SetupConfig) => void) => {
    configUpdateCallbackRef.current = callback;
  }, []);

  // Register callback for reconnect from popup
  const onReconnect = useCallback((callback: () => void) => {
    reconnectCallbackRef.current = callback;
  }, []);

  // Keep pollStateRef in sync with pollState
  useEffect(() => {
    pollStateRef.current = pollState;
  }, [pollState]);

  // Initialize BroadcastChannel for syncing with popup window
  useEffect(() => {
    // Prevent duplicate listeners in React Strict Mode
    if (channelRef.current) {
      return;
    }
    
    try {
      channelRef.current = new BroadcastChannel('poll-results-channel');
      
      // Listen for state requests and commands from popup
      channelRef.current.onmessage = (event) => {
        if (event.data.type === 'request-state') {
          // Use pollStateRef.current to get the latest state
          const currentState = pollStateRef.current;
          
          // Respond to popup request-state
          
          // Only broadcast poll state if poll has been started (has options)
          // Otherwise, only send setup config for preview
          if (currentState.options.length > 0) {
            const hasVotes = Object.values(currentState.votes).some(v => v > 0);
            const serializableState: SerializablePollState = {
              isRunning: currentState.isRunning,
              finished: currentState.finished || (!currentState.isRunning && hasVotes),
              question: currentState.question,
              options: currentState.options,
              votes: currentState.votes,
              votersArray: Array.from(currentState.voters),
              timer: currentState.timer,
              timeLeft: currentState.timeLeft,
            };
            channelRef.current?.postMessage({
              type: 'poll-update',
              state: serializableState,
            });
            // Don't send setup-config when poll is active to avoid conflicting options
          } else {
            // Send setup config for preview - use stored config (always initialized now)
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
          const command = event.data.command as 'start' | 'stop' | 'reset';
          if (commandHandlersRef.current) {
            commandHandlersRef.current[command]();
          }
        } else if (event.data.type === 'config-update') {
          // Handle config updates from popup
          const config = event.data.config as SetupConfig;
          console.log('[usePoll] Received config-update from popup:', config);
          setupConfigRef.current = config;
          // Notify the callback (PollPage) about the config change
          if (configUpdateCallbackRef.current) {
            configUpdateCallbackRef.current(config);
          }
        } else if (event.data.type === 'reconnect') {
          // Handle reconnect request from popup
          console.log('[usePoll] Received reconnect request from popup');
          console.log('[usePoll] reconnectCallbackRef.current:', !!reconnectCallbackRef.current);
          if (reconnectCallbackRef.current) {
            console.log('[usePoll] Calling reconnect callback');
            reconnectCallbackRef.current();
          } else {
            console.log('[usePoll] No reconnect callback registered yet');
          }
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e);
    }

    return () => {
      channelRef.current?.close();
    };
  }, []);

  // Broadcast poll state changes
  const broadcastPollState = useCallback((state: PollState) => {
    if (!channelRef.current) return;
    
    // Don't broadcast if poll hasn't been configured yet (no options)
    // The setup config will be used instead for preview
    if (!state.isRunning && !state.finished && state.options.length === 0) {
      return;
    }
    
    const hasVotes = Object.values(state.votes).some(v => v > 0);
    const serializableState: SerializablePollState = {
      isRunning: state.isRunning,
      finished: state.finished || (!state.isRunning && state.options.length > 0 && hasVotes),
      question: state.question,
      options: state.options,
      votes: state.votes,
      votersArray: Array.from(state.voters),
      timer: state.timer,
      timeLeft: state.timeLeft,
    };

    channelRef.current.postMessage({
      type: 'poll-update',
      state: serializableState,
    });
  }, []);

  // Broadcast state on changes - but ONLY when poll is actually running or finished
  // NOT just when it has options, as setupConfig should never populate pollState
  // DISABLED: Automatic broadcasting is causing oscillation issues
  // Instead, only respond to explicit request-state messages
  /*
  useEffect(() => {
    // Only broadcast when poll has been explicitly started (isRunning=true) or finished
    // This prevents broadcasting setup config as if it were poll state
    if (pollState.isRunning || pollState.finished) {
      console.log('[usePoll] Broadcasting poll state (isRunning or finished):', pollState.options);
      broadcastPollState(pollState);
    }
  }, [pollState, broadcastPollState]);
  */

  // Broadcast setup config changes (for preview in popup)
  // This ONLY updates the ref - actual broadcast happens on request-state
  const broadcastSetupConfig = useCallback((config: SetupConfig, fullOptions?: { allOptions: string[]; selectedOptions: boolean[] }) => {
    console.log('[usePoll] broadcastSetupConfig called - OLD:', setupConfigRef.current.options, 'NEW:', config.options);
    
    // Only update if the config actually changed (prevent unnecessary updates)
    const currentConfig = setupConfigRef.current;
    const optionsChanged = JSON.stringify(currentConfig.options) !== JSON.stringify(config.options);
    const questionChanged = currentConfig.question !== config.question;
    const timerChanged = currentConfig.timer !== config.timer;
    
    if (optionsChanged || questionChanged || timerChanged) {
      console.log('[usePoll] Config changed, updating setupConfigRef');
      setupConfigRef.current = config;
    } else {
      console.log('[usePoll] Config unchanged, skipping update');
    }
    
    // Update full options config if provided
    if (fullOptions) {
      fullOptionsConfigRef.current = fullOptions;
    }
    
    // DON'T broadcast immediately - let request-state handle it
    // This prevents oscillation during initialization
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startPoll = useCallback((question: string, options: PollOption[], timer = POLL_TIMER.DEFAULT) => {
    console.log('[usePoll] startPoll called with options:', options);
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Options already have their IDs preserved from PollSetup
    const pollOptions: PollOption[] = options;
    const initialVotes: Record<number, number> = {};
    pollOptions.forEach(opt => {
      initialVotes[opt.id] = 0;
    });

    const newPollState = {
      isRunning: true,
      finished: false,
      question,
      options: pollOptions,
      votes: initialVotes,
      voters: new Set<string>(),
      timer,
      timeLeft: timer,
    };

    setPollState(newPollState);
    setVoteLog([]);

    // Manually broadcast since automatic broadcasting is disabled
    setTimeout(() => {
      if (channelRef.current) {
        const serializableState: SerializablePollState = {
          isRunning: true,
          finished: false,
          question,
          options: pollOptions,
          votes: initialVotes,
          votersArray: [],
          timer,
          timeLeft: timer,
        };
        channelRef.current.postMessage({
          type: 'poll-update',
          state: serializableState,
        });
      }
    }, 100);

    // Start countdown
    timerRef.current = setInterval(() => {
      setPollState(prev => {
        if (prev.timeLeft <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          const finishedState = { ...prev, isRunning: false, finished: true, timeLeft: 0 };
          
          // Broadcast finished state
          if (channelRef.current) {
            const serializableState: SerializablePollState = {
              isRunning: false,
              finished: true,
              question: prev.question,
              options: prev.options,
              votes: prev.votes,
              votersArray: Array.from(prev.voters),
              timer: prev.timer,
              timeLeft: 0,
            };
            channelRef.current.postMessage({
              type: 'poll-update',
              state: serializableState,
            });
          }
          
          return finishedState;
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
  }, []);

  const stopPoll = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setPollState(prev => {
      const stoppedState = { ...prev, isRunning: false, finished: true };
      
      // Manually broadcast stopped state
      if (channelRef.current) {
        const serializableState: SerializablePollState = {
          isRunning: false,
          finished: true,
          question: prev.question,
          options: prev.options,
          votes: prev.votes,
          votersArray: Array.from(prev.voters),
          timer: prev.timer,
          timeLeft: prev.timeLeft,
        };
        channelRef.current.postMessage({
          type: 'poll-update',
          state: serializableState,
        });
      }
      
      return stoppedState;
    });
  }, []);

  const resetPoll = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setPollState(initialPollState);
    setVoteLog([]);
    
    // Manually broadcast reset state (back to no poll)
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'setup-config',
        config: setupConfigRef.current,
      });
    }
  }, []);

  // Set connection status and broadcast to popup
  const setConnectionStatus = useCallback((isConnected: boolean) => {
    connectionStatusRef.current = isConnected;
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'connection-status',
        isConnected,
      });
    }
  }, []);

  const openResultsPopup = useCallback(() => {
    // Check if popup is already open
    if (popupWindowRef.current && !popupWindowRef.current.closed) {
      popupWindowRef.current.focus();
      return;
    }

    // Calculate popup size and position
    // Width: 700px to fit content comfortably
    // Height: 900px to show up to 8 options + controls + status bar
    const width = 700;
    const height = 900;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    // Open popup with minimal chrome
    popupWindowRef.current = window.open(
      '/poll-results',
      'pollResultsPopup',
      `width=${width},height=${height},left=${left},top=${top},` +
      'toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes'
    );

    // Send initial state after a short delay to let popup load
    // Use pollStateRef to get the latest state
    setTimeout(() => {
      broadcastPollState(pollStateRef.current);
    }, 500);
  }, [broadcastPollState]);

  const processVote = useCallback((message: ChatMessage) => {
    setPollState(prev => {
      if (!prev.isRunning) return prev;

      const comment = message.comment.trim();
      const voteNumber = parseInt(comment);

      // Check if valid vote number - must match an existing option ID
      if (isNaN(voteNumber)) {
        return prev;
      }

      // Find the option with this ID (options preserve their original IDs)
      const option = prev.options.find(o => o.id === voteNumber);
      if (!option) {
        return prev; // Vote number doesn't match any option
      }

      // Check if user already voted
      if (prev.voters.has(message.uniqueId)) {
        return prev;
      }

      // Register vote
      const newVoters = new Set(prev.voters);
      newVoters.add(message.uniqueId);

      const newVotes = { ...prev.votes };
      newVotes[voteNumber] = (newVotes[voteNumber] || 0) + 1;

      // Add to vote log
      const entry: VoteEntry = {
        id: `${message.uniqueId}-${Date.now()}`,
        user: message,
        optionId: voteNumber,
        optionText: option.text,
        timestamp: new Date(),
      };
      setVoteLog(log => [...log.slice(-99), entry]); // Keep last 100 entries

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

  const getPercentage = useCallback((optionId: number) => {
    const totalVotes = getTotalVotes();
    if (totalVotes === 0) return 0;
    return Math.round((pollState.votes[optionId] / totalVotes) * 100);
  }, [pollState.votes, getTotalVotes]);

  // Register command handlers for popup communication
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
