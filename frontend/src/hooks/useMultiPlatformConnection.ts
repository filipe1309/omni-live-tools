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
  // Twitch-specific handlers
  onTwitchChat?: (message: UnifiedChatMessage) => void;
  onTwitchSub?: (data: unknown) => void;
  onTwitchResub?: (data: unknown) => void;
  onTwitchRaid?: (data: unknown) => void;
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
  // Combined state
  isAnyConnected: boolean;
  connectedPlatforms: PlatformType[];
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
      if (wasConnectedToTikTokRef.current || wasConnectedToTwitchRef.current) {
        console.info('[MultiPlatform] Socket reconnected - triggering onSocketReconnect');
        handlersRef.current.onSocketReconnect?.();
      }
    });

    socket.on('disconnect', () => {
      console.warn('[MultiPlatform] Socket disconnected!');
      setTikTokState(prev => ({ ...prev, status: 'disconnected' }));
      setTwitchState(prev => ({ ...prev, status: 'disconnected' }));
    });

    socket.io.on('reconnect', () => {
      console.info('[MultiPlatform] Socket.IO reconnected!');
      if (wasConnectedToTikTokRef.current || wasConnectedToTwitchRef.current) {
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

  // Computed properties
  const tiktokConnected = tiktokState.status === 'connected';
  const twitchConnected = twitchState.status === 'connected';
  const connectedPlatforms: PlatformType[] = [];
  if (tiktokConnected) connectedPlatforms.push('tiktok' as PlatformType);
  if (twitchConnected) connectedPlatforms.push('twitch' as PlatformType);

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
    isAnyConnected: tiktokConnected || twitchConnected,
    connectedPlatforms,
  };
}
