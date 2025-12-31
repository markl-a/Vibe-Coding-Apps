/**
 * Component Registry - Low-Code Component System
 *
 * This example demonstrates:
 * - Dynamic component registration
 * - Component lifecycle management
 * - Property schemas and validation
 * - Event handling
 * - Component composition
 * - Hot-reloading capabilities
 */

// ===========================
// Type Definitions
// ===========================

export type PropertyType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'function'
  | 'component'
  | 'slot';

export interface PropertySchema {
  name: string;
  type: PropertyType;
  required?: boolean;
  defaultValue?: unknown;
  description?: string;
  options?: unknown[];
  validation?: (value: unknown) => boolean | string;
}

export interface EventSchema {
  name: string;
  description?: string;
  payload?: Record<string, PropertyType>;
}

export interface SlotSchema {
  name: string;
  description?: string;
  allowedComponents?: string[];
}

export interface ComponentMetadata {
  id: string;
  name: string;
  version: string;
  category: string;
  description?: string;
  icon?: string;
  tags?: string[];
  author?: string;
  deprecated?: boolean;
}

export interface ComponentSchema {
  metadata: ComponentMetadata;
  properties: PropertySchema[];
  events: EventSchema[];
  slots?: SlotSchema[];
  extends?: string; // Parent component ID
}

export interface ComponentInstance {
  id: string;
  componentId: string;
  properties: Record<string, unknown>;
  children: ComponentInstance[];
  eventHandlers: Map<string, Array<(payload: unknown) => void>>;
}

export interface ComponentConfig {
  id: string;
  schema: ComponentSchema;
  render: (props: Record<string, unknown>, children: ComponentInstance[]) => unknown;
  onCreate?: (instance: ComponentInstance) => void;
  onUpdate?: (instance: ComponentInstance, changedProps: string[]) => void;
  onDestroy?: (instance: ComponentInstance) => void;
}

// ===========================
// Component Registry
// ===========================

export class ComponentRegistry {
  private components: Map<string, ComponentConfig> = new Map();
  private instances: Map<string, ComponentInstance> = new Map();
  private listeners: Map<string, Set<(event: RegistryEvent) => void>> = new Map();
  private nextInstanceId = 1;

  // Register a new component
  register(config: ComponentConfig): void {
    if (this.components.has(config.id)) {
      console.warn(`Component ${config.id} already registered, replacing...`);
    }

    // Validate schema
    this.validateSchema(config.schema);

    // Register component
    this.components.set(config.id, config);

    // Emit event
    this.emit('componentRegistered', { componentId: config.id });

    console.log(`Registered component: ${config.id}`);
  }

  // Unregister a component
  unregister(componentId: string): void {
    if (!this.components.has(componentId)) {
      throw new Error(`Component ${componentId} not found`);
    }

    // Check if any instances exist
    const instanceCount = Array.from(this.instances.values()).filter(
      (i) => i.componentId === componentId
    ).length;

    if (instanceCount > 0) {
      throw new Error(
        `Cannot unregister component ${componentId}: ${instanceCount} instances still exist`
      );
    }

    this.components.delete(componentId);
    this.emit('componentUnregistered', { componentId });

    console.log(`Unregistered component: ${componentId}`);
  }

  // Get component configuration
  getComponent(componentId: string): ComponentConfig | undefined {
    return this.components.get(componentId);
  }

  // Get all registered components
  getAllComponents(): ComponentConfig[] {
    return Array.from(this.components.values());
  }

  // Get components by category
  getComponentsByCategory(category: string): ComponentConfig[] {
    return Array.from(this.components.values()).filter(
      (c) => c.schema.metadata.category === category
    );
  }

