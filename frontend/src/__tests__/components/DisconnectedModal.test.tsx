import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DisconnectedModal } from '@/components/poll/DisconnectedModal';

// Mock useLanguage
vi.mock('@/i18n', () => ({
  useLanguage: () => ({
    t: {
      pollResults: {
        disconnected: 'Desconectado',
        connectionLost: 'A conexão foi perdida',
        reconnectButton: 'Reconectar',
        reconnecting: 'Reconectando...',
        attemptingReconnect: 'Tentando reconectar',
        autoReconnectTitle: 'Reconexão Automática',
        autoReconnectActive: 'Reconexão automática ativa',
        autoReconnectEnabledMainPage: 'Reconexão automática habilitada',
        autoReconnectTip: 'Dica: Habilite reconexão automática',
      },
    },
  }),
}));

describe('DisconnectedModal', () => {
  const defaultProps = {
    isReconnecting: false,
    isAutoReconnectEnabled: false,
    onReconnect: vi.fn(),
  };

  describe('Disconnected State', () => {
    it('should show disconnected message when not reconnecting', () => {
      render(<DisconnectedModal {...defaultProps} />);
      expect(screen.getByText('Desconectado')).toBeInTheDocument();
      expect(screen.getByText('A conexão foi perdida')).toBeInTheDocument();
    });

    it('should show reconnect button when not reconnecting', () => {
      render(<DisconnectedModal {...defaultProps} />);
      expect(screen.getByText('Reconectar')).toBeInTheDocument();
    });

    it('should call onReconnect when button is clicked', () => {
      const onReconnect = vi.fn();
      render(<DisconnectedModal {...defaultProps} onReconnect={onReconnect} />);
      fireEvent.click(screen.getByText('Reconectar'));
      expect(onReconnect).toHaveBeenCalledTimes(1);
    });

    it('should show auto-reconnect tip', () => {
      render(<DisconnectedModal {...defaultProps} />);
      expect(screen.getByText('Dica: Habilite reconexão automática')).toBeInTheDocument();
    });

    it('should show warning icon', () => {
      render(<DisconnectedModal {...defaultProps} />);
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });
  });

  describe('Reconnecting State', () => {
    it('should show reconnecting message when isReconnecting is true', () => {
      render(<DisconnectedModal {...defaultProps} isReconnecting={true} />);
      expect(screen.getByText('Reconectando...')).toBeInTheDocument();
      expect(screen.getByText('Tentando reconectar')).toBeInTheDocument();
    });

    it('should show spinning icon when reconnecting', () => {
      render(<DisconnectedModal {...defaultProps} isReconnecting={true} />);
      expect(screen.getByText('🔄')).toBeInTheDocument();
    });

    it('should not show reconnect button when reconnecting', () => {
      render(<DisconnectedModal {...defaultProps} isReconnecting={true} />);
      expect(screen.queryByText('Reconectar')).not.toBeInTheDocument();
    });
  });

  describe('Auto-Reconnect State', () => {
    it('should show auto-reconnect title when enabled', () => {
      render(<DisconnectedModal {...defaultProps} isAutoReconnectEnabled={true} />);
      expect(screen.getByText('Reconexão Automática')).toBeInTheDocument();
      expect(screen.getByText('Reconexão automática ativa')).toBeInTheDocument();
    });

    it('should show auto-reconnect enabled message', () => {
      render(<DisconnectedModal {...defaultProps} isAutoReconnectEnabled={true} />);
      expect(screen.getByText('Reconexão automática habilitada')).toBeInTheDocument();
    });

    it('should not show reconnect button when auto-reconnect enabled', () => {
      render(<DisconnectedModal {...defaultProps} isAutoReconnectEnabled={true} />);
      expect(screen.queryByText('Reconectar')).not.toBeInTheDocument();
    });
  });

  describe('Modal Styling', () => {
    it('should have overlay backdrop', () => {
      const { container } = render(<DisconnectedModal {...defaultProps} />);
      const backdrop = container.querySelector('.backdrop-blur-md');
      expect(backdrop).toBeInTheDocument();
    });

    it('should apply red styling when disconnected', () => {
      const { container } = render(<DisconnectedModal {...defaultProps} />);
      const modal = container.querySelector('.border-red-500\\/50');
      expect(modal).toBeInTheDocument();
    });

    it('should apply yellow styling when reconnecting', () => {
      const { container } = render(<DisconnectedModal {...defaultProps} isReconnecting={true} />);
      const modal = container.querySelector('.border-yellow-500\\/50');
      expect(modal).toBeInTheDocument();
    });
  });
});
