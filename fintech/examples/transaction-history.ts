/**
 * Transaction History Examples
 *
 * This file demonstrates transaction history management patterns:
 * - Fetching transaction data
 * - Filtering by date, type, status, and amount
 * - Pagination and sorting
 * - Exporting to CSV format
 * - Transaction analytics and summaries
 * - Search and query operations
 */

// ============================================================================
// TYPES
// ============================================================================

export type TransactionType =
  | 'payment'
  | 'refund'
  | 'transfer'
  | 'withdrawal'
  | 'deposit'
  | 'fee'
  | 'adjustment';

export type TransactionStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'processing';

export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  description: string;
  customerId: string;
  merchantId?: string;
  paymentMethod?: string;
  timestamp: Date;
  processedAt?: Date;
  metadata?: Record<string, unknown>;
  fees?: {
    amount: number;
    type: string;
  }[];
  tags?: string[];
}

export interface TransactionFilter {
  types?: TransactionType[];
  statuses?: TransactionStatus[];
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  customerId?: string;
  merchantId?: string;
  searchTerm?: string;
  tags?: string[];
}

export interface TransactionSummary {
  totalCount: number;
  totalAmount: number;
  averageAmount: number;
  byType: Record<TransactionType, { count: number; amount: number }>;
  byStatus: Record<TransactionStatus, { count: number; amount: number }>;
  currency: string;
  dateRange: {
    start: Date;
    end: Date;
  };
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: keyof Transaction;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
  };
}

// ============================================================================
// TRANSACTION REPOSITORY
// ============================================================================

/**
 * Transaction repository for data access
 * In production, this would connect to a database
 */
export class TransactionRepository {
  private transactions: Transaction[] = [];

  constructor() {
    // Initialize with sample data for demonstration
    this.seedSampleData();
  }

  /**
   * Seed sample transaction data
   */
  private seedSampleData(): void {
    const now = new Date();
    const sampleTransactions: Transaction[] = [
      {
        id: 'txn_001',
        type: 'payment',
        status: 'completed',
        amount: 15000, // $150.00
        currency: 'USD',
        description: 'Payment for Order #12345',
        customerId: 'cust_001',
        merchantId: 'merch_001',
        paymentMethod: 'card_ending_4242',
        timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        processedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 60000),
        fees: [{ amount: 435, type: 'processing_fee' }],
        tags: ['online', 'retail'],
      },
      {
        id: 'txn_002',
        type: 'refund',
        status: 'completed',
        amount: 5000,
        currency: 'USD',
        description: 'Refund for Order #12340',
        customerId: 'cust_002',
        merchantId: 'merch_001',
        timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        processedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 120000),
        tags: ['refund', 'customer_service'],
      },
      {
        id: 'txn_003',
        type: 'transfer',
        status: 'completed',
        amount: 100000,
        currency: 'USD',
        description: 'Wire transfer to supplier',
        customerId: 'cust_003',
        timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        processedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 180000),
        fees: [{ amount: 2500, type: 'wire_fee' }],
        tags: ['b2b', 'supplier'],
      },
      {
        id: 'txn_004',
        type: 'payment',
        status: 'failed',
        amount: 25000,
        currency: 'USD',
        description: 'Payment for Order #12350',
        customerId: 'cust_001',
        merchantId: 'merch_002',
        paymentMethod: 'card_ending_1234',
        timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        tags: ['online', 'failed'],
      },
      {
        id: 'txn_005',
        type: 'deposit',
        status: 'completed',
        amount: 500000,
        currency: 'USD',
        description: 'Account funding',
        customerId: 'cust_004',
        timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        processedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 300000),
        tags: ['funding', 'bank_transfer'],
      },
    ];

    this.transactions = sampleTransactions;
  }

  /**
   * Get all transactions
   */
  async getAll(): Promise<Transaction[]> {
    return [...this.transactions];
  }

  /**
   * Get transaction by ID
   */
  async getById(id: string): Promise<Transaction | null> {
    const transaction = this.transactions.find((t) => t.id === id);
    return transaction || null;
  }

  /**
   * Add a transaction
   */
  async add(transaction: Transaction): Promise<Transaction> {
    this.transactions.push(transaction);
    return transaction;
  }

  /**
   * Get transactions by customer
   */
  async getByCustomerId(customerId: string): Promise<Transaction[]> {
    return this.transactions.filter((t) => t.customerId === customerId);
  }
}

