/**
 * Focus Management Examples
 *
 * Demonstrates keyboard focus management patterns according to WCAG 2.1:
 * - Success Criterion 2.1.1: Keyboard (Level A)
 * - Success Criterion 2.1.2: No Keyboard Trap (Level A)
 * - Success Criterion 2.4.3: Focus Order (Level A)
 * - Success Criterion 2.4.7: Focus Visible (Level AA)
 *
 * @see https://www.w3.org/WAI/WCAG21/Understanding/keyboard
 * @see https://www.w3.org/WAI/WCAG21/Understanding/focus-order
 */

/**
 * Example 1: Focus Trap for Modal Dialogs
 * Traps focus within a modal, meeting WCAG 2.1.2
 */
export class FocusTrap {
  private container: HTMLElement;
  private focusableElements: HTMLElement[] = [];
  private firstFocusable: HTMLElement | null = null;
  private lastFocusable: HTMLElement | null = null;
  private previousFocus: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.updateFocusableElements();
  }

  /**
   * Get all focusable elements within the container
   */
  private updateFocusableElements(): void {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    this.focusableElements = Array.from(
      this.container.querySelectorAll<HTMLElement>(focusableSelectors)
    ).filter(el => {
      // Check if element is visible and not hidden
      return el.offsetParent !== null &&
             !el.hasAttribute('aria-hidden') &&
             el.tabIndex >= 0;
    });

    this.firstFocusable = this.focusableElements[0] || null;
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1] || null;
  }

  /**
   * Activate the focus trap
   */
  activate(initialFocus?: HTMLElement): void {
    // Store current focus to restore later
    this.previousFocus = document.activeElement as HTMLElement;

    // Set initial focus
    const focusTarget = initialFocus || this.firstFocusable;
    if (focusTarget) {
      setTimeout(() => focusTarget.focus(), 0);
    }

    // Add event listeners
    this.container.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('focus', this.handleFocusOut, true);
  }

  /**
   * Deactivate the focus trap
   */
  deactivate(): void {
    this.container.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('focus', this.handleFocusOut, true);

    // Restore previous focus
    if (this.previousFocus) {
      setTimeout(() => this.previousFocus?.focus(), 0);
    }
  }

  /**
   * Handle keyboard navigation within trap
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;

    this.updateFocusableElements();

    if (event.shiftKey) {
      // Shift + Tab: moving backwards
      if (document.activeElement === this.firstFocusable) {
        event.preventDefault();
        this.lastFocusable?.focus();
      }
    } else {
      // Tab: moving forwards
      if (document.activeElement === this.lastFocusable) {
        event.preventDefault();
        this.firstFocusable?.focus();
      }
    }
  };

  /**
   * Prevent focus from leaving the container
   */
  private handleFocusOut = (event: FocusEvent): void => {
    if (!this.container.contains(event.target as Node)) {
      event.preventDefault();
      event.stopPropagation();
      this.firstFocusable?.focus();
    }
  };
}

/**
 * Example 2: Modal Dialog with Focus Management
 */
export class AccessibleModal {
  private modal: HTMLElement;
  private focusTrap: FocusTrap | null = null;
  private onClose?: () => void;

  constructor(title: string, content: string, onClose?: () => void) {
    this.onClose = onClose;
    this.modal = this.createModal(title, content);
  }

  private createModal(title: string, content: string): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'modal-title');
    overlay.setAttribute('aria-describedby', 'modal-description');

    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog';

    const header = document.createElement('div');
    header.className = 'modal-header';

    const titleEl = document.createElement('h2');
    titleEl.id = 'modal-title';
    titleEl.textContent = title;

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'modal-close';
    closeButton.setAttribute('aria-label', 'Close dialog');
    closeButton.textContent = '×';
    closeButton.addEventListener('click', () => this.close());

    header.appendChild(titleEl);
    header.appendChild(closeButton);

    const body = document.createElement('div');
    body.className = 'modal-body';
    body.id = 'modal-description';
    body.innerHTML = content;

    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const okButton = document.createElement('button');
    okButton.type = 'button';
    okButton.textContent = 'OK';
    okButton.addEventListener('click', () => this.close());

    footer.appendChild(okButton);

    dialog.appendChild(header);
    dialog.appendChild(body);
    dialog.appendChild(footer);
    overlay.appendChild(dialog);

    // Handle Escape key
    overlay.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.close();
      }
    });

    return overlay;
  }

  open(): void {
    document.body.appendChild(this.modal);
    this.focusTrap = new FocusTrap(this.modal);
    this.focusTrap.activate();
  }

  close(): void {
    this.focusTrap?.deactivate();
    this.modal.remove();
    this.onClose?.();
  }
}

