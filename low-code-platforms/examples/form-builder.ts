/**
 * Dynamic Form Builder - Low-Code Form Generation
 *
 * This example demonstrates:
 * - Schema-driven form generation
 * - Dynamic field types and validation
 * - Conditional field visibility
 * - Custom field renderers
 * - Form state management
 * - Auto-save functionality
 */

// ===========================
// Type Definitions
// ===========================

export type FieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'textarea'
  | 'file'
  | 'custom';

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: string | number | RegExp;
  message: string;
  validator?: (value: unknown) => boolean;
}

export interface FieldOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface ConditionalLogic {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  value: unknown;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  defaultValue?: unknown;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  validation?: ValidationRule[];
  options?: FieldOption[];
  showIf?: ConditionalLogic[];
  customRender?: (field: FormField, value: unknown) => string;
  metadata?: Record<string, unknown>;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export interface FormSchema {
  id: string;
  title: string;
  description?: string;
  sections: FormSection[];
  submitLabel?: string;
  cancelLabel?: string;
  autoSave?: boolean;
  autoSaveInterval?: number;
}

export interface FormData {
  [fieldName: string]: unknown;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState {
  data: FormData;
  errors: ValidationError[];
  touched: Set<string>;
  dirty: boolean;
  submitting: boolean;
  submitted: boolean;
}

// ===========================
// Form Builder Class
// ===========================

export class FormBuilder {
  private schema: Partial<FormSchema>;
  private sections: FormSection[] = [];

  constructor(id: string, title: string) {
    this.schema = {
      id,
      title,
      submitLabel: 'Submit',
      cancelLabel: 'Cancel',
      autoSave: false,
    };
  }

  description(desc: string): this {
    this.schema.description = desc;
    return this;
  }

  autoSave(enabled: boolean, intervalMs = 3000): this {
    this.schema.autoSave = enabled;
    this.schema.autoSaveInterval = intervalMs;
    return this;
  }

  submitLabel(label: string): this {
    this.schema.submitLabel = label;
    return this;
  }

  section(id: string, title: string, config?: {
    description?: string;
    collapsible?: boolean;
    defaultExpanded?: boolean;
  }): SectionBuilder {
    const builder = new SectionBuilder(id, title, config);
    this.sections.push(builder.getSection());
    return builder;
  }

  build(): FormSchema {
    if (this.sections.length === 0) {
      throw new Error('Form must have at least one section');
    }

    return {
      ...this.schema,
      sections: this.sections,
    } as FormSchema;
  }
}

// ===========================
// Section Builder Class
// ===========================

export class SectionBuilder {
  private section: FormSection;

  constructor(id: string, title: string, config?: {
    description?: string;
    collapsible?: boolean;
    defaultExpanded?: boolean;
  }) {
    this.section = {
      id,
      title,
      fields: [],
      description: config?.description,
      collapsible: config?.collapsible ?? false,
      defaultExpanded: config?.defaultExpanded ?? true,
    };
  }

  field(config: Omit<FormField, 'id'> & { id?: string }): this {
    const field: FormField = {
      id: config.id || config.name,
      ...config,
    } as FormField;
    this.section.fields.push(field);
    return this;
  }

  textField(name: string, label: string, config?: Partial<FormField>): this {
    return this.field({ name, label, type: 'text', ...config });
  }

  emailField(name: string, label: string, required = false): this {
    return this.field({
      name,
      label,
      type: 'email',
      required,
      validation: [
        {
          type: 'pattern',
          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: 'Please enter a valid email address',
        },
      ],
    });
  }

  numberField(name: string, label: string, config?: {
    min?: number;
    max?: number;
    required?: boolean;
  }): this {
    const validation: ValidationRule[] = [];
    if (config?.min !== undefined) {
      validation.push({
        type: 'min',
        value: config.min,
        message: `Value must be at least ${config.min}`,
      });
    }
    if (config?.max !== undefined) {
      validation.push({
        type: 'max',
        value: config.max,
        message: `Value must be at most ${config.max}`,
      });
    }

    return this.field({
      name,
      label,
      type: 'number',
      required: config?.required,
      validation: validation.length > 0 ? validation : undefined,
    });
  }

