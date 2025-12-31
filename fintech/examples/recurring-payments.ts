/**
 * Recurring Payments Examples
 *
 * This file demonstrates recurring payment and subscription patterns:
 * - Setup and manage recurring payments
 * - Subscription lifecycle management
 * - Payment scheduling and automation
 * - Retry logic for failed payments
 * - Dunning management
 * - Proration and billing cycles
 * - Usage-based billing
 */

// ============================================================================
// TYPES
// ============================================================================

export type BillingInterval = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type SubscriptionStatus =
  | 'active'
  | 'paused'
  | 'cancelled'
  | 'past_due'
  | 'expired'
  | 'trialing';

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'cancelled';

export interface RecurringPayment {
  id: string;
  customerId: string;
  amount: number;
  currency: string;
  interval: BillingInterval;
  intervalCount: number; // e.g., every 2 months
  startDate: Date;
  nextPaymentDate: Date;
  endDate?: Date;
  status: 'active' | 'paused' | 'cancelled';
  paymentMethodId: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  amount: number;
  currency: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  canceledAt?: Date;
  cancelAtPeriodEnd: boolean;
  paymentMethodId: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: BillingInterval;
  intervalCount: number;
  trialPeriodDays?: number;
  features: string[];
  metadata?: Record<string, unknown>;
}

export interface PaymentSchedule {
  id: string;
  recurringPaymentId: string;
  scheduledDate: Date;
  amount: number;
  status: PaymentStatus;
  attemptCount: number;
  lastAttemptDate?: Date;
  paidDate?: Date;
  failureReason?: string;
  transactionId?: string;
}

export interface RetryConfig {
  maxRetries: number;
  retryIntervals: number[]; // Hours between retries
  sendNotifications: boolean;
}

export interface DunningConfig {
  enabled: boolean;
  reminderDays: number[]; // Days before due date to send reminders
  gracePeriodDays: number;
  autoSuspendAfterDays: number;
  autoCancelAfterDays: number;
}

export interface UsageRecord {
  subscriptionId: string;
  quantity: number;
  timestamp: Date;
  description?: string;
}

export interface ProrationResult {
  amount: number;
  description: string;
  startDate: Date;
  endDate: Date;
  daysUsed: number;
  totalDays: number;
}

// ============================================================================
// RECURRING PAYMENT SERVICE
// ============================================================================

/**
 * Recurring payment management service
 */
