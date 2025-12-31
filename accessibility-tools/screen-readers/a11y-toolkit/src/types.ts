/**
 * Accessibility Toolkit Types
 */

// ARIA roles
export type AriaRole =
  | 'alert'
  | 'alertdialog'
  | 'application'
  | 'article'
  | 'banner'
  | 'button'
  | 'cell'
  | 'checkbox'
  | 'columnheader'
  | 'combobox'
  | 'complementary'
  | 'contentinfo'
  | 'dialog'
  | 'document'
  | 'feed'
  | 'figure'
  | 'form'
  | 'grid'
  | 'gridcell'
  | 'group'
  | 'heading'
  | 'img'
  | 'link'
  | 'list'
  | 'listbox'
  | 'listitem'
  | 'log'
  | 'main'
  | 'marquee'
  | 'math'
  | 'menu'
  | 'menubar'
  | 'menuitem'
  | 'menuitemcheckbox'
  | 'menuitemradio'
  | 'navigation'
  | 'none'
  | 'note'
  | 'option'
  | 'presentation'
  | 'progressbar'
  | 'radio'
  | 'radiogroup'
  | 'region'
  | 'row'
  | 'rowgroup'
  | 'rowheader'
  | 'scrollbar'
  | 'search'
  | 'searchbox'
  | 'separator'
  | 'slider'
  | 'spinbutton'
  | 'status'
  | 'switch'
  | 'tab'
  | 'table'
  | 'tablist'
  | 'tabpanel'
  | 'term'
  | 'textbox'
  | 'timer'
  | 'toolbar'
  | 'tooltip'
  | 'tree'
  | 'treegrid'
  | 'treeitem';

// Accessibility issue severity
export type IssueSeverity = 'critical' | 'serious' | 'moderate' | 'minor';

// Accessibility issue
export interface A11yIssue {
  id: string;
  rule: string;
  severity: IssueSeverity;
  message: string;
  element: string;
  selector: string;
  help: string;
  helpUrl?: string;
}

// Audit result
export interface AuditResult {
  passes: number;
  violations: A11yIssue[];
  incomplete: A11yIssue[];
  timestamp: Date;
  url: string;
}

// Screen reader announcement
export interface Announcement {
  text: string;
  role: string;
  level?: number;
  live?: 'polite' | 'assertive' | 'off';
  timestamp: Date;
}

// Element accessibility info
export interface ElementA11yInfo {
  role: string | null;
  name: string | null;
  description: string | null;
  state: Record<string, boolean | string>;
  properties: Record<string, string>;
  focusable: boolean;
  interactive: boolean;
  labelledBy: string | null;
  describedBy: string | null;
}

// Focus trap options
export interface FocusTrapOptions {
  initialFocus?: string | HTMLElement;
  fallbackFocus?: string | HTMLElement;
  escapeDeactivates?: boolean;
  clickOutsideDeactivates?: boolean;
  returnFocusOnDeactivate?: boolean;
}

// Color contrast result
export interface ContrastResult {
  ratio: number;
  aa: { normal: boolean; large: boolean };
  aaa: { normal: boolean; large: boolean };
}

// Keyboard navigation map
export interface KeyboardNavigation {
  element: string;
  keys: string[];
  action: string;
}
