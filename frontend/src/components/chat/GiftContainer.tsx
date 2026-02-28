import { useRef, useEffect, useState, useCallback } from 'react';
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
  const [autoScroll, setAutoScroll] = useState(true);
  const isScrollingProgrammatically = useRef(false);
  const { t } = useLanguage();

  // Check if user is at the bottom of the container
  const isAtBottom = useCallback(() => {
    if (!containerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // Consider "at bottom" if within 200px of the bottom (increased for rapid messages)
    return scrollHeight - scrollTop - clientHeight < 200;
  }, []);

  // Handle scroll events to enable/disable auto-scroll
  const handleScroll = useCallback(() => {
    // Ignore scroll events during programmatic scrolling
    if (isScrollingProgrammatically.current) return;
    setAutoScroll(isAtBottom());
  }, [isAtBottom]);

  // Auto-scroll to bottom when new gifts arrive (only if autoScroll is enabled)
  useEffect(() => {
    if (containerRef.current && autoScroll) {
      isScrollingProgrammatically.current = true;
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'instant',
      });
      // Reset flag immediately for instant scroll
      requestAnimationFrame(() => {
        isScrollingProgrammatically.current = false;
      });
    }
  }, [gifts.length, autoScroll]);

  // Scroll to bottom when clicking the indicator
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      isScrollingProgrammatically.current = true;
      setAutoScroll(true);
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
      // Reset flag after animation completes
      setTimeout(() => {
        isScrollingProgrammatically.current = false;
      }, 500);
    }
  }, []);

  return (
    <div className="card flex flex-col relative">
      <h3 className="text-lg font-bold text-center mb-4 pb-3 border-b border-slate-700">
        {title}
      </h3>
      
      <div 
        ref={containerRef}
        onScroll={handleScroll}
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

      {/* Auto-scroll paused indicator */}
      {!autoScroll && gifts.length > 0 && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-700/90 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-full text-sm flex items-center gap-2 shadow-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          {t.chat.scrollPaused}
        </button>
      )}
    </div>
  );
}
