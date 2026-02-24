import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChatContainer } from '@/components';
import { useChatReceiver } from '@/hooks/useChatBroadcast';
import { useLanguage } from '@/i18n';
import type { ChatItem } from '@/types';

export function ObsChatPage() {
  const [searchParams] = useSearchParams();
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [featuredMessageId, setFeaturedMessageId] = useState<string | null>(null);
  const { subscribe, sendAddToQueue, sendToOverlay } = useChatReceiver();
  const { t } = useLanguage();

  // Parse settings from URL
  const bgColor = searchParams.get('bgColor') || 'transparent';

  useEffect(() => {
    const unsubscribe = subscribe(
      (items) => setChatItems(items),
      undefined,
      undefined,
      (id) => setFeaturedMessageId(id)
    );
    return unsubscribe;
  }, [subscribe]);

  // Handlers that send actions back to main ChatPage
  const handleAddToQueue = useCallback((item: ChatItem) => {
    sendAddToQueue(item);
  }, [sendAddToQueue]);

  const handleSendToOverlay = useCallback((item: ChatItem) => {
    sendToOverlay(item);
  }, [sendToOverlay]);

  return (
    <div 
      className="min-h-screen w-full p-4"
      style={{ backgroundColor: bgColor }}
    >
      <ChatContainer 
        items={chatItems} 
        title={`💬 ${t.chat.chats}`}
        maxHeight="calc(100vh - 32px)"
        onAddToQueue={handleAddToQueue}
        onSendToOverlay={handleSendToOverlay}
        featuredMessageId={featuredMessageId}
      />
    </div>
  );
}
