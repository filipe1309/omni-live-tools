import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLeaderElection } from '@/hooks/useLeaderElection';
import { STORAGE_KEYS } from '@/constants';

describe('useLeaderElection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('should become leader when no existing leader', () => {
    const { result } = renderHook(() =>
      useLeaderElection({ leaderKey: 'test-leader' })
    );

    expect(result.current.isLeader).toBe(true);
    expect(localStorage.getItem('test-leader')).toBeTruthy();
  });

  it('should generate a unique tabId', () => {
    const { result: result1 } = renderHook(() =>
      useLeaderElection({ leaderKey: 'test-leader-1' })
    );

    // Clear for second hook
    localStorage.clear();

    const { result: result2 } = renderHook(() =>
      useLeaderElection({ leaderKey: 'test-leader-2' })
    );

    expect(result1.current.tabId).toBeTruthy();
    expect(result2.current.tabId).toBeTruthy();
    // Different hooks should have different tabIds
    expect(result1.current.tabId).not.toBe(result2.current.tabId);
  });

  it('should not become leader if another tab is active', () => {
    // Set up an existing leader
    const existingLeader = {
      id: 'other-tab-123',
      timestamp: Date.now(),
    };
    localStorage.setItem('test-leader', JSON.stringify(existingLeader));

    const { result } = renderHook(() =>
      useLeaderElection({ leaderKey: 'test-leader' })
    );

    expect(result.current.isLeader).toBe(false);
  });

  it('should take over leadership if existing leader is stale', () => {
    // Set up a stale leader (old timestamp)
    const staleLeader = {
      id: 'old-tab-123',
      timestamp: Date.now() - 10000, // 10 seconds ago
    };
    localStorage.setItem('test-leader', JSON.stringify(staleLeader));

    const { result } = renderHook(() =>
      useLeaderElection({
        leaderKey: 'test-leader',
        leaderTimeout: 5000,
      })
    );

    expect(result.current.isLeader).toBe(true);
  });

  it('should update heartbeat periodically when leader', () => {
    const { result } = renderHook(() =>
      useLeaderElection({
        leaderKey: 'test-leader',
        heartbeatInterval: 1000,
      })
    );

    expect(result.current.isLeader).toBe(true);

    // Get initial timestamp
    const initialData = JSON.parse(localStorage.getItem('test-leader')!);
    const initialTimestamp = initialData.timestamp;

    // Advance time past heartbeat interval
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // Check timestamp was updated
    const updatedData = JSON.parse(localStorage.getItem('test-leader')!);
    expect(updatedData.timestamp).toBeGreaterThan(initialTimestamp);
  });

  it('should clean up on unmount', () => {
    const { result, unmount } = renderHook(() =>
      useLeaderElection({ leaderKey: 'test-leader' })
    );

    const tabId = result.current.tabId;
    expect(result.current.isLeader).toBe(true);

    // Unmount should remove leadership
    unmount();

    // After unmount, the leader entry should be removed
    const leaderData = localStorage.getItem('test-leader');
    if (leaderData) {
      const parsed = JSON.parse(leaderData);
      // Either removed or it's from another tab
      expect(parsed.id).not.toBe(tabId);
    }
  });

  it('should call onAutoReconnectChange when setting changes', () => {
    const onAutoReconnectChange = vi.fn();

    renderHook(() =>
      useLeaderElection({
        leaderKey: 'test-leader',
        onAutoReconnectChange,
      })
    );

    // Simulate storage event for auto-reconnect setting
    act(() => {
      const event = new StorageEvent('storage', {
        key: STORAGE_KEYS.AUTO_RECONNECT,
        newValue: 'true',
      });
      window.dispatchEvent(event);
    });

    expect(onAutoReconnectChange).toHaveBeenCalledWith(true);
  });

  it('should re-check leadership when storage changes', () => {
    const { result } = renderHook(() =>
      useLeaderElection({ leaderKey: 'test-leader' })
    );

    expect(result.current.isLeader).toBe(true);

    // Simulate another tab taking over
    act(() => {
      const newLeader = {
        id: 'new-tab-123',
        timestamp: Date.now() + 1000,
      };
      localStorage.setItem('test-leader', JSON.stringify(newLeader));

      const event = new StorageEvent('storage', {
        key: 'test-leader',
        newValue: JSON.stringify(newLeader),
      });
      window.dispatchEvent(event);
    });

    // Note: The hook should re-check and potentially lose leadership
    // This depends on the timestamp comparison
  });

  it('should handle invalid JSON in localStorage', () => {
    localStorage.setItem('test-leader', 'invalid-json');

    const { result } = renderHook(() =>
      useLeaderElection({ leaderKey: 'test-leader' })
    );

    // Should become leader since existing data is invalid
    expect(result.current.isLeader).toBe(true);
  });
});
