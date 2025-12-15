import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from '../Card';

describe('Card', () => {
  it('renders children correctly', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('applies elevated variant styles by default', () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card.className).toContain('shadow-lg');
    expect(card.className).toContain('bg-white');
  });

  it('applies outlined variant styles', () => {
    render(<Card variant="outlined" data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card.className).toContain('border-2');
    expect(card.className).toContain('border-gray-200');
  });

  it('applies filled variant styles', () => {
    render(<Card variant="filled" data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card.className).toContain('bg-gray-50');
  });

  it('applies default medium padding', () => {
    render(<Card data-testid="card">Content</Card>);
    expect(screen.getByTestId('card').className).toContain('p-6');
  });

  it('applies small padding', () => {
    render(<Card padding="sm" data-testid="card">Content</Card>);
    expect(screen.getByTestId('card').className).toContain('p-4');
  });

  it('applies large padding', () => {
    render(<Card padding="lg" data-testid="card">Content</Card>);
    expect(screen.getByTestId('card').className).toContain('p-8');
  });

  it('applies no padding', () => {
    render(<Card padding="none" data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card.className).not.toContain('p-4');
    expect(card.className).not.toContain('p-6');
    expect(card.className).not.toContain('p-8');
  });

  it('applies hoverable styles when hoverable is true', () => {
    render(<Card hoverable data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card.className).toContain('hover:shadow-xl');
    expect(card.className).toContain('cursor-pointer');
  });

  it('does not apply hoverable styles by default', () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card.className).not.toContain('hover:shadow-xl');
    expect(card.className).not.toContain('cursor-pointer');
  });

  it('applies custom className', () => {
    render(<Card className="custom-card" data-testid="card">Content</Card>);
    expect(screen.getByTestId('card').className).toContain('custom-card');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Card onClick={handleClick} data-testid="card">Clickable</Card>);
    fireEvent.click(screen.getByTestId('card'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('passes through other HTML attributes', () => {
    render(<Card data-testid="card" id="my-card" role="article">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('id', 'my-card');
    expect(card).toHaveAttribute('role', 'article');
  });
});
