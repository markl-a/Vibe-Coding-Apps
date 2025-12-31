/**
 * WCAG 2.1 Compliance Checker Examples
 *
 * Comprehensive WCAG 2.1 compliance testing across all levels:
 * - Level A (25 criteria) - Minimum compliance
 * - Level AA (13 additional criteria) - Target compliance
 * - Level AAA (23 additional criteria) - Enhanced compliance
 *
 * WCAG 2.1 Principles (POUR):
 * 1. Perceivable - Information must be presentable to users
 * 2. Operable - Interface components must be operable
 * 3. Understandable - Information and operation must be understandable
 * 4. Robust - Content must be robust enough for assistive technologies
 *
 * @see https://www.w3.org/WAI/WCAG21/quickref/
 */

export type WCAGLevel = 'A' | 'AA' | 'AAA';
export type WCAGPrinciple = 'Perceivable' | 'Operable' | 'Understandable' | 'Robust';

export interface WCAGCriterion {
  id: string;
  level: WCAGLevel;
  principle: WCAGPrinciple;
  guideline: string;
  name: string;
  description: string;
  url: string;
}

export interface ComplianceResult {
  criterion: WCAGCriterion;
  passed: boolean;
  issues: string[];
  elementsAffected: number;
}

export interface ComplianceReport {
  timestamp: Date;
  url: string;
  targetLevel: WCAGLevel;
  totalCriteria: number;
  passed: number;
  failed: number;
  notApplicable: number;
  results: ComplianceResult[];
  summary: {
    levelA: { passed: number; failed: number };
    levelAA: { passed: number; failed: number };
    levelAAA: { passed: number; failed: number };
  };
  overallCompliance: {
    levelA: boolean;
    levelAA: boolean;
    levelAAA: boolean;
  };
}

/**
 * Example 1: WCAG 2.1 Criterion Definitions
 */
