/**
 * UI Enhancement Example
 *
 * Demonstrates how to inject custom UI elements, modify existing elements,
 * and use Shadow DOM in browser extensions.
 */

// ============================================================================
// Example 1: Basic Element Injection
// ============================================================================

/**
 * Inject a simple element into the page
 */
function injectElement(
  tag: string,
  content: string,
  parent: HTMLElement = document.body
): HTMLElement {
  const element = document.createElement(tag);
  element.innerHTML = content;
  parent.appendChild(element);
  return element;
}

/**
 * Inject a styled button
 */
function injectButton(
  text: string,
  onClick: () => void,
  styles?: Partial<CSSStyleDeclaration>
): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = text;
  button.onclick = onClick;

  // Default styles
  Object.assign(button.style, {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    ...styles
  });

  button.onmouseenter = () => {
    button.style.backgroundColor = '#45a049';
  };

  button.onmouseleave = () => {
    button.style.backgroundColor = '#4CAF50';
  };

  return button;
}

// ============================================================================
// Example 2: Floating Panel
// ============================================================================

/**
 * Create a draggable floating panel
 */
class FloatingPanel {
  private panel: HTMLDivElement;
  private isDragging: boolean = false;
  private dragOffset: { x: number; y: number } = { x: 0, y: 0 };

  constructor(title: string, content: string | HTMLElement) {
    this.panel = this.createPanel(title, content);
    this.attachDragListeners();
  }

  /**
   * Create panel element
   */
  private createPanel(title: string, content: string | HTMLElement): HTMLDivElement {
    const panel = document.createElement('div');
    panel.className = 'ext-floating-panel';

    // Panel styles
    Object.assign(panel.style, {
      position: 'fixed',
      top: '100px',
      right: '20px',
      width: '300px',
      backgroundColor: 'white',
      border: '1px solid #ccc',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      zIndex: '999999',
      fontFamily: 'Arial, sans-serif'
    });

    // Header
    const header = document.createElement('div');
    header.className = 'ext-panel-header';
    header.textContent = title;

    Object.assign(header.style, {
      padding: '12px 16px',
      backgroundColor: '#f5f5f5',
      borderBottom: '1px solid #ddd',
      borderRadius: '8px 8px 0 0',
      cursor: 'move',
      fontWeight: 'bold',
      fontSize: '14px',
      userSelect: 'none'
    });

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.onclick = () => this.hide();

    Object.assign(closeBtn.style, {
      position: 'absolute',
      top: '8px',
      right: '8px',
      width: '24px',
      height: '24px',
      border: 'none',
      backgroundColor: 'transparent',
      fontSize: '20px',
      cursor: 'pointer',
      color: '#666'
    });

    header.appendChild(closeBtn);

    // Content
    const contentDiv = document.createElement('div');
    contentDiv.className = 'ext-panel-content';

    if (typeof content === 'string') {
      contentDiv.innerHTML = content;
    } else {
      contentDiv.appendChild(content);
    }

    Object.assign(contentDiv.style, {
      padding: '16px',
      maxHeight: '400px',
      overflowY: 'auto'
    });

    panel.appendChild(header);
    panel.appendChild(contentDiv);

    return panel;
  }

  /**
   * Attach drag event listeners
   */
  private attachDragListeners(): void {
    const header = this.panel.querySelector('.ext-panel-header') as HTMLElement;

    header.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      const rect = this.panel.getBoundingClientRect();
      this.dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;

      const x = e.clientX - this.dragOffset.x;
      const y = e.clientY - this.dragOffset.y;

      this.panel.style.left = `${x}px`;
      this.panel.style.top = `${y}px`;
      this.panel.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
  }

  /**
   * Show panel
   */
  show(): void {
    if (!this.panel.parentElement) {
      document.body.appendChild(this.panel);
    }
    this.panel.style.display = 'block';
  }

  /**
   * Hide panel
   */
  hide(): void {
    this.panel.style.display = 'none';
  }

  /**
   * Update content
   */
  updateContent(content: string | HTMLElement): void {
    const contentDiv = this.panel.querySelector('.ext-panel-content') as HTMLElement;
    if (typeof content === 'string') {
      contentDiv.innerHTML = content;
    } else {
      contentDiv.innerHTML = '';
      contentDiv.appendChild(content);
    }
  }

  /**
   * Get panel element
   */
  getElement(): HTMLDivElement {
    return this.panel;
  }
}

// ============================================================================
// Example 3: Shadow DOM Usage
// ============================================================================

/**
 * Create element with Shadow DOM
 */
class ShadowElement {
  private host: HTMLElement;
  private shadow: ShadowRoot;

  constructor(tagName: string = 'div') {
    this.host = document.createElement(tagName);
    this.shadow = this.host.attachShadow({ mode: 'open' });
  }

  /**
   * Set HTML content
   */
  setHTML(html: string): void {
    this.shadow.innerHTML = html;
  }

  /**
   * Set styles
   */
  setStyles(css: string): void {
    const style = document.createElement('style');
    style.textContent = css;
    this.shadow.appendChild(style);
  }

