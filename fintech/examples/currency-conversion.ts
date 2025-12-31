/**
 * Currency Conversion Examples
 *
 * This file demonstrates currency conversion patterns:
 * - Fetching real-time exchange rates
 * - Converting between currencies
 * - Handling multiple currency pairs
 * - Historical exchange rate data
 * - Rate caching and updates
 * - Precision handling for financial calculations
 */

// ============================================================================
// TYPES
// ============================================================================

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'AUD' | 'CAD' | 'CHF' | 'INR' | 'SGD';

export interface ExchangeRate {
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number;
  timestamp: Date;
  source: string;
}

export interface ConversionResult {
  fromAmount: number;
  fromCurrency: CurrencyCode;
  toAmount: number;
  toCurrency: CurrencyCode;
  rate: number;
  timestamp: Date;
  fees?: number;
  totalAmount?: number;
}

export interface HistoricalRate {
  date: Date;
  rate: number;
  high?: number;
  low?: number;
  close?: number;
}

export interface CurrencyPair {
  base: CurrencyCode;
  quote: CurrencyCode;
}

export interface RateProvider {
  name: string;
  getRate(from: CurrencyCode, to: CurrencyCode): Promise<number>;
  getHistoricalRates(
    from: CurrencyCode,
    to: CurrencyCode,
    startDate: Date,
    endDate: Date
  ): Promise<HistoricalRate[]>;
}

// ============================================================================
// MOCK EXCHANGE RATE PROVIDER
// ============================================================================

/**
 * Mock exchange rate provider for demonstration
 * In production, use a real API like:
 * - https://exchangerate-api.com
 * - https://openexchangerates.org
 * - https://currencyapi.com
 */
export class MockExchangeRateProvider implements RateProvider {
  name = 'MockProvider';

  // Base rates relative to USD
  private baseRates: Record<CurrencyCode, number> = {
    USD: 1.0,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 149.50,
    CNY: 7.24,
    AUD: 1.52,
    CAD: 1.36,
    CHF: 0.88,
    INR: 83.12,
    SGD: 1.34,
  };

  /**
   * Get current exchange rate
   */
  async getRate(from: CurrencyCode, to: CurrencyCode): Promise<number> {
    try {
      // Simulate API delay
      await this.delay(100);

      if (from === to) {
        return 1.0;
      }

      // Convert through USD as base currency
      const fromRate = this.baseRates[from];
      const toRate = this.baseRates[to];

      if (!fromRate || !toRate) {
        throw new Error(`Unsupported currency: ${from} or ${to}`);
      }

      // Add small random fluctuation for realism
      const rate = (toRate / fromRate) * (1 + (Math.random() - 0.5) * 0.001);

      return this.roundToSignificantDigits(rate, 6);
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      throw new Error(`Failed to get rate for ${from}/${to}`);
    }
  }

