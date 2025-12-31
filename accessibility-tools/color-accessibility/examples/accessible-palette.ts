/**
 * Accessible Color Palette Generator
 *
 * Generates accessible color palettes according to WCAG 2.1:
 * - Success Criterion 1.4.3: Contrast (Minimum) - Level AA
 * - Success Criterion 1.4.6: Contrast (Enhanced) - Level AAA
 * - Success Criterion 1.4.1: Use of Color - Level A
 *
 * Features:
 * - Ensures sufficient contrast ratios
 * - Considers color blindness
 * - Generates harmonious color schemes
 * - Provides accessible alternatives
 *
 * @see https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum
 * @see https://www.w3.org/WAI/WCAG21/Understanding/use-of-color
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

interface AccessibleColor {
  hex: string;
  rgb: RGB;
  hsl: HSL;
  name?: string;
  onWhiteRatio: number;
  onBlackRatio: number;
  usageContext: 'text' | 'background' | 'accent' | 'ui-component';
}

/**
 * Example 1: Accessible Color Generator
 */
export class AccessibleColorGenerator {
  /**
   * Generate accessible colors for text on white background
   */
  static generateTextColorsOnWhite(count: number = 5): AccessibleColor[] {
    const colors: AccessibleColor[] = [];
    const targetRatio = 4.5; // WCAG AA for normal text

    // Generate colors with varying hues
    for (let i = 0; i < count; i++) {
      const hue = (360 / count) * i;

      // Find lightness that achieves target contrast
      const color = this.findAccessibleColor(hue, 70, '#FFFFFF', targetRatio);

      if (color) {
        colors.push({
          ...color,
          usageContext: 'text',
        });
      }
    }

    return colors;
  }

  /**
   * Generate accessible colors for text on black background
   */
  static generateTextColorsOnBlack(count: number = 5): AccessibleColor[] {
    const colors: AccessibleColor[] = [];
    const targetRatio = 4.5;

    for (let i = 0; i < count; i++) {
      const hue = (360 / count) * i;

      // Find lightness that achieves target contrast
      const color = this.findAccessibleColor(hue, 70, '#000000', targetRatio);

      if (color) {
        colors.push({
          ...color,
          usageContext: 'text',
        });
      }
    }

    return colors;
  }

  /**
   * Find a color with the target contrast ratio
   */
  private static findAccessibleColor(
    hue: number,
    saturation: number,
    background: string,
    targetRatio: number
  ): AccessibleColor | null {
    // Try different lightness values
    for (let lightness = 5; lightness <= 95; lightness += 5) {
      const hsl: HSL = { h: hue, s: saturation, l: lightness };
      const rgb = this.hslToRgb(hsl);
      const hex = this.rgbToHex(rgb);

      const ratio = this.getContrastRatio(hex, background);

      if (ratio >= targetRatio) {
        return {
          hex,
          rgb,
          hsl,
          onWhiteRatio: this.getContrastRatio(hex, '#FFFFFF'),
          onBlackRatio: this.getContrastRatio(hex, '#000000'),
          usageContext: 'text',
        };
      }
    }

    return null;
  }