/**
 * Example 3: Roving Tab Index for Complex Widgets
 * Implements keyboard navigation for toolbar/menu items
 */
export class RovingTabIndex {
  private container: HTMLElement;
  private items: HTMLElement[] = [];
  private currentIndex: number = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.items = Array.from(
      container.querySelectorAll<HTMLElement>('[role="menuitem"], [role="tab"], .toolbar-item')
    );

    this.initialize();
  }

  private initialize(): void {
    // Set initial tabindex states
    this.items.forEach((item, index) => {
      item.setAttribute('tabindex', index === 0 ? '0' : '-1');
      item.addEventListener('keydown', (e) => this.handleKeyDown(e, index));
      item.addEventListener('focus', () => this.setCurrentIndex(index));
    });
  }

  private handleKeyDown(event: KeyboardEvent, index: number): void {
    let newIndex = index;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        newIndex = (index + 1) % this.items.length;
        break;

      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        newIndex = (index - 1 + this.items.length) % this.items.length;
        break;

      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;

      case 'End':
        event.preventDefault();
        newIndex = this.items.length - 1;
        break;

      default:
        return;
    }

    this.setCurrentIndex(newIndex);
    this.items[newIndex].focus();
  }

  private setCurrentIndex(index: number): void {
    // Remove tabindex from previous item
    this.items[this.currentIndex].setAttribute('tabindex', '-1');

    // Set tabindex on new item
    this.currentIndex = index;
    this.items[index].setAttribute('tabindex', '0');
  }
}

/**
 * Example 4: Skip Links for Main Content
 * Allows keyboard users to skip navigation
 */
export function createSkipLink(targetId: string, linkText: string = 'Skip to main content'): HTMLElement {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.className = 'skip-link';
  skipLink.textContent = linkText;

  // Make target focusable if it's not already
  skipLink.addEventListener('click', (event) => {
    event.preventDefault();
    const target = document.getElementById(targetId);

    if (target) {
      // Make target focusable
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }

      // Focus the target
      target.focus();

      // Scroll to target
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Update URL without jumping
      history.pushState(null, '', `#${targetId}`);
    }
  });

  return skipLink;
}

/**
 * Example 5: Focus Indicator Management
 * Ensures visible focus indicators (WCAG 2.4.7)
 */
export class FocusIndicatorManager {
  private usingMouse: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Detect mouse usage
    document.addEventListener('mousedown', () => {
      this.usingMouse = true;
      document.body.classList.add('using-mouse');
      document.body.classList.remove('using-keyboard');
    });

    // Detect keyboard usage
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        this.usingMouse = false;
        document.body.classList.add('using-keyboard');
        document.body.classList.remove('using-mouse');
      }
    });
  }

  /**
   * Apply enhanced focus styles to an element
   */
  static applyFocusStyle(element: HTMLElement, styles?: Partial<CSSStyleDeclaration>): void {
    const defaultStyles: Partial<CSSStyleDeclaration> = {
      outline: '2px solid #0066cc',
      outlineOffset: '2px',
      ...styles,
    };

    element.addEventListener('focus', () => {
      Object.assign(element.style, defaultStyles);
    });

    element.addEventListener('blur', () => {
      element.style.outline = '';
      element.style.outlineOffset = '';
    });
  }
}

/**
 * Example 6: Programmatic Focus Management
 * Move focus after dynamic content changes
 */
