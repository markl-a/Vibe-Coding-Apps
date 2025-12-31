/**
 * Live Regions Examples
 *
 * Demonstrates ARIA live regions for dynamic content announcements according to WCAG 2.1:
 * - Success Criterion 4.1.3: Status Messages (Level AA)
 * - Success Criterion 1.3.1: Info and Relationships (Level A)
 *
 * Live regions allow screen readers to announce dynamic content changes without
 * moving focus or disrupting the user's workflow.
 *
 * @see https://www.w3.org/WAI/WCAG21/Understanding/status-messages
 * @see https://www.w3.org/TR/wai-aria-1.2/#live_region_roles
 */

/**
 * Example 1: Status Messages (Polite)
 * For non-critical status updates that don't require immediate attention
 */
export class StatusAnnouncer {
  private statusRegion: HTMLElement;

  constructor() {
    this.statusRegion = this.createStatusRegion();
  }

  private createStatusRegion(): HTMLElement {
    const region = document.createElement('div');
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only'; // Visually hidden but accessible

    document.body.appendChild(region);

    return region;
  }

  /**
   * Announce a status message
   */
  announce(message: string, delay: number = 100): void {
    // Clear previous message
    this.statusRegion.textContent = '';

    // Set new message after a brief delay to ensure it's announced
    setTimeout(() => {
      this.statusRegion.textContent = message;
    }, delay);

    // Clear after announcement (optional)
    setTimeout(() => {
      this.statusRegion.textContent = '';
    }, delay + 5000);
  }

  /**
   * Announce success message
   */
  success(message: string): void {
    this.announce(`Success: ${message}`);
  }

  /**
   * Announce info message
   */
  info(message: string): void {
    this.announce(`Info: ${message}`);
  }
}

/**
 * Example 2: Alert Messages (Assertive)
 * For critical alerts that require immediate attention
 */
export class AlertAnnouncer {
  private alertRegion: HTMLElement;

  constructor() {
    this.alertRegion = this.createAlertRegion();
  }

  private createAlertRegion(): HTMLElement {
    const region = document.createElement('div');
    region.setAttribute('role', 'alert');
    region.setAttribute('aria-live', 'assertive');
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';

    document.body.appendChild(region);

    return region;
  }

  /**
   * Announce an alert message
   */
  announce(message: string): void {
    // Clear and set message
    this.alertRegion.textContent = '';

    setTimeout(() => {
      this.alertRegion.textContent = message;
    }, 100);

    // Clear after 10 seconds
    setTimeout(() => {
      this.alertRegion.textContent = '';
    }, 10100);
  }

  /**
   * Announce error message
   */
  error(message: string): void {
    this.announce(`Error: ${message}`);
  }

  /**
   * Announce warning message
   */
  warning(message: string): void {
    this.announce(`Warning: ${message}`);
  }
}

/**
 * Example 3: Form Validation with Live Feedback
 */
export class FormValidator {
  private form: HTMLFormElement;
  private statusAnnouncer: StatusAnnouncer;
  private alertAnnouncer: AlertAnnouncer;

  constructor(form: HTMLFormElement) {
    this.form = form;
    this.statusAnnouncer = new StatusAnnouncer();
    this.alertAnnouncer = new AlertAnnouncer();

    this.initialize();
  }

  private initialize(): void {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Add live validation to inputs
    this.form.querySelectorAll('input, textarea, select').forEach(field => {
      field.addEventListener('blur', () => this.validateField(field as HTMLInputElement));
    });
  }

