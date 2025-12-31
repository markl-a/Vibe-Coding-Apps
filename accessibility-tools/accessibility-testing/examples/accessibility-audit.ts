/**
 * Accessibility Audit Examples
 *
 * Demonstrates comprehensive accessibility auditing according to WCAG 2.1:
 * - Automated testing for common accessibility issues
 * - DOM inspection and analysis
 * - Accessibility tree validation
 * - Integration with axe-core principles
 *
 * WCAG 2.1 Success Criteria covered:
 * - 1.1.1: Non-text Content (Level A)
 * - 1.3.1: Info and Relationships (Level A)
 * - 2.1.1: Keyboard (Level A)
 * - 2.4.1: Bypass Blocks (Level A)
 * - 3.1.1: Language of Page (Level A)
 * - 4.1.2: Name, Role, Value (Level A)
 *
 * @see https://www.w3.org/WAI/WCAG21/quickref/
 */

export type SeverityLevel = 'critical' | 'serious' | 'moderate' | 'minor';

export interface AuditIssue {
  id: string;
  rule: string;
  severity: SeverityLevel;
  message: string;
  element: Element;
  selector: string;
  wcagCriteria: string[];
  help: string;
  helpUrl?: string;
}

export interface AuditResult {
  url: string;
  timestamp: Date;
  totalElements: number;
  violations: AuditIssue[];
  warnings: AuditIssue[];
  passes: number;
  incomplete: number;
  score: number;
}

/**
 * Example 1: Comprehensive Accessibility Auditor
 */
export class AccessibilityAuditor {
  private rules: AuditRule[] = [];

  constructor() {
    this.registerDefaultRules();
  }

  /**
   * Run full accessibility audit
   */
  async audit(root: Document | Element = document): Promise<AuditResult> {
    const startTime = Date.now();
    const violations: AuditIssue[] = [];
    const warnings: AuditIssue[] = [];
    let passes = 0;
    let incomplete = 0;

    // Run all rules
    for (const rule of this.rules) {
      try {
        const issues = await rule.check(root);

        if (issues.length === 0) {
          passes++;
        } else {
          issues.forEach(issue => {
            if (issue.severity === 'critical' || issue.severity === 'serious') {
              violations.push(issue);
            } else {
              warnings.push(issue);
            }
          });
        }
      } catch (error) {
        incomplete++;
        console.error(`Rule ${rule.id} failed:`, error);
      }
    }

    const totalElements = root.querySelectorAll('*').length;
    const totalIssues = violations.length + warnings.length;
    const score = Math.max(0, 100 - (violations.length * 5 + warnings.length * 2));

    return {
      url: root instanceof Document ? root.location?.href || '' : '',
      timestamp: new Date(),
      totalElements,
      violations,
      warnings,
      passes,
      incomplete,
      score,
    };
  }

  /**
   * Register a custom audit rule
   */
  registerRule(rule: AuditRule): void {
    this.rules.push(rule);
  }

  /**
   * Register default WCAG 2.1 rules
   */
  private registerDefaultRules(): void {
    this.rules = [
      new ImageAltTextRule(),
      new FormLabelRule(),
      new ButtonNameRule(),
      new LinkNameRule(),
      new HeadingOrderRule(),
      new HtmlLangRule(),
      new LandmarkRule(),
      new TabIndexRule(),
      new AriaValidRule(),
      new ColorContrastRule(),
      new SkipLinkRule(),
      new FocusableElementsRule(),
    ];
  }

