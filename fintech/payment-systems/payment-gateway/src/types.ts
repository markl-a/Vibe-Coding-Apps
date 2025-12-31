/**
 * Payment Gateway Types
 */

// Supported currencies (ISO 4217)
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'TWD' | 'KRW';

// Payment methods
export type PaymentMethod =
  | 'card'
  | 'bank_transfer'
  | 'wallet'
  | 'crypto'
  | 'bnpl'; // Buy Now Pay Later

// Card brands
export type CardBrand =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'discover'
  | 'jcb'
  | 'unionpay';

// Transaction status
export type TransactionStatus =
  | 'pending'
  | 'processing'
  | 'authorized'
  | 'captured'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded'
  | 'disputed';

// Money amount
export interface Money {
  amount: number;     // In smallest currency unit (cents)
  currency: Currency;
}

// Card details (for tokenization)
export interface CardDetails {
  number: string;
  expMonth: number;
  expYear: number;
  cvc: string;
  holderName?: string;
}

// Tokenized card
export interface PaymentCard {
  id: string;
  brand: CardBrand;
  last4: string;
  expMonth: number;
  expYear: number;
  holderName?: string;
  fingerprint: string;
}

// Customer
export interface Customer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  address?: Address;
  paymentMethods?: PaymentCard[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// Address
export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

// Payment intent
export interface PaymentIntent {
  id: string;
  amount: Money;
  customerId?: string;
  paymentMethodId?: string;
  description?: string;
  status: TransactionStatus;
  clientSecret?: string;
  capturedAmount?: Money;
  refundedAmount?: Money;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Charge request
export interface ChargeRequest {
  amount: Money;
  paymentMethodId: string;
  customerId?: string;
  description?: string;
  capture?: boolean;    // Auto-capture or authorize only
  metadata?: Record<string, unknown>;
}

// Charge result
export interface ChargeResult {
  success: boolean;
  transactionId?: string;
  paymentIntent?: PaymentIntent;
  error?: PaymentError;
}

// Refund request
export interface RefundRequest {
  paymentIntentId: string;
  amount?: Money;       // Partial refund, or full if not specified
  reason?: string;
}

// Refund
export interface Refund {
  id: string;
  paymentIntentId: string;
  amount: Money;
  status: 'pending' | 'completed' | 'failed';
  reason?: string;
  createdAt: Date;
}

// Payment error
export interface PaymentError {
  code: string;
  message: string;
  declineCode?: string;
  param?: string;
}

// Webhook event
export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

// Provider interface
export interface PaymentProvider {
  name: string;
  createPaymentIntent(amount: Money, options?: Record<string, unknown>): Promise<PaymentIntent>;
  confirmPayment(paymentIntentId: string, paymentMethodId: string): Promise<ChargeResult>;
  capturePayment(paymentIntentId: string, amount?: Money): Promise<ChargeResult>;
  cancelPayment(paymentIntentId: string): Promise<boolean>;
  refund(request: RefundRequest): Promise<Refund>;
  tokenizeCard(card: CardDetails): Promise<PaymentCard>;
}

// Gateway configuration
export interface GatewayConfig {
  provider: PaymentProvider;
  webhookSecret?: string;
  testMode?: boolean;
  defaultCurrency?: Currency;
}
