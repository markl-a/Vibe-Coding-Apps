/**
 * Color Blindness Simulation Examples
 *
 * Demonstrates color vision deficiency simulation according to WCAG 2.1:
 * - Success Criterion 1.4.1: Use of Color (Level A)
 * - Success Criterion 1.4.11: Non-text Contrast (Level AA)
 *
 * Color blindness types:
 * - Protanopia (Red-blind) - ~1% of males
 * - Deuteranopia (Green-blind) - ~1% of males
 * - Tritanopia (Blue-blind) - ~0.001% of population
 * - Achromatopsia (Total color blindness) - ~0.003% of population
 *
 * @see https://www.w3.org/WAI/WCAG21/Understanding/use-of-color
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

type ColorBlindnessType =
  | 'protanopia'    // Red-blind
  | 'protanomaly'   // Red-weak
  | 'deuteranopia'  // Green-blind
  | 'deuteranomaly' // Green-weak
  | 'tritanopia'    // Blue-blind
  | 'tritanomaly'   // Blue-weak
  | 'achromatopsia' // Total color blindness
  | 'achromatomaly'; // Blue cone monochromacy

/**
 * Example 1: Color Blindness Simulator
 * Simulates various types of color vision deficiency
 */
export class ColorBlindnessSimulator {
  /**
   * Transform matrices for color blindness simulation
   * Based on Brettel, Viénot and Mollon JPEG algorithm
   */
  private static readonly matrices: Record<ColorBlindnessType, number[][]> = {
    // Protanopia (red-blind)
    protanopia: [
      [0.567, 0.433, 0.0],
      [0.558, 0.442, 0.0],
      [0.0, 0.242, 0.758],
    ],
    // Protanomaly (red-weak)
    protanomaly: [
      [0.817, 0.183, 0.0],
      [0.333, 0.667, 0.0],
      [0.0, 0.125, 0.875],
    ],
    // Deuteranopia (green-blind)
    deuteranopia: [
      [0.625, 0.375, 0.0],
      [0.7, 0.3, 0.0],
      [0.0, 0.3, 0.7],
    ],
    // Deuteranomaly (green-weak)
    deuteranomaly: [
      [0.8, 0.2, 0.0],
      [0.258, 0.742, 0.0],
      [0.0, 0.142, 0.858],
    ],
    // Tritanopia (blue-blind)
    tritanopia: [
      [0.95, 0.05, 0.0],
      [0.0, 0.433, 0.567],
      [0.0, 0.475, 0.525],
    ],
    // Tritanomaly (blue-weak)
    tritanomaly: [
      [0.967, 0.033, 0.0],
      [0.0, 0.733, 0.267],
      [0.0, 0.183, 0.817],
    ],
    // Achromatopsia (total color blindness)
    achromatopsia: [
      [0.299, 0.587, 0.114],
      [0.299, 0.587, 0.114],
      [0.299, 0.587, 0.114],
    ],
    // Achromatomaly (blue cone monochromacy)
    achromatomaly: [
      [0.618, 0.320, 0.062],
      [0.163, 0.775, 0.062],
      [0.163, 0.320, 0.516],
    ],
  };

  /**
   * Simulate color blindness for a given color
   */
  static simulate(color: string, type: ColorBlindnessType): string {
    const rgb = this.parseColor(color);
    if (!rgb) throw new Error('Invalid color format');

    const matrix = this.matrices[type];
    const simulated = this.applyMatrix(rgb, matrix);

    return this.rgbToHex(simulated);
  }

  /**
   * Apply transformation matrix to RGB color
   */
  private static applyMatrix(rgb: RGB, matrix: number[][]): RGB {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    return {
      r: Math.round(Math.min(255, Math.max(0, (matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b) * 255))),
      g: Math.round(Math.min(255, Math.max(0, (matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b) * 255))),
      b: Math.round(Math.min(255, Math.max(0, (matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b) * 255))),
    };
  }

