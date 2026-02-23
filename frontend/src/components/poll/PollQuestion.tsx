import { useState, useRef, useEffect } from 'react';
import { TIMER_THRESHOLDS } from '@/constants';
import { useLanguage } from '@/i18n';

interface PollQuestionProps {
  question: string;
  isRunning: boolean;
  timeLeft: number;
  timer: number;
  className?: string;
  editable?: boolean;
  onQuestionChange?: (newQuestion: string) => void;
}

export function PollQuestion ({ question, isRunning, timeLeft, timer, className = '', editable = false, onQuestionChange }: PollQuestionProps) {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(question);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync editValue with question prop when not editing
  useEffect(() => {
    if (!isEditing) {
      setEditValue(question);
    }
  }, [question, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    if (editable && !isRunning) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    if (editValue.trim() && editValue !== question) {
      onQuestionChange?.(editValue.trim());
    } else {
      setEditValue(question);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditValue(question);
      setIsEditing(false);
    }
  };
  const getContainerClasses = () => {
    if (isRunning) {
      if (timeLeft <= TIMER_THRESHOLDS.CRITICAL) {
        return 'bg-red-500/20 border-red-500 animate-pulse shadow-lg shadow-red-500/20';
      }
      if (timeLeft <= TIMER_THRESHOLDS.WARNING) {
        return 'bg-yellow-500/15 border-yellow-500 shadow-lg shadow-yellow-500/10';
      }
      return 'bg-green-500/10 border-green-500';
    }
    return 'bg-purple-500/10 border-purple-500';
  };

  const getTimerBarClasses = () => {
    if (timeLeft <= TIMER_THRESHOLDS.CRITICAL) {
      return 'bg-gradient-to-r from-red-600 to-red-400 animate-pulse';
    }
    if (timeLeft <= TIMER_THRESHOLDS.WARNING) {
      return 'bg-gradient-to-r from-yellow-500 to-yellow-400';
    }
    return 'bg-gradient-to-r from-green-500 to-tiktok-cyan';
  };

  const getTextClasses = () => {
    if (isRunning) {
      if (timeLeft <= TIMER_THRESHOLDS.CRITICAL) return 'text-red-300 neon-glow-red';
      if (timeLeft <= TIMER_THRESHOLDS.WARNING) return 'text-yellow-300 neon-glow-yellow';
      return 'text-white neon-glow-green';
    }
    return 'text-white';
  };

  const getShakeClass = () => {
    if (isRunning && timeLeft <= TIMER_THRESHOLDS.CRITICAL) {
      return 'animate-shake';
    }
    return '';
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border-l-4 transition-all duration-500 ${getContainerClasses()} ${className}`}
    >
      {/* Animated Timer Bar - Full Background */}
      {isRunning && timer > 0 && (
        <div
          className={`absolute inset-0 h-full opacity-30 transition-all duration-1000 ease-linear ${getTimerBarClasses()}`}
          style={{
            width: `${(timeLeft / timer) * 100}%`,
          }}
        />
      )}
      {/* Static bar when not running */}
      {!isRunning && (
        <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-purple-600/30 to-purple-400/30" />
      )}
      <div className={`relative z-10 text-center py-5 px-6 ${getShakeClass()}`}>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-b-2 border-tiktok-cyan text-white text-center font-bold outline-none"
            style={{ fontSize: 'inherit' }}
          />
        ) : (
          <h3
            className={`font-bold transition-colors duration-500 ${getTextClasses()} ${editable && !isRunning ? 'cursor-pointer hover:text-tiktok-cyan' : ''}`}
            onDoubleClick={handleDoubleClick}
            title={editable && !isRunning ? t.pollResults.doubleClickToEdit : undefined}
          >
            {question}
          </h3>
        )}
      </div>
    </div>
  );
}
