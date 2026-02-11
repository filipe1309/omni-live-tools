import { useRef, useEffect, useCallback } from 'react';
import type { PollState, PollOption } from '@/types';

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
  countdown?: number;
}

// Setup config for preview broadcast
export interface SetupConfig {
  question: string;
  options: PollOption[];
  timer: number;
}

export interface FullOptionsConfig {
  allOptions: string[];
  selectedOptions: boolean[];
}

export type PollCommand = 'start' | 'stop' | 'reset';

export interface SyncCommandHandlers {
  start: () => void;
  stop: () => void;
  reset: () => void;
}

interface UsePollSyncOptions {
  /** Get current poll state - called during request-state */
  getCurrentState: () => PollState;
  /** Get current setup config */
  getSetupConfig: () => SetupConfig;
  /** Get full options config */
  getFullOptionsConfig: () => FullOptionsConfig | null;
  /** Get connection status */
  getConnectionStatus: () => boolean;
}

interface UsePollSyncReturn {
  /** Broadcast poll state update */
  broadcastPollState: (state: PollState) => void;
  /** Broadcast setup config for preview */
  broadcastSetupConfig: () => void;
  /** Broadcast connection status change */
  broadcastConnectionStatus: (isConnected: boolean) => void;
  /** Register command handlers (start/stop/reset) */
  setCommandHandlers: (handlers: SyncCommandHandlers) => void;
  /** Register callback for config updates from popup */
  onConfigUpdate: (callback: (config: SetupConfig) => void) => void;
  /** Register callback for reconnect requests */
  onReconnect: (callback: () => void) => void;
  /** Check if channel is active */
  isChannelActive: () => boolean;
}

const CHANNEL_NAME = 'poll-results-channel';

/** Converts PollState to serializable format for BroadcastChannel */
export function toSerializableState (
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

export function usePollSync (options: UsePollSyncOptions): UsePollSyncReturn {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const commandHandlersRef = useRef<SyncCommandHandlers | null>(null);
  const configUpdateCallbackRef = useRef<((config: SetupConfig) => void) | null>(null);
  const reconnectCallbackRef = useRef<(() => void) | null>(null);
  const optionsRef = useRef(options);

  // Keep options ref updated
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Initialize BroadcastChannel
  useEffect(() => {
    // Prevent duplicate listeners in React Strict Mode
    if (channelRef.current) {
      return;
    }

    try {
      channelRef.current = new BroadcastChannel(CHANNEL_NAME);

      channelRef.current.onmessage = (event) => {
        const { getCurrentState, getSetupConfig, getFullOptionsConfig, getConnectionStatus } =
          optionsRef.current;

        if (event.data.type === 'request-state') {
          const currentState = getCurrentState();

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
              config: getSetupConfig(),
              fullOptions: getFullOptionsConfig(),
            });
          }

          // Broadcast connection status
          channelRef.current?.postMessage({
            type: 'connection-status',
            isConnected: getConnectionStatus(),
          });
        } else if (event.data.type === 'poll-command') {
          const command = event.data.command as PollCommand;
          if (commandHandlersRef.current) {
            commandHandlersRef.current[command]();
          }
        } else if (event.data.type === 'config-update') {
          const config = event.data.config as SetupConfig;
          console.log('[usePollSync] Received config-update from popup:', config);
          if (configUpdateCallbackRef.current) {
            configUpdateCallbackRef.current(config);
          }
        } else if (event.data.type === 'reconnect') {
          console.log('[usePollSync] Received reconnect request from popup');
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

  const broadcastPollState = useCallback((state: PollState) => {
    if (!channelRef.current) return;

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
  }, []);

  const broadcastSetupConfig = useCallback(() => {
    if (!channelRef.current) return;

    const { getSetupConfig, getFullOptionsConfig } = optionsRef.current;
    channelRef.current.postMessage({
      type: 'setup-config',
      config: getSetupConfig(),
      fullOptions: getFullOptionsConfig(),
    });
  }, []);

  const broadcastConnectionStatus = useCallback((isConnected: boolean) => {
    if (!channelRef.current) return;

    channelRef.current.postMessage({
      type: 'connection-status',
      isConnected,
    });
  }, []);

  const setCommandHandlers = useCallback((handlers: SyncCommandHandlers) => {
    commandHandlersRef.current = handlers;
  }, []);

  const onConfigUpdate = useCallback((callback: (config: SetupConfig) => void) => {
    configUpdateCallbackRef.current = callback;
  }, []);

  const onReconnect = useCallback((callback: () => void) => {
    reconnectCallbackRef.current = callback;
  }, []);

  const isChannelActive = useCallback(() => channelRef.current !== null, []);

  return {
    broadcastPollState,
    broadcastSetupConfig,
    broadcastConnectionStatus,
    setCommandHandlers,
    onConfigUpdate,
    onReconnect,
    isChannelActive,
  };
}