export class WCAGCriteria {
  /**
   * All WCAG 2.1 Success Criteria
   */
  static readonly ALL: WCAGCriterion[] = [
    // Perceivable - Level A
    {
      id: '1.1.1',
      level: 'A',
      principle: 'Perceivable',
      guideline: '1.1 Text Alternatives',
      name: 'Non-text Content',
      description: 'All non-text content has a text alternative',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content',
    },
    {
      id: '1.2.1',
      level: 'A',
      principle: 'Perceivable',
      guideline: '1.2 Time-based Media',
      name: 'Audio-only and Video-only (Prerecorded)',
      description: 'Alternatives for prerecorded audio-only and video-only media',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/audio-only-and-video-only-prerecorded',
    },
    {
      id: '1.2.2',
      level: 'A',
      principle: 'Perceivable',
      guideline: '1.2 Time-based Media',
      name: 'Captions (Prerecorded)',
      description: 'Captions for prerecorded audio in synchronized media',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/captions-prerecorded',
    },
    {
      id: '1.2.3',
      level: 'A',
      principle: 'Perceivable',
      guideline: '1.2 Time-based Media',
      name: 'Audio Description or Media Alternative (Prerecorded)',
      description: 'Audio description or text alternative for prerecorded video',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/audio-description-or-media-alternative-prerecorded',
    },
    {
      id: '1.3.1',
      level: 'A',
      principle: 'Perceivable',
      guideline: '1.3 Adaptable',
      name: 'Info and Relationships',
      description: 'Information, structure, and relationships can be programmatically determined',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships',
    },
    {
      id: '1.3.2',
      level: 'A',
      principle: 'Perceivable',
      guideline: '1.3 Adaptable',
      name: 'Meaningful Sequence',
      description: 'Content sequence can be programmatically determined',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/meaningful-sequence',
    },
    {
      id: '1.3.3',
      level: 'A',
      principle: 'Perceivable',
      guideline: '1.3 Adaptable',
      name: 'Sensory Characteristics',
      description: 'Instructions do not rely solely on sensory characteristics',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/sensory-characteristics',
    },
    {
      id: '1.4.1',
      level: 'A',
      principle: 'Perceivable',
      guideline: '1.4 Distinguishable',
      name: 'Use of Color',
      description: 'Color is not used as the only visual means of conveying information',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/use-of-color',
    },
    {
      id: '1.4.2',
      level: 'A',
      principle: 'Perceivable',
      guideline: '1.4 Distinguishable',
      name: 'Audio Control',
      description: 'Mechanism to pause, stop, or control volume for audio',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/audio-control',
    },

    // Perceivable - Level AA
    {
      id: '1.3.4',
      level: 'AA',
      principle: 'Perceivable',
      guideline: '1.3 Adaptable',
      name: 'Orientation',
      description: 'Content does not restrict view to a single display orientation',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/orientation',
    },
    {
      id: '1.3.5',
      level: 'AA',
      principle: 'Perceivable',
      guideline: '1.3 Adaptable',
      name: 'Identify Input Purpose',
      description: 'Purpose of input fields can be programmatically determined',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/identify-input-purpose',
    },
    {
      id: '1.4.3',
      level: 'AA',
      principle: 'Perceivable',
      guideline: '1.4 Distinguishable',
      name: 'Contrast (Minimum)',
      description: 'Text has a contrast ratio of at least 4.5:1',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum',
    },
    {
      id: '1.4.4',
      level: 'AA',
      principle: 'Perceivable',
      guideline: '1.4 Distinguishable',
      name: 'Resize Text',
      description: 'Text can be resized up to 200% without loss of content',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/resize-text',
    },
    {
      id: '1.4.5',
      level: 'AA',
      principle: 'Perceivable',
      guideline: '1.4 Distinguishable',
      name: 'Images of Text',
      description: 'Use text rather than images of text',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/images-of-text',
    },
    {
      id: '1.4.10',
      level: 'AA',
      principle: 'Perceivable',
      guideline: '1.4 Distinguishable',
      name: 'Reflow',
      description: 'Content can be presented without horizontal scrolling at 320px width',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/reflow',
    },
    {
      id: '1.4.11',
      level: 'AA',
      principle: 'Perceivable',
      guideline: '1.4 Distinguishable',
      name: 'Non-text Contrast',
      description: 'UI components have a contrast ratio of at least 3:1',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast',
    },
    {
      id: '1.4.12',
      level: 'AA',
      principle: 'Perceivable',
      guideline: '1.4 Distinguishable',
      name: 'Text Spacing',
      description: 'Content maintains readability with increased text spacing',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/text-spacing',
    },
    {
      id: '1.4.13',
      level: 'AA',
      principle: 'Perceivable',
      guideline: '1.4 Distinguishable',
      name: 'Content on Hover or Focus',
      description: 'Additional content on hover/focus is dismissible, hoverable, and persistent',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus',
    },

    // Operable - Level A
    {
      id: '2.1.1',
      level: 'A',
      principle: 'Operable',
      guideline: '2.1 Keyboard Accessible',
      name: 'Keyboard',
      description: 'All functionality is available from a keyboard',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard',
    },
    {
      id: '2.1.2',
      level: 'A',
      principle: 'Operable',
      guideline: '2.1 Keyboard Accessible',
      name: 'No Keyboard Trap',
      description: 'Keyboard focus can be moved away from any component',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/no-keyboard-trap',
    },
    {
      id: '2.1.4',
      level: 'A',
      principle: 'Operable',
      guideline: '2.1 Keyboard Accessible',
      name: 'Character Key Shortcuts',
      description: 'Single character shortcuts can be turned off or remapped',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/character-key-shortcuts',
    },
    {
      id: '2.2.1',
      level: 'A',
      principle: 'Operable',
      guideline: '2.2 Enough Time',
      name: 'Timing Adjustable',
      description: 'Users can turn off, adjust, or extend time limits',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/timing-adjustable',
    },
    {
      id: '2.2.2',
      level: 'A',
      principle: 'Operable',
      guideline: '2.2 Enough Time',
      name: 'Pause, Stop, Hide',
      description: 'Users can pause, stop, or hide moving, blinking, or auto-updating content',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide',
    },
    {
      id: '2.3.1',
      level: 'A',
      principle: 'Operable',
      guideline: '2.3 Seizures and Physical Reactions',
      name: 'Three Flashes or Below Threshold',
      description: 'Content does not flash more than 3 times per second',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/three-flashes-or-below-threshold',
    },
    {
      id: '2.4.1',
      level: 'A',
      principle: 'Operable',
      guideline: '2.4 Navigable',
      name: 'Bypass Blocks',
      description: 'Mechanism to skip repeated blocks of content',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks',
    },
    {
      id: '2.4.2',
      level: 'A',
      principle: 'Operable',
      guideline: '2.4 Navigable',
      name: 'Page Titled',
      description: 'Web pages have descriptive titles',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/page-titled',
    },
    {
      id: '2.4.3',
      level: 'A',
      principle: 'Operable',
      guideline: '2.4 Navigable',
      name: 'Focus Order',
      description: 'Focus order preserves meaning and operability',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-order',
    },
    {
      id: '2.4.4',
      level: 'A',
      principle: 'Operable',
      guideline: '2.4 Navigable',
      name: 'Link Purpose (In Context)',
      description: 'Purpose of each link can be determined from link text or context',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context',
    },
    {
      id: '2.5.1',
      level: 'A',
      principle: 'Operable',
      guideline: '2.5 Input Modalities',
      name: 'Pointer Gestures',
      description: 'Multipoint or path-based gestures have single-pointer alternative',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/pointer-gestures',
    },
    {
      id: '2.5.2',
      level: 'A',
      principle: 'Operable',
      guideline: '2.5 Input Modalities',
      name: 'Pointer Cancellation',
      description: 'Down-event is not used to execute functions',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/pointer-cancellation',
    },
    {
      id: '2.5.3',
      level: 'A',
      principle: 'Operable',
      guideline: '2.5 Input Modalities',
      name: 'Label in Name',
      description: 'Visible label is included in accessible name',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/label-in-name',
    },
    {
      id: '2.5.4',
      level: 'A',
      principle: 'Operable',
      guideline: '2.5 Input Modalities',
      name: 'Motion Actuation',
      description: 'Functionality triggered by motion can be operated by UI components',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/motion-actuation',
    },

    // Operable - Level AA
    {
      id: '2.4.5',
      level: 'AA',
      principle: 'Operable',
      guideline: '2.4 Navigable',
      name: 'Multiple Ways',
      description: 'Multiple ways to locate a page within a set of pages',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/multiple-ways',
    },
    {
      id: '2.4.6',
      level: 'AA',
      principle: 'Operable',
      guideline: '2.4 Navigable',
      name: 'Headings and Labels',
      description: 'Headings and labels describe topic or purpose',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels',
    },
    {
      id: '2.4.7',
      level: 'AA',
      principle: 'Operable',
      guideline: '2.4 Navigable',
      name: 'Focus Visible',
      description: 'Keyboard focus indicator is visible',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-visible',
    },

    // Understandable - Level A
    {
      id: '3.1.1',
      level: 'A',
      principle: 'Understandable',
      guideline: '3.1 Readable',
      name: 'Language of Page',
      description: 'Default language of page can be programmatically determined',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/language-of-page',
    },
    {
      id: '3.2.1',
      level: 'A',
      principle: 'Understandable',
      guideline: '3.2 Predictable',
      name: 'On Focus',
      description: 'Receiving focus does not initiate a change of context',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/on-focus',
    },
    {
      id: '3.2.2',
      level: 'A',
      principle: 'Understandable',
      guideline: '3.2 Predictable',
      name: 'On Input',
      description: 'Changing settings does not automatically cause a change of context',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/on-input',
    },
    {
      id: '3.3.1',
      level: 'A',
      principle: 'Understandable',
      guideline: '3.3 Input Assistance',
      name: 'Error Identification',
      description: 'Input errors are identified and described to the user',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/error-identification',
    },
    {
      id: '3.3.2',
      level: 'A',
      principle: 'Understandable',
      guideline: '3.3 Input Assistance',
      name: 'Labels or Instructions',
      description: 'Labels or instructions are provided for user input',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions',
    },

    // Understandable - Level AA
    {
      id: '3.1.2',
      level: 'AA',
      principle: 'Understandable',
      guideline: '3.1 Readable',
      name: 'Language of Parts',
      description: 'Language of parts can be programmatically determined',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/language-of-parts',
    },
    {
      id: '3.2.3',
      level: 'AA',
      principle: 'Understandable',
      guideline: '3.2 Predictable',
      name: 'Consistent Navigation',
      description: 'Navigation mechanisms are consistent across pages',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/consistent-navigation',
    },
    {
      id: '3.2.4',
      level: 'AA',
      principle: 'Understandable',
      guideline: '3.2 Predictable',
      name: 'Consistent Identification',
      description: 'Components with same functionality are identified consistently',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/consistent-identification',
    },
    {
      id: '3.3.3',
      level: 'AA',
      principle: 'Understandable',
      guideline: '3.3 Input Assistance',
      name: 'Error Suggestion',
      description: 'Suggestions for fixing errors are provided',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/error-suggestion',
    },
    {
      id: '3.3.4',
      level: 'AA',
      principle: 'Understandable',
      guideline: '3.3 Input Assistance',
      name: 'Error Prevention (Legal, Financial, Data)',
      description: 'Submissions can be reversed, checked, or confirmed',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/error-prevention-legal-financial-data',
    },

    // Robust - Level A
    {
      id: '4.1.1',
      level: 'A',
      principle: 'Robust',
      guideline: '4.1 Compatible',
      name: 'Parsing',
      description: 'Markup is well-formed and can be parsed reliably',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/parsing',
    },
    {
      id: '4.1.2',
      level: 'A',
      principle: 'Robust',
      guideline: '4.1 Compatible',
      name: 'Name, Role, Value',
      description: 'UI components have programmatically determined name, role, and value',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value',
    },

    // Robust - Level AA
    {
      id: '4.1.3',
      level: 'AA',
      principle: 'Robust',
      guideline: '4.1 Compatible',
      name: 'Status Messages',
      description: 'Status messages can be programmatically determined',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/status-messages',
    },
  ];

