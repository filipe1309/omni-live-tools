import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePollTimer } from '@/hooks/usePollTimer';
import type { PollState } from '@/types';

describe('usePollTimer', () => {
  const mockCallbacks = {
    onCountdownChange: vi.fn(),
    onPollStart: vi.fn(),
    onTimeLeftChange: vi.fn(),
    onPollFinish: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return timer control functions', () => {
    const { result } = renderHook(() => usePollTimer(mockCallbacks));

    expect(result.current.startTimer).toBeInstanceOf(Function);
    expect(result.current.stopTimer).toBeInstanceOf(Function);
    expect(result.current.isCountdownActive).toBeInstanceOf(Function);
    expect(result.current.isTimerActive).toBeInstanceOf(Function);
  });

  it('should start countdown when startTimer is called', () => {
    const { result } = renderHook(() => usePollTimer(mockCallbacks));

    act(() => {
      result.current.startTimer('Test question?', [{ id: 1, text: 'Yes' }], 30);
    });

    // Initial countdown should be 3
    expect(mockCallbacks.onCountdownChange).toHaveBeenCalledWith(3);
    expect(result.current.isCountdownActive()).toBe(true);
  });

  it('should countdown from 3 to 0 then start poll', () => {
    const { result } = renderHook(() => usePollTimer(mockCallbacks));

    act(() => {
      result.current.startTimer('Test?', [{ id: 1, text: 'Yes' }], 10);
    });

    // Initial call
    expect(mockCallbacks.onCountdownChange).toHaveBeenCalledWith(3);

    // After 1 second: countdown = 2
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(mockCallbacks.onCountdownChange).toHaveBeenCalledWith(2);

    // After 2 seconds: countdown = 1
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(mockCallbacks.onCountdownChange).toHaveBeenCalledWith(1);

    // After 3 seconds: countdown = 0 (GO!)
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(mockCallbacks.onCountdownChange).toHaveBeenCalledWith(0);

    // After 500ms more: poll starts
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(mockCallbacks.onPollStart).toHaveBeenCalled();
  });

  it('should decrement timeLeft after poll starts', () => {
    const { result } = renderHook(() => usePollTimer(mockCallbacks));

    act(() => {
      result.current.startTimer('Test?', [{ id: 1, text: 'Yes' }], 5);
    });

    // Skip countdown (3s) + GO delay (0.5s)
    act(() => {
      vi.advanceTimersByTime(3500);
    });

    expect(mockCallbacks.onPollStart).toHaveBeenCalled();

    // After 1 second of poll: timeLeft = 4
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(mockCallbacks.onTimeLeftChange).toHaveBeenCalledWith(4);

    // After 2 seconds of poll: timeLeft = 3
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(mockCallbacks.onTimeLeftChange).toHaveBeenCalledWith(3);
  });

  it('should call onPollFinish when timer reaches 0', () => {
    const { result } = renderHook(() => usePollTimer(mockCallbacks));

    act(() => {
      result.current.startTimer('Test?', [{ id: 1, text: 'Yes' }], 2);
    });

    // Skip countdown (3s) + GO delay (0.5s)
    act(() => {
      vi.advanceTimersByTime(3500);
    });

    // Poll runs for 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockCallbacks.onPollFinish).toHaveBeenCalled();
  });

  it('should stop all timers when stopTimer is called', () => {
    const { result } = renderHook(() => usePollTimer(mockCallbacks));

    act(() => {
      result.current.startTimer('Test?', [{ id: 1, text: 'Yes' }], 30);
    });

    expect(result.current.isCountdownActive()).toBe(true);

    act(() => {
      result.current.stopTimer();
    });

    expect(result.current.isCountdownActive()).toBe(false);
    expect(result.current.isTimerActive()).toBe(false);
  });

  it('should return initial poll state from startTimer', () => {
    const { result } = renderHook(() => usePollTimer(mockCallbacks));

    let state: PollState | undefined;
    act(() => {
      state = result.current.startTimer('Test?', [{ id: 1, text: 'Yes' }, { id: 2, text: 'No' }], 30);
    });

    expect(state).toMatchObject({
      isRunning: false,
      finished: false,
      question: 'Test?',
      options: [{ id: 1, text: 'Yes' }, { id: 2, text: 'No' }],
      timer: 30,
      timeLeft: 30,
      countdown: 3,
    });
    expect(state?.votes).toEqual({ 1: 0, 2: 0 });
  });

  it('should clear existing timers when starting a new timer', () => {
    const { result } = renderHook(() => usePollTimer(mockCallbacks));

    // Start first timer
    act(() => {
      result.current.startTimer('First?', [{ id: 1, text: 'A' }], 30);
    });

    // Advance partially
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    vi.clearAllMocks();

    // Start second timer
    act(() => {
      result.current.startTimer('Second?', [{ id: 2, text: 'B' }], 20);
    });

    // Should restart countdown from 3
    expect(mockCallbacks.onCountdownChange).toHaveBeenCalledWith(3);
  });

  it('should cleanup timers on unmount', () => {
    const { result, unmount } = renderHook(() => usePollTimer(mockCallbacks));

    act(() => {
      result.current.startTimer('Test?', [{ id: 1, text: 'Yes' }], 30);
    });

    unmount();

    // Advancing time should not trigger any more callbacks
    vi.clearAllMocks();
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(mockCallbacks.onCountdownChange).not.toHaveBeenCalled();
  });
});
