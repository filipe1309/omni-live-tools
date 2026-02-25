import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ProfilePicture } from '@/components/common/ProfilePicture';
import { TikTokIcon, TwitchIcon, YouTubeIcon } from '@/components/common/PlatformSelector';
import type { ChatItem } from '@/types';

function PlatformBadge({ platform }: { platform?: 'tiktok' | 'twitch' | 'youtube' }) {
  if (!platform) return null;
  
  if (platform === 'tiktok') {
    return <TikTokIcon className="w-8 h-8 text-cyan-400 flex-shrink-0" />;
  }
  if (platform === 'youtube') {
    return <YouTubeIcon className="w-8 h-8 text-red-500 flex-shrink-0" />;
  }
  return <TwitchIcon className="w-8 h-8 text-purple-400 flex-shrink-0" />;
}

export function ObsFeaturedMessagePage() {
  const [searchParams] = useSearchParams();
  const [featuredMessage, setFeaturedMessage] = useState<ChatItem | null>(null);

  // Parse settings from URL
  const bgColor = searchParams.get('bgColor') || 'transparent';
  const fontColor = searchParams.get('fontColor') || '#e3e5eb';
  const fontSize = searchParams.get('fontSize') || '1.5em';

  useEffect(() => {
    console.log('[ObsFeaturedMessagePage] Setting up Socket.IO listener');
    // Connect to backend - use same origin in production, explicit URL in dev
    const backendUrl = import.meta.env.DEV ? 'http://localhost:8081' : undefined;
    const socket = io(backendUrl);

    socket.on('connect', () => {
      console.log('[ObsFeaturedMessagePage] Socket connected');
    });

    socket.on('featuredMessage', (message: ChatItem) => {
      console.log('[ObsFeaturedMessagePage] Received featured message:', message);
      setFeaturedMessage(message);
    });

    socket.on('featuredMessageCleared', () => {
      console.log('[ObsFeaturedMessagePage] Featured message cleared');
      setFeaturedMessage(null);
    });

    return () => {
      console.log('[ObsFeaturedMessagePage] Disconnecting socket');
      socket.disconnect();
    };
  }, []);

  if (!featuredMessage) {
    return (
      <div 
        className="min-h-screen w-full flex items-center justify-center"
        style={{ backgroundColor: bgColor }}
      >
        {/* Empty state - transparent for OBS */}
      </div>
    );
  }

  const initial = (featuredMessage.user.nickname || featuredMessage.user.uniqueId || '?').charAt(0);
  const isSuperchat = featuredMessage.isSuperchat;
  
  // Strip leading @ from uniqueId to avoid double @@ display
  const displayUsername = featuredMessage.user.uniqueId.startsWith('@') 
    ? featuredMessage.user.uniqueId.slice(1) 
    : featuredMessage.user.uniqueId;

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-8"
      style={{ backgroundColor: bgColor }}
    >
      <div 
        className={`max-w-2xl w-full rounded-2xl p-6 shadow-2xl animate-fade-in ${
          isSuperchat 
            ? 'bg-gradient-to-r from-yellow-500/30 to-amber-500/30 border-2 border-yellow-400/50' 
            : 'bg-slate-800/90 border border-slate-600/50'
        }`}
      >
        {/* Header with user info */}
        <div className="flex items-center gap-4 mb-4">
          {isSuperchat && (
            <span className="text-4xl animate-pulse">💰</span>
          )}
          <ProfilePicture 
            src={featuredMessage.user.profilePictureUrl} 
            size="lg" 
            fallbackInitial={initial}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <PlatformBadge platform={featuredMessage.platform} />
              <span 
                className="font-bold text-2xl"
                style={{ color: fontColor }}
              >
                {featuredMessage.user.nickname || displayUsername}
              </span>
            </div>
            {displayUsername !== featuredMessage.user.nickname && (
              <span className="text-slate-400 text-lg">
                @{displayUsername}
              </span>
            )}
          </div>
        </div>

        {/* Message content */}
        <div 
          className="text-center leading-relaxed"
          style={{ 
            color: featuredMessage.color || fontColor,
            fontSize,
          }}
        >
          "{featuredMessage.content}"
        </div>
      </div>
    </div>
  );
}
