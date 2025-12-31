/**
 * Template Engine - Low-Code Template Generation
 *
 * This example demonstrates:
 * - Template compilation and rendering
 * - Variable interpolation
 * - Control structures (if/else, loops)
 * - Filters and transformations
 * - Template inheritance
 * - Partial templates
 * - Custom helpers
 */

// ===========================
// Type Definitions
// ===========================

export interface TemplateContext {
  [key: string]: unknown;
}

export interface FilterFunction {
  (value: unknown, ...args: unknown[]): unknown;
}

export interface HelperFunction {
  (context: TemplateContext, ...args: unknown[]): string;
}

export interface CompiledTemplate {
  (context: TemplateContext): string;
}

export interface TemplateOptions {
  stripWhitespace?: boolean;
  autoescape?: boolean;
  throwOnUndefined?: boolean;
}

export interface PartialTemplate {
  name: string;
  template: string;
  compiled?: CompiledTemplate;
}

// ===========================
// Template Engine
// ===========================

export class TemplateEngine {
  private templates: Map<string, CompiledTemplate> = new Map();
  private partials: Map<string, PartialTemplate> = new Map();
  private filters: Map<string, FilterFunction> = new Map();
  private helpers: Map<string, HelperFunction> = new Map();
  private options: TemplateOptions;

  constructor(options: TemplateOptions = {}) {
    this.options = {
      stripWhitespace: options.stripWhitespace ?? false,
      autoescape: options.autoescape ?? true,
      throwOnUndefined: options.throwOnUndefined ?? false,
    };

    this.registerDefaultFilters();
    this.registerDefaultHelpers();
  }

  // ===========================
  // Template Management
  // ===========================

  // Register a template
  registerTemplate(name: string, template: string): void {
    const compiled = this.compile(template);
    this.templates.set(name, compiled);
  }

  // Register a partial template
  registerPartial(name: string, template: string): void {
    this.partials.set(name, {
      name,
      template,
      compiled: this.compile(template),
    });
  }

  // Get template
  getTemplate(name: string): CompiledTemplate | undefined {
    return this.templates.get(name);
  }

  // Render template
  render(name: string, context: TemplateContext = {}): string {
    const template = this.templates.get(name);
    if (!template) {
      throw new Error(`Template "${name}" not found`);
    }

    return template(context);
  }

  // Render template string directly
  renderString(template: string, context: TemplateContext = {}): string {
    const compiled = this.compile(template);
    return compiled(context);
  }

  // ===========================
  // Compilation
  // ===========================

  compile(template: string): CompiledTemplate {
    // Process template and generate function
    let code = 'let __output = "";\n';

    // Strip whitespace if enabled
    if (this.options.stripWhitespace) {
      template = template.replace(/\s+/g, ' ').trim();
    }

    // Parse template
    const tokens = this.tokenize(template);

    for (const token of tokens) {
      switch (token.type) {
        case 'text':
          code += `__output += ${JSON.stringify(token.value)};\n`;
          break;

        case 'variable':
          code += this.compileVariable(token.value);
          break;

        case 'if':
          code += `if (${this.compileExpression(token.value)}) {\n`;
          break;

        case 'else':
          code += '} else {\n';
          break;

        case 'elseif':
          code += `} else if (${this.compileExpression(token.value)}) {\n`;
          break;

        case 'endif':
          code += '}\n';
          break;

        case 'for':
          code += this.compileFor(token.value);
          break;

        case 'endfor':
          code += '}\n';
          break;

        case 'partial':
          code += this.compilePartial(token.value);
          break;

        case 'helper':
          code += this.compileHelper(token.value);
          break;
      }
    }

    code += 'return __output;';

    // Create and return compiled function
    return new Function('context', `
      const __filters = this.filters;
      const __helpers = this.helpers;
      const __escape = this.escape.bind(this);
      const __getPath = this.getPath.bind(this);

      with (context) {
        ${code}
      }
    `).bind(this) as CompiledTemplate;
  }

