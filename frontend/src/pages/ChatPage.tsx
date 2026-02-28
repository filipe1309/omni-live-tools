import { useState, useCallback, useEffect } from 'react';
import { useConnectionContext, useChatBroadcaster } from '@/hooks';
import { useFeaturedMessage } from '@/hooks/useFeaturedMessage';
import { useLanguage } from '@/i18n';
import { RoomStats, ChatContainer, GiftContainer, ChatQueueContainer } from '@/components';
import type { ChatItem, GiftMessage, ChatMessage, LikeMessage, MemberMessage, SocialMessage, UnifiedChatMessage } from '@/types';
import { PlatformType } from '@/types';

// Pop-out overlay icon
function PopOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}

// Helper to check if gift is in pending streak
function isPendingStreak (gift: GiftMessage): boolean {
  return gift.giftType === 1 && !gift.repeatEnd;
}

// Generate unique ID for chat items
let chatIdCounter = 0;
function generateId (): string {
  return `chat-${Date.now()}-${++chatIdCounter}`;
}

interface GiftData extends GiftMessage {
  isPending: boolean;
  streakId: string;
  lastUpdated: number; // Timestamp for streak timeout detection
}

// Streak timeout in milliseconds (60 seconds)
const STREAK_TIMEOUT_MS = 60 * 1000;

// LocalStorage keys for visibility preferences
const STORAGE_KEY_QUEUE_VISIBLE = 'omni-chat-queue-visible';
const STORAGE_KEY_GIFT_VISIBLE = 'omni-chat-gift-visible';

// Eye icon for toggle buttons
function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

