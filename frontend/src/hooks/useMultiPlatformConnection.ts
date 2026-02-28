import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  RoomState,
  ChatMessage,
  GiftMessage,
  LikeMessage,
  MemberMessage,
  RoomUserMessage,
  SocialMessage,
  ConnectionOptions,
  TwitchConnectionState,
  YouTubeConnectionState,
  KickConnectionState,
  UnifiedChatMessage,
  PlatformType,
} from '@/types';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface TikTokState {
  status: ConnectionStatus;
  roomId: string | null;
  error: string | null;
  viewerCount: number;
  likeCount: number;
  diamondsCount: number;
}

interface TwitchState {
  status: ConnectionStatus;
  channel: string | null;
  error: string | null;
}

interface YouTubeState {
  status: ConnectionStatus;
  videoId: string | null;
  channelName: string | null;
  error: string | null;
}

interface KickState {
  status: ConnectionStatus;
  channel: string | null;
  error: string | null;
}

interface MultiPlatformEventHandlers {
  // Unified chat handler (receives messages from both platforms)
  onChat?: (message: UnifiedChatMessage) => void;
  // TikTok-specific handlers
  onTikTokChat?: (message: ChatMessage) => void;
  onGift?: (message: GiftMessage) => void;
  onLike?: (message: LikeMessage) => void;
  onMember?: (message: MemberMessage) => void;
  onRoomUser?: (message: RoomUserMessage) => void;
  onSocial?: (message: SocialMessage) => void;
  onTikTokStreamEnd?: () => void;
  onTikTokReconnect?: (state: RoomState) => void;
  // Twitch-specific handlers
  onTwitchChat?: (message: UnifiedChatMessage) => void;
  onTwitchSub?: (data: unknown) => void;
  onTwitchResub?: (data: unknown) => void;
  onTwitchRaid?: (data: unknown) => void;
  onTwitchReconnect?: (state: TwitchConnectionState) => void;
  // YouTube-specific handlers
  onYouTubeChat?: (message: UnifiedChatMessage) => void;
  onYouTubeSuperchat?: (data: unknown) => void;
  onYouTubeMember?: (data: unknown) => void;
  onYouTubeStreamEnd?: () => void;
  onYouTubeReconnect?: (state: YouTubeConnectionState) => void;
  // Kick-specific handlers
  onKickChat?: (message: UnifiedChatMessage) => void;
  onKickSub?: (data: unknown) => void;
  onKickGiftedSub?: (data: unknown) => void;
  onKickStreamEnd?: () => void;
  onKickReconnect?: (state: KickConnectionState) => void;
  // General handlers
  onDisconnect?: (platform: PlatformType) => void;
  onSocketReconnect?: () => void;
}

interface UseMultiPlatformConnectionReturn {
  // TikTok state and methods
  tiktok: TikTokState & {
    connect: (uniqueId: string, options?: ConnectionOptions) => Promise<RoomState>;
    disconnect: () => void;
    isConnected: boolean;
  };
  // Twitch state and methods
  twitch: TwitchState & {
    connect: (channel: string) => Promise<TwitchConnectionState>;
    disconnect: () => void;
    isConnected: boolean;
  };
  // YouTube state and methods
  youtube: YouTubeState & {
    connect: (videoIdOrUrl: string) => Promise<YouTubeConnectionState>;
    disconnect: () => void;
    isConnected: boolean;
  };
  // Kick state and methods
  kick: KickState & {
    connect: (channel: string) => Promise<KickConnectionState>;
    disconnect: () => void;
    isConnected: boolean;
  };
  // Combined state
  isAnyConnected: boolean;
  connectedPlatforms: PlatformType[];
  // Chat relay methods for overlay communication
  joinChatRelay: () => void;
  leaveChatRelay: () => void;
  emitChatRelay: (data: unknown) => void;
  onChatRelayUpdate: (callback: (data: unknown) => void) => () => void;
  // Platform events room - allows overlay to receive events from any connected platform
  joinPlatformEvents: () => void;
  leavePlatformEvents: () => void;
}