  /**
   * Get historical exchange rates
   */
  async getHistoricalRates(
    from: CurrencyCode,
    to: CurrencyCode,
    startDate: Date,
    endDate: Date
  ): Promise<HistoricalRate[]> {
    try {
      await this.delay(200);

      const currentRate = await this.getRate(from, to);
      const rates: HistoricalRate[] = [];

      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        // Generate mock historical data with slight variations
        const variance = (Math.random() - 0.5) * 0.02;
        const rate = currentRate * (1 + variance);
        const dayVariance = Math.abs(variance) * currentRate;

        rates.push({
          date: new Date(currentDate),
          rate: this.roundToSignificantDigits(rate, 6),
          high: this.roundToSignificantDigits(rate + dayVariance, 6),
          low: this.roundToSignificantDigits(rate - dayVariance, 6),
          close: this.roundToSignificantDigits(rate, 6),
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return rates;
    } catch (error) {
      console.error('Error fetching historical rates:', error);
      throw new Error(`Failed to get historical rates for ${from}/${to}`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private roundToSignificantDigits(num: number, digits: number): number {
    return Number(num.toPrecision(digits));
  }
}

// ============================================================================
// CURRENCY CONVERTER
// ============================================================================

/**
 * Currency conversion service with caching
 */
export class CurrencyConverter {
  private rateCache: Map<string, { rate: number; timestamp: Date }> = new Map();
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  constructor(private provider: RateProvider) {}

  /**
   * Convert amount from one currency to another
   */
  async convert(
    amount: number,
    from: CurrencyCode,
    to: CurrencyCode,
    includeFees: boolean = false
  ): Promise<ConversionResult> {
    try {
      if (amount < 0) {
        throw new Error('Amount must be positive');
      }

      if (from === to) {
        return {
          fromAmount: amount,
          fromCurrency: from,
          toAmount: amount,
          toCurrency: to,
          rate: 1.0,
          timestamp: new Date(),
        };
      }

      const rate = await this.getRate(from, to);
      const convertedAmount = this.calculateConversion(amount, rate);

      const result: ConversionResult = {
        fromAmount: amount,
        fromCurrency: from,
        toAmount: convertedAmount,
        toCurrency: to,
        rate,
        timestamp: new Date(),
      };

      if (includeFees) {
        // Example fee structure: 0.5% of converted amount
        const fee = this.calculateFee(convertedAmount, 0.005);
        result.fees = fee;
        result.totalAmount = convertedAmount - fee;
      }

      return result;
    } catch (error) {
      console.error('Error converting currency:', error);
      throw new Error(`Failed to convert ${from} to ${to}`);
    }
  }

  /**
   * Get exchange rate with caching
   */
  async getRate(from: CurrencyCode, to: CurrencyCode): Promise<number> {
    const cacheKey = `${from}/${to}`;
    const cached = this.rateCache.get(cacheKey);

    // Check if cached rate is still valid
    if (cached && Date.now() - cached.timestamp.getTime() < this.cacheDuration) {
      console.log(`Using cached rate for ${cacheKey}: ${cached.rate}`);
      return cached.rate;
    }

    // Fetch fresh rate
    console.log(`Fetching fresh rate for ${cacheKey}...`);
    const rate = await this.provider.getRate(from, to);

    // Update cache
    this.rateCache.set(cacheKey, {
      rate,
      timestamp: new Date(),
    });

    return rate;
  }

  /**
   * Get multiple exchange rates at once
   */
  async getRates(pairs: CurrencyPair[]): Promise<ExchangeRate[]> {
    const rates = await Promise.all(
      pairs.map(async (pair) => {
        const rate = await this.getRate(pair.base, pair.quote);
        return {
          from: pair.base,
          to: pair.quote,
          rate,
          timestamp: new Date(),
          source: this.provider.name,
        };
      })
    );

    return rates;
  }

  /**
   * Get historical exchange rates
   */
  async getHistoricalRates(
    from: CurrencyCode,
    to: CurrencyCode,
    days: number = 30
  ): Promise<HistoricalRate[]> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      console.log(
        `Fetching ${days} days of historical rates for ${from}/${to}...`
      );

      const rates = await this.provider.getHistoricalRates(
        from,
        to,
        startDate,
        endDate
      );

      return rates;
    } catch (error) {
      console.error('Error fetching historical rates:', error);
      throw new Error(`Failed to get historical rates for ${from}/${to}`);
    }
  }

  /**
   * Convert multiple amounts at once
   */
  async convertBatch(
    amounts: Array<{ amount: number; from: CurrencyCode; to: CurrencyCode }>
  ): Promise<ConversionResult[]> {
    const results = await Promise.all(
      amounts.map((item) => this.convert(item.amount, item.from, item.to))
    );

    return results;
  }

  /**
   * Calculate conversion with proper rounding
   */
  private calculateConversion(amount: number, rate: number): number {
    // Use precise calculation
    const result = amount * rate;

    // Round to 2 decimal places for most currencies
    // For currencies like JPY (no decimal), this should be adjusted
    return Math.round(result * 100) / 100;
  }

  /**
   * Calculate conversion fee
   */
  private calculateFee(amount: number, feeRate: number): number {
    return Math.round(amount * feeRate * 100) / 100;
  }

  /**
   * Clear rate cache
   */
  clearCache(): void {
    this.rateCache.clear();
    console.log('Rate cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.rateCache.size,
      keys: Array.from(this.rateCache.keys()),
    };
  }
}

// ============================================================================
// CURRENCY FORMATTING
// ============================================================================

/**
 * Format amount with currency symbol
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: CurrencyCode): string {
  const symbols: Record<CurrencyCode, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CNY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF',
    INR: '₹',
    SGD: 'S$',
  };

  return symbols[currency] || currency;
}

/**
 * Get currency decimal places
 */
export function getCurrencyDecimals(currency: CurrencyCode): number {
  // Most currencies use 2 decimal places
  // JPY, KRW, and some others use 0
  const noDecimalCurrencies: CurrencyCode[] = ['JPY'];

  return noDecimalCurrencies.includes(currency) ? 0 : 2;
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example: Basic currency conversion
 */
export async function exampleBasicConversion(): Promise<void> {
  console.log('Example: Basic currency conversion\n');

  const provider = new MockExchangeRateProvider();
  const converter = new CurrencyConverter(provider);

  try {
    const result = await converter.convert(100, 'USD', 'EUR');

    console.log('Conversion Result:');
    console.log(`  From: ${formatCurrency(result.fromAmount, result.fromCurrency)}`);
    console.log(`  To: ${formatCurrency(result.toAmount, result.toCurrency)}`);
    console.log(`  Rate: ${result.rate}`);
    console.log(`  Timestamp: ${result.timestamp.toISOString()}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example: Conversion with fees
 */
export async function exampleConversionWithFees(): Promise<void> {
  console.log('\nExample: Currency conversion with fees\n');

  const provider = new MockExchangeRateProvider();
  const converter = new CurrencyConverter(provider);

  try {
    const result = await converter.convert(1000, 'USD', 'GBP', true);

    console.log('Conversion with Fees:');
    console.log(`  From: ${formatCurrency(result.fromAmount, result.fromCurrency)}`);
    console.log(`  Converted: ${formatCurrency(result.toAmount, result.toCurrency)}`);
    console.log(`  Fee: ${formatCurrency(result.fees || 0, result.toCurrency)}`);
    console.log(`  Total: ${formatCurrency(result.totalAmount || 0, result.toCurrency)}`);
    console.log(`  Rate: ${result.rate}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example: Get multiple exchange rates
 */
export async function exampleMultipleRates(): Promise<void> {
  console.log('\nExample: Fetching multiple exchange rates\n');

  const provider = new MockExchangeRateProvider();
  const converter = new CurrencyConverter(provider);

  try {
    const pairs: CurrencyPair[] = [
      { base: 'USD', quote: 'EUR' },
      { base: 'USD', quote: 'GBP' },
      { base: 'USD', quote: 'JPY' },
      { base: 'EUR', quote: 'GBP' },
    ];

    const rates = await converter.getRates(pairs);

    console.log('Exchange Rates:');
    rates.forEach((rate) => {
      console.log(`  ${rate.from}/${rate.to}: ${rate.rate.toFixed(6)}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example: Historical exchange rates
 */
export async function exampleHistoricalRates(): Promise<void> {
  console.log('\nExample: Historical exchange rates\n');

  const provider = new MockExchangeRateProvider();
  const converter = new CurrencyConverter(provider);

  try {
    const rates = await converter.getHistoricalRates('USD', 'EUR', 7);

    console.log('Historical Rates (Last 7 Days):');
    rates.forEach((rate) => {
      console.log(
        `  ${rate.date.toISOString().split('T')[0]}: ${rate.rate.toFixed(6)} ` +
        `(H: ${rate.high?.toFixed(6)}, L: ${rate.low?.toFixed(6)})`
      );
    });

    // Calculate average rate
    const avgRate = rates.reduce((sum, r) => sum + r.rate, 0) / rates.length;
    console.log(`\n  Average Rate: ${avgRate.toFixed(6)}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example: Batch conversion
 */
export async function exampleBatchConversion(): Promise<void> {
  console.log('\nExample: Batch currency conversion\n');

  const provider = new MockExchangeRateProvider();
  const converter = new CurrencyConverter(provider);

  try {
    const conversions = [
      { amount: 100, from: 'USD' as CurrencyCode, to: 'EUR' as CurrencyCode },
      { amount: 200, from: 'USD' as CurrencyCode, to: 'GBP' as CurrencyCode },
      { amount: 300, from: 'EUR' as CurrencyCode, to: 'JPY' as CurrencyCode },
    ];

    const results = await converter.convertBatch(conversions);

    console.log('Batch Conversion Results:');
    results.forEach((result) => {
      console.log(
        `  ${formatCurrency(result.fromAmount, result.fromCurrency)} = ` +
        `${formatCurrency(result.toAmount, result.toCurrency)} ` +
        `(rate: ${result.rate.toFixed(6)})`
      );
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example: Rate caching
 */
export async function exampleRateCaching(): Promise<void> {
  console.log('\nExample: Exchange rate caching\n');

  const provider = new MockExchangeRateProvider();
  const converter = new CurrencyConverter(provider);

  try {
    console.log('First request (will fetch from provider):');
    await converter.convert(100, 'USD', 'EUR');

    console.log('\nSecond request (will use cache):');
    await converter.convert(200, 'USD', 'EUR');

    const stats = converter.getCacheStats();
    console.log(`\nCache Statistics:`);
    console.log(`  Cached pairs: ${stats.size}`);
    console.log(`  Keys: ${stats.keys.join(', ')}`);

    console.log('\nClearing cache...');
    converter.clearCache();

    console.log('\nThird request (will fetch again after cache clear):');
    await converter.convert(300, 'USD', 'EUR');
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example: Currency formatting
 */
export async function exampleCurrencyFormatting(): Promise<void> {
  console.log('\nExample: Currency formatting\n');

  const amounts = [
    { amount: 1234.56, currency: 'USD' as CurrencyCode },
    { amount: 9876.54, currency: 'EUR' as CurrencyCode },
    { amount: 5432.1, currency: 'GBP' as CurrencyCode },
    { amount: 123456, currency: 'JPY' as CurrencyCode },
  ];

  console.log('Formatted Currencies:');
  amounts.forEach(({ amount, currency }) => {
    const formatted = formatCurrency(amount, currency);
    const symbol = getCurrencySymbol(currency);
    const decimals = getCurrencyDecimals(currency);

    console.log(
      `  ${currency}: ${formatted} (symbol: ${symbol}, decimals: ${decimals})`
    );
  });
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  await exampleBasicConversion();
  await exampleConversionWithFees();
  await exampleMultipleRates();
  await exampleHistoricalRates();
  await exampleBatchConversion();
  await exampleRateCaching();
  await exampleCurrencyFormatting();
}

// Uncomment to run examples
// runAllExamples().catch(console.error);
