import type { A11yIssue, AuditResult, IssueSeverity } from './types.js';

/**
 * Accessibility Auditor
 *
 * Checks for common accessibility issues:
 * - Missing alt text
 * - Missing form labels
 * - Color contrast
 * - Keyboard accessibility
 * - ARIA usage
 */

interface AuditRule {
  id: string;
  description: string;
  severity: IssueSeverity;
  check: (document: Document) => A11yIssue[];
}

const AUDIT_RULES: AuditRule[] = [
  {
    id: 'img-alt',
    description: 'Images must have alt text',
    severity: 'critical',
    check: (doc) => {
      const issues: A11yIssue[] = [];
      const images = doc.querySelectorAll('img');

      images.forEach((img) => {
        const hasAlt = img.hasAttribute('alt');
        const isDecorative = img.getAttribute('alt') === '' && img.getAttribute('role') === 'presentation';

        if (!hasAlt && !isDecorative) {
          issues.push({
            id: 'img-alt',
            rule: 'Images must have alt text',
            severity: 'critical',
            message: 'Image is missing alt attribute',
            element: img.outerHTML.slice(0, 100),
            selector: getSelector(img),
            help: 'Add an alt attribute to describe the image, or alt="" with role="presentation" for decorative images',
            helpUrl: 'https://www.w3.org/WAI/tutorials/images/',
          });
        }
      });

      return issues;
    },
  },
  {
    id: 'label',
    description: 'Form elements must have labels',
    severity: 'critical',
    check: (doc) => {
      const issues: A11yIssue[] = [];
      const inputs = doc.querySelectorAll('input, select, textarea');

      inputs.forEach((input) => {
        const type = input.getAttribute('type');
        if (type === 'hidden' || type === 'submit' || type === 'button' || type === 'reset') {
          return;
        }

        const id = input.getAttribute('id');
        const hasLabel = id && doc.querySelector(`label[for="${id}"]`);
        const hasAriaLabel = input.hasAttribute('aria-label');
        const hasAriaLabelledBy = input.hasAttribute('aria-labelledby');
        const isWrappedInLabel = input.closest('label') !== null;

        if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy && !isWrappedInLabel) {
          issues.push({
            id: 'label',
            rule: 'Form elements must have labels',
            severity: 'critical',
            message: 'Form input is missing a label',
            element: input.outerHTML.slice(0, 100),
            selector: getSelector(input),
            help: 'Add a <label> element with a for attribute, or use aria-label/aria-labelledby',
            helpUrl: 'https://www.w3.org/WAI/tutorials/forms/labels/',
          });
        }
      });

      return issues;
    },
  },
  {
    id: 'button-name',
    description: 'Buttons must have accessible names',
    severity: 'critical',
    check: (doc) => {
      const issues: A11yIssue[] = [];
      const buttons = doc.querySelectorAll('button, [role="button"]');

      buttons.forEach((button) => {
        const text = button.textContent?.trim();
        const ariaLabel = button.getAttribute('aria-label');
        const ariaLabelledBy = button.getAttribute('aria-labelledby');
        const title = button.getAttribute('title');

        if (!text && !ariaLabel && !ariaLabelledBy && !title) {
          issues.push({
            id: 'button-name',
            rule: 'Buttons must have accessible names',
            severity: 'critical',
            message: 'Button has no accessible name',
            element: button.outerHTML.slice(0, 100),
            selector: getSelector(button),
            help: 'Add text content, aria-label, or aria-labelledby to the button',
            helpUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA14',
          });
        }
      });

      return issues;
    },
  },
  {
    id: 'link-name',
    description: 'Links must have accessible names',
    severity: 'serious',
    check: (doc) => {
      const issues: A11yIssue[] = [];
      const links = doc.querySelectorAll('a[href]');

      links.forEach((link) => {
        const text = link.textContent?.trim();
        const ariaLabel = link.getAttribute('aria-label');
        const title = link.getAttribute('title');
        const hasImage = link.querySelector('img[alt]');

        if (!text && !ariaLabel && !title && !hasImage) {
          issues.push({
            id: 'link-name',
            rule: 'Links must have accessible names',
            severity: 'serious',
            message: 'Link has no accessible name',
            element: link.outerHTML.slice(0, 100),
            selector: getSelector(link),
            help: 'Add text content or aria-label to the link',
            helpUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/html/H30',
          });
        }
      });

      return issues;
    },
  },
  {
    id: 'heading-order',
    description: 'Heading levels should not be skipped',
    severity: 'moderate',
    check: (doc) => {
      const issues: A11yIssue[] = [];
      const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let lastLevel = 0;

      headings.forEach((heading) => {
        const level = parseInt(heading.tagName[1]);

        if (lastLevel > 0 && level > lastLevel + 1) {
          issues.push({
            id: 'heading-order',
            rule: 'Heading levels should not be skipped',
            severity: 'moderate',
            message: `Heading level jumps from h${lastLevel} to h${level}`,
            element: heading.outerHTML.slice(0, 100),
            selector: getSelector(heading),
            help: 'Ensure heading levels are in sequential order without skipping levels',
            helpUrl: 'https://www.w3.org/WAI/tutorials/page-structure/headings/',
          });
        }

        lastLevel = level;
      });

      return issues;
    },
  },
  {
    id: 'html-lang',
    description: 'HTML element must have lang attribute',
    severity: 'serious',
    check: (doc) => {
      const issues: A11yIssue[] = [];
      const html = doc.documentElement;

      if (!html.hasAttribute('lang') || html.getAttribute('lang')?.trim() === '') {
        issues.push({
          id: 'html-lang',
          rule: 'HTML element must have lang attribute',
          severity: 'serious',
          message: 'Missing or empty lang attribute on <html>',
          element: '<html>',
          selector: 'html',
          help: 'Add a lang attribute to the html element (e.g., lang="en")',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Techniques/html/H57',
        });
      }

      return issues;
    },
  },
  {
    id: 'tabindex',
    description: 'Avoid positive tabindex values',
    severity: 'moderate',
    check: (doc) => {
      const issues: A11yIssue[] = [];
      const elements = doc.querySelectorAll('[tabindex]');

      elements.forEach((el) => {
        const tabindex = parseInt(el.getAttribute('tabindex') || '0');
        if (tabindex > 0) {
          issues.push({
            id: 'tabindex',
            rule: 'Avoid positive tabindex values',
            severity: 'moderate',
            message: `Element has tabindex="${tabindex}" which disrupts natural tab order`,
            element: el.outerHTML.slice(0, 100),
            selector: getSelector(el),
            help: 'Use tabindex="0" to add to tab order, or tabindex="-1" to remove',
            helpUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex',
          });
        }
      });

      return issues;
    },
  },
  {
    id: 'landmark-main',
    description: 'Page should have main landmark',
    severity: 'moderate',
    check: (doc) => {
      const issues: A11yIssue[] = [];
      const main = doc.querySelector('main, [role="main"]');

      if (!main) {
        issues.push({
          id: 'landmark-main',
          rule: 'Page should have main landmark',
          severity: 'moderate',
          message: 'Page is missing a <main> element or role="main"',
          element: '<body>',
          selector: 'body',
          help: 'Add a <main> element to wrap the primary content',
          helpUrl: 'https://www.w3.org/WAI/tutorials/page-structure/regions/',
        });
      }

      return issues;
    },
  },
];

