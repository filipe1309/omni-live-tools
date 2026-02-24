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
 */
export function AnimatedBorder({
  children,
  visible,
  borderWidth = 4,
  className = '',
}: AnimatedBorderProps) {
  if (!visible) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Animated gradient border container */}
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
      
      {/* Glow effect layer */}
      <div
        className="absolute inset-0 rounded-2xl animate-border-rotate opacity-50 blur-md"
        style={{
          padding: borderWidth,
          background: 'linear-gradient(90deg, #00f2ea, #ff0050, #00f2ea, #ff0050)',
          backgroundSize: '300% 100%',
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
