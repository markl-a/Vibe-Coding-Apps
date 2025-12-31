/**
 * Portfolio Tracking Examples
 *
 * This file demonstrates investment portfolio management patterns:
 * - Track investment holdings and positions
 * - Calculate returns and performance metrics
 * - Asset allocation analysis
 * - Portfolio rebalancing
 * - Risk-adjusted returns (Sharpe ratio, etc.)
 * - Dividend and income tracking
 * - Tax lot management
 */

// ============================================================================
// TYPES
// ============================================================================

export type AssetClass = 'stocks' | 'bonds' | 'crypto' | 'commodities' | 'real_estate' | 'cash';

export interface Position {
  symbol: string;
  assetClass: AssetClass;
  quantity: number;
  averageCost: number; // Cost per unit
  currentPrice: number;
  currency: string;
  acquisitionDate: Date;
  lastUpdated: Date;
}

export interface PortfolioHolding {
  position: Position;
  marketValue: number;
  costBasis: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  portfolioWeight: number; // Percentage of total portfolio
}

export interface Portfolio {
  id: string;
  name: string;
  holdings: PortfolioHolding[];
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  assetAllocation: Record<AssetClass, number>;
  currency: string;
  lastUpdated: Date;
}

export interface PerformanceMetrics {
  totalReturn: number;
  totalReturnPercent: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  bestDay: number;
  worstDay: number;
}

export interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'dividend' | 'interest' | 'fee';
  symbol: string;
  quantity: number;
  price: number;
  amount: number;
  date: Date;
  fees?: number;
  notes?: string;
}

export interface DividendIncome {
  symbol: string;
  amount: number;
  exDate: Date;
  paymentDate: Date;
  type: 'qualified' | 'ordinary';
}

export interface RebalanceRecommendation {
  symbol: string;
  currentWeight: number;
  targetWeight: number;
  action: 'buy' | 'sell' | 'hold';
  quantity: number;
  estimatedValue: number;
}

// ============================================================================
// PORTFOLIO TRACKER
// ============================================================================

/**
 * Portfolio tracking and management service
 */
export class PortfolioTracker {
  private positions: Map<string, Position> = new Map();
  private transactions: Transaction[] = [];

  /**
   * Add a position to the portfolio
   */
  addPosition(position: Position): void {
    this.positions.set(position.symbol, position);
    console.log(`Added position: ${position.symbol} (${position.quantity} units @ ${position.currentPrice})`);
  }

  /**
   * Update position price
   */
  updatePrice(symbol: string, newPrice: number): void {
    const position = this.positions.get(symbol);
    if (!position) {
      throw new Error(`Position ${symbol} not found`);
    }

    position.currentPrice = newPrice;
    position.lastUpdated = new Date();
    console.log(`Updated ${symbol} price to ${newPrice}`);
  }

