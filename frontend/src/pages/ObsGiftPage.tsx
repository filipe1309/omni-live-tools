import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GiftContainer } from '@/components';
import { useChatReceiver, type GiftData } from '@/hooks/useChatBroadcast';
import { useTranslation } from '@/i18n';

function ObsGiftPage () {
  const [searchParams] = useSearchParams();
  const [gifts, setGifts] = useState<GiftData[]>([]);
  const { subscribe } = useChatReceiver();
  const { t } = useTranslation();

  // Parse settings from URL
  const bgColor = searchParams.get('bgColor') || 'transparent';

  useEffect(() => {
    const unsubscribe = subscribe(
      undefined,
      (giftItems) => setGifts(giftItems),
      undefined
    );
    return unsubscribe;
  }, [subscribe]);

  return (
    <div 
      className="min-h-screen w-full p-4"
      style={{ backgroundColor: bgColor }}
    >
      <GiftContainer 
        gifts={gifts} 
        title={`🎁 ${t.chat.gifts}`}
        maxHeight="calc(100vh - 32px)"
      />
    </div>
  );
}

export { ObsGiftPage };
export default ObsGiftPage;
