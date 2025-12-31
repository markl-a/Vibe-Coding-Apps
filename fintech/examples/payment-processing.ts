/**
 * Payment Processing Examples
 *
 * This file demonstrates payment processing patterns for fintech applications:
 * - Payment gateway integration (Stripe, PayPal)
 * - Credit card processing
 * - ACH/Bank transfers
 * - Payment intents and confirmations
 * - Refunds and disputes
 * - Subscription billing
 * - Payment webhooks
 *
 * @requires stripe
 * @requires axios (for API calls)
 */

import Stripe from 'stripe';

// ============================================================================
// STRIPE INTEGRATION
// ============================================================================

/**
 * Initialize Stripe client
 */
export function initializeStripe(apiKey: string): Stripe {
  return new Stripe(apiKey, {
    apiVersion: '2024-12-18.acacia',
  });
}

// ============================================================================
// PAYMENT INTENTS (RECOMMENDED APPROACH)
// ============================================================================

/**
 * Create a payment intent
 * Payment intents track the lifecycle of a payment
 */
export async function createPaymentIntent(
  stripe: Stripe,
  amount: number,
  currency: string = 'usd',
  metadata?: Record<string, string>
): Promise<Stripe.PaymentIntent> {
  try {
    console.log(`💳 Creating payment intent for ${amount / 100} ${currency.toUpperCase()}...`);

    const paymentIntent = await stripe.paymentIntents.create({
      amount, // Amount in cents
      currency,
      metadata: metadata || {},
      // Payment method types to accept
      payment_method_types: ['card'],
      // Enable automatic payment methods
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log(`✅ Payment intent created: ${paymentIntent.id}`);
    console.log(`  Status: ${paymentIntent.status}`);
    console.log(`  Client Secret: ${paymentIntent.client_secret}`);

    return paymentIntent;
  } catch (error) {
    console.error('❌ Error creating payment intent:', error);
    throw error;
  }
}

/**
 * Confirm a payment intent with payment method
 */
export async function confirmPaymentIntent(
  stripe: Stripe,
  paymentIntentId: string,
  paymentMethodId: string
): Promise<Stripe.PaymentIntent> {
  try {
    console.log(`🔐 Confirming payment intent ${paymentIntentId}...`);

    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });

    console.log(`✅ Payment confirmed: ${paymentIntent.status}`);

    return paymentIntent;
  } catch (error) {
    console.error('❌ Error confirming payment:', error);
    throw error;
  }
}

/**
 * Retrieve payment intent status
 */
export async function getPaymentIntentStatus(
  stripe: Stripe,
  paymentIntentId: string
): Promise<{
  status: string;
  amount: number;
  currency: string;
  paid: boolean;
}> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    console.log(`📊 Payment Intent Status:`);
    console.log(`  ID: ${paymentIntent.id}`);
    console.log(`  Status: ${paymentIntent.status}`);
    console.log(`  Amount: ${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()}`);

    return {
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      paid: paymentIntent.status === 'succeeded',
    };
  } catch (error) {
    console.error('❌ Error retrieving payment intent:', error);
    throw error;
  }
}

// ============================================================================
// PAYMENT METHODS
// ============================================================================

/**
 * Create a payment method from card details
 */
export async function createPaymentMethod(
  stripe: Stripe,
  cardDetails: {
    number: string;
    exp_month: number;
    exp_year: number;
    cvc: string;
  },
  billingDetails?: {
    name?: string;
    email?: string;
    address?: {
      line1?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  }
): Promise<Stripe.PaymentMethod> {
  try {
    console.log(`💳 Creating payment method...`);

    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: cardDetails,
      billing_details: billingDetails,
    });

    console.log(`✅ Payment method created: ${paymentMethod.id}`);

    return paymentMethod;
  } catch (error) {
    console.error('❌ Error creating payment method:', error);
    throw error;
  }
}

/**
 * Attach payment method to customer for future use
 */
export async function attachPaymentMethodToCustomer(
  stripe: Stripe,
  paymentMethodId: string,
  customerId: string
): Promise<Stripe.PaymentMethod> {
  try {
    console.log(`🔗 Attaching payment method to customer...`);

    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    console.log(`✅ Payment method attached to customer ${customerId}`);

    return paymentMethod;
  } catch (error) {
    console.error('❌ Error attaching payment method:', error);
    throw error;
  }
}

// ============================================================================
// CUSTOMER MANAGEMENT
// ============================================================================

/**
 * Create a customer
 */
