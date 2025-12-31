/**
 * Stock Operations Examples
 *
 * This file demonstrates common stock operations in the inventory management system:
 * - Stock in (receiving inventory)
 * - Stock out (issuing inventory)
 * - Transfer between warehouse locations
 * - Stock adjustments (corrections)
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Product information interface
 */
interface Product {
  code: string;
  name: string;
  unit: string;
  minQuantity: number;
  description?: string;
  createdAt?: Date;
}

/**
 * Warehouse location interface
 */
interface Warehouse {
  code: string;
  name: string;
  location?: string;
  description?: string;
  createdAt?: Date;
}

/**
 * Current stock level interface
 */
interface Stock {
  productCode: string;
  warehouseCode: string;
  quantity: number;
  lastUpdated?: Date;
}

/**
 * Transaction types for inventory movements
 */
enum TransactionType {
  IN = 'IN',           // Stock incoming
  OUT = 'OUT',         // Stock outgoing
  TRANSFER = 'TRANSFER', // Transfer between warehouses
  ADJUSTMENT = 'ADJUSTMENT' // Stock adjustment/correction
}

/**
 * Stock transaction record
 */
interface Transaction {
  id?: number;
  transactionType: TransactionType;
  productCode: string;
  warehouseCode: string;
  quantity: number;
  batchNo?: string;
  reference?: string;
  operator?: string;
  notes?: string;
  timestamp?: Date;
}

/**
 * Stock in request parameters
 */
interface StockInRequest {
  productCode: string;
  warehouseCode: string;
  quantity: number;
  batchNo?: string;
  reference?: string;  // e.g., Purchase Order number
  operator?: string;
  notes?: string;
}

/**
 * Stock out request parameters
 */
interface StockOutRequest {
  productCode: string;
  warehouseCode: string;
  quantity: number;
  reference?: string;  // e.g., Sales Order number
  operator?: string;
  notes?: string;
}

/**
 * Stock transfer request parameters
 */
interface StockTransferRequest {
  productCode: string;
  fromWarehouse: string;
  toWarehouse: string;
  quantity: number;
  reference?: string;
  operator?: string;
  notes?: string;
}

/**
 * Stock adjustment request parameters
 */
interface StockAdjustmentRequest {
  productCode: string;
  warehouseCode: string;
  adjustmentQuantity: number; // Positive or negative
  reason: string;
  operator?: string;
  notes?: string;
}

/**
 * API response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

// ============================================================================
// Stock In Operations
// ============================================================================

/**
 * Process stock incoming transaction (receiving goods)
 *
 * @param request - Stock in request details
 * @returns Promise with transaction result
 *
 * @example
 * ```typescript
 * const result = await stockIn({
 *   productCode: 'P001',
 *   warehouseCode: 'WH001',
 *   quantity: 100,
 *   batchNo: 'BATCH20250101',
 *   reference: 'PO-2025-001',
 *   operator: 'john.doe',
 *   notes: 'Initial stock delivery'
 * });
 * ```
 */
