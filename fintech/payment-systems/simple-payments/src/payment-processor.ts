import { v4 as uuid } from 'uuid';
import type {
  PaymentGateway,
  PaymentMethod,
  PaymentIntent,
  Transaction,
  TransactionStatus,
  WebhookEvent,
} from './types.js';
import { PaymentIntentSchema } from './types.js';
import { FraudDetector } from './fraud-detection.js';

/**
 * Payment Processor
 *
 * Core payment processing engine that:
 * - Validates payment requests
 * - Performs fraud checks
 * - Routes to payment gateway
 * - Handles idempotency
 * - Manages transaction lifecycle
 * - Emits webhook events
 */

// Transaction storage (in production, use a database)
const transactions = new Map<string, Transaction>();
const idempotencyKeys = new Map<string, string>();

// Webhook handlers
type WebhookHandler = (event: WebhookEvent) => void | Promise<void>;
const webhookHandlers: WebhookHandler[] = [];

export class PaymentProcessor {
  private gateway: PaymentGateway;
  private fraudDetector: FraudDetector;

  constructor(gateway: PaymentGateway) {
    this.gateway = gateway;
    this.fraudDetector = new FraudDetector();
  }

  /**
   * Create a payment
   */
  async createPayment(
    intent: PaymentIntent,
    paymentMethod: PaymentMethod
  ): Promise<Transaction> {
    // Validate intent
    const validatedIntent = PaymentIntentSchema.parse(intent);

    // Check idempotency
    if (validatedIntent.idempotencyKey) {
      const existingId = idempotencyKeys.get(validatedIntent.idempotencyKey);
      if (existingId) {
        const existingTransaction = transactions.get(existingId);
        if (existingTransaction) {
          console.log(`[Payment] Returning cached transaction for idempotency key`);
          return existingTransaction;
        }
      }
    }

    // Create transaction record
    const transactionId = uuid();
    const now = new Date();

    const transaction: Transaction = {
      id: transactionId,
      amount: validatedIntent.amount,
      currency: validatedIntent.currency,
      status: 'pending',
      paymentMethod: paymentMethod.type,
      customerId: validatedIntent.customerId,
      description: validatedIntent.description,
      metadata: validatedIntent.metadata,
      createdAt: now,
      updatedAt: now,
    };

    transactions.set(transactionId, transaction);

    // Store idempotency key
    if (validatedIntent.idempotencyKey) {
      idempotencyKeys.set(validatedIntent.idempotencyKey, transactionId);
    }

    console.log(`[Payment] Created transaction ${transactionId}`);
    await this.emitEvent('payment.created', transaction);

    return transaction;
  }

  /**
   * Process a payment
   */
  async processPayment(
    transactionId: string,
    paymentMethod: PaymentMethod
  ): Promise<Transaction> {
    const transaction = transactions.get(transactionId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'pending') {
      throw new Error(`Cannot process transaction in ${transaction.status} status`);
    }

    // Update status to processing
    transaction.status = 'processing';
    transaction.updatedAt = new Date();

    // Perform fraud check
    const customerId = transaction.customerId ?? 'anonymous';
    const fraudResult = await this.fraudDetector.check(
      customerId,
      transaction.amount,
      paymentMethod
    );

    console.log(`[Payment] Fraud check: ${fraudResult.riskLevel} risk (score: ${fraudResult.riskScore})`);

    if (!fraudResult.approved) {
      transaction.status = 'failed';
      transaction.errorCode = 'fraud_detected';
      transaction.errorMessage = `Payment blocked: ${fraudResult.reasons.join(', ')}`;
      transaction.updatedAt = new Date();

      await this.emitEvent('payment.failed', transaction);
      return transaction;
    }

    // Process through gateway
    try {
      const gatewayResponse = await this.gateway.charge(
        transaction.amount,
        transaction.currency,
        paymentMethod
      );

      transaction.gatewayId = gatewayResponse.transactionId;
      transaction.gatewayResponse = gatewayResponse.rawResponse;
      transaction.status = gatewayResponse.status;

      if (!gatewayResponse.success) {
        transaction.errorCode = gatewayResponse.errorCode;
        transaction.errorMessage = gatewayResponse.errorMessage;
        await this.emitEvent('payment.failed', transaction);
      } else {
        // Record successful transaction for velocity tracking
        this.fraudDetector.recordTransaction(
          customerId,
          transaction.amount,
          paymentMethod.type === 'card' ? paymentMethod.number.slice(-4) : undefined
        );
        await this.emitEvent('payment.succeeded', transaction);
      }
    } catch (error) {
      transaction.status = 'failed';
      transaction.errorCode = 'gateway_error';
      transaction.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.emitEvent('payment.failed', transaction);
    }

    transaction.updatedAt = new Date();
    return transaction;
  }

  /**
   * Refund a payment
   */
  async refundPayment(transactionId: string, amount?: number): Promise<Transaction> {
    const transaction = transactions.get(transactionId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'succeeded') {
      throw new Error(`Cannot refund transaction in ${transaction.status} status`);
    }

    if (!transaction.gatewayId) {
      throw new Error('Transaction has no gateway reference');
    }

    const refundAmount = amount ?? transaction.amount;

    if (refundAmount > transaction.amount) {
      throw new Error('Refund amount exceeds transaction amount');
    }

    console.log(`[Payment] Processing refund of ${refundAmount} for ${transactionId}`);

    const gatewayResponse = await this.gateway.refund(transaction.gatewayId, refundAmount);

    if (gatewayResponse.success) {
      transaction.status = 'refunded';
      await this.emitEvent('refund.succeeded', { ...transaction, refundAmount });
    } else {
      throw new Error(gatewayResponse.errorMessage ?? 'Refund failed');
    }

    transaction.updatedAt = new Date();
    return transaction;
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId: string): Promise<Transaction | null> {
    return transactions.get(transactionId) ?? null;
  }

  /**
   * List transactions with optional filters
   */
  async listTransactions(options?: {
    customerId?: string;
    status?: TransactionStatus;
    limit?: number;
  }): Promise<Transaction[]> {
    let result = Array.from(transactions.values());

    if (options?.customerId) {
      result = result.filter((t) => t.customerId === options.customerId);
    }

    if (options?.status) {
      result = result.filter((t) => t.status === options.status);
    }

    // Sort by creation date descending
    result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (options?.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  /**
   * Register webhook handler
   */
  onWebhook(handler: WebhookHandler): void {
    webhookHandlers.push(handler);
  }

  /**
   * Emit webhook event
   */
  private async emitEvent(type: WebhookEvent['type'], data: unknown): Promise<void> {
    const event: WebhookEvent = {
      id: uuid(),
      type,
      data,
      createdAt: new Date(),
    };

    console.log(`[Webhook] Emitting ${type}`);

    for (const handler of webhookHandlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`[Webhook] Handler error:`, error);
      }
    }
  }

  /**
   * Get fraud detector instance
   */
  getFraudDetector(): FraudDetector {
    return this.fraudDetector;
  }
}
