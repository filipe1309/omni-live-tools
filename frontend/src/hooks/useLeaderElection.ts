import { useState, useEffect, useRef } from 'react';
import { STORAGE_KEYS } from '@/constants';

interface UseLeaderElectionOptions {
  /** Unique key for localStorage to store leader info */
  leaderKey: string;
  /** Interval in ms between heartbeat updates (default: 2000) */
  heartbeatInterval?: number;
  /** Time in ms after which a leader is considered stale (default: 5000) */
  leaderTimeout?: number;
  /** Optional callback when auto-reconnect setting changes */
  onAutoReconnectChange?: (enabled: boolean) => void;
}

interface UseLeaderElectionReturn {
  /** Whether this tab is the current leader */
  isLeader: boolean;
  /** Unique ID for this tab */
  tabId: string;
}

// Generate unique tab ID - stable across the lifecycle of the hook
const generateTabId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Hook to implement leader election between browser tabs
 * Uses localStorage for coordination - only one tab becomes the leader
 * Leader sends heartbeats; if leader times out, another tab takes over
 */
export function useLeaderElection ({
  leaderKey,
  heartbeatInterval = 2000,
  leaderTimeout = 5000,
  onAutoReconnectChange,
}: UseLeaderElectionOptions): UseLeaderElectionReturn {
  const tabIdRef = useRef<string>(generateTabId(leaderKey.replace(/-leader$/, '')));
  const [isLeader, setIsLeader] = useState(false);

  useEffect(() => {
    const tabId = tabIdRef.current;

    const tryBecomeLeader = () => {
      const leaderData = localStorage.getItem(leaderKey);
      const now = Date.now();

      if (!leaderData) {
        // No leader, become leader
        localStorage.setItem(leaderKey, JSON.stringify({ id: tabId, timestamp: now }));
        setIsLeader(true);
        return true;
      }

      try {
        const leader = JSON.parse(leaderData);
        if (leader.id === tabId) {
          // We are already the leader, update heartbeat
          localStorage.setItem(leaderKey, JSON.stringify({ id: tabId, timestamp: now }));
          setIsLeader(true);
          return true;
        }

        // Check if leader is stale (timed out)
        if (now - leader.timestamp > leaderTimeout) {
          // Leader timed out, take over
          localStorage.setItem(leaderKey, JSON.stringify({ id: tabId, timestamp: now }));
          setIsLeader(true);
          return true;
        }

        // Another tab is the active leader
        setIsLeader(false);
        return false;
      } catch {
        // Invalid data, become leader
        localStorage.setItem(leaderKey, JSON.stringify({ id: tabId, timestamp: now }));
        setIsLeader(true);
        return true;
      }
    };

    // Try to become leader immediately
    tryBecomeLeader();

    // Heartbeat interval - leader refreshes, followers check if leader is alive
    const interval = setInterval(tryBecomeLeader, heartbeatInterval);

    // Listen for storage changes (when another tab becomes leader or updates state)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === leaderKey) {
        tryBecomeLeader();
      }
      // Listen for auto-reconnect setting changes
      if (e.key === STORAGE_KEYS.AUTO_RECONNECT && onAutoReconnectChange) {
        onAutoReconnectChange(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Cleanup: release leadership if we were the leader
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);

      // Release leadership if we were the leader
      const leaderData = localStorage.getItem(leaderKey);
      if (leaderData) {
        try {
          const leader = JSON.parse(leaderData);
          if (leader.id === tabId) {
            localStorage.removeItem(leaderKey);
          }
        } catch {
          // Ignore
        }
      }
    };
  }, [leaderKey, heartbeatInterval, leaderTimeout, onAutoReconnectChange]);

  return {
    isLeader,
    tabId: tabIdRef.current,
  };
}
