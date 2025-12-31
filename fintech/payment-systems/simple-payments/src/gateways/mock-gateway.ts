import { v4 as uuid } from 'uuid';
import type {
  PaymentGateway,
  PaymentMethod,
  GatewayResponse,
  TransactionStatus,
} from '../types.js';

/**
 * Mock Payment Gateway
 *
 * Simulates a payment gateway for testing and development.
 * Uses card numbers to determine success/failure scenarios.
 *
 * Test cards:
 * - 4242424242424242: Success
 * - 4000000000000002: Declined
 * - 4000000000000069: Expired card
 * - 4000000000000127: Incorrect CVC
 * - 4000000000009995: Insufficient funds
 */

// Simulated transaction storage
const transactions = new Map<string, {
  status: TransactionStatus;
  amount: number;
  currency: string;
}>();

export class MockGateway implements PaymentGateway {
  name = 'mock_gateway';

  // Simulated processing delay
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async charge(
    amount: number,
    currency: string,
    paymentMethod: PaymentMethod
  ): Promise<GatewayResponse> {
    // Simulate network delay
    await this.delay(100 + Math.random() * 200);

    const transactionId = uuid();

    // Check for test card scenarios
    if (paymentMethod.type === 'card') {
      const cardNumber = paymentMethod.number;

      // Declined card
      if (cardNumber === '4000000000000002') {
        return {
          success: false,
          transactionId,
          status: 'failed',
          errorCode: 'card_declined',
          errorMessage: 'The card was declined.',
        };
      }

      // Expired card
      if (cardNumber === '4000000000000069') {
        return {
          success: false,
          transactionId,
          status: 'failed',
          errorCode: 'expired_card',
          errorMessage: 'The card has expired.',
        };
      }

      // Incorrect CVC
      if (cardNumber === '4000000000000127') {
        return {
          success: false,
          transactionId,
          status: 'failed',
          errorCode: 'incorrect_cvc',
          errorMessage: 'The CVC is incorrect.',
        };
      }

      // Insufficient funds
      if (cardNumber === '4000000000009995') {
        return {
          success: false,
          transactionId,
          status: 'failed',
          errorCode: 'insufficient_funds',
          errorMessage: 'Insufficient funds.',
        };
      }
    }

    // Store successful transaction
    transactions.set(transactionId, {
      status: 'succeeded',
      amount,
      currency,
    });

    return {
      success: true,
      transactionId,
      status: 'succeeded',
      rawResponse: {
        gateway: this.name,
        processedAt: new Date().toISOString(),
      },
    };
  }

  async refund(transactionId: string, amount?: number): Promise<GatewayResponse> {
    await this.delay(100);

    const transaction = transactions.get(transactionId);

    if (!transaction) {
      return {
        success: false,
        transactionId,
        status: 'failed',
        errorCode: 'transaction_not_found',
        errorMessage: 'Transaction not found.',
      };
    }

    if (transaction.status === 'refunded') {
      return {
        success: false,
        transactionId,
        status: 'failed',
        errorCode: 'already_refunded',
        errorMessage: 'Transaction has already been refunded.',
      };
    }

    const refundAmount = amount ?? transaction.amount;

    if (refundAmount > transaction.amount) {
      return {
        success: false,
        transactionId,
        status: 'failed',
        errorCode: 'refund_amount_exceeded',
        errorMessage: 'Refund amount exceeds original transaction.',
      };
    }

    // Update transaction status
    transaction.status = 'refunded';

    return {
      success: true,
      transactionId: uuid(),
      status: 'refunded',
      rawResponse: {
        originalTransactionId: transactionId,
        refundAmount,
        refundedAt: new Date().toISOString(),
      },
    };
  }

  async getTransaction(transactionId: string): Promise<GatewayResponse> {
    await this.delay(50);

    const transaction = transactions.get(transactionId);

    if (!transaction) {
      return {
        success: false,
        transactionId,
        status: 'failed',
        errorCode: 'transaction_not_found',
        errorMessage: 'Transaction not found.',
      };
    }

    return {
      success: true,
      transactionId,
      status: transaction.status,
      rawResponse: transaction,
    };
  }
}
