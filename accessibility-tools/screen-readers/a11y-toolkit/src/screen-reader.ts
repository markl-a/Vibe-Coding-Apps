import type { Announcement, ElementA11yInfo } from './types.js';

/**
 * Screen Reader Simulator
 *
 * Simulates how a screen reader would interpret content:
 * - Announces element roles and names
 * - Reads ARIA attributes
 * - Simulates navigation
 */

// Role to spoken text mapping
const ROLE_ANNOUNCEMENTS: Record<string, string> = {
  button: 'button',
  link: 'link',
  checkbox: 'checkbox',
  radio: 'radio button',
  textbox: 'edit text',
  combobox: 'combo box',
  listbox: 'list box',
  option: 'option',
  menuitem: 'menu item',
  tab: 'tab',
  tabpanel: 'tab panel',
  dialog: 'dialog',
  alertdialog: 'alert dialog',
  alert: 'alert',
  progressbar: 'progress bar',
  slider: 'slider',
  heading: 'heading',
  img: 'image',
  figure: 'figure',
  table: 'table',
  row: 'row',
  cell: 'cell',
  navigation: 'navigation',
  main: 'main',
  banner: 'banner',
  contentinfo: 'content info',
  search: 'search',
  form: 'form',
  region: 'region',
  article: 'article',
  complementary: 'complementary',
};

// Implicit roles for HTML elements
const IMPLICIT_ROLES: Record<string, string> = {
  a: 'link',
  button: 'button',
  input: 'textbox',
  select: 'combobox',
  textarea: 'textbox',
  img: 'img',
  table: 'table',
  tr: 'row',
  td: 'cell',
  th: 'columnheader',
  ul: 'list',
  ol: 'list',
  li: 'listitem',
  nav: 'navigation',
  main: 'main',
  header: 'banner',
  footer: 'contentinfo',
  aside: 'complementary',
  article: 'article',
  section: 'region',
  form: 'form',
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  h5: 'heading',
  h6: 'heading',
};

export class ScreenReaderSimulator {
  private announcements: Announcement[] = [];
  private liveRegionObserver: MutationObserver | null = null;

  /**
   * Get accessibility information for an element
   */
  getElementInfo(element: Element): ElementA11yInfo {
    // Get role
    const explicitRole = element.getAttribute('role');
    const implicitRole = IMPLICIT_ROLES[element.tagName.toLowerCase()];
    const role = explicitRole || implicitRole || null;

    // Get accessible name
    const name = this.getAccessibleName(element);

    // Get accessible description
    const description = this.getAccessibleDescription(element);

    // Get state
    const state: Record<string, boolean | string> = {};
    if (element.getAttribute('aria-checked') !== null) {
      state.checked = element.getAttribute('aria-checked') === 'true';
    }
    if (element.getAttribute('aria-selected') !== null) {
      state.selected = element.getAttribute('aria-selected') === 'true';
    }
    if (element.getAttribute('aria-expanded') !== null) {
      state.expanded = element.getAttribute('aria-expanded') === 'true';
    }
    if (element.getAttribute('aria-disabled') !== null) {
      state.disabled = element.getAttribute('aria-disabled') === 'true';
    }
    if (element.getAttribute('aria-pressed') !== null) {
      state.pressed = element.getAttribute('aria-pressed') as string;
    }
    if (element.getAttribute('aria-current') !== null) {
      state.current = element.getAttribute('aria-current') as string;
    }

    // Get properties
    const properties: Record<string, string> = {};
    const ariaLevel = element.getAttribute('aria-level');
    if (ariaLevel) properties.level = ariaLevel;
    const ariaValuenow = element.getAttribute('aria-valuenow');
    if (ariaValuenow) properties.valuenow = ariaValuenow;
    const ariaValuemin = element.getAttribute('aria-valuemin');
    if (ariaValuemin) properties.valuemin = ariaValuemin;
    const ariaValuemax = element.getAttribute('aria-valuemax');
    if (ariaValuemax) properties.valuemax = ariaValuemax;

    // Check focusability
    const focusable = this.isFocusable(element);

    // Check interactivity
    const interactive = this.isInteractive(element);

    return {
      role,
      name,
      description,
      state,
      properties,
      focusable,
      interactive,
      labelledBy: element.getAttribute('aria-labelledby'),
      describedBy: element.getAttribute('aria-describedby'),
    };
  }

  /**
   * Get accessible name for an element
   */
  private getAccessibleName(element: Element): string | null {
    // aria-labelledby takes priority
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labels = labelledBy.split(' ').map((id) => {
        const labelEl = document.getElementById(id);
        return labelEl?.textContent?.trim() || '';
      });
      return labels.join(' ') || null;
    }

