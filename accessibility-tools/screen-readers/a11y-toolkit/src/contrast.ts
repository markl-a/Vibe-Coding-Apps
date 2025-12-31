import type { ContrastResult } from './types.js';

/**
 * Color Contrast Utilities
 *
 * Check WCAG 2.1 color contrast requirements:
 * - AA: 4.5:1 for normal text, 3:1 for large text
 * - AAA: 7:1 for normal text, 4.5:1 for large text
 */

// Parse color string to RGB
function parseColor(color: string): { r: number; g: number; b: number } | null {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
    }
  }

  // Handle rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3]),
    };
  }

  // Named colors (basic set)
  const namedColors: Record<string, { r: number; g: number; b: number }> = {
    white: { r: 255, g: 255, b: 255 },
    black: { r: 0, g: 0, b: 0 },
    red: { r: 255, g: 0, b: 0 },
    green: { r: 0, g: 128, b: 0 },
    blue: { r: 0, g: 0, b: 255 },
    yellow: { r: 255, g: 255, b: 0 },
    gray: { r: 128, g: 128, b: 128 },
    grey: { r: 128, g: 128, b: 128 },
  };

  return namedColors[color.toLowerCase()] || null;
}

// Calculate relative luminance
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const c1 = parseColor(color1);
  const c2 = parseColor(color2);

  if (!c1 || !c2) {
    throw new Error('Invalid color format');
  }

  const l1 = getLuminance(c1.r, c1.g, c1.b);
  const l2 = getLuminance(c2.r, c2.g, c2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if colors meet WCAG requirements
 */
export function checkContrast(foreground: string, background: string): ContrastResult {
  const ratio = getContrastRatio(foreground, background);

  return {
    ratio: Math.round(ratio * 100) / 100,
    aa: {
      normal: ratio >= 4.5,
      large: ratio >= 3,
    },
    aaa: {
      normal: ratio >= 7,
      large: ratio >= 4.5,
    },
  };
}

/**
 * Get computed colors for an element
 */
export function getElementColors(element: Element): { foreground: string; background: string } {
  const style = window.getComputedStyle(element);
  let background = style.backgroundColor;

  // If background is transparent, walk up the tree
  if (background === 'rgba(0, 0, 0, 0)' || background === 'transparent') {
    let parent = element.parentElement;
    while (parent) {
      const parentStyle = window.getComputedStyle(parent);
      const parentBg = parentStyle.backgroundColor;
      if (parentBg !== 'rgba(0, 0, 0, 0)' && parentBg !== 'transparent') {
        background = parentBg;
        break;
      }
      parent = parent.parentElement;
    }
    // Default to white if no background found
    if (background === 'rgba(0, 0, 0, 0)' || background === 'transparent') {
      background = 'rgb(255, 255, 255)';
    }
  }

  return {
    foreground: style.color,
    background,
  };
}

/**
 * Check contrast for all text elements in a container
 */
export function checkAllTextContrast(container: Element = document.body): Array<{
  element: Element;
  foreground: string;
  background: string;
  result: ContrastResult;
  passes: boolean;
}> {
  const results: Array<{
    element: Element;
    foreground: string;
    background: string;
    result: ContrastResult;
    passes: boolean;
  }> = [];

  const textElements = container.querySelectorAll('p, span, a, h1, h2, h3, h4, h5, h6, li, td, th, label, button');

  textElements.forEach((element) => {
    const colors = getElementColors(element);
    const result = checkContrast(colors.foreground, colors.background);

    // Determine if text is large
    const style = window.getComputedStyle(element);
    const fontSize = parseFloat(style.fontSize);
    const fontWeight = parseInt(style.fontWeight);
    const isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);

    const passes = isLarge ? result.aa.large : result.aa.normal;

    results.push({
      element,
      foreground: colors.foreground,
      background: colors.background,
      result,
      passes,
    });
  });

  return results;
}

/**
 * Suggest accessible color alternatives
 */
export function suggestAccessibleColor(
  baseColor: string,
  background: string,
  targetRatio: number = 4.5
): string | null {
  const base = parseColor(baseColor);
  const bg = parseColor(background);

  if (!base || !bg) return null;

  const bgLuminance = getLuminance(bg.r, bg.g, bg.b);

  // Try lightening or darkening the base color
  for (let factor = 0; factor <= 1; factor += 0.05) {
    // Try darker
    const darker = {
      r: Math.round(base.r * (1 - factor)),
      g: Math.round(base.g * (1 - factor)),
      b: Math.round(base.b * (1 - factor)),
    };
    const darkerLum = getLuminance(darker.r, darker.g, darker.b);
    const darkerRatio = (Math.max(darkerLum, bgLuminance) + 0.05) /
      (Math.min(darkerLum, bgLuminance) + 0.05);

    if (darkerRatio >= targetRatio) {
      return `rgb(${darker.r}, ${darker.g}, ${darker.b})`;
    }

    // Try lighter
    const lighter = {
      r: Math.round(base.r + (255 - base.r) * factor),
      g: Math.round(base.g + (255 - base.g) * factor),
      b: Math.round(base.b + (255 - base.b) * factor),
    };
    const lighterLum = getLuminance(lighter.r, lighter.g, lighter.b);
    const lighterRatio = (Math.max(lighterLum, bgLuminance) + 0.05) /
      (Math.min(lighterLum, bgLuminance) + 0.05);

    if (lighterRatio >= targetRatio) {
      return `rgb(${lighter.r}, ${lighter.g}, ${lighter.b})`;
    }
  }

  return null;
}
