import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePollDisplay } from '@/hooks/usePollDisplay';
import type { PollState } from '@/types';
import { ReactNode } from 'react';

// Mock useLanguage
vi.mock('@/i18n', () => ({
  useLanguage: () => ({
    t: {
      pollResults: {
        pollRunning: 'Running',
        pollFinished: 'Finished',
        waitingToStart: 'Waiting',
        winner: 'Winner',
        winners: 'Winners',
        tie: 'Tie',
        noVotes: 'No votes',
      },
    },
  }),
}));

// Wrapper for hooks that need LanguageProvider
const wrapper = ({ children }: { children: ReactNode }) => children;

const createPollState = (overrides: Partial<PollState> = {}): PollState => ({
  isRunning: false,
  finished: false,
  question: 'Test question?',
  options: [
    { id: 1, text: 'Option 1' },
    { id: 2, text: 'Option 2' },
  ],
  votes: {},
  voters: new Set(),
  timer: 30,
  timeLeft: 30,
  countdown: undefined,
  ...overrides,
});

describe('usePollDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('totalVotes', () => {
    it('should return 0 when no votes', () => {
      const pollState = createPollState({ votes: {} });
      const { result } = renderHook(() => usePollDisplay({ pollState }), { wrapper });
      expect(result.current.totalVotes).toBe(0);
    });

    it('should calculate total votes correctly', () => {
      const pollState = createPollState({ votes: { 1: 5, 2: 3 } });
      const { result } = renderHook(() => usePollDisplay({ pollState }), { wrapper });
      expect(result.current.totalVotes).toBe(8);
    });
  });

  describe('getPercentage', () => {
    it('should return 0 when no votes', () => {
      const pollState = createPollState({ votes: {} });
      const { result } = renderHook(() => usePollDisplay({ pollState }), { wrapper });
      expect(result.current.getPercentage(1)).toBe(0);
    });

    it('should calculate percentage correctly', () => {
      const pollState = createPollState({ votes: { 1: 3, 2: 7 } });
      const { result } = renderHook(() => usePollDisplay({ pollState }), { wrapper });
      expect(result.current.getPercentage(1)).toBe(30);
      expect(result.current.getPercentage(2)).toBe(70);
    });
  });

  describe('winnerIds', () => {
    it('should return empty array when poll not finished', () => {
      const pollState = createPollState({ finished: false, votes: { 1: 5, 2: 3 } });
      const { result } = renderHook(() => usePollDisplay({ pollState }), { wrapper });
      expect(result.current.winnerIds).toEqual([]);
    });

    it('should return empty array when no votes', () => {
      const pollState = createPollState({ finished: true, votes: {} });
      const { result } = renderHook(() => usePollDisplay({ pollState }), { wrapper });
      expect(result.current.winnerIds).toEqual([]);
    });

    it('should return single winner', () => {
      const pollState = createPollState({ finished: true, votes: { 1: 5, 2: 3 } });
      const { result } = renderHook(() => usePollDisplay({ pollState }), { wrapper });
      expect(result.current.winnerIds).toEqual([1]);
    });

    it('should return multiple winners on tie', () => {
      const pollState = createPollState({ finished: true, votes: { 1: 5, 2: 5 } });
      const { result } = renderHook(() => usePollDisplay({ pollState }), { wrapper });
      expect(result.current.winnerIds).toEqual([1, 2]);
    });
  });

  describe('winnerText', () => {
    it('should return empty string when no winners', () => {
      const pollState = createPollState({ finished: true, votes: {} });
      const { result } = renderHook(() => usePollDisplay({ pollState }), { wrapper });
      expect(result.current.winnerText).toBe('');
    });

    it('should return winner text', () => {
      const pollState = createPollState({ finished: true, votes: { 1: 5, 2: 3 } });
      const { result } = renderHook(() => usePollDisplay({ pollState }), { wrapper });
      expect(result.current.winnerText).toBe('Option 1');
    });

    it('should join multiple winners with &', () => {
      const pollState = createPollState({ finished: true, votes: { 1: 5, 2: 5 } });
      const { result } = renderHook(() => usePollDisplay({ pollState }), { wrapper });
      expect(result.current.winnerText).toBe('Option 1 & Option 2');
    });
  });

  describe('isCountingDown', () => {
    it('should return false when no countdown', () => {
      const pollState = createPollState({ countdown: undefined });
      const { result } = renderHook(() => usePollDisplay({ pollState }), { wrapper });
      expect(result.current.isCountingDown).toBe(false);
    });

    it('should return true when counting down', () => {
      const pollState = createPollState({ countdown: 3 });
      const { result } = renderHook(() => usePollDisplay({ pollState }), { wrapper });
      expect(result.current.isCountingDown).toBe(true);
    });
  });

  describe('getTimerClasses', () => {
    it('should return safe class when time is high', () => {
      const pollState = createPollState({ isRunning: true, timer: 30, timeLeft: 25 });
      const { result } = renderHook(() => usePollDisplay({ pollState }), { wrapper });
      expect(result.current.getTimerClasses()).toBe('text-tiktok-cyan');
    });

    it('should return warning class when time is medium', () => {
      const pollState = createPollState({ isRunning: true, timer: 30, timeLeft: 10 });
      const { result } = renderHook(() => usePollDisplay({ pollState }), { wrapper });
      expect(result.current.getTimerClasses()).toBe('timer-warning');
    });

    it('should return danger class when time is low', () => {
      const pollState = createPollState({ isRunning: true, timer: 30, timeLeft: 3 });
      const { result } = renderHook(() => usePollDisplay({ pollState }), { wrapper });
      expect(result.current.getTimerClasses()).toBe('timer-critical');
    });
  });

  describe('showCelebration', () => {
    it('should not show celebration when poll not finished', () => {
      const pollState = createPollState({ finished: false, votes: { 1: 5 } });
      const { result } = renderHook(() => usePollDisplay({ pollState }), { wrapper });
      expect(result.current.showCelebration).toBe(false);
    });

    it('should show celebration when poll finishes with votes', () => {
      const pollState = createPollState({ finished: true, votes: { 1: 5, 2: 3 } });
      const { result } = renderHook(() => usePollDisplay({ pollState }), { wrapper });
      expect(result.current.showCelebration).toBe(true);
    });

    it('should hide celebration after handleCelebrationComplete', () => {
      const pollState = createPollState({ finished: true, votes: { 1: 5, 2: 3 } });
      const { result } = renderHook(() => usePollDisplay({ pollState }), { wrapper });

      act(() => {
        result.current.handleCelebrationComplete();
      });

      expect(result.current.showCelebration).toBe(false);
    });
  });
});
