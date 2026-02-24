import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChatQueueContainer } from '@/components';
import { useChatReceiver } from '@/hooks/useChatBroadcast';
import { useLanguage } from '@/i18n';
import type { ChatItem } from '@/types';

export function ObsQueuePage() {
  const [searchParams] = useSearchParams();
  const [queueItems, setQueueItems] = useState<ChatItem[]>([]);
  const [featuredMessageId, setFeaturedMessageId] = useState<string | null>(null);
  const { subscribe, sendToOverlay, sendRemoveFromQueue } = useChatReceiver();
  const { t } = useLanguage();

  // Parse settings from URL
  const bgColor = searchParams.get('bgColor') || 'transparent';

  useEffect(() => {
    const unsubscribe = subscribe(
      undefined,
      undefined,
      (items) => setQueueItems(items),
      (id) => setFeaturedMessageId(id)
    );
    return unsubscribe;
  }, [subscribe]);

  // Handler that sends action back to main ChatPage
  const handleSendToOverlay = useCallback((item: ChatItem) => {
    sendToOverlay(item);
  }, [sendToOverlay]);

  // Handler that sends remove action back to main ChatPage
  const handleRemoveFromQueue = useCallback((id: string) => {
    sendRemoveFromQueue(id);
  }, [sendRemoveFromQueue]);

  return (
    <div 
      className="min-h-screen w-full p-4"
      style={{ backgroundColor: bgColor }}
    >
      <ChatQueueContainer 
        items={queueItems} 
        title={`📋 ${t.chat.queue}`}
        maxHeight="calc(100vh - 32px)"
        onRemove={handleRemoveFromQueue}
        onSendToOverlay={handleSendToOverlay}
        featuredMessageId={featuredMessageId}
      />
    </div>
  );
}
