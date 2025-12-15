const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../index');

// Mock the payment processor
jest.mock('opossum');
const CircuitBreaker = require('opossum');

describe('Fraud Detection API', () => {
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

  describe('POST /api/payments/fraud/check', () => {
    test('should detect low risk for small transaction', async () => {
      const response = await request(app)
        .post('/api/payments/fraud/check')
        .send({
          amount: 50,
          method: 'credit_card',
          userId: 'USER-NEW-123',
          billingAddress: {
            country: 'USA'
          }
        })
        .expect(200);

      expect(response.body).toHaveProperty('riskScore');
      expect(response.body).toHaveProperty('riskLevel', 'low');
      expect(response.body).toHaveProperty('shouldBlock', false);
      expect(response.body).toHaveProperty('recommendation');
      expect(response.body.recommendation).toContain('Proceed');
    });

    test('should increase risk score for large transaction', async () => {
      const response = await request(app)
        .post('/api/payments/fraud/check')
        .send({
          amount: 1500,
          method: 'credit_card',
          userId: 'USER-123',
          billingAddress: {
            country: 'USA'
          }
        })
        .expect(200);

      expect(response.body.riskScore).toBeGreaterThan(0);
      expect(response.body.factors.largeAmount).toBe(true);
    });

    test('should increase risk score for very large transaction', async () => {
      const response = await request(app)
        .post('/api/payments/fraud/check')
        .send({
          amount: 6000,
          method: 'credit_card',
          userId: 'USER-123',
          billingAddress: {
            country: 'USA'
          }
        })
        .expect(200);

      expect(response.body.riskScore).toBeGreaterThanOrEqual(50);
      expect(response.body.riskLevel).not.toBe('low');
    });

    test('should detect high risk for frequent transactions', async () => {
      const userId = 'USER-FREQUENT-123';
      const Payment = mongoose.model('Payment');

      // Create multiple recent payments
      mockPaymentProcessor.fire.mockResolvedValue({
        success: true,
        providerId: 'PROV-ABC123',
        providerStatus: 'approved',
        providerMessage: 'Payment processed successfully'
      });

      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/payments')
          .send({
            orderId: `ORD-FREQ-${i}`,
            userId,
            amount: 100,
            method: 'credit_card'
          });
      }

      // Check fraud detection
      const response = await request(app)
        .post('/api/payments/fraud/check')
        .send({
          amount: 100,
          method: 'credit_card',
          userId,
          billingAddress: {
            country: 'USA'
          }
        })
        .expect(200);

      expect(response.body.riskScore).toBeGreaterThan(40);
      expect(response.body.factors.frequentTransactions).toBe(true);
    });

    test('should detect risk from recent failed payments', async () => {
      const userId = 'USER-FAILED-123';
      const Payment = mongoose.model('Payment');

      // Create failed payments
      mockPaymentProcessor.fire.mockRejectedValue({
        success: false,
        providerStatus: 'declined',
        providerMessage: 'Card declined'
      });

      for (let i = 0; i < 4; i++) {
        await request(app)
          .post('/api/payments')
          .send({
            orderId: `ORD-FAIL-${i}`,
            userId,
            amount: 100,
            method: 'credit_card'
          });
      }

      // Check fraud detection
      const response = await request(app)
        .post('/api/payments/fraud/check')
        .send({
          amount: 100,
          method: 'credit_card',
          userId,
          billingAddress: {
            country: 'USA'
          }
        })
        .expect(200);

      expect(response.body.factors.recentFailures).toBe(true);
      expect(response.body.riskScore).toBeGreaterThan(0);
    });

    test('should recommend blocking for very high risk score', async () => {
      const userId = 'USER-HIGHRISK-123';

      // Create multiple recent payments
      mockPaymentProcessor.fire.mockResolvedValue({
        success: true,
        providerId: 'PROV-ABC123',
        providerStatus: 'approved',
        providerMessage: 'Payment processed successfully'
      });

      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/payments')
          .send({
            orderId: `ORD-RISK-${i}`,
            userId,
            amount: 100,
            method: 'credit_card'
          });
      }

      // Check with large amount + frequent transactions
      const response = await request(app)
        .post('/api/payments/fraud/check')
        .send({
          amount: 7000,
          method: 'credit_card',
          userId,
          billingAddress: {
            country: 'USA'
          }
        })
        .expect(200);

      expect(response.body.riskScore).toBeGreaterThan(80);
      expect(response.body.shouldBlock).toBe(true);
      expect(response.body.recommendation).toContain('Block');
    });

    test('should provide detailed risk factors', async () => {
      const response = await request(app)
        .post('/api/payments/fraud/check')
        .send({
          amount: 2000,
          method: 'credit_card',
          userId: 'USER-123',
          billingAddress: {
            country: 'USA'
          }
        })
        .expect(200);

      expect(response.body).toHaveProperty('factors');
      expect(response.body.factors).toHaveProperty('largeAmount');
      expect(response.body.factors).toHaveProperty('frequentTransactions');
      expect(response.body.factors).toHaveProperty('recentFailures');
    });

    test('should categorize medium risk correctly', async () => {
      const userId = 'USER-MEDIUM-123';

      // Create some recent payments (but not too many)
      mockPaymentProcessor.fire.mockResolvedValue({
        success: true,
        providerId: 'PROV-ABC123',
        providerStatus: 'approved',
        providerMessage: 'Payment processed successfully'
      });

      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/payments')
          .send({
            orderId: `ORD-MED-${i}`,
            userId,
            amount: 100,
            method: 'credit_card'
          });
      }

      const response = await request(app)
        .post('/api/payments/fraud/check')
        .send({
          amount: 1200,
          method: 'credit_card',
          userId,
          billingAddress: {
            country: 'USA'
          }
        })
        .expect(200);

      expect(response.body.riskLevel).toBe('medium');
      expect(response.body.riskScore).toBeGreaterThan(40);
      expect(response.body.riskScore).toBeLessThanOrEqual(70);
    });

    test('should handle fraud check for new user with no history', async () => {
      const response = await request(app)
        .post('/api/payments/fraud/check')
        .send({
          amount: 100,
          method: 'credit_card',
          userId: 'USER-BRAND-NEW-999',
          billingAddress: {
            country: 'USA'
          }
        })
        .expect(200);

      expect(response.body.factors.frequentTransactions).toBe(false);
      expect(response.body.factors.recentFailures).toBe(false);
    });

    test('should return consistent risk scores for same conditions', async () => {
      const fraudData = {
        amount: 500,
        method: 'credit_card',
        userId: 'USER-CONSISTENT-123',
        billingAddress: {
          country: 'USA'
        }
      };

      const response1 = await request(app)
        .post('/api/payments/fraud/check')
        .send(fraudData)
        .expect(200);

      const response2 = await request(app)
        .post('/api/payments/fraud/check')
        .send(fraudData)
        .expect(200);

      expect(response1.body.riskScore).toBe(response2.body.riskScore);
      expect(response1.body.riskLevel).toBe(response2.body.riskLevel);
    });

    test('should consider payment history within 24 hours only', async () => {
      const userId = 'USER-TIMEWINDOW-123';
      const Payment = mongoose.model('Payment');

      // Create an old payment (manually set old date)
      await Payment.create({
        transactionId: 'PAY-OLD-123',
        orderId: 'ORD-OLD',
        userId,
        amount: 100,
        method: 'credit_card',
        status: 'completed',
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000) // 48 hours ago
      });

      const response = await request(app)
        .post('/api/payments/fraud/check')
        .send({
          amount: 100,
          method: 'credit_card',
          userId,
          billingAddress: {
            country: 'USA'
          }
        })
        .expect(200);

      // Old payment should not count toward frequent transactions
      expect(response.body.factors.frequentTransactions).toBe(false);
    });

    test('should consider failed payments within 7 days', async () => {
      const userId = 'USER-FAILWINDOW-123';
      const Payment = mongoose.model('Payment');

      // Create failed payment within 7 days
      await Payment.create({
        transactionId: 'PAY-FAIL-RECENT-123',
        orderId: 'ORD-FAIL-RECENT',
        userId,
        amount: 100,
        method: 'credit_card',
        status: 'failed',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      });

      // Create old failed payment (beyond 7 days)
      await Payment.create({
        transactionId: 'PAY-FAIL-OLD-123',
        orderId: 'ORD-FAIL-OLD',
        userId,
        amount: 100,
        method: 'credit_card',
        status: 'failed',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
      });

      const response = await request(app)
        .post('/api/payments/fraud/check')
        .send({
          amount: 100,
          method: 'credit_card',
          userId,
          billingAddress: {
            country: 'USA'
          }
        })
        .expect(200);

      // Only recent failure should be counted (not enough to trigger flag)
      expect(response.body.factors.recentFailures).toBe(false);
    });
  });
});
