import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RootLayout, { metadata } from '../layout';

describe('RootLayout', () => {
  it('renders children correctly', () => {
    render(
      <RootLayout>
        <div data-testid="child-content">Test Content</div>
      </RootLayout>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders html element with correct lang attribute', () => {
    const { container } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );

    const html = container.querySelector('html');
    expect(html).toBeInTheDocument();
    expect(html?.getAttribute('lang')).toBe('zh-TW');
  });

  it('renders body element', () => {
    const { container } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );

    const body = container.querySelector('body');
    expect(body).toBeInTheDocument();
  });

  it('wraps children in body element', () => {
    const { container } = render(
      <RootLayout>
        <div data-testid="test-child">Child Element</div>
      </RootLayout>
    );

    const body = container.querySelector('body');
    const child = screen.getByTestId('test-child');

    expect(body?.contains(child)).toBe(true);
  });

  it('maintains proper HTML structure', () => {
    const { container } = render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>
    );

    const html = container.querySelector('html');
    const body = html?.querySelector('body');

    expect(html).toBeInTheDocument();
    expect(body).toBeInTheDocument();
  });

  it('renders multiple children correctly', () => {
    render(
      <RootLayout>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <div data-testid="child-3">Child 3</div>
      </RootLayout>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
  });

  it('handles empty children gracefully', () => {
    const { container } = render(
      <RootLayout>
        {null}
      </RootLayout>
    );

    const body = container.querySelector('body');
    expect(body).toBeInTheDocument();
  });

  it('preserves children component structure', () => {
    const NestedComponent = () => (
      <div>
        <h1>Heading</h1>
        <p>Paragraph</p>
      </div>
    );

    render(
      <RootLayout>
        <NestedComponent />
      </RootLayout>
    );

    expect(screen.getByText('Heading')).toBeInTheDocument();
    expect(screen.getByText('Paragraph')).toBeInTheDocument();
  });
});

describe('RootLayout Metadata', () => {
  it('exports correct metadata title', () => {
    expect(metadata.title).toBe('Vibe DevOps Dashboard');
  });

  it('exports correct metadata description', () => {
    expect(metadata.description).toBe('Centralized DevOps monitoring for Vibe-Coding-Apps');
  });

  it('metadata is an object with expected properties', () => {
    expect(metadata).toBeTypeOf('object');
    expect(metadata).toHaveProperty('title');
    expect(metadata).toHaveProperty('description');
  });

  it('metadata values are strings', () => {
    expect(typeof metadata.title).toBe('string');
    expect(typeof metadata.description).toBe('string');
  });

  it('metadata title is not empty', () => {
    expect(metadata.title.length).toBeGreaterThan(0);
  });

  it('metadata description is not empty', () => {
    expect(metadata.description.length).toBeGreaterThan(0);
  });
});