  selectField(name: string, label: string, options: FieldOption[], config?: Partial<FormField>): this {
    return this.field({ name, label, type: 'select', options, ...config });
  }

  checkboxField(name: string, label: string, defaultValue = false): this {
    return this.field({ name, label, type: 'checkbox', defaultValue });
  }

  textareaField(name: string, label: string, config?: Partial<FormField>): this {
    return this.field({ name, label, type: 'textarea', ...config });
  }

  dateField(name: string, label: string, config?: Partial<FormField>): this {
    return this.field({ name, label, type: 'date', ...config });
  }

  getSection(): FormSection {
    return this.section;
  }
}

// ===========================
// Form Engine Class
// ===========================

export class FormEngine {
  private schema: FormSchema;
  private state: FormState;
  private autoSaveTimer?: NodeJS.Timeout;
  private listeners: Map<string, Set<(state: FormState) => void>> = new Map();

  constructor(schema: FormSchema, initialData: FormData = {}) {
    this.schema = schema;
    this.state = {
      data: this.initializeFormData(initialData),
      errors: [],
      touched: new Set(),
      dirty: false,
      submitting: false,
      submitted: false,
    };

    if (schema.autoSave) {
      this.startAutoSave();
    }
  }

  private initializeFormData(initialData: FormData): FormData {
    const data: FormData = { ...initialData };

    for (const section of this.schema.sections) {
      for (const field of section.fields) {
        if (data[field.name] === undefined && field.defaultValue !== undefined) {
          data[field.name] = field.defaultValue;
        }
      }
    }

    return data;
  }

  // Get current form state
  getState(): FormState {
    return { ...this.state };
  }

  // Get form data
  getData(): FormData {
    return { ...this.state.data };
  }

  // Set field value
  setValue(fieldName: string, value: unknown): void {
    this.state.data[fieldName] = value;
    this.state.dirty = true;
    this.state.touched.add(fieldName);

    // Validate field
    this.validateField(fieldName);

    // Notify listeners
    this.emit('change', this.state);
  }

  // Set multiple values
  setValues(data: FormData): void {
    Object.entries(data).forEach(([key, value]) => {
      this.state.data[key] = value;
      this.state.touched.add(key);
    });
    this.state.dirty = true;

    this.validate();
    this.emit('change', this.state);
  }

  // Validate single field
  private validateField(fieldName: string): void {
    // Remove existing errors for this field
    this.state.errors = this.state.errors.filter((e) => e.field !== fieldName);

    const field = this.findField(fieldName);
    if (!field) return;

    const value = this.state.data[fieldName];

    // Required validation
    if (field.required && (value === undefined || value === null || value === '')) {
      this.state.errors.push({
        field: fieldName,
        message: `${field.label} is required`,
      });
      return;
    }

    // Custom validations
    if (field.validation) {
      for (const rule of field.validation) {
        if (!this.validateRule(value, rule)) {
          this.state.errors.push({
            field: fieldName,
            message: rule.message,
          });
        }
      }
    }
  }

  private validateRule(value: unknown, rule: ValidationRule): boolean {
    switch (rule.type) {
      case 'required':
        return value !== undefined && value !== null && value !== '';

      case 'min':
        if (typeof value === 'number' && typeof rule.value === 'number') {
          return value >= rule.value;
        }
        if (typeof value === 'string' && typeof rule.value === 'number') {
          return value.length >= rule.value;
        }
        return true;

      case 'max':
        if (typeof value === 'number' && typeof rule.value === 'number') {
          return value <= rule.value;
        }
        if (typeof value === 'string' && typeof rule.value === 'number') {
          return value.length <= rule.value;
        }
        return true;

      case 'pattern':
        if (typeof value === 'string' && rule.value instanceof RegExp) {
          return rule.value.test(value);
        }
        return true;

      case 'custom':
        if (rule.validator) {
          return rule.validator(value);
        }
        return true;

      default:
        return true;
    }
  }

