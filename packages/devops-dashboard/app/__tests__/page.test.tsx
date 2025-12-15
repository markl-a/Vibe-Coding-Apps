import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '../page';

describe('HomePage', () => {
  it('renders the main heading', () => {
    render(<HomePage />);
    expect(screen.getByText('Vibe DevOps Dashboard')).toBeInTheDocument();
  });

  it('renders all metric cards', () => {
    render(<HomePage />);

    // Check all metric card titles
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Build Success Rate')).toBeInTheDocument();
    expect(screen.getByText('Test Coverage')).toBeInTheDocument();
    expect(screen.getByText('Security Alerts')).toBeInTheDocument();
  });

  it('displays correct metric values', () => {
    render(<HomePage />);

    // Check all metric values
    expect(screen.getByText('148')).toBeInTheDocument();
    expect(screen.getByText('95.2%')).toBeInTheDocument();
    expect(screen.getByText('78.5%')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('displays correct change values', () => {
    render(<HomePage />);

    // Check all change indicators
    expect(screen.getByText('+12')).toBeInTheDocument();
    expect(screen.getByText('+2.1%')).toBeInTheDocument();
    expect(screen.getByText('+5.3%')).toBeInTheDocument();
    expect(screen.getByText('-2')).toBeInTheDocument();
  });

  it('applies correct trend colors to changes', () => {
    const { container } = render(<HomePage />);

    // Get all spans with change text
    const changes = container.querySelectorAll('span.text-sm');

    // Check that positive changes have green text
    const positiveChanges = Array.from(changes).filter(
      el => el.textContent?.startsWith('+')
    );
    positiveChanges.forEach(change => {
      expect(change.className).toContain('text-green-600');
    });

    // Check that negative changes have red text
    const negativeChanges = Array.from(changes).filter(
      el => el.textContent?.startsWith('-')
    );
    negativeChanges.forEach(change => {
      expect(change.className).toContain('text-red-600');
    });
  });

  it('renders Recent Builds section', () => {
    render(<HomePage />);
    expect(screen.getByText('Recent Builds')).toBeInTheDocument();
    expect(screen.getByText('Build status overview...')).toBeInTheDocument();
  });

  it('renders Test Coverage Trends section', () => {
    render(<HomePage />);
    expect(screen.getByText('Test Coverage Trends')).toBeInTheDocument();
    expect(screen.getByText('Coverage chart...')).toBeInTheDocument();
  });

  it('has proper layout structure', () => {
    const { container } = render(<HomePage />);

    // Check for header with white background and shadow
    const header = container.querySelector('header.bg-white.shadow');
    expect(header).toBeInTheDocument();

    // Check for main content area
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
  });

  it('renders metric cards in a grid layout', () => {
    const { container } = render(<HomePage />);

    // Check for grid container
    const grid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4');
    expect(grid).toBeInTheDocument();
  });

  it('renders sections in a responsive grid', () => {
    const { container } = render(<HomePage />);

    // Check for two-column grid for sections
    const sectionGrid = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2');
    expect(sectionGrid).toBeInTheDocument();
  });

  it('applies correct styling to metric cards', () => {
    const { container } = render(<HomePage />);

    // Get all metric card containers
    const cards = container.querySelectorAll('.bg-white.rounded-lg.shadow.p-6');

    // Should have 4 metric cards + 2 section cards
    expect(cards.length).toBeGreaterThanOrEqual(6);
  });

  it('renders with min-h-screen for full page height', () => {
    const { container } = render(<HomePage />);

    const pageWrapper = container.querySelector('.min-h-screen');
    expect(pageWrapper).toBeInTheDocument();
  });
});

describe('MetricCard Component', () => {
  it('renders with upward trend styling', () => {
    const { container } = render(<HomePage />);

    // Find Projects card (first one with +12 change)
    const projectsValue = screen.getByText('148');
    const card = projectsValue.closest('.bg-white.rounded-lg.shadow.p-6');

    expect(card).toBeInTheDocument();
    expect(card?.querySelector('.text-green-600')).toBeInTheDocument();
  });

  it('renders with downward trend styling', () => {
    const { container } = render(<HomePage />);

    // Find Security Alerts card (with -2 change)
    const alertsValue = screen.getByText('3');
    const card = alertsValue.closest('.bg-white.rounded-lg.shadow.p-6');

    expect(card).toBeInTheDocument();
    expect(card?.querySelector('.text-red-600')).toBeInTheDocument();
  });

  it('displays title in correct styling', () => {
    render(<HomePage />);

    const title = screen.getByText('Projects');
    expect(title).toBeInTheDocument();
    expect(title.className).toContain('text-sm');
    expect(title.className).toContain('font-medium');
    expect(title.className).toContain('text-gray-600');
  });

  it('displays value in correct styling', () => {
    render(<HomePage />);

    const value = screen.getByText('148');
    expect(value).toBeInTheDocument();
    expect(value.className).toContain('text-3xl');
    expect(value.className).toContain('font-semibold');
    expect(value.className).toContain('text-gray-900');
  });

  it('displays change indicator with correct styling', () => {
    render(<HomePage />);

    const change = screen.getByText('+12');
    expect(change).toBeInTheDocument();
    expect(change.className).toContain('text-sm');
    expect(change.className).toContain('font-medium');
  });

  it('aligns value and change on baseline', () => {
    const { container } = render(<HomePage />);

    // Find the container with items-baseline
    const valueContainer = container.querySelector('.items-baseline');
    expect(valueContainer).toBeInTheDocument();
  });
});
