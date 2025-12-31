/**
 * Template Engine for Notifications
 */

import type { NotificationTemplate } from './types.js';

export class TemplateEngine {
  private templates: Map<string, NotificationTemplate> = new Map();

  /**
   * Register a template
   */
  register(template: NotificationTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get a template by ID
   */
  get(id: string): NotificationTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Remove a template
   */
  remove(id: string): boolean {
    return this.templates.delete(id);
  }

  /**
   * List all templates
   */
  list(): NotificationTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Render a template with variables
   */
  render(
    templateId: string,
    variables: Record<string, unknown>
  ): { subject?: string; body: string; htmlBody?: string } | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    return {
      subject: template.subject
        ? this.interpolate(template.subject, variables)
        : undefined,
      body: this.interpolate(template.body, variables),
      htmlBody: template.htmlBody
        ? this.interpolate(template.htmlBody, variables)
        : undefined,
    };
  }

  /**
   * Interpolate variables in a string
   * Supports: {{variable}}, {{variable|default}}, {{variable|uppercase}}
   */
  private interpolate(
    text: string,
    variables: Record<string, unknown>
  ): string {
    return text.replace(/\{\{(\w+)(?:\|(\w+))?\}\}/g, (match, key, modifier) => {
      let value = variables[key];

      if (value === undefined || value === null) {
        // Check if modifier is a default value
        if (modifier && !['uppercase', 'lowercase', 'capitalize'].includes(modifier)) {
          return modifier;
        }
        return match;
      }

      let result = String(value);

      // Apply modifiers
      if (modifier) {
        switch (modifier) {
          case 'uppercase':
            result = result.toUpperCase();
            break;
          case 'lowercase':
            result = result.toLowerCase();
            break;
          case 'capitalize':
            result = result.charAt(0).toUpperCase() + result.slice(1);
            break;
        }
      }

      return result;
    });
  }

  /**
   * Extract variables from template text
   */
  extractVariables(text: string): string[] {
    const matches = text.match(/\{\{(\w+)(?:\|\w+)?\}\}/g) || [];
    const variables = matches.map((m) => m.replace(/\{\{(\w+).*\}\}/, '$1'));
    return [...new Set(variables)];
  }

  /**
   * Validate that all required variables are provided
   */
  validate(
    templateId: string,
    variables: Record<string, unknown>
  ): { valid: boolean; missing: string[] } {
    const template = this.templates.get(templateId);
    if (!template) {
      return { valid: false, missing: [] };
    }

    const missing = template.variables.filter(
      (v) => !(v in variables) || variables[v] === undefined
    );

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Create a template from a definition
   */
  static create(
    id: string,
    name: string,
    channel: NotificationTemplate['channel'],
    body: string,
    options: Partial<NotificationTemplate> = {}
  ): NotificationTemplate {
    const allText = [body, options.subject, options.htmlBody]
      .filter(Boolean)
      .join(' ');

    const variables = allText
      .match(/\{\{(\w+)(?:\|\w+)?\}\}/g)
      ?.map((m) => m.replace(/\{\{(\w+).*\}\}/, '$1')) || [];

    return {
      id,
      name,
      channel,
      body,
      variables: [...new Set(variables)],
      ...options,
    };
  }
}

// Pre-built templates
export const DEFAULT_TEMPLATES: NotificationTemplate[] = [
  TemplateEngine.create(
    'welcome',
    'Welcome Email',
    'email',
    'Hi {{name}}, welcome to our platform! We\'re excited to have you.',
    {
      subject: 'Welcome to {{appName}}!',
      htmlBody: `
        <h1>Welcome, {{name}}!</h1>
        <p>We're excited to have you on {{appName}}.</p>
        <p>Get started by visiting your <a href="{{dashboardUrl}}">dashboard</a>.</p>
      `,
      category: 'onboarding',
    }
  ),
  TemplateEngine.create(
    'password_reset',
    'Password Reset',
    'email',
    'Click here to reset your password: {{resetLink}}. This link expires in {{expiresIn}}.',
    {
      subject: 'Reset your password',
      htmlBody: `
        <h2>Password Reset Request</h2>
        <p>Click the button below to reset your password:</p>
        <a href="{{resetLink}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p><small>This link expires in {{expiresIn}}.</small></p>
      `,
      category: 'security',
    }
  ),
  TemplateEngine.create(
    'order_confirmation',
    'Order Confirmation',
    'email',
    'Your order #{{orderId}} has been confirmed. Total: {{total}}',
    {
      subject: 'Order Confirmed - #{{orderId}}',
      category: 'transactional',
    }
  ),
  TemplateEngine.create(
    'otp_sms',
    'OTP SMS',
    'sms',
    'Your verification code is {{code}}. Valid for {{expiresIn}}.',
    {
      category: 'security',
    }
  ),
  TemplateEngine.create(
    'new_message',
    'New Message Push',
    'push',
    '{{senderName}}: {{preview}}',
    {
      category: 'messaging',
    }
  ),
];