  private validateField(field: HTMLInputElement): void {
    const errorContainer = document.getElementById(`${field.id}-error`);
    if (!errorContainer) return;

    // Set up error container as live region
    if (!errorContainer.hasAttribute('role')) {
      errorContainer.setAttribute('role', 'alert');
      errorContainer.setAttribute('aria-live', 'assertive');
    }

    let errorMessage = '';

    if (field.required && !field.value.trim()) {
      errorMessage = `${field.labels?.[0]?.textContent || 'This field'} is required`;
    } else if (field.type === 'email' && field.value && !this.isValidEmail(field.value)) {
      errorMessage = 'Please enter a valid email address';
    }

    if (errorMessage) {
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', errorContainer.id);
      errorContainer.textContent = errorMessage;
      errorContainer.style.display = 'block';
    } else {
      field.setAttribute('aria-invalid', 'false');
      errorContainer.textContent = '';
      errorContainer.style.display = 'none';
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private handleSubmit(event: Event): void {
    event.preventDefault();

    // Validate all fields
    const fields = Array.from(this.form.querySelectorAll<HTMLInputElement>('input, textarea, select'));
    fields.forEach(field => this.validateField(field));

    const hasErrors = this.form.querySelector('[aria-invalid="true"]');

    if (hasErrors) {
      this.alertAnnouncer.error('Form contains errors. Please correct them and try again.');

      // Focus first error
      const firstError = this.form.querySelector<HTMLElement>('[aria-invalid="true"]');
      firstError?.focus();
    } else {
      this.statusAnnouncer.success('Form submitted successfully!');
    }
  }
}

/**
 * Example 4: Progress Indicator with Live Updates
 */
export class ProgressTracker {
  private progressBar: HTMLElement;
  private progressLabel: HTMLElement;
  private liveRegion: HTMLElement;
  private currentValue: number = 0;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error('Container not found');

    this.createProgressBar(container);
    this.liveRegion = this.createLiveRegion();
  }

  private createProgressBar(container: HTMLElement): void {
    this.progressLabel = document.createElement('div');
    this.progressLabel.id = 'progress-label';
    this.progressLabel.textContent = 'Loading...';

    this.progressBar = document.createElement('div');
    this.progressBar.setAttribute('role', 'progressbar');
    this.progressBar.setAttribute('aria-valuemin', '0');
    this.progressBar.setAttribute('aria-valuemax', '100');
    this.progressBar.setAttribute('aria-valuenow', '0');
    this.progressBar.setAttribute('aria-labelledby', 'progress-label');
    this.progressBar.className = 'progress-bar';

    const fill = document.createElement('div');
    fill.className = 'progress-fill';
    this.progressBar.appendChild(fill);

    container.appendChild(this.progressLabel);
    container.appendChild(this.progressBar);
  }

  private createLiveRegion(): HTMLElement {
    const region = document.createElement('div');
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'false');
    region.className = 'sr-only';

    document.body.appendChild(region);

    return region;
  }

  /**
   * Update progress (0-100)
   */
  updateProgress(value: number, message?: string): void {
    this.currentValue = Math.min(100, Math.max(0, value));

    this.progressBar.setAttribute('aria-valuenow', String(this.currentValue));

    const fill = this.progressBar.querySelector<HTMLElement>('.progress-fill');
    if (fill) {
      fill.style.width = `${this.currentValue}%`;
    }

    // Announce at key milestones: 25%, 50%, 75%, 100%
    const milestones = [25, 50, 75, 100];
    if (milestones.includes(this.currentValue)) {
      const announcement = message || `${this.currentValue}% complete`;
      this.liveRegion.textContent = announcement;
    }

    if (this.currentValue === 100) {
      this.progressLabel.textContent = 'Complete!';
      setTimeout(() => {
        this.liveRegion.textContent = 'Loading complete';
      }, 100);
    }
  }

  /**
   * Reset progress
   */
  reset(): void {
    this.updateProgress(0);
    this.progressLabel.textContent = 'Loading...';
  }
}

/**
 * Example 5: Timer Countdown with Live Updates
 */
export class CountdownTimer {
  private timerElement: HTMLElement;
  private liveRegion: HTMLElement;
  private remainingSeconds: number;
  private intervalId: number | null = null;

  constructor(containerId: string, initialSeconds: number) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error('Container not found');

