/**
 * Payment System Example
 *
 * Demonstrates:
 * 1. Processing a successful payment
 * 2. Handling declined card
 * 3. Fraud detection in action
 * 4. Refund processing
 * 5. Idempotency handling
 */

import { PaymentProcessor, MockGateway, type Card } from './index.js';

async function main() {
  console.log('='.repeat(60));
  console.log('Payment System Example');
  console.log('='.repeat(60));

  // Initialize payment processor with mock gateway
  const gateway = new MockGateway();
  const processor = new PaymentProcessor(gateway);

  // Register webhook handler
  processor.onWebhook((event) => {
    console.log(`\n📣 Webhook: ${event.type}`);
  });

  // Test card - success
  const successCard: Card = {
    type: 'card',
    number: '4242424242424242',
    expMonth: 12,
    expYear: 2025,
    cvv: '123',
    holderName: 'John Doe',
  };

  // Test card - declined
  const declinedCard: Card = {
    type: 'card',
    number: '4000000000000002',
    expMonth: 12,
    expYear: 2025,
    cvv: '123',
    holderName: 'Jane Doe',
  };

  // 1. Successful payment
  console.log('\n📦 Test 1: Successful Payment');
  console.log('-'.repeat(40));

  const payment1 = await processor.createPayment(
    {
      amount: 99.99,
      currency: 'USD',
      description: 'Order #1001',
      customerId: 'cust_123',
      metadata: { orderId: '1001' },
    },
    successCard
  );

  const result1 = await processor.processPayment(payment1.id, successCard);
  console.log(`Result: ${result1.status}`);
  console.log(`Transaction ID: ${result1.id}`);

  // 2. Declined card
  console.log('\n📦 Test 2: Declined Card');
  console.log('-'.repeat(40));

  const payment2 = await processor.createPayment(
    {
      amount: 50.00,
      currency: 'USD',
      description: 'Order #1002',
      customerId: 'cust_456',
    },
    declinedCard
  );

  const result2 = await processor.processPayment(payment2.id, declinedCard);
  console.log(`Result: ${result2.status}`);
  console.log(`Error: ${result2.errorMessage}`);

  // 3. Fraud detection - high amount
  console.log('\n📦 Test 3: Fraud Detection (High Amount)');
  console.log('-'.repeat(40));

  const payment3 = await processor.createPayment(
    {
      amount: 15000,
      currency: 'USD',
      description: 'Large purchase',
      customerId: 'cust_789',
    },
    successCard
  );

  const result3 = await processor.processPayment(payment3.id, successCard);
  console.log(`Result: ${result3.status}`);
  if (result3.errorMessage) {
    console.log(`Reason: ${result3.errorMessage}`);
  }

  // 4. Refund
  console.log('\n📦 Test 4: Refund Processing');
  console.log('-'.repeat(40));

  try {
    const refundResult = await processor.refundPayment(result1.id);
    console.log(`Refund status: ${refundResult.status}`);
  } catch (error) {
    console.log(`Refund error: ${error}`);
  }

  // 5. Idempotency
  console.log('\n📦 Test 5: Idempotency');
  console.log('-'.repeat(40));

  const idempotencyKey = 'order_1003_payment';

  const payment4a = await processor.createPayment(
    {
      amount: 75.00,
      currency: 'USD',
      description: 'Order #1003',
      idempotencyKey,
    },
    successCard
  );

  const payment4b = await processor.createPayment(
    {
      amount: 75.00,
      currency: 'USD',
      description: 'Order #1003',
      idempotencyKey,
    },
    successCard
  );

  console.log(`First payment ID:  ${payment4a.id}`);
  console.log(`Second payment ID: ${payment4b.id}`);
  console.log(`Same transaction:  ${payment4a.id === payment4b.id}`);

  // 6. List transactions
  console.log('\n📦 Test 6: List Transactions');
  console.log('-'.repeat(40));

  const allTransactions = await processor.listTransactions({ limit: 5 });
  console.log(`Total transactions: ${allTransactions.length}`);

  for (const tx of allTransactions) {
    console.log(`  - ${tx.id.slice(0, 8)}... | ${tx.status.padEnd(10)} | $${tx.amount}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Example completed!');
}

main().catch(console.error);
