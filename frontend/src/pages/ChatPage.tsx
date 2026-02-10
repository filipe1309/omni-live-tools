import { useState, useCallback } from 'react';
import { useMultiPlatformConnection, useToast } from '@/hooks';
import { RoomStats, ChatContainer, GiftContainer, MultiPlatformConnectionForm } from '@/components';
import type { ChatItem, GiftMessage, ChatMessage, LikeMessage, MemberMessage, SocialMessage, UnifiedChatMessage, PlatformType } from '@/types';

// Helper to check if gift is in pending streak
function isPendingStreak(gift: GiftMessage): boolean {
  return gift.giftType === 1 && !gift.repeatEnd;
}

// Generate unique ID for chat items
let chatIdCounter = 0;
function generateId(): string {
  return `chat-${Date.now()}-${++chatIdCounter}`;
}

interface GiftData extends GiftMessage {
  isPending: boolean;
  streakId: string;
}

export function ChatPage() {
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [gifts, setGifts] = useState<GiftData[]>([]);
  const [currentUsername, setCurrentUsername] = useState('');
  const [currentTwitchChannel, setCurrentTwitchChannel] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>(['tiktok'] as PlatformType[]);
  const toast = useToast();

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

  const connection = useMultiPlatformConnection({
    onTikTokChat: (msg: ChatMessage) => {
      console.log('[ChatPage] Processing TikTok chat:', msg.uniqueId, msg.comment);
      addChatItem('chat', msg, msg.comment, undefined, false, 'tiktok');
    },
    onGift: handleGift,
    onLike: (msg: LikeMessage) => {
      const label = msg.label.replace('{0:user}', '').replace('likes', `${msg.likeCount} likes`);
      addChatItem('like', msg, label, '#447dd4', false, 'tiktok');
    },
    onMember: (msg: MemberMessage) => {
      addChatItem('member', msg, 'joined', '#21b2c2', true, 'tiktok');
    },
    onSocial: (msg: SocialMessage) => {
      const color = msg.displayType.includes('follow') ? '#ff005e' : '#2fb816';
      const label = msg.label.replace('{0:user}', '');
      addChatItem('social', msg, label, color, false, 'tiktok');
    },
    onTwitchChat: (msg: UnifiedChatMessage) => {
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
    },
  });

  const handleTikTokConnect = async (username: string) => {
    // Reset state on new connection
    setChatItems([]);
    setGifts([]);
    setCurrentUsername(username);
    
    try {
      await connection.tiktok.connect(username, { enableExtendedGiftInfo: true });
      toast.success(`TikTok conectado a @${username}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Erro ao conectar TikTok: ${errorMessage}`);
    }
  };

  const handleTwitchConnect = async (channel: string) => {
    setCurrentTwitchChannel(channel);
    
    try {
      await connection.twitch.connect(channel);
      toast.success(`Twitch conectado a #${channel}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Erro ao conectar Twitch: ${errorMessage}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <MultiPlatformConnectionForm
          tiktok={{
            status: connection.tiktok.status,
            onConnect: handleTikTokConnect,
            onDisconnect: connection.tiktok.disconnect,
            username: currentUsername,
            onUsernameChange: setCurrentUsername,
            errorMessage: connection.tiktok.error,
          }}
          twitch={{
            status: connection.twitch.status,
            onConnect: handleTwitchConnect,
            onDisconnect: connection.twitch.disconnect,
            channel: currentTwitchChannel,
            onChannelChange: setCurrentTwitchChannel,
            errorMessage: connection.twitch.error,
          }}
          selectedPlatforms={selectedPlatforms}
          onPlatformChange={setSelectedPlatforms}
        />
      </div>

      {connection.tiktok.isConnected && (
        <div className="mb-6 card">
          <RoomStats
            viewerCount={connection.tiktok.viewerCount}
            likeCount={connection.tiktok.likeCount}
            diamondsCount={connection.tiktok.diamondsCount}
            roomId={connection.tiktok.roomId}
          />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <ChatContainer items={chatItems} title="💬 Chats" />
        <GiftContainer gifts={gifts} title="🎁 Gifts" />
      </div>
    </div>
  );
}