export function ChatPage () {
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [gifts, setGifts] = useState<GiftData[]>([]);
  const [queueItems, setQueueItems] = useState<ChatItem[]>([]);
  const [queueVisible, setQueueVisible] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_QUEUE_VISIBLE);
    return stored !== null ? stored === 'true' : true;
  });
  const [giftVisible, setGiftVisible] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_GIFT_VISIBLE);
    return stored !== null ? stored === 'true' : true;
  });
  const { t } = useLanguage();
  const { featuredMessageId, setFeaturedMessage, clearFeaturedMessage } = useFeaturedMessage();
  const { broadcastChatItems, broadcastGifts, broadcastQueueItems, broadcastFeaturedMessageId, setActionHandlers } = useChatBroadcaster();

  // Get connection context
  const {
    tiktok,
    registerTikTokChatHandler,
    registerGiftHandler,
    registerLikeHandler,
    registerMemberHandler,
    registerSocialHandler,
    registerTwitchChatHandler,
    registerYouTubeChatHandler,
    registerKickChatHandler,
  } = useConnectionContext();

  // Broadcast data to pop-out windows via BroadcastChannel
  useEffect(() => {
    broadcastChatItems(chatItems);
  }, [chatItems, broadcastChatItems]);

  useEffect(() => {
    broadcastGifts(gifts);
  }, [gifts, broadcastGifts]);

  useEffect(() => {
    broadcastQueueItems(queueItems);
  }, [queueItems, broadcastQueueItems]);

  useEffect(() => {
    broadcastFeaturedMessageId(featuredMessageId);
  }, [featuredMessageId, broadcastFeaturedMessageId]);

  // Toggle visibility handlers with localStorage persistence
  const toggleQueueVisible = useCallback(() => {
    setQueueVisible(prev => {
      const newValue = !prev;
      localStorage.setItem(STORAGE_KEY_QUEUE_VISIBLE, String(newValue));
      return newValue;
    });
  }, []);

  const toggleGiftVisible = useCallback(() => {
    setGiftVisible(prev => {
      const newValue = !prev;
      localStorage.setItem(STORAGE_KEY_GIFT_VISIBLE, String(newValue));
      return newValue;
    });
  }, []);

  // Add to queue handler
  const addToQueue = useCallback((item: ChatItem) => {
    setQueueItems(prev => {
      // Avoid duplicates
      if (prev.some(q => q.id === item.id)) return prev;
      return [...prev, item];
    });
  }, []);

  // Remove from queue handler - also clears overlay if removed message was featured
  const removeFromQueue = useCallback((id: string) => {
    if (featuredMessageId === id) {
      clearFeaturedMessage();
    }
    setQueueItems(prev => prev.filter(item => item.id !== id));
  }, [featuredMessageId, clearFeaturedMessage]);

  // Send to overlay handler - also adds to queue if from chat
  const sendToOverlay = useCallback((item: ChatItem, fromChat: boolean = false) => {
    setFeaturedMessage(item);
    // If from chat, also add to queue
    if (fromChat) {
      addToQueue(item);
    }
  }, [setFeaturedMessage, addToQueue]);

  // Handler for chat container (from chat = true)
  const sendToOverlayFromChat = useCallback((item: ChatItem) => {
    sendToOverlay(item, true);
  }, [sendToOverlay]);

  // Handler for queue container (already in queue)
  const sendToOverlayFromQueue = useCallback((item: ChatItem) => {
    sendToOverlay(item, false);
  }, [sendToOverlay]);

  // Register action handlers for pop-out windows
  useEffect(() => {
    setActionHandlers({
      onAddToQueue: addToQueue,
      onSendToOverlay: sendToOverlayFromChat,
      onRemoveFromQueue: removeFromQueue,
    });
  }, [setActionHandlers, addToQueue, sendToOverlayFromChat, removeFromQueue]);

  // Add chat item helper
  const addChatItem = useCallback((
    type: ChatItem['type'],
    user: ChatMessage | LikeMessage | MemberMessage | SocialMessage,
    content: string,
    color?: string,
    isTemporary = false,
    platform: PlatformType = PlatformType.TIKTOK,
    autoAddToQueue = false,
    isSuperchat = false
  ) => {
    const newItem: ChatItem = {
      id: generateId(),
      type,
      user,
      content,
      color,
      timestamp: new Date(),
      isTemporary,
      platform,
      isSuperchat,
    };

    setChatItems(prev => {
      // Remove temporary items when adding new messages
      const filtered = prev.filter(item => !item.isTemporary);

      // Keep max 500 items
      const trimmed = filtered.length > 500 ? filtered.slice(-300) : filtered;

      return [...trimmed, newItem];
    });

    // Auto-add to queue if requested (e.g., for superchats)
    if (autoAddToQueue) {
      setQueueItems(prev => {
        // Avoid duplicates
        if (prev.some(q => q.id === newItem.id)) return prev;
        return [...prev, newItem];
      });
    }
  }, []);

  // Handle gift with streak tracking
  const handleGift = useCallback((gift: GiftMessage) => {
    const baseStreakId = `${gift.userId}_${gift.giftId}`;
    const pending = isPendingStreak(gift);
    const now = Date.now();

    setGifts(prev => {
      // Check if this streak already exists
      const existingIndex = prev.findIndex(g => g.streakId.startsWith(baseStreakId));

      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        const timeSinceLastUpdate = now - existing.lastUpdated;

        // If streak timed out, create a new gift entry
        if (timeSinceLastUpdate > STREAK_TIMEOUT_MS) {
          // Add new gift with unique streakId (append timestamp)
          const newStreakId = `${baseStreakId}_${now}`;
          const trimmed = prev.length > 200 ? prev.slice(-100) : prev;
          return [...trimmed, { ...gift, isPending: pending, streakId: newStreakId, lastUpdated: now }];
        }

        // Update existing streak (within timeout window)
        const updated = [...prev];
        updated[existingIndex] = { ...gift, isPending: pending, streakId: existing.streakId, lastUpdated: now };
        return updated;
      }

      // Add new gift, keeping max 200
      const trimmed = prev.length > 200 ? prev.slice(-100) : prev;
      return [...trimmed, { ...gift, isPending: pending, streakId: baseStreakId, lastUpdated: now }];
    });
  }, []);

  // Register event handlers
  useEffect(() => {
    const unsubscribeTikTokChat = registerTikTokChatHandler((msg: ChatMessage) => {
      console.log('[ChatPage] Processing TikTok chat:', msg.uniqueId, msg.comment);
      addChatItem('chat', msg, msg.comment, undefined, false, PlatformType.TIKTOK);
    });

    const unsubscribeGift = registerGiftHandler(handleGift);

    const unsubscribeLike = registerLikeHandler((msg: LikeMessage) => {
      const label = msg.label.replace('{0:user}', '').replace('likes', `${msg.likeCount} likes`);
      addChatItem('like', msg, label, '#447dd4', false, PlatformType.TIKTOK);
    });

    const unsubscribeMember = registerMemberHandler((msg: MemberMessage) => {
      addChatItem('member', msg, 'joined', '#21b2c2', true, PlatformType.TIKTOK);
    });

    const unsubscribeSocial = registerSocialHandler((msg: SocialMessage) => {
      const color = msg.displayType.includes('follow') ? '#ff005e' : '#2fb816';
      const label = msg.label.replace('{0:user}', '');
      addChatItem('social', msg, label, color, false, PlatformType.TIKTOK);
    });

    const unsubscribeTwitchChat = registerTwitchChatHandler((msg: UnifiedChatMessage) => {
      console.log('[ChatPage] Processing Twitch chat:', msg.username, msg.message);
      // Convert Twitch message to ChatItem format
      const twitchUser = {
        uniqueId: msg.username,
        nickname: msg.displayName,
        userId: msg.odlUserId,
        profilePictureUrl: '',
        followRole: 0,
        userBadges: msg.badges?.map(b => ({ type: b.id, name: b.name || b.id })) || [],
        isModerator: msg.isMod || false,
        isNewGifter: false,
        isSubscriber: msg.isSubscriber || false,
        topGifterRank: null,
      };
      addChatItem('chat', twitchUser as unknown as ChatMessage, msg.message, msg.metadata?.color as string | undefined, false, PlatformType.TWITCH);
    });

    const unsubscribeYouTubeChat = registerYouTubeChatHandler((msg: UnifiedChatMessage) => {
      console.log('[ChatPage] Processing YouTube chat:', msg.username, msg.message);
      // Convert YouTube message to ChatItem format
      const youtubeUser = {
        uniqueId: msg.username,
        nickname: msg.displayName,
        userId: msg.odlUserId,
        profilePictureUrl: msg.profilePictureUrl || '',
        followRole: 0,
        userBadges: msg.badges?.map(b => ({ type: b.id, name: b.name || b.id })) || [],
        isModerator: msg.isMod || false,
        isNewGifter: false,
        isSubscriber: msg.isSubscriber || false,
        topGifterRank: null,
      };
      // Auto-add superchats to queue
      const isSuperchat = !!msg.metadata?.superchat;
      addChatItem('chat', youtubeUser as unknown as ChatMessage, msg.message, undefined, false, PlatformType.YOUTUBE, isSuperchat, isSuperchat);
    });

    const unsubscribeKickChat = registerKickChatHandler((msg: UnifiedChatMessage) => {
      console.log('[ChatPage] Processing Kick chat:', msg.username, msg.message);
      // Convert Kick message to ChatItem format
      const kickUser = {
        uniqueId: msg.username,
        nickname: msg.displayName,
        userId: msg.odlUserId,
        profilePictureUrl: msg.profilePictureUrl || '',
        followRole: 0,
        userBadges: msg.badges?.map(b => ({ type: b.id, name: b.name || b.id })) || [],
        isModerator: msg.isMod || false,
        isNewGifter: false,
        isSubscriber: msg.isSubscriber || false,
        topGifterRank: null,
      };
      addChatItem('chat', kickUser as unknown as ChatMessage, msg.message, msg.metadata?.color as string | undefined, false, PlatformType.KICK);
    });

    return () => {
      unsubscribeTikTokChat();
      unsubscribeGift();
      unsubscribeLike();
      unsubscribeMember();
      unsubscribeSocial();
      unsubscribeTwitchChat();
      unsubscribeYouTubeChat();
      unsubscribeKickChat();
    };
  }, [addChatItem, handleGift, registerTikTokChatHandler, registerGiftHandler, registerLikeHandler, registerMemberHandler, registerSocialHandler, registerTwitchChatHandler, registerYouTubeChatHandler, registerKickChatHandler]);

  // Helper to open pop-out windows
  const openPopOut = (path: string, name: string, width = 600, height = 800) => {
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    window.open(
      path,
      name,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes`
    );
  };

  // Calculate grid columns based on visible panels (chat & queue wider, gift thinner)
  const getGridClass = () => {
    if (queueVisible && giftVisible) return 'lg:grid-cols-[2fr_2fr_1fr]'; // Chat 40%, Queue 40%, Gift 20%
    if (queueVisible) return 'lg:grid-cols-2'; // Chat 50%, Queue 50%
    if (giftVisible) return 'lg:grid-cols-[2fr_1fr]'; // Chat 67%, Gift 33%
    return 'lg:grid-cols-1'; // Chat only
  };
  const gridClass = getGridClass();

  return (
    <div className="min-h-screen w-full bg-chat-gradient">
      <div className="container mx-auto px-4 py-6">
        {tiktok.isConnected && (
          <div className="mb-6 card">
            <RoomStats
              viewerCount={tiktok.viewerCount}
              likeCount={tiktok.likeCount}
              diamondsCount={tiktok.diamondsCount}
              roomId={tiktok.roomId}
            />
          </div>
        )}

        {/* Toggle buttons for Queue and Gift visibility */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={toggleQueueVisible}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm ${
              queueVisible 
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 hover:text-emerald-300' 
                : 'bg-slate-500/20 hover:bg-slate-500/30 text-slate-400 hover:text-slate-300'
            }`}
            title={queueVisible ? t.chat.disableQueue : t.chat.enableQueue}
          >
            {queueVisible ? <EyeIcon className="w-4 h-4" /> : <EyeOffIcon className="w-4 h-4" />}
            <span>📋 {t.chat.queue}</span>
          </button>
          <button
            onClick={toggleGiftVisible}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm ${
              giftVisible 
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 hover:text-emerald-300' 
                : 'bg-slate-500/20 hover:bg-slate-500/30 text-slate-400 hover:text-slate-300'
            }`}
            title={giftVisible ? t.chat.disableGift : t.chat.enableGift}
          >
            {giftVisible ? <EyeIcon className="w-4 h-4" /> : <EyeOffIcon className="w-4 h-4" />}
            <span>🎁 {t.chat.gifts}</span>
          </button>
        </div>

        <div className={`grid ${gridClass} gap-6`}>
          {/* Chat Container with Pop-out */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-lg text-slate-200">💬 {t.chat.chats}</h2>
              <button
                onClick={() => openPopOut('/obs-chat', 'chat-window')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 hover:text-cyan-300 transition-colors text-sm"
                title={t.chat.popOutChat}
              >
                <PopOutIcon className="w-4 h-4" />
              </button>
            </div>
            <ChatContainer 
              items={chatItems} 
              title="" 
              onAddToQueue={addToQueue} 
              onSendToOverlay={sendToOverlayFromChat}
              featuredMessageId={featuredMessageId}
            />
          </div>

          {/* Queue Container with Pop-outs */}
          {queueVisible && (
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-lg text-slate-200">📋 {t.chat.queue}</h2>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openPopOut('/obs-queue', 'queue-window')}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 hover:text-cyan-300 transition-colors text-sm"
                    title={t.chat.popOutQueue}
                  >
                    <PopOutIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openPopOut('/obs-featured', 'overlay-window', 800, 600)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 hover:text-purple-300 transition-colors text-sm"
                    title={t.chat.popOutOverlay}
                  >
                    <span className="hidden sm:inline">Overlay</span>
                  </button>
                </div>
              </div>
              <ChatQueueContainer 
                items={queueItems} 
                title="" 
                onRemove={removeFromQueue} 
                onSendToOverlay={sendToOverlayFromQueue}
                featuredMessageId={featuredMessageId}
              />
            </div>
          )}

          {/* Gift Container with Pop-out */}
          {giftVisible && (
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-lg text-slate-200">🎁 {t.chat.gifts}</h2>
                <button
                  onClick={() => openPopOut('/obs-gift', 'gift-window')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 hover:text-cyan-300 transition-colors text-sm"
                  title={t.chat.popOutGift}
                >
                  <PopOutIcon className="w-4 h-4" />
                </button>
              </div>
              <GiftContainer gifts={gifts} title="" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