  /**
   * Generate detailed report
   */
  generateReport(result: AuditResult): string {
    const lines: string[] = [
      '╔════════════════════════════════════════════════════════╗',
      '║        Accessibility Audit Report - WCAG 2.1          ║',
      '╚════════════════════════════════════════════════════════╝',
      '',
      `URL: ${result.url}`,
      `Timestamp: ${result.timestamp.toISOString()}`,
      `Total Elements: ${result.totalElements}`,
      '',
      `Score: ${result.score}/100`,
      `✓ Passes: ${result.passes}`,
      `⚠ Warnings: ${result.warnings.length}`,
      `✗ Violations: ${result.violations.length}`,
      `? Incomplete: ${result.incomplete}`,
      '',
    ];

    if (result.violations.length > 0) {
      lines.push('═══ VIOLATIONS (Must Fix) ═══');
      result.violations.forEach((issue, index) => {
        lines.push('');
        lines.push(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.rule}`);
        lines.push(`   WCAG: ${issue.wcagCriteria.join(', ')}`);
        lines.push(`   Message: ${issue.message}`);
        lines.push(`   Element: ${issue.selector}`);
        lines.push(`   Help: ${issue.help}`);
        if (issue.helpUrl) {
          lines.push(`   Learn more: ${issue.helpUrl}`);
        }
      });
      lines.push('');
    }

    if (result.warnings.length > 0) {
      lines.push('═══ WARNINGS (Should Fix) ═══');
      result.warnings.forEach((issue, index) => {
        lines.push('');
        lines.push(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.rule}`);
        lines.push(`   Message: ${issue.message}`);
        lines.push(`   Element: ${issue.selector}`);
      });
      lines.push('');
    }

    return lines.join('\n');
  }
}

/**
 * Base class for audit rules
 */
export abstract class AuditRule {
  abstract id: string;
  abstract description: string;
  abstract severity: SeverityLevel;
  abstract wcagCriteria: string[];
  abstract check(root: Document | Element): Promise<AuditIssue[]> | AuditIssue[];
}

/**
 * Example 2: Image Alt Text Rule
 * WCAG 1.1.1: Non-text Content (Level A)
 */
export class ImageAltTextRule extends AuditRule {
  id = 'image-alt';
  description = 'Images must have alternative text';
  severity: SeverityLevel = 'critical';
  wcagCriteria = ['1.1.1'];

  check(root: Document | Element): AuditIssue[] {
    const issues: AuditIssue[] = [];
    const images = root.querySelectorAll('img');

    images.forEach(img => {
      const hasAlt = img.hasAttribute('alt');
      const isDecorative = img.getAttribute('alt') === '' && img.getAttribute('role') === 'presentation';
      const hasAriaLabel = img.hasAttribute('aria-label') || img.hasAttribute('aria-labelledby');

      if (!hasAlt && !hasAriaLabel && !isDecorative) {
        issues.push({
          id: this.id,
          rule: this.description,
          severity: this.severity,
          message: 'Image is missing alt attribute',
          element: img,
          selector: this.getSelector(img),
          wcagCriteria: this.wcagCriteria,
          help: 'Add an alt attribute to describe the image content, or alt="" with role="presentation" for decorative images',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content',
        });
      }
    });

    return issues;
  }

  private getSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    const classes = Array.from(element.classList).slice(0, 2).join('.');
    return `${element.tagName.toLowerCase()}${classes ? '.' + classes : ''}`;
  }
}

/**
 * Example 3: Form Label Rule
 * WCAG 1.3.1: Info and Relationships (Level A)
 */
export class FormLabelRule extends AuditRule {
  id = 'form-label';
  description = 'Form inputs must have labels';
  severity: SeverityLevel = 'critical';
  wcagCriteria = ['1.3.1', '4.1.2'];

  check(root: Document | Element): AuditIssue[] {
    const issues: AuditIssue[] = [];
    const inputs = root.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
      const type = input.getAttribute('type');
      if (type === 'hidden' || type === 'submit' || type === 'button' || type === 'reset') {
        return;
      }

      const hasLabel = this.hasAssociatedLabel(input);
      const hasAriaLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby');

      if (!hasLabel && !hasAriaLabel) {
        issues.push({
          id: this.id,
          rule: this.description,
          severity: this.severity,
          message: 'Form input is missing a label',
          element: input,
          selector: this.getSelector(input),
          wcagCriteria: this.wcagCriteria,
          help: 'Add a <label> element with a for attribute matching the input id, or use aria-label/aria-labelledby',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships',
        });
      }
    });

    return issues;
  }

  private hasAssociatedLabel(input: Element): boolean {
    const id = input.getAttribute('id');
    if (id && document.querySelector(`label[for="${id}"]`)) {
      return true;
    }

    return input.closest('label') !== null;
  }

  private getSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    return element.tagName.toLowerCase() + (element.getAttribute('name') ? `[name="${element.getAttribute('name')}"]` : '');
  }
}

