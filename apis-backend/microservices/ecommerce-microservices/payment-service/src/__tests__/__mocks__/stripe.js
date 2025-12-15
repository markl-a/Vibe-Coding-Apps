// Mock Stripe payment provider

class MockStripe {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.charges = new MockCharges();
    this.refunds = new MockRefunds();
    this.customers = new MockCustomers();
  }
}

class MockCharges {
  async create(chargeData) {
    // Simulate successful charge
    if (chargeData.amount > 0 && chargeData.source) {
      return {
        id: `ch_${Math.random().toString(36).substring(7)}`,
        object: 'charge',
        amount: chargeData.amount,
        currency: chargeData.currency || 'usd',
        status: 'succeeded',
        paid: true,
        source: {
          id: chargeData.source,
          last4: '4242',
          brand: 'Visa'
        },
        created: Math.floor(Date.now() / 1000)
      };
    }

    // Simulate failure
    throw new Error('Card declined');
  }

  async retrieve(chargeId) {
    return {
      id: chargeId,
      object: 'charge',
      amount: 1000,
      currency: 'usd',
      status: 'succeeded',
      paid: true
    };
  }
}

class MockRefunds {
  async create({ charge }) {
    return {
      id: `re_${Math.random().toString(36).substring(7)}`,
      object: 'refund',
      charge,
      amount: 1000,
      currency: 'usd',
      status: 'succeeded',
      created: Math.floor(Date.now() / 1000)
    };
  }
}

class MockCustomers {
  async create(customerData) {
    return {
      id: `cus_${Math.random().toString(36).substring(7)}`,
      object: 'customer',
      email: customerData.email,
      created: Math.floor(Date.now() / 1000)
    };
  }

  async retrieve(customerId) {
    return {
      id: customerId,
      object: 'customer',
      email: 'test@example.com'
    };
  }
}

module.exports = MockStripe;
