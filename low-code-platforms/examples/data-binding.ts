/**
 * Two-Way Data Binding System - Low-Code Data Management
 *
 * This example demonstrates:
 * - Reactive data binding
 * - Observable state management
 * - Computed properties
 * - Watchers and listeners
 * - Deep object observation
 * - Dependency tracking
 */

// ===========================
// Type Definitions
// ===========================

export type WatchCallback<T = unknown> = (
  newValue: T,
  oldValue: T,
  path: string
) => void;

export type ComputedFunction<T = unknown> = () => T;

export interface BindingOptions {
  deep?: boolean;
  immediate?: boolean;
  debounce?: number;
}

export interface ComputedOptions<T> {
  get: () => T;
  set?: (value: T) => void;
  cache?: boolean;
}

export interface DataBinding {
  path: string;
  element?: unknown;
  attribute?: string;
  transformer?: (value: unknown) => unknown;
}

// ===========================
// Observable Data Store
// ===========================

export class ObservableStore {
  private data: Record<string, unknown> = {};
  private watchers: Map<string, Set<WatchCallback>> = new Map();
  private computed: Map<string, ComputedOptions<unknown>> = new Map();
  private computedCache: Map<string, unknown> = new Map();
  private dependencies: Map<string, Set<string>> = new Map();
  private currentComputing?: string;

  constructor(initialData: Record<string, unknown> = {}) {
    this.data = this.makeReactive(initialData);
  }