  /**
   * Get portfolio snapshot
   */
  getPortfolio(portfolioId: string = 'default', portfolioName: string = 'My Portfolio'): Portfolio {
    try {
      const holdings: PortfolioHolding[] = [];
      let totalValue = 0;
      let totalCost = 0;

      // Calculate holdings
      for (const position of this.positions.values()) {
        const marketValue = position.quantity * position.currentPrice;
        const costBasis = position.quantity * position.averageCost;
        const unrealizedGain = marketValue - costBasis;
        const unrealizedGainPercent = (unrealizedGain / costBasis) * 100;

        holdings.push({
          position,
          marketValue,
          costBasis,
          unrealizedGain,
          unrealizedGainPercent,
          portfolioWeight: 0, // Will be calculated after totals
        });

        totalValue += marketValue;
        totalCost += costBasis;
      }

      // Calculate portfolio weights
      holdings.forEach((holding) => {
        holding.portfolioWeight = (holding.marketValue / totalValue) * 100;
      });

      // Calculate asset allocation
      const assetAllocation = this.calculateAssetAllocation(holdings, totalValue);

      const totalGain = totalValue - totalCost;
      const totalGainPercent = (totalGain / totalCost) * 100;

      return {
        id: portfolioId,
        name: portfolioName,
        holdings,
        totalValue,
        totalCost,
        totalGain,
        totalGainPercent,
        assetAllocation,
        currency: 'USD',
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Error getting portfolio:', error);
      throw new Error('Failed to get portfolio');
    }
  }

  /**
   * Calculate asset allocation
   */
  private calculateAssetAllocation(
    holdings: PortfolioHolding[],
    totalValue: number
  ): Record<AssetClass, number> {
    const allocation: Record<AssetClass, number> = {
      stocks: 0,
      bonds: 0,
      crypto: 0,
      commodities: 0,
      real_estate: 0,
      cash: 0,
    };

    holdings.forEach((holding) => {
      const weight = (holding.marketValue / totalValue) * 100;
      allocation[holding.position.assetClass] += weight;
    });

    return allocation;
  }

  /**
   * Record a transaction
   */
  recordTransaction(transaction: Transaction): void {
    this.transactions.push(transaction);

    // Update position if buy/sell
    if (transaction.type === 'buy') {
      this.processBuy(transaction);
    } else if (transaction.type === 'sell') {
      this.processSell(transaction);
    }

    console.log(`Recorded ${transaction.type} transaction for ${transaction.symbol}`);
  }

  /**
   * Process buy transaction
   */
  private processBuy(transaction: Transaction): void {
    const existing = this.positions.get(transaction.symbol);

    if (existing) {
      // Update average cost
      const totalCost = existing.quantity * existing.averageCost +
        transaction.quantity * transaction.price;
      const totalQuantity = existing.quantity + transaction.quantity;

      existing.averageCost = totalCost / totalQuantity;
      existing.quantity = totalQuantity;
      existing.lastUpdated = transaction.date;
    } else {
      // Create new position
      this.positions.set(transaction.symbol, {
        symbol: transaction.symbol,
        assetClass: this.inferAssetClass(transaction.symbol),
        quantity: transaction.quantity,
        averageCost: transaction.price,
        currentPrice: transaction.price,
        currency: 'USD',
        acquisitionDate: transaction.date,
        lastUpdated: transaction.date,
      });
    }
  }

  /**
   * Process sell transaction
   */
  private processSell(transaction: Transaction): void {
    const existing = this.positions.get(transaction.symbol);

    if (!existing) {
      throw new Error(`Cannot sell ${transaction.symbol}: position not found`);
    }

    if (existing.quantity < transaction.quantity) {
      throw new Error(
        `Cannot sell ${transaction.quantity} of ${transaction.symbol}: only ${existing.quantity} available`
      );
    }

    existing.quantity -= transaction.quantity;
    existing.lastUpdated = transaction.date;

    // Remove position if fully sold
    if (existing.quantity === 0) {
      this.positions.delete(transaction.symbol);
    }
  }

  /**
   * Infer asset class from symbol (simplified)
   */
  private inferAssetClass(symbol: string): AssetClass {
    if (symbol.endsWith('-USD') || symbol.includes('BTC') || symbol.includes('ETH')) {
      return 'crypto';
    }
    if (symbol.includes('BOND') || symbol.includes('TLT')) {
      return 'bonds';
    }
    if (symbol.includes('GLD') || symbol.includes('SLV')) {
      return 'commodities';
    }
    return 'stocks';
  }

  /**
   * Get transaction history
   */
  getTransactions(symbol?: string): Transaction[] {
    if (symbol) {
      return this.transactions.filter((t) => t.symbol === symbol);
    }
    return [...this.transactions];
  }
}

// ============================================================================
// PERFORMANCE CALCULATOR
// ============================================================================

/**
 * Calculate portfolio performance metrics
 */
export class PerformanceCalculator {
  /**
   * Calculate performance metrics from daily returns
   */
  calculateMetrics(
    dailyReturns: number[],
    riskFreeRate: number = 0.02
  ): PerformanceMetrics {
    try {
      if (dailyReturns.length === 0) {
        throw new Error('No returns data provided');
      }

      // Total return
      const totalReturn = dailyReturns.reduce((acc, r) => acc * (1 + r), 1) - 1;
      const totalReturnPercent = totalReturn * 100;

      // Annualized return
      const daysPerYear = 252; // Trading days
      const years = dailyReturns.length / daysPerYear;
      const annualizedReturn =
        Math.pow(1 + totalReturn, 1 / years) - 1;

      // Volatility (standard deviation)
      const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
      const variance =
        dailyReturns.reduce((acc, r) => acc + Math.pow(r - meanReturn, 2), 0) /
        dailyReturns.length;
      const volatility = Math.sqrt(variance) * Math.sqrt(daysPerYear);

      // Sharpe ratio
      const excessReturn = annualizedReturn - riskFreeRate;
      const sharpeRatio = volatility > 0 ? excessReturn / volatility : 0;

      // Max drawdown
      const maxDrawdown = this.calculateMaxDrawdown(dailyReturns);

      // Win rate
      const wins = dailyReturns.filter((r) => r > 0).length;
      const winRate = (wins / dailyReturns.length) * 100;

      // Best and worst days
      const bestDay = Math.max(...dailyReturns) * 100;
      const worstDay = Math.min(...dailyReturns) * 100;

      return {
        totalReturn,
        totalReturnPercent,
        annualizedReturn,
        volatility,
        sharpeRatio,
        maxDrawdown,
        winRate,
        bestDay,
        worstDay,
      };
    } catch (error) {
      console.error('Error calculating performance metrics:', error);
      throw new Error('Failed to calculate performance metrics');
    }
  }