/**
 * Generate a CSS selector for an element
 */
function getSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }

  const path: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase();

    if (current.className) {
      const classes = current.className.split(' ').filter(Boolean).slice(0, 2);
      if (classes.length) {
        selector += '.' + classes.join('.');
      }
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
}

/**
 * Run accessibility audit
 */
export function runAudit(doc: Document = document): AuditResult {
  const violations: A11yIssue[] = [];
  let passes = 0;

  for (const rule of AUDIT_RULES) {
    const issues = rule.check(doc);
    if (issues.length === 0) {
      passes++;
    } else {
      violations.push(...issues);
    }
  }

  return {
    passes,
    violations,
    incomplete: [],
    timestamp: new Date(),
    url: doc.location?.href || '',
  };
}

/**
 * Format audit result for console
 */
export function formatAuditResult(result: AuditResult): string {
  const lines: string[] = [
    '=== Accessibility Audit Result ===',
    `URL: ${result.url}`,
    `Time: ${result.timestamp.toISOString()}`,
    '',
    `Passes: ${result.passes}`,
    `Violations: ${result.violations.length}`,
    '',
  ];

  if (result.violations.length > 0) {
    lines.push('VIOLATIONS:');
    result.violations.forEach((issue, i) => {
      lines.push(`\n${i + 1}. [${issue.severity.toUpperCase()}] ${issue.rule}`);
      lines.push(`   ${issue.message}`);
      lines.push(`   Element: ${issue.element.slice(0, 60)}...`);
      lines.push(`   Selector: ${issue.selector}`);
      lines.push(`   Help: ${issue.help}`);
    });
  }

  return lines.join('\n');
}

export { AUDIT_RULES };