  // Search components
  searchComponents(query: string): ComponentConfig[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.components.values()).filter((c) => {
      const metadata = c.schema.metadata;
      return (
        metadata.name.toLowerCase().includes(lowerQuery) ||
        metadata.description?.toLowerCase().includes(lowerQuery) ||
        metadata.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
      );
    });
  }

  // Create component instance
  createInstance(
    componentId: string,
    properties: Record<string, unknown> = {}
  ): ComponentInstance {
    const component = this.components.get(componentId);
    if (!component) {
      throw new Error(`Component ${componentId} not found`);
    }

    // Validate properties
    this.validateProperties(component.schema, properties);

    // Apply default values
    const finalProps = this.applyDefaults(component.schema, properties);

    // Create instance
    const instance: ComponentInstance = {
      id: this.generateInstanceId(),
      componentId,
      properties: finalProps,
      children: [],
      eventHandlers: new Map(),
    };

    this.instances.set(instance.id, instance);

    // Call lifecycle hook
    if (component.onCreate) {
      component.onCreate(instance);
    }

    this.emit('instanceCreated', { instanceId: instance.id, componentId });

    return instance;
  }

  // Update component instance
  updateInstance(
    instanceId: string,
    properties: Record<string, unknown>
  ): void {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    const component = this.components.get(instance.componentId);
    if (!component) {
      throw new Error(`Component ${instance.componentId} not found`);
    }

    // Validate new properties
    this.validateProperties(component.schema, properties);

    // Track changed properties
    const changedProps = Object.keys(properties).filter(
      (key) => instance.properties[key] !== properties[key]
    );

    // Update properties
    instance.properties = { ...instance.properties, ...properties };

    // Call lifecycle hook
    if (component.onUpdate && changedProps.length > 0) {
      component.onUpdate(instance, changedProps);
    }

    this.emit('instanceUpdated', {
      instanceId,
      changedProps,
    });
  }

  // Destroy component instance
  destroyInstance(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    const component = this.components.get(instance.componentId);

    // Destroy children first
    [...instance.children].forEach((child) => {
      this.destroyInstance(child.id);
    });

    // Call lifecycle hook
    if (component?.onDestroy) {
      component.onDestroy(instance);
    }

    // Remove instance
    this.instances.delete(instanceId);

    this.emit('instanceDestroyed', { instanceId });
  }

  // Get instance
  getInstance(instanceId: string): ComponentInstance | undefined {
    return this.instances.get(instanceId);
  }

  // Add child to instance
  addChild(parentId: string, child: ComponentInstance): void {
    const parent = this.instances.get(parentId);
    if (!parent) {
      throw new Error(`Parent instance ${parentId} not found`);
    }

    parent.children.push(child);
    this.emit('childAdded', { parentId, childId: child.id });
  }

  // Remove child from instance
  removeChild(parentId: string, childId: string): void {
    const parent = this.instances.get(parentId);
    if (!parent) {
      throw new Error(`Parent instance ${parentId} not found`);
    }

    const index = parent.children.findIndex((c) => c.id === childId);
    if (index !== -1) {
      parent.children.splice(index, 1);
      this.emit('childRemoved', { parentId, childId });
    }
  }

  // Render component instance
  render(instanceId: string): unknown {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    const component = this.components.get(instance.componentId);
    if (!component) {
      throw new Error(`Component ${instance.componentId} not found`);
    }

    return component.render(instance.properties, instance.children);
  }

  // Event handling
  addEventListener(
    instanceId: string,
    eventName: string,
    handler: (payload: unknown) => void
  ): void {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    if (!instance.eventHandlers.has(eventName)) {
      instance.eventHandlers.set(eventName, []);
    }

    instance.eventHandlers.get(eventName)!.push(handler);
  }

  emitEvent(instanceId: string, eventName: string, payload: unknown): void {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    const handlers = instance.eventHandlers.get(eventName);
    if (handlers) {
      handlers.forEach((handler) => handler(payload));
    }
  }

  // Validation methods
  private validateSchema(schema: ComponentSchema): void {
    if (!schema.metadata.id || !schema.metadata.name) {
      throw new Error('Component must have id and name');
    }

    // Validate properties
    schema.properties.forEach((prop) => {
      if (!prop.name || !prop.type) {
        throw new Error('Property must have name and type');
      }
    });
  }

  private validateProperties(
    schema: ComponentSchema,
    properties: Record<string, unknown>
  ): void {
    // Check required properties
    schema.properties
      .filter((p) => p.required)
      .forEach((prop) => {
        if (properties[prop.name] === undefined) {
          throw new Error(`Required property ${prop.name} is missing`);
        }
      });

    // Validate property types and values
    Object.entries(properties).forEach(([key, value]) => {
      const propSchema = schema.properties.find((p) => p.name === key);
      if (!propSchema) {
        console.warn(`Unknown property: ${key}`);
        return;
      }

      // Type validation
      if (!this.isValidType(value, propSchema.type)) {
        throw new Error(
          `Property ${key} has invalid type. Expected ${propSchema.type}`
        );
      }

      // Custom validation
      if (propSchema.validation) {
        const result = propSchema.validation(value);
        if (result !== true) {
          throw new Error(
            typeof result === 'string'
              ? result
              : `Validation failed for property ${key}`
          );
        }
      }
    });
  }

  private isValidType(value: unknown, type: PropertyType): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      case 'function':
        return typeof value === 'function';
      default:
        return true;
    }
  }

  private applyDefaults(
    schema: ComponentSchema,
    properties: Record<string, unknown>
  ): Record<string, unknown> {
    const result = { ...properties };

    schema.properties.forEach((prop) => {
      if (result[prop.name] === undefined && prop.defaultValue !== undefined) {
        result[prop.name] = prop.defaultValue;
      }
    });

    return result;
  }

  private generateInstanceId(): string {
    return `instance_${this.nextInstanceId++}`;
  }

  // Registry events
  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((listener) => {
      listener(data as RegistryEvent);
    });
  }

  on(event: string, listener: (event: RegistryEvent) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: (event: RegistryEvent) => void): void {
    this.listeners.get(event)?.delete(listener);
  }
}