  /**
   * Append child to shadow root
   */
  appendChild(child: HTMLElement): void {
    this.shadow.appendChild(child);
  }

  /**
   * Get host element
   */
  getHost(): HTMLElement {
    return this.host;
  }

  /**
   * Get shadow root
   */
  getShadow(): ShadowRoot {
    return this.shadow;
  }
}

/**
 * Create isolated widget with Shadow DOM
 */
function createIsolatedWidget(): HTMLElement {
  const widget = new ShadowElement('div');

  // Add styles (isolated from page)
  widget.setStyles(`
    :host {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
    }

    .widget-container {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
      min-width: 200px;
    }

    .widget-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 12px;
    }

    .widget-content {
      font-size: 14px;
      line-height: 1.5;
    }

    button {
      background: white;
      color: #667eea;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 12px;
      font-weight: bold;
    }

    button:hover {
      background: #f0f0f0;
    }
  `);

  // Add content
  widget.setHTML(`
    <div class="widget-container">
      <div class="widget-title">Custom Widget</div>
      <div class="widget-content">
        This widget is isolated using Shadow DOM!
      </div>
      <button id="action-btn">Click Me</button>
    </div>
  `);

  // Add event listener
  const button = widget.getShadow().querySelector('#action-btn');
  button?.addEventListener('click', () => {
    alert('Button clicked in Shadow DOM!');
  });

  return widget.getHost();
}

// ============================================================================
// Example 4: Modify Existing Elements
// ============================================================================

/**
 * Modify element attributes
 */
function modifyElement(
  selector: string,
  modifications: {
    attributes?: Record<string, string>;
    styles?: Partial<CSSStyleDeclaration>;
    content?: string;
  }
): void {
  const elements = document.querySelectorAll(selector);

  elements.forEach((element) => {
    const htmlElement = element as HTMLElement;

    // Update attributes
    if (modifications.attributes) {
      Object.entries(modifications.attributes).forEach(([key, value]) => {
        htmlElement.setAttribute(key, value);
      });
    }

    // Update styles
    if (modifications.styles) {
      Object.assign(htmlElement.style, modifications.styles);
    }

    // Update content
    if (modifications.content !== undefined) {
      htmlElement.innerHTML = modifications.content;
    }
  });
}

/**
 * Add custom class to elements
 */
function addCustomClass(selector: string, className: string): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach((element) => {
    element.classList.add(className);
  });
}

/**
 * Wrap elements with container
 */
function wrapElements(selector: string, wrapperTag: string = 'div'): void {
  const elements = document.querySelectorAll(selector);

  elements.forEach((element) => {
    const wrapper = document.createElement(wrapperTag);
    element.parentNode?.insertBefore(wrapper, element);
    wrapper.appendChild(element);
  });
}

// ============================================================================
// Example 5: Custom Tooltip System
// ============================================================================

/**
 * Tooltip manager
 */
class TooltipManager {
  private tooltip: HTMLDivElement;

  constructor() {
    this.tooltip = this.createTooltip();
    document.body.appendChild(this.tooltip);
  }

  /**
   * Create tooltip element
   */
  private createTooltip(): HTMLDivElement {
    const tooltip = document.createElement('div');
    tooltip.className = 'ext-custom-tooltip';

    Object.assign(tooltip.style, {
      position: 'fixed',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '4px',
      fontSize: '12px',
      pointerEvents: 'none',
      zIndex: '9999999',
      display: 'none',
      maxWidth: '200px',
      wordWrap: 'break-word'
    });

    return tooltip;
  }

  /**
   * Attach tooltip to element
   */
  attach(element: HTMLElement, text: string): void {
    element.addEventListener('mouseenter', (e) => {
      this.show(text, e.clientX, e.clientY);
    });

    element.addEventListener('mousemove', (e) => {
      this.updatePosition(e.clientX, e.clientY);
    });

    element.addEventListener('mouseleave', () => {
      this.hide();
    });
  }

  /**
   * Show tooltip
   */
  private show(text: string, x: number, y: number): void {
    this.tooltip.textContent = text;
    this.tooltip.style.display = 'block';
    this.updatePosition(x, y);
  }

  /**
   * Hide tooltip
   */
  private hide(): void {
    this.tooltip.style.display = 'none';
  }

  /**
   * Update tooltip position
   */
  private updatePosition(x: number, y: number): void {
    this.tooltip.style.left = `${x + 10}px`;
    this.tooltip.style.top = `${y + 10}px`;
  }
}

// ============================================================================
// Example 6: Notification System
// ============================================================================

/**
 * Notification type
 */
type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * In-page notification system
 */
class NotificationSystem {
  private container: HTMLDivElement;

  constructor() {
    this.container = this.createContainer();
    document.body.appendChild(this.container);
  }

  /**
   * Create notification container
   */
  private createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'ext-notification-container';

