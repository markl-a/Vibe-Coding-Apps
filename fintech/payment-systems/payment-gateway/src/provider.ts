/**
 * Mock Payment Provider
 *
 * Simulates a payment provider like Stripe
 */

import type {
  Money,
  PaymentIntent,
  PaymentCard,
  CardDetails,
  ChargeResult,
  RefundRequest,
  Refund,
  PaymentProvider,
  CardBrand,
} from './types.js';

export class MockPaymentProvider implements PaymentProvider {
  name = 'MockPay';
  private intents: Map<string, PaymentIntent> = new Map();
  private cards: Map<string, PaymentCard> = new Map();
  private refunds: Map<string, Refund> = new Map();
  private idCounter = 0;

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${++this.idCounter}`;
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(
    amount: Money,
    options: Record<string, unknown> = {}
  ): Promise<PaymentIntent> {
    await this.simulateDelay();

    const intent: PaymentIntent = {
      id: this.generateId('pi'),
      amount,
      customerId: options.customerId as string | undefined,
      description: options.description as string | undefined,
      status: 'pending',
      clientSecret: this.generateId('cs'),
      metadata: options.metadata as Record<string, unknown> | undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.intents.set(intent.id, intent);
    return intent;
  }

  /**
   * Confirm payment with payment method
   */
  async confirmPayment(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<ChargeResult> {
    await this.simulateDelay();

    const intent = this.intents.get(paymentIntentId);
    if (!intent) {
      return {
        success: false,
        error: {
          code: 'intent_not_found',
          message: 'Payment intent not found',
        },
      };
    }

    const card = this.cards.get(paymentMethodId);
    if (!card) {
      return {
        success: false,
        error: {
          code: 'payment_method_not_found',
          message: 'Payment method not found',
        },
      };
    }

    // Simulate card validation
    const validation = this.validateCard(card);
    if (!validation.valid) {
      intent.status = 'failed';
      intent.updatedAt = new Date();
      return {
        success: false,
        error: validation.error!,
      };
    }

    // Simulate processing
    intent.paymentMethodId = paymentMethodId;
    intent.status = 'authorized';
    intent.updatedAt = new Date();

    return {
      success: true,
      transactionId: this.generateId('txn'),
      paymentIntent: { ...intent },
    };
  }

  /**
   * Capture authorized payment
   */
  async capturePayment(
    paymentIntentId: string,
    amount?: Money
  ): Promise<ChargeResult> {
    await this.simulateDelay();

    const intent = this.intents.get(paymentIntentId);
    if (!intent) {
      return {
        success: false,
        error: {
          code: 'intent_not_found',
          message: 'Payment intent not found',
        },
      };
    }

    if (intent.status !== 'authorized') {
      return {
        success: false,
        error: {
          code: 'invalid_status',
          message: `Cannot capture payment with status: ${intent.status}`,
        },
      };
    }

    const captureAmount = amount || intent.amount;

    // Validate capture amount
    if (captureAmount.amount > intent.amount.amount) {
      return {
        success: false,
        error: {
          code: 'amount_too_large',
          message: 'Capture amount exceeds authorized amount',
        },
      };
    }

    intent.status = 'captured';
    intent.capturedAmount = captureAmount;
    intent.updatedAt = new Date();

    // Simulate completion
    setTimeout(() => {
      intent.status = 'completed';
      intent.updatedAt = new Date();
    }, 100);

    return {
      success: true,
      transactionId: this.generateId('txn'),
      paymentIntent: { ...intent },
    };
  }

  /**
   * Cancel payment intent
   */
  async cancelPayment(paymentIntentId: string): Promise<boolean> {
    await this.simulateDelay();

    const intent = this.intents.get(paymentIntentId);
    if (!intent) return false;

    if (['completed', 'refunded'].includes(intent.status)) {
      return false;
    }

    intent.status = 'cancelled';
    intent.updatedAt = new Date();
    return true;
  }

  /**
   * Process refund
   */
  async refund(request: RefundRequest): Promise<Refund> {
    await this.simulateDelay();

    const intent = this.intents.get(request.paymentIntentId);
    if (!intent) {
      throw new Error('Payment intent not found');
    }

    if (!['completed', 'captured'].includes(intent.status)) {
      throw new Error(`Cannot refund payment with status: ${intent.status}`);
    }

    const capturedAmount = intent.capturedAmount?.amount || intent.amount.amount;
    const refundedAmount = intent.refundedAmount?.amount || 0;
    const refundAmount = request.amount?.amount || (capturedAmount - refundedAmount);

    if (refundAmount > capturedAmount - refundedAmount) {
      throw new Error('Refund amount exceeds available balance');
    }

    const refund: Refund = {
      id: this.generateId('ref'),
      paymentIntentId: request.paymentIntentId,
      amount: {
        amount: refundAmount,
        currency: intent.amount.currency,
      },
      status: 'completed',
      reason: request.reason,
      createdAt: new Date(),
    };

    this.refunds.set(refund.id, refund);

    // Update intent
    intent.refundedAmount = {
      amount: refundedAmount + refundAmount,
      currency: intent.amount.currency,
    };

    if (intent.refundedAmount.amount >= capturedAmount) {
      intent.status = 'refunded';
    } else {
      intent.status = 'partially_refunded';
    }
    intent.updatedAt = new Date();

    return refund;
  }

  /**
   * Tokenize card details
   */
  async tokenizeCard(card: CardDetails): Promise<PaymentCard> {
    await this.simulateDelay();

    // Basic validation
    if (!this.isValidCardNumber(card.number)) {
      throw new Error('Invalid card number');
    }

    const brand = this.detectCardBrand(card.number);
    const last4 = card.number.slice(-4);
    const fingerprint = this.generateFingerprint(card.number);

    const paymentCard: PaymentCard = {
      id: this.generateId('pm'),
      brand,
      last4,
      expMonth: card.expMonth,
      expYear: card.expYear,
      holderName: card.holderName,
      fingerprint,
    };

    this.cards.set(paymentCard.id, paymentCard);
    return paymentCard;
  }

  /**
   * Get payment intent
   */
  getPaymentIntent(id: string): PaymentIntent | undefined {
    return this.intents.get(id);
  }

  /**
   * Get card
   */
  getCard(id: string): PaymentCard | undefined {
    return this.cards.get(id);
  }

  private async simulateDelay(): Promise<void> {
    const delay = 50 + Math.random() * 100;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  private validateCard(card: PaymentCard): { valid: boolean; error?: { code: string; message: string } } {
    const now = new Date();
    const expDate = new Date(card.expYear, card.expMonth - 1);

    if (expDate < now) {
      return {
        valid: false,
        error: {
          code: 'card_expired',
          message: 'Card has expired',
        },
      };
    }

    // Simulate random decline (5% chance)
    if (Math.random() < 0.05) {
      return {
        valid: false,
        error: {
          code: 'card_declined',
          message: 'Card was declined',
          declineCode: 'insufficient_funds',
        } as { code: string; message: string },
      };
    }

    return { valid: true };
  }

  private isValidCardNumber(number: string): boolean {
    const cleaned = number.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cleaned)) return false;

    // Luhn algorithm
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

  private detectCardBrand(number: string): CardBrand {
    const cleaned = number.replace(/\s/g, '');

    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^6(?:011|5)/.test(cleaned)) return 'discover';
    if (/^35/.test(cleaned)) return 'jcb';
    if (/^62/.test(cleaned)) return 'unionpay';

    return 'visa'; // Default
  }

  private generateFingerprint(cardNumber: string): string {
    // Simple hash for demo (use proper hashing in production)
    let hash = 0;
    for (let i = 0; i < cardNumber.length; i++) {
      const char = cardNumber.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `fp_${Math.abs(hash).toString(36)}`;
  }
}
