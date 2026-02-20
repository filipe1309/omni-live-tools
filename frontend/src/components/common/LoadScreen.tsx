import { useEffect, useState, useRef } from 'react';

interface LoadScreenProps {
  duration?: number;
  onComplete: () => void;
}

export function LoadScreen ({ duration = 1500, onComplete }: LoadScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, duration - 500);

    const completeTimer = setTimeout(() => {
      onCompleteRef.current();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [duration]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'
        }`}
    >
      <div className="flex flex-col items-center space-y-6">
        <img
          src="/omni-logo.jpg"
          alt="Omni LIVE Tools"
          className={`w-48 h-48 rounded-2xl shadow-2xl transform transition-all duration-700 ${fadeOut ? 'scale-95 opacity-0' : 'scale-100 opacity-100 animate-pulse'
            }`}
        />
        <div className={`text-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
          <h1 className="text-3xl font-bold text-white tracking-wide">Omni LIVE Tools</h1>
          <p className="text-gray-400 mt-2 text-sm">Loading...</p>
        </div>
      </div>
    </div>
  );
}