  // Make an object reactive
  private makeReactive<T extends Record<string, unknown>>(obj: T, path = ''): T {
    const self = this;

    return new Proxy(obj, {
      get(target, prop: string) {
        const fullPath = path ? `${path}.${prop}` : prop;

        // Track dependency for computed properties
        if (self.currentComputing) {
          if (!self.dependencies.has(self.currentComputing)) {
            self.dependencies.set(self.currentComputing, new Set());
          }
          self.dependencies.get(self.currentComputing)!.add(fullPath);
        }

        const value = target[prop];

        // Make nested objects reactive
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return self.makeReactive(value as Record<string, unknown>, fullPath);
        }

        return value;
      },

      set(target, prop: string, value) {
        const fullPath = path ? `${path}.${prop}` : prop;
        const oldValue = target[prop];

        if (oldValue === value) {
          return true;
        }

        target[prop] = value;

        // Notify watchers
        self.notifyWatchers(fullPath, value, oldValue);

        // Invalidate computed properties that depend on this value
        self.invalidateComputed(fullPath);

        return true;
      },
    });
  }

  // Get value at path
  get<T = unknown>(path: string): T {
    return this.getValueAtPath(this.data, path) as T;
  }

  // Set value at path
  set(path: string, value: unknown): void {
    this.setValueAtPath(this.data, path, value);
  }

  // Watch for changes
  watch<T = unknown>(
    path: string,
    callback: WatchCallback<T>,
    options: BindingOptions = {}
  ): () => void {
    if (!this.watchers.has(path)) {
      this.watchers.set(path, new Set());
    }

    let wrappedCallback = callback;

    // Add debouncing if specified
    if (options.debounce) {
      wrappedCallback = this.debounce(callback, options.debounce);
    }

    this.watchers.get(path)!.add(wrappedCallback as WatchCallback);

    // Call immediately if specified
    if (options.immediate) {
      const value = this.get(path);
      callback(value as T, value as T, path);
    }

    // Return unwatch function
    return () => {
      this.watchers.get(path)?.delete(wrappedCallback as WatchCallback);
    };
  }

  // Define computed property
  defineComputed<T>(name: string, options: ComputedOptions<T>): void {
    this.computed.set(name, options as ComputedOptions<unknown>);

    // Calculate initial value and track dependencies
    const value = this.computeValue(name);

    // Make computed value accessible
    Object.defineProperty(this.data, name, {
      get: () => {
        if (options.cache !== false) {
          if (!this.computedCache.has(name)) {
            this.computedCache.set(name, this.computeValue(name));
          }
          return this.computedCache.get(name);
        }
        return this.computeValue(name);
      },
      set: (value: T) => {
        if (options.set) {
          options.set(value);
        } else {
          console.warn(`Computed property ${name} is read-only`);
        }
      },
      enumerable: true,
      configurable: true,
    });
  }

  // Compute value and track dependencies
  private computeValue(name: string): unknown {
    const options = this.computed.get(name);
    if (!options) return undefined;

    // Track dependencies during computation
    this.currentComputing = name;
    this.dependencies.set(name, new Set());

    const value = options.get();

    this.currentComputing = undefined;

    return value;
  }

  // Invalidate computed property cache
  private invalidateComputed(path: string): void {
    // Find all computed properties that depend on this path
    for (const [computedName, deps] of this.dependencies.entries()) {
      if (deps.has(path) || Array.from(deps).some((dep) => path.startsWith(dep))) {
        this.computedCache.delete(computedName);

        // Notify watchers of the computed property
        const newValue = this.get(computedName);
        this.notifyWatchers(computedName, newValue, undefined);
      }
    }
  }

  // Notify watchers
  private notifyWatchers(path: string, newValue: unknown, oldValue: unknown): void {
    // Notify exact path watchers
    this.watchers.get(path)?.forEach((callback) => {
      callback(newValue, oldValue, path);
    });

    // Notify parent watchers (for deep watching)
    const parts = path.split('.');
    for (let i = parts.length - 1; i > 0; i--) {
      const parentPath = parts.slice(0, i).join('.');
      this.watchers.get(parentPath)?.forEach((callback) => {
        callback(newValue, oldValue, path);
      });
    }
  }

  // Helper: Get value at path
  private getValueAtPath(obj: unknown, path: string): unknown {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  // Helper: Set value at path
  private setValueAtPath(obj: Record<string, unknown>, path: string, value: unknown): void {
    const parts = path.split('.');
    const last = parts.pop()!;
    let current = obj;

    for (const part of parts) {
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    current[last] = value;
  }

  // Helper: Debounce function
  private debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): T {
    let timeout: NodeJS.Timeout | undefined;

    return ((...args: unknown[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    }) as T;
  }

  // Get all data
  getData(): Record<string, unknown> {
    return { ...this.data };
  }

  // Reset data
  reset(newData: Record<string, unknown> = {}): void {
    Object.keys(this.data).forEach((key) => {
      delete this.data[key];
    });

    Object.assign(this.data, this.makeReactive(newData));
    this.computedCache.clear();
  }
}

// ===========================
// Data Binder
// ===========================

export class DataBinder {
  private store: ObservableStore;
  private bindings: Map<string, Set<DataBinding>> = new Map();

  constructor(store: ObservableStore) {
    this.store = store;
  }

  // Bind data to element
  bind(
    path: string,
    element: unknown,
    attribute: string,
    transformer?: (value: unknown) => unknown
  ): () => void {
    const binding: DataBinding = {
      path,
      element,
      attribute,
      transformer,
    };

    if (!this.bindings.has(path)) {
      this.bindings.set(path, new Set());
    }

    this.bindings.get(path)!.add(binding);

    // Set initial value
    this.updateBinding(binding, this.store.get(path));

    // Watch for changes
    const unwatch = this.store.watch(path, (newValue) => {
      this.updateBinding(binding, newValue);
    });

    // Return unbind function
    return () => {
      this.bindings.get(path)?.delete(binding);
      unwatch();
    };
  }

  // Two-way binding
  bindTwoWay(
    path: string,
    element: Record<string, unknown>,
    attribute: string,
    eventName = 'change'
  ): () => void {
    // Bind data to element
    const unbindOne = this.bind(path, element, attribute);

    // Bind element to data
    const handler = () => {
      const value = element[attribute];
      this.store.set(path, value);
    };

    // Simulate event listener (in real implementation, use actual DOM events)
    element[`on${eventName}`] = handler;

    // Return unbind function
    return () => {
      unbindOne();
      delete element[`on${eventName}`];
    };
  }

  // Update binding
  private updateBinding(binding: DataBinding, value: unknown): void {
    const finalValue = binding.transformer ? binding.transformer(value) : value;

    if (binding.element && binding.attribute) {
      (binding.element as Record<string, unknown>)[binding.attribute] = finalValue;
    }
  }

  // Unbind all bindings for a path
  unbind(path: string): void {
    this.bindings.delete(path);
  }

  // Clear all bindings
  clear(): void {
    this.bindings.clear();
  }
}

// ===========================
// Template Binding Engine
// ===========================

export class TemplateBindingEngine {
  private store: ObservableStore;
  private templates: Map<string, string> = new Map();
  private renderedTemplates: Map<string, string> = new Map();

  constructor(store: ObservableStore) {
    this.store = store;
  }

  // Register template
  registerTemplate(id: string, template: string): void {
    this.templates.set(id, template);
  }

  // Render template with bindings
  render(templateId: string): string {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Replace {{path}} with values from store
    const rendered = template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.store.get(path.trim());
      return String(value ?? '');
    });

    this.renderedTemplates.set(templateId, rendered);
    return rendered;
  }

  // Watch template and re-render on changes
  watchTemplate(templateId: string, onChange: (rendered: string) => void): () => void {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Extract all binding paths from template
    const paths = this.extractBindingPaths(template);

    // Watch all paths
    const unwatchers = paths.map((path) =>
      this.store.watch(path, () => {
        const rendered = this.render(templateId);
        onChange(rendered);
      })
    );

    // Initial render
    onChange(this.render(templateId));

    // Return unwatch function
    return () => {
      unwatchers.forEach((unwatch) => unwatch());
    };
  }

  // Extract binding paths from template
  private extractBindingPaths(template: string): string[] {
    const matches = template.matchAll(/\{\{([^}]+)\}\}/g);
    return Array.from(matches).map((m) => m[1].trim());
  }
}

