import { useLanguage } from '@/i18n';

interface DisconnectedModalProps {
  isReconnecting: boolean;
  isAutoReconnectEnabled: boolean;
  onReconnect: () => void;
}

/**
 * Modal that displays when the poll connection is lost
 * Shows reconnecting state or allows manual reconnection
 */
export function DisconnectedModal ({
  isReconnecting,
  isAutoReconnectEnabled,
  onReconnect,
}: DisconnectedModalProps) {
  const showReconnecting = isReconnecting || isAutoReconnectEnabled;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blur Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Modal Content */}
      <div
        className={`relative z-10 bg-slate-800/95 border-2 rounded-2xl p-10 shadow-2xl max-w-md mx-4 text-center ${showReconnecting
            ? 'border-yellow-500/50 shadow-yellow-500/20'
            : 'border-red-500/50 shadow-red-500/20 animate-pulse'
          }`}
      >
        {showReconnecting ? (
          <ReconnectingContent
            isAutoReconnectEnabled={isAutoReconnectEnabled}
          />
        ) : (
          <DisconnectedContent onReconnect={onReconnect} />
        )}
      </div>
    </div>
  );
}

function ReconnectingContent ({ isAutoReconnectEnabled }: { isAutoReconnectEnabled: boolean }) {
  const { t } = useLanguage();

  return (
    <>
      <div className="text-6xl mb-6 animate-spin">🔄</div>
      <h2 className="text-3xl font-bold text-yellow-400 mb-4">
        {isAutoReconnectEnabled
          ? t.pollResults.autoReconnectTitle
          : t.pollResults.reconnecting}
      </h2>
      <p className="text-slate-400 text-lg mb-8">
        {isAutoReconnectEnabled
          ? t.pollResults.autoReconnectActive
          : t.pollResults.attemptingReconnect}
      </p>
      <div className="flex justify-center gap-2">
        <div
          className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <div
          className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <div
          className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </div>
      {isAutoReconnectEnabled && (
        <p className="text-slate-500 text-sm mt-6">
          {t.pollResults.autoReconnectEnabledMainPage}
        </p>
      )}
    </>
  );
}

function DisconnectedContent ({ onReconnect }: { onReconnect: () => void }) {
  const { t } = useLanguage();

  return (
    <>
      <div className="text-6xl mb-6">⚠️</div>
      <h2 className="text-3xl font-bold text-red-400 mb-4">
        {t.pollResults.disconnected}
      </h2>
      <p className="text-slate-400 text-lg mb-8">
        {t.pollResults.connectionLost}
      </p>
      <button
        onClick={onReconnect}
        className="px-10 py-4 text-xl font-bold rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-400 hover:to-red-400 transition-all hover:scale-105 shadow-lg shadow-red-500/30"
      >
        {t.pollResults.reconnectButton}
      </button>
      <p className="text-slate-500 text-sm mt-6">
        {t.pollResults.autoReconnectTip}
      </p>
    </>
  );
}