  /**
   * Parse color string to RGB
   */
  private static parseColor(color: string): RGB | null {
    color = color.trim().toLowerCase();

    // Hex format
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

    // RGB format
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]),
        g: parseInt(rgbMatch[2]),
        b: parseInt(rgbMatch[3]),
      };
    }

    return null;
  }

  /**
   * Convert RGB to hex string
   */
  private static rgbToHex(rgb: RGB): string {
    const toHex = (n: number) => {
      const hex = n.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }

  /**
   * Get all simulations for a color
   */
  static simulateAll(color: string): Record<ColorBlindnessType, string> {
    const results: Partial<Record<ColorBlindnessType, string>> = {};

    Object.keys(this.matrices).forEach(type => {
      results[type as ColorBlindnessType] = this.simulate(color, type as ColorBlindnessType);
    });

    return results as Record<ColorBlindnessType, string>;
  }
}

/**
 * Example 2: Color Palette Analyzer
 * Check if colors in a palette are distinguishable for color-blind users
 */
export class ColorPaletteAnalyzer {
  /**
   * Analyze if colors are distinguishable with color blindness
   */
  static analyzePalette(
    colors: string[],
    type: ColorBlindnessType = 'deuteranopia'
  ): Array<{
    original: string;
    simulated: string;
    distinguishable: boolean;
    conflicts: string[];
  }> {
    const results: Array<any> = [];

    colors.forEach(color => {
      const simulated = ColorBlindnessSimulator.simulate(color, type);
      const conflicts: string[] = [];

      // Check against other colors
      colors.forEach(otherColor => {
        if (color === otherColor) return;

        const otherSimulated = ColorBlindnessSimulator.simulate(otherColor, type);
        const distance = this.colorDistance(simulated, otherSimulated);

        // If colors are too similar (distance < 50), they may be indistinguishable
        if (distance < 50) {
          conflicts.push(otherColor);
        }
      });

      results.push({
        original: color,
        simulated,
        distinguishable: conflicts.length === 0,
        conflicts,
      });
    });

    return results;
  }

  /**
   * Calculate Euclidean distance between two colors in RGB space
   */
  private static colorDistance(color1: string, color2: string): number {
    const rgb1 = ColorBlindnessSimulator['parseColor'](color1);
    const rgb2 = ColorBlindnessSimulator['parseColor'](color2);

    if (!rgb1 || !rgb2) return 0;

    return Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
    );
  }

  /**
   * Generate report for palette accessibility
   */
  static generateReport(colors: string[]): string {
    const types: ColorBlindnessType[] = [
      'protanopia',
      'deuteranopia',
      'tritanopia',
      'achromatopsia',
    ];

    const lines: string[] = [
      '=== Color Palette Accessibility Report ===',
      `Colors analyzed: ${colors.join(', ')}`,
      '',
    ];

    types.forEach(type => {
      const results = this.analyzePalette(colors, type);
      const issues = results.filter(r => !r.distinguishable);

      lines.push(`${type.toUpperCase()}`);
      if (issues.length === 0) {
        lines.push('  ✓ All colors are distinguishable');
      } else {
        lines.push(`  ✗ ${issues.length} color(s) have conflicts`);
        issues.forEach(issue => {
          lines.push(`    ${issue.original} conflicts with: ${issue.conflicts.join(', ')}`);
        });
      }
      lines.push('');
    });

    return lines.join('\n');
  }
}

/**
 * Example 3: Page Color Blindness Filter
 * Apply color blindness simulation to entire webpage
 */
export class PageColorFilter {
  private originalStyles: Map<Element, string> = new Map();
  private currentFilter: ColorBlindnessType | null = null;