  // Validate entire form
  validate(): boolean {
    this.state.errors = [];

    for (const section of this.schema.sections) {
      for (const field of section.fields) {
        // Check conditional visibility
        if (!this.isFieldVisible(field)) continue;

        this.validateField(field.name);
      }
    }

    return this.state.errors.length === 0;
  }

  // Check if field should be visible based on conditional logic
  private isFieldVisible(field: FormField): boolean {
    if (!field.showIf || field.showIf.length === 0) {
      return true;
    }

    return field.showIf.every((condition) => {
      const fieldValue = this.state.data[condition.field];

      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'notEquals':
          return fieldValue !== condition.value;
        case 'contains':
          return String(fieldValue).includes(String(condition.value));
        case 'greaterThan':
          return Number(fieldValue) > Number(condition.value);
        case 'lessThan':
          return Number(fieldValue) < Number(condition.value);
        default:
          return true;
      }
    });
  }

  // Find field by name
  private findField(name: string): FormField | undefined {
    for (const section of this.schema.sections) {
      const field = section.fields.find((f) => f.name === name);
      if (field) return field;
    }
    return undefined;
  }

  // Submit form
  async submit(onSubmit: (data: FormData) => Promise<void>): Promise<boolean> {
    this.state.submitting = true;
    this.emit('change', this.state);

    try {
      // Validate
      if (!this.validate()) {
        this.state.submitting = false;
        this.emit('change', this.state);
        return false;
      }

      // Execute submit callback
      await onSubmit(this.getData());

      this.state.submitted = true;
      this.state.dirty = false;
      this.state.submitting = false;
      this.emit('submit', this.state);
      this.emit('change', this.state);

      return true;
    } catch (error) {
      this.state.submitting = false;
      this.emit('error', error);
      this.emit('change', this.state);
      return false;
    }
  }

  // Reset form
  reset(): void {
    this.state.data = this.initializeFormData({});
    this.state.errors = [];
    this.state.touched.clear();
    this.state.dirty = false;
    this.state.submitted = false;
    this.emit('reset', this.state);
    this.emit('change', this.state);
  }

  // Auto-save functionality
  private startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    const interval = this.schema.autoSaveInterval || 3000;
    this.autoSaveTimer = setInterval(() => {
      if (this.state.dirty && !this.state.submitting) {
        this.emit('autoSave', this.state.data);
      }
    }, interval);
  }

  // Event listeners
  on(event: string, callback: (state: FormState) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (state: FormState) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((callback) => callback(data as FormState));
  }

  // Cleanup
  destroy(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    this.listeners.clear();
  }
}

// ===========================
// Usage Examples
// ===========================

export function example1_BasicContactForm() {
  console.log('\n=== Example 1: Basic Contact Form ===\n');

  const form = new FormBuilder('contact-form', 'Contact Us')
    .description('Get in touch with our team')
    .autoSave(true, 5000);

  form.section('personal-info', 'Personal Information')
    .textField('firstName', 'First Name', { required: true })
    .textField('lastName', 'Last Name', { required: true })
    .emailField('email', 'Email Address', true);

  form.section('message', 'Your Message')
    .selectField('subject', 'Subject', [
      { label: 'General Inquiry', value: 'general' },
      { label: 'Support', value: 'support' },
      { label: 'Sales', value: 'sales' },
    ], { required: true })
    .textareaField('message', 'Message', {
      required: true,
      placeholder: 'Tell us how we can help...',
    });

  const schema = form.build();
  console.log('Form Schema:', JSON.stringify(schema, null, 2));

  // Create form engine
  const engine = new FormEngine(schema);

  // Listen to changes
  engine.on('change', (state) => {
    console.log('Form changed:', state.data);
  });

  // Set values
  engine.setValue('firstName', 'John');
  engine.setValue('lastName', 'Doe');
  engine.setValue('email', 'john.doe@example.com');
  engine.setValue('subject', 'support');
  engine.setValue('message', 'I need help with my account');

  // Validate and submit
  if (engine.validate()) {
    console.log('Form is valid!');
    console.log('Form Data:', engine.getData());
  } else {
    console.log('Validation errors:', engine.getState().errors);
  }

  engine.destroy();
}