  // Tokenize template
  private tokenize(template: string): Array<{ type: string; value: string }> {
    const tokens: Array<{ type: string; value: string }> = [];
    const regex = /\{\{(.+?)\}\}|\{%(.+?)%\}/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(template)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        tokens.push({
          type: 'text',
          value: template.substring(lastIndex, match.index),
        });
      }

      // Process match
      if (match[1]) {
        // Variable interpolation {{...}}
        tokens.push({ type: 'variable', value: match[1].trim() });
      } else if (match[2]) {
        // Control structure {%...%}
        const content = match[2].trim();
        const parts = content.split(/\s+/);
        const command = parts[0];

        switch (command) {
          case 'if':
            tokens.push({ type: 'if', value: parts.slice(1).join(' ') });
            break;
          case 'else':
            tokens.push({ type: 'else', value: '' });
            break;
          case 'elseif':
            tokens.push({ type: 'elseif', value: parts.slice(1).join(' ') });
            break;
          case 'endif':
            tokens.push({ type: 'endif', value: '' });
            break;
          case 'for':
            tokens.push({ type: 'for', value: parts.slice(1).join(' ') });
            break;
          case 'endfor':
            tokens.push({ type: 'endfor', value: '' });
            break;
          case 'include':
            tokens.push({ type: 'partial', value: parts[1] });
            break;
          case 'helper':
            tokens.push({ type: 'helper', value: parts.slice(1).join(' ') });
            break;
        }
      }

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < template.length) {
      tokens.push({ type: 'text', value: template.substring(lastIndex) });
    }

    return tokens;
  }

  // Compile variable expression
  private compileVariable(expr: string): string {
    // Check for filters
    const parts = expr.split('|').map((p) => p.trim());
    const variable = parts[0];
    const filters = parts.slice(1);

    let code = `__getPath(context, ${JSON.stringify(variable)})`;

    // Apply filters
    for (const filter of filters) {
      const filterParts = filter.match(/(\w+)(?:\((.*?)\))?/);
      if (filterParts) {
        const filterName = filterParts[1];
        const filterArgs = filterParts[2]
          ? filterParts[2].split(',').map((a) => a.trim())
          : [];

        code = `__filters.get(${JSON.stringify(filterName)})(${code}${
          filterArgs.length ? ', ' + filterArgs.join(', ') : ''
        })`;
      }
    }

    if (this.options.autoescape) {
      code = `__escape(${code})`;
    }

    return `__output += String(${code} ?? '');\n`;
  }

  // Compile expression
  private compileExpression(expr: string): string {
    // Replace path access with safe getPath calls
    return expr.replace(/(\w+(?:\.\w+)+)/g, (match) => {
      return `__getPath(context, ${JSON.stringify(match)})`;
    });
  }

  // Compile for loop
  private compileFor(expr: string): string {
    const match = expr.match(/(\w+)\s+in\s+(.+)/);
    if (!match) {
      throw new Error(`Invalid for loop syntax: ${expr}`);
    }

    const [, itemVar, arrayExpr] = match;
    return `
      const __array = ${this.compileExpression(arrayExpr)};
      if (Array.isArray(__array)) {
        for (let __i = 0; __i < __array.length; __i++) {
          const ${itemVar} = __array[__i];
          const loop = { index: __i, first: __i === 0, last: __i === __array.length - 1 };
    `;
  }

  // Compile partial include
  private compilePartial(partialName: string): string {
    const partial = this.partials.get(partialName.replace(/['"]/g, ''));
    if (!partial) {
      if (this.options.throwOnUndefined) {
        throw new Error(`Partial "${partialName}" not found`);
      }
      return '__output += "";\n';
    }

    return `__output += ${JSON.stringify(partial.template)};\n`;
  }

  // Compile helper call
  private compileHelper(expr: string): string {
    const parts = expr.match(/(\w+)(?:\((.*?)\))?/);
    if (!parts) {
      throw new Error(`Invalid helper syntax: ${expr}`);
    }

    const [, helperName, args = ''] = parts;
    return `__output += __helpers.get(${JSON.stringify(helperName)})(context${
      args ? ', ' + args : ''
    });\n`;
  }

  // ===========================
  // Filters
  // ===========================

  registerFilter(name: string, fn: FilterFunction): void {
    this.filters.set(name, fn);
  }

  private registerDefaultFilters(): void {
    // Upper case
    this.registerFilter('upper', (value) => String(value).toUpperCase());

    // Lower case
    this.registerFilter('lower', (value) => String(value).toLowerCase());

    // Capitalize
    this.registerFilter('capitalize', (value) => {
      const str = String(value);
      return str.charAt(0).toUpperCase() + str.slice(1);
    });

    // Truncate
    this.registerFilter('truncate', (value, length = 50) => {
      const str = String(value);
      return str.length > Number(length) ? str.substring(0, Number(length)) + '...' : str;
    });

    // Default value
    this.registerFilter('default', (value, defaultValue = '') => {
      return value ?? defaultValue;
    });

    // Date format
    this.registerFilter('date', (value, format = 'ISO') => {
      const date = new Date(String(value));
      if (format === 'ISO') {
        return date.toISOString();
      }
      return date.toLocaleDateString();
    });

    // JSON stringify
    this.registerFilter('json', (value) => JSON.stringify(value, null, 2));

    // Join array
    this.registerFilter('join', (value, separator = ', ') => {
      if (Array.isArray(value)) {
        return value.join(String(separator));
      }
      return String(value);
    });

    // Length
    this.registerFilter('length', (value) => {
      if (Array.isArray(value) || typeof value === 'string') {
        return value.length;
      }
      return 0;
    });

    // Reverse
    this.registerFilter('reverse', (value) => {
      if (Array.isArray(value)) {
        return [...value].reverse();
      }
      return String(value).split('').reverse().join('');
    });

    // Sort
    this.registerFilter('sort', (value) => {
      if (Array.isArray(value)) {
        return [...value].sort();
      }
      return value;
    });
  }

  // ===========================
  // Helpers
  // ===========================

  registerHelper(name: string, fn: HelperFunction): void {
    this.helpers.set(name, fn);
  }

  private registerDefaultHelpers(): void {
    // Current date
    this.registerHelper('now', () => new Date().toISOString());

    // Random number
    this.registerHelper('random', (context, min = 0, max = 100) => {
      return String(Math.floor(Math.random() * (Number(max) - Number(min) + 1)) + Number(min));
    });

    // Range
    this.registerHelper('range', (context, start, end) => {
      const arr = [];
      for (let i = Number(start); i <= Number(end); i++) {
        arr.push(i);
      }
      return arr.join(', ');
    });
  }

  // ===========================
  // Utility Methods
  // ===========================

  private getPath(obj: TemplateContext, path: string): unknown {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part] as TemplateContext;
      } else {
        if (this.options.throwOnUndefined) {
          throw new Error(`Undefined variable: ${path}`);
        }
        return undefined;
      }
    }

    return current;
  }

  private escape(value: unknown): string {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

// ===========================
// Template Builder
// ===========================

export class TemplateBuilder {
  private template = '';

  text(content: string): this {
    this.template += content;
    return this;
  }

  variable(name: string, filters: string[] = []): this {
    const filterStr = filters.length > 0 ? ' | ' + filters.join(' | ') : '';
    this.template += `{{${name}${filterStr}}}`;
    return this;
  }

  if(condition: string): this {
    this.template += `{% if ${condition} %}`;
    return this;
  }

  elseif(condition: string): this {
    this.template += `{% elseif ${condition} %}`;
    return this;
  }

  else(): this {
    this.template += '{% else %}';
    return this;
  }

  endif(): this {
    this.template += '{% endif %}';
    return this;
  }

  for(item: string, array: string): this {
    this.template += `{% for ${item} in ${array} %}`;
    return this;
  }

  endfor(): this {
    this.template += '{% endfor %}';
    return this;
  }

  include(partial: string): this {
    this.template += `{% include ${partial} %}`;
    return this;
  }

  helper(name: string, ...args: unknown[]): this {
    const argsStr = args.length > 0 ? `(${args.join(', ')})` : '';
    this.template += `{% helper ${name}${argsStr} %}`;
    return this;
  }

  build(): string {
    return this.template;
  }
}

// ===========================
// Usage Examples
// ===========================

export function example1_BasicTemplates() {
  console.log('\n=== Example 1: Basic Template Rendering ===\n');

  const engine = new TemplateEngine();

  // Simple variable interpolation
  engine.registerTemplate(
    'greeting',
    'Hello, {{name}}! You have {{messages}} new messages.'
  );

  const output = engine.render('greeting', {
    name: 'John',
    messages: 5,
  });

  console.log(output);

  // With nested objects
  engine.registerTemplate(
    'user-profile',
    `
    <div class="profile">
      <h1>{{user.firstName}} {{user.lastName}}</h1>
      <p>Email: {{user.email}}</p>
      <p>Role: {{user.role}}</p>
    </div>
  `
  );

  console.log(
    engine.render('user-profile', {
      user: {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        role: 'Administrator',
      },
    })
  );
}

export function example2_Filters() {
  console.log('\n=== Example 2: Filters and Transformations ===\n');

  const engine = new TemplateEngine();

  engine.registerTemplate(
    'user-card',
    `
    Name: {{name | upper}}
    Bio: {{bio | truncate(50)}}
    Email: {{email | lower}}
    Status: {{status | default("active") | capitalize}}
    Member Since: {{joinDate | date}}
  `
  );

  console.log(
    engine.render('user-card', {
      name: 'john doe',
      bio: 'This is a very long biography that should be truncated to fit within the card layout nicely.',
      email: 'JOHN@EXAMPLE.COM',
      joinDate: '2024-01-15',
    })
  );

  // Custom filter
  engine.registerFilter('currency', (value, symbol = '$') => {
    return `${symbol}${Number(value).toFixed(2)}`;
  });

  engine.registerTemplate('invoice', 'Total: {{amount | currency("USD ")}}');

  console.log(engine.render('invoice', { amount: 1234.5 }));
}

export function example3_ControlStructures() {
  console.log('\n=== Example 3: Control Structures ===\n');

  const engine = new TemplateEngine();

  // Conditional rendering
  engine.registerTemplate(
    'status-badge',
    `
    {% if score >= 90 %}
      <span class="badge badge-success">Excellent</span>
    {% elseif score >= 70 %}
      <span class="badge badge-info">Good</span>
    {% elseif score >= 50 %}
      <span class="badge badge-warning">Fair</span>
    {% else %}
      <span class="badge badge-danger">Needs Improvement</span>
    {% endif %}
  `
  );

  console.log('Score 95:', engine.render('status-badge', { score: 95 }));
  console.log('Score 75:', engine.render('status-badge', { score: 75 }));
  console.log('Score 55:', engine.render('status-badge', { score: 55 }));
  console.log('Score 35:', engine.render('status-badge', { score: 35 }));

  // Loops
  engine.registerTemplate(
    'task-list',
    `
    <ul>
    {% for task in tasks %}
      <li>[{% if task.completed %}✓{% else %} {% endif %}] {{task.title}}</li>
    {% endfor %}
    </ul>
  `
  );

  console.log(
    '\n' +
      engine.render('task-list', {
        tasks: [
          { title: 'Write documentation', completed: true },
          { title: 'Fix bugs', completed: false },
          { title: 'Deploy to production', completed: false },
        ],
      })
  );
}

export function example4_Partials() {
  console.log('\n=== Example 4: Partial Templates ===\n');

  const engine = new TemplateEngine();

  // Register partials
  engine.registerPartial('header', '<header><h1>{{title}}</h1></header>');
  engine.registerPartial('footer', '<footer>&copy; 2024 {{company}}</footer>');

  // Use partials in main template
  engine.registerTemplate(
    'page',
    `
    {% include "header" %}
    <main>
      {{content}}
    </main>
    {% include "footer" %}
  `
  );

  console.log(
    engine.render('page', {
      title: 'Welcome',
      content: 'This is the main content of the page.',
      company: 'ACME Corp',
    })
  );
}

export function example5_TemplateBuilder() {
  console.log('\n=== Example 5: Template Builder ===\n');

  const engine = new TemplateEngine();

  // Build template programmatically
  const template = new TemplateBuilder()
    .text('<div class="product">')
    .text('<h2>')
    .variable('product.name')
    .text('</h2>')
    .text('<p>Price: ')
    .variable('product.price', ['currency'])
    .text('</p>')
    .if('product.inStock')
    .text('<span class="badge">In Stock</span>')
    .else()
    .text('<span class="badge">Out of Stock</span>')
    .endif()
    .if('product.reviews')
    .text('<ul>')
    .for('review', 'product.reviews')
    .text('<li>')
    .variable('review.text', ['truncate(100)'])
    .text(' - ')
    .variable('review.author')
    .text('</li>')
    .endfor()
    .text('</ul>')
    .endif()
    .text('</div>')
    .build();

  engine.registerTemplate('product-card', template);

  console.log(
    engine.render('product-card', {
      product: {
        name: 'Wireless Headphones',
        price: 99.99,
        inStock: true,
        reviews: [
          { text: 'Great sound quality and comfortable to wear for long periods', author: 'Alice' },
          { text: 'Battery life is amazing, lasts all day', author: 'Bob' },
        ],
      },
    })
  );
}

export function example6_EmailTemplates() {
  console.log('\n=== Example 6: Email Templates ===\n');

  const engine = new TemplateEngine({ stripWhitespace: false });

  engine.registerTemplate(
    'order-confirmation',
    `
    Dear {{customer.name}},

    Thank you for your order #{{order.id}}!

    Order Summary:
    {% for item in order.items %}
    - {{item.name}} x{{item.quantity}} - {{item.total | currency}}
    {% endfor %}

    Subtotal: {{order.subtotal | currency}}
    Tax: {{order.tax | currency}}
    Total: {{order.total | currency}}

    {% if order.discount %}
    Discount Applied: -{{order.discount | currency}}
    {% endif %}

    Your order will be shipped to:
    {{shipping.address}}
    {{shipping.city}}, {{shipping.state}} {{shipping.zip}}

    Estimated Delivery: {{shipping.estimatedDelivery | date}}

    Thank you for shopping with us!

    Best regards,
    {{company.name}}
  `
  );

  console.log(
    engine.render('order-confirmation', {
      customer: { name: 'John Doe' },
      order: {
        id: 'ORD-12345',
        items: [
          { name: 'Widget A', quantity: 2, total: 50 },
          { name: 'Widget B', quantity: 1, total: 75 },
        ],
        subtotal: 125,
        tax: 10,
        discount: 15,
        total: 120,
      },
      shipping: {
        address: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
        estimatedDelivery: '2024-12-25',
      },
      company: { name: 'Widget Store' },
    })
  );
}

export function example7_CustomHelpers() {
  console.log('\n=== Example 7: Custom Helpers ===\n');

  const engine = new TemplateEngine();

  // Register custom helpers
  engine.registerHelper('formatCurrency', (context, amount, currency = 'USD') => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: String(currency),
    });
    return formatter.format(Number(amount));
  });

  engine.registerHelper('pluralize', (context, count, singular, plural) => {
    return Number(count) === 1 ? String(singular) : String(plural);
  });

  engine.registerTemplate(
    'cart-summary',
    `
    You have {{itemCount}} {% helper pluralize(itemCount, "item", "items") %} in your cart.
    Total: {% helper formatCurrency(total, "USD") %}
  `
  );

  console.log(engine.render('cart-summary', { itemCount: 1, total: 25.99 }));
  console.log(engine.render('cart-summary', { itemCount: 5, total: 125.5 }));
}

// Run examples
if (require.main === module) {
  example1_BasicTemplates();
  example2_Filters();
  example3_ControlStructures();
  example4_Partials();
  example5_TemplateBuilder();
  example6_EmailTemplates();
  example7_CustomHelpers();
}