  /**
   * Apply color blindness filter to page
   */
  applyFilter(type: ColorBlindnessType): void {
    this.removeFilter(); // Remove existing filter first

    const elements = document.querySelectorAll('*');

    elements.forEach(element => {
      const computed = window.getComputedStyle(element);
      const htmlElement = element as HTMLElement;

      // Store original styles
      if (!this.originalStyles.has(element)) {
        this.originalStyles.set(element, htmlElement.style.cssText);
      }

      // Apply filter to text color
      if (computed.color) {
        try {
          const simulated = ColorBlindnessSimulator.simulate(computed.color, type);
          htmlElement.style.color = simulated;
        } catch (e) {
          // Skip invalid colors
        }
      }

      // Apply filter to background color
      if (computed.backgroundColor && computed.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        try {
          const simulated = ColorBlindnessSimulator.simulate(computed.backgroundColor, type);
          htmlElement.style.backgroundColor = simulated;
        } catch (e) {
          // Skip invalid colors
        }
      }

      // Apply filter to border color
      if (computed.borderColor) {
        try {
          const simulated = ColorBlindnessSimulator.simulate(computed.borderColor, type);
          htmlElement.style.borderColor = simulated;
        } catch (e) {
          // Skip invalid colors
        }
      }
    });

    this.currentFilter = type;
  }

  /**
   * Remove color blindness filter
   */
  removeFilter(): void {
    this.originalStyles.forEach((originalStyle, element) => {
      (element as HTMLElement).style.cssText = originalStyle;
    });

    this.originalStyles.clear();
    this.currentFilter = null;
  }

  /**
   * Get current filter
   */
  getCurrentFilter(): ColorBlindnessType | null {
    return this.currentFilter;
  }
}

/**
 * Example 4: Interactive Color Blindness Simulator UI
 */
export class ColorBlindnessSimulatorUI {
  private container: HTMLElement;
  private pageFilter: PageColorFilter;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error('Container not found');

    this.container = container;
    this.pageFilter = new PageColorFilter();