/**
 * Example 4: Button Name Rule
 * WCAG 4.1.2: Name, Role, Value (Level A)
 */
export class ButtonNameRule extends AuditRule {
  id = 'button-name';
  description = 'Buttons must have accessible names';
  severity: SeverityLevel = 'critical';
  wcagCriteria = ['4.1.2'];

  check(root: Document | Element): AuditIssue[] {
    const issues: AuditIssue[] = [];
    const buttons = root.querySelectorAll('button, [role="button"]');

    buttons.forEach(button => {
      const hasText = button.textContent?.trim();
      const hasAriaLabel = button.hasAttribute('aria-label');
      const hasAriaLabelledBy = button.hasAttribute('aria-labelledby');
      const hasTitle = button.hasAttribute('title');

      if (!hasText && !hasAriaLabel && !hasAriaLabelledBy && !hasTitle) {
        issues.push({
          id: this.id,
          rule: this.description,
          severity: this.severity,
          message: 'Button has no accessible name',
          element: button,
          selector: this.getSelector(button),
          wcagCriteria: this.wcagCriteria,
          help: 'Add text content, aria-label, or aria-labelledby to the button',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value',
        });
      }
    });

    return issues;
  }

  private getSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    const classes = Array.from(element.classList).slice(0, 2).join('.');
    return `${element.tagName.toLowerCase()}${classes ? '.' + classes : ''}`;
  }
}

/**
 * Example 5: Link Name Rule
 */
export class LinkNameRule extends AuditRule {
  id = 'link-name';
  description = 'Links must have accessible names';
  severity: SeverityLevel = 'serious';
  wcagCriteria = ['4.1.2', '2.4.4'];

  check(root: Document | Element): AuditIssue[] {
    const issues: AuditIssue[] = [];
    const links = root.querySelectorAll('a[href]');

    links.forEach(link => {
      const hasText = link.textContent?.trim();
      const hasAriaLabel = link.hasAttribute('aria-label');
      const hasTitle = link.hasAttribute('title');
      const hasImageWithAlt = link.querySelector('img[alt]');

      if (!hasText && !hasAriaLabel && !hasTitle && !hasImageWithAlt) {
        issues.push({
          id: this.id,
          rule: this.description,
          severity: this.severity,
          message: 'Link has no accessible name',
          element: link,
          selector: this.getSelector(link),
          wcagCriteria: this.wcagCriteria,
          help: 'Add text content, aria-label, or an image with alt text',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context',
        });
      }
    });

    return issues;
  }

  private getSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    return `a[href="${element.getAttribute('href')}"]`;
  }
}

/**
 * Example 6: Heading Order Rule
 */
export class HeadingOrderRule extends AuditRule {
  id = 'heading-order';
  description = 'Heading levels should not be skipped';
  severity: SeverityLevel = 'moderate';
  wcagCriteria = ['1.3.1', '2.4.6'];

  check(root: Document | Element): AuditIssue[] {
    const issues: AuditIssue[] = [];
    const headings = root.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;

    headings.forEach(heading => {
      const level = parseInt(heading.tagName[1]);

      if (lastLevel > 0 && level > lastLevel + 1) {
        issues.push({
          id: this.id,
          rule: this.description,
          severity: this.severity,
          message: `Heading level jumps from h${lastLevel} to h${level}`,
          element: heading,
          selector: this.getSelector(heading),
          wcagCriteria: this.wcagCriteria,
          help: 'Ensure heading levels increase by one at a time',
          helpUrl: 'https://www.w3.org/WAI/tutorials/page-structure/headings/',
        });
      }

      lastLevel = level;
    });

    return issues;
  }

