import { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';
import { useMultiPlatformConnection, useToast } from '@/hooks';
import { useLanguage, interpolate } from '@/i18n';
import type {
  PlatformType,
  ChatMessage,
  GiftMessage,
  LikeMessage,
  MemberMessage,
  SocialMessage,
  RoomUserMessage,
  UnifiedChatMessage,
} from '@/types';
import type { ConnectionStatus } from './useTikTokConnection';

interface ConnectionContextType {
  // TikTok state
  tiktok: {
    status: ConnectionStatus;
    roomId: string | null;
    error: string | null;
    viewerCount: number;
    likeCount: number;
    diamondsCount: number;
    isConnected: boolean;
    connect: (username: string) => Promise<void>;
    disconnect: () => void;
    username: string;
  };
  // Twitch state
  twitch: {
    status: ConnectionStatus;
    channel: string | null;
    error: string | null;
    isConnected: boolean;
    connect: (channel: string) => Promise<void>;
    disconnect: () => void;
    channelName: string;
  };
  // YouTube state
  youtube: {
    status: ConnectionStatus;
    videoId: string | null;
    channelName: string | null;
    error: string | null;
    isConnected: boolean;
    connect: (videoIdOrUrl: string) => Promise<void>;
    disconnect: () => void;
    videoInput: string;
  };
  // Combined state
  isAnyConnected: boolean;
  connectedPlatforms: PlatformType[];
  selectedPlatforms: PlatformType[];
  setSelectedPlatforms: (platforms: PlatformType[]) => void;
  // Input values
  setTikTokUsername: (username: string) => void;
  setTwitchChannel: (channel: string) => void;
  setYouTubeVideo: (videoIdOrUrl: string) => void;
  // Modal state
  showConnectionModal: boolean;
  setShowConnectionModal: (show: boolean) => void;
  // Auto-reconnect
  autoReconnect: boolean;
  setAutoReconnect: (enabled: boolean) => void;
  // Event registration for pages
  registerChatHandler: (handler: (msg: UnifiedChatMessage) => void) => () => void;
  registerTikTokChatHandler: (handler: (msg: ChatMessage) => void) => () => void;
  registerGiftHandler: (handler: (msg: GiftMessage) => void) => () => void;
  registerLikeHandler: (handler: (msg: LikeMessage) => void) => () => void;
  registerMemberHandler: (handler: (msg: MemberMessage) => void) => () => void;
  registerSocialHandler: (handler: (msg: SocialMessage) => void) => () => void;
  registerRoomUserHandler: (handler: (msg: RoomUserMessage) => void) => () => void;
  registerTwitchChatHandler: (handler: (msg: UnifiedChatMessage) => void) => () => void;
  registerYouTubeChatHandler: (handler: (msg: UnifiedChatMessage) => void) => () => void;
  registerDisconnectHandler: (handler: (platform: PlatformType) => void) => () => void;
  registerSocketReconnectHandler: (handler: () => void) => () => void;
  registerStreamEndHandler: (handler: () => void) => () => void;
  // Chat relay for overlay communication
  joinChatRelay: () => void;
  leaveChatRelay: () => void;
  emitChatRelay: (data: unknown) => void;
  onChatRelayUpdate: (callback: (data: unknown) => void) => () => void;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

interface ConnectionProviderProps {
  children: ReactNode;
}

export function ConnectionProvider ({ children }: ConnectionProviderProps) {
  const toast = useToast();
  const { t } = useLanguage();

  // Input state
  const [tiktokUsername, setTikTokUsername] = useState(() => {
    const saved = localStorage.getItem('shared-tiktok-username');
    return saved ? JSON.parse(saved) : 'jamesbonfim';
  });

  const [twitchChannel, setTwitchChannel] = useState(() => {
    const saved = localStorage.getItem('shared-twitch-channel');
    return saved ? JSON.parse(saved) : '';
  });

  const [youtubeVideo, setYouTubeVideo] = useState(() => {
    const saved = localStorage.getItem('shared-youtube-video');
    return saved ? JSON.parse(saved) : '';
  });

  // Modal state
  const [showConnectionModal, setShowConnectionModal] = useState(false);

  // Auto-reconnect state
  const [autoReconnect, setAutoReconnectState] = useState(() => {
    const saved = localStorage.getItem('shared-autoReconnect');
    return saved === 'true';
  });
  const autoReconnectRef = useRef(autoReconnect);
  useEffect(() => {
    autoReconnectRef.current = autoReconnect;
  }, [autoReconnect]);

  // Refs to track connection status for stream end handlers
  const tiktokConnectedRef = useRef(false);
  const twitchConnectedRef = useRef(false);
  const youtubeConnectedRef = useRef(false);

  const [selectedPlatforms, setSelectedPlatformsState] = useState<PlatformType[]>(() => {
    const saved = localStorage.getItem('shared-selected-platforms');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return ['tiktok'] as PlatformType[];
      }
    }
    return ['tiktok'] as PlatformType[];
  });

  // Event handlers registry
  const [chatHandlers] = useState<Set<(msg: UnifiedChatMessage) => void>>(() => new Set());
  const [tiktokChatHandlers] = useState<Set<(msg: ChatMessage) => void>>(() => new Set());
  const [giftHandlers] = useState<Set<(msg: GiftMessage) => void>>(() => new Set());
  const [likeHandlers] = useState<Set<(msg: LikeMessage) => void>>(() => new Set());
  const [memberHandlers] = useState<Set<(msg: MemberMessage) => void>>(() => new Set());
  const [socialHandlers] = useState<Set<(msg: SocialMessage) => void>>(() => new Set());
  const [roomUserHandlers] = useState<Set<(msg: RoomUserMessage) => void>>(() => new Set());
  const [twitchChatHandlers] = useState<Set<(msg: UnifiedChatMessage) => void>>(() => new Set());
  const [youtubeChatHandlers] = useState<Set<(msg: UnifiedChatMessage) => void>>(() => new Set());
  const [disconnectHandlers] = useState<Set<(platform: PlatformType) => void>>(() => new Set());
  const [socketReconnectHandlers] = useState<Set<() => void>>(() => new Set());
  const [streamEndHandlers] = useState<Set<() => void>>(() => new Set());

  // Create registration functions
  const registerChatHandler = useCallback((handler: (msg: UnifiedChatMessage) => void) => {
    chatHandlers.add(handler);
    return () => { chatHandlers.delete(handler); };
  }, [chatHandlers]);

  const registerTikTokChatHandler = useCallback((handler: (msg: ChatMessage) => void) => {
    tiktokChatHandlers.add(handler);
    return () => { tiktokChatHandlers.delete(handler); };
  }, [tiktokChatHandlers]);

  const registerGiftHandler = useCallback((handler: (msg: GiftMessage) => void) => {
    giftHandlers.add(handler);
    return () => { giftHandlers.delete(handler); };
  }, [giftHandlers]);

  const registerLikeHandler = useCallback((handler: (msg: LikeMessage) => void) => {
    likeHandlers.add(handler);
    return () => { likeHandlers.delete(handler); };
  }, [likeHandlers]);

  const registerMemberHandler = useCallback((handler: (msg: MemberMessage) => void) => {
    memberHandlers.add(handler);
    return () => { memberHandlers.delete(handler); };
  }, [memberHandlers]);

  const registerSocialHandler = useCallback((handler: (msg: SocialMessage) => void) => {
    socialHandlers.add(handler);
    return () => { socialHandlers.delete(handler); };
  }, [socialHandlers]);

  const registerRoomUserHandler = useCallback((handler: (msg: RoomUserMessage) => void) => {
    roomUserHandlers.add(handler);
    return () => { roomUserHandlers.delete(handler); };
  }, [roomUserHandlers]);

  const registerTwitchChatHandler = useCallback((handler: (msg: UnifiedChatMessage) => void) => {
    twitchChatHandlers.add(handler);
    return () => { twitchChatHandlers.delete(handler); };
  }, [twitchChatHandlers]);

  const registerYouTubeChatHandler = useCallback((handler: (msg: UnifiedChatMessage) => void) => {
    youtubeChatHandlers.add(handler);
    return () => { youtubeChatHandlers.delete(handler); };
  }, [youtubeChatHandlers]);

  const registerDisconnectHandler = useCallback((handler: (platform: PlatformType) => void) => {
    disconnectHandlers.add(handler);
    return () => { disconnectHandlers.delete(handler); };
  }, [disconnectHandlers]);

  const registerSocketReconnectHandler = useCallback((handler: () => void) => {
    socketReconnectHandlers.add(handler);
    return () => { socketReconnectHandlers.delete(handler); };
  }, [socketReconnectHandlers]);

  const registerStreamEndHandler = useCallback((handler: () => void) => {
    streamEndHandlers.add(handler);
    return () => { streamEndHandlers.delete(handler); };
  }, [streamEndHandlers]);

  // Use the multi-platform connection hook with handlers that dispatch to all registered listeners
  const connection = useMultiPlatformConnection({
    onChat: (msg) => {
      chatHandlers.forEach(handler => handler(msg));
    },
    onTikTokChat: (msg) => {
      tiktokChatHandlers.forEach(handler => handler(msg));
    },
    onGift: (msg) => {
      giftHandlers.forEach(handler => handler(msg));
    },
    onLike: (msg) => {
      likeHandlers.forEach(handler => handler(msg));
    },
    onMember: (msg) => {
      memberHandlers.forEach(handler => handler(msg));
    },
    onRoomUser: (msg) => {
      roomUserHandlers.forEach(handler => handler(msg));
    },
    onSocial: (msg) => {
      socialHandlers.forEach(handler => handler(msg));
    },
    onTwitchChat: (msg) => {
      twitchChatHandlers.forEach(handler => handler(msg));
    },
    onYouTubeChat: (msg) => {
      youtubeChatHandlers.forEach(handler => handler(msg));
    },
    onDisconnect: (platform) => {
      disconnectHandlers.forEach(handler => handler(platform));
    },
    onSocketReconnect: () => {
      socketReconnectHandlers.forEach(handler => handler());
    },
    onTikTokStreamEnd: () => {
      streamEndHandlers.forEach(handler => handler());
      toast.warning(t.toast.tiktokStreamEnded);
      // Check if no other platforms are connected and open modal after small delay
      setTimeout(() => {
        if (!twitchConnectedRef.current && !youtubeConnectedRef.current) {
          setShowConnectionModal(true);
        }
      }, 500);
    },
    onYouTubeStreamEnd: () => {
      streamEndHandlers.forEach(handler => handler());
      toast.warning(t.toast.youtubeStreamEnded);
      // Check if no other platforms are connected and open modal after small delay
      setTimeout(() => {
        if (!tiktokConnectedRef.current && !twitchConnectedRef.current) {
          setShowConnectionModal(true);
        }
      }, 500);
    },
    onTikTokReconnect: (_state) => {
      toast.success(interpolate(t.toast.tiktokReconnected, { username: tiktokUsername }));
    },
    onTwitchReconnect: (state) => {
      toast.success(interpolate(t.toast.twitchReconnected, { channel: state.channel }));
    },
    onYouTubeReconnect: (state) => {
      toast.success(interpolate(t.toast.youtubeReconnected, { channel: state.channelName || state.videoId }));
    },
  });

  // Sync connection refs for stream end handlers
  useEffect(() => {
    tiktokConnectedRef.current = connection.tiktok.isConnected;
    twitchConnectedRef.current = connection.twitch.isConnected;
    youtubeConnectedRef.current = connection.youtube.isConnected;
  }, [connection.tiktok.isConnected, connection.twitch.isConnected, connection.youtube.isConnected]);

  // Persist settings
  const setSelectedPlatforms = useCallback((platforms: PlatformType[]) => {
    setSelectedPlatformsState(platforms);
    localStorage.setItem('shared-selected-platforms', JSON.stringify(platforms));
  }, []);

  const handleSetTikTokUsername = useCallback((username: string) => {
    setTikTokUsername(username);
    localStorage.setItem('shared-tiktok-username', JSON.stringify(username));
  }, []);

  const handleSetTwitchChannel = useCallback((channel: string) => {
    setTwitchChannel(channel);
    localStorage.setItem('shared-twitch-channel', JSON.stringify(channel));
  }, []);

  const handleSetYouTubeVideo = useCallback((videoIdOrUrl: string) => {
    setYouTubeVideo(videoIdOrUrl);
    localStorage.setItem('shared-youtube-video', JSON.stringify(videoIdOrUrl));
  }, []);

  // Connect handlers with toast notifications
  const connectTikTok = useCallback(async (username: string) => {
    try {
      await connection.tiktok.connect(username, { enableExtendedGiftInfo: true });
      handleSetTikTokUsername(username);
      toast.success(interpolate(t.toast.tiktokConnected, { username }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(interpolate(t.toast.errorConnectingTikTok, { error: errorMessage }));
      throw error;
    }
  }, [connection.tiktok, toast, t, handleSetTikTokUsername]);

  const connectTwitch = useCallback(async (channel: string) => {
    try {
      await connection.twitch.connect(channel);
      handleSetTwitchChannel(channel);
      toast.success(interpolate(t.toast.twitchConnected, { channel }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(interpolate(t.toast.errorConnectingTwitch, { error: errorMessage }));
      throw error;
    }
  }, [connection.twitch, toast, t, handleSetTwitchChannel]);

  const connectYouTube = useCallback(async (videoIdOrUrl: string) => {
    try {
      await connection.youtube.connect(videoIdOrUrl);
      handleSetYouTubeVideo(videoIdOrUrl);
      toast.success(interpolate(t.toast.youtubeConnected, { channel: connection.youtube.channelName || videoIdOrUrl }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(interpolate(t.toast.errorConnectingYouTube, { error: errorMessage }));
      throw error;
    }
  }, [connection.youtube, toast, t, handleSetYouTubeVideo]);

  // Auto-reconnect handler
  const setAutoReconnect = useCallback((enabled: boolean) => {
    setAutoReconnectState(enabled);
    localStorage.setItem('shared-autoReconnect', String(enabled));
    if (enabled) {
      toast.success(t.connection.autoReconnectEnabled);
    }
  }, [toast, t]);

  // Auto-reconnect polling effect
  useEffect(() => {
    if (!autoReconnect) return;
    if (connection.isAnyConnected) return;

    const tiktokSelected = selectedPlatforms.includes('tiktok' as PlatformType);
    const twitchSelected = selectedPlatforms.includes('twitch' as PlatformType);
    const youtubeSelected = selectedPlatforms.includes('youtube' as PlatformType);

    // Check if we have any credentials to reconnect with
    const hasTikTokCredentials = tiktokSelected && tiktokUsername;
    const hasTwitchCredentials = twitchSelected && twitchChannel;
    const hasYouTubeCredentials = youtubeSelected && youtubeVideo;

    if (!hasTikTokCredentials && !hasTwitchCredentials && !hasYouTubeCredentials) return;

    console.log('[ConnectionContext] Starting auto-reconnect polling (every 10s)');

    const attemptReconnect = () => {
      if (!autoReconnectRef.current) return;

      // Reconnect TikTok if needed
      if (tiktokSelected && tiktokUsername && !connection.tiktok.isConnected && connection.tiktok.status !== 'connecting') {
        console.log('[ConnectionContext] Auto-reconnect attempt to TikTok:', tiktokUsername);
        connectTikTok(tiktokUsername)
          .then(() => {
            console.log('[ConnectionContext] TikTok auto-reconnect successful!');
          })
          .catch((error: unknown) => {
            console.log('[ConnectionContext] TikTok auto-reconnect failed, will retry:', error);
          });
      }

      // Reconnect Twitch if needed
      if (twitchSelected && twitchChannel && !connection.twitch.isConnected && connection.twitch.status !== 'connecting') {
        console.log('[ConnectionContext] Auto-reconnect attempt to Twitch:', twitchChannel);
        connectTwitch(twitchChannel)
          .then(() => {
            console.log('[ConnectionContext] Twitch auto-reconnect successful!');
          })
          .catch((error: unknown) => {
            console.log('[ConnectionContext] Twitch auto-reconnect failed, will retry:', error);
          });
      }

      // Reconnect YouTube if needed
      if (youtubeSelected && youtubeVideo && !connection.youtube.isConnected && connection.youtube.status !== 'connecting') {
        console.log('[ConnectionContext] Auto-reconnect attempt to YouTube:', youtubeVideo);
        connectYouTube(youtubeVideo)
          .then(() => {
            console.log('[ConnectionContext] YouTube auto-reconnect successful!');
          })
          .catch((error: unknown) => {
            console.log('[ConnectionContext] YouTube auto-reconnect failed, will retry:', error);
          });
      }
    };

    // First attempt after 3 seconds
    const initialTimeout = setTimeout(attemptReconnect, 3000);

    // Then retry every 10 seconds
    const intervalId = setInterval(attemptReconnect, 10000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, [autoReconnect, connection.isAnyConnected, connection.tiktok, connection.twitch, connection.youtube, selectedPlatforms, tiktokUsername, twitchChannel, youtubeVideo, connectTikTok, connectTwitch, connectYouTube]);

  const value: ConnectionContextType = {
    tiktok: {
      ...connection.tiktok,
      connect: connectTikTok,
      username: tiktokUsername,
    },
    twitch: {
      ...connection.twitch,
      connect: connectTwitch,
      channelName: twitchChannel,
    },
    youtube: {
      ...connection.youtube,
      connect: connectYouTube,
      videoInput: youtubeVideo,
    },
    isAnyConnected: connection.isAnyConnected,
    connectedPlatforms: connection.connectedPlatforms,
    selectedPlatforms,
    setSelectedPlatforms,
    setTikTokUsername: handleSetTikTokUsername,
    setTwitchChannel: handleSetTwitchChannel,
    setYouTubeVideo: handleSetYouTubeVideo,
    showConnectionModal,
    setShowConnectionModal,
    autoReconnect,
    setAutoReconnect,
    registerChatHandler,
    registerTikTokChatHandler,
    registerGiftHandler,
    registerLikeHandler,
    registerMemberHandler,
    registerSocialHandler,
    registerRoomUserHandler,
    registerTwitchChatHandler,
    registerYouTubeChatHandler,
    registerDisconnectHandler,
    registerSocketReconnectHandler,
    registerStreamEndHandler,
    joinChatRelay: connection.joinChatRelay,
    leaveChatRelay: connection.leaveChatRelay,
    emitChatRelay: connection.emitChatRelay,
    onChatRelayUpdate: connection.onChatRelayUpdate,
  };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnectionContext () {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error('useConnectionContext must be used within a ConnectionProvider');
  }
  return context;
}
