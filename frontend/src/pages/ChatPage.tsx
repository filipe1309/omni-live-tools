import { useState, useCallback, useEffect } from 'react';
import { useConnectionContext } from '@/hooks';
import { useFeaturedMessage } from '@/hooks/useFeaturedMessage';
import { useLanguage } from '@/i18n';
import { RoomStats, ChatContainer, GiftContainer, ChatQueueContainer } from '@/components';
import type { ChatItem, GiftMessage, ChatMessage, LikeMessage, MemberMessage, SocialMessage, UnifiedChatMessage } from '@/types';

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

export function ChatPage () {
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [gifts, setGifts] = useState<GiftData[]>([]);
  const [queueItems, setQueueItems] = useState<ChatItem[]>([]);
  const { t } = useLanguage();
  const { featuredMessageId, setFeaturedMessage, clearFeaturedMessage } = useFeaturedMessage();

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

  const {
    tiktok,
    registerTikTokChatHandler,
    registerGiftHandler,
    registerLikeHandler,
    registerMemberHandler,
    registerSocialHandler,
    registerTwitchChatHandler,
    registerYouTubeChatHandler,
  } = useConnectionContext();

  // Add chat item helper
  const addChatItem = useCallback((
    type: ChatItem['type'],
    user: ChatMessage | LikeMessage | MemberMessage | SocialMessage,
    content: string,
    color?: string,
    isTemporary = false,
    platform: 'tiktok' | 'twitch' | 'youtube' = 'tiktok',
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
      addChatItem('chat', msg, msg.comment, undefined, false, 'tiktok');
    });

    const unsubscribeGift = registerGiftHandler(handleGift);

    const unsubscribeLike = registerLikeHandler((msg: LikeMessage) => {
      const label = msg.label.replace('{0:user}', '').replace('likes', `${msg.likeCount} likes`);
      addChatItem('like', msg, label, '#447dd4', false, 'tiktok');
    });

    const unsubscribeMember = registerMemberHandler((msg: MemberMessage) => {
      addChatItem('member', msg, 'joined', '#21b2c2', true, 'tiktok');
    });

    const unsubscribeSocial = registerSocialHandler((msg: SocialMessage) => {
      const color = msg.displayType.includes('follow') ? '#ff005e' : '#2fb816';
      const label = msg.label.replace('{0:user}', '');
      addChatItem('social', msg, label, color, false, 'tiktok');
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
      addChatItem('chat', twitchUser as unknown as ChatMessage, msg.message, msg.metadata?.color as string | undefined, false, 'twitch');
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
      addChatItem('chat', youtubeUser as unknown as ChatMessage, msg.message, undefined, false, 'youtube', isSuperchat, isSuperchat);
    });

    return () => {
      unsubscribeTikTokChat();
      unsubscribeGift();
      unsubscribeLike();
      unsubscribeMember();
      unsubscribeSocial();
      unsubscribeTwitchChat();
      unsubscribeYouTubeChat();
    };
  }, [addChatItem, handleGift, registerTikTokChatHandler, registerGiftHandler, registerLikeHandler, registerMemberHandler, registerSocialHandler, registerTwitchChatHandler, registerYouTubeChatHandler]);

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

        <div className="grid lg:grid-cols-3 gap-6">
          <ChatContainer 
            items={chatItems} 
            title={`💬 ${t.chat.chats}`} 
            onAddToQueue={addToQueue} 
            onSendToOverlay={sendToOverlayFromChat}
            featuredMessageId={featuredMessageId}
          />
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-lg text-slate-200">📋 {t.chat.queue}</h2>
              <button
                onClick={() => {
                  const width = 800;
                  const height = 600;
                  const left = (window.screen.width - width) / 2;
                  const top = (window.screen.height - height) / 2;
                  window.open(
                    '/obs-featured',
                    'overlay-window',
                    `width=${width},height=${height},left=${left},top=${top},resizable=yes`
                  );
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 hover:text-cyan-300 transition-colors text-sm"
                title={t.chat.popOutOverlay}
              >
                <PopOutIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Overlay</span>
              </button>
            </div>
            <ChatQueueContainer 
              items={queueItems} 
              title="" 
              onRemove={removeFromQueue} 
              onSendToOverlay={sendToOverlayFromQueue}
              featuredMessageId={featuredMessageId}
            />
          </div>
          <GiftContainer gifts={gifts} title={`🎁 ${t.chat.gifts}`} />
        </div>
      </div>
    </div>
  );
}