/**
 * Hook for managing connections to multiple streaming platforms (TikTok + Twitch)
 * Uses a single socket connection for efficiency
 */
export function useMultiPlatformConnection (
  handlers: MultiPlatformEventHandlers = {}
): UseMultiPlatformConnectionReturn {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef(handlers);
  const wasConnectedToTikTokRef = useRef(false);
  const wasConnectedToTwitchRef = useRef(false);
  const wasConnectedToYouTubeRef = useRef(false);
  const wasConnectedToKickRef = useRef(false);

  const [tiktokState, setTikTokState] = useState<TikTokState>({
    status: 'disconnected',
    roomId: null,
    error: null,
    viewerCount: 0,
    likeCount: 0,
    diamondsCount: 0,
  });

  const [twitchState, setTwitchState] = useState<TwitchState>({
    status: 'disconnected',
    channel: null,
    error: null,
  });

  const [youtubeState, setYouTubeState] = useState<YouTubeState>({
    status: 'disconnected',
    videoId: null,
    channelName: null,
    error: null,
  });

  const [kickState, setKickState] = useState<KickState>({
    status: 'disconnected',
    channel: null,
    error: null,
  });

  // Keep handlers ref up to date
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  // Initialize socket connection
  useEffect(() => {
    const backendUrl = import.meta.env.DEV ? undefined : undefined;
    const socket = io(backendUrl);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.info('[MultiPlatform] Socket connected!');
      // Trigger reconnect callbacks if we were previously connected
      if (wasConnectedToTikTokRef.current || wasConnectedToTwitchRef.current || wasConnectedToYouTubeRef.current || wasConnectedToKickRef.current) {
        console.info('[MultiPlatform] Socket reconnected - triggering onSocketReconnect');
        handlersRef.current.onSocketReconnect?.();
      }
    });

    socket.on('disconnect', () => {
      console.warn('[MultiPlatform] Socket disconnected!');
      setTikTokState(prev => ({ ...prev, status: 'disconnected' }));
      setTwitchState(prev => ({ ...prev, status: 'disconnected' }));
      setYouTubeState(prev => ({ ...prev, status: 'disconnected' }));
      setKickState(prev => ({ ...prev, status: 'disconnected' }));
    });

    socket.io.on('reconnect', () => {
      console.info('[MultiPlatform] Socket.IO reconnected!');
      if (wasConnectedToTikTokRef.current || wasConnectedToTwitchRef.current || wasConnectedToYouTubeRef.current || wasConnectedToKickRef.current) {
        handlersRef.current.onSocketReconnect?.();
      }
    });

    // ============ TikTok Events ============
    socket.on('streamEnd', () => {
      console.warn('[MultiPlatform] TikTok LIVE has ended!');
      handlersRef.current.onTikTokStreamEnd?.();
      handlersRef.current.onDisconnect?.('tiktok' as PlatformType);
      setTikTokState(prev => ({ ...prev, status: 'disconnected', roomId: null }));
    });

    socket.on('tiktokDisconnected', (errMsg: string) => {
      console.warn('[MultiPlatform] TikTok disconnected:', errMsg);
      setTikTokState(prev => ({ ...prev, status: 'disconnected', roomId: null }));
      handlersRef.current.onDisconnect?.('tiktok' as PlatformType);
    });

    socket.on('tiktokReconnected', (state: RoomState) => {
      console.info('[MultiPlatform] TikTok reconnected:', state);
      setTikTokState(prev => ({
        ...prev,
        status: 'connected',
        roomId: state.roomId,
        error: null,
      }));
      handlersRef.current.onTikTokReconnect?.(state);
    });

    socket.on('chat', (msg: ChatMessage) => {
      // TikTok chat (original format)
      console.log('[MultiPlatform] Received TikTok chat:', msg);
      handlersRef.current.onTikTokChat?.(msg);

      // Convert to unified format for onChat
      if (handlersRef.current.onChat) {
        const unified: UnifiedChatMessage = {
          platform: 'tiktok' as PlatformType,
          odlUserId: msg.userId,
          username: msg.uniqueId,
          displayName: msg.nickname,
          message: msg.comment,
          timestamp: msg.timestamp || Date.now(),
          profilePictureUrl: msg.profilePictureUrl,
          badges: msg.userBadges?.map(b => ({ id: b.type, name: b.name })),
          isMod: msg.isModerator,
          isSubscriber: msg.isSubscriber,
        };
        handlersRef.current.onChat(unified);
      }
    });

    socket.on('gift', (msg: GiftMessage) => {
      handlersRef.current.onGift?.(msg);

      // Update diamonds count for non-pending streaks
      if (msg.giftType !== 1 || msg.repeatEnd) {
        if (msg.diamondCount > 0) {
          setTikTokState(prev => ({
            ...prev,
            diamondsCount: prev.diamondsCount + (msg.diamondCount * msg.repeatCount),
          }));
        }
      }
    });

    socket.on('like', (msg: LikeMessage) => {
      handlersRef.current.onLike?.(msg);
      if (typeof msg.totalLikeCount === 'number') {
        setTikTokState(prev => ({ ...prev, likeCount: msg.totalLikeCount }));
      }
    });

    socket.on('member', (msg: MemberMessage) => {
      handlersRef.current.onMember?.(msg);
    });

    socket.on('roomUser', (msg: RoomUserMessage) => {
      handlersRef.current.onRoomUser?.(msg);
      if (typeof msg.viewerCount === 'number') {
        setTikTokState(prev => ({ ...prev, viewerCount: msg.viewerCount }));
      }
    });

    socket.on('social', (msg: SocialMessage) => {
      handlersRef.current.onSocial?.(msg);
    });

    // ============ Twitch Events ============
    socket.on('twitchDisconnected', (errMsg: string) => {
      console.warn('[MultiPlatform] Twitch disconnected:', errMsg);
      setTwitchState(prev => ({ ...prev, status: 'disconnected', channel: null }));
      handlersRef.current.onDisconnect?.('twitch' as PlatformType);
    });

    socket.on('twitchReconnected', (state: TwitchConnectionState) => {
      console.info('[MultiPlatform] Twitch reconnected:', state);
      setTwitchState(prev => ({
        ...prev,
        status: 'connected',
        channel: state.channel,
        error: null,
      }));
      handlersRef.current.onTwitchReconnect?.(state);
    });

    socket.on('twitchChat', (msg: UnifiedChatMessage) => {
      console.log('[MultiPlatform] Received Twitch chat:', msg);
      handlersRef.current.onTwitchChat?.(msg);
      handlersRef.current.onChat?.(msg);
    });

    socket.on('twitchSub', (data: unknown) => {
      handlersRef.current.onTwitchSub?.(data);
    });

    socket.on('twitchResub', (data: unknown) => {
      handlersRef.current.onTwitchResub?.(data);
    });

    socket.on('twitchRaid', (data: unknown) => {
      handlersRef.current.onTwitchRaid?.(data);
    });

    // ============ YouTube Events ============
    socket.on('youtubeDisconnected', (errMsg: string) => {
      console.warn('[MultiPlatform] YouTube disconnected:', errMsg);
      setYouTubeState(prev => ({ ...prev, status: 'disconnected', videoId: null, channelName: null }));
      handlersRef.current.onDisconnect?.('youtube' as PlatformType);
    });

    socket.on('youtubeReconnected', (state: YouTubeConnectionState) => {
      console.info('[MultiPlatform] YouTube reconnected:', state);
      setYouTubeState(prev => ({
        ...prev,
        status: 'connected',
        videoId: state.videoId,
        channelName: state.channelName,
        error: null,
      }));
      handlersRef.current.onYouTubeReconnect?.(state);
    });

    socket.on('youtubeChat', (msg: UnifiedChatMessage) => {
      console.log('[MultiPlatform] Received YouTube chat:', msg);
      handlersRef.current.onYouTubeChat?.(msg);
      handlersRef.current.onChat?.(msg);
    });

    socket.on('youtubeSuperchat', (data: unknown) => {
      handlersRef.current.onYouTubeSuperchat?.(data);
    });

    socket.on('youtubeMember', (data: unknown) => {
      handlersRef.current.onYouTubeMember?.(data);
    });

    socket.on('youtubeStreamEnd', () => {
      console.warn('[MultiPlatform] YouTube stream ended!');
      handlersRef.current.onYouTubeStreamEnd?.();
      handlersRef.current.onDisconnect?.('youtube' as PlatformType);
      setYouTubeState(prev => ({ ...prev, status: 'disconnected', videoId: null, channelName: null }));
    });

    // ============ Kick Events ============
    socket.on('kickDisconnected', (errMsg: string) => {
      console.warn('[MultiPlatform] Kick disconnected:', errMsg);
      setKickState(prev => ({ ...prev, status: 'disconnected', channel: null }));
      handlersRef.current.onDisconnect?.('kick' as PlatformType);
    });

    socket.on('kickReconnected', (state: KickConnectionState) => {
      console.info('[MultiPlatform] Kick reconnected:', state);
      setKickState(prev => ({
        ...prev,
        status: 'connected',
        channel: state.channel,
        error: null,
      }));
      handlersRef.current.onKickReconnect?.(state);
    });

    socket.on('kickChat', (msg: UnifiedChatMessage) => {
      console.log('[MultiPlatform] Received Kick chat:', msg);
      handlersRef.current.onKickChat?.(msg);
      handlersRef.current.onChat?.(msg);
    });

    socket.on('kickSub', (data: unknown) => {
      handlersRef.current.onKickSub?.(data);
    });

    socket.on('kickGiftedSub', (data: unknown) => {
      handlersRef.current.onKickGiftedSub?.(data);
    });

    socket.on('kickStreamEnd', () => {
      console.warn('[MultiPlatform] Kick stream ended!');
      handlersRef.current.onKickStreamEnd?.();
      handlersRef.current.onDisconnect?.('kick' as PlatformType);
      setKickState(prev => ({ ...prev, status: 'disconnected', channel: null }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // ============ TikTok Methods ============
  const connectTikTok = useCallback(
    (uniqueId: string, options: ConnectionOptions = {}): Promise<RoomState> => {
      return new Promise((resolve, reject) => {
        const socket = socketRef.current;
        if (!socket) {
          reject('Socket not initialized');
          return;
        }

        setTikTokState(prev => ({
          ...prev,
          status: 'connecting',
          error: null,
          viewerCount: 0,
          likeCount: 0,
          diamondsCount: 0,
        }));

        socket.emit('setUniqueId', uniqueId, { enableExtendedGiftInfo: true, ...options });

        const cleanup = () => {
          clearTimeout(timeout);
          socket.off('tiktokConnected', onConnected);
          socket.off('tiktokDisconnected', onDisconnected);
        };

        const onConnected = (roomState: RoomState) => {
          cleanup();
          wasConnectedToTikTokRef.current = true;
          setTikTokState(prev => ({
            ...prev,
            status: 'connected',
            roomId: roomState.roomId,
            error: null,
          }));
          resolve(roomState);
        };

        const onDisconnected = (errorMessage: string) => {
          cleanup();
          setTikTokState(prev => ({
            ...prev,
            status: 'error',
            error: errorMessage,
          }));
          reject(errorMessage);
        };

        const timeout = setTimeout(() => {
          cleanup();
          setTikTokState(prev => ({ ...prev, status: 'error', error: 'Connection Timeout' }));
          reject('Connection Timeout');
        }, 15000);

        socket.once('tiktokConnected', onConnected);
        socket.once('tiktokDisconnected', onDisconnected);
      });
    },
    []
  );

  const disconnectTikTok = useCallback(() => {
    wasConnectedToTikTokRef.current = false;
    // Emit disconnect event to backend
    socketRef.current?.emit('disconnectTikTok');
    setTikTokState({
      status: 'disconnected',
      roomId: null,
      error: null,
      viewerCount: 0,
      likeCount: 0,
      diamondsCount: 0,
    });
  }, []);

  // ============ Twitch Methods ============
  const connectTwitch = useCallback(
    (channel: string): Promise<TwitchConnectionState> => {
      return new Promise((resolve, reject) => {
        const socket = socketRef.current;
        if (!socket) {
          reject('Socket not initialized');
          return;
        }

        setTwitchState(prev => ({
          ...prev,
          status: 'connecting',
          error: null,
        }));

        // Normalize channel name
        const normalizedChannel = channel.replace(/^#/, '').toLowerCase().trim();
        socket.emit('setTwitchChannel', normalizedChannel);

        const cleanup = () => {
          clearTimeout(timeout);
          socket.off('twitchConnected', onConnected);
          socket.off('twitchDisconnected', onDisconnected);
        };

        const onConnected = (connectionState: TwitchConnectionState) => {
          cleanup();
          wasConnectedToTwitchRef.current = true;
          setTwitchState(prev => ({
            ...prev,
            status: 'connected',
            channel: connectionState.channel,
            error: null,
          }));
          resolve(connectionState);
        };

        const onDisconnected = (errorMessage: string) => {
          cleanup();
          setTwitchState(prev => ({
            ...prev,
            status: 'error',
            error: errorMessage,
          }));
          reject(errorMessage);
        };

        const timeout = setTimeout(() => {
          cleanup();
          setTwitchState(prev => ({ ...prev, status: 'error', error: 'Connection Timeout' }));
          reject('Connection Timeout');
        }, 15000);

        socket.once('twitchConnected', onConnected);
        socket.once('twitchDisconnected', onDisconnected);
      });
    },
    []
  );

  const disconnectTwitch = useCallback(() => {
    wasConnectedToTwitchRef.current = false;
    // Emit disconnect event to backend
    socketRef.current?.emit('disconnectTwitch');
    setTwitchState({
      status: 'disconnected',
      channel: null,
      error: null,
    });
  }, []);

  // ============ YouTube Methods ============
  const connectYouTube = useCallback(
    (videoIdOrUrl: string): Promise<YouTubeConnectionState> => {
      return new Promise((resolve, reject) => {
        const socket = socketRef.current;
        if (!socket) {
          reject('Socket not initialized');
          return;
        }

        setYouTubeState(prev => ({
          ...prev,
          status: 'connecting',
          error: null,
        }));

        // Send video ID or URL
        const trimmed = videoIdOrUrl.trim();
        socket.emit('setYouTubeVideo', trimmed);

        const cleanup = () => {
          clearTimeout(timeout);
          socket.off('youtubeConnected', onConnected);
          socket.off('youtubeDisconnected', onDisconnected);
        };

        const onConnected = (connectionState: YouTubeConnectionState) => {
          cleanup();
          wasConnectedToYouTubeRef.current = true;
          setYouTubeState(prev => ({
            ...prev,
            status: 'connected',
            videoId: connectionState.videoId,
            channelName: connectionState.channelName,
            error: null,
          }));
          resolve(connectionState);
        };

        const onDisconnected = (errorMessage: string) => {
          cleanup();
          setYouTubeState(prev => ({
            ...prev,
            status: 'error',
            error: errorMessage,
          }));
          reject(errorMessage);
        };

        const timeout = setTimeout(() => {
          cleanup();
          setYouTubeState(prev => ({ ...prev, status: 'error', error: 'Connection Timeout' }));
          reject('Connection Timeout');
        }, 30000); // YouTube connections may take longer

        socket.once('youtubeConnected', onConnected);
        socket.once('youtubeDisconnected', onDisconnected);
      });
    },
    []
  );

  const disconnectYouTube = useCallback(() => {
    wasConnectedToYouTubeRef.current = false;
    // Emit disconnect event to backend
    socketRef.current?.emit('disconnectYouTube');
    setYouTubeState({
      status: 'disconnected',
      videoId: null,
      channelName: null,
      error: null,
    });
  }, []);

  // ============ Kick Methods ============
  const connectKick = useCallback(
    (channel: string): Promise<KickConnectionState> => {
      return new Promise((resolve, reject) => {
        const socket = socketRef.current;
        if (!socket) {
          reject('Socket not initialized');
          return;
        }

        setKickState(prev => ({
          ...prev,
          status: 'connecting',
          error: null,
        }));

        // Normalize channel name
        const normalizedChannel = channel.toLowerCase().trim();
        socket.emit('setKickChannel', normalizedChannel);

        const cleanup = () => {
          clearTimeout(timeout);
          socket.off('kickConnected', onConnected);
          socket.off('kickDisconnected', onDisconnected);
        };

        const onConnected = (connectionState: KickConnectionState) => {
          cleanup();
          wasConnectedToKickRef.current = true;
          setKickState(prev => ({
            ...prev,
            status: 'connected',
            channel: connectionState.channel,
            error: null,
          }));
          resolve(connectionState);
        };

        const onDisconnected = (errorMessage: string) => {
          cleanup();
          setKickState(prev => ({
            ...prev,
            status: 'error',
            error: errorMessage,
          }));
          reject(errorMessage);
        };

        const timeout = setTimeout(() => {
          cleanup();
          setKickState(prev => ({ ...prev, status: 'error', error: 'Connection Timeout' }));
          reject('Connection Timeout');
        }, 15000);

        socket.once('kickConnected', onConnected);
        socket.once('kickDisconnected', onDisconnected);
      });
    },
    []
  );

  const disconnectKick = useCallback(() => {
    wasConnectedToKickRef.current = false;
    // Emit disconnect event to backend
    socketRef.current?.emit('disconnectKick');
    setKickState({
      status: 'disconnected',
      channel: null,
      error: null,
    });
  }, []);

  // Computed properties
  const tiktokConnected = tiktokState.status === 'connected';
  const twitchConnected = twitchState.status === 'connected';
  const youtubeConnected = youtubeState.status === 'connected';
  const kickConnected = kickState.status === 'connected';
  const connectedPlatforms: PlatformType[] = [];
  if (tiktokConnected) connectedPlatforms.push('tiktok' as PlatformType);
  if (twitchConnected) connectedPlatforms.push('twitch' as PlatformType);
  if (youtubeConnected) connectedPlatforms.push('youtube' as PlatformType);
  if (kickConnected) connectedPlatforms.push('kick' as PlatformType);

  // Chat relay methods for overlay communication
  const joinChatRelay = useCallback(() => {
    socketRef.current?.emit('join-chat-relay');
  }, []);

  const leaveChatRelay = useCallback(() => {
    socketRef.current?.emit('leave-chat-relay');
  }, []);

  const emitChatRelay = useCallback((data: unknown) => {
    socketRef.current?.emit('relay-chat-update', data);
  }, []);

  const onChatRelayUpdate = useCallback((callback: (data: unknown) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    
    socket.on('chat-relay-update', callback);
    return () => {
      socket.off('chat-relay-update', callback);
    };
  }, []);

  // Platform events room methods - allows overlay to receive events from any connected platform
  const joinPlatformEvents = useCallback(() => {
    socketRef.current?.emit('join-platform-events');
  }, []);

  const leavePlatformEvents = useCallback(() => {
    socketRef.current?.emit('leave-platform-events');
  }, []);

  return {
    tiktok: {
      ...tiktokState,
      connect: connectTikTok,
      disconnect: disconnectTikTok,
      isConnected: tiktokConnected,
    },
    twitch: {
      ...twitchState,
      connect: connectTwitch,
      disconnect: disconnectTwitch,
      isConnected: twitchConnected,
    },
    youtube: {
      ...youtubeState,
      connect: connectYouTube,
      disconnect: disconnectYouTube,
      isConnected: youtubeConnected,
    },
    kick: {
      ...kickState,
      connect: connectKick,
      disconnect: disconnectKick,
      isConnected: kickConnected,
    },
    isAnyConnected: tiktokConnected || twitchConnected || youtubeConnected || kickConnected,
    connectedPlatforms,
    joinChatRelay,
    leaveChatRelay,
    emitChatRelay,
    onChatRelayUpdate,
    joinPlatformEvents,
    leavePlatformEvents,
  };
}
