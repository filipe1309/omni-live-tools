import { useCallback, useEffect, useRef } from 'react';
import type { ChatItem, GiftMessage } from '@/types';

interface GiftData extends GiftMessage {
  isPending: boolean;
  streakId: string;
  lastUpdated: number;
}

interface ChatBroadcastData {
  type: 'chat-update' | 'gifts-update' | 'queue-update' | 'request-state' | 'action-add-to-queue' | 'action-send-to-overlay' | 'action-remove-from-queue' | 'featured-update';
  chatItems?: ChatItem[];
  gifts?: GiftData[];
  queueItems?: ChatItem[];
  item?: ChatItem;
  itemId?: string;
  featuredMessageId?: string | null;
}

const CHANNEL_NAME = 'chat-broadcast-channel';

/**
 * Hook for broadcasting chat data to pop-out windows
 * Used by the main ChatPage to send data
 */
export function useChatBroadcaster() {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const dataRef = useRef<{
    chatItems: ChatItem[];
    gifts: GiftData[];
    queueItems: ChatItem[];
    featuredMessageId: string | null;
  }>({ chatItems: [], gifts: [], queueItems: [], featuredMessageId: null });
  const actionHandlersRef = useRef<{
    onAddToQueue?: (item: ChatItem) => void;
    onSendToOverlay?: (item: ChatItem) => void;
    onRemoveFromQueue?: (id: string) => void;
  }>({});

  useEffect(() => {
    try {
      channelRef.current = new BroadcastChannel(CHANNEL_NAME);

      // Respond to state requests and actions from pop-out windows
      channelRef.current.onmessage = (event) => {
        const data = event.data as ChatBroadcastData;
        if (data.type === 'request-state') {
          // Send current state
          channelRef.current?.postMessage({
            type: 'chat-update',
            chatItems: dataRef.current.chatItems,
          });
          channelRef.current?.postMessage({
            type: 'gifts-update',
            gifts: dataRef.current.gifts,
          });
          channelRef.current?.postMessage({
            type: 'queue-update',
            queueItems: dataRef.current.queueItems,
          });
          channelRef.current?.postMessage({
            type: 'featured-update',
            featuredMessageId: dataRef.current.featuredMessageId,
          });
        } else if (data.type === 'action-add-to-queue' && data.item) {
          actionHandlersRef.current.onAddToQueue?.(data.item);
        } else if (data.type === 'action-send-to-overlay' && data.item) {
          actionHandlersRef.current.onSendToOverlay?.(data.item);
        } else if (data.type === 'action-remove-from-queue' && data.itemId) {
          actionHandlersRef.current.onRemoveFromQueue?.(data.itemId);
        }
      };

      return () => {
        channelRef.current?.close();
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e);
    }
  }, []);

  const setActionHandlers = useCallback((handlers: {
    onAddToQueue?: (item: ChatItem) => void;
    onSendToOverlay?: (item: ChatItem) => void;
    onRemoveFromQueue?: (id: string) => void;
  }) => {
    actionHandlersRef.current = handlers;
  }, []);

  const broadcastChatItems = useCallback((items: ChatItem[]) => {
    dataRef.current.chatItems = items;
    channelRef.current?.postMessage({
      type: 'chat-update',
      chatItems: items,
    });
  }, []);

  const broadcastGifts = useCallback((gifts: GiftData[]) => {
    dataRef.current.gifts = gifts;
    channelRef.current?.postMessage({
      type: 'gifts-update',
      gifts,
    });
  }, []);

  const broadcastQueueItems = useCallback((items: ChatItem[]) => {
    dataRef.current.queueItems = items;
    channelRef.current?.postMessage({
      type: 'queue-update',
      queueItems: items,
    });
  }, []);

  const broadcastFeaturedMessageId = useCallback((id: string | null) => {
    dataRef.current.featuredMessageId = id;
    channelRef.current?.postMessage({
      type: 'featured-update',
      featuredMessageId: id,
    });
  }, []);

  return {
    broadcastChatItems,
    broadcastGifts,
    broadcastQueueItems,
    broadcastFeaturedMessageId,
    setActionHandlers,
  };
}

/**
 * Hook for receiving chat data in pop-out windows
 */
export function useChatReceiver() {
  const channelRef = useRef<BroadcastChannel | null>(null);

  const subscribe = useCallback((
    onChatUpdate?: (items: ChatItem[]) => void,
    onGiftsUpdate?: (gifts: GiftData[]) => void,
    onQueueUpdate?: (items: ChatItem[]) => void,
    onFeaturedUpdate?: (id: string | null) => void,
  ) => {
    try {
      channelRef.current = new BroadcastChannel(CHANNEL_NAME);

      channelRef.current.onmessage = (event) => {
        const data = event.data as ChatBroadcastData;
        
        if (data.type === 'chat-update' && data.chatItems && onChatUpdate) {
          onChatUpdate(data.chatItems);
        }
        if (data.type === 'gifts-update' && data.gifts && onGiftsUpdate) {
          onGiftsUpdate(data.gifts as GiftData[]);
        }
        if (data.type === 'queue-update' && data.queueItems && onQueueUpdate) {
          onQueueUpdate(data.queueItems);
        }
        if (data.type === 'featured-update' && onFeaturedUpdate) {
          onFeaturedUpdate(data.featuredMessageId ?? null);
        }
      };

      // Request current state
      channelRef.current.postMessage({ type: 'request-state' });

      return () => {
        channelRef.current?.close();
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e);
      return () => {};
    }
  }, []);

  // Send action to add item to queue (handled by main ChatPage)
  const sendAddToQueue = useCallback((item: ChatItem) => {
    channelRef.current?.postMessage({
      type: 'action-add-to-queue',
      item,
    });
  }, []);

  // Send action to show item on overlay (handled by main ChatPage)
  const sendToOverlay = useCallback((item: ChatItem) => {
    channelRef.current?.postMessage({
      type: 'action-send-to-overlay',
      item,
    });
  }, []);

  // Send action to remove item from queue (handled by main ChatPage)
  const sendRemoveFromQueue = useCallback((id: string) => {
    channelRef.current?.postMessage({
      type: 'action-remove-from-queue',
      itemId: id,
    });
  }, []);

  return { subscribe, sendAddToQueue, sendToOverlay, sendRemoveFromQueue };
}

export type { GiftData };