export class RecurringPaymentService {
  private recurringPayments: Map<string, RecurringPayment> = new Map();
  private paymentSchedules: Map<string, PaymentSchedule[]> = new Map();
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    retryIntervals: [24, 48, 72], // Hours
    sendNotifications: true,
  };

  /**
   * Create recurring payment
   */
  async createRecurringPayment(
    payment: Omit<RecurringPayment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<RecurringPayment> {
    try {
      const id = `rp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const recurringPayment: RecurringPayment = {
        ...payment,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.recurringPayments.set(id, recurringPayment);

      // Generate payment schedule
      await this.generatePaymentSchedule(recurringPayment);

      console.log(`Created recurring payment: ${id}`);
      console.log(`  Amount: ${payment.amount} ${payment.currency}`);
      console.log(`  Interval: Every ${payment.intervalCount} ${payment.interval}(s)`);
      console.log(`  Next payment: ${payment.nextPaymentDate.toISOString().split('T')[0]}`);

      return recurringPayment;
    } catch (error) {
      console.error('Error creating recurring payment:', error);
      throw new Error('Failed to create recurring payment');
    }
  }

  /**
   * Generate payment schedule for next 12 periods
   */
  private async generatePaymentSchedule(
    payment: RecurringPayment
  ): Promise<void> {
    const schedules: PaymentSchedule[] = [];
    let currentDate = new Date(payment.nextPaymentDate);

    for (let i = 0; i < 12; i++) {
      // Stop if we've reached the end date
      if (payment.endDate && currentDate > payment.endDate) {
        break;
      }

      const schedule: PaymentSchedule = {
        id: `ps_${Date.now()}_${i}`,
        recurringPaymentId: payment.id,
        scheduledDate: new Date(currentDate),
        amount: payment.amount,
        status: 'pending',
        attemptCount: 0,
      };

      schedules.push(schedule);

      // Calculate next date
      currentDate = this.calculateNextDate(currentDate, payment.interval, payment.intervalCount);
    }

    this.paymentSchedules.set(payment.id, schedules);
  }

  /**
   * Calculate next payment date
   */
  private calculateNextDate(
    currentDate: Date,
    interval: BillingInterval,
    intervalCount: number
  ): Date {
    const next = new Date(currentDate);

    switch (interval) {
      case 'daily':
        next.setDate(next.getDate() + intervalCount);
        break;
      case 'weekly':
        next.setDate(next.getDate() + intervalCount * 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + intervalCount);
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + intervalCount * 3);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + intervalCount);
        break;
    }

    return next;
  }

  /**
   * Process due payments
   */
  async processDuePayments(currentDate: Date = new Date()): Promise<void> {
    console.log(`\nProcessing due payments for ${currentDate.toISOString().split('T')[0]}...`);

    for (const [paymentId, schedules] of this.paymentSchedules.entries()) {
      const dueSchedules = schedules.filter(
        (s) =>
          s.status === 'pending' &&
          s.scheduledDate <= currentDate &&
          s.attemptCount < this.retryConfig.maxRetries
      );

      for (const schedule of dueSchedules) {
        await this.processPayment(paymentId, schedule);
      }
    }
  }

  /**
   * Process individual payment
   */
  private async processPayment(
    paymentId: string,
    schedule: PaymentSchedule
  ): Promise<void> {
    try {
      const payment = this.recurringPayments.get(paymentId);
      if (!payment) {
        throw new Error(`Payment ${paymentId} not found`);
      }

      console.log(`  Processing payment: ${schedule.id}`);
      console.log(`    Amount: ${schedule.amount}`);
      console.log(`    Attempt: ${schedule.attemptCount + 1}/${this.retryConfig.maxRetries}`);

      schedule.attemptCount++;
      schedule.lastAttemptDate = new Date();

      // Simulate payment processing (80% success rate)
      const success = Math.random() > 0.2;

      if (success) {
        schedule.status = 'succeeded';
        schedule.paidDate = new Date();
        schedule.transactionId = `txn_${Date.now()}`;
        console.log(`    Status: SUCCESS`);

        // Update next payment date
        payment.nextPaymentDate = this.calculateNextDate(
          payment.nextPaymentDate,
          payment.interval,
          payment.intervalCount
        );
        payment.updatedAt = new Date();
      } else {
        schedule.failureReason = 'Insufficient funds';
        console.log(`    Status: FAILED - ${schedule.failureReason}`);

        // Schedule retry
        if (schedule.attemptCount < this.retryConfig.maxRetries) {
          await this.scheduleRetry(schedule);
        } else {
          schedule.status = 'failed';
          console.log(`    Maximum retries reached. Payment failed permanently.`);
        }
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      schedule.status = 'failed';
      schedule.failureReason = 'Processing error';
    }
  }

  /**
   * Schedule payment retry
   */
  private async scheduleRetry(schedule: PaymentSchedule): Promise<void> {
    const retryHours = this.retryConfig.retryIntervals[schedule.attemptCount - 1];
    const retryDate = new Date(Date.now() + retryHours * 60 * 60 * 1000);

    console.log(`    Retry scheduled for: ${retryDate.toISOString()}`);

    if (this.retryConfig.sendNotifications) {
      console.log(`    Notification sent to customer`);
    }
  }

  /**
   * Cancel recurring payment
   */
  async cancelRecurringPayment(paymentId: string): Promise<void> {
    const payment = this.recurringPayments.get(paymentId);
    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    payment.status = 'cancelled';
    payment.updatedAt = new Date();

    console.log(`Cancelled recurring payment: ${paymentId}`);
  }

  /**
   * Pause recurring payment
   */
  async pauseRecurringPayment(paymentId: string): Promise<void> {
    const payment = this.recurringPayments.get(paymentId);
    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    payment.status = 'paused';
    payment.updatedAt = new Date();

    console.log(`Paused recurring payment: ${paymentId}`);
  }

  /**
   * Resume recurring payment
   */
  async resumeRecurringPayment(paymentId: string): Promise<void> {
    const payment = this.recurringPayments.get(paymentId);
    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    payment.status = 'active';
    payment.updatedAt = new Date();

    console.log(`Resumed recurring payment: ${paymentId}`);
  }

  /**
   * Get payment schedule
   */
  getPaymentSchedule(paymentId: string): PaymentSchedule[] {
    return this.paymentSchedules.get(paymentId) || [];
  }

  /**
   * Get recurring payment
   */
  getRecurringPayment(paymentId: string): RecurringPayment | undefined {
    return this.recurringPayments.get(paymentId);
  }
}

// ============================================================================
// SUBSCRIPTION SERVICE
// ============================================================================

/**
 * Subscription management service
 */
export class SubscriptionService {
  private subscriptions: Map<string, Subscription> = new Map();
  private plans: Map<string, SubscriptionPlan> = new Map();
  private usageRecords: Map<string, UsageRecord[]> = new Map();

  /**
   * Create subscription plan
   */
  createPlan(plan: SubscriptionPlan): void {
    this.plans.set(plan.id, plan);
    console.log(`Created subscription plan: ${plan.name}`);
    console.log(`  Amount: ${plan.amount} ${plan.currency}/${plan.interval}`);
  }

  /**
   * Create subscription
   */
  async createSubscription(
    customerId: string,
    planId: string,
    paymentMethodId: string,
    startImmediately: boolean = true
  ): Promise<Subscription> {
    try {
      const plan = this.plans.get(planId);
      if (!plan) {
        throw new Error(`Plan ${planId} not found`);
      }

      const id = `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const now = new Date();

      let status: SubscriptionStatus = 'active';
      let trialEnd: Date | undefined;

      // Apply trial period if configured
      if (plan.trialPeriodDays && plan.trialPeriodDays > 0) {
        status = 'trialing';
        trialEnd = new Date(now.getTime() + plan.trialPeriodDays * 24 * 60 * 60 * 1000);
      }

      const currentPeriodStart = startImmediately ? now : new Date();
      const currentPeriodEnd = this.calculatePeriodEnd(
        currentPeriodStart,
        plan.interval,
        plan.intervalCount
      );

      const subscription: Subscription = {
        id,
        customerId,
        planId,
        status,
        billingInterval: plan.interval,
        amount: plan.amount,
        currency: plan.currency,
        currentPeriodStart,
        currentPeriodEnd,
        trialEnd,
        cancelAtPeriodEnd: false,
        paymentMethodId,
        createdAt: now,
        updatedAt: now,
      };

      this.subscriptions.set(id, subscription);

      console.log(`Created subscription: ${id}`);
      console.log(`  Plan: ${plan.name}`);
      console.log(`  Status: ${status}`);
      console.log(`  Current period: ${currentPeriodStart.toISOString().split('T')[0]} to ${currentPeriodEnd.toISOString().split('T')[0]}`);

      if (trialEnd) {
        console.log(`  Trial ends: ${trialEnd.toISOString().split('T')[0]}`);
      }

      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Calculate period end date
   */
  private calculatePeriodEnd(
    startDate: Date,
    interval: BillingInterval,
    intervalCount: number
  ): Date {
    const end = new Date(startDate);

    switch (interval) {
      case 'daily':
        end.setDate(end.getDate() + intervalCount);
        break;
      case 'weekly':
        end.setDate(end.getDate() + intervalCount * 7);
        break;
      case 'monthly':
        end.setMonth(end.getMonth() + intervalCount);
        break;
      case 'quarterly':
        end.setMonth(end.getMonth() + intervalCount * 3);
        break;
      case 'yearly':
        end.setFullYear(end.getFullYear() + intervalCount);
        break;
    }

    return end;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    if (cancelAtPeriodEnd) {
      subscription.cancelAtPeriodEnd = true;
      subscription.updatedAt = new Date();
      console.log(`Subscription ${subscriptionId} will cancel at period end (${subscription.currentPeriodEnd.toISOString().split('T')[0]})`);
    } else {
      subscription.status = 'cancelled';
      subscription.canceledAt = new Date();
      subscription.updatedAt = new Date();
      console.log(`Subscription ${subscriptionId} cancelled immediately`);
    }
  }

  /**
   * Update subscription (upgrade/downgrade)
   */
  async updateSubscription(
    subscriptionId: string,
    newPlanId: string,
    prorate: boolean = true
  ): Promise<ProrationResult | null> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    const newPlan = this.plans.get(newPlanId);
    if (!newPlan) {
      throw new Error(`Plan ${newPlanId} not found`);
    }

    let prorationResult: ProrationResult | null = null;

    if (prorate) {
      prorationResult = this.calculateProration(subscription, newPlan.amount);
      console.log(`\nProration calculated:`);
      console.log(`  ${prorationResult.description}`);
      console.log(`  Amount: ${prorationResult.amount} ${subscription.currency}`);
    }

    subscription.planId = newPlanId;
    subscription.amount = newPlan.amount;
    subscription.billingInterval = newPlan.interval;
    subscription.updatedAt = new Date();

    console.log(`Updated subscription ${subscriptionId} to plan ${newPlan.name}`);

    return prorationResult;
  }

  /**
   * Calculate proration
   */
  private calculateProration(
    subscription: Subscription,
    newAmount: number
  ): ProrationResult {
    const now = new Date();
    const periodStart = subscription.currentPeriodStart;
    const periodEnd = subscription.currentPeriodEnd;

    const totalDays = Math.ceil(
      (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysUsed = Math.ceil(
      (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysRemaining = totalDays - daysUsed;

    // Calculate unused amount from old plan
    const unusedAmount = (subscription.amount * daysRemaining) / totalDays;

    // Calculate amount for new plan for remaining period
    const newPlanAmount = (newAmount * daysRemaining) / totalDays;

    // Proration amount (positive = charge, negative = credit)
    const prorationAmount = newPlanAmount - unusedAmount;

    const description =
      prorationAmount > 0
        ? `Upgrade: charge ${Math.abs(prorationAmount).toFixed(2)} for remaining ${daysRemaining} days`
        : `Downgrade: credit ${Math.abs(prorationAmount).toFixed(2)} for remaining ${daysRemaining} days`;

    return {
      amount: prorationAmount,
      description,
      startDate: now,
      endDate: periodEnd,
      daysUsed,
      totalDays,
    };
  }

  /**
   * Record usage (for usage-based billing)
   */
  recordUsage(subscriptionId: string, quantity: number, description?: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    const record: UsageRecord = {
      subscriptionId,
      quantity,
      timestamp: new Date(),
      description,
    };

    const records = this.usageRecords.get(subscriptionId) || [];
    records.push(record);
    this.usageRecords.set(subscriptionId, records);

    console.log(`Recorded usage for ${subscriptionId}: ${quantity} units`);
  }

  /**
   * Get usage for billing period
   */
  getUsageForPeriod(subscriptionId: string, startDate: Date, endDate: Date): number {
    const records = this.usageRecords.get(subscriptionId) || [];

    const periodRecords = records.filter(
      (r) => r.timestamp >= startDate && r.timestamp <= endDate
    );

    return periodRecords.reduce((sum, r) => sum + r.quantity, 0);
  }

  /**
   * Get subscription
   */
  getSubscription(subscriptionId: string): Subscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  /**
   * Get plan
   */
  getPlan(planId: string): SubscriptionPlan | undefined {
    return this.plans.get(planId);
  }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example: Setup recurring payment
 */
export async function exampleSetupRecurringPayment(): Promise<void> {
  console.log('Example: Setup Recurring Payment\n');

  const service = new RecurringPaymentService();

  // Create monthly recurring payment
  const payment = await service.createRecurringPayment({
    customerId: 'cust_001',
    amount: 9.99,
    currency: 'USD',
    interval: 'monthly',
    intervalCount: 1,
    startDate: new Date(),
    nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: 'active',
    paymentMethodId: 'pm_card_123',
    description: 'Netflix Subscription',
  });

  console.log('\nPayment Schedule (next 5 payments):');
  const schedule = service.getPaymentSchedule(payment.id);
  schedule.slice(0, 5).forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.scheduledDate.toISOString().split('T')[0]} - $${s.amount} (${s.status})`);
  });
}

/**
 * Example: Process payments
 */
export async function exampleProcessPayments(): Promise<void> {
  console.log('\nExample: Process Due Payments\n');

  const service = new RecurringPaymentService();

  // Create payment with next payment today
  await service.createRecurringPayment({
    customerId: 'cust_002',
    amount: 19.99,
    currency: 'USD',
    interval: 'monthly',
    intervalCount: 1,
    startDate: new Date(),
    nextPaymentDate: new Date(),
    status: 'active',
    paymentMethodId: 'pm_card_456',
    description: 'Spotify Premium',
  });

  // Process due payments
  await service.processDuePayments();
}

/**
 * Example: Subscription management
 */
export async function exampleSubscriptionManagement(): Promise<void> {
  console.log('\nExample: Subscription Management\n');

  const service = new SubscriptionService();

  // Create plans
  service.createPlan({
    id: 'plan_basic',
    name: 'Basic Plan',
    description: 'Basic features',
    amount: 9.99,
    currency: 'USD',
    interval: 'monthly',
    intervalCount: 1,
    trialPeriodDays: 14,
    features: ['Feature A', 'Feature B'],
  });

  service.createPlan({
    id: 'plan_pro',
    name: 'Pro Plan',
    description: 'All features',
    amount: 29.99,
    currency: 'USD',
    interval: 'monthly',
    intervalCount: 1,
    features: ['Feature A', 'Feature B', 'Feature C', 'Feature D'],
  });

  // Create subscription with trial
  const subscription = await service.createSubscription(
    'cust_003',
    'plan_basic',
    'pm_card_789'
  );

  console.log(`\nSubscription created with ${subscription.status} status`);
}

/**
 * Example: Upgrade subscription
 */
export async function exampleUpgradeSubscription(): Promise<void> {
  console.log('\nExample: Upgrade Subscription with Proration\n');

  const service = new SubscriptionService();

  // Create plans
  service.createPlan({
    id: 'plan_starter',
    name: 'Starter Plan',
    description: 'For individuals',
    amount: 10,
    currency: 'USD',
    interval: 'monthly',
    intervalCount: 1,
    features: ['5 projects'],
  });

  service.createPlan({
    id: 'plan_business',
    name: 'Business Plan',
    description: 'For teams',
    amount: 50,
    currency: 'USD',
    interval: 'monthly',
    intervalCount: 1,
    features: ['Unlimited projects', 'Team collaboration'],
  });

  // Create subscription
  const subscription = await service.createSubscription(
    'cust_004',
    'plan_starter',
    'pm_card_101',
    true
  );

  // Simulate 15 days passing
  subscription.currentPeriodStart = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

  // Upgrade to business plan
  const proration = await service.updateSubscription(subscription.id, 'plan_business', true);

  if (proration) {
    console.log(`\nProration details:`);
    console.log(`  Days used: ${proration.daysUsed}/${proration.totalDays}`);
    console.log(`  ${proration.description}`);
  }
}

/**
 * Example: Usage-based billing
 */
export async function exampleUsageBasedBilling(): Promise<void> {
  console.log('\nExample: Usage-Based Billing\n');

  const service = new SubscriptionService();

  // Create usage-based plan
  service.createPlan({
    id: 'plan_api',
    name: 'API Plan',
    description: 'Pay per API call',
    amount: 0.01, // $0.01 per call
    currency: 'USD',
    interval: 'monthly',
    intervalCount: 1,
    features: ['API access'],
  });

  // Create subscription
  const subscription = await service.createSubscription(
    'cust_005',
    'plan_api',
    'pm_card_202'
  );

  // Record usage
  console.log('Recording API usage...');
  service.recordUsage(subscription.id, 100, 'API calls - Day 1');
  service.recordUsage(subscription.id, 250, 'API calls - Day 2');
  service.recordUsage(subscription.id, 175, 'API calls - Day 3');

  // Calculate usage for period
  const totalUsage = service.getUsageForPeriod(
    subscription.id,
    subscription.currentPeriodStart,
    subscription.currentPeriodEnd
  );

  const plan = service.getPlan('plan_api');
  const totalCharge = totalUsage * (plan?.amount || 0);

  console.log(`\nUsage Summary:`);
  console.log(`  Total API calls: ${totalUsage}`);
  console.log(`  Rate: $${plan?.amount} per call`);
  console.log(`  Total charge: $${totalCharge.toFixed(2)}`);
}

/**
 * Example: Cancel subscription
 */
export async function exampleCancelSubscription(): Promise<void> {
  console.log('\nExample: Cancel Subscription\n');

  const service = new SubscriptionService();

  // Create plan and subscription
  service.createPlan({
    id: 'plan_premium',
    name: 'Premium Plan',
    description: 'Premium features',
    amount: 49.99,
    currency: 'USD',
    interval: 'monthly',
    intervalCount: 1,
    features: ['All features'],
  });

  const subscription = await service.createSubscription(
    'cust_006',
    'plan_premium',
    'pm_card_303'
  );

  // Cancel at period end (customer retains access until end of billing period)
  await service.cancelSubscription(subscription.id, true);

  const updated = service.getSubscription(subscription.id);
  console.log(`\nSubscription status: ${updated?.status}`);
  console.log(`Cancel at period end: ${updated?.cancelAtPeriodEnd ? 'YES' : 'NO'}`);
  console.log(`Access until: ${updated?.currentPeriodEnd.toISOString().split('T')[0]}`);
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  await exampleSetupRecurringPayment();
  await exampleProcessPayments();
  await exampleSubscriptionManagement();
  await exampleUpgradeSubscription();
  await exampleUsageBasedBilling();
  await exampleCancelSubscription();
}

// Uncomment to run examples
// runAllExamples().catch(console.error);
