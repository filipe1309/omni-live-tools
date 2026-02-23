import { useCallback, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ChatItem } from '@/types';

/**
 * Hook for managing featured message overlay communication
 * Uses Socket.IO for cross-origin communication with the backend
 */
export function useFeaturedMessage() {
  const [featuredMessageId, setFeaturedMessageId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const backendUrl = import.meta.env.DEV ? 'http://localhost:8081' : undefined;
    socketRef.current = io(backendUrl);
    console.log('[useFeaturedMessage] Socket.IO initialized');
    
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // Send message to overlay
  const setFeaturedMessage = useCallback((message: ChatItem) => {
    console.log('[useFeaturedMessage] Sending message to overlay:', message.id, message.content);
    if (socketRef.current) {
      // Serialize the message to ensure it can be cloned
      const serializedMessage = JSON.parse(JSON.stringify(message));
      socketRef.current.emit('setFeaturedMessage', serializedMessage);
      setFeaturedMessageId(message.id);
      console.log('[useFeaturedMessage] Message sent via Socket.IO');
    } else {
      console.log('[useFeaturedMessage] Socket not ready');
    }
  }, []);

  // Clear the overlay
  const clearFeaturedMessage = useCallback(() => {
    console.log('[useFeaturedMessage] Clearing overlay');
    if (socketRef.current) {
      socketRef.current.emit('clearFeaturedMessage');
      setFeaturedMessageId(null);
    }
  }, []);

  return {
    featuredMessageId,
    setFeaturedMessage,
    clearFeaturedMessage,
  };
}