  private getSelector(element: Element): string {
    return element.tagName.toLowerCase() + (element.id ? `#${element.id}` : '');
  }
}

/**
 * Example 7: HTML Lang Rule
 */
export class HtmlLangRule extends AuditRule {
  id = 'html-lang';
  description = 'HTML element must have lang attribute';
  severity: SeverityLevel = 'serious';
  wcagCriteria = ['3.1.1'];

  check(root: Document | Element): AuditIssue[] {
    const issues: AuditIssue[] = [];

    if (root instanceof Document) {
      const html = root.documentElement;
      const lang = html.getAttribute('lang');

      if (!lang || lang.trim() === '') {
        issues.push({
          id: this.id,
          rule: this.description,
          severity: this.severity,
          message: 'Missing or empty lang attribute on <html>',
          element: html,
          selector: 'html',
          wcagCriteria: this.wcagCriteria,
          help: 'Add a lang attribute to the html element (e.g., lang="en")',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/language-of-page',
        });
      }
    }

    return issues;
  }
}

/**
 * Example 8: Landmark Rule
 */
export class LandmarkRule extends AuditRule {
  id = 'landmark-regions';
  description = 'Page should have landmark regions';
  severity: SeverityLevel = 'moderate';
  wcagCriteria = ['2.4.1'];

  check(root: Document | Element): AuditIssue[] {
    const issues: AuditIssue[] = [];

    const hasMain = root.querySelector('main, [role="main"]');
    const hasNav = root.querySelector('nav, [role="navigation"]');

    if (!hasMain) {
      issues.push({
        id: this.id,
        rule: 'Page should have a main landmark',
        severity: this.severity,
        message: 'Page is missing a <main> element or role="main"',
        element: root instanceof Document ? root.body : root,
        selector: 'body',
        wcagCriteria: this.wcagCriteria,
        help: 'Add a <main> element to wrap the primary content',
        helpUrl: 'https://www.w3.org/WAI/tutorials/page-structure/regions/',
      });
    }

    return issues;
  }
}

/**
 * Example 9: TabIndex Rule
 */
export class TabIndexRule extends AuditRule {
  id = 'tabindex';
  description = 'Avoid positive tabindex values';
  severity: SeverityLevel = 'moderate';
  wcagCriteria = ['2.4.3'];

  check(root: Document | Element): AuditIssue[] {
    const issues: AuditIssue[] = [];
    const elements = root.querySelectorAll('[tabindex]');

    elements.forEach(element => {
      const tabindex = parseInt(element.getAttribute('tabindex') || '0');

      if (tabindex > 0) {
        issues.push({
          id: this.id,
          rule: this.description,
          severity: this.severity,
          message: `Element has tabindex="${tabindex}" which disrupts natural tab order`,
          element: element,
          selector: this.getSelector(element),
          wcagCriteria: this.wcagCriteria,
          help: 'Use tabindex="0" to add to tab order, or tabindex="-1" to remove from tab order',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-order',
        });
      }
    });

    return issues;
  }

  private getSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    return element.tagName.toLowerCase();
  }
}

/**
 * Example 10: ARIA Valid Rule
 */
export class AriaValidRule extends AuditRule {
  id = 'aria-valid';
  description = 'ARIA attributes must be valid';
  severity: SeverityLevel = 'serious';
  wcagCriteria = ['4.1.2'];

