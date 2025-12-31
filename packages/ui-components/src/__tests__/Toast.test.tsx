import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Toast } from '../Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders message correctly', () => {
    render(<Toast id="1" message="Test message" onClose={vi.fn()} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('applies info type styles by default', () => {
    render(<Toast id="1" message="Info toast" onClose={vi.fn()} />);
    expect(document.querySelector('.bg-blue-500')).toBeInTheDocument();
  });

  it('applies success type styles', () => {
    render(<Toast id="1" message="Success" type="success" onClose={vi.fn()} />);
    expect(document.querySelector('.bg-green-500')).toBeInTheDocument();
  });

  it('applies error type styles', () => {
    render(<Toast id="1" message="Error" type="error" onClose={vi.fn()} />);
    expect(document.querySelector('.bg-red-500')).toBeInTheDocument();
  });

  it('applies warning type styles', () => {
    render(<Toast id="1" message="Warning" type="warning" onClose={vi.fn()} />);
    expect(document.querySelector('.bg-yellow-500')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(<Toast id="test-id" message="Message" onClose={onClose} />);

    const closeButton = document.querySelector('button');
    expect(closeButton).toBeInTheDocument();

    if (closeButton) {
      fireEvent.click(closeButton);
      // Wait for the fade out animation
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(onClose).toHaveBeenCalledWith('test-id');
    }
  });

  it('auto closes after duration', () => {
    const onClose = vi.fn();
    render(<Toast id="1" message="Auto close" duration={3000} onClose={onClose} />);

    // Wait for fade in
    act(() => {
      vi.advanceTimersByTime(10);
    });

    // Wait for auto close
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Wait for fade out animation
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onClose).toHaveBeenCalledWith('1');
  });

  it('renders correct icon for each type', () => {
    const { rerender } = render(
      <Toast id="1" message="Test" type="success" onClose={vi.fn()} />
    );
    expect(document.querySelectorAll('svg').length).toBeGreaterThan(0);

    rerender(<Toast id="1" message="Test" type="error" onClose={vi.fn()} />);
    expect(document.querySelectorAll('svg').length).toBeGreaterThan(0);
  });
});
