import { useCallback, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTikTokConnection } from '@/hooks';
import { ObsEventContainer } from '@/components/chat';
import type { ChatItem, ChatMessage, GiftMessage, LikeMessage, MemberMessage, SocialMessage, RoomUserMessage } from '@/types';

// Generate unique ID for chat items
let chatIdCounter = 0;
function generateId(): string {
  return `obs-${Date.now()}-${++chatIdCounter}`;
}

// Check if gift is in pending streak
function isPendingStreak(gift: GiftMessage): boolean {
  return gift.giftType === 1 && !gift.repeatEnd;
}

interface Settings {
  username: string;
  showChats: boolean;
  showGifts: boolean;
  showLikes: boolean;
  showJoins: boolean;
  showFollows: boolean;
  showShares: boolean;
  bgColor: string;
  fontColor: string;
  fontSize: string;
}

interface RoomStats {
  viewerCount: number;
  likeCount: number;
  diamondsCount: number;
}

export function ObsOverlayPage() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<ChatItem[]>([]);
  const [roomStats, setRoomStats] = useState<RoomStats>({
    viewerCount: 0,
    likeCount: 0,
    diamondsCount: 0,
  });
  const [connectionState, setConnectionState] = useState<string>('');
  
  // Join message delay handling (matches public/app.js)
  const joinMsgDelayRef = useRef(0);
  
  // Parse settings from URL
  const settings: Settings = {
    username: searchParams.get('username') || '',
    showChats: searchParams.get('showChats') !== '0',
    showGifts: searchParams.get('showGifts') !== '0',
    showLikes: searchParams.get('showLikes') !== '0',
    showJoins: searchParams.get('showJoins') !== '0',
    showFollows: searchParams.get('showFollows') !== '0',
    showShares: searchParams.get('showShares') === '1',
    bgColor: searchParams.get('bgColor') || 'rgb(24,23,28)',
    fontColor: searchParams.get('fontColor') || 'rgb(227,229,235)',
    fontSize: searchParams.get('fontSize') || '1.3em',
  };

  // Add chat item with optional summarize behavior (for join messages)
  const addItem = useCallback((
    type: ChatItem['type'],
    user: ChatMessage | LikeMessage | MemberMessage | SocialMessage,
    content: string,
    color?: string,
    isTemporary = false
  ) => {
    setItems(prev => {
      // Remove temporary items when adding new non-temporary messages
      const filtered = isTemporary ? prev : prev.filter(item => !item.isTemporary);
      
      // Trim to max 500 items, keep latest 300
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

  // Add gift item with streak tracking (matches public/app.js addGiftItem)
  const addGiftItem = useCallback((gift: GiftMessage) => {
    const streakId = `${gift.userId}_${gift.giftId}`;
    const pending = isPendingStreak(gift);

    setItems(prev => {
      // Find existing streak item
      const existingIndex = prev.findIndex(
        item => item.type === 'gift' && 
                item.giftData && 
                `${item.giftData.userId}_${item.giftData.giftId}` === streakId
      );

      if (existingIndex >= 0) {
        // Update existing streak
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          giftData: gift,
          isPendingStreak: pending,
          content: `sent ${gift.giftName} x${gift.repeatCount}`,
        };
        return updated;
      }

      // Trim to max 200 items for gifts
      const trimmed = prev.length > 200 ? prev.slice(-100) : prev;

      // Add new gift item
      return [...trimmed, {
        id: generateId(),
        type: 'gift' as const,
        user: gift,
        content: `sent ${gift.giftName} x${gift.repeatCount}`,
        color: '#ffd700',
        timestamp: new Date(),
        giftData: gift,
        isPendingStreak: pending,
      }];
    });
  }, []);

  const connection = useTikTokConnection({
    // Chat messages
    onChat: (msg: ChatMessage) => {
      if (settings.showChats) {
        addItem('chat', msg, msg.comment);
      }
    },
    
    // Gift handling with diamond tracking
    onGift: (msg: GiftMessage) => {
      // Track diamonds for completed gifts (non-pending streaks)
      if (!isPendingStreak(msg) && msg.diamondCount > 0) {
        setRoomStats(prev => ({
          ...prev,
          diamondsCount: prev.diamondsCount + (msg.diamondCount * msg.repeatCount),
        }));
      }
      
      if (settings.showGifts) {
        addGiftItem(msg);
      }
    },
    
    // Like handling with stats update
    onLike: (msg: LikeMessage) => {
      // Update total like count
      if (typeof msg.totalLikeCount === 'number') {
        setRoomStats(prev => ({
          ...prev,
          likeCount: msg.totalLikeCount,
        }));
      }
      
      if (settings.showLikes && typeof msg.likeCount === 'number') {
        // Format label like public/app.js: "{user} liked x{count}"
        const label = msg.label
          .replace('{0:user}', '')
          .replace('likes', `${msg.likeCount} likes`);
        addItem('like', msg, label, '#447dd4');
      }
    },
    
    // Member join handling with delay (matches public/app.js joinMsgDelay logic)
    onMember: (msg: MemberMessage) => {
      if (!settings.showJoins) return;

      // Calculate delay based on current queue
      let addDelay = 250;
      if (joinMsgDelayRef.current > 500) addDelay = 100;
      if (joinMsgDelayRef.current > 1000) addDelay = 0;

      joinMsgDelayRef.current += addDelay;

      setTimeout(() => {
        joinMsgDelayRef.current -= addDelay;
        addItem('member', msg, 'joined', '#21b2c2', true);
      }, addDelay > 0 ? joinMsgDelayRef.current - addDelay : 0);
    },
    
    // Social events (follow & share)
    onSocial: (msg: SocialMessage) => {
      const isFollow = msg.displayType.includes('follow');
      const isShare = msg.displayType.includes('share');
      
      if (isFollow && settings.showFollows) {
        const label = msg.label.replace('{0:user}', '');
        addItem('social', msg, label, '#ff005e');
      } else if (isShare && settings.showShares) {
        const label = msg.label.replace('{0:user}', '');
        addItem('social', msg, label, '#2fb816');
      }
    },
    
    // Room user stats (viewer count)
    onRoomUser: (msg: RoomUserMessage) => {
      if (typeof msg.viewerCount === 'number') {
        setRoomStats(prev => ({
          ...prev,
          viewerCount: msg.viewerCount,
        }));
      }
    },
  });

  // Auto-connect when username is provided (matches public/app.js behavior)
  useEffect(() => {
    if (settings.username) {
      setConnectionState('Connecting...');
      connection.connect(settings.username, { enableExtendedGiftInfo: true })
        .then((state) => {
          setConnectionState(`Connected to roomId ${state.roomId}`);
          // Reset stats on new connection
          setRoomStats({ viewerCount: 0, likeCount: 0, diamondsCount: 0 });
        })
        .catch((error) => {
          setConnectionState(String(error));
          // Schedule reconnect after 30s (like public/app.js)
          if (settings.username) {
            setTimeout(() => {
              setConnectionState('Reconnecting...');
              connection.connect(settings.username, { enableExtendedGiftInfo: true })
                .catch(console.error);
            }, 30000);
          }
        });
    }
  }, [settings.username]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle stream end reconnection (matches public/app.js streamEnd handler)
  useEffect(() => {
    if (settings.username && connection.status === 'disconnected' && connectionState.includes('Connected')) {
      setConnectionState('Stream ended. Reconnecting in 30s...');
      const timeout = setTimeout(() => {
        setConnectionState('Connecting...');
        connection.connect(settings.username, { enableExtendedGiftInfo: true })
          .then((state) => {
            setConnectionState(`Connected to roomId ${state.roomId}`);
            setRoomStats({ viewerCount: 0, likeCount: 0, diamondsCount: 0 });
          })
          .catch((error) => {
            setConnectionState(String(error));
          });
      }, 30000);
      return () => clearTimeout(timeout);
    }
  }, [connection.status, settings.username]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!settings.username) {
    return (
      <div 
        className="flex items-center justify-center h-screen"
        style={{ 
          backgroundColor: settings.bgColor,
          color: settings.fontColor,
        }}
      >
        No username provided in URL
      </div>
    );
  }

  return (
    <div 
      className="h-screen overflow-hidden p-2"
      style={{ 
        backgroundColor: settings.bgColor,
        color: settings.fontColor,
        fontSize: settings.fontSize,
        minWidth: '200px',
      }}
    >
      {/* Connection State & Room Stats (matches public/obs.html splitstatetable) */}
      <table className="w-full mb-2">
        <tbody>
          <tr>
            <td className="align-top">
              <pre className="m-0 whitespace-pre-wrap text-sm">{connectionState}</pre>
            </td>
            <td className="text-right align-top">
              <div className="text-sm">
                Viewers: <strong className="mr-5">{roomStats.viewerCount.toLocaleString()}</strong>
                Likes: <strong className="mr-5">{roomStats.likeCount.toLocaleString()}</strong>
                Earned Diamonds: <strong>{roomStats.diamondsCount.toLocaleString()}</strong>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Events Container (matches public/obs.html eventcontainer) */}
      <ObsEventContainer 
        items={items} 
        fontColor={settings.fontColor}
        maxHeight="calc(100vh - 90px)"
      />
    </div>
  );
}