  check(root: Document | Element): AuditIssue[] {
    const issues: AuditIssue[] = [];
    const elements = root.querySelectorAll('[role], [aria-label], [aria-labelledby], [aria-describedby]');

    elements.forEach(element => {
      // Check for invalid ARIA attributes
      const attributes = Array.from(element.attributes);

      attributes.forEach(attr => {
        if (attr.name.startsWith('aria-')) {
          if (attr.value.trim() === '') {
            issues.push({
              id: this.id,
              rule: 'ARIA attribute has empty value',
              severity: this.severity,
              message: `${attr.name} attribute is empty`,
              element: element,
              selector: this.getSelector(element),
              wcagCriteria: this.wcagCriteria,
              help: `Provide a value for ${attr.name} or remove the attribute`,
            });
          }
        }
      });
    });

    return issues;
  }

  private getSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    return element.tagName.toLowerCase();
  }
}

/**
 * Example 11: Color Contrast Rule (simplified)
 */
export class ColorContrastRule extends AuditRule {
  id = 'color-contrast';
  description = 'Text must have sufficient color contrast';
  severity: SeverityLevel = 'serious';
  wcagCriteria = ['1.4.3'];

  check(root: Document | Element): AuditIssue[] {
    // Note: This is a simplified version
    // Full implementation would require actual contrast calculation
    const issues: AuditIssue[] = [];

    // This rule would need to calculate actual contrast ratios
    // For demonstration, we're returning an empty array
    // In a real implementation, this would check computed styles

    return issues;
  }
}

/**
 * Example 12: Skip Link Rule
 */
export class SkipLinkRule extends AuditRule {
  id = 'skip-link';
  description = 'Page should have skip navigation link';
  severity: SeverityLevel = 'moderate';
  wcagCriteria = ['2.4.1'];

  check(root: Document | Element): AuditIssue[] {
    const issues: AuditIssue[] = [];

    if (root instanceof Document) {
      const skipLink = root.querySelector('a[href^="#"][href*="main"], a[href^="#"][href*="content"]');

      if (!skipLink) {
        issues.push({
          id: this.id,
          rule: this.description,
          severity: this.severity,
          message: 'Page is missing a skip navigation link',
          element: root.body,
          selector: 'body',
          wcagCriteria: this.wcagCriteria,
          help: 'Add a skip link as the first focusable element to allow keyboard users to skip to main content',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks',
        });
      }
    }

    return issues;
  }
}

/**
 * Example 13: Focusable Elements Rule
 */
export class FocusableElementsRule extends AuditRule {
  id = 'focusable-elements';
  description = 'Interactive elements must be keyboard accessible';
  severity: SeverityLevel = 'critical';
  wcagCriteria = ['2.1.1'];

  check(root: Document | Element): AuditIssue[] {
    const issues: AuditIssue[] = [];
    const interactiveElements = root.querySelectorAll('[onclick], [onkeydown], [onkeyup]');

    interactiveElements.forEach(element => {
      const isFocusable = this.isFocusable(element);

      if (!isFocusable) {
        issues.push({
          id: this.id,
          rule: this.description,
          severity: this.severity,
          message: 'Interactive element is not keyboard accessible',
          element: element,
          selector: this.getSelector(element),
          wcagCriteria: this.wcagCriteria,
          help: 'Use a button, link, or add tabindex="0" and keyboard event handlers',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard',
        });
      }
    });

    return issues;
  }

  private isFocusable(element: Element): boolean {
    const focusableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
    if (focusableTags.includes(element.tagName)) {
      return true;
    }

    const tabindex = element.getAttribute('tabindex');
    return tabindex !== null && parseInt(tabindex) >= 0;
  }

  private getSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    return element.tagName.toLowerCase();
  }
}

// Usage example
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('Accessibility Auditor - WCAG 2.1');

    const auditor = new AccessibilityAuditor();
    const result = await auditor.audit(document);

    console.log(auditor.generateReport(result));

    // Make available globally for testing
    (window as any).runA11yAudit = async () => {
      const result = await auditor.audit(document);
      console.log(auditor.generateReport(result));
      return result;
    };

    console.log('Run: window.runA11yAudit() to audit the page');
  });
}
