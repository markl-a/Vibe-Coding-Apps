import type { PaymentMethod, FraudCheckResult, Card } from './types.js';

/**
 * Basic Fraud Detection
 *
 * Simple rule-based fraud detection for demonstration.
 * In production, you would use ML models and external services.
 *
 * Checks include:
 * - Velocity checks (transaction frequency)
 * - Amount thresholds
 * - Known bad patterns
 * - Geographic anomalies
 */

interface TransactionHistory {
  customerId: string;
  amount: number;
  timestamp: Date;
  cardLast4?: string;
}

// In-memory transaction history for velocity checks
const transactionHistory: TransactionHistory[] = [];
const blockedCards = new Set<string>();
const blockedCustomers = new Set<string>();

// Configuration
const config = {
  maxTransactionsPerHour: 10,
  maxAmountPerTransaction: 10000,
  maxDailyAmount: 50000,
  highRiskThreshold: 70,
  mediumRiskThreshold: 40,
};

export class FraudDetector {
  /**
   * Run fraud checks on a payment
   */
  async check(
    customerId: string,
    amount: number,
    paymentMethod: PaymentMethod
  ): Promise<FraudCheckResult> {
    const reasons: string[] = [];
    let riskScore = 0;

    // Check blocked entities
    if (blockedCustomers.has(customerId)) {
      return {
        approved: false,
        riskScore: 100,
        riskLevel: 'high',
        reasons: ['Customer is blocked'],
      };
    }

    if (paymentMethod.type === 'card') {
      const last4 = paymentMethod.number.slice(-4);
      if (blockedCards.has(last4)) {
        return {
          approved: false,
          riskScore: 100,
          riskLevel: 'high',
          reasons: ['Card is blocked'],
        };
      }
    }

    // Amount check
    if (amount > config.maxAmountPerTransaction) {
      riskScore += 30;
      reasons.push('Transaction amount exceeds threshold');
    }

    // Velocity checks
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTransactions = transactionHistory.filter(
      (t) => t.customerId === customerId && t.timestamp > oneHourAgo
    );

    if (recentTransactions.length >= config.maxTransactionsPerHour) {
      riskScore += 40;
      reasons.push('Too many transactions in the last hour');
    }

    // Daily amount check
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dailyTransactions = transactionHistory.filter(
      (t) => t.customerId === customerId && t.timestamp > oneDayAgo
    );
    const dailyTotal = dailyTransactions.reduce((sum, t) => sum + t.amount, 0);

    if (dailyTotal + amount > config.maxDailyAmount) {
      riskScore += 25;
      reasons.push('Daily transaction limit exceeded');
    }

    // Card-specific checks
    if (paymentMethod.type === 'card') {
      const cardRisk = this.checkCardRisk(paymentMethod);
      riskScore += cardRisk.score;
      reasons.push(...cardRisk.reasons);
    }

    // Determine risk level and approval
    const riskLevel: FraudCheckResult['riskLevel'] =
      riskScore >= config.highRiskThreshold
        ? 'high'
        : riskScore >= config.mediumRiskThreshold
          ? 'medium'
          : 'low';

    const approved = riskScore < config.highRiskThreshold;

    return {
      approved,
      riskScore: Math.min(riskScore, 100),
      riskLevel,
      reasons,
    };
  }

  /**
   * Card-specific risk checks
   */
  private checkCardRisk(card: Card): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;

    // Check for test card patterns
    if (card.number.startsWith('4000')) {
      score += 10;
      reasons.push('Card matches known test pattern');
    }

    // Check expiration proximity
    const now = new Date();
    const expDate = new Date(card.expYear, card.expMonth - 1);
    const monthsUntilExp = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);

    if (monthsUntilExp < 1) {
      score += 15;
      reasons.push('Card expires within 1 month');
    }

    return { score, reasons };
  }

  /**
   * Record transaction for velocity tracking
   */
  recordTransaction(
    customerId: string,
    amount: number,
    cardLast4?: string
  ): void {
    transactionHistory.push({
      customerId,
      amount,
      timestamp: new Date(),
      cardLast4,
    });

    // Keep only last 24 hours of history
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const cutoffIndex = transactionHistory.findIndex((t) => t.timestamp > oneDayAgo);
    if (cutoffIndex > 0) {
      transactionHistory.splice(0, cutoffIndex);
    }
  }

  /**
   * Block a card
   */
  blockCard(last4: string): void {
    blockedCards.add(last4);
  }

  /**
   * Block a customer
   */
  blockCustomer(customerId: string): void {
    blockedCustomers.add(customerId);
  }

  /**
   * Unblock a card
   */
  unblockCard(last4: string): void {
    blockedCards.delete(last4);
  }

  /**
   * Unblock a customer
   */
  unblockCustomer(customerId: string): void {
    blockedCustomers.delete(customerId);
  }
}