// ============================================================================
// TRANSACTION SERVICE
// ============================================================================

/**
 * Service for transaction operations
 */
export class TransactionService {
  constructor(private repository: TransactionRepository) {}

  /**
   * Fetch transactions with optional filters
   */
  async fetchTransactions(
    filter?: TransactionFilter
  ): Promise<Transaction[]> {
    try {
      const allTransactions = await this.repository.getAll();

      if (!filter) {
        return allTransactions;
      }

      return this.applyFilters(allTransactions, filter);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw new Error('Failed to fetch transactions');
    }
  }

  /**
   * Fetch transactions with pagination
   */
  async fetchTransactionsPaginated(
    filter?: TransactionFilter,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Transaction>> {
    try {
      const filteredTransactions = await this.fetchTransactions(filter);

      // Apply sorting
      const sortedTransactions = this.applySorting(
        filteredTransactions,
        pagination?.sortBy,
        pagination?.sortOrder
      );

      // Apply pagination
      const page = pagination?.page || 1;
      const pageSize = pagination?.pageSize || 10;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      const paginatedData = sortedTransactions.slice(startIndex, endIndex);
      const totalCount = sortedTransactions.length;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        data: paginatedData,
        pagination: {
          page,
          pageSize,
          totalPages,
          totalCount,
        },
      };
    } catch (error) {
      console.error('Error fetching paginated transactions:', error);
      throw new Error('Failed to fetch paginated transactions');
    }
  }

  /**
   * Filter transactions by date range
   */
  filterByDateRange(
    transactions: Transaction[],
    startDate: Date,
    endDate: Date
  ): Transaction[] {
    return transactions.filter((transaction) => {
      const txnDate = new Date(transaction.timestamp);
      return txnDate >= startDate && txnDate <= endDate;
    });
  }

  /**
   * Filter transactions by type
   */
  filterByType(
    transactions: Transaction[],
    types: TransactionType[]
  ): Transaction[] {
    return transactions.filter((transaction) =>
      types.includes(transaction.type)
    );
  }

  /**
   * Filter transactions by status
   */
  filterByStatus(
    transactions: Transaction[],
    statuses: TransactionStatus[]
  ): Transaction[] {
    return transactions.filter((transaction) =>
      statuses.includes(transaction.status)
    );
  }

  /**
   * Filter transactions by amount range
   */
  filterByAmountRange(
    transactions: Transaction[],
    minAmount?: number,
    maxAmount?: number
  ): Transaction[] {
    return transactions.filter((transaction) => {
      if (minAmount !== undefined && transaction.amount < minAmount) {
        return false;
      }
      if (maxAmount !== undefined && transaction.amount > maxAmount) {
        return false;
      }
      return true;
    });
  }

  /**
   * Apply all filters to transactions
   */
  private applyFilters(
    transactions: Transaction[],
    filter: TransactionFilter
  ): Transaction[] {
    let filtered = [...transactions];

    // Filter by date range
    if (filter.startDate || filter.endDate) {
      const startDate = filter.startDate || new Date(0);
      const endDate = filter.endDate || new Date();
      filtered = this.filterByDateRange(filtered, startDate, endDate);
    }

    // Filter by type
    if (filter.types && filter.types.length > 0) {
      filtered = this.filterByType(filtered, filter.types);
    }

    // Filter by status
    if (filter.statuses && filter.statuses.length > 0) {
      filtered = this.filterByStatus(filtered, filter.statuses);
    }

    // Filter by amount range
    if (filter.minAmount !== undefined || filter.maxAmount !== undefined) {
      filtered = this.filterByAmountRange(
        filtered,
        filter.minAmount,
        filter.maxAmount
      );
    }

    // Filter by customer ID
    if (filter.customerId) {
      filtered = filtered.filter((t) => t.customerId === filter.customerId);
    }

    // Filter by merchant ID
    if (filter.merchantId) {
      filtered = filtered.filter((t) => t.merchantId === filter.merchantId);
    }

    // Filter by tags
    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter((t) =>
        filter.tags?.some((tag) => t.tags?.includes(tag))
      );
    }

    // Filter by search term (searches description and ID)
    if (filter.searchTerm) {
      const searchLower = filter.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(searchLower) ||
          t.id.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }

