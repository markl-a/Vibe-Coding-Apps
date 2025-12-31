/**
 * Keyboard Shortcuts Example
 *
 * Demonstrates how to register and handle keyboard shortcuts in a Chrome extension.
 * Includes customizable key bindings and different command types.
 */

// ============================================================================
// Example 1: Register Keyboard Shortcuts in manifest.json
// ============================================================================

/**
 * Add this to your manifest.json:
 *
 * {
 *   "commands": {
 *     "toggle-feature": {
 *       "suggested_key": {
 *         "default": "Ctrl+Shift+Y",
 *         "mac": "Command+Shift+Y"
 *       },
 *       "description": "Toggle main feature"
 *     },
 *     "quick-action": {
 *       "suggested_key": {
 *         "default": "Alt+Shift+Q"
 *       },
 *       "description": "Execute quick action"
 *     },
 *     "_execute_action": {
 *       "suggested_key": {
 *         "default": "Ctrl+Shift+U",
 *         "mac": "Command+Shift+U"
 *       }
 *     }
 *   }
 * }
 */

// ============================================================================
// Example 2: Handle Command Events in Background Script
// ============================================================================

/**
 * Listen for keyboard shortcut commands
 */
chrome.commands.onCommand.addListener((command: string) => {
  console.log('Command received:', command);

  switch (command) {
    case 'toggle-feature':
      handleToggleFeature();
      break;
    case 'quick-action':
      handleQuickAction();
      break;
    default:
      console.log('Unknown command:', command);
  }
});

/**
 * Handle toggle feature command
 */
async function handleToggleFeature(): Promise<void> {
  // Get current state
  const { featureEnabled } = await chrome.storage.local.get('featureEnabled');
  const newState = !featureEnabled;

  // Save new state
  await chrome.storage.local.set({ featureEnabled: newState });

  // Notify all tabs
  const tabs = await chrome.tabs.query({});
  tabs.forEach((tab) => {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'FEATURE_TOGGLED',
        enabled: newState
      }).catch(() => {
        // Tab may not have content script injected
      });
    }
  });

  // Show notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.png',
    title: 'Feature Status',
    message: `Feature ${newState ? 'enabled' : 'disabled'}`
  });
}

/**
 * Handle quick action command
 */
