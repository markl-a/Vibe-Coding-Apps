# Payment Service Tests

This directory contains comprehensive tests for the Payment Service, including unit tests, integration tests, and mock implementations for external payment providers.

## Test Structure

```
src/__tests__/
├── __mocks__/           # Mock implementations
│   ├── opossum.js      # Circuit breaker mock
│   ├── paypal.js       # PayPal provider mock
│   └── stripe.js       # Stripe provider mock
├── payment.test.js      # Payment processing tests (18 tests)
├── refund.test.js       # Refund functionality tests (13 tests)
├── fraud-detection.test.js  # Fraud detection tests (13 tests)
├── stats.test.js        # Statistics and analytics tests (14 tests)
├── integration.test.js  # Integration tests (9 tests)
├── setup.js            # Test setup and utilities
└── README.md           # This file
```

## Test Coverage

Total test cases: **67+**

### Payment Processing Tests (payment.test.js)
- ✓ Successful payment processing
- ✓ Unique transaction ID generation
- ✓ Payment failure handling
- ✓ Input validation (orderId, userId, amount, method)
- ✓ Payment method validation
- ✓ Currency handling (default USD)
- ✓ Provider response storage
- ✓ Payment retrieval by transaction ID
- ✓ Payment retrieval by order ID
- ✓ Sensitive data protection

### Refund Tests (refund.test.js)
- ✓ Full refund processing
- ✓ Partial refund processing
- ✓ Refund validation (amount limits, status checks)
- ✓ Refund reason tracking
- ✓ Timestamp recording
- ✓ Multiple currency support
- ✓ Decimal amount handling

### Fraud Detection Tests (fraud-detection.test.js)
- ✓ Risk scoring for small/large transactions
- ✓ Frequent transaction detection
- ✓ Failed payment history analysis
- ✓ Risk level categorization (low/medium/high)
- ✓ Block recommendations for high-risk transactions
- ✓ Time-window based analysis (24h for transactions, 7d for failures)

### Statistics Tests (stats.test.js)
- ✓ Total payments counting
- ✓ Revenue calculation (completed payments only)
- ✓ Success rate calculation
- ✓ Grouping by status and payment method
- ✓ Refunded payment tracking
- ✓ Prometheus metrics endpoint
- ✓ Large dataset handling

### Integration Tests (integration.test.js)
- ✓ Complete payment lifecycle (create → retrieve → refund)
- ✓ Multiple payments per order
- ✓ Payment retry after failure
- ✓ Fraud detection integration
- ✓ Analytics accuracy across lifecycle
- ✓ Concurrent payment handling
- ✓ Error handling and validation

## Running Tests

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Ensure MongoDB is running (for integration tests):
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or use existing MongoDB instance
```

### Run All Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

### Run Specific Test File

```bash
# Payment tests
npm test -- payment.test.js

# Refund tests
npm test -- refund.test.js

# Fraud detection tests
npm test -- fraud-detection.test.js

# Statistics tests
npm test -- stats.test.js

# Integration tests
npm test -- integration.test.js
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Run Tests with Verbose Output

```bash
npm test -- --verbose
```

## Environment Variables

Tests use the following environment variables:

- `NODE_ENV=test` - Set automatically by setup.js
- `MONGODB_TEST_URI` - MongoDB connection string for tests (default: `mongodb://localhost:27017/ecommerce_payments_test`)
- `PORT=3999` - Test server port (to avoid conflicts)

You can set these in a `.env.test` file:

```env
MONGODB_TEST_URI=mongodb://localhost:27017/ecommerce_payments_test
PORT=3999
```

## Mocking Strategy

### External Payment Providers

All external payment providers (Stripe, PayPal) are mocked to:
- Avoid real API calls during tests
- Ensure predictable test results
- Speed up test execution
- Prevent actual charges

### Circuit Breaker (Opossum)

The circuit breaker is mocked to:
- Remove timeout and retry logic during tests
- Allow direct testing of success/failure scenarios
- Simplify test setup

### Database

Tests use a separate test database that is:
- Created before all tests
- Cleaned between each test
- Dropped after all tests complete

## Test Utilities

The `setup.js` file provides global utilities:

```javascript
// Generate random string
global.testUtils.randomString(10);

// Wait for async operations
await global.testUtils.wait(1000);

// Create test payment data
const paymentData = global.testUtils.createPaymentData({
  amount: 200,
  method: 'paypal'
});
```

## Coverage Thresholds

The project enforces minimum coverage thresholds:

- **Branches**: 70%
- **Functions**: 75%
- **Lines**: 80%
- **Statements**: 80%

## Troubleshooting

### MongoDB Connection Issues

If tests fail with MongoDB connection errors:

1. Ensure MongoDB is running: `docker ps` or `systemctl status mongodb`
2. Check connection string in environment variables
3. Verify network access to MongoDB port (27017)

### Port Already in Use

If you get "Port already in use" errors:

1. Change test port in `.env.test`
2. Kill existing process: `lsof -ti:3999 | xargs kill -9`

### Tests Hanging

If tests don't complete:

1. Check for open database connections
2. Verify `forceExit: true` in jest.config.js
3. Use `--detectOpenHandles` flag: `npm test -- --detectOpenHandles`

## CI/CD Integration

To run tests in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm test -- --ci --coverage --maxWorkers=2
  env:
    MONGODB_TEST_URI: mongodb://localhost:27017/test
```

## Contributing

When adding new tests:

1. Follow existing test structure and naming conventions
2. Use descriptive test names that explain what is being tested
3. Include both positive and negative test cases
4. Update this README with new test categories
5. Ensure all tests pass before submitting PR
6. Maintain or improve coverage thresholds

## Best Practices

1. **Isolation**: Each test should be independent and not rely on others
2. **Cleanup**: Always clean up test data in `afterEach` or `afterAll`
3. **Mocking**: Mock external dependencies to ensure fast, reliable tests
4. **Assertions**: Use specific assertions (e.g., `toBe` instead of `toBeTruthy`)
5. **Documentation**: Add comments for complex test scenarios
