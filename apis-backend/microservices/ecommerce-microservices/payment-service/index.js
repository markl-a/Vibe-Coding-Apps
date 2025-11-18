const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const CircuitBreaker = require('opossum');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const promClient = require('prom-client');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3004;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce_payments';

// Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const paymentCounter = new promClient.Counter({
  name: 'payments_total',
  help: 'Total number of payment transactions',
  labelNames: ['status', 'method'],
  registers: [register]
});

const paymentAmount = new promClient.Histogram({
  name: 'payment_amount',
  help: 'Payment transaction amounts',
  labelNames: ['currency', 'method'],
  buckets: [10, 50, 100, 500, 1000, 5000],
  registers: [register]
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Request duration middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.labels(req.method, req.route?.path || req.path, res.statusCode).observe(duration);
  });
  next();
});

// MongoDB Connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB (E-commerce Payments)'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Payment Transaction Schema
const paymentSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true, index: true },
  orderId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
  method: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'stripe', 'apple_pay', 'google_pay', 'bank_transfer'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
    index: true
  },
  paymentDetails: {
    cardLast4: String,
    cardBrand: String,
    cardExpiry: String,
    paypalEmail: String,
    bankAccount: String
  },
  billingAddress: {
    firstName: String,
    lastName: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  providerResponse: {
    providerId: String,
    providerStatus: String,
    providerMessage: String,
    rawResponse: Object
  },
  metadata: { type: Map, of: String },
  failureReason: String,
  refundAmount: Number,
  refundedAt: Date,
  processedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Generate transaction ID
paymentSchema.pre('save', async function(next) {
  if (!this.transactionId) {
    this.transactionId = `PAY-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-commerce Payment Service API',
      version: '1.0.0',
      description: 'Secure Payment Processing Service with Multiple Payment Providers',
    },
    servers: [{ url: `http://localhost:${PORT}` }],
  },
  apis: ['./index.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Simulated payment processing function
const processPaymentWithProvider = async (paymentData) => {
  // This is a simulation. In production, integrate with real payment providers
  // like Stripe, PayPal, etc.

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate 95% success rate
      const success = Math.random() > 0.05;

      if (success) {
        resolve({
          success: true,
          providerId: `PROV-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
          providerStatus: 'approved',
          providerMessage: 'Payment processed successfully'
        });
      } else {
        reject({
          success: false,
          providerStatus: 'declined',
          providerMessage: 'Insufficient funds or card declined'
        });
      }
    }, 1000); // Simulate network delay
  });
};

const paymentProcessorBreaker = new CircuitBreaker(processPaymentWithProvider, {
  timeout: 10000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'E-commerce Payment Service',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    paymentProcessor: paymentProcessorBreaker.stats
  });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Process payment
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - userId
 *               - amount
 *               - method
 *             properties:
 *               orderId:
 *                 type: string
 *               userId:
 *                 type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *               method:
 *                 type: string
 *                 enum: [credit_card, debit_card, paypal, stripe, apple_pay, google_pay, bank_transfer]
 */
app.post('/api/payments', [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('userId').notEmpty().withMessage('User ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount is required'),
  body('method').isIn(['credit_card', 'debit_card', 'paypal', 'stripe', 'apple_pay', 'google_pay', 'bank_transfer'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId, userId, amount, currency = 'USD', method, paymentDetails, billingAddress } = req.body;

    // Create payment record
    const payment = new Payment({
      orderId,
      userId,
      amount,
      currency,
      method,
      paymentDetails,
      billingAddress,
      status: 'processing'
    });

    await payment.save();

    // Process payment through provider (with circuit breaker)
    try {
      const result = await paymentProcessorBreaker.fire({
        amount,
        currency,
        method,
        paymentDetails
      });

      // Update payment status
      payment.status = 'completed';
      payment.processedAt = new Date();
      payment.providerResponse = {
        providerId: result.providerId,
        providerStatus: result.providerStatus,
        providerMessage: result.providerMessage
      };

      await payment.save();

      paymentCounter.labels('completed', method).inc();
      paymentAmount.labels(currency, method).observe(amount);

      res.status(201).json({
        message: 'Payment processed successfully',
        payment: {
          transactionId: payment.transactionId,
          orderId: payment.orderId,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          processedAt: payment.processedAt
        }
      });
    } catch (error) {
      // Payment failed
      payment.status = 'failed';
      payment.failureReason = error.providerMessage || 'Payment processing failed';
      payment.providerResponse = {
        providerStatus: error.providerStatus,
        providerMessage: error.providerMessage
      };

      await payment.save();

      paymentCounter.labels('failed', method).inc();

      res.status(400).json({
        error: 'Payment processing failed',
        reason: payment.failureReason,
        transactionId: payment.transactionId
      });
    }
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Server error during payment processing' });
  }
});

/**
 * @swagger
 * /api/payments/{transactionId}:
 *   get:
 *     summary: Get payment details
 *     tags: [Payments]
 */
app.get('/api/payments/:transactionId', async (req, res) => {
  try {
    const payment = await Payment.findOne({ transactionId: req.params.transactionId })
      .select('-paymentDetails.cardNumber -__v');

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ payment });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/payments/order/{orderId}:
 *   get:
 *     summary: Get payments by order ID
 *     tags: [Payments]
 */
app.get('/api/payments/order/:orderId', async (req, res) => {
  try {
    const payments = await Payment.find({ orderId: req.params.orderId })
      .select('-paymentDetails.cardNumber -__v')
      .sort({ createdAt: -1 });

    res.json({ payments, total: payments.length });
  } catch (error) {
    console.error('Get order payments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/payments/{transactionId}/refund:
 *   post:
 *     summary: Refund payment
 *     tags: [Payments]
 */
app.post('/api/payments/:transactionId/refund', [
  body('amount').optional().isFloat({ min: 0.01 }),
  body('reason').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const payment = await Payment.findOne({ transactionId: req.params.transactionId });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ error: 'Can only refund completed payments' });
    }

    const { amount = payment.amount, reason } = req.body;

    if (amount > payment.amount) {
      return res.status(400).json({ error: 'Refund amount cannot exceed payment amount' });
    }

    // Process refund (simulated)
    payment.status = 'refunded';
    payment.refundAmount = amount;
    payment.refundedAt = new Date();
    payment.failureReason = reason || 'Refund requested';

    await payment.save();

    paymentCounter.labels('refunded', payment.method).inc();

    res.json({
      message: 'Payment refunded successfully',
      refund: {
        transactionId: payment.transactionId,
        originalAmount: payment.amount,
        refundAmount: amount,
        refundedAt: payment.refundedAt
      }
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/payments/stats/summary:
 *   get:
 *     summary: Get payment statistics
 *     tags: [Analytics]
 */
app.get('/api/payments/stats/summary', async (req, res) => {
  try {
    const stats = await Payment.aggregate([
      {
        $group: {
          _id: {
            status: '$status',
            method: '$method'
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const totalPayments = await Payment.countDocuments();
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const successRate = await Payment.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          successful: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      totalPayments,
      totalRevenue: totalRevenue[0]?.total || 0,
      successRate: successRate[0] ? (successRate[0].successful / successRate[0].total * 100).toFixed(2) + '%' : '0%',
      detailedStats: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /api/payments/fraud/check:
 *   post:
 *     summary: AI-powered fraud detection
 *     tags: [AI Features]
 *     description: Analyze payment for fraud patterns using AI
 */
app.post('/api/payments/fraud/check', async (req, res) => {
  try {
    const { amount, method, userId, billingAddress } = req.body;

    // AI-based fraud detection (simplified scoring system)
    let riskScore = 0;

    // Check for suspicious patterns
    if (amount > 1000) riskScore += 20;
    if (amount > 5000) riskScore += 30;

    // Check recent payment history
    const recentPayments = await Payment.countDocuments({
      userId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (recentPayments > 5) riskScore += 40;

    // Check for failed payments
    const failedPayments = await Payment.countDocuments({
      userId,
      status: 'failed',
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    if (failedPayments > 3) riskScore += 30;

    const riskLevel = riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low';
    const shouldBlock = riskScore > 80;

    res.json({
      riskScore,
      riskLevel,
      shouldBlock,
      recommendation: shouldBlock ? 'Block transaction and request verification' : 'Proceed with transaction',
      factors: {
        largeAmount: amount > 1000,
        frequentTransactions: recentPayments > 5,
        recentFailures: failedPayments > 3
      }
    });
  } catch (error) {
    console.error('Fraud check error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 E-commerce Payment Service running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
});

module.exports = app;
