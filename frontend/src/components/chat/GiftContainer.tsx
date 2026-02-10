import { useRef, useEffect } from 'react';
import { GiftCard } from './GiftCard';
import { useLanguage } from '@/i18n';
import type { GiftMessage } from '@/types';

interface GiftData extends GiftMessage {
  isPending: boolean;
  streakId: string;
}

interface GiftContainerProps {
  gifts: GiftData[];
  title: string;
  maxHeight?: string;
}

export function GiftContainer({ gifts, title, maxHeight = 'calc(100vh - 320px)' }: GiftContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  // Auto-scroll to bottom when new gifts arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [gifts.length]);

  return (
    <div className="card flex flex-col">
      <h3 className="text-lg font-bold text-center mb-4 pb-3 border-b border-slate-700">
        {title}
      </h3>
      
      <div 
        ref={containerRef}
        className="chat-container overflow-y-auto space-y-3"
        style={{ maxHeight }}
      >
        {gifts.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            {t.chat.noGifts}
          </div>
        ) : (
          gifts.map((gift) => (
            <GiftCard 
              key={gift.streakId} 
              gift={gift} 
              isPending={gift.isPending}
            />
          ))
        )}
      </div>
    </div>
  );
}