export type RegistryEvent = Record<string, unknown>;

// ===========================
// Component Builder Helper
// ===========================

export class ComponentBuilder {
  private config: Partial<ComponentConfig>;
  private properties: PropertySchema[] = [];
  private events: EventSchema[] = [];
  private slots: SlotSchema[] = [];

  constructor(id: string, name: string, category: string) {
    this.config = {
      id,
      schema: {
        metadata: {
          id,
          name,
          category,
          version: '1.0.0',
        },
        properties: [],
        events: [],
        slots: [],
      },
    };
  }

  version(version: string): this {
    this.config.schema!.metadata.version = version;
    return this;
  }

  description(desc: string): this {
    this.config.schema!.metadata.description = desc;
    return this;
  }

  icon(icon: string): this {
    this.config.schema!.metadata.icon = icon;
    return this;
  }

  tags(...tags: string[]): this {
    this.config.schema!.metadata.tags = tags;
    return this;
  }

  property(schema: PropertySchema): this {
    this.properties.push(schema);
    return this;
  }

  event(schema: EventSchema): this {
    this.events.push(schema);
    return this;
  }

  slot(schema: SlotSchema): this {
    this.slots.push(schema);
    return this;
  }

  onCreate(handler: (instance: ComponentInstance) => void): this {
    this.config.onCreate = handler;
    return this;
  }

  onUpdate(handler: (instance: ComponentInstance, changedProps: string[]) => void): this {
    this.config.onUpdate = handler;
    return this;
  }

  onDestroy(handler: (instance: ComponentInstance) => void): this {
    this.config.onDestroy = handler;
    return this;
  }

  render(handler: (props: Record<string, unknown>, children: ComponentInstance[]) => unknown): this {
    this.config.render = handler;
    return this;
  }

  build(): ComponentConfig {
    if (!this.config.render) {
      throw new Error('Component must have a render function');
    }

    this.config.schema!.properties = this.properties;
    this.config.schema!.events = this.events;
    this.config.schema!.slots = this.slots;

    return this.config as ComponentConfig;
  }
}

// ===========================
// Usage Examples
// ===========================

