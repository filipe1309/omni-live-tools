import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react';
import type { ConnectionStatus } from '@/hooks';

interface ConnectionFormProps {
  onConnect: (uniqueId: string) => void;
  onDisconnect?: () => void;
  status: ConnectionStatus;
  errorMessage?: string | null;
  defaultUsername?: string;
  username?: string;
  onUsernameChange?: (username: string) => void;
  compact?: boolean;
  autoFocus?: boolean;
  autoReconnect?: boolean;
  onAutoReconnectChange?: (enabled: boolean) => void;
}

const statusConfig = {
  disconnected: {
    text: 'Desconectado',
    className: 'bg-red-500/20 text-red-400 border-red-500',
  },
  connecting: {
    text: 'Conectando...',
    className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500 animate-pulse',
  },
  connected: {
    text: 'Conectado',
    className: 'bg-green-500/20 text-green-400 border-green-500',
  },
  error: {
    text: 'Erro na conexão',
    className: 'bg-red-500/20 text-red-400 border-red-500',
  },
};

export function ConnectionForm({ onConnect, onDisconnect, status, errorMessage, defaultUsername = 'jamesbonfim', username: controlledUsername, onUsernameChange, compact = false, autoFocus = false, autoReconnect = false, onAutoReconnectChange }: ConnectionFormProps) {
  const [internalUsername, setInternalUsername] = useState(defaultUsername);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);
  
  // Use controlled or internal state
  const username = controlledUsername !== undefined ? controlledUsername : internalUsername;
  const setUsername = (value: string) => {
    if (onUsernameChange) {
      onUsernameChange(value);
    } else {
      setInternalUsername(value);
    }
  };

  // Sync internal state with defaultUsername on mount
  useEffect(() => {
    if (controlledUsername === undefined) {
      setInternalUsername(defaultUsername);
    }
  }, [defaultUsername, controlledUsername]);

  const config = statusConfig[status];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (status === 'connected' && onDisconnect) {
      onDisconnect();
    } else if (username.trim()) {
      onConnect(username.trim());
    }
  };

  const handleKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-3 flex-wrap">
        <input
          ref={inputRef}
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyUp={handleKeyUp}
          placeholder="@jamesbonfim"
          className="input-field w-48"
          disabled={status === 'connecting'}
        />
        <button
          type="submit"
          disabled={status === 'connecting' || (!username.trim() && status !== 'connected')}
          className={status === 'connected' ? 'btn-danger' : 'btn-primary'}
        >
          {status === 'connecting' ? 'Conectando...' : status === 'connected' ? 'Desconectar' : 'Conectar'}
        </button>
        <span className={`px-3 py-1.5 rounded-full text-sm font-bold border ${config.className}`}>
          {config.text}
        </span>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <p className="text-slate-300">
          Digite o <b className="text-tiktok-cyan">@usuário</b> de alguém que está ao vivo:
        </p>
        <input
          ref={inputRef}
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyUp={handleKeyUp}
          placeholder="@jamesbonfim"
          className="input-field w-52"
          disabled={status === 'connecting'}
        />
        <button
          type="submit"
          disabled={status === 'connecting' || (!username.trim() && status !== 'connected')}
          className={`px-6 py-3 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            status === 'connected'
              ? 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400 hover:shadow-lg hover:shadow-red-500/30'
              : 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-500 hover:to-green-400 hover:shadow-lg hover:shadow-green-500/30'
          }`}
        >
          {status === 'connecting' ? 'Conectando...' : status === 'connected' ? 'Desconectar' : status === 'error' ? '🔄 Tentar Novamente' : 'Conectar'}
        </button>
        
        {/* Auto-reconnect checkbox */}
        {onAutoReconnectChange && (
          <div className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
            autoReconnect 
              ? 'bg-purple-900/30 border-purple-500/50' 
              : 'bg-slate-900/50 border-slate-700/50'
          }`}>
            <button
              type="button"
              onClick={() => onAutoReconnectChange(!autoReconnect)}
              className={`w-5 h-5 flex items-center justify-center rounded border-2 transition-all flex-shrink-0 text-sm ${
                autoReconnect
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-slate-800 border-slate-600 text-transparent hover:border-slate-500'
              }`}
            >
              {autoReconnect && '✓'}
            </button>
            <span className="text-sm text-slate-300">
              🔄 Reconexão automática
            </span>
          </div>
        )}
      </div>
      
      {/* Error message with retry hint */}
      {status === 'error' && errorMessage && (
        <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <span className="text-red-400 text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="text-red-300 text-sm font-medium">{errorMessage}</p>
            <p className="text-red-400/70 text-xs mt-1">
              Verifique se o usuário está ao vivo e tente novamente.
            </p>
          </div>
        </div>
      )}
    </form>
  );
}
