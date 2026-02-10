import { useState } from 'react';

interface ProfilePictureProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fallbackInitial?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

function FallbackAvatar({ initial, size, className }: { initial: string; size: 'sm' | 'md' | 'lg'; className: string }) {
  return (
    <div 
      className={`rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center ${sizeClasses[size]} ${className}`}
    >
      <span className={`text-white font-bold uppercase ${textSizeClasses[size]}`}>
        {initial || '?'}
      </span>
    </div>
  );
}

export function ProfilePicture({ 
  src, 
  alt = 'Profile', 
  size = 'sm',
  className = '',
  fallbackInitial = '?'
}: ProfilePictureProps) {
  const [hasError, setHasError] = useState(false);

  // Show fallback if no src or if image failed to load
  if (!src || hasError) {
    return <FallbackAvatar initial={fallbackInitial} size={size} className={className} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`rounded-full object-cover ${sizeClasses[size]} ${className}`}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
}