export async function createCustomer(
  stripe: Stripe,
  email: string,
  name?: string,
  metadata?: Record<string, string>
): Promise<Stripe.Customer> {
  try {
    console.log(`👤 Creating customer: ${email}...`);

    const customer = await stripe.customers.create({
      email,
      name,
      metadata,
    });

    console.log(`✅ Customer created: ${customer.id}`);

    return customer;
  } catch (error) {
    console.error('❌ Error creating customer:', error);
    throw error;
  }
}

/**
 * Get customer's payment methods
 */
export async function getCustomerPaymentMethods(
  stripe: Stripe,
  customerId: string
): Promise<Stripe.PaymentMethod[]> {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    console.log(`💳 Found ${paymentMethods.data.length} payment methods`);

    return paymentMethods.data;
  } catch (error) {
    console.error('❌ Error fetching payment methods:', error);
    throw error;
  }
}

// ============================================================================
// CHARGES (OLDER API, BUT STILL USEFUL)
// ============================================================================

/**
 * Create a direct charge (simpler but less flexible than payment intents)
 */
export async function createCharge(
  stripe: Stripe,
  amount: number,
  currency: string,
  source: string,
  description?: string
): Promise<Stripe.Charge> {
  try {
    console.log(`💳 Creating charge for ${amount / 100} ${currency.toUpperCase()}...`);

    const charge = await stripe.charges.create({
      amount,
      currency,
      source,
      description,
    });

    console.log(`✅ Charge created: ${charge.id}`);
    console.log(`  Status: ${charge.status}`);

    return charge;
  } catch (error) {
    console.error('❌ Error creating charge:', error);
    throw error;
  }
}

// ============================================================================
// REFUNDS
// ============================================================================

/**
 * Process a refund
 */
export async function processRefund(
  stripe: Stripe,
  paymentIntentId: string,
  amount?: number,
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
): Promise<Stripe.Refund> {
  try {
    console.log(`💰 Processing refund for payment ${paymentIntentId}...`);

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount, // Optional: partial refund
      reason,
    });

    console.log(`✅ Refund processed: ${refund.id}`);
    console.log(`  Amount: ${refund.amount / 100}`);
    console.log(`  Status: ${refund.status}`);

    return refund;
  } catch (error) {
    console.error('❌ Error processing refund:', error);
    throw error;
  }
}

/**
 * Get refund status
 */
export async function getRefundStatus(
  stripe: Stripe,
  refundId: string
): Promise<Stripe.Refund> {
  try {
    const refund = await stripe.refunds.retrieve(refundId);

    console.log(`📊 Refund Status:`);
    console.log(`  ID: ${refund.id}`);
    console.log(`  Status: ${refund.status}`);
    console.log(`  Amount: ${refund.amount / 100}`);

    return refund;
  } catch (error) {
    console.error('❌ Error retrieving refund:', error);
    throw error;
  }
}

// ============================================================================
// SUBSCRIPTIONS
// ============================================================================

/**
 * Create a subscription
 */
export async function createSubscription(
  stripe: Stripe,
  customerId: string,
  priceId: string,
  trialDays?: number
): Promise<Stripe.Subscription> {
  try {
    console.log(`📅 Creating subscription for customer ${customerId}...`);

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      trial_period_days: trialDays,
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    console.log(`✅ Subscription created: ${subscription.id}`);
    console.log(`  Status: ${subscription.status}`);

    return subscription;
  } catch (error) {
    console.error('❌ Error creating subscription:', error);
    throw error;
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  stripe: Stripe,
  subscriptionId: string,
  immediately: boolean = false
): Promise<Stripe.Subscription> {
  try {
    console.log(`❌ Canceling subscription ${subscriptionId}...`);

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: !immediately,
    });

    if (immediately) {
      await stripe.subscriptions.cancel(subscriptionId);
      console.log(`✅ Subscription canceled immediately`);
    } else {
      console.log(`✅ Subscription will cancel at period end`);
    }

    return subscription;
  } catch (error) {
    console.error('❌ Error canceling subscription:', error);
    throw error;
  }
}

// ============================================================================
// WEBHOOK HANDLING
// ============================================================================

/**
 * Verify and parse Stripe webhook
 */
export function handleWebhook(
  rawBody: string | Buffer,
  signature: string,
  webhookSecret: string,
  stripe: Stripe
): Stripe.Event {
  try {
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    console.log(`📡 Webhook received: ${event.type}`);

    return event;
  } catch (error) {
    console.error('❌ Webhook verification failed:', error);
    throw error;
  }
}

/**
 * Process payment webhook events
 */
