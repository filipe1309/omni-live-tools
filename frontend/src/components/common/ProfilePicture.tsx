interface ProfilePictureProps {
  src: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
};

export function ProfilePicture({ 
  src, 
  alt = 'Profile', 
  size = 'sm',
  className = '' 
}: ProfilePictureProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={`rounded-full object-cover ${sizeClasses[size]} ${className}`}
      loading="lazy"
    />
  );
}