    this.remainingSeconds = initialSeconds;
    this.timerElement = this.createTimerDisplay(container);
    this.liveRegion = this.createLiveRegion();
  }

  private createTimerDisplay(container: HTMLElement): HTMLElement {
    const timer = document.createElement('div');
    timer.setAttribute('role', 'timer');
    timer.setAttribute('aria-live', 'off'); // We'll use a separate live region
    timer.className = 'countdown-timer';

    container.appendChild(timer);
    return timer;
  }

  private createLiveRegion(): HTMLElement {
    const region = document.createElement('div');
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.className = 'sr-only';

    document.body.appendChild(region);

    return region;
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Start the countdown
   */
  start(): void {
    this.updateDisplay();

    this.intervalId = window.setInterval(() => {
      this.remainingSeconds--;

      this.updateDisplay();

      // Announce at key intervals
      if (this.remainingSeconds === 60) {
        this.liveRegion.textContent = 'One minute remaining';
      } else if (this.remainingSeconds === 30) {
        this.liveRegion.textContent = '30 seconds remaining';
      } else if (this.remainingSeconds === 10) {
        this.liveRegion.textContent = '10 seconds remaining';
      } else if (this.remainingSeconds === 0) {
        this.liveRegion.textContent = 'Time is up!';
        this.stop();
      }
    }, 1000);
  }

  /**
   * Stop the countdown
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private updateDisplay(): void {
    this.timerElement.textContent = this.formatTime(this.remainingSeconds);
  }
}

/**
 * Example 6: Loading States with Live Regions
 */
export class LoadingState {
  private container: HTMLElement;
  private liveRegion: HTMLElement;
  private spinnerElement: HTMLElement | null = null;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error('Container not found');

    this.container = container;
    this.liveRegion = this.createLiveRegion();
  }

  private createLiveRegion(): HTMLElement {
    const region = document.createElement('div');
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';

    document.body.appendChild(region);

    return region;
  }

  /**
   * Show loading state
   */
  showLoading(message: string = 'Loading content...'): void {
    this.spinnerElement = document.createElement('div');
    this.spinnerElement.className = 'loading-spinner';
    this.spinnerElement.setAttribute('role', 'status');
    this.spinnerElement.setAttribute('aria-label', message);

    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    this.spinnerElement.appendChild(spinner);

    const text = document.createElement('span');
    text.className = 'sr-only';
    text.textContent = message;
    this.spinnerElement.appendChild(text);

    this.container.appendChild(this.spinnerElement);
    this.liveRegion.textContent = message;
  }

  /**
   * Hide loading state and announce completion
   */
  hideLoading(completionMessage: string = 'Content loaded'): void {
    if (this.spinnerElement) {
      this.spinnerElement.remove();
      this.spinnerElement = null;
    }

    this.liveRegion.textContent = completionMessage;
  }
}

/**
 * Example 7: Search Results with Live Updates
 */
export class LiveSearchResults {
  private searchInput: HTMLInputElement;
  private resultsContainer: HTMLElement;
  private liveRegion: HTMLElement;
  private debounceTimer: number | null = null;

  constructor(searchInputId: string, resultsContainerId: string) {
    const input = document.getElementById(searchInputId) as HTMLInputElement;
    const results = document.getElementById(resultsContainerId);

    if (!input || !results) throw new Error('Required elements not found');

    this.searchInput = input;
    this.resultsContainer = results;
    this.liveRegion = this.createLiveRegion();

    this.initialize();
  }

  private createLiveRegion(): HTMLElement {
    const region = document.createElement('div');
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';

    document.body.appendChild(region);

    return region;
  }

  private initialize(): void {
    this.searchInput.setAttribute('aria-controls', this.resultsContainer.id);
    this.searchInput.setAttribute('aria-autocomplete', 'list');

    this.resultsContainer.setAttribute('role', 'region');
    this.resultsContainer.setAttribute('aria-live', 'polite');
    this.resultsContainer.setAttribute('aria-relevant', 'additions removals');

    this.searchInput.addEventListener('input', () => this.handleSearch());
  }

  private handleSearch(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = window.setTimeout(() => {
      const query = this.searchInput.value.trim();

      if (query.length === 0) {
        this.clearResults();
        return;
      }

      // Simulate search
      this.performSearch(query);
    }, 300);
  }

