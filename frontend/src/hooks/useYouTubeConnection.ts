import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { YouTubeConnectionState, UnifiedChatMessage } from '@/types';

export type YouTubeConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface YouTubeConnectionHookState {
  status: YouTubeConnectionStatus;
  videoId: string | null;
  channelName: string | null;
  error: string | null;
}

interface YouTubeEventHandlers {
  onChat?: (message: UnifiedChatMessage) => void;
  onSuperchat?: (data: unknown) => void;
  onMember?: (data: unknown) => void;
  onStreamEnd?: () => void;
  onDisconnect?: () => void;
  onSocketReconnect?: () => void;
}

interface UseYouTubeConnectionReturn extends YouTubeConnectionHookState {
  connect: (videoIdOrUrl: string) => Promise<YouTubeConnectionState>;
  disconnect: () => void;
  isConnected: boolean;
  socket: Socket | null;
}

/**
 * Hook for managing YouTube live chat connection
 * Follows the same pattern as useTikTokConnection and useTwitchConnection
 */
export function useYouTubeConnection(
  handlers: YouTubeEventHandlers = {},
  existingSocket?: Socket | null
): UseYouTubeConnectionReturn {
  const socketRef = useRef<Socket | null>(existingSocket || null);
  const handlersRef = useRef(handlers);
  const wasConnectedToYouTubeRef = useRef(false);
  const ownsSocket = useRef(!existingSocket);
  
  const [state, setState] = useState<YouTubeConnectionHookState>({
    status: 'disconnected',
    videoId: null,
    channelName: null,
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
      console.info('[YouTube] Socket connected!');
      if (wasConnectedToYouTubeRef.current) {
        console.info('[YouTube] Socket reconnected after being connected to YouTube - triggering onSocketReconnect');
        handlersRef.current.onSocketReconnect?.();
      }
    });

    socket.on('disconnect', () => {
      console.warn('[YouTube] Socket disconnected!');
      setState(prev => ({ ...prev, status: 'disconnected' }));
      handlersRef.current.onDisconnect?.();
    });

    socket.io.on('reconnect', () => {
      console.info('[YouTube] Socket.IO reconnected!');
      if (wasConnectedToYouTubeRef.current) {
        console.info('[YouTube] Was connected to YouTube before - triggering onSocketReconnect');
        handlersRef.current.onSocketReconnect?.();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [existingSocket]);

  // Set up YouTube event listeners
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleYouTubeDisconnected = (errMsg: string) => {
      console.warn('[YouTube] YouTube disconnected:', errMsg);
      setState(prev => ({ ...prev, status: 'disconnected', videoId: null, channelName: null }));
      handlersRef.current.onDisconnect?.();
      if (socket.connected && wasConnectedToYouTubeRef.current) {
        console.info('[YouTube] Socket still connected, triggering onSocketReconnect for YouTube reconnection');
        handlersRef.current.onSocketReconnect?.();
      }
    };

    // Unified chat event (from SocketHandler)
    const handleChat = (msg: UnifiedChatMessage) => {
      // Only process YouTube messages
      if (msg.platform === 'youtube') {
        handlersRef.current.onChat?.(msg);
      }
    };

    // YouTube-specific chat event
    const handleYouTubeChat = (msg: UnifiedChatMessage) => {
      handlersRef.current.onChat?.(msg);
    };

    const handleSuperchat = (data: unknown) => {
      handlersRef.current.onSuperchat?.(data);
    };

    const handleMember = (data: unknown) => {
      handlersRef.current.onMember?.(data);
    };

    const handleStreamEnd = () => {
      console.warn('[YouTube] YouTube stream ended!');
      handlersRef.current.onStreamEnd?.();
      setState(prev => ({ ...prev, status: 'disconnected', videoId: null, channelName: null }));
    };

    socket.on('youtubeDisconnected', handleYouTubeDisconnected);
    socket.on('chat', handleChat);
    socket.on('youtubeChat', handleYouTubeChat);
    socket.on('youtubeSuperchat', handleSuperchat);
    socket.on('youtubeMember', handleMember);
    socket.on('youtubeStreamEnd', handleStreamEnd);

    return () => {
      socket.off('youtubeDisconnected', handleYouTubeDisconnected);
      socket.off('chat', handleChat);
      socket.off('youtubeChat', handleYouTubeChat);
      socket.off('youtubeSuperchat', handleSuperchat);
      socket.off('youtubeMember', handleMember);
      socket.off('youtubeStreamEnd', handleStreamEnd);
    };
  }, [existingSocket]);

  const connect = useCallback(
    (videoIdOrUrl: string): Promise<YouTubeConnectionState> => {
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

        // Send video ID or URL
        const trimmed = videoIdOrUrl.trim();
        socket.emit('setYouTubeVideo', trimmed);

        const timeout = setTimeout(() => {
          reject('Connection Timeout');
          setState(prev => ({ ...prev, status: 'error', error: 'Connection Timeout' }));
        }, 30000); // YouTube connections may take longer

        const handleConnected = (connectionState: YouTubeConnectionState) => {
          clearTimeout(timeout);
          socket.off('youtubeDisconnected', handleDisconnected);
          wasConnectedToYouTubeRef.current = true;
          setState(prev => ({
            ...prev,
            status: 'connected',
            videoId: connectionState.videoId,
            channelName: connectionState.channelName,
            error: null,
          }));
          resolve(connectionState);
        };

        const handleDisconnected = (errorMessage: string) => {
          clearTimeout(timeout);
          socket.off('youtubeConnected', handleConnected);
          setState(prev => ({
            ...prev,
            status: 'error',
            error: errorMessage,
          }));
          reject(errorMessage);
        };

        socket.once('youtubeConnected', handleConnected);
        socket.once('youtubeDisconnected', handleDisconnected);
      });
    },
    []
  );

  const disconnect = useCallback(() => {
    const socket = socketRef.current;
    if (socket) {
      socket.emit('disconnectYouTube');
    }
    wasConnectedToYouTubeRef.current = false;
    setState({
      status: 'disconnected',
      videoId: null,
      channelName: null,
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
