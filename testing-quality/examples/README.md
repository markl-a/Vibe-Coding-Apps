# Testing & Quality Assurance Examples

This directory contains comprehensive examples demonstrating testing best practices with Vitest/Jest.

## Files Overview

### 1. unit-testing-patterns.ts
**Size:** 17KB | **Patterns:** 8

Demonstrates unit testing patterns including:
- Basic unit tests for pure functions
- Parameterized tests with data sets
- Testing classes with state
- Async function testing
- Timer mocking
- Snapshot testing
- Error handling and edge cases
- Custom matchers

**Key Examples:**
- Calculator class testing
- Shopping cart state management
- User service async operations
- Rate limiter with timers

---

### 2. integration-testing.ts
**Size:** 22KB | **Patterns:** 4

Demonstrates integration testing patterns including:
- API integration tests
- Database integration tests
- Service layer integration
- Event-driven architecture testing

**Key Examples:**
- Authentication service with API calls
- User repository with database operations
- Blog service with user/post relationships
- Event bus with notification service

---

### 3. e2e-testing.ts
**Size:** 21KB | **Patterns:** 6

Demonstrates end-to-end testing patterns including:
- User authentication flows
- E-commerce shopping workflows
- Form submission testing
- Search and filtering
- Multi-step wizards
- Accessibility testing

**Key Examples:**
- Login/logout flows
- Shopping cart checkout process
- Contact form validation
- Product search with filters
- Registration wizard
- Keyboard navigation

---

### 4. performance-testing.ts
**Size:** 20KB | **Patterns:** 6

Demonstrates performance testing patterns including:
- Response time measurement
- Load testing with concurrent operations
- Stress testing and breaking points
- Memory usage tracking
- Database query optimization
- Algorithm performance comparison

**Key Examples:**
- Data processor performance benchmarks
- API service load testing
- Resource pool stress testing
- Cache memory profiling
- Query optimizer comparisons
- Sorting algorithm benchmarks

---

### 5. mocking-patterns.ts
**Size:** 20KB | **Patterns:** 10

Demonstrates mocking and stubbing patterns including:
- Basic function mocks
- Method spying
- Class mocking
- Partial mocking
- External dependency mocking
- Mock implementations
- Timer mocks
- Module mocks
- Mock reset/restore
- Advanced mock patterns

**Key Examples:**
- Calculator method spying
- User service class mocking
- Email service partial mocks
- HTTP client mocking
- Database mock implementations
- Debounced function testing

---

### 6. test-data-generation.ts
**Size:** 22KB | **Patterns:** 7

Demonstrates test data generation patterns including:
- Factory functions
- Builder pattern
- Random data generation
- Fixtures (predefined data sets)
- Data seeding
- Composite data generation
- Snapshot data generation

**Key Examples:**
- User factory with overrides
- Product builder with fluent API
- Random data generators (email, phone, address)
- Predefined fixtures for common scenarios
- Database seeding with realistic data
- Order generation from users and products

---

## Usage

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test unit-testing-patterns

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Using in Your Tests

```typescript
// Import patterns
import { describe, it, expect, vi } from 'vitest';

// Use factory pattern
const user = UserFactory.create({ name: 'Test User' });

// Use builder pattern
const product = new ProductBuilder()
  .withName('Laptop')
  .withPrice(999.99)
  .build();

// Use random data
const email = DataGenerator.randomEmail();
```

## Best Practices

1. **Unit Tests**
   - Test one thing at a time
   - Use descriptive test names
   - Follow AAA pattern (Arrange, Act, Assert)
   - Keep tests independent

2. **Integration Tests**
   - Test component interactions
   - Use real implementations where possible
   - Clean up resources after tests
   - Mock external services

3. **E2E Tests**
   - Test complete user workflows
   - Use semantic selectors (getByRole, getByLabel)
   - Test critical paths
   - Keep tests stable and reliable

4. **Performance Tests**
   - Set realistic thresholds
   - Measure consistently
   - Track trends over time
   - Test under various loads

5. **Mocking**
   - Mock external dependencies
   - Keep mocks simple
   - Verify interactions
   - Reset mocks between tests

6. **Test Data**
   - Use factories for flexibility
   - Use fixtures for consistency
   - Generate realistic data
   - Keep data minimal but sufficient

## Testing Pyramid

```
       /\
      /  \     E2E Tests (Few)
     /____\
    /      \   Integration Tests (Some)
   /________\
  /          \ Unit Tests (Many)
 /____________\
```

Focus on:
- **70%** Unit tests - Fast, isolated, comprehensive
- **20%** Integration tests - Component interactions
- **10%** E2E tests - Critical user paths

## Code Coverage Goals

- **Statements:** > 80%
- **Branches:** > 75%
- **Functions:** > 80%
- **Lines:** > 80%

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)

## Contributing

When adding new examples:
1. Follow existing patterns
2. Include comprehensive comments
3. Demonstrate best practices
4. Add realistic use cases
5. Update this README