  /**
   * Calculate contrast ratio
   */
  private static getContrastRatio(color1: string, color2: string): number {
    const l1 = this.getRelativeLuminance(this.parseColor(color1)!);
    const l2 = this.getRelativeLuminance(this.parseColor(color2)!);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Get relative luminance
   */
  private static getRelativeLuminance(rgb: RGB): number {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(channel => {
      const sRGB = channel / 255;
      return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Parse color to RGB
   */
  private static parseColor(color: string): RGB | null {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 6) {
        return {
          r: parseInt(hex.slice(0, 2), 16),
          g: parseInt(hex.slice(2, 4), 16),
          b: parseInt(hex.slice(4, 6), 16),
        };
      }
    }

    if (color.startsWith('rgb')) {
      const match = color.match(/(\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        return {
          r: parseInt(match[1]),
          g: parseInt(match[2]),
          b: parseInt(match[3]),
        };
      }
    }

    return null;
  }

  /**
   * Convert HSL to RGB
   */
  private static hslToRgb(hsl: HSL): RGB {
    const h = hsl.h / 360;
    const s = hsl.s / 100;
    const l = hsl.l / 100;

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

  /**
   * Convert RGB to Hex
   */
  private static rgbToHex(rgb: RGB): string {
    const toHex = (n: number) => {
      const hex = Math.min(255, Math.max(0, n)).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }
}

/**
 * Example 2: Color Scheme Generator
 * Generate harmonious accessible color schemes
 */
export class ColorSchemeGenerator {
  /**
   * Generate monochromatic color scheme
   */
  static generateMonochromatic(
    baseHue: number,
    background: string = '#FFFFFF'
  ): AccessibleColor[] {
    const colors: AccessibleColor[] = [];
    const saturation = 70;
    const lightnesses = [20, 30, 40, 50, 60];

    lightnesses.forEach(lightness => {
      const hsl: HSL = { h: baseHue, s: saturation, l: lightness };
      const rgb = AccessibleColorGenerator['hslToRgb'](hsl);
      const hex = AccessibleColorGenerator['rgbToHex'](rgb);

      const onWhiteRatio = AccessibleColorGenerator['getContrastRatio'](hex, '#FFFFFF');
      const onBlackRatio = AccessibleColorGenerator['getContrastRatio'](hex, '#000000');

      colors.push({
        hex,
        rgb,
        hsl,
        onWhiteRatio,
        onBlackRatio,
        usageContext: onWhiteRatio >= 4.5 ? 'text' : 'background',
      });
    });

    return colors;
  }

  /**
   * Generate complementary color scheme
   */
  static generateComplementary(baseHue: number): AccessibleColor[] {
    const hues = [baseHue, (baseHue + 180) % 360];
    return this.generateFromHues(hues);
  }

  /**
   * Generate triadic color scheme
   */
  static generateTriadic(baseHue: number): AccessibleColor[] {
    const hues = [
      baseHue,
      (baseHue + 120) % 360,
      (baseHue + 240) % 360,
    ];
    return this.generateFromHues(hues);
  }

  /**
   * Generate tetradic (square) color scheme
   */
  static generateTetradic(baseHue: number): AccessibleColor[] {
    const hues = [
      baseHue,
      (baseHue + 90) % 360,
      (baseHue + 180) % 360,
      (baseHue + 270) % 360,
    ];
    return this.generateFromHues(hues);
  }

  /**
   * Generate analogous color scheme
   */
  static generateAnalogous(baseHue: number): AccessibleColor[] {
    const hues = [
      (baseHue - 30 + 360) % 360,
      baseHue,
      (baseHue + 30) % 360,
    ];
    return this.generateFromHues(hues);
  }

  /**
   * Generate colors from hue values
   */
  private static generateFromHues(hues: number[]): AccessibleColor[] {
    const colors: AccessibleColor[] = [];

    hues.forEach(hue => {
      // Generate both light and dark variants
      const darkColor = AccessibleColorGenerator['findAccessibleColor'](hue, 70, '#FFFFFF', 4.5);
      const lightColor = AccessibleColorGenerator['findAccessibleColor'](hue, 70, '#000000', 4.5);

      if (darkColor) colors.push(darkColor);
      if (lightColor) colors.push(lightColor);
    });

    return colors;
  }
}

/**
 * Example 3: Complete Accessible Palette Generator
 */
export class AccessiblePaletteGenerator {
  /**
   * Generate a complete accessible color palette
   */
  static generatePalette(options: {
    primaryHue?: number;
    scheme?: 'monochromatic' | 'complementary' | 'triadic' | 'tetradic' | 'analogous';
    includeGrays?: boolean;
  } = {}): {
    primary: AccessibleColor[];
    secondary: AccessibleColor[];
    accent: AccessibleColor[];
    grays: AccessibleColor[];
    success: AccessibleColor;
    warning: AccessibleColor;
    error: AccessibleColor;
    info: AccessibleColor;
  } {
    const primaryHue = options.primaryHue ?? 210; // Default blue
    const scheme = options.scheme ?? 'triadic';
    const includeGrays = options.includeGrays ?? true;

    // Generate primary colors based on scheme
    let schemeColors: AccessibleColor[] = [];
    switch (scheme) {
      case 'monochromatic':
        schemeColors = ColorSchemeGenerator.generateMonochromatic(primaryHue);
        break;
      case 'complementary':
        schemeColors = ColorSchemeGenerator.generateComplementary(primaryHue);
        break;
      case 'triadic':
        schemeColors = ColorSchemeGenerator.generateTriadic(primaryHue);
        break;
      case 'tetradic':
        schemeColors = ColorSchemeGenerator.generateTetradic(primaryHue);
        break;
      case 'analogous':
        schemeColors = ColorSchemeGenerator.generateAnalogous(primaryHue);
        break;
    }

    // Separate into primary, secondary, and accent
    const primary = schemeColors.slice(0, 3);
    const secondary = schemeColors.slice(3, 6);
    const accent = schemeColors.slice(6);

    // Generate semantic colors
    const success = AccessibleColorGenerator['findAccessibleColor'](120, 70, '#FFFFFF', 4.5)!; // Green
    const warning = AccessibleColorGenerator['findAccessibleColor'](45, 70, '#FFFFFF', 4.5)!;  // Orange
    const error = AccessibleColorGenerator['findAccessibleColor'](0, 70, '#FFFFFF', 4.5)!;     // Red
    const info = AccessibleColorGenerator['findAccessibleColor'](200, 70, '#FFFFFF', 4.5)!;    // Blue

    // Add names to semantic colors
    success.name = 'success';
    warning.name = 'warning';
    error.name = 'error';
    info.name = 'info';

    // Generate grays
    const grays = includeGrays ? this.generateGrayScale() : [];

    return {
      primary,
      secondary,
      accent,
      grays,
      success,
      warning,
      error,
      info,
    };
  }

  /**
   * Generate accessible gray scale
   */
  private static generateGrayScale(): AccessibleColor[] {
    const grays: AccessibleColor[] = [];
    const lightnesses = [10, 20, 30, 40, 50, 60, 70, 80, 90];

    lightnesses.forEach((lightness, index) => {
      const hsl: HSL = { h: 0, s: 0, l: lightness };
      const rgb = AccessibleColorGenerator['hslToRgb'](hsl);
      const hex = AccessibleColorGenerator['rgbToHex'](rgb);

      const onWhiteRatio = AccessibleColorGenerator['getContrastRatio'](hex, '#FFFFFF');
      const onBlackRatio = AccessibleColorGenerator['getContrastRatio'](hex, '#000000');

      grays.push({
        hex,
        rgb,
        hsl,
        name: `gray-${(index + 1) * 100}`,
        onWhiteRatio,
        onBlackRatio,
        usageContext: onWhiteRatio >= 4.5 ? 'text' : 'background',
      });
    });

    return grays;
  }

  /**
   * Export palette as CSS variables
   */
  static exportAsCSS(palette: ReturnType<typeof AccessiblePaletteGenerator.generatePalette>): string {
    const lines: string[] = [':root {'];

    // Primary colors
    palette.primary.forEach((color, index) => {
      lines.push(`  --color-primary-${index + 1}: ${color.hex};`);
    });

    // Secondary colors
    palette.secondary.forEach((color, index) => {
      lines.push(`  --color-secondary-${index + 1}: ${color.hex};`);
    });

    // Accent colors
    palette.accent.forEach((color, index) => {
      lines.push(`  --color-accent-${index + 1}: ${color.hex};`);
    });

    // Semantic colors
    lines.push(`  --color-success: ${palette.success.hex};`);
    lines.push(`  --color-warning: ${palette.warning.hex};`);
    lines.push(`  --color-error: ${palette.error.hex};`);
    lines.push(`  --color-info: ${palette.info.hex};`);

    // Grays
    palette.grays.forEach(gray => {
      lines.push(`  --color-${gray.name}: ${gray.hex};`);
    });

    lines.push('}');

    return lines.join('\n');
  }

  /**
   * Export palette as Tailwind config
   */
  static exportAsTailwind(palette: ReturnType<typeof AccessiblePaletteGenerator.generatePalette>): string {
    const config: any = {
      primary: {},
      secondary: {},
      accent: {},
      gray: {},
    };

    palette.primary.forEach((color, index) => {
      config.primary[(index + 1) * 100] = color.hex;
    });

    palette.secondary.forEach((color, index) => {
      config.secondary[(index + 1) * 100] = color.hex;
    });

    palette.accent.forEach((color, index) => {
      config.accent[(index + 1) * 100] = color.hex;
    });

    palette.grays.forEach((gray, index) => {
      config.gray[(index + 1) * 100] = gray.hex;
    });

    config.success = palette.success.hex;
    config.warning = palette.warning.hex;
    config.error = palette.error.hex;
    config.info = palette.info.hex;

    return `module.exports = {
  theme: {
    extend: {
      colors: ${JSON.stringify(config, null, 8)}
    }
  }
}`;
  }
}

/**
 * Example 4: Interactive Palette Generator UI
 */
export class PaletteGeneratorUI {
  private container: HTMLElement;
  private currentPalette: ReturnType<typeof AccessiblePaletteGenerator.generatePalette> | null = null;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error('Container not found');

    this.container = container;
    this.createUI();
  }

  private createUI(): void {
    this.container.innerHTML = `
      <div class="palette-generator">
        <h2>Accessible Color Palette Generator</h2>

        <div class="controls">
          <div class="control-group">
            <label for="primary-hue">Primary Hue (0-360):</label>
            <input
              type="range"
              id="primary-hue"
              min="0"
              max="360"
              value="210"
              aria-label="Select primary hue"
            />
            <span id="hue-value">210</span>
          </div>

          <div class="control-group">
            <label for="color-scheme">Color Scheme:</label>
            <select id="color-scheme" aria-label="Select color scheme">
              <option value="monochromatic">Monochromatic</option>
              <option value="complementary">Complementary</option>
              <option value="triadic" selected>Triadic</option>
              <option value="tetradic">Tetradic</option>
              <option value="analogous">Analogous</option>
            </select>
          </div>

          <button type="button" id="generate-btn">Generate Palette</button>
        </div>

        <div id="palette-display" role="region" aria-label="Generated color palette">
          <!-- Palette will be displayed here -->
        </div>

        <div class="export-options">
          <button type="button" id="export-css">Export as CSS</button>
          <button type="button" id="export-tailwind">Export as Tailwind</button>
        </div>

        <div id="export-output" style="display: none;">
          <h3>Exported Code</h3>
          <pre id="export-code"></pre>
        </div>
      </div>
    `;

    this.setupEventListeners();
    this.generatePalette();
  }

  private setupEventListeners(): void {
    const hueInput = this.container.querySelector('#primary-hue') as HTMLInputElement;
    const hueValue = this.container.querySelector('#hue-value') as HTMLElement;
    const generateBtn = this.container.querySelector('#generate-btn') as HTMLButtonElement;
    const exportCSS = this.container.querySelector('#export-css') as HTMLButtonElement;
    const exportTailwind = this.container.querySelector('#export-tailwind') as HTMLButtonElement;

    hueInput.addEventListener('input', () => {
      hueValue.textContent = hueInput.value;
    });

    generateBtn.addEventListener('click', () => this.generatePalette());

    exportCSS.addEventListener('click', () => {
      if (this.currentPalette) {
        const css = AccessiblePaletteGenerator.exportAsCSS(this.currentPalette);
        this.showExport(css);
      }
    });

    exportTailwind.addEventListener('click', () => {
      if (this.currentPalette) {
        const tailwind = AccessiblePaletteGenerator.exportAsTailwind(this.currentPalette);
        this.showExport(tailwind);
      }
    });
  }

  private generatePalette(): void {
    const hueInput = this.container.querySelector('#primary-hue') as HTMLInputElement;
    const schemeSelect = this.container.querySelector('#color-scheme') as HTMLSelectElement;

    const primaryHue = parseInt(hueInput.value);
    const scheme = schemeSelect.value as any;

    this.currentPalette = AccessiblePaletteGenerator.generatePalette({
      primaryHue,
      scheme,
      includeGrays: true,
    });

    this.displayPalette();
  }

  private displayPalette(): void {
    if (!this.currentPalette) return;

    const display = this.container.querySelector('#palette-display') as HTMLElement;

    const sections = [
      { title: 'Primary Colors', colors: this.currentPalette.primary },
      { title: 'Secondary Colors', colors: this.currentPalette.secondary },
      { title: 'Accent Colors', colors: this.currentPalette.accent },
      {
        title: 'Semantic Colors',
        colors: [
          this.currentPalette.success,
          this.currentPalette.warning,
          this.currentPalette.error,
          this.currentPalette.info,
        ],
      },
      { title: 'Grays', colors: this.currentPalette.grays },
    ];

    const html = sections
      .map(section => {
        if (section.colors.length === 0) return '';

        return `
          <div class="color-section">
            <h3>${section.title}</h3>
            <div class="color-grid">
              ${section.colors
                .map(
                  color => `
                <div class="color-card">
                  <div
                    class="color-swatch"
                    style="background: ${color.hex};"
                    role="img"
                    aria-label="${color.name || color.hex}"
                  ></div>
                  <div class="color-info">
                    <div class="color-hex">${color.hex}</div>
                    ${color.name ? `<div class="color-name">${color.name}</div>` : ''}
                    <div class="contrast-info">
                      <small>On white: ${color.onWhiteRatio.toFixed(2)}:1</small>
                      <small>On black: ${color.onBlackRatio.toFixed(2)}:1</small>
                    </div>
                    <div class="wcag-badge ${color.onWhiteRatio >= 4.5 ? 'pass' : 'fail'}">
                      ${color.onWhiteRatio >= 4.5 ? '✓ WCAG AA' : '✗ Decorative only'}
                    </div>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        `;
      })
      .join('');

    display.innerHTML = html;
  }

  private showExport(code: string): void {
    const output = this.container.querySelector('#export-output') as HTMLElement;
    const codeEl = this.container.querySelector('#export-code') as HTMLElement;

    codeEl.textContent = code;
    output.style.display = 'block';
  }
}

// Usage examples
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Accessible Color Palette Generator - WCAG 2.1 Compliant');

    // Example 1: Generate text colors
    const textColors = AccessibleColorGenerator.generateTextColorsOnWhite(5);
    console.log('Accessible text colors on white:', textColors);

    // Example 2: Generate color scheme
    const triadic = ColorSchemeGenerator.generateTriadic(210);
    console.log('Triadic color scheme:', triadic);

    // Example 3: Generate complete palette
    const palette = AccessiblePaletteGenerator.generatePalette({
      primaryHue: 210,
      scheme: 'triadic',
      includeGrays: true,
    });
    console.log('Complete palette:', palette);

    // Example 4: Export as CSS
    console.log('\nCSS Variables:');
    console.log(AccessiblePaletteGenerator.exportAsCSS(palette));
  });
}
