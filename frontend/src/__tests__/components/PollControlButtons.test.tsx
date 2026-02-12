import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PollControlButtons } from '@/components/poll/PollControlButtons';

// Mock useLanguage
vi.mock('@/i18n', () => ({
  useLanguage: () => ({
    t: {
      poll: {
        startPoll: 'Iniciar',
        stopPoll: 'Parar',
        resetPoll: 'Reiniciar',
      },
      pollResults: {
        start: 'Start',
        stop: 'Stop',
        restart: 'Restart',
      },
    },
  }),
}));

// Mock POLL_SHORTCUT_LABELS
vi.mock('@/constants', async () => {
  const actual = await vi.importActual('@/constants');
  return {
    ...actual,
    POLL_SHORTCUT_LABELS: {
      START: 'S',
      STOP: 'X',
      RESET: 'R',
    },
  };
});

describe('PollControlButtons', () => {
  const defaultProps = {
    isRunning: false,
    isCountingDown: false,
    isConnected: true,
  };

  describe('Start Button', () => {
    it('should render start button when onStart is provided', () => {
      const onStart = vi.fn();
      render(<PollControlButtons {...defaultProps} onStart={onStart} />);
      expect(screen.getByText(/Iniciar/)).toBeInTheDocument();
    });

    it('should call onStart when clicked', () => {
      const onStart = vi.fn();
      render(<PollControlButtons {...defaultProps} onStart={onStart} />);
      fireEvent.click(screen.getByText(/Iniciar/));
      expect(onStart).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when not connected', () => {
      const onStart = vi.fn();
      render(<PollControlButtons {...defaultProps} onStart={onStart} isConnected={false} />);
      const button = screen.getByText(/Iniciar/).closest('button');
      expect(button).toBeDisabled();
    });

    it('should be disabled when running', () => {
      const onStart = vi.fn();
      render(<PollControlButtons {...defaultProps} onStart={onStart} isRunning={true} />);
      const button = screen.getByText(/Iniciar/).closest('button');
      expect(button).toBeDisabled();
    });

    it('should be disabled when counting down', () => {
      const onStart = vi.fn();
      render(<PollControlButtons {...defaultProps} onStart={onStart} isCountingDown={true} />);
      const button = screen.getByText(/Iniciar/).closest('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Stop Button', () => {
    it('should render stop button when onStop is provided', () => {
      const onStop = vi.fn();
      render(<PollControlButtons {...defaultProps} onStop={onStop} />);
      expect(screen.getByText(/Parar/)).toBeInTheDocument();
    });

    it('should call onStop when clicked', () => {
      const onStop = vi.fn();
      render(<PollControlButtons {...defaultProps} onStop={onStop} isRunning={true} />);
      fireEvent.click(screen.getByText(/Parar/));
      expect(onStop).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when not running', () => {
      const onStop = vi.fn();
      render(<PollControlButtons {...defaultProps} onStop={onStop} />);
      const button = screen.getByText(/Parar/).closest('button');
      expect(button).toBeDisabled();
    });

    it('should be enabled when running', () => {
      const onStop = vi.fn();
      render(<PollControlButtons {...defaultProps} onStop={onStop} isRunning={true} />);
      const button = screen.getByText(/Parar/).closest('button');
      expect(button).not.toBeDisabled();
    });
  });

  describe('Reset Button', () => {
    it('should render reset button when onReset is provided', () => {
      const onReset = vi.fn();
      render(<PollControlButtons {...defaultProps} onReset={onReset} />);
      expect(screen.getByText(/Reiniciar/)).toBeInTheDocument();
    });

    it('should call onReset when clicked', () => {
      const onReset = vi.fn();
      render(<PollControlButtons {...defaultProps} onReset={onReset} />);
      fireEvent.click(screen.getByText(/Reiniciar/));
      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when running', () => {
      const onReset = vi.fn();
      render(<PollControlButtons {...defaultProps} onReset={onReset} isRunning={true} />);
      const button = screen.getByText(/Reiniciar/).closest('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should show keyboard shortcut S on start button', () => {
      render(<PollControlButtons {...defaultProps} onStart={() => { }} />);
      expect(screen.getByText('S')).toBeInTheDocument();
    });

    it('should show keyboard shortcut X on stop button', () => {
      render(<PollControlButtons {...defaultProps} onStop={() => { }} />);
      expect(screen.getByText('X')).toBeInTheDocument();
    });

    it('should show keyboard shortcut R on reset button', () => {
      render(<PollControlButtons {...defaultProps} onReset={() => { }} />);
      expect(screen.getByText('R')).toBeInTheDocument();
    });
  });
});
