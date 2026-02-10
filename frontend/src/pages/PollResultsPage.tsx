import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import type { PollState, PollOption } from '@/types';
import type { SerializablePollState, SetupConfig } from '@/hooks/usePoll';
import { PollSetup } from '@/components/poll/PollSetup';
import { CONFETTI, POLL_TIMER, DEFAULT_QUESTION, TIMER_THRESHOLDS } from '@/constants';

// Confetti celebration function
const triggerConfetti = () => {
  const animationEnd = Date.now() + CONFETTI.DURATION;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = CONFETTI.PARTICLE_COUNT_MULTIPLIER * (timeLeft / CONFETTI.DURATION);

    // Confetti from left side
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: CONFETTI.COLORS,
    });
    
    // Confetti from right side
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: CONFETTI.COLORS,
    });
  }, CONFETTI.INTERVAL);
};

const DEFAULT_OPTIONS: PollOption[] = [
  { id: 1, text: 'Sim' },
  { id: 2, text: 'Não' },
];

const initialPollState: PollState = {
  isRunning: false,
  finished: false,
  question: '',
  options: [],
  votes: {},
  voters: new Set(),
  timer: POLL_TIMER.DEFAULT,
  timeLeft: 0,
};

// Load full options config from localStorage (all options + selected state)
const loadFullOptionsConfig = (): { allOptions: string[]; selectedOptions: boolean[] } | null => {
  const saved = localStorage.getItem('tiktok-poll-fullOptions');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
};

// Load saved setup config from localStorage
const loadSavedSetupConfig = (): SetupConfig | null => {
  const saved = localStorage.getItem('tiktok-poll-setupConfig');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
};