  /**
   * Calculate maximum drawdown
   */
  private calculateMaxDrawdown(returns: number[]): number {
    let maxDrawdown = 0;
    let peak = 1;
    let value = 1;

    for (const ret of returns) {
      value *= 1 + ret;
      if (value > peak) {
        peak = value;
      }
      const drawdown = (peak - value) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown * 100;
  }

  /**
   * Calculate returns from price history
   */
  calculateReturns(prices: number[]): number[] {
    const returns: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      const ret = (prices[i] - prices[i - 1]) / prices[i - 1];
      returns.push(ret);
    }

    return returns;
  }
}

// ============================================================================
// PORTFOLIO REBALANCER
// ============================================================================

/**
 * Portfolio rebalancing service
 */
export class PortfolioRebalancer {
  /**
   * Generate rebalancing recommendations
   */
  getRebalanceRecommendations(
    portfolio: Portfolio,
    targetAllocation: Record<AssetClass, number>
  ): RebalanceRecommendation[] {
    try {
      console.log('Generating rebalancing recommendations...\n');

      const recommendations: RebalanceRecommendation[] = [];
      const totalValue = portfolio.totalValue;

      // Group holdings by asset class
      const holdingsByClass: Record<AssetClass, PortfolioHolding[]> = {
        stocks: [],
        bonds: [],
        crypto: [],
        commodities: [],
        real_estate: [],
        cash: [],
      };

      portfolio.holdings.forEach((holding) => {
        holdingsByClass[holding.position.assetClass].push(holding);
      });

      // Calculate rebalancing for each asset class
      for (const [assetClass, targetWeight] of Object.entries(targetAllocation)) {
        const currentWeight = portfolio.assetAllocation[assetClass as AssetClass];
        const holdings = holdingsByClass[assetClass as AssetClass];

        if (holdings.length === 0) {
          // Need to buy into this asset class
          if (targetWeight > 0) {
            console.log(`No holdings in ${assetClass}, target is ${targetWeight.toFixed(2)}%`);
          }
          continue;
        }

        const weightDiff = targetWeight - currentWeight;
        const threshold = 5; // Rebalance if more than 5% off target

        if (Math.abs(weightDiff) > threshold) {
          // Distribute adjustment across holdings in this class
          const adjustment = (weightDiff / 100) * totalValue;

          holdings.forEach((holding) => {
            const holdingAdjustment =
              adjustment * (holding.marketValue / (currentWeight / 100 * totalValue));
            const action = holdingAdjustment > 0 ? 'buy' : 'sell';
            const quantity = Math.abs(
              Math.round(holdingAdjustment / holding.position.currentPrice)
            );

            if (quantity > 0) {
              recommendations.push({
                symbol: holding.position.symbol,
                currentWeight,
                targetWeight,
                action,
                quantity,
                estimatedValue: Math.abs(holdingAdjustment),
              });
            }
          });
        }
      }

      return recommendations;
    } catch (error) {
      console.error('Error generating rebalance recommendations:', error);
      throw new Error('Failed to generate rebalance recommendations');
    }
  }
}

// ============================================================================
// DIVIDEND TRACKER
// ============================================================================

/**
 * Track dividend income
 */
export class DividendTracker {
  private dividends: DividendIncome[] = [];