    Object.assign(container.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: '9999999',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      pointerEvents: 'none'
    });

    return container;
  }

  /**
   * Show notification
   */
  show(message: string, type: NotificationType = 'info', duration: number = 3000): void {
    const notification = this.createNotification(message, type);
    this.container.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 10);

    // Remove after duration
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';

      setTimeout(() => {
        notification.remove();
      }, 300);
    }, duration);
  }

  /**
   * Create notification element
   */
  private createNotification(message: string, type: NotificationType): HTMLDivElement {
    const notification = document.createElement('div');
    notification.className = 'ext-notification';

    const colors = {
      info: '#2196F3',
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336'
    };

    Object.assign(notification.style, {
      backgroundColor: 'white',
      color: '#333',
      padding: '16px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      borderLeft: `4px solid ${colors[type]}`,
      minWidth: '250px',
      maxWidth: '400px',
      opacity: '0',
      transform: 'translateX(100%)',
      transition: 'all 0.3s ease',
      pointerEvents: 'auto',
      fontSize: '14px',
      lineHeight: '1.5'
    });

    notification.textContent = message;

    return notification;
  }
}

// ============================================================================
// Example 7: Custom Context Menu
// ============================================================================

/**
 * Context menu item
 */
interface ContextMenuItem {
  label: string;
  onClick: () => void;
  icon?: string;
  disabled?: boolean;
}

/**
 * Custom context menu
 */
class ContextMenu {
  private menu: HTMLDivElement;
  private isVisible: boolean = false;

  constructor(items: ContextMenuItem[]) {
    this.menu = this.createMenu(items);
    document.body.appendChild(this.menu);
    this.attachListeners();
  }

  /**
   * Create menu element
   */
  private createMenu(items: ContextMenuItem[]): HTMLDivElement {
    const menu = document.createElement('div');
    menu.className = 'ext-context-menu';

    Object.assign(menu.style, {
      position: 'fixed',
      backgroundColor: 'white',
      border: '1px solid #ccc',
      borderRadius: '4px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      padding: '4px 0',
      minWidth: '180px',
      zIndex: '9999999',
      display: 'none'
    });

    items.forEach((item) => {
      const menuItem = this.createMenuItem(item);
      menu.appendChild(menuItem);
    });

    return menu;
  }

  /**
   * Create menu item
   */
  private createMenuItem(item: ContextMenuItem): HTMLDivElement {
    const menuItem = document.createElement('div');
    menuItem.className = 'ext-context-menu-item';

    if (item.icon) {
      menuItem.innerHTML = `<span>${item.icon}</span> ${item.label}`;
    } else {
      menuItem.textContent = item.label;
    }

    Object.assign(menuItem.style, {
      padding: '8px 16px',
      cursor: item.disabled ? 'not-allowed' : 'pointer',
      fontSize: '14px',
      opacity: item.disabled ? '0.5' : '1'
    });

    if (!item.disabled) {
      menuItem.onmouseenter = () => {
        menuItem.style.backgroundColor = '#f5f5f5';
      };

      menuItem.onmouseleave = () => {
        menuItem.style.backgroundColor = 'transparent';
      };

      menuItem.onclick = () => {
        item.onClick();
        this.hide();
      };
    }

    return menuItem;
  }

  /**
   * Show menu at position
   */
  show(x: number, y: number): void {
    this.menu.style.left = `${x}px`;
    this.menu.style.top = `${y}px`;
    this.menu.style.display = 'block';
    this.isVisible = true;
  }

  /**
   * Hide menu
   */
  hide(): void {
    this.menu.style.display = 'none';
    this.isVisible = false;
  }

  /**
   * Attach event listeners
   */
  private attachListeners(): void {
    document.addEventListener('click', () => {
      if (this.isVisible) {
        this.hide();
      }
    });
  }
}

// ============================================================================
// Example 8: Usage Examples
// ============================================================================

// Create floating panel
const panel = new FloatingPanel('My Extension', '<p>Custom content here!</p>');
panel.show();

// Create isolated widget
const widget = createIsolatedWidget();
document.body.appendChild(widget);

// Modify existing elements
modifyElement('button', {
  styles: {
    borderRadius: '20px',
    transition: 'all 0.3s ease'
  }
});

// Add tooltips
const tooltipManager = new TooltipManager();
document.querySelectorAll('a').forEach((link) => {
  tooltipManager.attach(link as HTMLElement, 'Click to open link');
});

// Show notifications
const notifications = new NotificationSystem();
notifications.show('Extension loaded successfully!', 'success');

// Create context menu
const contextMenu = new ContextMenu([
  { label: 'Copy', onClick: () => console.log('Copy') },
  { label: 'Paste', onClick: () => console.log('Paste'), disabled: true },
  { label: 'Delete', onClick: () => console.log('Delete') }
]);

// Show on right-click
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  contextMenu.show(e.clientX, e.clientY);
});

export {
  injectElement,
  injectButton,
  FloatingPanel,
  ShadowElement,
  createIsolatedWidget,
  modifyElement,
  addCustomClass,
  wrapElements,
  TooltipManager,
  NotificationSystem,
  ContextMenu,
  ContextMenuItem,
  NotificationType
};