    // Then aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // For inputs, check associated label
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
      const id = element.id;
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) return label.textContent?.trim() || null;
      }
    }

    // For images, use alt
    if (element instanceof HTMLImageElement) {
      return element.alt || null;
    }

    // For buttons and links, use text content
    if (element.tagName === 'BUTTON' || element.tagName === 'A') {
      return element.textContent?.trim() || null;
    }

    // Title attribute as fallback
    const title = element.getAttribute('title');
    if (title) return title;

    return null;
  }

  /**
   * Get accessible description for an element
   */
  private getAccessibleDescription(element: Element): string | null {
    const describedBy = element.getAttribute('aria-describedby');
    if (describedBy) {
      const descriptions = describedBy.split(' ').map((id) => {
        const descEl = document.getElementById(id);
        return descEl?.textContent?.trim() || '';
      });
      return descriptions.join(' ') || null;
    }
    return null;
  }

  /**
   * Check if element is focusable
   */
  private isFocusable(element: Element): boolean {
    const tabindex = element.getAttribute('tabindex');
    if (tabindex !== null && parseInt(tabindex) >= 0) return true;

    const focusableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
    if (focusableTags.includes(element.tagName)) {
      return !(element as HTMLElement).hasAttribute('disabled');
    }

    return false;
  }

  /**
   * Check if element is interactive
   */
  private isInteractive(element: Element): boolean {
    const interactiveTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
    if (interactiveTags.includes(element.tagName)) return true;

    const role = element.getAttribute('role');
    const interactiveRoles = ['button', 'link', 'checkbox', 'radio', 'textbox', 'combobox', 'slider', 'switch', 'tab', 'menuitem'];
    if (role && interactiveRoles.includes(role)) return true;

    return false;
  }

  /**
   * Announce an element as a screen reader would
   */
  announce(element: Element): Announcement {
    const info = this.getElementInfo(element);
    const parts: string[] = [];

    // Add name
    if (info.name) {
      parts.push(info.name);
    }

    // Add role
    if (info.role) {
      const roleText = ROLE_ANNOUNCEMENTS[info.role] || info.role;
      parts.push(roleText);

      // Add heading level
      if (info.role === 'heading' && element.tagName.match(/^H[1-6]$/)) {
        parts.push(`level ${element.tagName[1]}`);
      }
    }

    // Add state
    if (info.state.checked !== undefined) {
      parts.push(info.state.checked ? 'checked' : 'not checked');
    }
    if (info.state.selected !== undefined) {
      parts.push(info.state.selected ? 'selected' : 'not selected');
    }
    if (info.state.expanded !== undefined) {
      parts.push(info.state.expanded ? 'expanded' : 'collapsed');
    }
    if (info.state.disabled) {
      parts.push('disabled');
    }

    // Add description
    if (info.description) {
      parts.push(info.description);
    }

    const announcement: Announcement = {
      text: parts.join(', '),
      role: info.role || 'generic',
      level: info.properties.level ? parseInt(info.properties.level) : undefined,
      timestamp: new Date(),
    };

    this.announcements.push(announcement);
    return announcement;
  }

  /**
   * Get all focusable elements in order
   */
  getFocusableElements(container: Element = document.body): Element[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    const elements = Array.from(container.querySelectorAll(selector));

    // Sort by tabindex
    return elements.sort((a, b) => {
      const tabA = parseInt(a.getAttribute('tabindex') || '0');
      const tabB = parseInt(b.getAttribute('tabindex') || '0');
      if (tabA === tabB) return 0;
      if (tabA === 0) return 1;
      if (tabB === 0) return -1;
      return tabA - tabB;
    });
  }

  /**
   * Get announcement history
   */
  getAnnouncements(): Announcement[] {
    return [...this.announcements];
  }

  /**
   * Clear announcement history
   */
  clearAnnouncements(): void {
    this.announcements = [];
  }

  /**
   * Start observing live regions
   */
  observeLiveRegions(callback: (announcement: Announcement) => void): void {
    this.liveRegionObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const target = mutation.target as Element;
        const ariaLive = target.getAttribute('aria-live') ||
          target.closest('[aria-live]')?.getAttribute('aria-live');

        if (ariaLive && ariaLive !== 'off') {
          const announcement: Announcement = {
            text: target.textContent?.trim() || '',
            role: 'status',
            live: ariaLive as 'polite' | 'assertive',
            timestamp: new Date(),
          };
          this.announcements.push(announcement);
          callback(announcement);
        }
      }
    });

    this.liveRegionObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  /**
   * Stop observing live regions
   */
  stopObserving(): void {
    this.liveRegionObserver?.disconnect();
    this.liveRegionObserver = null;
  }
}