// ===========================
// Usage Examples
// ===========================

export function example1_BasicReactivity() {
  console.log('\n=== Example 1: Basic Reactive Data ===\n');

  const store = new ObservableStore({
    user: {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
    },
  });

  // Watch for changes
  store.watch('user.name', (newValue, oldValue) => {
    console.log(`Name changed from "${oldValue}" to "${newValue}"`);
  });

  store.watch('user.age', (newValue, oldValue) => {
    console.log(`Age changed from ${oldValue} to ${newValue}`);
  });

  // Make changes
  store.set('user.name', 'Jane Smith');
  store.set('user.age', 31);

  console.log('\nFinal user data:', store.get('user'));
}

export function example2_ComputedProperties() {
  console.log('\n=== Example 2: Computed Properties ===\n');

  const store = new ObservableStore({
    firstName: 'John',
    lastName: 'Doe',
    cart: {
      items: [
        { name: 'Product A', price: 10, quantity: 2 },
        { name: 'Product B', price: 20, quantity: 1 },
      ],
    },
  });

  // Define computed property: full name
  store.defineComputed('fullName', {
    get: () => {
      const first = store.get<string>('firstName');
      const last = store.get<string>('lastName');
      return `${first} ${last}`;
    },
    set: (value: string) => {
      const [first, last] = String(value).split(' ');
      store.set('firstName', first);
      store.set('lastName', last);
    },
  });

  // Define computed property: cart total
  store.defineComputed('cartTotal', {
    get: () => {
      const cart = store.get<{ items: Array<{ price: number; quantity: number }> }>('cart');
      return cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },
    cache: true,
  });

  console.log('Full Name:', store.get('fullName'));
  console.log('Cart Total:', store.get('cartTotal'));

  // Watch computed property
  store.watch('fullName', (newValue) => {
    console.log('Full name changed to:', newValue);
  });

  store.watch('cartTotal', (newValue) => {
    console.log('Cart total changed to:', newValue);
  });

  // Update base values
  console.log('\nUpdating firstName...');
  store.set('firstName', 'Jane');

  console.log('\nAdding item to cart...');
  const items = store.get<Array<{ name: string; price: number; quantity: number }>>('cart.items');
  items.push({ name: 'Product C', price: 15, quantity: 3 });
  store.set('cart.items', items);

  console.log('\nFinal cart total:', store.get('cartTotal'));
}

export function example3_DataBinding() {
  console.log('\n=== Example 3: Data Binding ===\n');

  const store = new ObservableStore({
    username: 'johndoe',
    email: 'john@example.com',
    isActive: true,
  });

  const binder = new DataBinder(store);

  // Simulate DOM elements
  const usernameInput = { value: '' };
  const emailInput = { value: '' };
  const statusLabel = { textContent: '' };

  // Bind data to elements
  binder.bind('username', usernameInput, 'value');
  binder.bind('email', emailInput, 'value');
  binder.bind(
    'isActive',
    statusLabel,
    'textContent',
    (value) => (value ? 'Active' : 'Inactive')
  );

  console.log('Initial bindings:');
  console.log('  Username input:', usernameInput.value);
  console.log('  Email input:', emailInput.value);
  console.log('  Status label:', statusLabel.textContent);

  // Update store values
  console.log('\nUpdating store values...');
  store.set('username', 'janedoe');
  store.set('email', 'jane@example.com');
  store.set('isActive', false);

  console.log('\nUpdated bindings:');
  console.log('  Username input:', usernameInput.value);
  console.log('  Email input:', emailInput.value);
  console.log('  Status label:', statusLabel.textContent);
}

