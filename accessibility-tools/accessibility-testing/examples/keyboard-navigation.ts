/**
 * Keyboard Navigation Testing Examples
 *
 * Demonstrates keyboard navigation testing according to WCAG 2.1:
 * - Success Criterion 2.1.1: Keyboard (Level A)
 * - Success Criterion 2.1.2: No Keyboard Trap (Level A)
 * - Success Criterion 2.4.3: Focus Order (Level A)
 * - Success Criterion 2.4.7: Focus Visible (Level AA)
 * - Success Criterion 2.1.4: Character Key Shortcuts (Level A)
 *
 * @see https://www.w3.org/WAI/WCAG21/Understanding/keyboard
 * @see https://www.w3.org/WAI/WCAG21/Understanding/no-keyboard-trap
 */

export interface KeyboardTestResult {
  element: Element;
  selector: string;
  isFocusable: boolean;
  hasVisibleFocus: boolean;
  canEscape: boolean;
  tabIndex: number | null;
  role: string | null;
  issues: string[];
}

export interface NavigationTestResult {
  totalElements: number;
  focusableElements: number;
  keyboardAccessible: number;
  keyboardTraps: number;
  missingFocusIndicators: number;
  invalidTabIndex: number;
  issues: KeyboardTestResult[];
  passed: boolean;
}

/**
 * Example 1: Keyboard Navigation Tester
 */
