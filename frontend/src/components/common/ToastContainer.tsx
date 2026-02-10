import { useToast } from '@/hooks/useToast';

const toastStyles = {
  success: {
    bg: 'bg-green-500/90',
    border: 'border-green-400',
    icon: '✓',
    iconBg: 'bg-green-600',
  },
  error: {
    bg: 'bg-red-500/90',
    border: 'border-red-400',
    icon: '✕',
    iconBg: 'bg-red-600',
  },
  warning: {
    bg: 'bg-yellow-500/90',
    border: 'border-yellow-400',
    icon: '⚠',
    iconBg: 'bg-yellow-600',
  },
  info: {
    bg: 'bg-blue-500/90',
    border: 'border-blue-400',
    icon: 'ℹ',
    iconBg: 'bg-blue-600',
  },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => {
        const style = toastStyles[toast.type];
        
        return (
          <div
            key={toast.id}
            className={`${style.bg} ${style.border} border rounded-lg shadow-lg backdrop-blur-sm animate-slide-in flex items-center gap-3 p-4 pr-10 relative`}
            role="alert"
          >
            <span className={`${style.iconBg} w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
              {style.icon}
            </span>
            <p className="text-white font-medium text-sm">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors text-lg leading-none"
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
