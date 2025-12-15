const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../index');

// Mock the payment processor
jest.mock('opossum');
const CircuitBreaker = require('opossum');

describe('Payment Service Integration Tests', () => {
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

  describe('Complete Payment Flow', () => {
    test('should handle complete payment lifecycle: create -> retrieve -> refund', async () => {
      mockPaymentProcessor.fire.mockResolvedValue({
        success: true,
        providerId: 'PROV-ABC123',
        providerStatus: 'approved',
        providerMessage: 'Payment processed successfully'
      });

      // 1. Create payment
      const createResponse = await request(app)
        .post('/api/payments')
        .send({
          orderId: 'ORD-INTEGRATION-001',
          userId: 'USER-INTEGRATION-001',
          amount: 250.00,
          currency: 'USD',
          method: 'credit_card',
          paymentDetails: {
            cardLast4: '4242',
            cardBrand: 'Visa',
            cardExpiry: '12/25'
          }
        })
        .expect(201);

      expect(createResponse.body.payment).toHaveProperty('transactionId');
      const transactionId = createResponse.body.payment.transactionId;

      // 2. Retrieve payment
      const getResponse = await request(app)
        .get(`/api/payments/${transactionId}`)
        .expect(200);

      expect(getResponse.body.payment.transactionId).toBe(transactionId);
      expect(getResponse.body.payment.status).toBe('completed');
      expect(getResponse.body.payment.amount).toBe(250);

      // 3. Refund payment
      const refundResponse = await request(app)
        .post(`/api/payments/${transactionId}/refund`)
        .send({
          amount: 250,
          reason: 'Integration test refund'
        })
        .expect(200);

      expect(refundResponse.body.refund.transactionId).toBe(transactionId);
      expect(refundResponse.body.refund.refundAmount).toBe(250);

      // 4. Verify final state
      const finalGetResponse = await request(app)
        .get(`/api/payments/${transactionId}`)
        .expect(200);

      expect(finalGetResponse.body.payment.status).toBe('refunded');
    });

    test('should handle multiple payments for same order', async () => {
      mockPaymentProcessor.fire.mockResolvedValue({
        success: true,
        providerId: 'PROV-ABC123',
        providerStatus: 'approved',
        providerMessage: 'Payment processed successfully'
      });

      const orderId = 'ORD-MULTI-PAYMENT-001';

      // Create first payment (partial)
      await request(app)
        .post('/api/payments')
        .send({
          orderId,
          userId: 'USER-001',
          amount: 150.00,
          method: 'credit_card'
        })
        .expect(201);

      // Create second payment (remaining)
      await request(app)
        .post('/api/payments')
        .send({
          orderId,
          userId: 'USER-001',
          amount: 100.00,
          method: 'paypal'
        })
        .expect(201);

      // Retrieve all payments for order
      const orderPaymentsResponse = await request(app)
        .get(`/api/payments/order/${orderId}`)
        .expect(200);

      expect(orderPaymentsResponse.body.total).toBe(2);
      expect(orderPaymentsResponse.body.payments).toHaveLength(2);

      const totalAmount = orderPaymentsResponse.body.payments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );
      expect(totalAmount).toBe(250);
    });

    test('should handle payment failure and retry', async () => {
      // First attempt fails
      mockPaymentProcessor.fire.mockRejectedValueOnce({
        success: false,
        providerStatus: 'declined',
        providerMessage: 'Insufficient funds'
      });

      const failResponse = await request(app)
        .post('/api/payments')
        .send({
          orderId: 'ORD-RETRY-001',
          userId: 'USER-RETRY-001',
          amount: 100.00,
          method: 'credit_card'
        })
        .expect(400);

      expect(failResponse.body.error).toBe('Payment processing failed');
      const failedTransactionId = failResponse.body.transactionId;

      // Second attempt succeeds (different order ID for new transaction)
      mockPaymentProcessor.fire.mockResolvedValueOnce({
        success: true,
        providerId: 'PROV-ABC123',
        providerStatus: 'approved',
        providerMessage: 'Payment processed successfully'
      });

      const successResponse = await request(app)
        .post('/api/payments')
        .send({
          orderId: 'ORD-RETRY-002',
          userId: 'USER-RETRY-001',
          amount: 100.00,
          method: 'credit_card'
        })
        .expect(201);

      expect(successResponse.body.payment.status).toBe('completed');

      // Verify both transactions exist
      const failedPayment = await request(app)
        .get(`/api/payments/${failedTransactionId}`)
        .expect(200);

      expect(failedPayment.body.payment.status).toBe('failed');
    });
  });

  describe('Fraud Detection Integration', () => {
    test('should integrate fraud check with payment processing', async () => {
      const userId = 'USER-FRAUD-001';

      mockPaymentProcessor.fire.mockResolvedValue({
        success: true,
        providerId: 'PROV-ABC123',
        providerStatus: 'approved',
        providerMessage: 'Payment processed successfully'
      });

      // Create multiple payments to trigger fraud detection
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/payments')
          .send({
            orderId: `ORD-FRAUD-${i}`,
            userId,
            amount: 100,
            method: 'credit_card'
          });
      }

      // Check fraud score
      const fraudCheckResponse = await request(app)
        .post('/api/payments/fraud/check')
        .send({
          amount: 2000,
          method: 'credit_card',
          userId,
          billingAddress: {
            country: 'USA'
          }
        })
        .expect(200);

      expect(fraudCheckResponse.body.riskScore).toBeGreaterThan(50);
      expect(fraudCheckResponse.body.factors.frequentTransactions).toBe(true);
      expect(fraudCheckResponse.body.factors.largeAmount).toBe(true);
    });
  });

  describe('Analytics and Statistics Integration', () => {
    test('should provide accurate statistics across payment lifecycle', async () => {
      mockPaymentProcessor.fire
        .mockResolvedValueOnce({
          success: true,
          providerId: 'PROV-1',
          providerStatus: 'approved',
          providerMessage: 'Success'
        })
        .mockResolvedValueOnce({
          success: true,
          providerId: 'PROV-2',
          providerStatus: 'approved',
          providerMessage: 'Success'
        })
        .mockRejectedValueOnce({
          success: false,
          providerStatus: 'declined',
          providerMessage: 'Failed'
        });

      // Create 2 successful payments
      const payment1 = await request(app)
        .post('/api/payments')
        .send({
          orderId: 'ORD-STATS-001',
          userId: 'USER-STATS-001',
          amount: 100,
          method: 'credit_card'
        });

      const payment2 = await request(app)
        .post('/api/payments')
        .send({
          orderId: 'ORD-STATS-002',
          userId: 'USER-STATS-002',
          amount: 200,
          method: 'paypal'
        });

      // Create 1 failed payment
      await request(app)
        .post('/api/payments')
        .send({
          orderId: 'ORD-STATS-003',
          userId: 'USER-STATS-003',
          amount: 150,
          method: 'credit_card'
        });

      // Refund one payment
      await request(app)
        .post(`/api/payments/${payment1.body.payment.transactionId}/refund`)
        .send({ reason: 'Test refund' });

      // Get statistics
      const statsResponse = await request(app)
        .get('/api/payments/stats/summary')
        .expect(200);

      expect(statsResponse.body.totalPayments).toBe(3);
      expect(statsResponse.body.totalRevenue).toBe(200); // Only non-refunded completed
      expect(statsResponse.body.successRate).toBe('66.67%'); // 2 out of 3

      // Verify detailed stats
      const detailedStats = statsResponse.body.detailedStats;
      expect(detailedStats.length).toBeGreaterThan(0);

      const statuses = detailedStats.map(s => s._id.status);
      expect(statuses).toContain('refunded');
      expect(statuses).toContain('completed');
      expect(statuses).toContain('failed');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle database connection issues gracefully', async () => {
      // This test would require actually disconnecting from DB
      // For now, we test that the health endpoint shows DB status
      const healthResponse = await request(app)
        .get('/health')
        .expect(200);

      expect(healthResponse.body).toHaveProperty('database');
      expect(healthResponse.body.database).toBe('connected');
    });

    test('should validate all required fields across endpoints', async () => {
      // Missing orderId
      await request(app)
        .post('/api/payments')
        .send({
          userId: 'USER-001',
          amount: 100,
          method: 'credit_card'
        })
        .expect(400);

      // Missing userId
      await request(app)
        .post('/api/payments')
        .send({
          orderId: 'ORD-001',
          amount: 100,
          method: 'credit_card'
        })
        .expect(400);

      // Missing amount
      await request(app)
        .post('/api/payments')
        .send({
          orderId: 'ORD-001',
          userId: 'USER-001',
          method: 'credit_card'
        })
        .expect(400);
    });

    test('should handle concurrent payment requests', async () => {
      mockPaymentProcessor.fire.mockResolvedValue({
        success: true,
        providerId: 'PROV-ABC123',
        providerStatus: 'approved',
        providerMessage: 'Payment processed successfully'
      });

      // Create multiple payments concurrently
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .post('/api/payments')
            .send({
              orderId: `ORD-CONCURRENT-${i}`,
              userId: `USER-${i}`,
              amount: 100,
              method: 'credit_card'
            })
        );
      }

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(result => {
        expect(result.status).toBe(201);
        expect(result.body.payment).toHaveProperty('transactionId');
      });

      // All transaction IDs should be unique
      const transactionIds = results.map(r => r.body.payment.transactionId);
      const uniqueIds = new Set(transactionIds);
      expect(uniqueIds.size).toBe(5);
    });
  });
});
