/**
 * Payment Gateway
 *
 * High-level payment processing interface
 */

import type {
  Money,
  Currency,
  Customer,
  PaymentCard,
  CardDetails,
  PaymentIntent,
  ChargeRequest,
  ChargeResult,
  RefundRequest,
  Refund,
  WebhookEvent,
  GatewayConfig,
  Address,
} from './types.js';

export class PaymentGateway {
  private config: GatewayConfig;
  private customers: Map<string, Customer> = new Map();
  private webhookHandlers: Map<string, ((event: WebhookEvent) => void)[]> = new Map();
  private idCounter = 0;

  constructor(config: GatewayConfig) {
    this.config = {
      testMode: true,
      defaultCurrency: 'USD',
      ...config,
    };
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${++this.idCounter}`;
  }

  // Customer Management

  /**
   * Create a customer
   */
  async createCustomer(params: {
    email: string;
    name?: string;
    phone?: string;
    address?: Address;
    metadata?: Record<string, unknown>;
  }): Promise<Customer> {
    const customer: Customer = {
      id: this.generateId('cus'),
      email: params.email,
      name: params.name,
      phone: params.phone,
      address: params.address,
      paymentMethods: [],
      metadata: params.metadata,
      createdAt: new Date(),
    };

    this.customers.set(customer.id, customer);
    return customer;
  }

  /**
   * Get customer by ID
   */
  getCustomer(id: string): Customer | undefined {
    return this.customers.get(id);
  }

  /**
   * Update customer
   */
  async updateCustomer(
    id: string,
    updates: Partial<Omit<Customer, 'id' | 'createdAt'>>
  ): Promise<Customer | null> {
    const customer = this.customers.get(id);
    if (!customer) return null;

    Object.assign(customer, updates);
    return customer;
  }

  // Payment Methods

  /**
   * Add payment method to customer
   */
  async addPaymentMethod(
    customerId: string,
    cardDetails: CardDetails
  ): Promise<PaymentCard | null> {
    const customer = this.customers.get(customerId);
    if (!customer) return null;

    const card = await this.config.provider.tokenizeCard(cardDetails);
    customer.paymentMethods = customer.paymentMethods || [];
    customer.paymentMethods.push(card);

    return card;
  }

  /**
   * Remove payment method
   */
  removePaymentMethod(customerId: string, paymentMethodId: string): boolean {
    const customer = this.customers.get(customerId);
    if (!customer || !customer.paymentMethods) return false;

    const index = customer.paymentMethods.findIndex((pm) => pm.id === paymentMethodId);
    if (index === -1) return false;

    customer.paymentMethods.splice(index, 1);
    return true;
  }

  /**
   * List customer's payment methods
   */
  listPaymentMethods(customerId: string): PaymentCard[] {
    const customer = this.customers.get(customerId);
    return customer?.paymentMethods || [];
  }

  // Payments

  /**
   * Create payment intent
   */
  async createPaymentIntent(
    amount: number,
    currency: Currency = this.config.defaultCurrency || 'USD',
    options: {
      customerId?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<PaymentIntent> {
    const money: Money = { amount, currency };
    return this.config.provider.createPaymentIntent(money, options);
  }

  /**
   * Charge a payment method
   */
  async charge(request: ChargeRequest): Promise<ChargeResult> {
    // Create payment intent
    const intent = await this.config.provider.createPaymentIntent(
      request.amount,
      {
        customerId: request.customerId,
        description: request.description,
        metadata: request.metadata,
      }
    );

    // Confirm payment
    const result = await this.config.provider.confirmPayment(
      intent.id,
      request.paymentMethodId
    );

    if (!result.success) {
      return result;
    }

    // Auto-capture if requested
    if (request.capture !== false) {
      return this.config.provider.capturePayment(intent.id);
    }

    return result;
  }

  /**
   * Quick charge with new card
   */
  async chargeWithCard(
    amount: number,
    currency: Currency,
    cardDetails: CardDetails,
    options: {
      customerId?: string;
      description?: string;
    } = {}
  ): Promise<ChargeResult> {
    // Tokenize card
    const card = await this.config.provider.tokenizeCard(cardDetails);

    // Charge
    return this.charge({
      amount: { amount, currency },
      paymentMethodId: card.id,
      customerId: options.customerId,
      description: options.description,
      capture: true,
    });
  }

  /**
   * Capture authorized payment
   */
  async capturePayment(
    paymentIntentId: string,
    amount?: number,
    currency?: Currency
  ): Promise<ChargeResult> {
    const money = amount
      ? { amount, currency: currency || this.config.defaultCurrency || 'USD' }
      : undefined;
    return this.config.provider.capturePayment(paymentIntentId, money);
  }

  /**
   * Cancel payment
   */
  async cancelPayment(paymentIntentId: string): Promise<boolean> {
    return this.config.provider.cancelPayment(paymentIntentId);
  }

  // Refunds

  /**
   * Refund payment
   */
  async refund(
    paymentIntentId: string,
    amount?: number,
    currency?: Currency,
    reason?: string
  ): Promise<Refund> {
    const request: RefundRequest = {
      paymentIntentId,
      reason,
    };

    if (amount) {
      request.amount = {
        amount,
        currency: currency || this.config.defaultCurrency || 'USD',
      };
    }

    return this.config.provider.refund(request);
  }

  // Webhooks

  /**
   * Register webhook handler
   */
  onWebhook(eventType: string, handler: (event: WebhookEvent) => void): void {
    const handlers = this.webhookHandlers.get(eventType) || [];
    handlers.push(handler);
    this.webhookHandlers.set(eventType, handlers);
  }

  /**
   * Process webhook (verify and dispatch)
   */
  async processWebhook(
    payload: string,
    signature: string
  ): Promise<WebhookEvent | null> {
    // Verify signature (simplified)
    if (this.config.webhookSecret) {
      // In production, verify HMAC signature
      if (!signature) {
        console.warn('Missing webhook signature');
        return null;
      }
    }

    try {
      const event = JSON.parse(payload) as WebhookEvent;
      event.timestamp = new Date(event.timestamp);

      // Dispatch to handlers
      const handlers = this.webhookHandlers.get(event.type) || [];
      const allHandlers = this.webhookHandlers.get('*') || [];

      [...handlers, ...allHandlers].forEach((handler) => handler(event));

      return event;
    } catch {
      console.error('Failed to parse webhook payload');
      return null;
    }
  }

  // Utilities

  /**
   * Format money for display
   */
  formatMoney(money: Money): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: money.currency,
    });

    // Convert from smallest unit
    const divisor = this.getCurrencyDivisor(money.currency);
    return formatter.format(money.amount / divisor);
  }

  /**
   * Convert display amount to smallest unit
   */
  toSmallestUnit(amount: number, currency: Currency): number {
    const divisor = this.getCurrencyDivisor(currency);
    return Math.round(amount * divisor);
  }

  /**
   * Convert smallest unit to display amount
   */
  fromSmallestUnit(amount: number, currency: Currency): number {
    const divisor = this.getCurrencyDivisor(currency);
    return amount / divisor;
  }

  private getCurrencyDivisor(currency: Currency): number {
    // Zero-decimal currencies
    if (['JPY', 'KRW'].includes(currency)) {
      return 1;
    }
    return 100;
  }

  /**
   * Validate card number (Luhn check)
   */
  isValidCardNumber(number: string): boolean {
    const cleaned = number.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cleaned)) return false;

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }
}
