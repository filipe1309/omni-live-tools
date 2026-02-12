import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PollQuestion } from '@/components/poll/PollQuestion';

// Mock TIMER_THRESHOLDS
vi.mock('@/constants', () => ({
  TIMER_THRESHOLDS: {
    WARNING: 10,
    CRITICAL: 5,
  },
}));

describe('PollQuestion', () => {
  const defaultProps = {
    question: 'What is your favorite color?',
    isRunning: false,
    timeLeft: 30,
    timer: 30,
  };

  it('should render question text', () => {
    render(<PollQuestion {...defaultProps} />);
    expect(screen.getByText('What is your favorite color?')).toBeInTheDocument();
  });

  it('should apply purple styling when not running', () => {
    const { container } = render(<PollQuestion {...defaultProps} />);
    const questionContainer = container.firstChild as HTMLElement;
    expect(questionContainer.className).toContain('border-purple-500');
    expect(questionContainer.className).toContain('bg-purple-500/10');
  });

  it('should apply green styling when running with plenty of time', () => {
    const { container } = render(
      <PollQuestion {...defaultProps} isRunning={true} timeLeft={20} />
    );
    const questionContainer = container.firstChild as HTMLElement;
    expect(questionContainer.className).toContain('border-green-500');
    expect(questionContainer.className).toContain('bg-green-500/10');
  });

  it('should apply yellow warning styling when time is low', () => {
    const { container } = render(
      <PollQuestion {...defaultProps} isRunning={true} timeLeft={8} />
    );
    const questionContainer = container.firstChild as HTMLElement;
    expect(questionContainer.className).toContain('border-yellow-500');
    expect(questionContainer.className).toContain('bg-yellow-500/15');
  });

  it('should apply red critical styling when time is very low', () => {
    const { container } = render(
      <PollQuestion {...defaultProps} isRunning={true} timeLeft={3} />
    );
    const questionContainer = container.firstChild as HTMLElement;
    expect(questionContainer.className).toContain('border-red-500');
    expect(questionContainer.className).toContain('bg-red-500/20');
    expect(questionContainer.className).toContain('animate-pulse');
  });

  it('should render timer bar when running', () => {
    const { container } = render(
      <PollQuestion {...defaultProps} isRunning={true} timeLeft={15} timer={30} />
    );
    // The timer bar should be 50% width (15/30)
    const timerBar = container.querySelector('[style*="width: 50%"]');
    expect(timerBar).toBeInTheDocument();
  });

  it('should render static bar when not running', () => {
    const { container } = render(
      <PollQuestion {...defaultProps} isRunning={false} />
    );
    const staticBar = container.querySelector('.w-full');
    expect(staticBar).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <PollQuestion {...defaultProps} className="custom-class" />
    );
    const questionContainer = container.firstChild as HTMLElement;
    expect(questionContainer.className).toContain('custom-class');
  });

  it('should handle zero timer', () => {
    const { container } = render(
      <PollQuestion {...defaultProps} isRunning={true} timeLeft={0} timer={0} />
    );
    // When timer is 0, no timer bar should render
    expect(container.querySelector('[style*="width"]')).not.toBeInTheDocument();
  });
});