async function stockIn(request: StockInRequest): Promise<ApiResponse<Transaction>> {
  try {
    // Validate request
    if (request.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    // Verify product exists
    const product = await getProduct(request.productCode);
    if (!product) {
      throw new Error(`Product ${request.productCode} does not exist`);
    }

    // Verify warehouse exists
    const warehouse = await getWarehouse(request.warehouseCode);
    if (!warehouse) {
      throw new Error(`Warehouse ${request.warehouseCode} does not exist`);
    }

    // Get current stock level
    const currentStock = await getStockLevel(
      request.productCode,
      request.warehouseCode
    );

    // Calculate new stock level
    const newQuantity = currentStock.quantity + request.quantity;

    // Update stock level in database
    await updateStockLevel({
      productCode: request.productCode,
      warehouseCode: request.warehouseCode,
      quantity: newQuantity,
      lastUpdated: new Date()
    });

    // Record transaction
    const transaction: Transaction = {
      transactionType: TransactionType.IN,
      productCode: request.productCode,
      warehouseCode: request.warehouseCode,
      quantity: request.quantity,
      batchNo: request.batchNo,
      reference: request.reference,
      operator: request.operator,
      notes: request.notes,
      timestamp: new Date()
    };

    const savedTransaction = await saveTransaction(transaction);

    return {
      success: true,
      data: savedTransaction,
      timestamp: new Date()
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    };
  }
}

// ============================================================================
// Stock Out Operations
// ============================================================================

/**
 * Process stock outgoing transaction (issuing goods)
 *
 * @param request - Stock out request details
 * @returns Promise with transaction result
 *
 * @example
 * ```typescript
 * const result = await stockOut({
 *   productCode: 'P001',
 *   warehouseCode: 'WH001',
 *   quantity: 50,
 *   reference: 'SO-2025-001',
 *   operator: 'jane.smith',
 *   notes: 'Customer order fulfillment'
 * });
 * ```
 */
async function stockOut(request: StockOutRequest): Promise<ApiResponse<Transaction>> {
  try {
    // Validate request
    if (request.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    // Get current stock level
    const currentStock = await getStockLevel(
      request.productCode,
      request.warehouseCode
    );

    // Check if sufficient stock is available
    if (currentStock.quantity < request.quantity) {
      throw new Error(
        `Insufficient stock! Available: ${currentStock.quantity}, Required: ${request.quantity}`
      );
    }

    // Calculate new stock level
    const newQuantity = currentStock.quantity - request.quantity;

    // Update stock level in database
    await updateStockLevel({
      productCode: request.productCode,
      warehouseCode: request.warehouseCode,
      quantity: newQuantity,
      lastUpdated: new Date()
    });

    // Record transaction
    const transaction: Transaction = {
      transactionType: TransactionType.OUT,
      productCode: request.productCode,
      warehouseCode: request.warehouseCode,
      quantity: request.quantity,
      reference: request.reference,
      operator: request.operator,
      notes: request.notes,
      timestamp: new Date()
    };

    const savedTransaction = await saveTransaction(transaction);

    return {
      success: true,
      data: savedTransaction,
      timestamp: new Date()
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    };
  }
}

// ============================================================================
// Stock Transfer Operations
// ============================================================================

/**
 * Transfer stock between warehouse locations
 *
 * This operation performs both a stock-out from the source warehouse
 * and a stock-in to the destination warehouse as a single transaction.
 *
 * @param request - Transfer request details
 * @returns Promise with transfer result
 *
 * @example
 * ```typescript
 * const result = await transferStock({
 *   productCode: 'P001',
 *   fromWarehouse: 'WH001',
 *   toWarehouse: 'WH002',
 *   quantity: 25,
 *   reference: 'TRANS-2025-001',
 *   operator: 'warehouse.manager',
 *   notes: 'Rebalancing stock across locations'
 * });
 * ```
 */
async function transferStock(
  request: StockTransferRequest
): Promise<ApiResponse<{ outTransaction: Transaction; inTransaction: Transaction }>> {
  try {
    // Validate request
    if (request.quantity <= 0) {
      throw new Error('Transfer quantity must be greater than 0');
    }

    if (request.fromWarehouse === request.toWarehouse) {
      throw new Error('Source and destination warehouses must be different');
    }

    // Verify both warehouses exist
    const fromWarehouse = await getWarehouse(request.fromWarehouse);
    const toWarehouse = await getWarehouse(request.toWarehouse);

    if (!fromWarehouse || !toWarehouse) {
      throw new Error('Invalid warehouse codes');
    }

    // Check stock availability in source warehouse
    const sourceStock = await getStockLevel(
      request.productCode,
      request.fromWarehouse
    );

    if (sourceStock.quantity < request.quantity) {
      throw new Error(
        `Insufficient stock in ${request.fromWarehouse}! Available: ${sourceStock.quantity}`
      );
    }

    // Begin transaction (ideally wrapped in database transaction)

    // Step 1: Stock out from source warehouse
    const outResult = await stockOut({
      productCode: request.productCode,
      warehouseCode: request.fromWarehouse,
      quantity: request.quantity,
      reference: request.reference,
      operator: request.operator,
      notes: `Transfer to ${request.toWarehouse}: ${request.notes || ''}`
    });

    if (!outResult.success) {
      throw new Error(`Transfer failed: ${outResult.error}`);
    }

    // Step 2: Stock in to destination warehouse
    const inResult = await stockIn({
      productCode: request.productCode,
      warehouseCode: request.toWarehouse,
      quantity: request.quantity,
      reference: request.reference,
      operator: request.operator,
      notes: `Transfer from ${request.fromWarehouse}: ${request.notes || ''}`
    });

    if (!inResult.success) {
      // Rollback would happen here in production (reverse the stock-out)
      throw new Error(`Transfer failed at destination: ${inResult.error}`);
    }

    return {
      success: true,
      data: {
        outTransaction: outResult.data!,
        inTransaction: inResult.data!
      },
      timestamp: new Date()
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    };
  }
}

// ============================================================================
// Stock Adjustment Operations
// ============================================================================

/**
 * Perform stock adjustment (inventory correction)
 *
 * Used for correcting inventory discrepancies found during cycle counts
 * or physical inventory audits.
 *
 * @param request - Adjustment request details
 * @returns Promise with adjustment result
 *
 * @example
 * ```typescript
 * // Adjust inventory up (found more than expected)
 * const increaseResult = await adjustStock({
 *   productCode: 'P001',
 *   warehouseCode: 'WH001',
 *   adjustmentQuantity: 10,
 *   reason: 'Physical count found 10 extra units',
 *   operator: 'inventory.auditor'
 * });
 *
 * // Adjust inventory down (found less than expected)
 * const decreaseResult = await adjustStock({
 *   productCode: 'P002',
 *   warehouseCode: 'WH001',
 *   adjustmentQuantity: -5,
 *   reason: 'Damaged units written off',
 *   operator: 'inventory.auditor'
 * });
 * ```
 */
async function adjustStock(
  request: StockAdjustmentRequest
): Promise<ApiResponse<Transaction>> {
  try {
    // Validate request
    if (request.adjustmentQuantity === 0) {
      throw new Error('Adjustment quantity cannot be zero');
    }

    if (!request.reason || request.reason.trim() === '') {
      throw new Error('Reason is required for stock adjustments');
    }

    // Get current stock level
    const currentStock = await getStockLevel(
      request.productCode,
      request.warehouseCode
    );

    // Calculate new stock level
    const newQuantity = currentStock.quantity + request.adjustmentQuantity;

    // Ensure stock doesn't go negative
    if (newQuantity < 0) {
      throw new Error(
        `Adjustment would result in negative stock! Current: ${currentStock.quantity}, Adjustment: ${request.adjustmentQuantity}`
      );
    }

    // Update stock level
    await updateStockLevel({
      productCode: request.productCode,
      warehouseCode: request.warehouseCode,
      quantity: newQuantity,
      lastUpdated: new Date()
    });

    // Record adjustment transaction
    const transaction: Transaction = {
      transactionType: TransactionType.ADJUSTMENT,
      productCode: request.productCode,
      warehouseCode: request.warehouseCode,
      quantity: Math.abs(request.adjustmentQuantity),
      operator: request.operator,
      notes: `${request.reason}${request.notes ? ' | ' + request.notes : ''}`,
      timestamp: new Date()
    };

    const savedTransaction = await saveTransaction(transaction);

    return {
      success: true,
      data: savedTransaction,
      timestamp: new Date()
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    };
  }
}

// ============================================================================
// Helper Functions (Mock implementations)
// ============================================================================

/**
 * Get product information by code
 */
async function getProduct(code: string): Promise<Product | null> {
  // Mock implementation - replace with actual database query
  return {
    code,
    name: 'Sample Product',
    unit: 'PCS',
    minQuantity: 10
  };
}

/**
 * Get warehouse information by code
 */
async function getWarehouse(code: string): Promise<Warehouse | null> {
  // Mock implementation - replace with actual database query
  return {
    code,
    name: 'Sample Warehouse',
    location: 'Sample Location'
  };
}

/**
 * Get current stock level
 */
async function getStockLevel(
  productCode: string,
  warehouseCode: string
): Promise<Stock> {
  // Mock implementation - replace with actual database query
  return {
    productCode,
    warehouseCode,
    quantity: 100
  };
}

/**
 * Update stock level in database
 */
async function updateStockLevel(stock: Stock): Promise<void> {
  // Mock implementation - replace with actual database update
  console.log('Updating stock level:', stock);
}

/**
 * Save transaction record to database
 */
async function saveTransaction(transaction: Transaction): Promise<Transaction> {
  // Mock implementation - replace with actual database insert
  return {
    id: Math.floor(Math.random() * 10000),
    ...transaction
  };
}

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Demonstrate various stock operations
 */
async function demonstrateStockOperations(): Promise<void> {
  console.log('=== Stock Operations Demo ===\n');

  // Example 1: Stock In
  console.log('1. Stock In Operation:');
  const stockInResult = await stockIn({
    productCode: 'P001',
    warehouseCode: 'WH001',
    quantity: 100,
    batchNo: 'BATCH-2025-001',
    reference: 'PO-2025-001',
    operator: 'john.doe',
    notes: 'Initial inventory received from supplier'
  });
  console.log('Result:', stockInResult);
  console.log();

  // Example 2: Stock Out
  console.log('2. Stock Out Operation:');
  const stockOutResult = await stockOut({
    productCode: 'P001',
    warehouseCode: 'WH001',
    quantity: 25,
    reference: 'SO-2025-001',
    operator: 'jane.smith',
    notes: 'Customer order #12345'
  });
  console.log('Result:', stockOutResult);
  console.log();

  // Example 3: Stock Transfer
  console.log('3. Stock Transfer Operation:');
  const transferResult = await transferStock({
    productCode: 'P001',
    fromWarehouse: 'WH001',
    toWarehouse: 'WH002',
    quantity: 30,
    reference: 'TRANS-2025-001',
    operator: 'warehouse.manager',
    notes: 'Rebalancing inventory across locations'
  });
  console.log('Result:', transferResult);
  console.log();

  // Example 4: Stock Adjustment (Increase)
  console.log('4. Stock Adjustment (Increase):');
  const adjustUpResult = await adjustStock({
    productCode: 'P001',
    warehouseCode: 'WH001',
    adjustmentQuantity: 5,
    reason: 'Physical count found 5 additional units',
    operator: 'inventory.auditor'
  });
  console.log('Result:', adjustUpResult);
  console.log();

  // Example 5: Stock Adjustment (Decrease)
  console.log('5. Stock Adjustment (Decrease):');
  const adjustDownResult = await adjustStock({
    productCode: 'P001',
    warehouseCode: 'WH001',
    adjustmentQuantity: -3,
    reason: 'Damaged units written off after quality inspection',
    operator: 'inventory.auditor',
    notes: 'Inspection report #QC-2025-001'
  });
  console.log('Result:', adjustDownResult);
}

// Run demo if this file is executed directly
if (require.main === module) {
  demonstrateStockOperations().catch(console.error);
}

// Export functions for use in other modules
export {
  stockIn,
  stockOut,
  transferStock,
  adjustStock,
  type Product,
  type Warehouse,
  type Stock,
  type Transaction,
  TransactionType,
  type StockInRequest,
  type StockOutRequest,
  type StockTransferRequest,
  type StockAdjustmentRequest,
  type ApiResponse
};
