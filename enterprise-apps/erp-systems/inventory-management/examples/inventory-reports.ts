/**
 * Inventory Reports Examples
 *
 * This file demonstrates various inventory reporting capabilities:
 * - Current stock levels by product and warehouse
 * - Stock movement history and transaction tracking
 * - Inventory valuation reports
 * - Stock aging analysis
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Stock level report entry
 */
interface StockLevelReport {
  productCode: string;
  productName: string;
  unit: string;
  warehouseCode: string;
  warehouseName: string;
  quantity: number;
  minQuantity: number;
  status: 'ADEQUATE' | 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK';
  lastUpdated: Date;
}

/**
 * Summary of stock levels across all warehouses
 */
interface StockLevelSummary {
  totalProducts: number;
  totalWarehouses: number;
  totalStockItems: number;
  adequateStock: number;
  lowStock: number;
  criticalStock: number;
  outOfStock: number;
  reportGeneratedAt: Date;
}

/**
 * Stock movement transaction record
 */
interface StockMovement {
  id: number;
  transactionType: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
  productCode: string;
  productName: string;
  warehouseCode: string;
  warehouseName: string;
  quantity: number;
  batchNo?: string;
  reference?: string;
  operator?: string;
  notes?: string;
  timestamp: Date;
}

/**
 * Stock movement summary for a period
 */