  /**
   * Record dividend payment
   */
  recordDividend(dividend: DividendIncome): void {
    this.dividends.push(dividend);
    console.log(`Recorded dividend: ${dividend.symbol} - $${dividend.amount.toFixed(2)}`);
  }

  /**
   * Get total dividend income
   */
  getTotalIncome(startDate?: Date, endDate?: Date): number {
    let filtered = this.dividends;

    if (startDate) {
      filtered = filtered.filter((d) => d.paymentDate >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((d) => d.paymentDate <= endDate);
    }

    return filtered.reduce((sum, d) => sum + d.amount, 0);
  }

  /**
   * Get income by symbol
   */
  getIncomeBySymbol(symbol: string): number {
    return this.dividends
      .filter((d) => d.symbol === symbol)
      .reduce((sum, d) => sum + d.amount, 0);
  }

  /**
   * Get dividend history
   */
  getDividendHistory(symbol?: string): DividendIncome[] {
    if (symbol) {
      return this.dividends.filter((d) => d.symbol === symbol);
    }
    return [...this.dividends];
  }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example: Track portfolio holdings
 */
export async function exampleTrackHoldings(): Promise<void> {
  console.log('Example: Portfolio Holdings Tracking\n');

  const tracker = new PortfolioTracker();

  // Add positions
  tracker.addPosition({
    symbol: 'AAPL',
    assetClass: 'stocks',
    quantity: 100,
    averageCost: 150,
    currentPrice: 180,
    currency: 'USD',
    acquisitionDate: new Date('2023-01-15'),
    lastUpdated: new Date(),
  });

  tracker.addPosition({
    symbol: 'GOOGL',
    assetClass: 'stocks',
    quantity: 50,
    averageCost: 2500,
    currentPrice: 2800,
    currency: 'USD',
    acquisitionDate: new Date('2023-03-20'),
    lastUpdated: new Date(),
  });

  tracker.addPosition({
    symbol: 'BTC-USD',
    assetClass: 'crypto',
    quantity: 2,
    averageCost: 30000,
    currentPrice: 45000,
    currency: 'USD',
    acquisitionDate: new Date('2023-06-10'),
    lastUpdated: new Date(),
  });

  // Get portfolio snapshot
  const portfolio = tracker.getPortfolio();

  console.log('Portfolio Summary:');
  console.log(`  Total Value: $${portfolio.totalValue.toLocaleString()}`);
  console.log(`  Total Cost: $${portfolio.totalCost.toLocaleString()}`);
  console.log(`  Total Gain: $${portfolio.totalGain.toLocaleString()} (${portfolio.totalGainPercent.toFixed(2)}%)`);

  console.log('\nHoldings:');
  portfolio.holdings.forEach((holding) => {
    console.log(`  ${holding.position.symbol}:`);
    console.log(`    Quantity: ${holding.position.quantity}`);
    console.log(`    Market Value: $${holding.marketValue.toLocaleString()}`);
    console.log(`    Gain/Loss: $${holding.unrealizedGain.toLocaleString()} (${holding.unrealizedGainPercent.toFixed(2)}%)`);
    console.log(`    Portfolio Weight: ${holding.portfolioWeight.toFixed(2)}%`);
  });

  console.log('\nAsset Allocation:');
  Object.entries(portfolio.assetAllocation).forEach(([assetClass, weight]) => {
    if (weight > 0) {
      console.log(`  ${assetClass}: ${weight.toFixed(2)}%`);
    }
  });
}

/**
 * Example: Calculate returns and performance
 */
export async function exampleCalculateReturns(): Promise<void> {
  console.log('\nExample: Portfolio Performance Metrics\n');

  const calculator = new PerformanceCalculator();

  // Simulate daily price history
  const prices: number[] = [];
  let price = 10000;
  for (let i = 0; i < 252; i++) {
    // 1 year of daily data
    const change = (Math.random() - 0.48) * 0.02; // Slight upward bias
    price *= 1 + change;
    prices.push(price);
  }

  // Calculate returns
  const dailyReturns = calculator.calculateReturns(prices);

  // Calculate metrics
  const metrics = calculator.calculateMetrics(dailyReturns);

  console.log('Performance Metrics (1 Year):');
  console.log(`  Total Return: ${metrics.totalReturnPercent.toFixed(2)}%`);
  console.log(`  Annualized Return: ${(metrics.annualizedReturn * 100).toFixed(2)}%`);
  console.log(`  Volatility: ${(metrics.volatility * 100).toFixed(2)}%`);
  console.log(`  Sharpe Ratio: ${metrics.sharpeRatio.toFixed(2)}`);
  console.log(`  Max Drawdown: ${metrics.maxDrawdown.toFixed(2)}%`);
  console.log(`  Win Rate: ${metrics.winRate.toFixed(2)}%`);
  console.log(`  Best Day: ${metrics.bestDay.toFixed(2)}%`);
  console.log(`  Worst Day: ${metrics.worstDay.toFixed(2)}%`);
}

/**
 * Example: Portfolio rebalancing
 */
export async function exampleRebalancing(): Promise<void> {
  console.log('\nExample: Portfolio Rebalancing\n');

  const tracker = new PortfolioTracker();

  // Create portfolio with unbalanced allocation
  tracker.addPosition({
    symbol: 'AAPL',
    assetClass: 'stocks',
    quantity: 200,
    averageCost: 150,
    currentPrice: 180,
    currency: 'USD',
    acquisitionDate: new Date('2023-01-15'),
    lastUpdated: new Date(),
  });

  tracker.addPosition({
    symbol: 'TLT',
    assetClass: 'bonds',
    quantity: 50,
    averageCost: 100,
    currentPrice: 95,
    currency: 'USD',
    acquisitionDate: new Date('2023-03-20'),
    lastUpdated: new Date(),
  });

  const portfolio = tracker.getPortfolio();
  const rebalancer = new PortfolioRebalancer();

  // Define target allocation (60/40 stocks/bonds)
  const targetAllocation: Record<AssetClass, number> = {
    stocks: 60,
    bonds: 40,
    crypto: 0,
    commodities: 0,
    real_estate: 0,
    cash: 0,
  };

  console.log('Current Allocation:');
  console.log(`  Stocks: ${portfolio.assetAllocation.stocks.toFixed(2)}%`);
  console.log(`  Bonds: ${portfolio.assetAllocation.bonds.toFixed(2)}%`);

  console.log('\nTarget Allocation:');
  console.log(`  Stocks: ${targetAllocation.stocks}%`);
  console.log(`  Bonds: ${targetAllocation.bonds}%`);

  const recommendations = rebalancer.getRebalanceRecommendations(
    portfolio,
    targetAllocation
  );

  if (recommendations.length > 0) {
    console.log('\nRebalancing Recommendations:');
    recommendations.forEach((rec) => {
      console.log(`  ${rec.symbol}:`);
      console.log(`    Action: ${rec.action.toUpperCase()}`);
      console.log(`    Quantity: ${rec.quantity} units`);
      console.log(`    Estimated Value: $${rec.estimatedValue.toLocaleString()}`);
      console.log(`    Current Weight: ${rec.currentWeight.toFixed(2)}%`);
      console.log(`    Target Weight: ${rec.targetWeight.toFixed(2)}%`);
    });
  } else {
    console.log('\nNo rebalancing needed. Portfolio is within target allocation.');
  }
}

/**
 * Example: Dividend tracking
 */
export async function exampleDividendTracking(): Promise<void> {
  console.log('\nExample: Dividend Income Tracking\n');

  const dividendTracker = new DividendTracker();

  // Record dividends
  dividendTracker.recordDividend({
    symbol: 'AAPL',
    amount: 88,
    exDate: new Date('2024-11-08'),
    paymentDate: new Date('2024-11-14'),
    type: 'qualified',
  });

  dividendTracker.recordDividend({
    symbol: 'MSFT',
    amount: 132,
    exDate: new Date('2024-11-15'),
    paymentDate: new Date('2024-11-21'),
    type: 'qualified',
  });

  dividendTracker.recordDividend({
    symbol: 'AAPL',
    amount: 90,
    exDate: new Date('2024-08-09'),
    paymentDate: new Date('2024-08-15'),
    type: 'qualified',
  });

  const totalIncome = dividendTracker.getTotalIncome();
  const appleIncome = dividendTracker.getIncomeBySymbol('AAPL');

  console.log('Dividend Income Summary:');
  console.log(`  Total Income: $${totalIncome.toFixed(2)}`);
  console.log(`  AAPL Income: $${appleIncome.toFixed(2)}`);

  console.log('\nDividend History:');
  const history = dividendTracker.getDividendHistory();
  history.forEach((div) => {
    console.log(
      `  ${div.symbol}: $${div.amount.toFixed(2)} on ${div.paymentDate.toISOString().split('T')[0]}`
    );
  });
}

/**
 * Example: Transaction recording
 */
export async function exampleTransactionRecording(): Promise<void> {
  console.log('\nExample: Transaction Recording\n');

  const tracker = new PortfolioTracker();

  // Record buy transactions
  tracker.recordTransaction({
    id: 'txn_001',
    type: 'buy',
    symbol: 'TSLA',
    quantity: 10,
    price: 200,
    amount: 2000,
    date: new Date('2024-01-15'),
    fees: 5,
  });

  tracker.recordTransaction({
    id: 'txn_002',
    type: 'buy',
    symbol: 'TSLA',
    quantity: 5,
    price: 220,
    amount: 1100,
    date: new Date('2024-03-20'),
    fees: 5,
  });

  // Update current price
  tracker.updatePrice('TSLA', 250);

  // Get portfolio
  const portfolio = tracker.getPortfolio();

  console.log('Portfolio after transactions:');
  portfolio.holdings.forEach((holding) => {
    console.log(`  ${holding.position.symbol}:`);
    console.log(`    Quantity: ${holding.position.quantity}`);
    console.log(`    Average Cost: $${holding.position.averageCost.toFixed(2)}`);
    console.log(`    Current Price: $${holding.position.currentPrice.toFixed(2)}`);
    console.log(`    Unrealized Gain: $${holding.unrealizedGain.toFixed(2)} (${holding.unrealizedGainPercent.toFixed(2)}%)`);
  });

  // Get transaction history
  const transactions = tracker.getTransactions('TSLA');
  console.log('\nTransaction History for TSLA:');
  transactions.forEach((txn) => {
    console.log(`  ${txn.date.toISOString().split('T')[0]}: ${txn.type.toUpperCase()} ${txn.quantity} @ $${txn.price}`);
  });
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  await exampleTrackHoldings();
  await exampleCalculateReturns();
  await exampleRebalancing();
  await exampleDividendTracking();
  await exampleTransactionRecording();
}

// Uncomment to run examples
// runAllExamples().catch(console.error);