export function example1_BasicComponents() {
  console.log('\n=== Example 1: Basic Component Registration ===\n');

  const registry = new ComponentRegistry();

  // Register a Button component
  const buttonComponent = new ComponentBuilder('button', 'Button', 'input')
    .description('A clickable button component')
    .icon('🔘')
    .tags('interactive', 'input', 'form')
    .property({
      name: 'label',
      type: 'string',
      required: true,
      description: 'Button text',
    })
    .property({
      name: 'variant',
      type: 'string',
      defaultValue: 'primary',
      options: ['primary', 'secondary', 'danger'],
      description: 'Button style variant',
    })
    .property({
      name: 'disabled',
      type: 'boolean',
      defaultValue: false,
    })
    .event({
      name: 'click',
      description: 'Fired when button is clicked',
    })
    .onCreate((instance) => {
      console.log(`Button created: ${instance.id}`);
    })
    .render((props) => {
      return `<button class="${props.variant}" disabled="${props.disabled}">${props.label}</button>`;
    })
    .build();

  registry.register(buttonComponent);

  // Create button instance
  const button = registry.createInstance('button', {
    label: 'Click Me',
    variant: 'primary',
  });

  console.log('Button Instance:', button);
  console.log('Rendered:', registry.render(button.id));

  // Update button
  registry.updateInstance(button.id, { label: 'Updated Button' });
  console.log('Updated Render:', registry.render(button.id));
}

export function example2_CompositeComponents() {
  console.log('\n=== Example 2: Composite Components ===\n');

  const registry = new ComponentRegistry();

  // Register Text Input
  const textInput = new ComponentBuilder('text-input', 'Text Input', 'input')
    .property({
      name: 'value',
      type: 'string',
      defaultValue: '',
    })
    .property({
      name: 'placeholder',
      type: 'string',
    })
    .event({ name: 'change' })
    .render((props) => `<input type="text" value="${props.value}" placeholder="${props.placeholder || ''}" />`)
    .build();

  // Register Label
  const label = new ComponentBuilder('label', 'Label', 'display')
    .property({ name: 'text', type: 'string', required: true })
    .render((props) => `<label>${props.text}</label>`)
    .build();

  // Register Form Field (composite)
  const formField = new ComponentBuilder('form-field', 'Form Field', 'composite')
    .description('A labeled form field with validation')
    .property({ name: 'label', type: 'string', required: true })
    .property({ name: 'required', type: 'boolean', defaultValue: false })
    .property({ name: 'error', type: 'string' })
    .slot({ name: 'input', description: 'Input component' })
    .render((props, children) => {
      const errorHtml = props.error ? `<span class="error">${props.error}</span>` : '';
      const requiredMark = props.required ? '<span class="required">*</span>' : '';

      return `
        <div class="form-field">
          <label>${props.label}${requiredMark}</label>
          ${children.map((c) => registry.render(c.id)).join('')}
          ${errorHtml}
        </div>
      `;
    })
    .build();

  registry.register(textInput);
  registry.register(label);
  registry.register(formField);

  // Create composite component
  const field = registry.createInstance('form-field', {
    label: 'Email Address',
    required: true,
  });

  const input = registry.createInstance('text-input', {
    placeholder: 'your@email.com',
  });

  registry.addChild(field.id, input);

  console.log('Form Field Rendered:');
  console.log(registry.render(field.id));
}

