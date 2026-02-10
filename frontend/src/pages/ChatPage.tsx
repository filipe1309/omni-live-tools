import { useState, useCallback } from 'react';
import { useTikTokConnection, useToast } from '@/hooks';
import { ConnectionForm, RoomStats, ChatContainer, GiftContainer } from '@/components';
import type { ChatItem, GiftMessage, ChatMessage, LikeMessage, MemberMessage, SocialMessage } from '@/types';

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
  const toast = useToast();

  // Add chat item helper
  const addChatItem = useCallback((
    type: ChatItem['type'],
    user: ChatMessage | LikeMessage | MemberMessage | SocialMessage,
    content: string,
    color?: string,
    isTemporary = false
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

  const connection = useTikTokConnection({
    onChat: (msg: ChatMessage) => {
      addChatItem('chat', msg, msg.comment);
    },
    onGift: handleGift,
    onLike: (msg: LikeMessage) => {
      const label = msg.label.replace('{0:user}', '').replace('likes', `${msg.likeCount} likes`);
      addChatItem('like', msg, label, '#447dd4');
    },
    onMember: (msg: MemberMessage) => {
      addChatItem('member', msg, 'joined', '#21b2c2', true);
    },
    onSocial: (msg: SocialMessage) => {
      const color = msg.displayType.includes('follow') ? '#ff005e' : '#2fb816';
      const label = msg.label.replace('{0:user}', '');
      addChatItem('social', msg, label, color);
    },
  });

  const handleConnect = async (uniqueId: string) => {
    // Reset state on new connection
    setChatItems([]);
    setGifts([]);
    
    try {
      await connection.connect(uniqueId, { enableExtendedGiftInfo: true });
      toast.success(`Conectado a @${uniqueId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Erro ao conectar: ${errorMessage}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <ConnectionForm
          onConnect={handleConnect}
          onDisconnect={connection.disconnect}
          status={connection.status}
          errorMessage={connection.error}
          defaultUsername="jamesbonfim"
        />
      </div>

      {connection.isConnected && (
        <div className="mb-6 card">
          <RoomStats
            viewerCount={connection.viewerCount}
            likeCount={connection.likeCount}
            diamondsCount={connection.diamondsCount}
            roomId={connection.roomId}
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
