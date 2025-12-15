const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../index');

// Mock the payment processor
jest.mock('opossum');
const CircuitBreaker = require('opossum');

describe('Payment Processing API', () => {
  let mockPaymentProcessor;

  beforeAll(async () => {
    // Connect to test database
    const MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/ecommerce_payments_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_TEST_URI);
    }
  });

  afterAll(async () => {
    // Cleanup and close connections
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear all collections before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }

    // Setup circuit breaker mock
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

  describe('POST /api/payments', () => {
    const validPaymentData = {
      orderId: 'ORD-12345',
      userId: 'USER-67890',
      amount: 99.99,
      currency: 'USD',
      method: 'credit_card',
      paymentDetails: {
        cardLast4: '4242',
        cardBrand: 'Visa',
        cardExpiry: '12/25'
      },
      billingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      }
    };

    test('should successfully process a valid payment', async () => {
      // Mock successful payment processing
      mockPaymentProcessor.fire.mockResolvedValue({
        success: true,
        providerId: 'PROV-ABC123',
        providerStatus: 'approved',
        providerMessage: 'Payment processed successfully'
      });

      const response = await request(app)
        .post('/api/payments')
        .send(validPaymentData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Payment processed successfully');
      expect(response.body).toHaveProperty('payment');
      expect(response.body.payment).toHaveProperty('transactionId');
      expect(response.body.payment).toHaveProperty('status', 'completed');
      expect(response.body.payment.orderId).toBe(validPaymentData.orderId);
      expect(response.body.payment.amount).toBe(validPaymentData.amount);
    });

    test('should generate unique transaction ID for each payment', async () => {
      mockPaymentProcessor.fire.mockResolvedValue({
        success: true,
        providerId: 'PROV-ABC123',
        providerStatus: 'approved',
        providerMessage: 'Payment processed successfully'
      });

      const response1 = await request(app)
        .post('/api/payments')
        .send(validPaymentData);

      const response2 = await request(app)
        .post('/api/payments')
        .send({ ...validPaymentData, orderId: 'ORD-54321' });

      expect(response1.body.payment.transactionId).not.toBe(response2.body.payment.transactionId);
      expect(response1.body.payment.transactionId).toMatch(/^PAY-[A-F0-9]+$/);
    });

    test('should handle payment processing failure', async () => {
      // Mock payment failure
      mockPaymentProcessor.fire.mockRejectedValue({
        success: false,
        providerStatus: 'declined',
        providerMessage: 'Insufficient funds'
      });

      const response = await request(app)
        .post('/api/payments')
        .send(validPaymentData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Payment processing failed');
      expect(response.body).toHaveProperty('reason', 'Insufficient funds');
      expect(response.body).toHaveProperty('transactionId');
    });

    test('should reject payment with missing orderId', async () => {
      const invalidData = { ...validPaymentData };
      delete invalidData.orderId;

      const response = await request(app)
        .post('/api/payments')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Order ID is required'
          })
        ])
      );
    });

    test('should reject payment with missing userId', async () => {
      const invalidData = { ...validPaymentData };
      delete invalidData.userId;

      const response = await request(app)
        .post('/api/payments')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'User ID is required'
          })
        ])
      );
    });

    test('should reject payment with invalid amount (zero)', async () => {
      const invalidData = { ...validPaymentData, amount: 0 };

      const response = await request(app)
        .post('/api/payments')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    test('should reject payment with negative amount', async () => {
      const invalidData = { ...validPaymentData, amount: -50 };

      const response = await request(app)
        .post('/api/payments')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    test('should reject payment with invalid payment method', async () => {
      const invalidData = { ...validPaymentData, method: 'invalid_method' };

      const response = await request(app)
        .post('/api/payments')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    test('should accept all valid payment methods', async () => {
      const methods = ['credit_card', 'debit_card', 'paypal', 'stripe', 'apple_pay', 'google_pay', 'bank_transfer'];

      mockPaymentProcessor.fire.mockResolvedValue({
        success: true,
        providerId: 'PROV-ABC123',
        providerStatus: 'approved',
        providerMessage: 'Payment processed successfully'
      });

      for (const method of methods) {
        const response = await request(app)
          .post('/api/payments')
          .send({ ...validPaymentData, method, orderId: `ORD-${method}` })
          .expect(201);

        expect(response.body.payment).toBeDefined();
      }
    });

    test('should default to USD currency if not specified', async () => {
      mockPaymentProcessor.fire.mockResolvedValue({
        success: true,
        providerId: 'PROV-ABC123',
        providerStatus: 'approved',
        providerMessage: 'Payment processed successfully'
      });

      const dataWithoutCurrency = { ...validPaymentData };
      delete dataWithoutCurrency.currency;

      const response = await request(app)
        .post('/api/payments')
        .send(dataWithoutCurrency)
        .expect(201);

      expect(response.body.payment.currency).toBe('USD');
    });

    test('should store provider response details', async () => {
      const mockProviderResponse = {
        success: true,
        providerId: 'PROV-XYZ789',
        providerStatus: 'approved',
        providerMessage: 'Payment successful'
      };

      mockPaymentProcessor.fire.mockResolvedValue(mockProviderResponse);

      const response = await request(app)
        .post('/api/payments')
        .send(validPaymentData)
        .expect(201);

      // Verify the payment was stored in database
      const Payment = mongoose.model('Payment');
      const payment = await Payment.findOne({ transactionId: response.body.payment.transactionId });

      expect(payment.providerResponse.providerId).toBe(mockProviderResponse.providerId);
      expect(payment.providerResponse.providerStatus).toBe(mockProviderResponse.providerStatus);
    });
  });

  describe('GET /api/payments/:transactionId', () => {
    test('should retrieve payment by transaction ID', async () => {
      // First create a payment
      mockPaymentProcessor.fire.mockResolvedValue({
        success: true,
        providerId: 'PROV-ABC123',
        providerStatus: 'approved',
        providerMessage: 'Payment processed successfully'
      });

      const createResponse = await request(app)
        .post('/api/payments')
        .send({
          orderId: 'ORD-12345',
          userId: 'USER-67890',
          amount: 99.99,
          method: 'credit_card'
        });

      const transactionId = createResponse.body.payment.transactionId;

      // Now retrieve it
      const response = await request(app)
        .get(`/api/payments/${transactionId}`)
        .expect(200);

      expect(response.body).toHaveProperty('payment');
      expect(response.body.payment.transactionId).toBe(transactionId);
      expect(response.body.payment.orderId).toBe('ORD-12345');
    });

    test('should return 404 for non-existent transaction ID', async () => {
      const response = await request(app)
        .get('/api/payments/PAY-NONEXISTENT')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Payment not found');
    });

    test('should not expose sensitive card details', async () => {
      mockPaymentProcessor.fire.mockResolvedValue({
        success: true,
        providerId: 'PROV-ABC123',
        providerStatus: 'approved',
        providerMessage: 'Payment processed successfully'
      });

      const createResponse = await request(app)
        .post('/api/payments')
        .send({
          orderId: 'ORD-12345',
          userId: 'USER-67890',
          amount: 99.99,
          method: 'credit_card',
          paymentDetails: {
            cardNumber: '4242424242424242',
            cardLast4: '4242'
          }
        });

      const transactionId = createResponse.body.payment.transactionId;

      const response = await request(app)
        .get(`/api/payments/${transactionId}`)
        .expect(200);

      expect(response.body.payment.paymentDetails).not.toHaveProperty('cardNumber');
    });
  });

  describe('GET /api/payments/order/:orderId', () => {
    test('should retrieve all payments for an order', async () => {
      mockPaymentProcessor.fire.mockResolvedValue({
        success: true,
        providerId: 'PROV-ABC123',
        providerStatus: 'approved',
        providerMessage: 'Payment processed successfully'
      });

      const orderId = 'ORD-MULTI-123';

      // Create multiple payments for the same order
      await request(app)
        .post('/api/payments')
        .send({
          orderId,
          userId: 'USER-67890',
          amount: 50,
          method: 'credit_card'
        });

      await request(app)
        .post('/api/payments')
        .send({
          orderId,
          userId: 'USER-67890',
          amount: 30,
          method: 'paypal'
        });

      const response = await request(app)
        .get(`/api/payments/order/${orderId}`)
        .expect(200);

      expect(response.body).toHaveProperty('payments');
      expect(response.body).toHaveProperty('total', 2);
      expect(response.body.payments).toHaveLength(2);
      expect(response.body.payments[0].orderId).toBe(orderId);
    });

    test('should return empty array for order with no payments', async () => {
      const response = await request(app)
        .get('/api/payments/order/ORD-NONEXISTENT')
        .expect(200);

      expect(response.body).toHaveProperty('payments');
      expect(response.body.payments).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });
  });

  describe('Health Check', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('service', 'E-commerce Payment Service');
      expect(response.body).toHaveProperty('database');
    });
  });
});