export function example3_ComponentLifecycle() {
  console.log('\n=== Example 3: Component Lifecycle ===\n');

  const registry = new ComponentRegistry();

  let createCount = 0;
  let updateCount = 0;
  let destroyCount = 0;

  const counter = new ComponentBuilder('counter', 'Counter', 'display')
    .property({ name: 'value', type: 'number', defaultValue: 0 })
    .property({
      name: 'min',
      type: 'number',
      defaultValue: 0,
      validation: (value) => {
        return typeof value === 'number' && value >= 0
          ? true
          : 'Min value must be a positive number';
      },
    })
    .property({ name: 'max', type: 'number', defaultValue: 100 })
    .event({ name: 'increment' })
    .event({ name: 'decrement' })
    .onCreate((instance) => {
      createCount++;
      console.log(`Counter created (total: ${createCount})`);
    })
    .onUpdate((instance, changedProps) => {
      updateCount++;
      console.log(`Counter updated. Changed: ${changedProps.join(', ')}`);
      console.log(`  Current value: ${instance.properties.value}`);
    })
    .onDestroy((instance) => {
      destroyCount++;
      console.log(`Counter destroyed (total: ${destroyCount})`);
    })
    .render((props) => {
      return `<div class="counter">Value: ${props.value}</div>`;
    })
    .build();

  registry.register(counter);

  // Create and manipulate instances
  const counter1 = registry.createInstance('counter', { value: 5 });
  const counter2 = registry.createInstance('counter', { value: 10 });

  console.log('\nUpdating counters...');
  registry.updateInstance(counter1.id, { value: 6 });
  registry.updateInstance(counter2.id, { value: 11 });

  console.log('\nDestroying counters...');
  registry.destroyInstance(counter1.id);
  registry.destroyInstance(counter2.id);

  console.log('\nLifecycle Summary:');
  console.log(`  Created: ${createCount}`);
  console.log(`  Updated: ${updateCount}`);
  console.log(`  Destroyed: ${destroyCount}`);
}

export function example4_EventHandling() {
  console.log('\n=== Example 4: Event Handling ===\n');

  const registry = new ComponentRegistry();

  const clickableCard = new ComponentBuilder('clickable-card', 'Clickable Card', 'display')
    .property({ name: 'title', type: 'string', required: true })
    .property({ name: 'description', type: 'string' })
    .event({
      name: 'click',
      payload: { x: 'number', y: 'number' },
    })
    .event({ name: 'hover' })
    .render((props) => `
      <div class="card">
        <h3>${props.title}</h3>
        <p>${props.description || ''}</p>
      </div>
    `)
    .build();

  registry.register(clickableCard);

  const card = registry.createInstance('clickable-card', {
    title: 'Interactive Card',
    description: 'Click me to see events!',
  });

  // Add event listeners
  registry.addEventListener(card.id, 'click', (payload) => {
    console.log('Card clicked:', payload);
  });

  registry.addEventListener(card.id, 'hover', () => {
    console.log('Card hovered');
  });

  // Simulate events
  console.log('Simulating events...');
  registry.emitEvent(card.id, 'click', { x: 100, y: 200 });
  registry.emitEvent(card.id, 'hover', null);
}

export function example5_ComponentSearch() {
  console.log('\n=== Example 5: Component Search and Discovery ===\n');

  const registry = new ComponentRegistry();

  // Register multiple components
  [
    { id: 'btn-primary', name: 'Primary Button', category: 'button', tags: ['input', 'action'] },
    { id: 'btn-secondary', name: 'Secondary Button', category: 'button', tags: ['input', 'action'] },
    { id: 'text-input', name: 'Text Input', category: 'input', tags: ['form', 'text'] },
    { id: 'number-input', name: 'Number Input', category: 'input', tags: ['form', 'number'] },
    { id: 'card', name: 'Card', category: 'layout', tags: ['container', 'display'] },
  ].forEach((meta) => {
    const component = new ComponentBuilder(meta.id, meta.name, meta.category)
      .tags(...meta.tags)
      .render(() => `<${meta.id} />`)
      .build();

    registry.register(component);
  });

  console.log('Total components:', registry.getAllComponents().length);
  console.log('\nButtons:', registry.getComponentsByCategory('button').map((c) => c.id));
  console.log('Inputs:', registry.getComponentsByCategory('input').map((c) => c.id));

  console.log('\nSearch "button":', registry.searchComponents('button').map((c) => c.id));
  console.log('Search "form":', registry.searchComponents('form').map((c) => c.id));
}

// Run examples
if (require.main === module) {
  example1_BasicComponents();
  example2_CompositeComponents();
  example3_ComponentLifecycle();
  example4_EventHandling();
  example5_ComponentSearch();
}
