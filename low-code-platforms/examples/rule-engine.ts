/**
 * Business Rules Engine - Low-Code Rule Management
 *
 * This example demonstrates:
 * - Rule definition and evaluation
 * - Condition chaining (AND/OR/NOT)
 * - Action execution based on rules
 * - Rule priorities and conflicts
 * - Rule templates and inheritance
 * - Dynamic rule management
 */

// ===========================
// Type Definitions
// ===========================

export type OperatorType =
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'matches'
  | 'in'
  | 'notIn'
  | 'isEmpty'
  | 'isNotEmpty';

export type LogicOperator = 'AND' | 'OR' | 'NOT';

export interface Condition {
  field: string;
  operator: OperatorType;
  value?: unknown;
}

export interface ConditionGroup {
  logic: LogicOperator;
  conditions?: Condition[];
  groups?: ConditionGroup[];
}

export type ActionType =
  | 'set'
  | 'calculate'
  | 'send'
  | 'log'
  | 'trigger'
  | 'validate'
  | 'custom';

export interface Action {
  type: ActionType;
  config: Record<string, unknown>;
}

export interface Rule {
  id: string;
  name: string;
  description?: string;
  priority: number;
  enabled: boolean;
  conditions: ConditionGroup;
  actions: Action[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleExecutionContext {
  data: Record<string, unknown>;
  variables: Map<string, unknown>;
  results: Map<string, unknown>;
  metadata: {
    timestamp: Date;
    rulesFired: string[];
    actionsExecuted: number;
  };
}

export interface RuleExecutionResult {
  ruleId: string;
  matched: boolean;
  actionsExecuted: number;
  output: unknown;
  error?: string;
  duration: number;
}

export interface ConflictResolutionStrategy {
  type: 'priority' | 'first' | 'last' | 'all';
  onConflict?: (rules: Rule[]) => Rule[];
}

// ===========================
// Rule Builder
// ===========================

export class RuleBuilder {
  private rule: Partial<Rule>;
  private conditionGroups: ConditionGroup[] = [];
  private actions: Action[] = [];

  constructor(id: string, name: string) {
    this.rule = {
      id,
      name,
      priority: 0,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  description(desc: string): this {
    this.rule.description = desc;
    return this;
  }

  priority(priority: number): this {
    this.rule.priority = priority;
    return this;
  }

  enabled(enabled: boolean): this {
    this.rule.enabled = enabled;
    return this;
  }

  metadata(meta: Record<string, unknown>): this {
    this.rule.metadata = { ...this.rule.metadata, ...meta };
    return this;
  }

  // Condition methods
  when(field: string, operator: OperatorType, value?: unknown): this {
    if (!this.rule.conditions) {
      this.rule.conditions = { logic: 'AND', conditions: [] };
    }

    if (!this.rule.conditions.conditions) {
      this.rule.conditions.conditions = [];
    }

    this.rule.conditions.conditions.push({ field, operator, value });
    return this;
  }

  andWhen(field: string, operator: OperatorType, value?: unknown): this {
    return this.when(field, operator, value);
  }

  orWhen(field: string, operator: OperatorType, value?: unknown): this {
    // Create OR group if needed
    if (!this.rule.conditions || this.rule.conditions.logic !== 'OR') {
      const existingConditions = this.rule.conditions;
      this.rule.conditions = {
        logic: 'OR',
        groups: existingConditions ? [existingConditions] : [],
      };
    }

    if (!this.rule.conditions.groups) {
      this.rule.conditions.groups = [];
    }

    this.rule.conditions.groups.push({
      logic: 'AND',
      conditions: [{ field, operator, value }],
    });

    return this;
  }

  group(logic: LogicOperator, builder: (group: ConditionGroupBuilder) => void): this {
    const groupBuilder = new ConditionGroupBuilder(logic);
    builder(groupBuilder);

    if (!this.rule.conditions) {
      this.rule.conditions = groupBuilder.build();
    } else {
      if (!this.rule.conditions.groups) {
        this.rule.conditions.groups = [];
      }
      this.rule.conditions.groups.push(groupBuilder.build());
    }

    return this;
  }

  // Action methods
  then(action: Action): this {
    this.actions.push(action);
    return this;
  }

  setValue(field: string, value: unknown): this {
    return this.then({
      type: 'set',
      config: { field, value },
    });
  }

  calculate(field: string, expression: string): this {
    return this.then({
      type: 'calculate',
      config: { field, expression },
    });
  }

  sendNotification(config: {
    to: string | string[];
    subject?: string;
    message: string;
  }): this {
    return this.then({
      type: 'send',
      config,
    });
  }

  log(message: string, level: 'info' | 'warn' | 'error' = 'info'): this {
    return this.then({
      type: 'log',
      config: { message, level },
    });
  }

  triggerRule(ruleId: string): this {
    return this.then({
      type: 'trigger',
      config: { ruleId },
    });
  }

  validate(field: string, validator: string): this {
    return this.then({
      type: 'validate',
      config: { field, validator },
    });
  }

  customAction(handler: (context: RuleExecutionContext) => unknown): this {
    return this.then({
      type: 'custom',
      config: { handler },
    });
  }

  build(): Rule {
    if (!this.rule.conditions) {
      throw new Error('Rule must have at least one condition');
    }

    if (this.actions.length === 0) {
      throw new Error('Rule must have at least one action');
    }

    return {
      ...this.rule,
      actions: this.actions,
    } as Rule;
  }
}

// ===========================
// Condition Group Builder
// ===========================

export class ConditionGroupBuilder {
  private group: ConditionGroup;

  constructor(logic: LogicOperator) {
    this.group = {
      logic,
      conditions: [],
      groups: [],
    };
  }

  condition(field: string, operator: OperatorType, value?: unknown): this {
    if (!this.group.conditions) {
      this.group.conditions = [];
    }
    this.group.conditions.push({ field, operator, value });
    return this;
  }

  subGroup(logic: LogicOperator, builder: (group: ConditionGroupBuilder) => void): this {
    const subGroupBuilder = new ConditionGroupBuilder(logic);
    builder(subGroupBuilder);

    if (!this.group.groups) {
      this.group.groups = [];
    }
    this.group.groups.push(subGroupBuilder.build());

    return this;
  }

  build(): ConditionGroup {
    return this.group;
  }
}

// ===========================
// Rules Engine
// ===========================

export class RulesEngine {
  private rules: Map<string, Rule> = new Map();
  private conflictResolution: ConflictResolutionStrategy = { type: 'priority' };
  private actionHandlers: Map<ActionType, (action: Action, context: RuleExecutionContext) => unknown> = new Map();

  constructor() {
    this.registerDefaultActionHandlers();
  }

  // Register a rule
  addRule(rule: Rule): void {
    this.rules.set(rule.id, rule);
    console.log(`Rule registered: ${rule.name} (priority: ${rule.priority})`);
  }

  // Remove a rule
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
    console.log(`Rule removed: ${ruleId}`);
  }

  // Update a rule
  updateRule(ruleId: string, updates: Partial<Rule>): void {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    Object.assign(rule, updates, { updatedAt: new Date() });
    console.log(`Rule updated: ${ruleId}`);
  }

  // Get rule
  getRule(ruleId: string): Rule | undefined {
    return this.rules.get(ruleId);
  }

  // Get all rules
  getAllRules(): Rule[] {
    return Array.from(this.rules.values());
  }

  // Set conflict resolution strategy
  setConflictResolution(strategy: ConflictResolutionStrategy): void {
    this.conflictResolution = strategy;
  }

  // Execute rules against data
  async execute(data: Record<string, unknown>): Promise<{
    results: RuleExecutionResult[];
    context: RuleExecutionContext;
  }> {
    const context: RuleExecutionContext = {
      data: { ...data },
      variables: new Map(),
      results: new Map(),
      metadata: {
        timestamp: new Date(),
        rulesFired: [],
        actionsExecuted: 0,
      },
    };

    // Find matching rules
    const matchingRules = this.findMatchingRules(context);

    // Resolve conflicts
    const rulesToExecute = this.resolveConflicts(matchingRules);

    // Execute rules
    const results: RuleExecutionResult[] = [];
    for (const rule of rulesToExecute) {
      const result = await this.executeRule(rule, context);
      results.push(result);

      if (result.matched) {
        context.metadata.rulesFired.push(rule.id);
        context.metadata.actionsExecuted += result.actionsExecuted;
      }
    }

    return { results, context };
  }

  // Find matching rules
  private findMatchingRules(context: RuleExecutionContext): Rule[] {
    return Array.from(this.rules.values())
      .filter((rule) => rule.enabled)
      .filter((rule) => this.evaluateConditions(rule.conditions, context));
  }

  // Evaluate condition group
  private evaluateConditions(group: ConditionGroup, context: RuleExecutionContext): boolean {
    const { logic, conditions = [], groups = [] } = group;

    // Evaluate conditions
    const conditionResults = conditions.map((condition) =>
      this.evaluateCondition(condition, context)
    );

    // Evaluate sub-groups
    const groupResults = groups.map((subGroup) =>
      this.evaluateConditions(subGroup, context)
    );

    const allResults = [...conditionResults, ...groupResults];

    switch (logic) {
      case 'AND':
        return allResults.every((result) => result);
      case 'OR':
        return allResults.some((result) => result);
      case 'NOT':
        return !allResults.every((result) => result);
      default:
        return false;
    }
  }

  // Evaluate single condition
  private evaluateCondition(condition: Condition, context: RuleExecutionContext): boolean {
    const fieldValue = this.getFieldValue(condition.field, context);
    const { operator, value } = condition;

    switch (operator) {
      case 'equals':
        return fieldValue === value;

      case 'notEquals':
        return fieldValue !== value;

      case 'greaterThan':
        return Number(fieldValue) > Number(value);

      case 'lessThan':
        return Number(fieldValue) < Number(value);

      case 'greaterThanOrEqual':
        return Number(fieldValue) >= Number(value);

      case 'lessThanOrEqual':
        return Number(fieldValue) <= Number(value);

      case 'contains':
        return String(fieldValue).includes(String(value));

      case 'notContains':
        return !String(fieldValue).includes(String(value));

      case 'startsWith':
        return String(fieldValue).startsWith(String(value));

      case 'endsWith':
        return String(fieldValue).endsWith(String(value));

      case 'matches':
        return new RegExp(String(value)).test(String(fieldValue));

      case 'in':
        return Array.isArray(value) && value.includes(fieldValue);

      case 'notIn':
        return Array.isArray(value) && !value.includes(fieldValue);

      case 'isEmpty':
        return !fieldValue || String(fieldValue).trim() === '';

      case 'isNotEmpty':
        return !!fieldValue && String(fieldValue).trim() !== '';

      default:
        return false;
    }
  }

  // Get field value from context
  private getFieldValue(field: string, context: RuleExecutionContext): unknown {
    const parts = field.split('.');
    let value: unknown = context.data;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  // Resolve conflicting rules
  private resolveConflicts(rules: Rule[]): Rule[] {
    if (rules.length <= 1) {
      return rules;
    }

    switch (this.conflictResolution.type) {
      case 'priority':
        return rules.sort((a, b) => b.priority - a.priority).slice(0, 1);

      case 'first':
        return [rules[0]];

      case 'last':
        return [rules[rules.length - 1]];

      case 'all':
        return rules.sort((a, b) => b.priority - a.priority);

      default:
        if (this.conflictResolution.onConflict) {
          return this.conflictResolution.onConflict(rules);
        }
        return rules;
    }
  }

  // Execute a single rule
  private async executeRule(
    rule: Rule,
    context: RuleExecutionContext
  ): Promise<RuleExecutionResult> {
    const startTime = Date.now();

    try {
      let actionsExecuted = 0;
      let output: unknown = null;

      for (const action of rule.actions) {
        const handler = this.actionHandlers.get(action.type);
        if (handler) {
          output = await handler(action, context);
          actionsExecuted++;
        } else {
          console.warn(`No handler for action type: ${action.type}`);
        }
      }

      const duration = Date.now() - startTime;

      return {
        ruleId: rule.id,
        matched: true,
        actionsExecuted,
        output,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        ruleId: rule.id,
        matched: false,
        actionsExecuted: 0,
        output: null,
        error: error instanceof Error ? error.message : String(error),
        duration,
      };
    }
  }

  // Register action handler
  registerActionHandler(
    type: ActionType,
    handler: (action: Action, context: RuleExecutionContext) => unknown
  ): void {
    this.actionHandlers.set(type, handler);
  }

  // Default action handlers
  private registerDefaultActionHandlers(): void {
    // Set value action
    this.registerActionHandler('set', (action, context) => {
      const { field, value } = action.config;
      this.setFieldValue(String(field), value, context);
      console.log(`  Action: Set ${field} = ${value}`);
      return value;
    });

    // Calculate action
    this.registerActionHandler('calculate', (action, context) => {
      const { field, expression } = action.config;
      // Simplified evaluation - in production use a proper expression parser
      const result = eval(String(expression).replace(/\{(\w+)\}/g, (_, key) => {
        return String(this.getFieldValue(key, context) || 0);
      }));
      this.setFieldValue(String(field), result, context);
      console.log(`  Action: Calculate ${field} = ${expression} => ${result}`);
      return result;
    });

    // Log action
    this.registerActionHandler('log', (action) => {
      const { message, level } = action.config;
      console.log(`  Action: [${level}] ${message}`);
      return null;
    });

    // Send notification action
    this.registerActionHandler('send', (action) => {
      const { to, subject, message } = action.config;
      console.log(`  Action: Send notification to ${to}`);
      console.log(`    Subject: ${subject || 'N/A'}`);
      console.log(`    Message: ${message}`);
      return { sent: true, to, subject, message };
    });

    // Custom action
    this.registerActionHandler('custom', async (action, context) => {
      const { handler } = action.config;
      if (typeof handler === 'function') {
        return await handler(context);
      }
      return null;
    });
  }

  // Set field value in context
  private setFieldValue(field: string, value: unknown, context: RuleExecutionContext): void {
    const parts = field.split('.');
    let current: Record<string, unknown> = context.data;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    current[parts[parts.length - 1]] = value;
  }
}

// ===========================
// Usage Examples
// ===========================

export async function example1_BasicRules() {
  console.log('\n=== Example 1: Basic Business Rules ===\n');

  const engine = new RulesEngine();

  // Rule: Discount for large orders
  const discountRule = new RuleBuilder('discount-large-order', 'Large Order Discount')
    .description('Apply 10% discount for orders over $100')
    .priority(10)
    .when('order.total', 'greaterThan', 100)
    .setValue('order.discount', 0.1)
    .calculate('order.finalTotal', '{order.total} * (1 - {order.discount})')
    .log('Applied 10% discount for large order', 'info')
    .build();

  engine.addRule(discountRule);

  // Execute
  const result = await engine.execute({
    order: {
      total: 150,
      items: 5,
    },
  });

  console.log('\nExecution Results:');
  console.log('  Rules fired:', result.context.metadata.rulesFired);
  console.log('  Final data:', result.context.data);
}

export async function example2_ComplexConditions() {
  console.log('\n=== Example 2: Complex Conditions ===\n');

  const engine = new RulesEngine();

  // Rule: VIP customer with complex conditions
  const vipRule = new RuleBuilder('vip-customer', 'VIP Customer Benefits')
    .priority(20)
    .group('AND', (group) => {
      group
        .condition('customer.totalSpent', 'greaterThan', 1000)
        .condition('customer.membershipYears', 'greaterThanOrEqual', 2);
    })
    .orWhen('customer.tier', 'equals', 'platinum')
    .setValue('customer.isVIP', true)
    .setValue('order.freeShipping', true)
    .sendNotification({
      to: '{{customer.email}}',
      subject: 'VIP Benefits Applied',
      message: 'Thank you for being a valued customer!',
    })
    .build();

  engine.addRule(vipRule);

  // Test case 1: Meets spending requirements
  console.log('Test 1: High spending customer');
  await engine.execute({
    customer: {
      email: 'john@example.com',
      totalSpent: 1500,
      membershipYears: 3,
      tier: 'gold',
    },
    order: {},
  });

  // Test case 2: Platinum tier
  console.log('\nTest 2: Platinum tier customer');
  await engine.execute({
    customer: {
      email: 'jane@example.com',
      totalSpent: 500,
      membershipYears: 1,
      tier: 'platinum',
    },
    order: {},
  });
}

export async function example3_ConflictResolution() {
  console.log('\n=== Example 3: Rule Conflict Resolution ===\n');

  const engine = new RulesEngine();

  // Multiple conflicting rules
  const rule1 = new RuleBuilder('discount-5', '5% Discount')
    .priority(5)
    .when('order.total', 'greaterThan', 50)
    .setValue('order.discount', 0.05)
    .log('Applied 5% discount')
    .build();

  const rule2 = new RuleBuilder('discount-10', '10% Discount')
    .priority(10)
    .when('order.total', 'greaterThan', 50)
    .setValue('order.discount', 0.10)
    .log('Applied 10% discount')
    .build();

  const rule3 = new RuleBuilder('discount-15', '15% Discount')
    .priority(15)
    .when('order.total', 'greaterThan', 50)
    .setValue('order.discount', 0.15)
    .log('Applied 15% discount')
    .build();

  engine.addRule(rule1);
  engine.addRule(rule2);
  engine.addRule(rule3);

  console.log('Strategy: Priority (highest wins)');
  engine.setConflictResolution({ type: 'priority' });
  await engine.execute({ order: { total: 100 } });

  console.log('\nStrategy: All (execute all matching rules)');
  engine.setConflictResolution({ type: 'all' });
  await engine.execute({ order: { total: 100 } });
}

export async function example4_DynamicRules() {
  console.log('\n=== Example 4: Dynamic Rule Management ===\n');

  const engine = new RulesEngine();

  // Validation rule
  const emailValidation = new RuleBuilder('validate-email', 'Email Validation')
    .when('user.email', 'isNotEmpty')
    .andWhen('user.email', 'matches', /^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    .setValue('validation.emailValid', true)
    .log('Email is valid', 'info')
    .build();

  const emailInvalid = new RuleBuilder('email-invalid', 'Email Invalid')
    .when('user.email', 'isEmpty')
    .orWhen('user.email', 'matches', /^(?!.*@)/)
    .setValue('validation.emailValid', false)
    .log('Email is invalid', 'warn')
    .build();

  engine.addRule(emailValidation);
  engine.addRule(emailInvalid);

  // Test valid email
  console.log('Test: Valid email');
  const result1 = await engine.execute({
    user: { email: 'john@example.com' },
    validation: {},
  });
  console.log('Result:', result1.context.data);

  // Test invalid email
  console.log('\nTest: Invalid email');
  const result2 = await engine.execute({
    user: { email: 'invalid-email' },
    validation: {},
  });
  console.log('Result:', result2.context.data);

  // Disable validation rule
  console.log('\nDisabling validation rule...');
  engine.updateRule('validate-email', { enabled: false });

  const result3 = await engine.execute({
    user: { email: 'john@example.com' },
    validation: {},
  });
  console.log('Rules fired:', result3.context.metadata.rulesFired);
}

export async function example5_CustomActions() {
  console.log('\n=== Example 5: Custom Actions ===\n');

  const engine = new RulesEngine();

  // Register custom action handler
  engine.registerActionHandler('custom', async (action, context) => {
    const handler = action.config.handler as (ctx: RuleExecutionContext) => unknown;
    return await handler(context);
  });

  const customRule = new RuleBuilder('custom-processing', 'Custom Processing')
    .when('data.type', 'equals', 'special')
    .customAction((context) => {
      console.log('  Custom Action: Processing special data...');
      const data = context.data as { items?: unknown[] };
      if (data.items) {
        console.log(`  Custom Action: Found ${data.items.length} items`);
        context.variables.set('processedCount', data.items.length);
      }
      return { processed: true };
    })
    .log('Custom processing completed')
    .build();

  engine.addRule(customRule);

  await engine.execute({
    data: {
      type: 'special',
      items: [1, 2, 3, 4, 5],
    },
  });
}

// Run examples
if (require.main === module) {
  (async () => {
    await example1_BasicRules();
    await example2_ComplexConditions();
    await example3_ConflictResolution();
    await example4_DynamicRules();
    await example5_CustomActions();
  })().catch(console.error);
}