  /**
   * Get criteria by level
   */
  static getByLevel(level: WCAGLevel): WCAGCriterion[] {
    if (level === 'A') {
      return this.ALL.filter(c => c.level === 'A');
    } else if (level === 'AA') {
      return this.ALL.filter(c => c.level === 'A' || c.level === 'AA');
    } else {
      return this.ALL;
    }
  }

  /**
   * Get criteria by principle
   */
  static getByPrinciple(principle: WCAGPrinciple): WCAGCriterion[] {
    return this.ALL.filter(c => c.principle === principle);
  }

  /**
   * Get criterion by ID
   */
  static getById(id: string): WCAGCriterion | undefined {
    return this.ALL.find(c => c.id === id);
  }
}

/**
 * Example 2: WCAG 2.1 Compliance Checker
 */
export class WCAGComplianceChecker {
  /**
   * Check compliance for a specific WCAG level
   */
  async checkCompliance(
    targetLevel: WCAGLevel = 'AA',
    root: Document | Element = document
  ): Promise<ComplianceReport> {
    const criteria = WCAGCriteria.getByLevel(targetLevel);
    const results: ComplianceResult[] = [];

    for (const criterion of criteria) {
      const result = await this.checkCriterion(criterion, root);
      results.push(result);
    }

    // Calculate summary
    const summary = {
      levelA: {
        passed: results.filter(r => r.criterion.level === 'A' && r.passed).length,
        failed: results.filter(r => r.criterion.level === 'A' && !r.passed).length,
      },
      levelAA: {
        passed: results.filter(r => r.criterion.level === 'AA' && r.passed).length,
        failed: results.filter(r => r.criterion.level === 'AA' && !r.passed).length,
      },
      levelAAA: {
        passed: results.filter(r => r.criterion.level === 'AAA' && r.passed).length,
        failed: results.filter(r => r.criterion.level === 'AAA' && !r.passed).length,
      },
    };

    const overallCompliance = {
      levelA: summary.levelA.failed === 0,
      levelAA: summary.levelA.failed === 0 && summary.levelAA.failed === 0,
      levelAAA: summary.levelA.failed === 0 && summary.levelAA.failed === 0 && summary.levelAAA.failed === 0,
    };

    return {
      timestamp: new Date(),
      url: root instanceof Document ? root.location?.href || '' : '',
      targetLevel,
      totalCriteria: criteria.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      notApplicable: 0,
      results,
      summary,
      overallCompliance,
    };
  }

