# Payment Gateway

A payment processing gateway with multi-provider support, refunds, and webhook handling.

## Features

- **Multiple Payment Methods**: Cards, bank transfers, wallets
- **Payment Intents**: Authorize and capture separately
- **Customer Management**: Store customer profiles and payment methods
- **Refunds**: Full and partial refunds
- **Webhooks**: Event-driven architecture
- **Currency Support**: Multi-currency with proper formatting

## Quick Start

```bash
pnpm install
pnpm example
```

## Usage

### Initialize Gateway

```typescript
import { PaymentGateway, MockPaymentProvider } from '@vibe/payment-gateway';

const gateway = new PaymentGateway({
  provider: new MockPaymentProvider(),
  testMode: true,
  defaultCurrency: 'USD',
});
```

### Create Customer

```typescript
const customer = await gateway.createCustomer({
  email: 'john@example.com',
  name: 'John Doe',
  address: {
    line1: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94102',
    country: 'US',
  },
});
```

### Add Payment Method

```typescript
const card = await gateway.addPaymentMethod(customer.id, {
  number: '4242424242424242',
  expMonth: 12,
  expYear: 2025,
  cvc: '123',
  holderName: 'John Doe',
});
```

### Charge Payment

```typescript
const result = await gateway.charge({
  amount: { amount: 2500, currency: 'USD' }, // $25.00
  paymentMethodId: card.id,
  customerId: customer.id,
  description: 'Order #12345',
  capture: true,
});

if (result.success) {
  console.log('Payment successful:', result.transactionId);
} else {
  console.log('Payment failed:', result.error?.message);
}
```

### Quick Charge with New Card

```typescript
const result = await gateway.chargeWithCard(
  1999, // $19.99
  'USD',
  {
    number: '5555555555554444',
    expMonth: 6,
    expYear: 2026,
    cvc: '321',
  },
  { description: 'One-time purchase' }
);
```

### Authorize and Capture

```typescript
// Authorize (hold funds)
const auth = await gateway.charge({
  amount: { amount: 10000, currency: 'USD' },
  paymentMethodId: card.id,
  capture: false,
});

// Capture later (when order ships)
const capture = await gateway.capturePayment(
  auth.paymentIntent.id,
  8000, // Partial capture
  'USD'
);
```

### Refund

```typescript
// Full refund
const refund = await gateway.refund(paymentIntentId);

// Partial refund
const partialRefund = await gateway.refund(
  paymentIntentId,
  1000, // $10.00
  'USD',
  'Customer request'
);
```

### Cancel Payment

```typescript
await gateway.cancelPayment(paymentIntentId);
```

## Webhook Handling

```typescript
// Register handlers
gateway.onWebhook('payment.completed', (event) => {
  console.log('Payment completed:', event.data);
});

gateway.onWebhook('payment.failed', (event) => {
  console.log('Payment failed:', event.data);
});

// Catch all events
gateway.onWebhook('*', (event) => {
  analytics.track(event.type, event.data);
});

// Process incoming webhook
app.post('/webhook', (req, res) => {
  const event = await gateway.processWebhook(
    req.body,
    req.headers['x-signature']
  );
  res.json({ received: true });
});
```

## Currency Utilities

```typescript
// Format for display
gateway.formatMoney({ amount: 2500, currency: 'USD' }); // "$25.00"
gateway.formatMoney({ amount: 1000, currency: 'JPY' }); // "¥1,000"

// Convert amounts
gateway.toSmallestUnit(99.99, 'USD');   // 9999 (cents)
gateway.fromSmallestUnit(9999, 'USD');  // 99.99 (dollars)

// Validate card number
gateway.isValidCardNumber('4242424242424242'); // true
```

## Transaction Status Flow

```
pending → processing → authorized → captured → completed
                          ↓            ↓
                       cancelled    refunded / partially_refunded
                          ↓
                        failed
```

## Supported Card Brands

| Brand | Prefix | Example |
|-------|--------|---------|
| Visa | 4 | 4242424242424242 |
| Mastercard | 51-55 | 5555555555554444 |
| Amex | 34, 37 | 378282246310005 |
| Discover | 6011, 65 | 6011111111111117 |
| JCB | 35 | 3530111333300000 |
| UnionPay | 62 | 6200000000000005 |

## Payment Intent Structure

```typescript
interface PaymentIntent {
  id: string;
  amount: Money;
  customerId?: string;
  paymentMethodId?: string;
  description?: string;
  status: TransactionStatus;
  clientSecret?: string;      // For client-side confirmation
  capturedAmount?: Money;
  refundedAmount?: Money;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
```

## Error Handling

```typescript
const result = await gateway.charge({ ... });

if (!result.success) {
  switch (result.error?.code) {
    case 'card_declined':
      console.log('Card was declined:', result.error.declineCode);
      break;
    case 'card_expired':
      console.log('Card has expired');
      break;
    case 'insufficient_funds':
      console.log('Insufficient funds');
      break;
    default:
      console.log('Payment error:', result.error?.message);
  }
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PaymentGateway                            │
│                                                              │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐     │
│  │   Customer   │  │   Payment     │  │   Webhook    │     │
│  │   Manager    │  │   Methods     │  │   Handler    │     │
│  └──────────────┘  └───────────────┘  └──────────────┘     │
│         │                 │                   │             │
│         ▼                 ▼                   ▼             │
│  ┌──────────────────────────────────────────────────┐      │
│  │               Payment Flow                        │      │
│  │  1. Create PaymentIntent                         │      │
│  │  2. Confirm with PaymentMethod                   │      │
│  │  3. Authorize funds                              │      │
│  │  4. Capture (full or partial)                    │      │
│  │  5. Refund if needed                             │      │
│  └──────────────────────────────────────────────────┘      │
│                           │                                  │
│                           ▼                                  │
│         ┌───────────────────────────────────┐               │
│         │        Payment Provider            │               │
│         │    (Stripe, PayPal, Square)        │               │
│         └───────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

## Security Notes

- Never log full card numbers
- Use tokenization for card storage
- Verify webhook signatures
- Use HTTPS for all API calls
- Implement rate limiting
- PCI DSS compliance required for production

## License

MIT
