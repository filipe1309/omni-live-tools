import { useEffect, useState, useRef, useCallback } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasCompletedRef = useRef(false);

  const handleComplete = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    setFadeOut(true);
    setTimeout(() => {
      onComplete();
    }, 500);
  }, [onComplete]);

  const handleVideoEnd = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  const handleVideoError = useCallback(() => {
    // Fallback if video fails to load - complete after a short delay
    setTimeout(() => {
      handleComplete();
    }, 1000);
  }, [handleComplete]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Attempt to play the video
      video.play().catch(() => {
        // If autoplay fails (e.g., browser policy), complete after delay
        setTimeout(() => {
          handleComplete();
        }, 2000);
      });
    }

    // Fallback timeout in case video doesn't trigger onEnded
    const fallbackTimer = setTimeout(() => {
      handleComplete();
    }, 15000); // 15 seconds max

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [handleComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ backgroundColor: '#040517' }}
    >
      <video
        ref={videoRef}
        src="/omni-logo-video-intro.mp4"
        className="w-64 h-64 object-contain"
        onEnded={handleVideoEnd}
        onError={handleVideoError}
        playsInline
        muted={false}
      />
    </div>
  );
}
