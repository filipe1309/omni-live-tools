import { useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import type { ChatItem } from '@/types';

interface ChatContainerProps {
  items: ChatItem[];
  title: string;
  maxHeight?: string;
}

export function ChatContainer({ items, title, maxHeight = 'calc(100vh - 320px)' }: ChatContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new items arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [items.length]);

  return (
    <div className="card flex flex-col">
      <h3 className="text-lg font-bold text-center mb-4 pb-3 border-b border-slate-700">
        {title}
      </h3>
      
      <div 
        ref={containerRef}
        className="chat-container overflow-y-auto space-y-1"
        style={{ maxHeight }}
      >
        {items.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            No messages yet...
          </div>
        ) : (
          items.map((item) => (
            <ChatMessage key={item.id} item={item} />
          ))
        )}
      </div>
    </div>
  );
}