export function example4_TwoWayBinding() {
  console.log('\n=== Example 4: Two-Way Data Binding ===\n');

  const store = new ObservableStore({
    formData: {
      name: 'John',
      message: 'Hello World',
    },
  });

  const binder = new DataBinder(store);

  // Simulate form elements
  const nameInput = { value: '', onchange: undefined as (() => void) | undefined };
  const messageTextarea = { value: '', onchange: undefined as (() => void) | undefined };

  // Two-way binding
  binder.bindTwoWay('formData.name', nameInput, 'value', 'change');
  binder.bindTwoWay('formData.message', messageTextarea, 'value', 'change');

  console.log('Initial state:');
  console.log('  Store:', store.get('formData'));
  console.log('  Name input:', nameInput.value);
  console.log('  Message textarea:', messageTextarea.value);

  // Simulate user input
  console.log('\nSimulating user input...');
  nameInput.value = 'Jane Smith';
  nameInput.onchange?.();

  messageTextarea.value = 'Updated message';
  messageTextarea.onchange?.();

  console.log('\nAfter user input:');
  console.log('  Store:', store.get('formData'));

  // Update from store
  console.log('\nUpdating from store...');
  store.set('formData.name', 'Bob Johnson');

  console.log('\nAfter store update:');
  console.log('  Name input:', nameInput.value);
}

export function example5_TemplateBinding() {
  console.log('\n=== Example 5: Template Binding ===\n');

  const store = new ObservableStore({
    user: {
      name: 'John Doe',
      role: 'Developer',
    },
    stats: {
      tasks: 12,
      completed: 8,
    },
  });

  // Define computed property for completion percentage
  store.defineComputed('completionPercentage', {
    get: () => {
      const stats = store.get<{ tasks: number; completed: number }>('stats');
      if (stats.tasks === 0) return 0;
      return Math.round((stats.completed / stats.tasks) * 100);
    },
  });

  const engine = new TemplateBindingEngine(store);

  // Register template
  engine.registerTemplate(
    'user-dashboard',
    `
    <div class="dashboard">
      <h1>Welcome, {{user.name}}!</h1>
      <p>Role: {{user.role}}</p>
      <div class="stats">
        <p>Tasks: {{stats.completed}}/{{stats.tasks}}</p>
        <p>Completion: {{completionPercentage}}%</p>
      </div>
    </div>
  `
  );

  // Watch and render template
  let renderCount = 0;
  engine.watchTemplate('user-dashboard', (rendered) => {
    renderCount++;
    console.log(`\nRender #${renderCount}:`);
    console.log(rendered.trim());
  });

  // Update values
  setTimeout(() => {
    console.log('\n--- Updating user name ---');
    store.set('user.name', 'Jane Smith');
  }, 100);

  setTimeout(() => {
    console.log('\n--- Completing tasks ---');
    store.set('stats.completed', 10);
  }, 200);
}

export function example6_DebouncedWatchers() {
  console.log('\n=== Example 6: Debounced Watchers ===\n');

  const store = new ObservableStore({
    searchQuery: '',
  });

  let searchCount = 0;

  // Watch with debouncing
  store.watch(
    'searchQuery',
    (newValue) => {
      searchCount++;
      console.log(`Performing search for: "${newValue}" (search #${searchCount})`);
    },
    { debounce: 300 }
  );

  // Simulate rapid typing
  console.log('Simulating rapid typing...');
  store.set('searchQuery', 'h');
  store.set('searchQuery', 'he');
  store.set('searchQuery', 'hel');
  store.set('searchQuery', 'hell');
  store.set('searchQuery', 'hello');

  setTimeout(() => {
    console.log('\nOnly the last search was executed (debounced)');
  }, 500);
}

// Run examples
if (require.main === module) {
  example1_BasicReactivity();
  example2_ComputedProperties();
  example3_DataBinding();
  example4_TwoWayBinding();
  example5_TemplateBinding();
  example6_DebouncedWatchers();
}