export async function processPaymentWebhook(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`✅ Payment succeeded: ${paymentIntent.id}`);
      // Update your database, send confirmation email, etc.
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      console.log(`❌ Payment failed: ${failedPayment.id}`);
      // Notify customer, retry logic, etc.
      break;

    case 'charge.refunded':
      const refund = event.data.object as Stripe.Charge;
      console.log(`💰 Charge refunded: ${refund.id}`);
      // Update order status, notify customer, etc.
      break;

    case 'customer.subscription.created':
      const subscription = event.data.object as Stripe.Subscription;
      console.log(`📅 Subscription created: ${subscription.id}`);
      // Grant access to service, etc.
      break;

    case 'customer.subscription.deleted':
      const canceledSub = event.data.object as Stripe.Subscription;
      console.log(`❌ Subscription canceled: ${canceledSub.id}`);
      // Revoke access to service, etc.
      break;

    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`📄 Invoice paid: ${invoice.id}`);
      // Send receipt, provision service, etc.
      break;

    default:
      console.log(`⚠️  Unhandled event type: ${event.type}`);
  }
}

// ============================================================================
// ACH / BANK TRANSFERS (US)
// ============================================================================

/**
 * Create a bank account payment method
 */
export async function createBankAccountPaymentMethod(
  stripe: Stripe,
  accountNumber: string,
  routingNumber: string,
  accountHolderName: string,
  accountHolderType: 'individual' | 'company'
): Promise<Stripe.PaymentMethod> {
  try {
    console.log(`🏦 Creating bank account payment method...`);

    const paymentMethod = await stripe.paymentMethods.create({
      type: 'us_bank_account',
      us_bank_account: {
        account_number: accountNumber,
        routing_number: routingNumber,
        account_holder_type: accountHolderType,
      },
      billing_details: {
        name: accountHolderName,
      },
    });

    console.log(`✅ Bank account payment method created: ${paymentMethod.id}`);

    return paymentMethod;
  } catch (error) {
    console.error('❌ Error creating bank account payment method:', error);
    throw error;
  }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example: Complete payment flow
 */
export async function examplePaymentFlow(stripeApiKey: string): Promise<void> {
  try {
    console.log('🚀 Starting payment flow...\n');

    const stripe = initializeStripe(stripeApiKey);

    // 1. Create a customer
    const customer = await createCustomer(
      stripe,
      'customer@example.com',
      'John Doe',
      { userId: '12345' }
    );

    // 2. Create payment method (in real app, this comes from Stripe.js on frontend)
    // Note: Don't handle raw card details on your server in production!

    // 3. Create payment intent
    const paymentIntent = await createPaymentIntent(
      stripe,
      5000, // $50.00
      'usd',
      {
        customerId: customer.id,
        orderId: 'order_123',
      }
    );

    // 4. In a real app, frontend would confirm with Stripe.js
    // For now, just check the status
    await getPaymentIntentStatus(stripe, paymentIntent.id);

    console.log('\n✅ Payment flow completed!');
  } catch (error) {
    console.error('❌ Payment flow failed:', error);
  }
}

/**
 * Example: Subscription flow
 */
export async function exampleSubscriptionFlow(stripeApiKey: string): Promise<void> {
  try {
    console.log('🚀 Starting subscription flow...\n');

    const stripe = initializeStripe(stripeApiKey);

    // 1. Create customer
    const customer = await createCustomer(stripe, 'subscriber@example.com');

    // 2. Create subscription (priceId would come from your Stripe dashboard)
    const subscription = await createSubscription(
      stripe,
      customer.id,
      'price_xxxxxxxxxxxxx', // Replace with actual price ID
      7 // 7-day trial
    );

    console.log(`📅 Subscription Status: ${subscription.status}`);

    console.log('\n✅ Subscription flow completed!');
  } catch (error) {
    console.error('❌ Subscription flow failed:', error);
  }
}

// ============================================================================
// PAYMENT VALIDATION
// ============================================================================

/**
 * Validate payment amount
 */
export function validatePaymentAmount(
  amount: number,
  currency: string = 'usd'
): { valid: boolean; error?: string } {
  // Minimum amounts vary by currency
  const minimums: Record<string, number> = {
    usd: 50, // $0.50
    eur: 50,
    gbp: 30,
  };

  const minimum = minimums[currency.toLowerCase()] || 50;

  if (amount < minimum) {
    return {
      valid: false,
      error: `Amount must be at least ${minimum / 100} ${currency.toUpperCase()}`,
    };
  }

  if (amount > 99999999) {
    return {
      valid: false,
      error: 'Amount exceeds maximum allowed',
    };
  }

  return { valid: true };
}

/**
 * Calculate processing fees
 */
export function calculateProcessingFees(
  amount: number,
  feePercentage: number = 2.9,
  fixedFee: number = 30
): {
  amount: number;
  fee: number;
  net: number;
} {
  const fee = Math.round((amount * feePercentage) / 100 + fixedFee);
  const net = amount - fee;

  return { amount, fee, net };
}
