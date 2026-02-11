import { useRef, useEffect, useCallback } from 'react';
import type { PollOption, PollState } from '@/types';
import { POLL_TIMER } from '@/constants';

export interface TimerCallbacks {
  /** Called when countdown changes (3, 2, 1, 0=GO!) */
  onCountdownChange: (countdown: number) => void;
  /** Called when poll actually starts after countdown */
  onPollStart: (state: PollState) => void;
  /** Called every second during the poll */
  onTimeLeftChange: (timeLeft: number) => void;
  /** Called when poll timer reaches 0 */
  onPollFinish: () => void;
}

interface UsePollTimerReturn {
  /** Start the countdown and poll timer */
  startTimer: (
    question: string,
    options: PollOption[],
    timer?: number
  ) => PollState;
  /** Stop and clear all timers */
  stopTimer: () => void;
  /** Check if countdown is active */
  isCountdownActive: () => boolean;
  /** Check if poll timer is active */
  isTimerActive: () => boolean;
}

export function usePollTimer (callbacks: TimerCallbacks): UsePollTimerReturn {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const callbacksRef = useRef(callbacks);

  // Keep callbacks ref updated
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const isCountdownActive = useCallback(() => countdownRef.current !== null, []);
  const isTimerActive = useCallback(() => timerRef.current !== null, []);

  const startTimer = useCallback(
    (question: string, options: PollOption[], timer = POLL_TIMER.DEFAULT): PollState => {
      // Clear any existing timers
      stopTimer();

      // Initialize votes map
      const initialVotes: Record<number, number> = {};
      options.forEach(opt => {
        initialVotes[opt.id] = 0;
      });

      // Create initial countdown state
      const countdownState: PollState = {
        isRunning: false,
        finished: false,
        question,
        options,
        votes: initialVotes,
        voters: new Set<string>(),
        timer,
        timeLeft: timer,
        countdown: 3,
      };

      // Notify initial countdown
      callbacksRef.current.onCountdownChange(3);

      // Start countdown interval
      let countdownValue = 3;
      countdownRef.current = setInterval(() => {
        countdownValue--;

        if (countdownValue <= 0) {
          // Clear countdown interval
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }

          // Show "GO!" (countdown = 0)
          callbacksRef.current.onCountdownChange(0);

          // After 500ms, start the actual poll
          setTimeout(() => {
            const pollStartState: PollState = {
              isRunning: true,
              finished: false,
              question,
              options,
              votes: initialVotes,
              voters: new Set<string>(),
              timer,
              timeLeft: timer,
              countdown: undefined,
            };

            callbacksRef.current.onPollStart(pollStartState);

            // Track current timeLeft to avoid stale closure
            let currentTimeLeft = timer;

            // Start poll timer countdown
            timerRef.current = setInterval(() => {
              currentTimeLeft--;

              if (currentTimeLeft <= 0) {
                if (timerRef.current) {
                  clearInterval(timerRef.current);
                  timerRef.current = null;
                }
                callbacksRef.current.onTimeLeftChange(0);
                callbacksRef.current.onPollFinish();
              } else {
                callbacksRef.current.onTimeLeftChange(currentTimeLeft);
              }
            }, 1000);
          }, 500); // 500ms delay after showing "GO!"
        } else {
          // Update countdown display (3, 2, 1)
          callbacksRef.current.onCountdownChange(countdownValue);
        }
      }, 1000);

      return countdownState;
    },
    [stopTimer]
  );

  return {
    startTimer,
    stopTimer,
    isCountdownActive,
    isTimerActive,
  };
}
