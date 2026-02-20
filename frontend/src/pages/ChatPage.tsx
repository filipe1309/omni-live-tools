import { useState, useCallback, useEffect } from 'react';
import { useConnectionContext } from '@/hooks';
import { useLanguage } from '@/i18n';
import { RoomStats, ChatContainer, GiftContainer } from '@/components';
import type { ChatItem, GiftMessage, ChatMessage, LikeMessage, MemberMessage, SocialMessage, UnifiedChatMessage } from '@/types';

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
}

export function ChatPage () {
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [gifts, setGifts] = useState<GiftData[]>([]);
  const { t } = useLanguage();

  const {
    tiktok,
    registerTikTokChatHandler,
    registerGiftHandler,
    registerLikeHandler,
    registerMemberHandler,
    registerSocialHandler,
    registerTwitchChatHandler,
  } = useConnectionContext();

  // Add chat item helper
  const addChatItem = useCallback((
    type: ChatItem['type'],
    user: ChatMessage | LikeMessage | MemberMessage | SocialMessage,
    content: string,
    color?: string,
    isTemporary = false,
    platform: 'tiktok' | 'twitch' = 'tiktok'
  ) => {
    setChatItems(prev => {
      // Remove temporary items when adding new messages
      const filtered = prev.filter(item => !item.isTemporary);

      // Keep max 500 items
      const trimmed = filtered.length > 500 ? filtered.slice(-300) : filtered;

      return [...trimmed, {
        id: generateId(),
        type,
        user,
        content,
        color,
        timestamp: new Date(),
        isTemporary,
        platform,
      }];
    });
  }, []);

  // Handle gift with streak tracking
  const handleGift = useCallback((gift: GiftMessage) => {
    const streakId = `${gift.userId}_${gift.giftId}`;
    const pending = isPendingStreak(gift);

    setGifts(prev => {
      // Check if this streak already exists
      const existingIndex = prev.findIndex(g => g.streakId === streakId);

      if (existingIndex >= 0) {
        // Update existing streak
        const updated = [...prev];
        updated[existingIndex] = { ...gift, isPending: pending, streakId };
        return updated;
      }

      // Add new gift, keeping max 200
      const trimmed = prev.length > 200 ? prev.slice(-100) : prev;
      return [...trimmed, { ...gift, isPending: pending, streakId }];
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

    return () => {
      unsubscribeTikTokChat();
      unsubscribeGift();
      unsubscribeLike();
      unsubscribeMember();
      unsubscribeSocial();
      unsubscribeTwitchChat();
    };
  }, [addChatItem, handleGift, registerTikTokChatHandler, registerGiftHandler, registerLikeHandler, registerMemberHandler, registerSocialHandler, registerTwitchChatHandler]);

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

        <div className="grid lg:grid-cols-2 gap-6">
          <ChatContainer items={chatItems} title={`💬 ${t.chat.chats}`} />
          <GiftContainer gifts={gifts} title={`🎁 ${t.chat.gifts}`} />
        </div>
      </div>
    </div>
  );
}
