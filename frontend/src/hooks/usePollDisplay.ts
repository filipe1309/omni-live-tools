import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { PollState, PollOption } from '@/types';
import { TIMER_THRESHOLDS } from '@/constants';
import { useLanguage } from '@/i18n';
import { useNotificationSound } from './useNotificationSound';

interface UsePollDisplayOptions {
  pollState: PollState;
  displayOptions?: PollOption[];
}

interface StatusDisplay {
  text: string;
  className: string;
}

export function usePollDisplay ({ pollState, displayOptions }: UsePollDisplayOptions) {
  const { t } = useLanguage();
  const [showCelebration, setShowCelebration] = useState(false);
  const hasTriggeredCelebration = useRef(false);
  const { playNotificationSound } = useNotificationSound();

  // Calculate total votes
  const totalVotes = useMemo(() => {
    return Object.values(pollState.votes).reduce((sum, count) => sum + count, 0);
  }, [pollState.votes]);

  // Get percentage for an option
  const getPercentage = useCallback(
    (optionId: number) => {
      if (totalVotes === 0) return 0;
      return ((pollState.votes[optionId] || 0) / totalVotes) * 100;
    },
    [pollState.votes, totalVotes]
  );

  // Calculate winner(s)
  const maxVotes = useMemo(() => Math.max(...Object.values(pollState.votes), 0), [pollState.votes]);

  const options = displayOptions || pollState.options;

  const winnerIds = useMemo(() => {
    if (!pollState.finished || totalVotes === 0) return [];
    return options
      .filter((opt) => pollState.votes[opt.id] === maxVotes && maxVotes > 0)
      .map((opt) => opt.id);
  }, [pollState.finished, pollState.votes, options, totalVotes, maxVotes]);

  // Get winner text for celebration display
  const winnerText = useMemo(() => {
    if (winnerIds.length === 0) return '';
    const winners = options.filter((opt) => winnerIds.includes(opt.id));
    return winners.map((w) => w.text).join(' & ');
  }, [winnerIds, options]);

  // Trigger celebration when poll finishes with votes
  useEffect(() => {
    if (pollState.finished && totalVotes > 0 && winnerIds.length > 0 && !hasTriggeredCelebration.current) {
      hasTriggeredCelebration.current = true;
      setShowCelebration(true);
      playNotificationSound();
    }
  }, [pollState.finished, totalVotes, winnerIds.length, playNotificationSound]);

  // Reset celebration flag when countdown starts (new poll) or poll starts running
  useEffect(() => {
    if (pollState.isRunning || pollState.countdown !== undefined) {
      hasTriggeredCelebration.current = false;
      setShowCelebration(false);
    }
  }, [pollState.isRunning, pollState.countdown]);

  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
  }, []);

  // Get timer CSS classes based on remaining time
  const getTimerClasses = useCallback(() => {
    if (!pollState.isRunning) return 'text-slate-400';
    if (pollState.timeLeft <= TIMER_THRESHOLDS.CRITICAL) return 'timer-critical';
    if (pollState.timeLeft <= TIMER_THRESHOLDS.WARNING) return 'timer-warning';
    return 'text-tiktok-cyan';
  }, [pollState.isRunning, pollState.timeLeft]);

  // Get status display
  const getStatusDisplay = useCallback((): StatusDisplay => {
    if (pollState.countdown !== undefined) {
      return {
        text: pollState.countdown === 0 ? t.poll.go : `${pollState.countdown}...`,
        className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500 animate-pulse',
      };
    }
    if (pollState.isRunning) {
      return {
        text: t.poll.status.inProgress,
        className: 'bg-green-500/20 text-green-400 border-green-500 animate-pulse',
      };
    }
    if (pollState.finished) {
      return {
        text: t.poll.status.finished,
        className: 'bg-blue-500/20 text-blue-400 border-blue-500',
      };
    }
    return {
      text: t.poll.status.waiting,
      className: 'bg-slate-500/20 text-slate-400 border-slate-500',
    };
  }, [pollState.countdown, pollState.isRunning, pollState.finished, t]);

  // Check if countdown is active
  const isCountingDown = pollState.countdown !== undefined;

  return {
    totalVotes,
    getPercentage,
    maxVotes,
    winnerIds,
    winnerText,
    showCelebration,
    handleCelebrationComplete,
    getTimerClasses,
    getStatusDisplay,
    isCountingDown,
  };
}
