import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { TwitchConnectionState, UnifiedChatMessage } from '@/types';

export type TwitchConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface TwitchConnectionHookState {
  status: TwitchConnectionStatus;
  channel: string | null;
  error: string | null;
}

interface TwitchEventHandlers {
  onChat?: (message: UnifiedChatMessage) => void;
  onSub?: (data: unknown) => void;
  onResub?: (data: unknown) => void;
  onRaid?: (data: unknown) => void;
  onDisconnect?: () => void;
  onSocketReconnect?: () => void;
}

interface UseTwitchConnectionReturn extends TwitchConnectionHookState {
  connect: (channel: string) => Promise<TwitchConnectionState>;
  disconnect: () => void;
  isConnected: boolean;
  socket: Socket | null;
}

/**
 * Hook for managing Twitch chat connection
 * Follows the same pattern as useTikTokConnection for consistency
 */
export function useTwitchConnection(
  handlers: TwitchEventHandlers = {},
  existingSocket?: Socket | null
): UseTwitchConnectionReturn {
  const socketRef = useRef<Socket | null>(existingSocket || null);
  const handlersRef = useRef(handlers);
  const wasConnectedToTwitchRef = useRef(false);
  const ownsSocket = useRef(!existingSocket);
  
  const [state, setState] = useState<TwitchConnectionHookState>({
    status: 'disconnected',
    channel: null,
    error: null,
  });

  // Keep handlers ref up to date
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  // Update socket ref if existingSocket changes
  useEffect(() => {
    if (existingSocket) {
      socketRef.current = existingSocket;
      ownsSocket.current = false;
    }
  }, [existingSocket]);

  // Initialize socket connection (only if no existing socket provided)
  useEffect(() => {
    // If we have an existing socket, use that instead
    if (existingSocket) {
      return;
    }

    const backendUrl = import.meta.env.DEV ? undefined : undefined;
    const socket = io(backendUrl);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.info('[Twitch] Socket connected!');
      if (wasConnectedToTwitchRef.current) {
        console.info('[Twitch] Socket reconnected after being connected to Twitch - triggering onSocketReconnect');
        handlersRef.current.onSocketReconnect?.();
      }
    });

    socket.on('disconnect', () => {
      console.warn('[Twitch] Socket disconnected!');
      setState(prev => ({ ...prev, status: 'disconnected' }));
      handlersRef.current.onDisconnect?.();
    });

    socket.io.on('reconnect', () => {
      console.info('[Twitch] Socket.IO reconnected!');
      if (wasConnectedToTwitchRef.current) {
        console.info('[Twitch] Was connected to Twitch before - triggering onSocketReconnect');
        handlersRef.current.onSocketReconnect?.();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [existingSocket]);

  // Set up Twitch event listeners
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleTwitchDisconnected = (errMsg: string) => {
      console.warn('[Twitch] Twitch disconnected:', errMsg);
      setState(prev => ({ ...prev, status: 'disconnected', channel: null }));
      handlersRef.current.onDisconnect?.();
      if (socket.connected && wasConnectedToTwitchRef.current) {
        console.info('[Twitch] Socket still connected, triggering onSocketReconnect for Twitch reconnection');
        handlersRef.current.onSocketReconnect?.();
      }
    };

    // Unified chat event (from SocketHandler)
    const handleChat = (msg: UnifiedChatMessage) => {
      // Only process Twitch messages
      if (msg.platform === 'twitch') {
        handlersRef.current.onChat?.(msg);
      }
    };

    // Twitch-specific chat event (backwards compatibility)
    const handleTwitchChat = (msg: UnifiedChatMessage) => {
      handlersRef.current.onChat?.(msg);
    };

    const handleSub = (data: unknown) => {
      handlersRef.current.onSub?.(data);
    };

    const handleResub = (data: unknown) => {
      handlersRef.current.onResub?.(data);
    };

    const handleRaid = (data: unknown) => {
      handlersRef.current.onRaid?.(data);
    };

    socket.on('twitchDisconnected', handleTwitchDisconnected);
    socket.on('chat', handleChat);
    socket.on('twitchChat', handleTwitchChat);
    socket.on('twitchSub', handleSub);
    socket.on('twitchResub', handleResub);
    socket.on('twitchRaid', handleRaid);

    return () => {
      socket.off('twitchDisconnected', handleTwitchDisconnected);
      socket.off('chat', handleChat);
      socket.off('twitchChat', handleTwitchChat);
      socket.off('twitchSub', handleSub);
      socket.off('twitchResub', handleResub);
      socket.off('twitchRaid', handleRaid);
    };
  }, [existingSocket]);

  const connect = useCallback(
    (channel: string): Promise<TwitchConnectionState> => {
      return new Promise((resolve, reject) => {
        const socket = socketRef.current;
        if (!socket) {
          reject('Socket not initialized');
          return;
        }

        setState(prev => ({
          ...prev,
          status: 'connecting',
          error: null,
        }));

        // Normalize channel name
        const normalizedChannel = channel.replace(/^#/, '').toLowerCase().trim();
        
        socket.emit('setTwitchChannel', normalizedChannel);

        const timeout = setTimeout(() => {
          reject('Connection Timeout');
          setState(prev => ({ ...prev, status: 'error', error: 'Connection Timeout' }));
        }, 15000);

        const handleConnected = (connectionState: TwitchConnectionState) => {
          clearTimeout(timeout);
          socket.off('twitchDisconnected', handleDisconnected);
          wasConnectedToTwitchRef.current = true;
          setState(prev => ({
            ...prev,
            status: 'connected',
            channel: connectionState.channel,
            error: null,
          }));
          resolve(connectionState);
        };

        const handleDisconnected = (errorMessage: string) => {
          clearTimeout(timeout);
          socket.off('twitchConnected', handleConnected);
          setState(prev => ({
            ...prev,
            status: 'error',
            error: errorMessage,
          }));
          reject(errorMessage);
        };

        socket.once('twitchConnected', handleConnected);
        socket.once('twitchDisconnected', handleDisconnected);
      });
    },
    []
  );

  const disconnect = useCallback(() => {
    // Only disconnect socket if we own it
    if (ownsSocket.current) {
      socketRef.current?.disconnect();
    }
    wasConnectedToTwitchRef.current = false;
    setState({
      status: 'disconnected',
      channel: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    isConnected: state.status === 'connected',
    socket: socketRef.current,
  };
}
