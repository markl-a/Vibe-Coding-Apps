/**
 * Payment Gateway Examples
 */

import { PaymentGateway, MockPaymentProvider } from './index.js';

async function main() {
  console.log('='.repeat(60));
  console.log('Payment Gateway Examples');
  console.log('='.repeat(60));

  // Create gateway
  const gateway = new PaymentGateway({
    provider: new MockPaymentProvider(),
    testMode: true,
    defaultCurrency: 'USD',
  });

  // Example 1: Create customer
  console.log('\n👤 Example 1: Create Customer');
  console.log('-'.repeat(40));

  const customer = await gateway.createCustomer({
    email: 'john@example.com',
    name: 'John Doe',
    phone: '+1234567890',
    address: {
      line1: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'US',
    },
  });

  console.log(`Customer created: ${customer.id}`);
  console.log(`Email: ${customer.email}`);

  // Example 2: Add payment method
  console.log('\n💳 Example 2: Add Payment Method');
  console.log('-'.repeat(40));

  const card = await gateway.addPaymentMethod(customer.id, {
    number: '4242424242424242',
    expMonth: 12,
    expYear: 2025,
    cvc: '123',
    holderName: 'John Doe',
  });

  console.log(`Card added: ${card?.id}`);
  console.log(`Brand: ${card?.brand}, Last 4: ${card?.last4}`);

  // Example 3: Create payment intent
  console.log('\n📝 Example 3: Create Payment Intent');
  console.log('-'.repeat(40));

  const intent = await gateway.createPaymentIntent(2500, 'USD', {
    customerId: customer.id,
    description: 'Order #12345',
  });

  console.log(`Payment intent: ${intent.id}`);
  console.log(`Amount: ${gateway.formatMoney(intent.amount)}`);
  console.log(`Status: ${intent.status}`);

  // Example 4: Charge payment
  console.log('\n💰 Example 4: Charge Payment');
  console.log('-'.repeat(40));

  const chargeResult = await gateway.charge({
    amount: { amount: 4999, currency: 'USD' },
    paymentMethodId: card!.id,
    customerId: customer.id,
    description: 'Premium subscription',
    capture: true,
  });

  if (chargeResult.success) {
    console.log(`✓ Payment successful!`);
    console.log(`Transaction ID: ${chargeResult.transactionId}`);
    console.log(`Status: ${chargeResult.paymentIntent?.status}`);
  } else {
    console.log(`✗ Payment failed: ${chargeResult.error?.message}`);
  }

  // Example 5: Authorize and capture separately
  console.log('\n🔐 Example 5: Authorize and Capture');
  console.log('-'.repeat(40));

  const authResult = await gateway.charge({
    amount: { amount: 10000, currency: 'USD' },
    paymentMethodId: card!.id,
    description: 'Pre-authorization',
    capture: false, // Don't capture immediately
  });

  if (authResult.success) {
    console.log(`✓ Authorization successful`);
    console.log(`Intent: ${authResult.paymentIntent?.id}`);
    console.log(`Status: ${authResult.paymentIntent?.status}`);

    // Capture later (e.g., when order ships)
    const captureResult = await gateway.capturePayment(
      authResult.paymentIntent!.id,
      8000, // Partial capture
      'USD'
    );

    if (captureResult.success) {
      console.log(`✓ Captured ${gateway.formatMoney({ amount: 8000, currency: 'USD' })}`);
      console.log(`Status: ${captureResult.paymentIntent?.status}`);
    }
  }

  // Example 6: Quick charge with new card
  console.log('\n⚡ Example 6: Quick Charge');
  console.log('-'.repeat(40));

  const quickCharge = await gateway.chargeWithCard(
    1999, // $19.99
    'USD',
    {
      number: '5555555555554444', // Mastercard
      expMonth: 6,
      expYear: 2026,
      cvc: '321',
      holderName: 'Jane Smith',
    },
    { description: 'One-time purchase' }
  );

  console.log(`Quick charge: ${quickCharge.success ? 'Success' : 'Failed'}`);
  if (quickCharge.success) {
    console.log(`Transaction: ${quickCharge.transactionId}`);
  }

  // Example 7: Refund
  console.log('\n↩️ Example 7: Refund');
  console.log('-'.repeat(40));

  if (chargeResult.success && chargeResult.paymentIntent) {
    // Wait for completion
    await new Promise((r) => setTimeout(r, 200));

    // Partial refund
    const refund = await gateway.refund(
      chargeResult.paymentIntent.id,
      1000, // $10.00
      'USD',
      'Customer request'
    );

    console.log(`Refund created: ${refund.id}`);
    console.log(`Amount: ${gateway.formatMoney(refund.amount)}`);
    console.log(`Status: ${refund.status}`);
  }

  // Example 8: Cancel payment
  console.log('\n❌ Example 8: Cancel Payment');
  console.log('-'.repeat(40));

  const cancelIntent = await gateway.createPaymentIntent(500, 'USD');
  console.log(`Created intent: ${cancelIntent.id}`);

  const cancelled = await gateway.cancelPayment(cancelIntent.id);
  console.log(`Cancelled: ${cancelled}`);

  // Example 9: Webhook handling
  console.log('\n🔔 Example 9: Webhook Handler');
  console.log('-'.repeat(40));

  gateway.onWebhook('payment.completed', (event) => {
    console.log(`Webhook received: ${event.type}`);
    console.log(`Data:`, event.data);
  });

  gateway.onWebhook('*', (event) => {
    console.log(`[All events] ${event.type}`);
  });

  // Simulate webhook
  const webhookPayload = JSON.stringify({
    id: 'evt_123',
    type: 'payment.completed',
    data: { paymentIntentId: 'pi_123', amount: 2500 },
    timestamp: new Date().toISOString(),
  });

  await gateway.processWebhook(webhookPayload, 'mock_signature');

  // Example 10: Currency utilities
  console.log('\n💱 Example 10: Currency Utilities');
  console.log('-'.repeat(40));

  const amounts = [
    { amount: 9999, currency: 'USD' as const },
    { amount: 8599, currency: 'EUR' as const },
    { amount: 1000, currency: 'JPY' as const }, // Zero decimal
  ];

  console.log('Formatting money:');
  amounts.forEach((money) => {
    console.log(`  ${money.amount} (${money.currency}) → ${gateway.formatMoney(money)}`);
  });

  console.log('\nConversions:');
  console.log(`  $99.99 → ${gateway.toSmallestUnit(99.99, 'USD')} cents`);
  console.log(`  9999 cents → $${gateway.fromSmallestUnit(9999, 'USD')}`);

  // Example 11: Card validation
  console.log('\n✅ Example 11: Card Validation');
  console.log('-'.repeat(40));

  const testCards = [
    '4242424242424242', // Valid Visa
    '5555555555554444', // Valid Mastercard
    '1234567890123456', // Invalid
  ];

  testCards.forEach((num) => {
    const valid = gateway.isValidCardNumber(num);
    console.log(`  ${num}: ${valid ? '✓ Valid' : '✗ Invalid'}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('Examples complete!');
}

main().catch(console.error);