    this.createUI();
  }

  private createUI(): void {
    this.container.innerHTML = `
      <div class="colorblind-simulator">
        <h2>Color Blindness Simulator</h2>

        <div class="controls">
          <label for="simulation-type">Simulation Type:</label>
          <select id="simulation-type" aria-label="Select color blindness type">
            <option value="">Normal Vision</option>
            <option value="protanopia">Protanopia (Red-blind)</option>
            <option value="protanomaly">Protanomaly (Red-weak)</option>
            <option value="deuteranopia">Deuteranopia (Green-blind)</option>
            <option value="deuteranomaly">Deuteranomaly (Green-weak)</option>
            <option value="tritanopia">Tritanopia (Blue-blind)</option>
            <option value="tritanomaly">Tritanomaly (Blue-weak)</option>
            <option value="achromatopsia">Achromatopsia (Total color blindness)</option>
            <option value="achromatomaly">Achromatomaly (Blue cone monochromacy)</option>
          </select>
        </div>

        <div class="color-test">
          <h3>Test Colors</h3>
          <div class="color-samples">
            <div class="color-sample" style="background: #FF0000;" aria-label="Red"></div>
            <div class="color-sample" style="background: #00FF00;" aria-label="Green"></div>
            <div class="color-sample" style="background: #0000FF;" aria-label="Blue"></div>
            <div class="color-sample" style="background: #FFFF00;" aria-label="Yellow"></div>
            <div class="color-sample" style="background: #FF00FF;" aria-label="Magenta"></div>
            <div class="color-sample" style="background: #00FFFF;" aria-label="Cyan"></div>
          </div>
        </div>

        <div id="info" role="status" aria-live="polite">
          <p>Select a simulation type to see how colors appear with different types of color vision deficiency.</p>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const select = this.container.querySelector('#simulation-type') as HTMLSelectElement;
    const info = this.container.querySelector('#info') as HTMLElement;

    select.addEventListener('change', () => {
      const type = select.value as ColorBlindnessType;

      if (type) {
        this.pageFilter.applyFilter(type);

        const descriptions: Record<ColorBlindnessType, string> = {
          protanopia: 'Protanopia: Difficulty distinguishing red from green. Affects ~1% of males.',
          protanomaly: 'Protanomaly: Reduced sensitivity to red light. Affects ~1% of males.',
          deuteranopia: 'Deuteranopia: Difficulty distinguishing red from green. Most common, affects ~1% of males.',
          deuteranomaly: 'Deuteranomaly: Reduced sensitivity to green light. Affects ~5% of males.',
          tritanopia: 'Tritanopia: Difficulty distinguishing blue from yellow. Very rare (~0.001%).',
          tritanomaly: 'Tritanomaly: Reduced sensitivity to blue light. Rare.',
          achromatopsia: 'Achromatopsia: Complete color blindness. Extremely rare (~0.003%).',
          achromatomaly: 'Achromatomaly: Partial color blindness. Very rare.',
        };

        info.innerHTML = `<p><strong>Active:</strong> ${descriptions[type]}</p>`;
      } else {
        this.pageFilter.removeFilter();
        info.innerHTML = '<p>Normal vision restored.</p>';
      }
    });
  }
}

/**
 * Example 5: Color Accessibility Checker
 * Verify color combinations work for all color vision types
 */
export class ColorAccessibilityChecker {
  /**
   * Check if a color pair is accessible for color-blind users
   */
  static checkColorPair(
    foreground: string,
    background: string
  ): Record<ColorBlindnessType | 'normal', boolean> {
    const results: Partial<Record<ColorBlindnessType | 'normal', boolean>> = {
      normal: true, // Normal vision always passes
    };

    const types: ColorBlindnessType[] = [
      'protanopia',
      'deuteranopia',
      'tritanopia',
      'achromatopsia',
    ];

    types.forEach(type => {
      const fgSimulated = ColorBlindnessSimulator.simulate(foreground, type);
      const bgSimulated = ColorBlindnessSimulator.simulate(background, type);

      // Check if there's sufficient difference
      const distance = this.colorDistance(fgSimulated, bgSimulated);

      // Threshold: colors should be at least 50 units apart in RGB space
      results[type] = distance >= 50;
    });

    return results as Record<ColorBlindnessType | 'normal', boolean>;
  }

  private static colorDistance(color1: string, color2: string): number {
    const rgb1 = ColorBlindnessSimulator['parseColor'](color1);
    const rgb2 = ColorBlindnessSimulator['parseColor'](color2);

    if (!rgb1 || !rgb2) return 0;

    return Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
    );
  }

  /**
   * Get recommendations for color usage
   */
  static getRecommendations(foreground: string, background: string): string[] {
    const recommendations: string[] = [];
    const results = this.checkColorPair(foreground, background);

    const failedTypes = Object.entries(results)
      .filter(([type, passes]) => !passes && type !== 'normal')
      .map(([type]) => type);

    if (failedTypes.length > 0) {
      recommendations.push(
        `Colors may be difficult to distinguish for users with: ${failedTypes.join(', ')}`
      );
      recommendations.push(
        'Consider using additional visual indicators beyond color (patterns, icons, text labels)'
      );
      recommendations.push(
        'Ensure sufficient contrast ratio (4.5:1 for text, 3:1 for UI components)'
      );
    } else {
      recommendations.push('Color combination is accessible for all color vision types!');
    }

    return recommendations;
  }
}

// Usage examples
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Color Blindness Simulation - WCAG 2.1 Compliant');

    // Example 1: Simulate individual colors
    const redColor = '#FF0000';
    console.log('Original red:', redColor);
    console.log('Protanopia:', ColorBlindnessSimulator.simulate(redColor, 'protanopia'));
    console.log('Deuteranopia:', ColorBlindnessSimulator.simulate(redColor, 'deuteranopia'));
    console.log('Tritanopia:', ColorBlindnessSimulator.simulate(redColor, 'tritanopia'));

    // Example 2: Analyze color palette
    const palette = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'];
    console.log('\nPalette Analysis:');
    console.log(ColorPaletteAnalyzer.generateReport(palette));

    // Example 3: Check color pair accessibility
    const results = ColorAccessibilityChecker.checkColorPair('#E74C3C', '#FFFFFF');
    console.log('\nColor pair accessibility:', results);
    console.log('Recommendations:', ColorAccessibilityChecker.getRecommendations('#E74C3C', '#FFFFFF'));
  });
}