export class KeyboardNavigationTester {
  private focusableSelectors = [
    'a[href]',
    'area[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ];

  /**
   * Test keyboard navigation for entire page
   */
  testPage(root: Document | Element = document): NavigationTestResult {
    const allElements = root.querySelectorAll('*');
    const focusableElements = this.getFocusableElements(root);
    const issues: KeyboardTestResult[] = [];

    let keyboardAccessible = 0;
    let keyboardTraps = 0;
    let missingFocusIndicators = 0;
    let invalidTabIndex = 0;

    // Test each focusable element
    focusableElements.forEach(element => {
      const result = this.testElement(element);

      if (result.issues.length > 0) {
        issues.push(result);
      }

      if (result.isFocusable) {
        keyboardAccessible++;
      }

      if (!result.canEscape) {
        keyboardTraps++;
      }

      if (!result.hasVisibleFocus) {
        missingFocusIndicators++;
      }

      if (result.tabIndex !== null && result.tabIndex > 0) {
        invalidTabIndex++;
      }
    });

    // Test for interactive elements that are NOT keyboard accessible
    const interactiveElements = root.querySelectorAll('[onclick], [onmousedown], [onmouseup]');
    interactiveElements.forEach(element => {
      if (!this.isFocusable(element)) {
        issues.push({
          element,
          selector: this.getSelector(element),
          isFocusable: false,
          hasVisibleFocus: false,
          canEscape: true,
          tabIndex: null,
          role: element.getAttribute('role'),
          issues: ['Interactive element is not keyboard accessible'],
        });
      }
    });

    return {
      totalElements: allElements.length,
      focusableElements: focusableElements.length,
      keyboardAccessible,
      keyboardTraps,
      missingFocusIndicators,
      invalidTabIndex,
      issues,
      passed: issues.length === 0,
    };
  }

  /**
   * Test a specific element for keyboard accessibility
   */
  testElement(element: Element): KeyboardTestResult {
    const issues: string[] = [];

    const isFocusable = this.isFocusable(element);
    const hasVisibleFocus = this.hasVisibleFocusIndicator(element);
    const canEscape = this.canEscapeFocus(element);
    const tabIndex = this.getTabIndex(element);
    const role = element.getAttribute('role');

    // Check if element is focusable
    if (!isFocusable && this.shouldBeFocusable(element)) {
      issues.push('Element should be focusable but is not');
    }

    // Check for visible focus indicator
    if (isFocusable && !hasVisibleFocus) {
      issues.push('Element lacks visible focus indicator');
    }

    // Check for keyboard trap
    if (isFocusable && !canEscape) {
      issues.push('Element may create a keyboard trap');
    }

    // Check for positive tabindex
    if (tabIndex !== null && tabIndex > 0) {
      issues.push(`Element uses positive tabindex (${tabIndex}), which disrupts natural tab order`);
    }

    // Check for ARIA requirements
    if (role && !this.hasRequiredAriaAttributes(element, role)) {
      issues.push(`Element with role="${role}" is missing required ARIA attributes`);
    }

    return {
      element,
      selector: this.getSelector(element),
      isFocusable,
      hasVisibleFocus,
      canEscape,
      tabIndex,
      role,
      issues,
    };
  }

  /**
   * Get all focusable elements
   */
  getFocusableElements(root: Document | Element = document): Element[] {
    const elements = root.querySelectorAll(this.focusableSelectors.join(', '));
    return Array.from(elements).filter(el => {
      return el.offsetParent !== null && !el.hasAttribute('aria-hidden');
    });
  }

  /**
   * Check if element is focusable
   */
  private isFocusable(element: Element): boolean {
    // Check if element is disabled
    if (element.hasAttribute('disabled')) {
      return false;
    }

    // Check tabindex
    const tabindex = element.getAttribute('tabindex');
    if (tabindex !== null) {
      return parseInt(tabindex) >= 0;
    }

    // Check naturally focusable elements
    const focusableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
    if (focusableTags.includes(element.tagName)) {
      // Links must have href
      if (element.tagName === 'A') {
        return element.hasAttribute('href');
      }
      return true;
    }

    // Check contenteditable
    if (element.getAttribute('contenteditable') === 'true') {
      return true;
    }

    return false;
  }

  /**
   * Check if element should be focusable based on its interactivity
   */
  private shouldBeFocusable(element: Element): boolean {
    // Elements with click handlers should be focusable
    if (element.hasAttribute('onclick') ||
        element.hasAttribute('onmousedown') ||
        element.hasAttribute('onmouseup')) {
      return true;
    }

    // Elements with interactive ARIA roles should be focusable
    const interactiveRoles = [
      'button', 'link', 'checkbox', 'radio', 'tab', 'menuitem', 'menuitemcheckbox',
      'menuitemradio', 'option', 'switch', 'textbox', 'searchbox', 'combobox',
      'slider', 'spinbutton',
    ];

    const role = element.getAttribute('role');
    if (role && interactiveRoles.includes(role)) {
      return true;
    }

    return false;
  }

  /**
   * Check if element has visible focus indicator
   */
  private hasVisibleFocusIndicator(element: Element): boolean {
    // This is a simplified check
    // In a real implementation, you would:
    // 1. Focus the element
    // 2. Get computed styles
    // 3. Check outline, border, box-shadow, background changes

    const htmlElement = element as HTMLElement;

    // Check for explicit outline none
    const style = window.getComputedStyle(htmlElement);
    if (style.outline === 'none' || style.outline === '0px none') {
      // Check for alternative focus indicators
      return style.boxShadow !== 'none' ||
             style.border !== '' ||
             style.backgroundColor !== '';
    }

    return true;
  }

  /**
   * Check if focus can escape from element
   */
  private canEscapeFocus(element: Element): boolean {
    // Check if element or parent has role="dialog" without proper focus management
    const dialog = element.closest('[role="dialog"]');
    if (dialog && !dialog.hasAttribute('aria-modal')) {
      // Dialog without aria-modal may trap focus
      return false;
    }

    // In a real implementation, you would simulate Tab key press
    // and verify focus can move to next element

    return true;
  }

  /**
   * Get tabindex value
   */
  private getTabIndex(element: Element): number | null {
    const tabindex = element.getAttribute('tabindex');
    return tabindex !== null ? parseInt(tabindex) : null;
  }

  /**
   * Check if element has required ARIA attributes for its role
   */
  private hasRequiredAriaAttributes(element: Element, role: string): boolean {
    const requiredAttributes: Record<string, string[]> = {
      checkbox: ['aria-checked'],
      radio: ['aria-checked'],
      combobox: ['aria-expanded', 'aria-controls'],
      listbox: [],
      option: ['aria-selected'],
      slider: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
      spinbutton: ['aria-valuenow'],
      tab: ['aria-controls'],
      tabpanel: ['aria-labelledby'],
    };

    const required = requiredAttributes[role] || [];

    return required.every(attr => element.hasAttribute(attr));
  }

  /**
   * Get CSS selector for element
   */
  private getSelector(element: Element): string {
    if (element.id) {
      return `#${element.id}`;
    }

    const classes = Array.from(element.classList).slice(0, 2);
    const classStr = classes.length > 0 ? '.' + classes.join('.') : '';

    return `${element.tagName.toLowerCase()}${classStr}`;
  }

  /**
   * Generate test report
   */
  generateReport(result: NavigationTestResult): string {
    const lines: string[] = [
      '╔════════════════════════════════════════════════════════╗',
      '║         Keyboard Navigation Test Report               ║',
      '╚════════════════════════════════════════════════════════╝',
      '',
      `Total Elements: ${result.totalElements}`,
      `Focusable Elements: ${result.focusableElements}`,
      `Keyboard Accessible: ${result.keyboardAccessible}`,
      '',
      `Issues Found:`,
      `  Keyboard Traps: ${result.keyboardTraps}`,
      `  Missing Focus Indicators: ${result.missingFocusIndicators}`,
      `  Invalid TabIndex: ${result.invalidTabIndex}`,
      `  Total Issues: ${result.issues.length}`,
      '',
      `Overall: ${result.passed ? '✓ PASS' : '✗ FAIL'}`,
      '',
    ];

    if (result.issues.length > 0) {
      lines.push('═══ ISSUES ═══');
      lines.push('');

      result.issues.forEach((issue, index) => {
        lines.push(`${index + 1}. ${issue.selector}`);
        lines.push(`   Focusable: ${issue.isFocusable ? 'Yes' : 'No'}`);
        lines.push(`   Visible Focus: ${issue.hasVisibleFocus ? 'Yes' : 'No'}`);
        if (issue.tabIndex !== null) {
          lines.push(`   TabIndex: ${issue.tabIndex}`);
        }
        if (issue.role) {
          lines.push(`   Role: ${issue.role}`);
        }
        lines.push(`   Problems:`);
        issue.issues.forEach(problem => {
          lines.push(`     - ${problem}`);
        });
        lines.push('');
      });
    }

    return lines.join('\n');
  }
}

/**
 * Example 2: Interactive Keyboard Navigation Simulator
 */
export class KeyboardNavigationSimulator {
  private currentFocusIndex: number = -1;
  private focusableElements: Element[] = [];
  private focusHistory: Element[] = [];

