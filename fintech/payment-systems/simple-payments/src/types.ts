import { z } from 'zod';

/**
 * Payment System Types
 *
 * Core types for payment processing:
 * - Payment methods
 * - Transactions
 * - Gateways
 * - Events
 */

// Payment method schemas
export const CardSchema = z.object({
  type: z.literal('card'),
  number: z.string().regex(/^\d{16}$/),
  expMonth: z.number().min(1).max(12),
  expYear: z.number().min(2024),
  cvv: z.string().regex(/^\d{3,4}$/),
  holderName: z.string().min(1),
});

export const BankTransferSchema = z.object({
  type: z.literal('bank_transfer'),
  bankCode: z.string(),
  accountNumber: z.string(),
  accountName: z.string(),
});

export const WalletSchema = z.object({
  type: z.literal('wallet'),
  walletId: z.string(),
  provider: z.enum(['paypal', 'apple_pay', 'google_pay']),
});

export const PaymentMethodSchema = z.discriminatedUnion('type', [
  CardSchema,
  BankTransferSchema,
  WalletSchema,
]);

// Customer schema
export const CustomerSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

// Payment intent schema
export const PaymentIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'JPY', 'TWD']),
  description: z.string().optional(),
  customerId: z.string().optional(),
  metadata: z.record(z.string()).optional(),
  idempotencyKey: z.string().optional(),
});

// Transaction statuses
export type TransactionStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'refunded';

// Transaction schema
export const TransactionSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(['pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded']),
  paymentMethod: z.string(),
  customerId: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.string()).optional(),
  gatewayId: z.string().optional(),
  gatewayResponse: z.any().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
});

// Webhook event schema
export const WebhookEventSchema = z.object({
  id: z.string(),
  type: z.enum([
    'payment.created',
    'payment.succeeded',
    'payment.failed',
    'refund.created',
    'refund.succeeded',
  ]),
  data: z.any(),
  createdAt: z.date(),
});

// Infer types from schemas
export type Card = z.infer<typeof CardSchema>;
export type BankTransfer = z.infer<typeof BankTransferSchema>;
export type Wallet = z.infer<typeof WalletSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type Customer = z.infer<typeof CustomerSchema>;
export type PaymentIntent = z.infer<typeof PaymentIntentSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type WebhookEvent = z.infer<typeof WebhookEventSchema>;

// Gateway interface
export interface PaymentGateway {
  name: string;
  charge(amount: number, currency: string, paymentMethod: PaymentMethod): Promise<GatewayResponse>;
  refund(transactionId: string, amount?: number): Promise<GatewayResponse>;
  getTransaction(transactionId: string): Promise<GatewayResponse>;
}

export interface GatewayResponse {
  success: boolean;
  transactionId?: string;
  status: TransactionStatus;
  errorCode?: string;
  errorMessage?: string;
  rawResponse?: unknown;
}

// Fraud check result
export interface FraudCheckResult {
  approved: boolean;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  reasons: string[];
}
