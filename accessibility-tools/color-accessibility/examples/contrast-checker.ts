/**
 * Color Contrast Checker Examples
 *
 * Demonstrates WCAG 2.1 color contrast checking:
 * - Success Criterion 1.4.3: Contrast (Minimum) - Level AA
 * - Success Criterion 1.4.6: Contrast (Enhanced) - Level AAA
 * - Success Criterion 1.4.11: Non-text Contrast - Level AA
 *
 * WCAG 2.1 Contrast Requirements:
 * - Normal text: 4.5:1 (AA), 7:1 (AAA)
 * - Large text: 3:1 (AA), 4.5:1 (AAA)
 * - UI components: 3:1 (AA)
 *
 * @see https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum
 * @see https://www.w3.org/WAI/WCAG21/Understanding/contrast-enhanced
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface ContrastResult {
  ratio: number;
  aa: {
    normal: boolean;
    large: boolean;
    uiComponent: boolean;
  };
  aaa: {
    normal: boolean;
    large: boolean;
  };
}

/**
 * Example 1: Basic Contrast Ratio Calculator
 */
export class ContrastChecker {
  /**
   * Calculate relative luminance of a color
   * Based on WCAG 2.1 formula
   */
  private static getRelativeLuminance(rgb: RGB): number {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(channel => {
      const sRGB = channel / 255;
      return sRGB <= 0.03928
        ? sRGB / 12.92
        : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static calculateRatio(foreground: string, background: string): number {
    const fg = this.parseColor(foreground);
    const bg = this.parseColor(background);

    if (!fg || !bg) {
      throw new Error('Invalid color format');
    }

    const l1 = this.getRelativeLuminance(fg);
    const l2 = this.getRelativeLuminance(bg);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if contrast meets WCAG requirements
   */
  static checkContrast(
    foreground: string,
    background: string,
    fontSize: number = 16,
    fontWeight: number = 400
  ): ContrastResult {
    const ratio = this.calculateRatio(foreground, background);
    const isLargeText = fontSize >= 24 || (fontSize >= 19 && fontWeight >= 700);

    return {
      ratio: Math.round(ratio * 100) / 100,
      aa: {
        normal: ratio >= 4.5,
        large: ratio >= 3,
        uiComponent: ratio >= 3,
      },
      aaa: {
        normal: ratio >= 7,
        large: ratio >= 4.5,
      },
    };
  }

  /**
   * Parse color string to RGB
   */
  private static parseColor(color: string): RGB | null {
    // Remove whitespace
    color = color.trim().toLowerCase();

    // Hex format
    if (color.startsWith('#')) {
      return this.parseHex(color);
    }

    // RGB/RGBA format
    if (color.startsWith('rgb')) {
      return this.parseRGB(color);
    }

    // HSL format
    if (color.startsWith('hsl')) {
      return this.parseHSL(color);
    }

    // Named colors
    return this.parseNamedColor(color);
  }

  private static parseHex(hex: string): RGB | null {
    const cleaned = hex.replace('#', '');

    if (cleaned.length === 3) {
      return {
        r: parseInt(cleaned[0] + cleaned[0], 16),
        g: parseInt(cleaned[1] + cleaned[1], 16),
        b: parseInt(cleaned[2] + cleaned[2], 16),
      };
    }

    if (cleaned.length === 6) {
      return {
        r: parseInt(cleaned.slice(0, 2), 16),
        g: parseInt(cleaned.slice(2, 4), 16),
        b: parseInt(cleaned.slice(4, 6), 16),
      };
    }

    return null;
  }

  private static parseRGB(rgb: string): RGB | null {
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return null;

    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3]),
    };
  }

  private static parseHSL(hsl: string): RGB | null {
    const match = hsl.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%/);
    if (!match) return null;

    const h = parseInt(match[1]) / 360;
    const s = parseInt(match[2]) / 100;
    const l = parseInt(match[3]) / 100;

    return this.hslToRgb(h, s, l);
  }

  private static hslToRgb(h: number, s: number, l: number): RGB {
    let r: number, g: number, b: number;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  }

  private static parseNamedColor(name: string): RGB | null {
    const namedColors: Record<string, RGB> = {
      white: { r: 255, g: 255, b: 255 },
      black: { r: 0, g: 0, b: 0 },
      red: { r: 255, g: 0, b: 0 },
      green: { r: 0, g: 128, b: 0 },
      blue: { r: 0, g: 0, b: 255 },
      yellow: { r: 255, g: 255, b: 0 },
      cyan: { r: 0, g: 255, b: 255 },
      magenta: { r: 255, g: 0, b: 255 },
      gray: { r: 128, g: 128, b: 128 },
      grey: { r: 128, g: 128, b: 128 },
      orange: { r: 255, g: 165, b: 0 },
      purple: { r: 128, g: 0, b: 128 },
    };

    return namedColors[name] || null;
  }
}

/**
 * Example 2: Bulk Page Contrast Auditor
 */
