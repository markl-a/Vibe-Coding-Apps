import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../Badge';

describe('Badge', () => {
  it('renders children correctly', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('applies neutral variant styles by default', () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText('Default');
    expect(badge.className).toContain('bg-gray-100');
    expect(badge.className).toContain('text-gray-800');
  });

  it('applies primary variant styles', () => {
    render(<Badge variant="primary">Primary</Badge>);
    const badge = screen.getByText('Primary');
    expect(badge.className).toContain('bg-blue-100');
    expect(badge.className).toContain('text-blue-800');
  });

  it('applies success variant styles', () => {
    render(<Badge variant="success">Success</Badge>);
    const badge = screen.getByText('Success');
    expect(badge.className).toContain('bg-green-100');
    expect(badge.className).toContain('text-green-800');
  });

  it('applies warning variant styles', () => {
    render(<Badge variant="warning">Warning</Badge>);
    const badge = screen.getByText('Warning');
    expect(badge.className).toContain('bg-yellow-100');
    expect(badge.className).toContain('text-yellow-800');
  });

  it('applies danger variant styles', () => {
    render(<Badge variant="danger">Danger</Badge>);
    const badge = screen.getByText('Danger');
    expect(badge.className).toContain('bg-red-100');
    expect(badge.className).toContain('text-red-800');
  });

  it('applies info variant styles', () => {
    render(<Badge variant="info">Info</Badge>);
    const badge = screen.getByText('Info');
    expect(badge.className).toContain('bg-cyan-100');
    expect(badge.className).toContain('text-cyan-800');
  });

  it('applies size styles correctly', () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>);
    expect(screen.getByText('Small').className).toContain('text-xs');

    rerender(<Badge size="md">Medium</Badge>);
    expect(screen.getByText('Medium').className).toContain('text-sm');

    rerender(<Badge size="lg">Large</Badge>);
    expect(screen.getByText('Large').className).toContain('text-base');
  });

  it('applies rounded styles when rounded is true', () => {
    render(<Badge rounded>Rounded</Badge>);
    expect(screen.getByText('Rounded').className).toContain('rounded-full');
  });

  it('applies regular rounded styles when rounded is false', () => {
    render(<Badge rounded={false}>Not Rounded</Badge>);
    const badge = screen.getByText('Not Rounded');
    expect(badge.className).toContain('rounded');
    expect(badge.className).not.toContain('rounded-full');
  });
});
