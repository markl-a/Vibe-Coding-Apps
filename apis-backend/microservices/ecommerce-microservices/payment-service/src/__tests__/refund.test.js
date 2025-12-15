const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../index');

// Mock the payment processor
jest.mock('opossum');
const CircuitBreaker = require('opossum');

describe('Refund API', () => {
  let mockPaymentProcessor;

  beforeAll(async () => {
    const MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/ecommerce_payments_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_TEST_URI);
    }
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }

    mockPaymentProcessor = {
      fire: jest.fn(),
      stats: {
        successes: 0,
        failures: 0,
        fallbacks: 0
      }
    };

    CircuitBreaker.mockImplementation(() => mockPaymentProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to create a completed payment
  async function createCompletedPayment(amount = 100) {
    mockPaymentProcessor.fire.mockResolvedValue({
      success: true,
      providerId: 'PROV-ABC123',
      providerStatus: 'approved',
      providerMessage: 'Payment processed successfully'
    });

    const response = await request(app)
      .post('/api/payments')
      .send({
        orderId: `ORD-${Date.now()}`,
        userId: 'USER-67890',
        amount,
        method: 'credit_card'
      });

    return response.body.payment.transactionId;
  }

  describe('POST /api/payments/:transactionId/refund', () => {
    test('should successfully refund a completed payment', async () => {
      const transactionId = await createCompletedPayment(100);

      const response = await request(app)
        .post(`/api/payments/${transactionId}/refund`)
        .send({
          reason: 'Customer requested refund'
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Payment refunded successfully');
      expect(response.body).toHaveProperty('refund');
      expect(response.body.refund.transactionId).toBe(transactionId);
      expect(response.body.refund.refundAmount).toBe(100);
      expect(response.body.refund.originalAmount).toBe(100);
      expect(response.body.refund).toHaveProperty('refundedAt');
    });

    test('should successfully process partial refund', async () => {
      const transactionId = await createCompletedPayment(200);

      const response = await request(app)
        .post(`/api/payments/${transactionId}/refund`)
        .send({
          amount: 75,
          reason: 'Partial refund for returned items'
        })
        .expect(200);

      expect(response.body.refund.originalAmount).toBe(200);
      expect(response.body.refund.refundAmount).toBe(75);
    });

    test('should reject refund for non-existent transaction', async () => {
      const response = await request(app)
        .post('/api/payments/PAY-NONEXISTENT/refund')
        .send({
          reason: 'Test refund'
        })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Payment not found');
    });

    test('should reject refund for non-completed payment', async () => {
      // Create a failed payment
      mockPaymentProcessor.fire.mockRejectedValue({
        success: false,
        providerStatus: 'declined',
        providerMessage: 'Insufficient funds'
      });

      const createResponse = await request(app)
        .post('/api/payments')
        .send({
          orderId: 'ORD-FAILED-123',
          userId: 'USER-67890',
          amount: 100,
          method: 'credit_card'
        });

      const transactionId = createResponse.body.transactionId;

      const response = await request(app)
        .post(`/api/payments/${transactionId}/refund`)
        .send({
          reason: 'Test refund'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Can only refund completed payments');
    });

    test('should reject refund amount exceeding original payment', async () => {
      const transactionId = await createCompletedPayment(100);

      const response = await request(app)
        .post(`/api/payments/${transactionId}/refund`)
        .send({
          amount: 150,
          reason: 'Excessive refund'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Refund amount cannot exceed payment amount');
    });

    test('should reject refund with negative amount', async () => {
      const transactionId = await createCompletedPayment(100);

      const response = await request(app)
        .post(`/api/payments/${transactionId}/refund`)
        .send({
          amount: -50,
          reason: 'Negative refund'
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    test('should update payment status to refunded', async () => {
      const transactionId = await createCompletedPayment(100);

      await request(app)
        .post(`/api/payments/${transactionId}/refund`)
        .send({
          reason: 'Full refund'
        })
        .expect(200);

      // Verify payment status is updated
      const Payment = mongoose.model('Payment');
      const payment = await Payment.findOne({ transactionId });

      expect(payment.status).toBe('refunded');
      expect(payment.refundAmount).toBe(100);
      expect(payment.refundedAt).toBeDefined();
    });

    test('should store refund reason', async () => {
      const transactionId = await createCompletedPayment(100);
      const refundReason = 'Defective product returned';

      await request(app)
        .post(`/api/payments/${transactionId}/refund`)
        .send({
          reason: refundReason
        })
        .expect(200);

      const Payment = mongoose.model('Payment');
      const payment = await Payment.findOne({ transactionId });

      expect(payment.failureReason).toBe(refundReason);
    });

    test('should handle refund without reason (optional field)', async () => {
      const transactionId = await createCompletedPayment(100);

      const response = await request(app)
        .post(`/api/payments/${transactionId}/refund`)
        .send({})
        .expect(200);

      expect(response.body.message).toBe('Payment refunded successfully');
    });

    test('should refund payment with different currencies', async () => {
      mockPaymentProcessor.fire.mockResolvedValue({
        success: true,
        providerId: 'PROV-ABC123',
        providerStatus: 'approved',
        providerMessage: 'Payment processed successfully'
      });

      // Create payment with EUR currency
      const createResponse = await request(app)
        .post('/api/payments')
        .send({
          orderId: 'ORD-EUR-123',
          userId: 'USER-67890',
          amount: 85.50,
          currency: 'EUR',
          method: 'credit_card'
        });

      const transactionId = createResponse.body.payment.transactionId;

      const response = await request(app)
        .post(`/api/payments/${transactionId}/refund`)
        .send({
          amount: 85.50,
          reason: 'EUR refund test'
        })
        .expect(200);

      expect(response.body.refund.refundAmount).toBe(85.50);
    });

    test('should properly handle decimal amounts in refunds', async () => {
      const transactionId = await createCompletedPayment(99.99);

      const response = await request(app)
        .post(`/api/payments/${transactionId}/refund`)
        .send({
          amount: 49.99,
          reason: 'Partial refund with decimals'
        })
        .expect(200);

      expect(response.body.refund.refundAmount).toBe(49.99);
      expect(response.body.refund.originalAmount).toBe(99.99);
    });

    test('should set refundedAt timestamp', async () => {
      const beforeRefund = new Date();
      const transactionId = await createCompletedPayment(100);

      const response = await request(app)
        .post(`/api/payments/${transactionId}/refund`)
        .send({
          reason: 'Timestamp test'
        })
        .expect(200);

      const afterRefund = new Date();
      const refundedAt = new Date(response.body.refund.refundedAt);

      expect(refundedAt.getTime()).toBeGreaterThanOrEqual(beforeRefund.getTime());
      expect(refundedAt.getTime()).toBeLessThanOrEqual(afterRefund.getTime());
    });

    test('should allow multiple partial refunds up to total amount', async () => {
      // Note: Current implementation only allows single refund
      // This test documents expected behavior for future enhancement
      const transactionId = await createCompletedPayment(100);

      // First partial refund
      await request(app)
        .post(`/api/payments/${transactionId}/refund`)
        .send({
          amount: 60,
          reason: 'First partial refund'
        })
        .expect(200);

      // Attempting second refund should fail (current implementation)
      const response = await request(app)
        .post(`/api/payments/${transactionId}/refund`)
        .send({
          amount: 40,
          reason: 'Second partial refund'
        })
        .expect(400);

      expect(response.body.error).toBe('Can only refund completed payments');
    });
  });
});
