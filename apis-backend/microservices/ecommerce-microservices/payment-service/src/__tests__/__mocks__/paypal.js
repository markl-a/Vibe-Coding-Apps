// Mock PayPal payment provider

class MockPayPal {
  constructor(config) {
    this.config = config;
    this.mode = config.mode || 'sandbox';
  }

  async createPayment(paymentData) {
    // Simulate PayPal payment creation
    return {
      id: `PAY-${Math.random().toString(36).substring(7).toUpperCase()}`,
      intent: paymentData.intent || 'sale',
      state: 'created',
      payer: {
        payment_method: 'paypal'
      },
      transactions: paymentData.transactions,
      create_time: new Date().toISOString(),
      links: [
        {
          href: `https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=EC-MOCK`,
          rel: 'approval_url',
          method: 'REDIRECT'
        },
        {
          href: `https://api.sandbox.paypal.com/v1/payments/payment/PAY-MOCK`,
          rel: 'self',
          method: 'GET'
        }
      ]
    };
  }

  async executePayment(paymentId, payerId) {
    // Simulate successful payment execution
    return {
      id: paymentId,
      intent: 'sale',
      state: 'approved',
      payer: {
        payment_method: 'paypal',
        payer_info: {
          email: 'test@example.com',
          payer_id: payerId
        }
      },
      transactions: [
        {
          amount: {
            total: '100.00',
            currency: 'USD'
          },
          related_resources: [
            {
              sale: {
                id: `SALE-${Math.random().toString(36).substring(7).toUpperCase()}`,
                state: 'completed',
                amount: {
                  total: '100.00',
                  currency: 'USD'
                }
              }
            }
          ]
        }
      ],
      create_time: new Date().toISOString(),
      update_time: new Date().toISOString()
    };
  }

  async capturePayment(authorizationId, captureData) {
    return {
      id: `CAPTURE-${Math.random().toString(36).substring(7).toUpperCase()}`,
      amount: captureData.amount,
      state: 'completed',
      parent_payment: authorizationId,
      create_time: new Date().toISOString()
    };
  }

  async refundSale(saleId, refundData) {
    // Simulate PayPal refund
    return {
      id: `REFUND-${Math.random().toString(36).substring(7).toUpperCase()}`,
      state: 'completed',
      amount: refundData.amount,
      sale_id: saleId,
      parent_payment: `PAY-${Math.random().toString(36).substring(7).toUpperCase()}`,
      create_time: new Date().toISOString(),
      update_time: new Date().toISOString()
    };
  }

  async getPayment(paymentId) {
    return {
      id: paymentId,
      intent: 'sale',
      state: 'approved',
      payer: {
        payment_method: 'paypal'
      },
      transactions: [
        {
          amount: {
            total: '100.00',
            currency: 'USD'
          }
        }
      ]
    };
  }
}

module.exports = MockPayPal;
