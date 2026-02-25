import { ReactNode } from 'react';

interface AnimatedBorderProps {
  children: ReactNode;
  visible: boolean;
  borderWidth?: number;
  className?: string;
}

/**
 * Animated rotating gradient border component.
 * Creates a TikTok-styled border with flowing cyan/pink colors.
 * Perfect for OBS/streaming capture areas.
 * 
 * Note: Always renders the same DOM structure to prevent child remounts
 * when visibility toggles.
 */
export function AnimatedBorder({
  children,
  visible,
  borderWidth = 4,
  className = '',
}: AnimatedBorderProps) {
  return (
    <div className={`relative flex flex-col ${className}`}>
      {/* Animated gradient border container - hidden when not visible */}
      {visible && (
        <>
          <div
            className="absolute inset-0 rounded-2xl animate-border-rotate"
            style={{
              padding: borderWidth,
              background: 'linear-gradient(90deg, #00f2ea, #ff0050, #00f2ea, #ff0050)',
              backgroundSize: '300% 100%',
            }}
          >
            {/* Inner mask to create border effect */}
            <div className="w-full h-full rounded-xl bg-slate-900" />
          </div>
          
          {/* Glow effect layer - static to reduce GPU usage */}
          <div
            className="absolute inset-0 rounded-2xl opacity-50 blur-md"
            style={{
              padding: borderWidth,
              background: 'linear-gradient(90deg, #00f2ea, #ff0050, #00f2ea, #ff0050)',
              backgroundSize: '300% 100%',
              backgroundPosition: '50% 50%',
            }}
          />
        </>
      )}
      
      {/* Content - always in the same position to prevent remounting */}
      <div className={`relative z-10 flex-1 flex flex-col ${visible ? '' : ''}`}>
        {children}
      </div>
    </div>
  );
}
