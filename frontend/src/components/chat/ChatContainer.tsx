import { useRef, useEffect, useState, useCallback } from 'react';
import { ChatMessage } from './ChatMessage';
import { useLanguage } from '@/i18n';
import type { ChatItem } from '@/types';

interface ChatContainerProps {
  items: ChatItem[];
  title: string;
  maxHeight?: string;
  onAddToQueue?: (item: ChatItem) => void;
}

export function ChatContainer({ items, title, maxHeight = 'calc(100vh - 320px)', onAddToQueue }: ChatContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const isScrollingProgrammatically = useRef(false);
  const { t } = useLanguage();

  // Check if user is at the bottom of the container
  const isAtBottom = useCallback(() => {
    if (!containerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // Consider "at bottom" if within 50px of the bottom
    return scrollHeight - scrollTop - clientHeight < 50;
  }, []);

  // Handle scroll events to enable/disable auto-scroll
  const handleScroll = useCallback(() => {
    // Ignore scroll events during programmatic scrolling
    if (isScrollingProgrammatically.current) return;
    setAutoScroll(isAtBottom());
  }, [isAtBottom]);

  // Auto-scroll to bottom when new items arrive (only if autoScroll is enabled)
  useEffect(() => {
    if (containerRef.current && autoScroll) {
      isScrollingProgrammatically.current = true;
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
      // Reset flag after animation completes
      setTimeout(() => {
        isScrollingProgrammatically.current = false;
      }, 500);
    }
  }, [items.length, autoScroll]);

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
        className="chat-container overflow-y-auto space-y-1"
        style={{ maxHeight }}
      >
        {items.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            {t.chat.noMessages}
          </div>
        ) : (
          items.map((item) => (
            <ChatMessage key={item.id} item={item} onAddToQueue={onAddToQueue} />
          ))
        )}
      </div>

      {/* Auto-scroll paused indicator */}
      {!autoScroll && items.length > 0 && (
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