export class PageContrastAuditor {
  /**
   * Check contrast for all text elements on the page
   */
  static auditPage(): Array<{
    element: Element;
    foreground: string;
    background: string;
    result: ContrastResult;
    passes: boolean;
    selector: string;
  }> {
    const results: Array<any> = [];
    const textElements = document.querySelectorAll(
      'p, span, a, h1, h2, h3, h4, h5, h6, li, td, th, label, button, input, textarea, select'
    );

    textElements.forEach(element => {
      const computed = window.getComputedStyle(element);
      const foreground = computed.color;
      const background = this.getBackgroundColor(element);

      const fontSize = parseFloat(computed.fontSize);
      const fontWeight = parseInt(computed.fontWeight);

      const result = ContrastChecker.checkContrast(
        foreground,
        background,
        fontSize,
        fontWeight
      );

      const isLargeText = fontSize >= 24 || (fontSize >= 19 && fontWeight >= 700);
      const passes = isLargeText ? result.aa.large : result.aa.normal;

      results.push({
        element,
        foreground,
        background,
        result,
        passes,
        selector: this.getSelector(element),
      });
    });

    return results;
  }

  /**
   * Get effective background color (walk up DOM tree if transparent)
   */
  private static getBackgroundColor(element: Element): string {
    let current: Element | null = element;
    let backgroundColor = '';

    while (current && current !== document.documentElement) {
      const computed = window.getComputedStyle(current);
      backgroundColor = computed.backgroundColor;

      if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') {
        break;
      }

      current = current.parentElement;
    }

    // Default to white if no background found
    if (!backgroundColor || backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
      backgroundColor = 'rgb(255, 255, 255)';
    }

    return backgroundColor;
  }

  /**
   * Generate CSS selector for an element
   */
  private static getSelector(element: Element): string {
    if (element.id) {
      return `#${element.id}`;
    }

    const parts: string[] = [];
    let current: Element | null = element;

    while (current && current !== document.documentElement) {
      let selector = current.tagName.toLowerCase();

      if (current.className) {
        const classes = Array.from(current.classList).slice(0, 2);
        if (classes.length) {
          selector += '.' + classes.join('.');
        }
      }

      parts.unshift(selector);
      current = current.parentElement;
    }

    return parts.join(' > ');
  }

  /**
   * Generate a report of contrast issues
   */
  static generateReport(): string {
    const results = this.auditPage();
    const failures = results.filter(r => !r.passes);

    const lines: string[] = [
      '=== Color Contrast Audit Report ===',
      `Total elements checked: ${results.length}`,
      `Passing: ${results.length - failures.length}`,
      `Failing: ${failures.length}`,
      '',
    ];

    if (failures.length > 0) {
      lines.push('WCAG AA Failures:');
      failures.forEach((failure, index) => {
        lines.push(`\n${index + 1}. ${failure.selector}`);
        lines.push(`   Foreground: ${failure.foreground}`);
        lines.push(`   Background: ${failure.background}`);
        lines.push(`   Ratio: ${failure.result.ratio}:1`);
        lines.push(`   Required: 4.5:1 (normal) or 3:1 (large)`);
      });
    }

    return lines.join('\n');
  }
}

/**
 * Example 3: Interactive Contrast Checker Tool
 */
export class InteractiveContrastChecker {
  private container: HTMLElement;
  private foregroundInput: HTMLInputElement;
  private backgroundInput: HTMLInputElement;
  private resultDisplay: HTMLElement;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error('Container not found');