async function handleQuickAction(): Promise<void> {
  // Get active tab
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!activeTab.id) return;

  // Execute script in active tab
  await chrome.scripting.executeScript({
    target: { tabId: activeTab.id },
    func: () => {
      // Quick action: scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

// ============================================================================
// Example 3: Get All Registered Commands
// ============================================================================

/**
 * Retrieve all registered keyboard shortcuts
 */
async function getAllCommands(): Promise<chrome.commands.Command[]> {
  const commands = await chrome.commands.getAll();

  commands.forEach((command) => {
    console.log('Command:', command.name);
    console.log('Shortcut:', command.shortcut || 'Not set');
    console.log('Description:', command.description);
  });

  return commands;
}

// ============================================================================
// Example 4: Customizable Key Bindings
// ============================================================================

/**
 * Interface for custom key binding
 */
interface KeyBinding {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  action: () => void;
}

/**
 * Key binding manager for content scripts
 */
class KeyBindingManager {
  private bindings: Map<string, KeyBinding> = new Map();

  /**
   * Register a key binding
   */
  register(id: string, binding: KeyBinding): void {
    this.bindings.set(id, binding);
  }

  /**
   * Unregister a key binding
   */
  unregister(id: string): void {
    this.bindings.delete(id);
  }

  /**
   * Initialize keyboard event listener
   */
  initialize(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  /**
   * Handle keydown events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    for (const [id, binding] of this.bindings) {
      if (this.matchesBinding(event, binding)) {
        event.preventDefault();
        binding.action();
        break;
      }
    }
  }

  /**
   * Check if event matches binding
   */
  private matchesBinding(event: KeyboardEvent, binding: KeyBinding): boolean {
    if (event.key.toLowerCase() !== binding.key.toLowerCase()) {
      return false;
    }

    if (binding.ctrl && !event.ctrlKey) return false;
    if (binding.alt && !event.altKey) return false;
    if (binding.shift && !event.shiftKey) return false;
    if (binding.meta && !event.metaKey) return false;

    // Ensure no extra modifiers
    if (!binding.ctrl && event.ctrlKey) return false;
    if (!binding.alt && event.altKey) return false;
    if (!binding.shift && event.shiftKey) return false;
    if (!binding.meta && event.metaKey) return false;

    return true;
  }

  /**
   * Get human-readable shortcut string
   */
  static getShortcutString(binding: KeyBinding): string {
    const parts: string[] = [];

    if (binding.ctrl) parts.push('Ctrl');
    if (binding.alt) parts.push('Alt');
    if (binding.shift) parts.push('Shift');
    if (binding.meta) parts.push('Meta');
    parts.push(binding.key.toUpperCase());

    return parts.join('+');
  }
}

// Usage example
const keyManager = new KeyBindingManager();

keyManager.register('save', {
  key: 's',
  ctrl: true,
  action: () => {
    console.log('Save action triggered');
    // Implement save logic
  }
});

keyManager.register('search', {
  key: 'f',
  ctrl: true,
  shift: true,
  action: () => {
    console.log('Search action triggered');
    // Implement search logic
  }
});

keyManager.initialize();

// ============================================================================
// Example 5: Persistent Custom Shortcuts
// ============================================================================

/**
 * Save custom shortcuts to storage
 */
async function saveCustomShortcuts(shortcuts: Record<string, KeyBinding>): Promise<void> {
  await chrome.storage.sync.set({ customShortcuts: shortcuts });
}

/**
 * Load custom shortcuts from storage
 */
async function loadCustomShortcuts(): Promise<Record<string, KeyBinding>> {
  const { customShortcuts } = await chrome.storage.sync.get('customShortcuts');
  return customShortcuts || {};
}

/**
 * Apply custom shortcuts
 */
async function applyCustomShortcuts(): Promise<void> {
  const shortcuts = await loadCustomShortcuts();
  const manager = new KeyBindingManager();

  for (const [id, binding] of Object.entries(shortcuts)) {
    manager.register(id, binding);
  }

  manager.initialize();
}

// ============================================================================
// Example 6: Shortcut Conflict Detection
// ============================================================================

/**
 * Check for shortcut conflicts
 */
function hasConflict(binding1: KeyBinding, binding2: KeyBinding): boolean {
  return (
    binding1.key === binding2.key &&
    binding1.ctrl === binding2.ctrl &&
    binding1.alt === binding2.alt &&
    binding1.shift === binding2.shift &&
    binding1.meta === binding2.meta
  );
}

/**
 * Detect conflicts in bindings
 */
function detectConflicts(bindings: Record<string, KeyBinding>): string[][] {
  const conflicts: string[][] = [];
  const ids = Object.keys(bindings);

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const id1 = ids[i];
      const id2 = ids[j];

      if (hasConflict(bindings[id1], bindings[id2])) {
        conflicts.push([id1, id2]);
      }
    }
  }

  return conflicts;
}

// ============================================================================
// Example 7: Platform-Specific Shortcuts
// ============================================================================

/**
 * Get platform-specific modifier key
 */
function getPlatformModifier(): 'ctrl' | 'meta' {
  return navigator.platform.toLowerCase().includes('mac') ? 'meta' : 'ctrl';
}

/**
 * Create platform-aware binding
 */
function createPlatformBinding(
  key: string,
  usePrimaryModifier: boolean,
  action: () => void
): KeyBinding {
  const modifier = getPlatformModifier();

  return {
    key,
    [modifier]: usePrimaryModifier,
    action
  };
}

// Example usage
const platformSaveBinding = createPlatformBinding('s', true, () => {
  console.log('Save with platform-appropriate modifier');
});

export {
  KeyBindingManager,
  KeyBinding,
  getAllCommands,
  saveCustomShortcuts,
  loadCustomShortcuts,
  applyCustomShortcuts,
  detectConflicts,
  getPlatformModifier,
  createPlatformBinding
};