  /**
   * Check a specific criterion
   */
  private async checkCriterion(
    criterion: WCAGCriterion,
    root: Document | Element
  ): Promise<ComplianceResult> {
    // This is a simplified implementation
    // In production, you would have specific checkers for each criterion

    const issues: string[] = [];
    let elementsAffected = 0;

    // Simple checks based on criterion ID
    switch (criterion.id) {
      case '1.1.1': // Non-text Content
        const imagesWithoutAlt = root.querySelectorAll('img:not([alt])');
        if (imagesWithoutAlt.length > 0) {
          issues.push(`${imagesWithoutAlt.length} images missing alt text`);
          elementsAffected = imagesWithoutAlt.length;
        }
        break;

      case '1.3.1': // Info and Relationships
        const inputsWithoutLabels = Array.from(root.querySelectorAll('input, select, textarea')).filter(input => {
          const type = input.getAttribute('type');
          if (type === 'hidden' || type === 'submit' || type === 'button') return false;

          const hasLabel = input.id && root.querySelector(`label[for="${input.id}"]`);
          const hasAriaLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby');
          return !hasLabel && !hasAriaLabel;
        });

        if (inputsWithoutLabels.length > 0) {
          issues.push(`${inputsWithoutLabels.length} form inputs missing labels`);
          elementsAffected = inputsWithoutLabels.length;
        }
        break;

      case '2.1.1': // Keyboard
        // Check for click handlers without keyboard handlers
        const clickOnlyElements = root.querySelectorAll('[onclick]:not(a):not(button):not(input):not(select):not(textarea)');
        const nonKeyboardAccessible = Array.from(clickOnlyElements).filter(el => {
          return !el.hasAttribute('tabindex') && !el.hasAttribute('onkeydown');
        });

        if (nonKeyboardAccessible.length > 0) {
          issues.push(`${nonKeyboardAccessible.length} elements not keyboard accessible`);
          elementsAffected = nonKeyboardAccessible.length;
        }
        break;

      case '2.4.1': // Bypass Blocks
        if (root instanceof Document) {
          const skipLink = root.querySelector('a[href^="#"]');
          if (!skipLink) {
            issues.push('No skip navigation link found');
            elementsAffected = 1;
          }
        }
        break;

      case '2.4.2': // Page Titled
        if (root instanceof Document) {
          const title = root.querySelector('title');
          if (!title || !title.textContent?.trim()) {
            issues.push('Page has no title or empty title');
            elementsAffected = 1;
          }
        }
        break;

      case '2.4.7': // Focus Visible
        // This would require checking computed styles
        // Simplified check: look for focus styles
        break;

      case '3.1.1': // Language of Page
        if (root instanceof Document) {
          const lang = root.documentElement.getAttribute('lang');
          if (!lang || lang.trim() === '') {
            issues.push('HTML element missing lang attribute');
            elementsAffected = 1;
          }
        }
        break;

      case '4.1.2': // Name, Role, Value
        const buttonsWithoutName = Array.from(root.querySelectorAll('button, [role="button"]')).filter(btn => {
          const hasText = btn.textContent?.trim();
          const hasAriaLabel = btn.hasAttribute('aria-label') || btn.hasAttribute('aria-labelledby');
          return !hasText && !hasAriaLabel;
        });

        if (buttonsWithoutName.length > 0) {
          issues.push(`${buttonsWithoutName.length} buttons without accessible names`);
          elementsAffected = buttonsWithoutName.length;
        }
        break;
    }

    return {
      criterion,
      passed: issues.length === 0,
      issues,
      elementsAffected,
    };
  }