// Generate unique tab ID
const TAB_ID = `poll-results-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const LEADER_KEY = 'poll-results-leader';
const LEADER_HEARTBEAT_INTERVAL = 2000;
const LEADER_TIMEOUT = 5000;

export function PollResultsPage() {
  const [pollState, setPollState] = useState<PollState>(initialPollState);
  const [setupConfig, setSetupConfig] = useState<SetupConfig | null>(loadSavedSetupConfig);
  const [isWaiting, setIsWaiting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isAutoReconnectEnabled, setIsAutoReconnectEnabled] = useState(() => {
    return localStorage.getItem('tiktok-poll-autoReconnect') === 'true';
  });
  const [channelRef, setChannelRef] = useState<BroadcastChannel | null>(null);
  const [isLeader, setIsLeader] = useState(false);
  
  // Full options for the PollSetup component - use state so it can be updated from broadcast
  const [fullOptionsConfig, setFullOptionsConfig] = useState<{ allOptions: string[]; selectedOptions: boolean[] } | null>(loadFullOptionsConfig);

  // Leader election - only the leader tab polls for updates
  useEffect(() => {
    const tryBecomeLeader = () => {
      const leaderData = localStorage.getItem(LEADER_KEY);
      const now = Date.now();
      
      if (!leaderData) {
        // No leader, become leader
        localStorage.setItem(LEADER_KEY, JSON.stringify({ id: TAB_ID, timestamp: now }));
        setIsLeader(true);
        return true;
      }
      
      try {
        const leader = JSON.parse(leaderData);
        if (leader.id === TAB_ID) {
          // We are already the leader, update heartbeat
          localStorage.setItem(LEADER_KEY, JSON.stringify({ id: TAB_ID, timestamp: now }));
          setIsLeader(true);
          return true;
        }
        
        // Check if leader is stale (timed out)
        if (now - leader.timestamp > LEADER_TIMEOUT) {
          // Leader timed out, take over
          localStorage.setItem(LEADER_KEY, JSON.stringify({ id: TAB_ID, timestamp: now }));
          setIsLeader(true);
          return true;
        }
        
        // Another tab is the active leader
        setIsLeader(false);
        return false;
      } catch {
        // Invalid data, become leader
        localStorage.setItem(LEADER_KEY, JSON.stringify({ id: TAB_ID, timestamp: now }));
        setIsLeader(true);
        return true;
      }
    };

    // Try to become leader immediately
    tryBecomeLeader();

    // Heartbeat interval - leader refreshes, followers check if leader is alive
    const heartbeatInterval = setInterval(tryBecomeLeader, LEADER_HEARTBEAT_INTERVAL);

    // Listen for storage changes (when another tab becomes leader or updates state)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LEADER_KEY) {
        tryBecomeLeader();
      }
      // Listen for auto-reconnect setting changes
      if (e.key === 'tiktok-poll-autoReconnect') {
        setIsAutoReconnectEnabled(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Cleanup: if we're the leader, release leadership
    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('storage', handleStorageChange);
      
      // Release leadership if we were the leader
      const leaderData = localStorage.getItem(LEADER_KEY);
      if (leaderData) {
        try {
          const leader = JSON.parse(leaderData);
          if (leader.id === TAB_ID) {
            localStorage.removeItem(LEADER_KEY);
          }
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    try {
      channel = new BroadcastChannel('poll-results-channel');
      setChannelRef(channel);

      channel.onmessage = (event) => {
        const data = event.data;

        if (data.type === 'poll-update') {
          const state = data.state as SerializablePollState;
          setPollState({
            isRunning: state.isRunning,
            finished: state.finished,
            question: state.question,
            options: state.options,
            votes: state.votes,
            voters: new Set(state.votersArray || []),
            timer: state.timer,
            timeLeft: state.timeLeft,
          });
          setIsWaiting(false);
        } else if (data.type === 'setup-config') {
          // Always update setupConfig immediately - display logic handles what to show
          const config = data.config as SetupConfig;
          setSetupConfig(config);
          // Also update fullOptionsConfig if provided
          if (data.fullOptions) {
            setFullOptionsConfig(data.fullOptions);
          }
          setIsWaiting(false);
        } else if (data.type === 'connection-status') {
          setIsConnected(data.isConnected);
          // Reset reconnecting state when connection status changes
          if (data.isConnected) {
            setIsReconnecting(false);
          }
        }
      };

      // Only the leader tab polls for updates to avoid race conditions
      if (isLeader) {
        channel.postMessage({ type: 'request-state' });
        
        // Poll for updates every second to keep timer and votes in sync
        pollInterval = setInterval(() => {
          if (channel) {
            channel.postMessage({ type: 'request-state' });
          }
        }, 1000);
      }
      
      return () => {
        if (pollInterval) {
          clearInterval(pollInterval);
        }
        channel?.close();
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      channel?.close();
    };
  }, [isLeader]);

  const sendCommand = (command: 'start' | 'stop' | 'reset') => {
    if (!channelRef) return;
    channelRef.postMessage({ type: 'poll-command', command });
  };

  const sendReconnect = () => {
    console.log('[PollResultsPage] Sending reconnect message, channelRef:', !!channelRef);
    if (!channelRef) {
      console.log('[PollResultsPage] No channelRef, cannot send reconnect');
      return;
    }
    setIsReconnecting(true);
    channelRef.postMessage({ type: 'reconnect' });
    console.log('[PollResultsPage] Reconnect message sent');
    
    // Reset reconnecting state after timeout if still not connected
    setTimeout(() => {
      setIsReconnecting(false);
    }, 10000);
  };

  // Broadcast config changes back to PollPage (used by PollSetup onChange)
  const handleSetupChange = useCallback((question: string, options: PollOption[], timer: number, allOptions?: string[], selectedOptions?: boolean[]) => {
    if (!channelRef) return;
    channelRef.postMessage({
      type: 'config-update',
      config: { question, options, timer },
    });
    // Also update local setupConfig
    setSetupConfig({ question, options, timer });
    // Save to localStorage for persistence
    localStorage.setItem('tiktok-poll-setupConfig', JSON.stringify({ question, options, timer }));
    if (allOptions && selectedOptions) {
      localStorage.setItem('tiktok-poll-fullOptions', JSON.stringify({ allOptions, selectedOptions }));
    }
  }, [channelRef]);

  const getTotalVotes = useCallback(() => {
    return Object.values(pollState.votes).reduce((sum, count) => sum + count, 0);
  }, [pollState.votes]);

  const getPercentage = useCallback((optionId: number) => {
    const totalVotes = getTotalVotes();
    if (totalVotes === 0) return 0;
    return ((pollState.votes[optionId] || 0) / totalVotes) * 100;
  }, [pollState.votes, getTotalVotes]);

  const totalVotes = getTotalVotes();
  const maxVotes = Math.max(...Object.values(pollState.votes), 0);

  // Serialize options to string for stable comparison in useMemo
  const pollOptionsKey = JSON.stringify(pollState.options);
  const setupOptionsKey = JSON.stringify(setupConfig?.options || []);

  // Use pollState.options ONLY when poll is actively running, otherwise use setupConfig for live preview
  const displayOptions = useMemo<PollOption[]>(() => {
    if (pollState.isRunning && pollState.options.length > 0) {
      return pollState.options;
    }
    if (setupConfig?.options && setupConfig.options.length > 0) {
      return setupConfig.options;
    }
    return DEFAULT_OPTIONS;
    // Use serialized keys for stable dependency comparison
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollState.isRunning, pollOptionsKey, setupOptionsKey]);

  const winnerIds = useMemo(() => {
    if (!pollState.finished || totalVotes === 0) return [];
    return displayOptions
      .filter(opt => pollState.votes[opt.id] === maxVotes && maxVotes > 0)
      .map(opt => opt.id);
  }, [pollState.finished, pollState.votes, displayOptions, totalVotes, maxVotes]);

  // Confetti celebration when poll finishes
  const hasTriggeredConfetti = useRef(false);
  
  useEffect(() => {
    if (pollState.finished && totalVotes > 0 && winnerIds.length > 0 && !hasTriggeredConfetti.current) {
      hasTriggeredConfetti.current = true;
      triggerConfetti();
    }
  }, [pollState.finished, totalVotes, winnerIds.length]);

  // Reset confetti flag when poll starts running (new poll)
  useEffect(() => {
    if (pollState.isRunning) {
      hasTriggeredConfetti.current = false;
    }
  }, [pollState.isRunning]);

  const displayQuestion = pollState.isRunning ? pollState.question : (setupConfig?.question || DEFAULT_QUESTION);

  if (isWaiting && !setupConfig && pollState.options.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-[#e90048] flex flex-col p-5">
        <div className="text-center mb-5">
          <h1 className="text-4xl font-bold text-white">📊 Resultados da Enquete</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <div className="text-8xl mb-4 animate-spin">🔄</div>
            <div className="text-3xl">Aguardando dados da enquete...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-[#e90048] flex flex-col p-5 relative">
      {/* Disconnected Modal with Blur Background */}
      {!isConnected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blur Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          
          {/* Modal Content */}
          <div className={`relative z-10 bg-slate-800/95 border-2 rounded-2xl p-10 shadow-2xl max-w-md mx-4 text-center ${
            isReconnecting || isAutoReconnectEnabled
              ? 'border-yellow-500/50 shadow-yellow-500/20' 
              : 'border-red-500/50 shadow-red-500/20 animate-pulse'
          }`}>
            {isReconnecting || isAutoReconnectEnabled ? (
              <>
                <div className="text-6xl mb-6 animate-spin">🔄</div>
                <h2 className="text-3xl font-bold text-yellow-400 mb-4">
                  {isAutoReconnectEnabled ? 'Reconexão Automática...' : 'Reconectando...'}
                </h2>
                <p className="text-slate-400 text-lg mb-8">
                  {isAutoReconnectEnabled 
                    ? 'A reconexão automática está ativada. Tentando reconectar...'
                    : 'Tentando restabelecer conexão com o TikTok.'}
                </p>
                <div className="flex justify-center gap-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                {isAutoReconnectEnabled && (
                  <p className="text-slate-500 text-sm mt-6">
                    ✓ Reconexão automática ativada na página principal
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="text-6xl mb-6">⚠️</div>
                <h2 className="text-3xl font-bold text-red-400 mb-4">
                  Desconectado do TikTok
                </h2>
                <p className="text-slate-400 text-lg mb-8">
                  A conexão com o TikTok foi perdida. Clique no botão abaixo para reconectar.
                </p>
                <button
                  onClick={sendReconnect}
                  className="px-10 py-4 text-xl font-bold rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-400 hover:to-red-400 transition-all hover:scale-105 shadow-lg shadow-red-500/30"
                >
                  🔄 Reconectar
                </button>
                <p className="text-slate-500 text-sm mt-6">
                  💡 Dica: Ative a reconexão automática na página principal
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-4">
        {/* Setup Section - Above Results */}
        <div className="p-4 bg-slate-800/50 rounded-xl border border-tiktok-cyan/30">
          <PollSetup
            onStart={() => {}} // Not used - we have separate control buttons
            onChange={handleSetupChange}
            disabled={pollState.isRunning}
            showStartButton={false}
            externalConfig={setupConfig}
            externalFullOptions={fullOptionsConfig}
            initialQuestion={setupConfig?.question}
            initialOptions={fullOptionsConfig?.allOptions}
            initialSelectedOptions={fullOptionsConfig?.selectedOptions}
            initialTimer={setupConfig?.timer}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-2 p-2 bg-purple-500/10 rounded-lg border border-purple-500/30">
          <button 
            onClick={() => sendCommand('start')}
            disabled={!isConnected || pollState.isRunning}
            className="px-4 py-1 text-sm font-bold rounded-md bg-gradient-to-r from-green-400 to-blue-500 text-white hover:from-green-500 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ▶️ Iniciar
          </button>
          <button 
            onClick={() => sendCommand('stop')}
            disabled={!pollState.isRunning}
            className="px-4 py-1 text-sm font-bold rounded-md bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ⏹️ Parar
          </button>
          <button 
            onClick={() => sendCommand('reset')}
            className="px-4 py-1 text-sm font-bold rounded-md bg-slate-700 text-white hover:bg-slate-600 transition-all border border-slate-600"
          >
            🔄 Reiniciar
          </button>
        </div>

        {/* Results Section */}
        <div className="flex-1 space-y-3">
          {/* Question */}
          <div className={`relative overflow-hidden rounded-xl border-l-4 transition-all duration-500 ${
            pollState.isRunning
              ? pollState.timeLeft <= TIMER_THRESHOLDS.CRITICAL
                ? 'bg-red-500/20 border-red-500 animate-pulse shadow-lg shadow-red-500/20'
                : pollState.timeLeft <= TIMER_THRESHOLDS.WARNING
                  ? 'bg-yellow-500/15 border-yellow-500 shadow-lg shadow-yellow-500/10'
                  : 'bg-green-500/10 border-green-500'
              : 'bg-purple-500/10 border-purple-500'
          }`}>
            {/* Animated Timer Bar */}
            {pollState.isRunning && pollState.timer > 0 && (
              <div 
                className={`absolute bottom-0 left-0 h-1.5 transition-all duration-1000 ease-linear ${
                  pollState.timeLeft <= TIMER_THRESHOLDS.CRITICAL 
                    ? 'bg-gradient-to-r from-red-600 to-red-400 animate-pulse' 
                    : pollState.timeLeft <= TIMER_THRESHOLDS.WARNING 
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' 
                      : 'bg-gradient-to-r from-green-500 to-tiktok-cyan'
                }`}
                style={{ 
                  width: `${(pollState.timeLeft / pollState.timer) * 100}%`,
                }}
              />
            )}
            {/* Static bar when not running */}
            {!pollState.isRunning && (
              <div 
                className="absolute bottom-0 left-0 h-1.5 w-full bg-gradient-to-r from-purple-600/50 to-purple-400/50"
              />
            )}
            <div className="text-center py-5 px-6">
              <h3 className={`text-5xl font-bold transition-colors duration-500 ${
                pollState.isRunning
                  ? pollState.timeLeft <= TIMER_THRESHOLDS.CRITICAL
                    ? 'text-red-300'
                    : pollState.timeLeft <= TIMER_THRESHOLDS.WARNING
                      ? 'text-yellow-300'
                      : 'text-white'
                  : 'text-white'
              }`}>{displayQuestion || 'Vote agora!'}</h3>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-3 flex-1 min-h-[440px]">
            {displayOptions.map((option) => {
              const percentage = pollState.options.length > 0 ? getPercentage(option.id) : 0;
              const votes = pollState.votes[option.id] || 0;
              const isWinner = winnerIds.includes(option.id);
              const percentageFixed = totalVotes > 0 ? percentage.toFixed(1) : '0.0';

              return (
                <div 
                  key={option.id}
                  className={`relative overflow-hidden rounded-xl transition-all duration-300 border ${
                    isWinner 
                      ? 'border-yellow-400 bg-yellow-500/10 animate-winner-glow' 
                      : 'border-slate-700/50 bg-slate-800/50'
                  }`}
                >
                  {/* Background Progress Bar */}
                  <div 
                    className={`absolute inset-0 transition-all duration-500 ease-out ${
                      isWinner 
                        ? 'bg-gradient-to-r from-yellow-500/30 to-yellow-400/10' 
                        : 'bg-gradient-to-r from-purple-600/30 to-purple-400/10'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                  
                  {/* Content */}
                  <div className="relative flex items-center justify-between p-5">
                    <div className="flex items-center gap-5">
                      <span className={`w-16 h-16 flex items-center justify-center rounded-full font-bold text-white text-3xl flex-shrink-0 ${
                        isWinner 
                          ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-slate-900' 
                          : 'bg-gradient-to-br from-purple-600 to-purple-400'
                      }`}>
                        {option.id}
                      </span>
                      <span className="font-semibold text-white text-3xl">
                        {option.text}
                        {isWinner && <span className="ml-2">👑</span>}
                      </span>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <span className={`font-bold text-3xl ${isWinner ? 'text-yellow-400' : 'text-tiktok-cyan'}`}>
                        {votes} votos
                      </span>
                      <span className="text-slate-400 text-2xl ml-2">
                        ({percentageFixed}%)
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar Track */}
                  <div className="h-2 bg-slate-900/50">
                    <div 
                      className={`h-full transition-all duration-500 ease-out rounded-r ${
                        isWinner 
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' 
                          : 'bg-gradient-to-r from-purple-600 to-purple-400'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