export class FocusManager {
  /**
   * Move focus to an element after a delay
   */
  static moveFocus(
    selector: string | HTMLElement,
    delay: number = 100
  ): void {
    setTimeout(() => {
      const element = typeof selector === 'string'
        ? document.querySelector<HTMLElement>(selector)
        : selector;

      if (element) {
        // Make element focusable if needed
        if (!element.hasAttribute('tabindex') &&
            !['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
          element.setAttribute('tabindex', '-1');
        }

        element.focus();
      }
    }, delay);
  }

  /**
   * Restore focus to previous element
   */
  static saveFocus(): () => void {
    const previousFocus = document.activeElement as HTMLElement;

    return () => {
      if (previousFocus && previousFocus.focus) {
        previousFocus.focus();
      }
    };
  }

  /**
   * Focus first error in a form
   */
  static focusFirstError(formElement: HTMLElement): void {
    const firstError = formElement.querySelector<HTMLElement>(
      '[aria-invalid="true"], .error'
    );

    if (firstError) {
      this.moveFocus(firstError);

      // Announce error to screen readers
      const errorMessage = firstError.getAttribute('aria-describedby');
      if (errorMessage) {
        const errorEl = document.getElementById(errorMessage);
        if (errorEl) {
          this.announceToScreenReader(errorEl.textContent || '');
        }
      }
    }
  }

  /**
   * Announce message to screen readers
   */
  private static announceToScreenReader(message: string): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      announcement.remove();
    }, 1000);
  }
}

/**
 * Example 7: Dropdown Menu with Keyboard Navigation
 */
export class AccessibleDropdown {
  private trigger: HTMLElement;
  private menu: HTMLElement;
  private items: HTMLElement[];
  private isOpen: boolean = false;
  private currentIndex: number = -1;

  constructor(trigger: HTMLElement, menu: HTMLElement) {
    this.trigger = trigger;
    this.menu = menu;
    this.items = Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'));

    this.initialize();
  }

  private initialize(): void {
    // Set ARIA attributes
    this.trigger.setAttribute('aria-haspopup', 'true');
    this.trigger.setAttribute('aria-expanded', 'false');

    // Event listeners
    this.trigger.addEventListener('click', () => this.toggle());
    this.trigger.addEventListener('keydown', (e) => this.handleTriggerKeyDown(e));
    this.menu.addEventListener('keydown', (e) => this.handleMenuKeyDown(e));

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!this.trigger.contains(e.target as Node) &&
          !this.menu.contains(e.target as Node)) {
        this.close();
      }
    });

    // Setup menu items
    this.items.forEach((item, index) => {
      item.setAttribute('tabindex', '-1');
      item.addEventListener('click', () => this.close());
    });
  }

  private handleTriggerKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
      case ' ':
      case 'ArrowDown':
        event.preventDefault();
        this.open();
        this.focusItem(0);
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.open();
        this.focusItem(this.items.length - 1);
        break;
    }
  }

  private handleMenuKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.close();
        this.trigger.focus();
        break;

      case 'ArrowDown':
        event.preventDefault();
        this.focusItem((this.currentIndex + 1) % this.items.length);
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.focusItem((this.currentIndex - 1 + this.items.length) % this.items.length);
        break;

      case 'Home':
        event.preventDefault();
        this.focusItem(0);
        break;

      case 'End':
        event.preventDefault();
        this.focusItem(this.items.length - 1);
        break;

      case 'Tab':
        event.preventDefault();
        this.close();
        this.trigger.focus();
        break;
    }
  }

  private focusItem(index: number): void {
    this.currentIndex = index;
    this.items[index].focus();
  }

  private toggle(): void {
    this.isOpen ? this.close() : this.open();
  }

  private open(): void {
    this.isOpen = true;
    this.menu.style.display = 'block';
    this.trigger.setAttribute('aria-expanded', 'true');
  }

  private close(): void {
    this.isOpen = false;
    this.menu.style.display = 'none';
    this.trigger.setAttribute('aria-expanded', 'false');
    this.currentIndex = -1;
  }
}

/**
 * Example 8: Focus Restoration After Deletion
 */
export function handleDeleteWithFocusManagement(
  deletedElement: HTMLElement,
  listContainer: HTMLElement
): void {
  // Find next focusable sibling
  let nextFocus = deletedElement.nextElementSibling as HTMLElement;

  if (!nextFocus) {
    // Try previous sibling
    nextFocus = deletedElement.previousElementSibling as HTMLElement;
  }

  if (!nextFocus) {
    // Focus the container if no siblings
    nextFocus = listContainer;
  }

  // Remove the element
  deletedElement.remove();

  // Move focus to next element
  FocusManager.moveFocus(nextFocus, 100);
}

// Usage examples
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Focus Management Examples - WCAG 2.1 Compliant');

    // Example: Add skip link
    const skipLink = createSkipLink('main-content');
    document.body.insertBefore(skipLink, document.body.firstChild);

    // Example: Initialize focus indicator manager
    new FocusIndicatorManager();

    console.log('Focus management initialized');
  });
}