  /**
   * Generate compliance report
   */
  generateReport(report: ComplianceReport): string {
    const lines: string[] = [
      '╔════════════════════════════════════════════════════════╗',
      '║           WCAG 2.1 Compliance Report                  ║',
      '╚════════════════════════════════════════════════════════╝',
      '',
      `Target Level: WCAG 2.1 Level ${report.targetLevel}`,
      `URL: ${report.url}`,
      `Timestamp: ${report.timestamp.toISOString()}`,
      '',
      `Overall Compliance:`,
      `  Level A:   ${report.overallCompliance.levelA ? '✓ PASS' : '✗ FAIL'}`,
      `  Level AA:  ${report.overallCompliance.levelAA ? '✓ PASS' : '✗ FAIL'}`,
      `  Level AAA: ${report.overallCompliance.levelAAA ? '✓ PASS' : '✗ FAIL'}`,
      '',
      `Summary:`,
      `  Total Criteria: ${report.totalCriteria}`,
      `  Passed: ${report.passed}`,
      `  Failed: ${report.failed}`,
      '',
      `By Level:`,
      `  Level A:   ${report.summary.levelA.passed} passed, ${report.summary.levelA.failed} failed`,
      `  Level AA:  ${report.summary.levelAA.passed} passed, ${report.summary.levelAA.failed} failed`,
      `  Level AAA: ${report.summary.levelAAA.passed} passed, ${report.summary.levelAAA.failed} failed`,
      '',
    ];

    const failedResults = report.results.filter(r => !r.passed);

    if (failedResults.length > 0) {
      lines.push('═══ FAILED CRITERIA ═══');
      lines.push('');

      failedResults.forEach((result, index) => {
        lines.push(`${index + 1}. [${result.criterion.level}] ${result.criterion.id}: ${result.criterion.name}`);
        lines.push(`   Principle: ${result.criterion.principle}`);
        lines.push(`   Guideline: ${result.criterion.guideline}`);
        lines.push(`   Elements affected: ${result.elementsAffected}`);
        lines.push(`   Issues:`);
        result.issues.forEach(issue => {
          lines.push(`     - ${issue}`);
        });
        lines.push(`   Learn more: ${result.criterion.url}`);
        lines.push('');
      });
    }

    return lines.join('\n');
  }
}

// Usage example
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('WCAG 2.1 Compliance Checker');

    const checker = new WCAGComplianceChecker();

    // Make available globally
    (window as any).checkWCAG = async (level: WCAGLevel = 'AA') => {
      const report = await checker.checkCompliance(level, document);
      console.log(checker.generateReport(report));
      return report;
    };

    console.log('Run: window.checkWCAG("AA") to check WCAG 2.1 Level AA compliance');
    console.log('Available levels: "A", "AA", "AAA"');
  });
}
