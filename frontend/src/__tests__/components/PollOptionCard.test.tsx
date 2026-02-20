import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PollOptionCard } from '@/components/poll/PollOptionCard';

// Mock useLanguage
vi.mock('@/i18n', () => ({
  useLanguage: () => ({
    t: {
      poll: {
        votes: 'votos',
      },
    },
  }),
}));

describe('PollOptionCard', () => {
  const defaultProps = {
    option: { id: 1, text: 'Option 1' },
    votes: 10,
    percentage: 50,
    totalVotes: 20,
    isWinner: false,
  };

  it('should render option text', () => {
    render(<PollOptionCard {...defaultProps} />);
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('should render option id badge', () => {
    render(<PollOptionCard {...defaultProps} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should render vote count', () => {
    render(<PollOptionCard {...defaultProps} />);
    expect(screen.getByText(/10/)).toBeInTheDocument();
    expect(screen.getByText(/votos/)).toBeInTheDocument();
  });

  it('should render percentage', () => {
    render(<PollOptionCard {...defaultProps} />);
    expect(screen.getByText(/50\.0%/)).toBeInTheDocument();
  });

  it('should show winner crown when isWinner is true', () => {
    render(<PollOptionCard {...defaultProps} isWinner={true} />);
    // Crown is within the option text span
    const optionText = screen.getByText(/Option 1/);
    expect(optionText.textContent).toContain('👑');
  });

  it('should not show winner crown when isWinner is false', () => {
    render(<PollOptionCard {...defaultProps} isWinner={false} />);
    const optionText = screen.getByText(/Option 1/);
    expect(optionText.textContent).not.toContain('👑');
  });

  it('should handle zero votes', () => {
    render(<PollOptionCard {...defaultProps} votes={0} percentage={0} totalVotes={0} />);
    expect(screen.getByText(/0 votos/)).toBeInTheDocument();
    expect(screen.getByText(/\(0\.0%\)/)).toBeInTheDocument();
  });

  it('should render with compact size', () => {
    const { container } = render(<PollOptionCard {...defaultProps} size="compact" />);
    expect(container.firstChild).toBeInTheDocument();
    // Compact size should have p-2 padding
    expect(container.querySelector('.p-2')).toBeInTheDocument();
  });

  it('should render with normal size by default', () => {
    const { container } = render(<PollOptionCard {...defaultProps} />);
    // Normal size should have p-3 padding
    expect(container.querySelector('.p-3')).toBeInTheDocument();
  });

  it('should render with large size', () => {
    const { container } = render(<PollOptionCard {...defaultProps} size="large" />);
    // Large size should have p-3 padding
    expect(container.querySelector('.p-3')).toBeInTheDocument();
  });

  it('should apply winner styling when isWinner is true', () => {
    const { container } = render(<PollOptionCard {...defaultProps} isWinner={true} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('border-yellow-400');
  });

  it('should apply default styling when isWinner is false', () => {
    const { container } = render(<PollOptionCard {...defaultProps} isWinner={false} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('border-slate-700/50');
  });

  it('should format percentage with one decimal place', () => {
    render(<PollOptionCard {...defaultProps} percentage={33.333333} />);
    expect(screen.getByText(/\(33\.3%\)/)).toBeInTheDocument();
  });
});
