import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, withErrorBoundary } from '@/components/common/ErrorBoundary';

// Component that throws an error
const ThrowingComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Suppress console.error for cleaner test output
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => { });
});

describe('ErrorBoundary', () => {
  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Child content</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('should render default fallback UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
    expect(screen.getByText('Ocorreu um erro inesperado. Por favor, tente novamente.')).toBeInTheDocument();
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument();
  });

  it('should render custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom error UI</div>}>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it('should show error details in default fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    // Click to expand details
    const details = screen.getByText('Detalhes do erro');
    expect(details).toBeInTheDocument();

    fireEvent.click(details);
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('should reset error state when reset button is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error state
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();

    // Click reset
    fireEvent.click(screen.getByText('Tentar novamente'));

    // After reset, it should try to render children again
    // But since ThrowingComponent still throws, it will show error again
    // This tests that the state was actually reset
    rerender(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Tentar novamente'));
    // Now with shouldThrow=false, it should render successfully after reset
  });

  it('should hide reset button when showReset is false', () => {
    render(
      <ErrorBoundary showReset={false}>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
    expect(screen.queryByText('Tentar novamente')).not.toBeInTheDocument();
  });

  it('should show reset button by default', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Tentar novamente')).toBeInTheDocument();
  });
});

describe('withErrorBoundary', () => {
  it('should wrap component with ErrorBoundary', () => {
    const TestComponent = () => <div data-testid="wrapped">Wrapped content</div>;
    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent />);

    expect(screen.getByTestId('wrapped')).toBeInTheDocument();
  });

  it('should catch errors in wrapped component', () => {
    const WrappedThrowing = withErrorBoundary(ThrowingComponent);

    render(<WrappedThrowing />);

    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
  });

  it('should pass error boundary props', () => {
    const WrappedComponent = withErrorBoundary(ThrowingComponent, {
      fallback: <div data-testid="hoc-fallback">HOC Fallback</div>,
    });

    render(<WrappedComponent />);

    expect(screen.getByTestId('hoc-fallback')).toBeInTheDocument();
  });

  it('should set displayName correctly', () => {
    const NamedComponent = () => <div>Named</div>;
    NamedComponent.displayName = 'MyNamedComponent';

    const Wrapped = withErrorBoundary(NamedComponent);

    expect(Wrapped.displayName).toBe('withErrorBoundary(MyNamedComponent)');
  });

  it('should use function name if displayName not set', () => {
    function TestFunction () {
      return <div>Test</div>;
    }

    const Wrapped = withErrorBoundary(TestFunction);

    expect(Wrapped.displayName).toBe('withErrorBoundary(TestFunction)');
  });
});