  private performSearch(query: string): void {
    // Announce searching
    this.liveRegion.textContent = 'Searching...';

    // Simulate async search
    setTimeout(() => {
      // Mock results
      const results = [
        `Result 1 for "${query}"`,
        `Result 2 for "${query}"`,
        `Result 3 for "${query}"`,
      ];

      this.displayResults(results);

      // Announce results count
      const count = results.length;
      this.liveRegion.textContent = `${count} result${count !== 1 ? 's' : ''} found`;
    }, 500);
  }

  private displayResults(results: string[]): void {
    this.resultsContainer.innerHTML = '';

    const list = document.createElement('ul');
    list.setAttribute('role', 'listbox');

    results.forEach((result, index) => {
      const item = document.createElement('li');
      item.setAttribute('role', 'option');
      item.textContent = result;
      list.appendChild(item);
    });

    this.resultsContainer.appendChild(list);
  }

  private clearResults(): void {
    this.resultsContainer.innerHTML = '';
    this.liveRegion.textContent = '';
  }
}

/**
 * Example 8: Notification System with Priority
 */
export class NotificationSystem {
  private notifications: Array<{
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    priority: 'polite' | 'assertive';
  }> = [];

  private container: HTMLElement;
  private politeRegion: HTMLElement;
  private assertiveRegion: HTMLElement;

  constructor() {
    this.container = this.createContainer();
    this.politeRegion = this.createLiveRegion('polite');
    this.assertiveRegion = this.createLiveRegion('assertive');
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'notification-container';
    container.setAttribute('aria-label', 'Notifications');
    document.body.appendChild(container);
    return container;
  }

  private createLiveRegion(priority: 'polite' | 'assertive'): HTMLElement {
    const region = document.createElement('div');
    region.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
    region.setAttribute('aria-live', priority);
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    document.body.appendChild(region);
    return region;
  }

  /**
   * Show a notification
   */
  notify(
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): void {
    const id = `notification-${Date.now()}`;
    const priority = (type === 'error' || type === 'warning') ? 'assertive' : 'polite';

    const notification = { id, message, type, priority };
    this.notifications.push(notification);

    this.showNotification(notification);
  }

  private showNotification(notification: typeof this.notifications[0]): void {
    // Create visual notification
    const element = document.createElement('div');
    element.id = notification.id;
    element.className = `notification notification-${notification.type}`;
    element.setAttribute('role', notification.priority === 'assertive' ? 'alert' : 'status');

    const text = document.createElement('p');
    text.textContent = notification.message;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Dismiss notification');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => this.dismiss(notification.id));

    element.appendChild(text);
    element.appendChild(closeBtn);
    this.container.appendChild(element);

    // Announce to screen readers
    const liveRegion = notification.priority === 'assertive'
      ? this.assertiveRegion
      : this.politeRegion;

    liveRegion.textContent = `${notification.type}: ${notification.message}`;

    // Auto-dismiss after 5 seconds
    setTimeout(() => this.dismiss(notification.id), 5000);
  }

  private dismiss(id: string): void {
    const element = document.getElementById(id);
    if (element) {
      element.remove();
    }

    this.notifications = this.notifications.filter(n => n.id !== id);
  }
}

// Usage examples
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Live Regions Examples - WCAG 2.1 Compliant');

    // Example: Create global announcers
    const statusAnnouncer = new StatusAnnouncer();
    const alertAnnouncer = new AlertAnnouncer();
    const notifications = new NotificationSystem();

    // Make available globally for easy testing
    (window as any).announce = {
      status: (msg: string) => statusAnnouncer.announce(msg),
      alert: (msg: string) => alertAnnouncer.announce(msg),
      notify: (msg: string, type?: any) => notifications.notify(msg, type),
    };

    console.log('Live region announcers initialized');
    console.log('Try: window.announce.status("Hello!") or window.announce.alert("Warning!")');
  });
}
