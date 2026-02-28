import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { ChatMessage } from './ChatMessage';
import { useLanguage } from '@/i18n';
import type { ChatItem } from '@/types';

interface ChatContainerProps {
  items: ChatItem[];
  title: string;
  maxHeight?: string;
  onAddToQueue?: (item: ChatItem) => void;
  onSendToOverlay?: (item: ChatItem) => void;
  featuredMessageId?: string | null;
}

export function ChatContainer({ items, title, maxHeight = 'calc(100vh - 320px)', onAddToQueue, onSendToOverlay, featuredMessageId }: ChatContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const isScrollingProgrammatically = useRef(false);
  const lastItemsLength = useRef(items.length);
  const { t } = useLanguage();

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.content.toLowerCase().includes(query) ||
      item.user.uniqueId?.toLowerCase().includes(query) ||
      item.user.nickname?.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

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

  // Auto-scroll to bottom when new items arrive (only if autoScroll is enabled and no search filter)
  useEffect(() => {
    if (containerRef.current && autoScroll && !searchQuery.trim()) {
      // Check if new items were added
      const newItemsAdded = items.length > lastItemsLength.current;
      lastItemsLength.current = items.length;
      
      if (newItemsAdded) {
        isScrollingProgrammatically.current = true;
        // Use instant scroll for rapid messages, smooth for normal pace
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: 'instant',
        });
        // Reset flag immediately for instant scroll
        requestAnimationFrame(() => {
          isScrollingProgrammatically.current = false;
        });
      }
    }
  }, [items.length, autoScroll, searchQuery]);

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

      {/* Search box */}
      <div className="relative mb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.chat.searchPlaceholder}
          className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 pl-9 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
        />
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Filter count indicator */}
      {searchQuery.trim() && (
        <div className="text-xs text-slate-400 mb-2 text-center">
          {t.chat.filterResults.replace('{count}', String(filteredItems.length)).replace('{total}', String(items.length))}
        </div>
      )}
      
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="chat-container overflow-y-auto space-y-1"
        style={{ maxHeight }}
      >
        {filteredItems.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            {searchQuery.trim() ? t.chat.noSearchResults : t.chat.noMessages}
          </div>
        ) : (
          filteredItems.map((item) => (
            <ChatMessage 
              key={item.id} 
              item={item} 
              onAddToQueue={onAddToQueue} 
              onSendToOverlay={onSendToOverlay}
              isOnOverlay={featuredMessageId === item.id}
            />
          ))
        )}
      </div>

      {/* Auto-scroll paused indicator */}
      {!autoScroll && filteredItems.length > 0 && !searchQuery.trim() && (
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
