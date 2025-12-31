import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from '../Avatar';

describe('Avatar', () => {
  it('renders image when src is provided', () => {
    render(<Avatar src="https://example.com/avatar.jpg" alt="User avatar" />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    expect(img).toHaveAttribute('alt', 'User avatar');
  });

  it('renders initials when name is provided but no src', () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders single initial for single name', () => {
    render(<Avatar name="John" />);
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('renders question mark when no src or name', () => {
    render(<Avatar />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('uses name as alt when alt is not provided', () => {
    render(<Avatar src="https://example.com/avatar.jpg" name="John Doe" />);
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'John Doe');
  });

  it('applies correct size styles', () => {
    const { rerender, container } = render(<Avatar name="Test" size="xs" />);
    expect(container.querySelector('.h-6.w-6')).toBeInTheDocument();

    rerender(<Avatar name="Test" size="sm" />);
    expect(container.querySelector('.h-8.w-8')).toBeInTheDocument();

    rerender(<Avatar name="Test" size="md" />);
    expect(container.querySelector('.h-10.w-10')).toBeInTheDocument();

    rerender(<Avatar name="Test" size="lg" />);
    expect(container.querySelector('.h-12.w-12')).toBeInTheDocument();

    rerender(<Avatar name="Test" size="xl" />);
    expect(container.querySelector('.h-16.w-16')).toBeInTheDocument();
  });

  it('shows online status indicator', () => {
    const { container } = render(<Avatar name="Test" status="online" />);
    expect(container.querySelector('.bg-green-500')).toBeInTheDocument();
  });

  it('shows offline status indicator', () => {
    const { container } = render(<Avatar name="Test" status="offline" />);
    expect(container.querySelector('.bg-gray-400')).toBeInTheDocument();
  });

  it('shows away status indicator', () => {
    const { container } = render(<Avatar name="Test" status="away" />);
    expect(container.querySelector('.bg-yellow-500')).toBeInTheDocument();
  });

  it('shows busy status indicator', () => {
    const { container } = render(<Avatar name="Test" status="busy" />);
    expect(container.querySelector('.bg-red-500')).toBeInTheDocument();
  });

  it('does not show status indicator when status is not provided', () => {
    const { container } = render(<Avatar name="Test" />);
    expect(container.querySelector('.absolute')).not.toBeInTheDocument();
  });

  it('applies smaller status indicator for xs and sm sizes', () => {
    const { container, rerender } = render(<Avatar name="Test" status="online" size="xs" />);
    expect(container.querySelector('.h-2.w-2')).toBeInTheDocument();

    rerender(<Avatar name="Test" status="online" size="sm" />);
    expect(container.querySelector('.h-2.w-2')).toBeInTheDocument();
  });

  it('applies larger status indicator for md and larger sizes', () => {
    const { container } = render(<Avatar name="Test" status="online" size="md" />);
    expect(container.querySelector('.h-3.w-3')).toBeInTheDocument();
  });
});