  constructor(private root: Document | Element = document) {
    this.updateFocusableElements();
  }

  /**
   * Update list of focusable elements
   */
  private updateFocusableElements(): void {
    const tester = new KeyboardNavigationTester();
    this.focusableElements = tester.getFocusableElements(this.root);
  }

  /**
   * Simulate Tab key press
   */
  simulateTab(shiftKey: boolean = false): Element | null {
    this.updateFocusableElements();

    if (this.focusableElements.length === 0) {
      return null;
    }

    if (shiftKey) {
      // Shift + Tab: move backward
      this.currentFocusIndex--;
      if (this.currentFocusIndex < 0) {
        this.currentFocusIndex = this.focusableElements.length - 1;
      }
    } else {
      // Tab: move forward
      this.currentFocusIndex++;
      if (this.currentFocusIndex >= this.focusableElements.length) {
        this.currentFocusIndex = 0;
      }
    }

    const element = this.focusableElements[this.currentFocusIndex];
    this.focusHistory.push(element);

    (element as HTMLElement).focus();

    return element;
  }

  /**
   * Simulate Arrow key navigation (for specific widgets)
   */
  simulateArrowKey(direction: 'up' | 'down' | 'left' | 'right'): Element | null {
    const currentElement = this.focusableElements[this.currentFocusIndex];

    if (!currentElement) {
      return null;
    }

    const role = currentElement.getAttribute('role');

    // Handle specific ARIA widgets
    if (role === 'tab' || role === 'menuitem' || role === 'option') {
      const siblings = this.getSiblings(currentElement);
      const currentIndex = siblings.indexOf(currentElement);

      let newIndex = currentIndex;

      if (direction === 'left' || direction === 'up') {
        newIndex = (currentIndex - 1 + siblings.length) % siblings.length;
      } else if (direction === 'right' || direction === 'down') {
        newIndex = (currentIndex + 1) % siblings.length;
      }

      const newElement = siblings[newIndex] as HTMLElement;
      newElement.focus();
      this.focusHistory.push(newElement);

      return newElement;
    }

    return null;
  }

  /**
   * Get siblings with same role
   */
  private getSiblings(element: Element): Element[] {
    const role = element.getAttribute('role');
    if (!role) return [];

    const parent = element.parentElement;
    if (!parent) return [];

    return Array.from(parent.querySelectorAll(`[role="${role}"]`));
  }

  /**
   * Simulate Enter/Space key press
   */
  simulateActivation(): boolean {
    const currentElement = this.focusableElements[this.currentFocusIndex];

    if (!currentElement) {
      return false;
    }

    // Simulate click
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    });

    return currentElement.dispatchEvent(event);
  }

  /**
   * Simulate Escape key press
   */
  simulateEscape(): Element | null {
    // Find nearest dialog or popup
    const currentElement = this.focusableElements[this.currentFocusIndex];

    if (!currentElement) {
      return null;
    }

    const dialog = currentElement.closest('[role="dialog"], [role="alertdialog"], [role="menu"]');

    if (dialog) {
      // Close the dialog/menu
      const closeButton = dialog.querySelector('[aria-label*="close"], [aria-label*="Close"]');

      if (closeButton) {
        (closeButton as HTMLElement).click();
        return closeButton;
      }
    }

    return null;
  }

  /**
   * Get focus history
   */
  getFocusHistory(): Element[] {
    return [...this.focusHistory];
  }

  /**
   * Reset simulator
   */
  reset(): void {
    this.currentFocusIndex = -1;
    this.focusHistory = [];
    this.updateFocusableElements();
  }

  /**
   * Get current focus index
   */
  getCurrentIndex(): number {
    return this.currentFocusIndex;
  }

  /**
   * Get total focusable elements
   */
  getTotalFocusable(): number {
    return this.focusableElements.length;
  }
}

