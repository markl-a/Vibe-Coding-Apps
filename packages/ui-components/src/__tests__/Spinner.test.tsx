import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from '../Spinner';

describe('Spinner', () => {
  it('renders with default loading label', () => {
    render(<Spinner />);
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(<Spinner label="Please wait..." />);
    expect(screen.getByLabelText('Please wait...')).toBeInTheDocument();
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('applies primary color by default', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('.text-blue-600')).toBeInTheDocument();
  });

  it('applies secondary color', () => {
    const { container } = render(<Spinner color="secondary" />);
    expect(container.querySelector('.text-gray-600')).toBeInTheDocument();
  });

  it('applies white color', () => {
    const { container } = render(<Spinner color="white" />);
    expect(container.querySelector('.text-white')).toBeInTheDocument();
  });

  it('applies correct size styles', () => {
    const { container, rerender } = render(<Spinner size="sm" />);
    expect(container.querySelector('.h-4.w-4')).toBeInTheDocument();

    rerender(<Spinner size="md" />);
    expect(container.querySelector('.h-8.w-8')).toBeInTheDocument();

    rerender(<Spinner size="lg" />);
    expect(container.querySelector('.h-12.w-12')).toBeInTheDocument();

    rerender(<Spinner size="xl" />);
    expect(container.querySelector('.h-16.w-16')).toBeInTheDocument();
  });

  it('has animation class', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('does not show label text when label is not provided', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('.text-sm.text-gray-600')).not.toBeInTheDocument();
  });
});