export function example2_ConditionalFields() {
  console.log('\n=== Example 2: Conditional Fields ===\n');

  const form = new FormBuilder('survey-form', 'Customer Survey');

  form.section('feedback', 'Feedback')
    .selectField('satisfaction', 'How satisfied are you?', [
      { label: 'Very Satisfied', value: 5 },
      { label: 'Satisfied', value: 4 },
      { label: 'Neutral', value: 3 },
      { label: 'Unsatisfied', value: 2 },
      { label: 'Very Unsatisfied', value: 1 },
    ], { required: true })
    .textareaField('feedback', 'What could we improve?', {
      showIf: [
        { field: 'satisfaction', operator: 'lessThan', value: 4 },
      ],
      placeholder: 'Please tell us more...',
    })
    .checkboxField('wouldRecommend', 'Would you recommend us to others?')
    .textField('referralCode', 'Referral Code (if you have one)', {
      showIf: [
        { field: 'wouldRecommend', operator: 'equals', value: true },
      ],
    });

  const schema = form.build();
  const engine = new FormEngine(schema);

  // Test conditional visibility
  engine.setValue('satisfaction', 2); // Low satisfaction
  console.log('Set satisfaction to 2 (should show feedback field)');

  engine.setValue('wouldRecommend', true);
  console.log('Set wouldRecommend to true (should show referral code field)');

  console.log('Form Data:', engine.getData());

  engine.destroy();
}

export function example3_DynamicValidation() {
  console.log('\n=== Example 3: Dynamic Validation ===\n');

  const form = new FormBuilder('registration-form', 'User Registration');

  form.section('account', 'Account Details')
    .textField('username', 'Username', {
      required: true,
      validation: [
        {
          type: 'min',
          value: 3,
          message: 'Username must be at least 3 characters',
        },
        {
          type: 'pattern',
          value: /^[a-zA-Z0-9_]+$/,
          message: 'Username can only contain letters, numbers, and underscores',
        },
      ],
    })
    .textField('password', 'Password', {
      required: true,
      validation: [
        {
          type: 'min',
          value: 8,
          message: 'Password must be at least 8 characters',
        },
        {
          type: 'custom',
          message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
          validator: (value) => {
            const password = String(value);
            return /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);
          },
        },
      ],
    })
    .numberField('age', 'Age', { min: 18, max: 120, required: true });

  const schema = form.build();
  const engine = new FormEngine(schema);

  // Test validation with invalid data
  engine.setValue('username', 'ab'); // Too short
  engine.setValue('password', 'weak'); // Doesn't meet requirements
  engine.setValue('age', 15); // Under 18

  if (!engine.validate()) {
    console.log('Validation Errors:');
    engine.getState().errors.forEach((error) => {
      console.log(`  - ${error.field}: ${error.message}`);
    });
  }

  // Fix the data
  console.log('\nFixing validation errors...');
  engine.setValue('username', 'john_doe');
  engine.setValue('password', 'SecurePass123');
  engine.setValue('age', 25);

  if (engine.validate()) {
    console.log('Form is now valid!');
    console.log('Form Data:', engine.getData());
  }

  engine.destroy();
}

// Run examples
if (require.main === module) {
  example1_BasicContactForm();
  example2_ConditionalFields();
  example3_DynamicValidation();
}
