// Mock Circuit Breaker (Opossum)
// This mock is used to prevent actual circuit breaker behavior during tests

class MockCircuitBreaker {
  constructor(asyncFunction, options = {}) {
    this.asyncFunction = asyncFunction;
    this.options = options;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.stats = {
      fires: 0,
      successes: 0,
      failures: 0,
      fallbacks: 0,
      timeouts: 0,
      cacheHits: 0,
      cacheMisses: 0,
      semaphoreRejections: 0,
      percentiles: {},
      latencyTimes: []
    };
  }

  fire(...args) {
    this.stats.fires++;

    // Simply pass through to the async function
    return Promise.resolve(this.asyncFunction(...args))
      .then(result => {
        this.stats.successes++;
        return result;
      })
      .catch(error => {
        this.stats.failures++;
        throw error;
      });
  }

  open() {
    this.state = 'OPEN';
  }

  close() {
    this.state = 'CLOSED';
  }

  halfOpen() {
    this.state = 'HALF_OPEN';
  }

  shutdown() {
    // Cleanup
  }

  on(event, handler) {
    // Mock event listeners
    return this;
  }

  off(event, handler) {
    return this;
  }

  removeAllListeners() {
    return this;
  }

  clearCache() {
    this.stats.cacheHits = 0;
    this.stats.cacheMisses = 0;
  }

  get isOurError() {
    return (error) => error && error.code === 'ENOTFOUND';
  }
}

module.exports = MockCircuitBreaker;