  /**
   * Apply sorting to transactions
   */
  private applySorting(
    transactions: Transaction[],
    sortBy?: keyof Transaction,
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Transaction[] {
    if (!sortBy) {
      // Default sort by timestamp descending
      return [...transactions].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );
    }

    return [...transactions].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (aVal === undefined || bVal === undefined) return 0;

      let comparison = 0;
      if (aVal < bVal) comparison = -1;
      if (aVal > bVal) comparison = 1;

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Generate transaction summary
   */
  async generateSummary(
    filter?: TransactionFilter
  ): Promise<TransactionSummary> {
    try {
      const transactions = await this.fetchTransactions(filter);

      if (transactions.length === 0) {
        throw new Error('No transactions found for the given criteria');
      }

      const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
      const averageAmount = totalAmount / transactions.length;

      // Group by type
      const byType: Record<TransactionType, { count: number; amount: number }> =
        {} as Record<TransactionType, { count: number; amount: number }>;

      // Group by status
      const byStatus: Record<TransactionStatus, { count: number; amount: number }> =
        {} as Record<TransactionStatus, { count: number; amount: number }>;

      transactions.forEach((transaction) => {
        // By type
        if (!byType[transaction.type]) {
          byType[transaction.type] = { count: 0, amount: 0 };
        }
        byType[transaction.type].count++;
        byType[transaction.type].amount += transaction.amount;

        // By status
        if (!byStatus[transaction.status]) {
          byStatus[transaction.status] = { count: 0, amount: 0 };
        }
        byStatus[transaction.status].count++;
        byStatus[transaction.status].amount += transaction.amount;
      });

      // Get date range
      const timestamps = transactions.map((t) => t.timestamp.getTime());
      const startDate = new Date(Math.min(...timestamps));
      const endDate = new Date(Math.max(...timestamps));

      return {
        totalCount: transactions.length,
        totalAmount,
        averageAmount,
        byType,
        byStatus,
        currency: transactions[0].currency,
        dateRange: {
          start: startDate,
          end: endDate,
        },
      };
    } catch (error) {
      console.error('Error generating summary:', error);
      throw new Error('Failed to generate transaction summary');
    }
  }

  /**
   * Export transactions to CSV format
   */
  exportToCSV(transactions: Transaction[]): string {
    if (transactions.length === 0) {
      return 'No transactions to export';
    }

    // CSV header
    const headers = [
      'Transaction ID',
      'Type',
      'Status',
      'Amount',
      'Currency',
      'Description',
      'Customer ID',
      'Merchant ID',
      'Payment Method',
      'Timestamp',
      'Processed At',
      'Fees',
      'Tags',
    ];

    // CSV rows
    const rows = transactions.map((transaction) => {
      const fees = transaction.fees
        ? transaction.fees.map((f) => `${f.type}:${f.amount}`).join(';')
        : '';
      const tags = transaction.tags ? transaction.tags.join(';') : '';

      return [
        transaction.id,
        transaction.type,
        transaction.status,
        (transaction.amount / 100).toFixed(2),
        transaction.currency,
        `"${transaction.description.replace(/"/g, '""')}"`, // Escape quotes
        transaction.customerId,
        transaction.merchantId || '',
        transaction.paymentMethod || '',
        transaction.timestamp.toISOString(),
        transaction.processedAt?.toISOString() || '',
        fees,
        tags,
      ];
    });

    // Combine headers and rows
    const csvLines = [headers, ...rows];
    return csvLines.map((row) => row.join(',')).join('\n');
  }

  /**
   * Export transactions to CSV file
   */
  async exportToCSVFile(
    transactions: Transaction[],
    filename: string
  ): Promise<void> {
    try {
      const csv = this.exportToCSV(transactions);

      // In Node.js environment
      if (typeof window === 'undefined') {
        const fs = await import('fs');
        await fs.promises.writeFile(filename, csv, 'utf-8');
        console.log(`Exported ${transactions.length} transactions to ${filename}`);
      } else {
        // In browser environment
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        console.log(`Downloaded ${transactions.length} transactions`);
      }
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw new Error('Failed to export transactions to CSV');
    }
  }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example: Basic transaction fetching
 */
export async function exampleFetchTransactions(): Promise<void> {
  console.log('Example: Fetching all transactions\n');

  const repository = new TransactionRepository();
  const service = new TransactionService(repository);

  try {
    const transactions = await service.fetchTransactions();
    console.log(`Found ${transactions.length} transactions`);
    transactions.forEach((txn) => {
      console.log(
        `  ${txn.id}: ${txn.type} - $${(txn.amount / 100).toFixed(2)} (${txn.status})`
      );
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example: Filter by date range
 */
export async function exampleFilterByDateRange(): Promise<void> {
  console.log('\nExample: Filter transactions by date range\n');

  const repository = new TransactionRepository();
  const service = new TransactionService(repository);

  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 3 * 24 * 60 * 60 * 1000); // Last 3 days

    const transactions = await service.fetchTransactions({
      startDate,
      endDate,
    });

    console.log(`Found ${transactions.length} transactions in the last 3 days`);
    transactions.forEach((txn) => {
      console.log(
        `  ${txn.id}: ${txn.description} - $${(txn.amount / 100).toFixed(2)}`
      );
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example: Filter by type and status
 */
export async function exampleFilterByTypeAndStatus(): Promise<void> {
  console.log('\nExample: Filter by type and status\n');

  const repository = new TransactionRepository();
  const service = new TransactionService(repository);

  try {
    const transactions = await service.fetchTransactions({
      types: ['payment', 'refund'],
      statuses: ['completed'],
    });

    console.log(`Found ${transactions.length} completed payments/refunds`);
    transactions.forEach((txn) => {
      console.log(
        `  ${txn.id}: ${txn.type} - $${(txn.amount / 100).toFixed(2)}`
      );
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example: Pagination
 */
export async function examplePagination(): Promise<void> {
  console.log('\nExample: Paginated transactions\n');

  const repository = new TransactionRepository();
  const service = new TransactionService(repository);

  try {
    const result = await service.fetchTransactionsPaginated(
      {},
      {
        page: 1,
        pageSize: 2,
        sortBy: 'amount',
        sortOrder: 'desc',
      }
    );

    console.log(`Page ${result.pagination.page} of ${result.pagination.totalPages}`);
    console.log(`Total: ${result.pagination.totalCount} transactions\n`);

    result.data.forEach((txn) => {
      console.log(
        `  ${txn.id}: $${(txn.amount / 100).toFixed(2)} - ${txn.description}`
      );
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example: Generate summary
 */
export async function exampleGenerateSummary(): Promise<void> {
  console.log('\nExample: Transaction summary\n');

  const repository = new TransactionRepository();
  const service = new TransactionService(repository);

  try {
    const summary = await service.generateSummary();

    console.log('Transaction Summary:');
    console.log(`  Total Count: ${summary.totalCount}`);
    console.log(`  Total Amount: $${(summary.totalAmount / 100).toFixed(2)}`);
    console.log(`  Average Amount: $${(summary.averageAmount / 100).toFixed(2)}`);
    console.log(`  Currency: ${summary.currency}`);
    console.log(
      `  Date Range: ${summary.dateRange.start.toISOString()} to ${summary.dateRange.end.toISOString()}`
    );

    console.log('\n  By Type:');
    Object.entries(summary.byType).forEach(([type, data]) => {
      console.log(
        `    ${type}: ${data.count} transactions, $${(data.amount / 100).toFixed(2)}`
      );
    });

    console.log('\n  By Status:');
    Object.entries(summary.byStatus).forEach(([status, data]) => {
      console.log(
        `    ${status}: ${data.count} transactions, $${(data.amount / 100).toFixed(2)}`
      );
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example: Export to CSV
 */
export async function exampleExportToCSV(): Promise<void> {
  console.log('\nExample: Export transactions to CSV\n');

  const repository = new TransactionRepository();
  const service = new TransactionService(repository);

  try {
    const transactions = await service.fetchTransactions({
      statuses: ['completed'],
    });

    const csv = service.exportToCSV(transactions);
    console.log('CSV Output:\n');
    console.log(csv);

    // Optionally save to file
    // await service.exportToCSVFile(transactions, 'transactions.csv');
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  await exampleFetchTransactions();
  await exampleFilterByDateRange();
  await exampleFilterByTypeAndStatus();
  await examplePagination();
  await exampleGenerateSummary();
  await exampleExportToCSV();
}

// Uncomment to run examples
// runAllExamples().catch(console.error);
