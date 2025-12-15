import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders default fallback UI when an error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('出錯了')).toBeInTheDocument();
  });

  it('renders custom fallback UI when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('出錯了')).not.toBeInTheDocument();
  });

  it('calls onError callback when an error occurs', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );

    const error = onError.mock.calls[0][0];
    expect(error.message).toBe('Test error');
  });

  it('displays error message in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Test error/)).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('resets error state when reset button is clicked', () => {
    let shouldThrow = true;
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={shouldThrow} />
      </ErrorBoundary>
    );

    // Error boundary should show error UI
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Fix the error condition
    shouldThrow = false;

    // Click reset button
    const resetButton = screen.getByText('重試');
    fireEvent.click(resetButton);

    // Re-render with fixed component
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={shouldThrow} />
      </ErrorBoundary>
    );

    // Should show content again
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('calls onReset callback when reset button is clicked', () => {
    const onReset = vi.fn();
    let shouldThrow = true;

    const { rerender } = render(
      <ErrorBoundary onReset={onReset}>
        <ThrowError shouldThrow={shouldThrow} />
      </ErrorBoundary>
    );

    // Fix the error
    shouldThrow = false;

    // Click reset button
    const resetButton = screen.getByText('重試');
    fireEvent.click(resetButton);

    expect(onReset).toHaveBeenCalledTimes(1);

    // Re-render
    rerender(
      <ErrorBoundary onReset={onReset}>
        <ThrowError shouldThrow={shouldThrow} />
      </ErrorBoundary>
    );
  });

  it('shows refresh page button', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const refreshButton = screen.getByText('重新整理頁面');
    expect(refreshButton).toBeInTheDocument();
  });

  it('handles nested errors correctly', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <div>
          <div>
            <ThrowError />
          </div>
        </div>
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('displays component stack in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('組件堆疊：')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('applies correct styling classes', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const alertContainer = screen.getByRole('alert');
    expect(alertContainer.className).toContain('min-h-screen');
    expect(alertContainer.className).toContain('flex');
    expect(alertContainer.className).toContain('items-center');
  });

  it('handles multiple sequential errors', () => {
    const onError = vi.fn();
    let shouldThrow = true;

    const { rerender } = render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={shouldThrow} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledTimes(1);

    // Reset
    shouldThrow = false;
    fireEvent.click(screen.getByText('重試'));

    rerender(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={shouldThrow} />
      </ErrorBoundary>
    );

    // Throw another error
    shouldThrow = true;
    rerender(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={shouldThrow} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledTimes(2);
  });

  it('preserves error boundary instance across resets', () => {
    const onError = vi.fn();
    const onReset = vi.fn();
    let shouldThrow = true;

    const { rerender } = render(
      <ErrorBoundary onError={onError} onReset={onReset}>
        <ThrowError shouldThrow={shouldThrow} />
      </ErrorBoundary>
    );

    // First error
    expect(onError).toHaveBeenCalledTimes(1);

    // Reset
    shouldThrow = false;
    fireEvent.click(screen.getByText('重試'));
    expect(onReset).toHaveBeenCalledTimes(1);

    rerender(
      <ErrorBoundary onError={onError} onReset={onReset}>
        <ThrowError shouldThrow={shouldThrow} />
      </ErrorBoundary>
    );

    // Should be able to catch errors again
    expect(screen.getByText('No error')).toBeInTheDocument();
  });
});
