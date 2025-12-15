const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../index');

// Mock the payment processor
jest.mock('opossum');
const CircuitBreaker = require('opossum');

describe('Payment Statistics API', () => {
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

  // Helper function to create payments
  async function createPayments(count, status = 'completed', amount = 100, method = 'credit_card') {
    const payments = [];

    if (status === 'completed') {
      mockPaymentProcessor.fire.mockResolvedValue({
        success: true,
        providerId: 'PROV-ABC123',
        providerStatus: 'approved',
        providerMessage: 'Payment processed successfully'
      });
    } else if (status === 'failed') {
      mockPaymentProcessor.fire.mockRejectedValue({
        success: false,
        providerStatus: 'declined',
        providerMessage: 'Payment declined'
      });
    }

    for (let i = 0; i < count; i++) {
      await request(app)
        .post('/api/payments')
        .send({
          orderId: `ORD-STATS-${Date.now()}-${i}`,
          userId: `USER-${i}`,
          amount,
          method
        });
    }
  }

  describe('GET /api/payments/stats/summary', () => {
    test('should return empty stats when no payments exist', async () => {
      const response = await request(app)
        .get('/api/payments/stats/summary')
        .expect(200);

      expect(response.body).toHaveProperty('totalPayments', 0);
      expect(response.body).toHaveProperty('totalRevenue', 0);
      expect(response.body).toHaveProperty('successRate', '0%');
      expect(response.body).toHaveProperty('detailedStats');
      expect(response.body.detailedStats).toEqual([]);
    });

    test('should calculate total payments correctly', async () => {
      await createPayments(5, 'completed');
      await createPayments(3, 'failed');

      const response = await request(app)
        .get('/api/payments/stats/summary')
        .expect(200);

      expect(response.body.totalPayments).toBe(8);
    });

    test('should calculate total revenue from completed payments only', async () => {
      await createPayments(3, 'completed', 100); // 300 total
      await createPayments(2, 'failed', 50);     // Should not count

      const response = await request(app)
        .get('/api/payments/stats/summary')
        .expect(200);

      expect(response.body.totalRevenue).toBe(300);
    });

    test('should calculate success rate correctly', async () => {
      await createPayments(7, 'completed'); // 70% success
      await createPayments(3, 'failed');    // 30% failure

      const response = await request(app)
        .get('/api/payments/stats/summary')
        .expect(200);

      expect(response.body.successRate).toBe('70.00%');
    });

    test('should provide detailed stats grouped by status and method', async () => {
      await createPayments(2, 'completed', 100, 'credit_card');
      await createPayments(3, 'completed', 150, 'paypal');
      await createPayments(1, 'failed', 75, 'credit_card');

      const response = await request(app)
        .get('/api/payments/stats/summary')
        .expect(200);

      expect(response.body.detailedStats).toBeInstanceOf(Array);
      expect(response.body.detailedStats.length).toBeGreaterThan(0);

      // Check structure of detailed stats
      const stats = response.body.detailedStats;
      stats.forEach(stat => {
        expect(stat).toHaveProperty('_id');
        expect(stat._id).toHaveProperty('status');
        expect(stat._id).toHaveProperty('method');
        expect(stat).toHaveProperty('count');
        expect(stat).toHaveProperty('totalAmount');
      });
    });

    test('should track different payment methods separately', async () => {
      await createPayments(2, 'completed', 100, 'credit_card');
      await createPayments(3, 'completed', 100, 'paypal');
      await createPayments(1, 'completed', 100, 'stripe');

      const response = await request(app)
        .get('/api/payments/stats/summary')
        .expect(200);

      const methods = response.body.detailedStats.map(s => s._id.method);
      expect(methods).toContain('credit_card');
      expect(methods).toContain('paypal');
      expect(methods).toContain('stripe');
    });

    test('should handle decimal amounts correctly in revenue calculation', async () => {
      await createPayments(1, 'completed', 99.99);
      await createPayments(1, 'completed', 149.99);
      await createPayments(1, 'completed', 50.50);

      const response = await request(app)
        .get('/api/payments/stats/summary')
        .expect(200);

      expect(response.body.totalRevenue).toBeCloseTo(300.48, 2);
    });

    test('should calculate 100% success rate when all payments succeed', async () => {
      await createPayments(10, 'completed');

      const response = await request(app)
        .get('/api/payments/stats/summary')
        .expect(200);

      expect(response.body.successRate).toBe('100.00%');
    });

    test('should calculate 0% success rate when all payments fail', async () => {
      await createPayments(5, 'failed');

      const response = await request(app)
        .get('/api/payments/stats/summary')
        .expect(200);

      expect(response.body.successRate).toBe('0.00%');
    });

    test('should include refunded payments in total count', async () => {
      // Create completed payments
      await createPayments(2, 'completed', 100);

      // Get one payment and refund it
      const Payment = mongoose.model('Payment');
      const payment = await Payment.findOne({ status: 'completed' });

      await request(app)
        .post(`/api/payments/${payment.transactionId}/refund`)
        .send({ reason: 'Test refund' });

      const response = await request(app)
        .get('/api/payments/stats/summary')
        .expect(200);

      expect(response.body.totalPayments).toBe(2);

      // Find refunded payment in detailed stats
      const refundedStat = response.body.detailedStats.find(
        s => s._id.status === 'refunded'
      );
      expect(refundedStat).toBeDefined();
      expect(refundedStat.count).toBe(1);
    });

    test('should aggregate amounts correctly for same status and method', async () => {
      await createPayments(3, 'completed', 100, 'credit_card');

      const response = await request(app)
        .get('/api/payments/stats/summary')
        .expect(200);

      const creditCardStat = response.body.detailedStats.find(
        s => s._id.status === 'completed' && s._id.method === 'credit_card'
      );

      expect(creditCardStat.count).toBe(3);
      expect(creditCardStat.totalAmount).toBe(300);
    });

    test('should handle large number of payments efficiently', async () => {
      await createPayments(50, 'completed', 100);

      const response = await request(app)
        .get('/api/payments/stats/summary')
        .expect(200);

      expect(response.body.totalPayments).toBe(50);
      expect(response.body.totalRevenue).toBe(5000);
    });

    test('should round success rate to 2 decimal places', async () => {
      await createPayments(2, 'completed'); // 66.666...%
      await createPayments(1, 'failed');

      const response = await request(app)
        .get('/api/payments/stats/summary')
        .expect(200);

      expect(response.body.successRate).toMatch(/^\d+\.\d{2}%$/);
      expect(response.body.successRate).toBe('66.67%');
    });
  });

  describe('GET /metrics', () => {
    test('should return Prometheus metrics', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.text).toBeDefined();
    });

    test('should include custom payment metrics', async () => {
      // Create some payments to generate metrics
      await createPayments(2, 'completed');

      const response = await request(app)
        .get('/metrics')
        .expect(200);

      // Metrics should include payment-related data
      expect(response.text.length).toBeGreaterThan(0);
    });
  });
});
