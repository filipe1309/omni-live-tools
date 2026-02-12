import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePollKeyboardShortcuts } from '@/hooks/usePollKeyboardShortcuts';

describe('usePollKeyboardShortcuts', () => {
  const mockOnStart = vi.fn();
  const mockOnStop = vi.fn();
  const mockOnReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const triggerKeyDown = (key: string, options: { ctrlKey?: boolean } = {}) => {
    const event = new KeyboardEvent('keydown', { key, ...options });
    window.dispatchEvent(event);
  };

  it('should call onStart when CTRL+M is pressed and conditions are met', () => {
    renderHook(() =>
      usePollKeyboardShortcuts({
        onStart: mockOnStart,
        onStop: mockOnStop,
        onReset: mockOnReset,
        isConnected: true,
        isRunning: false,
        isCountingDown: false,
      })
    );

    triggerKeyDown('m', { ctrlKey: true });
    expect(mockOnStart).toHaveBeenCalledTimes(1);
  });

  it('should not call onStart when not connected', () => {
    renderHook(() =>
      usePollKeyboardShortcuts({
        onStart: mockOnStart,
        onStop: mockOnStop,
        onReset: mockOnReset,
        isConnected: false,
        isRunning: false,
        isCountingDown: false,
      })
    );

    triggerKeyDown('m', { ctrlKey: true });
    expect(mockOnStart).not.toHaveBeenCalled();
  });

  it('should not call onStart when already running', () => {
    renderHook(() =>
      usePollKeyboardShortcuts({
        onStart: mockOnStart,
        onStop: mockOnStop,
        onReset: mockOnReset,
        isConnected: true,
        isRunning: true,
        isCountingDown: false,
      })
    );

    triggerKeyDown('m', { ctrlKey: true });
    expect(mockOnStart).not.toHaveBeenCalled();
  });

  it('should call onStop when CTRL+, is pressed during running poll', () => {
    renderHook(() =>
      usePollKeyboardShortcuts({
        onStart: mockOnStart,
        onStop: mockOnStop,
        onReset: mockOnReset,
        isConnected: true,
        isRunning: true,
        isCountingDown: false,
      })
    );

    triggerKeyDown(',', { ctrlKey: true });
    expect(mockOnStop).toHaveBeenCalledTimes(1);
  });

  it('should not call onStop when poll is not running', () => {
    renderHook(() =>
      usePollKeyboardShortcuts({
        onStart: mockOnStart,
        onStop: mockOnStop,
        onReset: mockOnReset,
        isConnected: true,
        isRunning: false,
        isCountingDown: false,
      })
    );

    triggerKeyDown(',', { ctrlKey: true });
    expect(mockOnStop).not.toHaveBeenCalled();
  });

  it('should call onReset when CTRL+. is pressed and not running', () => {
    renderHook(() =>
      usePollKeyboardShortcuts({
        onStart: mockOnStart,
        onStop: mockOnStop,
        onReset: mockOnReset,
        isConnected: true,
        isRunning: false,
        isCountingDown: false,
      })
    );

    triggerKeyDown('.', { ctrlKey: true });
    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });

  it('should not call onReset when running', () => {
    renderHook(() =>
      usePollKeyboardShortcuts({
        onStart: mockOnStart,
        onStop: mockOnStop,
        onReset: mockOnReset,
        isConnected: true,
        isRunning: true,
        isCountingDown: false,
      })
    );

    triggerKeyDown('.', { ctrlKey: true });
    expect(mockOnReset).not.toHaveBeenCalled();
  });

  it('should allow shortcuts with modifier keys when input is focused', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    renderHook(() =>
      usePollKeyboardShortcuts({
        onStart: mockOnStart,
        onStop: mockOnStop,
        onReset: mockOnReset,
        isConnected: true,
        isRunning: false,
        isCountingDown: false,
      })
    );

    // Create event with input as target - Ctrl+M should work even in input
    const event = new KeyboardEvent('keydown', { key: 'm', ctrlKey: true });
    Object.defineProperty(event, 'target', { value: input });
    window.dispatchEvent(event);

    expect(mockOnStart).toHaveBeenCalledTimes(1);
    document.body.removeChild(input);
  });

  it('should ignore plain keypresses without modifiers when input is focused', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    renderHook(() =>
      usePollKeyboardShortcuts({
        onStart: mockOnStart,
        onStop: mockOnStop,
        onReset: mockOnReset,
        isConnected: true,
        isRunning: false,
        isCountingDown: false,
      })
    );

    // Create event with input as target - plain key should be ignored
    const event = new KeyboardEvent('keydown', { key: 'm' });
    Object.defineProperty(event, 'target', { value: input });
    window.dispatchEvent(event);

    expect(mockOnStart).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('should work with CTRL+M shortcut', () => {
    renderHook(() =>
      usePollKeyboardShortcuts({
        onStart: mockOnStart,
        onStop: mockOnStop,
        onReset: mockOnReset,
        isConnected: true,
        isRunning: false,
        isCountingDown: false,
      })
    );

    triggerKeyDown('m', { ctrlKey: true });
    expect(mockOnStart).toHaveBeenCalledTimes(1);
  });

  it('should cleanup event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() =>
      usePollKeyboardShortcuts({
        onStart: mockOnStart,
        onStop: mockOnStop,
        onReset: mockOnReset,
        isConnected: true,
        isRunning: false,
        isCountingDown: false,
      })
    );

    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });
});
