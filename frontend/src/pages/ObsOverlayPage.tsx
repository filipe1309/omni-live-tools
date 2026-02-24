import { useCallback, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMultiPlatformConnection } from '@/hooks';
import { useLanguage } from '@/i18n';
import { ObsEventContainer } from '@/components/chat';
import type { ChatItem, ChatMessage, GiftMessage, LikeMessage, MemberMessage, SocialMessage, RoomUserMessage, UnifiedChatMessage } from '@/types';

// Generate unique ID for chat items
let chatIdCounter = 0;
function generateId (): string {
  return `obs-${Date.now()}-${++chatIdCounter}`;
}

// Check if gift is in pending streak
function isPendingStreak (gift: GiftMessage): boolean {
  return gift.giftType === 1 && !gift.repeatEnd;
}

interface Settings {
  platforms: string[];
  username: string;
  channel: string;
  videoId: string;
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

export function ObsOverlayPage () {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<ChatItem[]>([]);
  const [roomStats, setRoomStats] = useState<RoomStats>({
    viewerCount: 0,
    likeCount: 0,
    diamondsCount: 0,
  });
  const [connectionState, setConnectionState] = useState<string>('');
  const { t } = useLanguage();

  // Join message delay handling (matches public/app.js)
  const joinMsgDelayRef = useRef(0);

  // Parse settings from URL
  const platformsParam = searchParams.get('platforms');
  const settings: Settings = {
    platforms: platformsParam ? platformsParam.split(',') : ['tiktok'],
    username: searchParams.get('username') || '',
    channel: searchParams.get('channel') || '',
    videoId: searchParams.get('videoId') || '',
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

  const showTikTok = settings.platforms.includes('tiktok') && settings.username;
  const showTwitch = settings.platforms.includes('twitch') && settings.channel;
  const showYouTube = settings.platforms.includes('youtube') && settings.videoId;

  // Add chat item with optional summarize behavior (for join messages)
  const addItem = useCallback((
    type: ChatItem['type'],
    user: ChatMessage | LikeMessage | MemberMessage | SocialMessage,
    content: string,
    color?: string,
    isTemporary = false,
    platform: 'tiktok' | 'twitch' | 'youtube' = 'tiktok'
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
        platform,
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
          content: `${t.obsOverlay.sent} ${gift.giftName} x${gift.repeatCount}`,
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
        content: `${t.obsOverlay.sent} ${gift.giftName} x${gift.repeatCount}`,
        color: '#ffd700',
        timestamp: new Date(),
        giftData: gift,
        isPendingStreak: pending,
      }];
    });
  }, [t]);

  const connection = useMultiPlatformConnection({
    // TikTok Chat messages
    onTikTokChat: (msg: ChatMessage) => {
      if (settings.showChats) {
        addItem('chat', msg, msg.comment, undefined, false, 'tiktok');
      }
    },

    // Twitch Chat messages
    onTwitchChat: (msg: UnifiedChatMessage) => {
      if (settings.showChats) {
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
        addItem('chat', twitchUser as unknown as ChatMessage, msg.message, msg.metadata?.color as string | undefined, false, 'twitch');
      }
    },

    // YouTube Chat messages
    onYouTubeChat: (msg: UnifiedChatMessage) => {
      if (settings.showChats) {
        // Convert YouTube message to ChatItem format
        const youtubeUser = {
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
        addItem('chat', youtubeUser as unknown as ChatMessage, msg.message, undefined, false, 'youtube');
      }
    },

    // Gift handling with diamond tracking (TikTok only)
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

    // Like handling with stats update (TikTok only)
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
        addItem('like', msg, label, '#447dd4', false, 'tiktok');
      }
    },

    // Member join handling with delay (TikTok only)
    onMember: (msg: MemberMessage) => {
      if (!settings.showJoins) return;

      // Calculate delay based on current queue
      let addDelay = 250;
      if (joinMsgDelayRef.current > 500) addDelay = 100;
      if (joinMsgDelayRef.current > 1000) addDelay = 0;

      joinMsgDelayRef.current += addDelay;

      setTimeout(() => {
        joinMsgDelayRef.current -= addDelay;
        addItem('member', msg, t.obsOverlay.joined, '#21b2c2', true, 'tiktok');
      }, addDelay > 0 ? joinMsgDelayRef.current - addDelay : 0);
    },

    // Social events (follow & share) - TikTok only
    onSocial: (msg: SocialMessage) => {
      const isFollow = msg.displayType.includes('follow');
      const isShare = msg.displayType.includes('share');

      if (isFollow && settings.showFollows) {
        const label = msg.label.replace('{0:user}', '');
        addItem('social', msg, label, '#ff005e', false, 'tiktok');
      } else if (isShare && settings.showShares) {
        const label = msg.label.replace('{0:user}', '');
        addItem('social', msg, label, '#2fb816', false, 'tiktok');
      }
    },

    // Room user stats (viewer count) - TikTok only
    onRoomUser: (msg: RoomUserMessage) => {
      if (typeof msg.viewerCount === 'number') {
        setRoomStats(prev => ({
          ...prev,
          viewerCount: msg.viewerCount,
        }));
      }
    },
  });

  // Auto-connect to TikTok when username is provided
  useEffect(() => {
    if (showTikTok) {
      setConnectionState(prev => prev ? `${prev}\nTikTok: ${t.obsOverlay.connecting}` : `TikTok: ${t.obsOverlay.connecting}`);
      connection.tiktok.connect(settings.username, { enableExtendedGiftInfo: true })
        .then((state) => {
          setConnectionState(prev => {
            const lines = prev.split('\n').filter(l => !l.startsWith('TikTok:'));
            lines.push(`TikTok: ${t.obsOverlay.connectedToRoom.replace('{roomId}', state.roomId)}`);
            return lines.join('\n');
          });
          // Reset stats on new connection
          setRoomStats({ viewerCount: 0, likeCount: 0, diamondsCount: 0 });
        })
        .catch((error) => {
          setConnectionState(prev => {
            const lines = prev.split('\n').filter(l => !l.startsWith('TikTok:'));
            lines.push(`TikTok: ${String(error)}`);
            return lines.join('\n');
          });
          // Schedule reconnect after 30s
          if (settings.username) {
            setTimeout(() => {
              setConnectionState(prev => {
                const lines = prev.split('\n').filter(l => !l.startsWith('TikTok:'));
                lines.push(`TikTok: ${t.obsOverlay.reconnecting}`);
                return lines.join('\n');
              });
              connection.tiktok.connect(settings.username, { enableExtendedGiftInfo: true })
                .catch(console.error);
            }, 30000);
          }
        });
    }
  }, [settings.username, t]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-connect to Twitch when channel is provided
  useEffect(() => {
    if (showTwitch) {
      setConnectionState(prev => prev ? `${prev}\nTwitch: ${t.obsOverlay.connecting}` : `Twitch: ${t.obsOverlay.connecting}`);
      connection.twitch.connect(settings.channel)
        .then((state) => {
          setConnectionState(prev => {
            const lines = prev.split('\n').filter(l => !l.startsWith('Twitch:'));
            lines.push(`Twitch: ${t.obsOverlay.connectedToChannel.replace('{channel}', state.channel)}`);
            return lines.join('\n');
          });
        })
        .catch((error) => {
          setConnectionState(prev => {
            const lines = prev.split('\n').filter(l => !l.startsWith('Twitch:'));
            lines.push(`Twitch: ${String(error)}`);
            return lines.join('\n');
          });
          // Schedule reconnect after 30s
          if (settings.channel) {
            setTimeout(() => {
              setConnectionState(prev => {
                const lines = prev.split('\n').filter(l => !l.startsWith('Twitch:'));
                lines.push(`Twitch: ${t.obsOverlay.reconnecting}`);
                return lines.join('\n');
              });
              connection.twitch.connect(settings.channel)
                .catch(console.error);
            }, 30000);
          }
        });
    }
  }, [settings.channel, t]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-connect to YouTube when videoId is provided
  useEffect(() => {
    if (showYouTube) {
      setConnectionState(prev => prev ? `${prev}\nYouTube: ${t.obsOverlay.connecting}` : `YouTube: ${t.obsOverlay.connecting}`);
      connection.youtube.connect(settings.videoId)
        .then((state) => {
          setConnectionState(prev => {
            const lines = prev.split('\n').filter(l => !l.startsWith('YouTube:'));
            lines.push(`YouTube: ${t.obsOverlay.connectedToVideo.replace('{videoId}', state.videoId || settings.videoId)}`);
            return lines.join('\n');
          });
        })
        .catch((error) => {
          setConnectionState(prev => {
            const lines = prev.split('\n').filter(l => !l.startsWith('YouTube:'));
            lines.push(`YouTube: ${String(error)}`);
            return lines.join('\n');
          });
          // Schedule reconnect after 30s
          if (settings.videoId) {
            setTimeout(() => {
              setConnectionState(prev => {
                const lines = prev.split('\n').filter(l => !l.startsWith('YouTube:'));
                lines.push(`YouTube: ${t.obsOverlay.reconnecting}`);
                return lines.join('\n');
              });
              connection.youtube.connect(settings.videoId)
                .catch(console.error);
            }, 30000);
          }
        });
    }
  }, [settings.videoId, t]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle TikTok stream end reconnection
  useEffect(() => {
    if (showTikTok && connection.tiktok.status === 'disconnected' && connectionState.includes('TikTok:')) {
      setConnectionState(prev => {
        const lines = prev.split('\n').filter(l => !l.startsWith('TikTok:'));
        lines.push(`TikTok: ${t.obsOverlay.streamEndedReconnecting}`);
        return lines.join('\n');
      });
      const timeout = setTimeout(() => {
        setConnectionState(prev => {
          const lines = prev.split('\n').filter(l => !l.startsWith('TikTok:'));
          lines.push(`TikTok: ${t.obsOverlay.connecting}`);
          return lines.join('\n');
        });
        connection.tiktok.connect(settings.username, { enableExtendedGiftInfo: true })
          .then((state) => {
            setConnectionState(prev => {
              const lines = prev.split('\n').filter(l => !l.startsWith('TikTok:'));
              lines.push(`TikTok: ${t.obsOverlay.connectedToRoom.replace('{roomId}', state.roomId)}`);
              return lines.join('\n');
            });
            setRoomStats({ viewerCount: 0, likeCount: 0, diamondsCount: 0 });
          })
          .catch((error) => {
            setConnectionState(prev => {
              const lines = prev.split('\n').filter(l => !l.startsWith('TikTok:'));
              lines.push(`TikTok: ${String(error)}`);
              return lines.join('\n');
            });
          });
      }, 30000);
      return () => clearTimeout(timeout);
    }
  }, [connection.tiktok.status, settings.username, t]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!showTikTok && !showTwitch && !showYouTube) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{
          backgroundColor: settings.bgColor,
          color: settings.fontColor,
        }}
      >
        {t.obsOverlay.noUsernameOrChannel}
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
            {showTikTok && (
              <td className="text-right align-top">
                <div className="text-sm">
                  {t.obsOverlay.viewers} <strong className="mr-5">{roomStats.viewerCount.toLocaleString()}</strong>
                  {t.obsOverlay.likes} <strong className="mr-5">{roomStats.likeCount.toLocaleString()}</strong>
                  {t.obsOverlay.earnedDiamonds} <strong>{roomStats.diamondsCount.toLocaleString()}</strong>
                </div>
              </td>
            )}
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
