# Simple Payment System

A lightweight payment processing framework with gateway abstraction, fraud detection, and webhook support.

## Features

- **Gateway Abstraction**: Easy to swap payment providers
- **Fraud Detection**: Rule-based fraud checking
- **Idempotency**: Prevent duplicate charges
- **Webhook Events**: Real-time payment notifications
- **TypeScript**: Full type safety with Zod validation

## Quick Start

```bash
pnpm install
pnpm example
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Payment Processor                        │
│                                                             │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐    │
│  │   Validate   │──▶│ Fraud Check  │──▶│   Gateway    │    │
│  └──────────────┘  └───────────────┘  └──────────────┘    │
│         │                 │                   │            │
│         ▼                 ▼                   ▼            │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐    │
│  │    Zod       │  │  Risk Score   │  │  Mock/Stripe │    │
│  │  Validation  │  │  Velocity     │  │  PayPal etc  │    │
│  └──────────────┘  └───────────────┘  └──────────────┘    │
│                                                             │
│                    ┌───────────────┐                       │
│                    │   Webhooks    │                       │
│                    └───────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

## Usage

### Basic Payment

```typescript
import { PaymentProcessor, MockGateway } from '@vibe/simple-payments';

const processor = new PaymentProcessor(new MockGateway());

// Create payment
const transaction = await processor.createPayment(
  {
    amount: 99.99,
    currency: 'USD',
    customerId: 'cust_123',
    description: 'Order #1001',
  },
  {
    type: 'card',
    number: '4242424242424242',
    expMonth: 12,
    expYear: 2025,
    cvv: '123',
    holderName: 'John Doe',
  }
);

// Process payment
const result = await processor.processPayment(transaction.id, cardDetails);
console.log(result.status); // 'succeeded'
```

### Webhook Events

```typescript
processor.onWebhook((event) => {
  switch (event.type) {
    case 'payment.succeeded':
      // Fulfill order
      break;
    case 'payment.failed':
      // Notify customer
      break;
    case 'refund.succeeded':
      // Update inventory
      break;
  }
});
```

### Idempotency

```typescript
// Use idempotency key to prevent duplicate charges
const payment = await processor.createPayment(
  {
    amount: 50.00,
    currency: 'USD',
    idempotencyKey: 'order_12345_payment',
  },
  cardDetails
);

// Second call with same key returns same transaction
const duplicate = await processor.createPayment(
  {
    amount: 50.00,
    currency: 'USD',
    idempotencyKey: 'order_12345_payment',
  },
  cardDetails
);

console.log(payment.id === duplicate.id); // true
```

### Refunds

```typescript
const refund = await processor.refundPayment(transactionId);
// Partial refund
const partial = await processor.refundPayment(transactionId, 25.00);
```

## Test Cards

| Card Number | Scenario |
|-------------|----------|
| 4242424242424242 | Success |
| 4000000000000002 | Declined |
| 4000000000000069 | Expired card |
| 4000000000000127 | Incorrect CVC |
| 4000000000009995 | Insufficient funds |

## Fraud Detection

Built-in rule-based fraud detection:

- **Velocity checks**: Transaction frequency limits
- **Amount thresholds**: Per-transaction and daily limits
- **Block lists**: Block specific cards or customers
- **Risk scoring**: 0-100 risk score with low/medium/high levels

```typescript
const fraudDetector = processor.getFraudDetector();

// Block a customer
fraudDetector.blockCustomer('cust_suspicious');

// Block a card (last 4 digits)
fraudDetector.blockCard('1234');
```

## Payment Methods

### Cards

```typescript
{
  type: 'card',
  number: '4242424242424242',
  expMonth: 12,
  expYear: 2025,
  cvv: '123',
  holderName: 'John Doe',
}
```

### Bank Transfer

```typescript
{
  type: 'bank_transfer',
  bankCode: '123456',
  accountNumber: '9876543210',
  accountName: 'John Doe',
}
```

### Digital Wallets

```typescript
{
  type: 'wallet',
  walletId: 'wallet_123',
  provider: 'paypal', // or 'apple_pay', 'google_pay'
}
```

## Transaction States

```
pending → processing → succeeded
                    ↘ failed

succeeded → refunded
```

## Resources

- [Stripe API Reference](https://stripe.com/docs/api)
- [PCI DSS Compliance](https://www.pcisecuritystandards.org/)
- [Payment Card Industry](https://en.wikipedia.org/wiki/Payment_Card_Industry_Data_Security_Standard)

## License

MIT
