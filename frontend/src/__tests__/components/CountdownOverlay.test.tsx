import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CountdownOverlay } from '@/components/poll/CountdownOverlay';

// Mock useLanguage
vi.mock('@/i18n', () => ({
  useLanguage: () => ({
    t: {
      poll: {
        go: 'VAI!',
        startingIn: 'Começando em',
      },
    },
  }),
}));

describe('CountdownOverlay', () => {
  it('should show countdown number when countdown > 0', () => {
    render(<CountdownOverlay countdown={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Começando em')).toBeInTheDocument();
    expect(screen.queryByText('VAI!')).not.toBeInTheDocument();
  });

  it('should show "GO" text when countdown is 0', () => {
    render(<CountdownOverlay countdown={0} />);
    expect(screen.getByText('VAI!')).toBeInTheDocument();
    expect(screen.queryByText('Começando em')).not.toBeInTheDocument();
  });

  it('should display countdown 2', () => {
    render(<CountdownOverlay countdown={2} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should display countdown 1', () => {
    render(<CountdownOverlay countdown={1} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should have overlay styling', () => {
    const { container } = render(<CountdownOverlay countdown={3} />);
    const overlay = container.firstChild as HTMLElement;
    expect(overlay.className).toContain('absolute');
    expect(overlay.className).toContain('inset-0');
    expect(overlay.className).toContain('z-50');
  });
});