interface MovementSummary {
  productCode: string;
  productName: string;
  warehouseCode: string;
  totalIn: number;
  totalOut: number;
  totalTransferIn: number;
  totalTransferOut: number;
  totalAdjustments: number;
  netMovement: number;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Inventory valuation entry
 */
interface InventoryValuationItem {
  productCode: string;
  productName: string;
  warehouseCode: string;
  warehouseName: string;
  quantity: number;
  unitCost: number;
  totalValue: number;
  lastPurchaseDate?: Date;
  averageCost?: number;
}

/**
 * Overall inventory valuation report
 */
interface ValuationReport {
  items: InventoryValuationItem[];
  totalQuantity: number;
  totalValue: number;
  averageUnitCost: number;
  reportDate: Date;
}

/**
 * Stock aging analysis
 */
interface StockAgingItem {
  productCode: string;
  productName: string;
  warehouseCode: string;
  batchNo?: string;
  quantity: number;
  receivedDate: Date;
  daysInStock: number;
  ageCategory: '0-30' | '31-60' | '61-90' | '91-180' | '180+';
  value: number;
}

/**
 * Filter parameters for reports
 */
interface ReportFilter {
  productCode?: string;
  warehouseCode?: string;
  startDate?: Date;
  endDate?: Date;
  transactionType?: string;
  minQuantity?: number;
  maxQuantity?: number;
}

// ============================================================================
// Current Stock Level Reports
// ============================================================================

/**
 * Generate current stock levels report for all products and warehouses
 *
 * @param filter - Optional filter parameters
 * @returns Promise with stock level report data
 *
 * @example
 * ```typescript
 * // Get all stock levels
 * const allStock = await getCurrentStockLevels();
 *
 * // Get stock for specific warehouse
 * const warehouseStock = await getCurrentStockLevels({
 *   warehouseCode: 'WH001'
 * });
 *
 * // Get stock for specific product
 * const productStock = await getCurrentStockLevels({
 *   productCode: 'P001'
 * });
 * ```
 */
async function getCurrentStockLevels(
  filter?: ReportFilter
): Promise<StockLevelReport[]> {
  // Build query based on filters
  let query = `
    SELECT
      s.product_code,
      p.name as product_name,
      p.unit,
      s.warehouse_code,
      w.name as warehouse_name,
      s.quantity,
      p.min_quantity,
      s.last_updated
    FROM stock s
    JOIN products p ON s.product_code = p.code
    JOIN warehouses w ON s.warehouse_code = w.code
    WHERE s.quantity >= 0
  `;

  const params: any[] = [];

  if (filter?.productCode) {
    query += ' AND s.product_code = ?';
    params.push(filter.productCode);
  }

  if (filter?.warehouseCode) {
    query += ' AND s.warehouse_code = ?';
    params.push(filter.warehouseCode);
  }

  query += ' ORDER BY s.product_code, s.warehouse_code';

  // Execute query (mock implementation)
  const results = await executeQuery(query, params);

  // Transform results and add status
  return results.map((row: any) => {
    let status: StockLevelReport['status'];

    if (row.quantity === 0) {
      status = 'OUT_OF_STOCK';
    } else if (row.quantity < row.min_quantity * 0.5) {
      status = 'CRITICAL';
    } else if (row.quantity < row.min_quantity) {
      status = 'LOW';
    } else {
      status = 'ADEQUATE';
    }

    return {
      productCode: row.product_code,
      productName: row.product_name,
      unit: row.unit,
      warehouseCode: row.warehouse_code,
      warehouseName: row.warehouse_name,
      quantity: row.quantity,
      minQuantity: row.min_quantity,
      status,
      lastUpdated: new Date(row.last_updated)
    };
  });
}

/**
 * Generate stock level summary statistics
 *
 * @returns Promise with summary data
 *
 * @example
 * ```typescript
 * const summary = await getStockLevelSummary();
 * console.log(`Total products in stock: ${summary.totalProducts}`);
 * console.log(`Low stock items: ${summary.lowStock}`);
 * console.log(`Critical stock items: ${summary.criticalStock}`);
 * ```
 */
async function getStockLevelSummary(): Promise<StockLevelSummary> {
  // Get all stock levels
  const stockLevels = await getCurrentStockLevels();

  // Calculate summary statistics
  const summary: StockLevelSummary = {
    totalProducts: new Set(stockLevels.map(s => s.productCode)).size,
    totalWarehouses: new Set(stockLevels.map(s => s.warehouseCode)).size,
    totalStockItems: stockLevels.length,
    adequateStock: stockLevels.filter(s => s.status === 'ADEQUATE').length,
    lowStock: stockLevels.filter(s => s.status === 'LOW').length,
    criticalStock: stockLevels.filter(s => s.status === 'CRITICAL').length,
    outOfStock: stockLevels.filter(s => s.status === 'OUT_OF_STOCK').length,
    reportGeneratedAt: new Date()
  };

  return summary;
}

// ============================================================================
// Stock Movement History Reports
// ============================================================================

/**
 * Get stock movement history with optional filtering
 *
 * @param filter - Filter parameters
 * @returns Promise with movement history
 *
 * @example
 * ```typescript
 * // Get all movements for the last 30 days
 * const movements = await getStockMovementHistory({
 *   startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
 *   endDate: new Date()
 * });
 *
 * // Get movements for a specific product
 * const productMovements = await getStockMovementHistory({
 *   productCode: 'P001',
 *   startDate: new Date('2025-01-01'),
 *   endDate: new Date('2025-12-31')
 * });
 * ```
 */
async function getStockMovementHistory(
  filter?: ReportFilter
): Promise<StockMovement[]> {
  let query = `
    SELECT
      t.id,
      t.transaction_type,
      t.product_code,
      p.name as product_name,
      t.warehouse_code,
      w.name as warehouse_name,
      t.quantity,
      t.batch_no,
      t.reference,
      t.operator,
      t.notes,
      t.timestamp
    FROM transactions t
    JOIN products p ON t.product_code = p.code
    JOIN warehouses w ON t.warehouse_code = w.code
    WHERE 1=1
  `;

  const params: any[] = [];

  if (filter?.productCode) {
    query += ' AND t.product_code = ?';
    params.push(filter.productCode);
  }

  if (filter?.warehouseCode) {
    query += ' AND t.warehouse_code = ?';
    params.push(filter.warehouseCode);
  }

  if (filter?.transactionType) {
    query += ' AND t.transaction_type = ?';
    params.push(filter.transactionType);
  }

  if (filter?.startDate) {
    query += ' AND t.timestamp >= ?';
    params.push(filter.startDate.toISOString());
  }

  if (filter?.endDate) {
    query += ' AND t.timestamp <= ?';
    params.push(filter.endDate.toISOString());
  }

  query += ' ORDER BY t.timestamp DESC LIMIT 1000';

  const results = await executeQuery(query, params);

  return results.map((row: any) => ({
    id: row.id,
    transactionType: row.transaction_type,
    productCode: row.product_code,
    productName: row.product_name,
    warehouseCode: row.warehouse_code,
    warehouseName: row.warehouse_name,
    quantity: row.quantity,
    batchNo: row.batch_no,
    reference: row.reference,
    operator: row.operator,
    notes: row.notes,
    timestamp: new Date(row.timestamp)
  }));
}

/**
 * Generate movement summary report for a specific period
 *
 * @param filter - Filter parameters including date range
 * @returns Promise with movement summary
 *
 * @example
 * ```typescript
 * const summary = await getMovementSummary({
 *   productCode: 'P001',
 *   warehouseCode: 'WH001',
 *   startDate: new Date('2025-01-01'),
 *   endDate: new Date('2025-01-31')
 * });
 *
 * console.log(`Net movement: ${summary.netMovement}`);
 * console.log(`Total in: ${summary.totalIn}`);
 * console.log(`Total out: ${summary.totalOut}`);
 * ```
 */
async function getMovementSummary(filter: ReportFilter): Promise<MovementSummary[]> {
  const movements = await getStockMovementHistory(filter);

  // Group by product and warehouse
  const summaryMap = new Map<string, MovementSummary>();

  movements.forEach(movement => {
    const key = `${movement.productCode}-${movement.warehouseCode}`;

    if (!summaryMap.has(key)) {
      summaryMap.set(key, {
        productCode: movement.productCode,
        productName: movement.productName,
        warehouseCode: movement.warehouseCode,
        totalIn: 0,
        totalOut: 0,
        totalTransferIn: 0,
        totalTransferOut: 0,
        totalAdjustments: 0,
        netMovement: 0,
        periodStart: filter.startDate || new Date(0),
        periodEnd: filter.endDate || new Date()
      });
    }

    const summary = summaryMap.get(key)!;

    switch (movement.transactionType) {
      case 'IN':
        summary.totalIn += movement.quantity;
        summary.netMovement += movement.quantity;
        break;
      case 'OUT':
        summary.totalOut += movement.quantity;
        summary.netMovement -= movement.quantity;
        break;
      case 'TRANSFER':
        // Note: Transfers are recorded as separate IN/OUT transactions
        if (movement.notes?.includes('Transfer from')) {
          summary.totalTransferIn += movement.quantity;
        } else if (movement.notes?.includes('Transfer to')) {
          summary.totalTransferOut += movement.quantity;
        }
        break;
      case 'ADJUSTMENT':
        summary.totalAdjustments += movement.quantity;
        // Adjustments can be positive or negative
        summary.netMovement += movement.quantity;
        break;
    }
  });

  return Array.from(summaryMap.values());
}

// ============================================================================
// Inventory Valuation Reports
// ============================================================================

/**
 * Generate inventory valuation report
 *
 * Calculates the total value of inventory based on cost data
 *
 * @param filter - Optional filter parameters
 * @returns Promise with valuation report
 *
 * @example
 * ```typescript
 * // Get complete valuation report
 * const report = await getInventoryValuation();
 * console.log(`Total inventory value: $${report.totalValue.toFixed(2)}`);
 *
 * // Get valuation for specific warehouse
 * const warehouseReport = await getInventoryValuation({
 *   warehouseCode: 'WH001'
 * });
 * ```
 */
async function getInventoryValuation(
  filter?: ReportFilter
): Promise<ValuationReport> {
  // Get current stock levels
  const stockLevels = await getCurrentStockLevels(filter);

  const items: InventoryValuationItem[] = [];
  let totalQuantity = 0;
  let totalValue = 0;

  for (const stock of stockLevels) {
    // Get cost data for product (from latest purchase or average)
    const costData = await getProductCostData(stock.productCode);

    const itemValue = stock.quantity * costData.unitCost;

    items.push({
      productCode: stock.productCode,
      productName: stock.productName,
      warehouseCode: stock.warehouseCode,
      warehouseName: stock.warehouseName,
      quantity: stock.quantity,
      unitCost: costData.unitCost,
      totalValue: itemValue,
      lastPurchaseDate: costData.lastPurchaseDate,
      averageCost: costData.averageCost
    });

    totalQuantity += stock.quantity;
    totalValue += itemValue;
  }

  return {
    items,
    totalQuantity,
    totalValue,
    averageUnitCost: totalQuantity > 0 ? totalValue / totalQuantity : 0,
    reportDate: new Date()
  };
}

/**
 * Generate stock aging report
 *
 * Analyzes how long inventory has been in stock
 *
 * @param filter - Optional filter parameters
 * @returns Promise with aging analysis
 *
 * @example
 * ```typescript
 * const agingReport = await getStockAgingReport({
 *   warehouseCode: 'WH001'
 * });
 *
 * const oldStock = agingReport.filter(item => item.ageCategory === '180+');
 * console.log(`Items over 180 days old: ${oldStock.length}`);
 * ```
 */
async function getStockAgingReport(
  filter?: ReportFilter
): Promise<StockAgingItem[]> {
  // Query to get stock with received dates (from batch tracking)
  const query = `
    SELECT
      t.product_code,
      p.name as product_name,
      t.warehouse_code,
      t.batch_no,
      SUM(t.quantity) as quantity,
      MIN(t.timestamp) as received_date
    FROM transactions t
    JOIN products p ON t.product_code = p.code
    WHERE t.transaction_type = 'IN'
    GROUP BY t.product_code, t.warehouse_code, t.batch_no
    HAVING quantity > 0
    ORDER BY received_date
  `;

  const results = await executeQuery(query, []);
  const now = new Date();

  return results.map((row: any) => {
    const receivedDate = new Date(row.received_date);
    const daysInStock = Math.floor(
      (now.getTime() - receivedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    let ageCategory: StockAgingItem['ageCategory'];
    if (daysInStock <= 30) ageCategory = '0-30';
    else if (daysInStock <= 60) ageCategory = '31-60';
    else if (daysInStock <= 90) ageCategory = '61-90';
    else if (daysInStock <= 180) ageCategory = '91-180';
    else ageCategory = '180+';

    return {
      productCode: row.product_code,
      productName: row.product_name,
      warehouseCode: row.warehouse_code,
      batchNo: row.batch_no,
      quantity: row.quantity,
      receivedDate,
      daysInStock,
      ageCategory,
      value: 0 // Would be calculated from cost data
    };
  });
}

// ============================================================================
// Helper Functions (Mock implementations)
// ============================================================================

/**
 * Execute database query (mock implementation)
 */
async function executeQuery(query: string, params: any[]): Promise<any[]> {
  // Mock implementation - replace with actual database query
  console.log('Executing query:', query);
  console.log('Parameters:', params);

  // Return mock data
  return [
    {
      product_code: 'P001',
      product_name: 'Widget A',
      unit: 'PCS',
      warehouse_code: 'WH001',
      warehouse_name: 'Main Warehouse',
      quantity: 150,
      min_quantity: 50,
      last_updated: new Date().toISOString()
    },
    {
      product_code: 'P002',
      product_name: 'Widget B',
      unit: 'PCS',
      warehouse_code: 'WH001',
      warehouse_name: 'Main Warehouse',
      quantity: 25,
      min_quantity: 50,
      last_updated: new Date().toISOString()
    }
  ];
}

/**
 * Get product cost data
 */
async function getProductCostData(productCode: string): Promise<{
  unitCost: number;
  averageCost: number;
  lastPurchaseDate?: Date;
}> {
  // Mock implementation - would query purchase order history
  return {
    unitCost: 10.50,
    averageCost: 10.25,
    lastPurchaseDate: new Date('2025-01-15')
  };
}

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Demonstrate various inventory reports
 */
async function demonstrateInventoryReports(): Promise<void> {
  console.log('=== Inventory Reports Demo ===\n');

  // Example 1: Current Stock Levels
  console.log('1. Current Stock Levels Report:');
  const stockLevels = await getCurrentStockLevels();
  console.log(`Found ${stockLevels.length} stock items`);
  stockLevels.slice(0, 3).forEach(item => {
    console.log(
      `  ${item.productCode} (${item.productName}) at ${item.warehouseCode}: ` +
      `${item.quantity} ${item.unit} [${item.status}]`
    );
  });
  console.log();

  // Example 2: Stock Level Summary
  console.log('2. Stock Level Summary:');
  const summary = await getStockLevelSummary();
  console.log(`  Total Products: ${summary.totalProducts}`);
  console.log(`  Total Warehouses: ${summary.totalWarehouses}`);
  console.log(`  Adequate Stock: ${summary.adequateStock}`);
  console.log(`  Low Stock: ${summary.lowStock}`);
  console.log(`  Critical Stock: ${summary.criticalStock}`);
  console.log(`  Out of Stock: ${summary.outOfStock}`);
  console.log();

  // Example 3: Stock Movement History
  console.log('3. Stock Movement History (Last 7 Days):');
  const movements = await getStockMovementHistory({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  });
  console.log(`Found ${movements.length} transactions`);
  console.log();

  // Example 4: Movement Summary
  console.log('4. Movement Summary:');
  const movementSummary = await getMovementSummary({
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-31')
  });
  movementSummary.slice(0, 2).forEach(item => {
    console.log(`  ${item.productCode}: In=${item.totalIn}, Out=${item.totalOut}, Net=${item.netMovement}`);
  });
  console.log();

  // Example 5: Inventory Valuation
  console.log('5. Inventory Valuation Report:');
  const valuation = await getInventoryValuation();
  console.log(`  Total Quantity: ${valuation.totalQuantity} units`);
  console.log(`  Total Value: $${valuation.totalValue.toFixed(2)}`);
  console.log(`  Average Unit Cost: $${valuation.averageUnitCost.toFixed(2)}`);
  console.log();

  // Example 6: Stock Aging Report
  console.log('6. Stock Aging Report:');
  const aging = await getStockAgingReport();
  const agingByCategory = aging.reduce((acc, item) => {
    acc[item.ageCategory] = (acc[item.ageCategory] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log('  Age Distribution:', agingByCategory);
}

// Run demo if this file is executed directly
if (require.main === module) {
  demonstrateInventoryReports().catch(console.error);
}

// Export functions for use in other modules
export {
  getCurrentStockLevels,
  getStockLevelSummary,
  getStockMovementHistory,
  getMovementSummary,
  getInventoryValuation,
  getStockAgingReport,
  type StockLevelReport,
  type StockLevelSummary,
  type StockMovement,
  type MovementSummary,
  type InventoryValuationItem,
  type ValuationReport,
  type StockAgingItem,
  type ReportFilter
};