    this.container = container;
    this.createUI();
  }

  private createUI(): void {
    this.container.innerHTML = `
      <div class="contrast-checker">
        <h2>WCAG 2.1 Contrast Checker</h2>

        <div class="color-inputs">
          <div class="input-group">
            <label for="foreground-color">Foreground Color</label>
            <input
              type="color"
              id="foreground-color"
              value="#000000"
              aria-label="Select foreground color"
            />
            <input
              type="text"
              id="foreground-text"
              value="#000000"
              aria-label="Foreground color hex code"
            />
          </div>

          <div class="input-group">
            <label for="background-color">Background Color</label>
            <input
              type="color"
              id="background-color"
              value="#FFFFFF"
              aria-label="Select background color"
            />
            <input
              type="text"
              id="background-text"
              value="#FFFFFF"
              aria-label="Background color hex code"
            />
          </div>
        </div>

        <div class="preview" role="region" aria-label="Color preview">
          <p id="preview-text" style="background: #FFFFFF; color: #000000; padding: 20px; font-size: 16px;">
            Sample text with selected colors
          </p>
        </div>

        <div id="results" role="status" aria-live="polite" aria-atomic="true">
          <!-- Results will be inserted here -->
        </div>
      </div>
    `;

    this.foregroundInput = this.container.querySelector('#foreground-color') as HTMLInputElement;
    this.backgroundInput = this.container.querySelector('#background-color') as HTMLInputElement;
    this.resultDisplay = this.container.querySelector('#results') as HTMLElement;

    this.setupEventListeners();
    this.updateResults();
  }

  private setupEventListeners(): void {
    const foregroundText = this.container.querySelector('#foreground-text') as HTMLInputElement;
    const backgroundText = this.container.querySelector('#background-text') as HTMLInputElement;

    this.foregroundInput.addEventListener('input', () => {
      foregroundText.value = this.foregroundInput.value;
      this.updateResults();
    });

    this.backgroundInput.addEventListener('input', () => {
      backgroundText.value = this.backgroundInput.value;
      this.updateResults();
    });

    foregroundText.addEventListener('input', () => {
      try {
        this.foregroundInput.value = foregroundText.value;
        this.updateResults();
      } catch (e) {
        // Invalid color format
      }
    });

    backgroundText.addEventListener('input', () => {
      try {
        this.backgroundInput.value = backgroundText.value;
        this.updateResults();
      } catch (e) {
        // Invalid color format
      }
    });
  }

  private updateResults(): void {
    const fg = this.foregroundInput.value;
    const bg = this.backgroundInput.value;

    // Update preview
    const preview = this.container.querySelector('#preview-text') as HTMLElement;
    preview.style.color = fg;
    preview.style.backgroundColor = bg;

    // Calculate contrast
    try {
      const result = ContrastChecker.checkContrast(fg, bg);

      this.resultDisplay.innerHTML = `
        <h3>Contrast Ratio: ${result.ratio}:1</h3>

        <div class="wcag-results">
          <div class="level">
            <h4>WCAG AA</h4>
            <ul>
              <li class="${result.aa.normal ? 'pass' : 'fail'}">
                ${result.aa.normal ? '✓' : '✗'} Normal text (4.5:1)
              </li>
              <li class="${result.aa.large ? 'pass' : 'fail'}">
                ${result.aa.large ? '✓' : '✗'} Large text (3:1)
              </li>
              <li class="${result.aa.uiComponent ? 'pass' : 'fail'}">
                ${result.aa.uiComponent ? '✓' : '✗'} UI components (3:1)
              </li>
            </ul>
          </div>

          <div class="level">
            <h4>WCAG AAA</h4>
            <ul>
              <li class="${result.aaa.normal ? 'pass' : 'fail'}">
                ${result.aaa.normal ? '✓' : '✗'} Normal text (7:1)
              </li>
              <li class="${result.aaa.large ? 'pass' : 'fail'}">
                ${result.aaa.large ? '✓' : '✗'} Large text (4.5:1)
              </li>
            </ul>
          </div>
        </div>

        <p class="note">
          Large text is defined as 18pt (24px) or larger, or 14pt (18.66px) bold or larger.
        </p>
      `;
    } catch (error) {
      this.resultDisplay.innerHTML = `<p class="error">Invalid color format</p>`;
    }
  }
}

/**
 * Example 4: Suggest Accessible Color Alternatives
 */
export class ColorSuggester {
  /**
   * Suggest accessible alternatives for a color
   */
  static suggestAccessibleColor(
    baseColor: string,
    backgroundColor: string,
    targetRatio: number = 4.5
  ): string[] {
    const suggestions: string[] = [];
    const base = ContrastChecker['parseColor'](baseColor);
    const bg = ContrastChecker['parseColor'](backgroundColor);

    if (!base || !bg) return suggestions;

    // Try darkening the color
    for (let i = 0; i <= 20; i++) {
      const factor = i / 20;
      const darker = {
        r: Math.round(base.r * (1 - factor)),
        g: Math.round(base.g * (1 - factor)),
        b: Math.round(base.b * (1 - factor)),
      };

      const hex = this.rgbToHex(darker);
      const ratio = ContrastChecker.calculateRatio(hex, backgroundColor);

      if (ratio >= targetRatio) {
        suggestions.push(hex);
        break;
      }
    }

    // Try lightening the color
    for (let i = 0; i <= 20; i++) {
      const factor = i / 20;
      const lighter = {
        r: Math.round(base.r + (255 - base.r) * factor),
        g: Math.round(base.g + (255 - base.g) * factor),
        b: Math.round(base.b + (255 - base.b) * factor),
      };

      const hex = this.rgbToHex(lighter);
      const ratio = ContrastChecker.calculateRatio(hex, backgroundColor);

      if (ratio >= targetRatio) {
        suggestions.push(hex);
        break;
      }
    }

    return suggestions;
  }

  private static rgbToHex(rgb: RGB): string {
    const toHex = (n: number) => {
      const hex = Math.min(255, Math.max(0, n)).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }
}

// Usage examples
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Color Contrast Checker - WCAG 2.1 Compliant');

    // Example 1: Check specific colors
    const result1 = ContrastChecker.checkContrast('#000000', '#FFFFFF');
    console.log('Black on white:', result1);

    const result2 = ContrastChecker.checkContrast('#777777', '#FFFFFF');
    console.log('Gray on white:', result2);

    // Example 2: Audit entire page
    console.log('\nPage Audit:');
    console.log(PageContrastAuditor.generateReport());

    // Example 3: Get suggestions
    const suggestions = ColorSuggester.suggestAccessibleColor('#FF6B6B', '#FFFFFF', 4.5);
    console.log('\nAccessible alternatives for #FF6B6B on white:', suggestions);
  });
}
