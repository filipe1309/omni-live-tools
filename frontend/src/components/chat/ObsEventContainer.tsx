import { useRef, useEffect } from 'react';
import { ObsChatMessage } from './ObsChatMessage';
import { ObsGiftCard } from './ObsGiftCard';
import type { ChatItem } from '@/types';

interface ObsEventContainerProps {
  items: ChatItem[];
  fontColor?: string;
  maxHeight?: string;
}

/**
 * Event container for OBS overlay
 * Combines chat, gifts, and other events in a single scrollable container
 * Matches the eventcontainer from public/obs.html
 */
export function ObsEventContainer({ items, fontColor, maxHeight = 'calc(100vh - 90px)' }: ObsEventContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new items arrive
  useEffect(() => {
    if (containerRef.current) {
      // Use instant scroll for reliable auto-scroll during rapid messages
      const container = containerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'instant',
      });
    }
  }, [items.length]);

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto"
      style={{
        height: maxHeight,
        wordWrap: 'break-word',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <style>{`
        .obs-event-container::-webkit-scrollbar {
          width: 0px;
          height: 0px;
        }
      `}</style>
      <div className="obs-event-container space-y-[5px]">
        {items.map((item) => (
          <div key={item.id} className={item.isTemporary ? 'temporary' : 'static'}>
            {item.type === 'gift' && item.giftData ? (
              <ObsGiftCard
                gift={item.giftData}
                isPending={item.isPendingStreak}
                fontColor={fontColor}
              />
            ) : (
              <ObsChatMessage item={item} fontColor={fontColor} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