/**
 * Example 3: Keyboard Shortcut Tester
 */
export class KeyboardShortcutTester {
  private shortcuts: Map<string, KeyboardEventListener[]> = new Map();

  /**
   * Detect keyboard shortcuts on page
   */
  detectShortcuts(root: Document | Element = document): Map<string, number> {
    const shortcuts = new Map<string, number>();

    // Listen for keyboard events
    const listener = (event: KeyboardEvent) => {
      const key = this.getKeyCombo(event);

      if (key && key.length > 0) {
        shortcuts.set(key, (shortcuts.get(key) || 0) + 1);
      }
    };

    root.addEventListener('keydown', listener);

    return shortcuts;
  }

  /**
   * Get key combination string
   */
  private getKeyCombo(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    if (event.metaKey) parts.push('Meta');

    if (event.key && !['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
      parts.push(event.key);
    }

    return parts.join('+');
  }

  /**
   * Test for single-character shortcuts (WCAG 2.1.4)
   */
  testSingleCharacterShortcuts(root: Document | Element = document): {
    found: string[];
    passed: boolean;
    recommendation: string;
  } {
    const singleCharShortcuts: string[] = [];

    // This is a simplified detection
    // In a real implementation, you would analyze all event listeners

    const found = singleCharShortcuts.filter(key => key.length === 1);

    return {
      found,
      passed: found.length === 0,
      recommendation: found.length > 0
        ? 'Single character shortcuts should be turn-offable, remappable, or only active on focus'
        : 'No single character shortcuts detected',
    };
  }
}

/**
 * Example 4: Focus Order Tester
 */
export class FocusOrderTester {
  /**
   * Test focus order
   */
  testFocusOrder(root: Document | Element = document): {
    order: Array<{ element: Element; index: number; selector: string }>;
    issues: string[];
    passed: boolean;
  } {
    const tester = new KeyboardNavigationTester();
    const focusableElements = tester.getFocusableElements(root);

    const order = focusableElements.map((element, index) => ({
      element,
      index,
      selector: this.getSelector(element),
    }));

    const issues: string[] = [];

    // Check for jumps in visual order
    for (let i = 1; i < order.length; i++) {
      const prev = order[i - 1].element as HTMLElement;
      const curr = order[i].element as HTMLElement;

      // Check if elements are visually far apart
      if (this.areVisuallyDisconnected(prev, curr)) {
        issues.push(
          `Focus jumps from ${order[i - 1].selector} to ${order[i].selector}`
        );
      }
    }

    return {
      order,
      issues,
      passed: issues.length === 0,
    };
  }

  /**
   * Check if two elements are visually disconnected
   */
  private areVisuallyDisconnected(elem1: HTMLElement, elem2: HTMLElement): boolean {
    const rect1 = elem1.getBoundingClientRect();
    const rect2 = elem2.getBoundingClientRect();

    // Simple check: if vertical distance is too large
    const verticalDistance = Math.abs(rect1.top - rect2.top);

    return verticalDistance > 500; // Arbitrary threshold
  }

  /**
   * Get selector
   */
  private getSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    const classes = Array.from(element.classList).slice(0, 2).join('.');
    return `${element.tagName.toLowerCase()}${classes ? '.' + classes : ''}`;
  }
}

// Usage examples
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Keyboard Navigation Tester - WCAG 2.1');

    const tester = new KeyboardNavigationTester();
    const simulator = new KeyboardNavigationSimulator(document);

    // Make available globally
    (window as any).testKeyboard = () => {
      const result = tester.testPage(document);
      console.log(tester.generateReport(result));
      return result;
    };

    (window as any).simulateTab = (shiftKey = false) => {
      const element = simulator.simulateTab(shiftKey);
      if (element) {
        console.log('Focused:', element);
      }
      return element;
    };

    (window as any).testFocusOrder = () => {
      const orderTester = new FocusOrderTester();
      const result = orderTester.testFocusOrder(document);
      console.log('Focus Order:', result);
      return result;
    };

    console.log('Available commands:');
    console.log('  window.testKeyboard() - Run keyboard navigation test');
    console.log('  window.simulateTab() - Simulate Tab key');
    console.log('  window.simulateTab(true) - Simulate Shift+Tab');
    console.log('  window.testFocusOrder() - Test focus order');
  });
}

type KeyboardEventListener = (event: KeyboardEvent) => void;
