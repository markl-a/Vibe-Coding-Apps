/**
 * Reorder Alerts and Purchase Suggestions
 *
 * This file demonstrates:
 * - Checking inventory against reorder points
 * - Generating automated purchase suggestions
 * - Sending alert notifications for low stock
 * - Managing reorder thresholds
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Product reorder configuration
 */
interface ReorderConfig {
  productCode: string;
  productName: string;
  minQuantity: number;        // Minimum stock level (reorder point)
  reorderQuantity: number;    // Standard reorder quantity
  maxQuantity?: number;       // Maximum stock level (optional)
  leadTimeDays?: number;      // Supplier lead time in days
  safetyStock?: number;       // Additional buffer stock
  preferredSupplier?: string;
}

/**
 * Low stock alert
 */
interface LowStockAlert {
  id?: string;
  productCode: string;
  productName: string;
  warehouseCode: string;
  warehouseName: string;
  currentQuantity: number;
  minQuantity: number;
  shortfall: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedOrderQuantity: number;
  estimatedCost?: number;
  preferredSupplier?: string;
  createdAt: Date;
  acknowledged?: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

/**
 * Purchase suggestion
 */
interface PurchaseSuggestion {
  id?: string;
  supplierCode: string;
  supplierName: string;
  items: PurchaseSuggestionItem[];
  totalEstimatedCost: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  suggestedBy: 'SYSTEM' | 'MANUAL';
  createdAt: Date;
  status: 'PENDING' | 'REVIEWED' | 'APPROVED' | 'REJECTED' | 'CONVERTED';
  convertedToPO?: string; // Purchase Order reference
}

/**
 * Individual item in purchase suggestion
 */
interface PurchaseSuggestionItem {
  productCode: string;
  productName: string;
  currentStock: number;
  minQuantity: number;
  suggestedQuantity: number;
  unitCost?: number;
  totalCost?: number;
  reason: string;
}

/**
 * Alert notification
 */
interface AlertNotification {
  id?: string;
  type: 'EMAIL' | 'SMS' | 'SYSTEM' | 'WEBHOOK';
  recipients: string[];
  subject: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  relatedAlerts?: string[];
  sentAt?: Date;
  status: 'PENDING' | 'SENT' | 'FAILED';
  error?: string;
}

/**
 * Reorder point calculation parameters
 */
interface ReorderPointParams {
  averageDailyUsage: number;
  leadTimeDays: number;
  safetyStockDays?: number;
  serviceLevelPercent?: number; // e.g., 95 for 95% service level
}

/**
 * Stock forecast data
 */
interface StockForecast {
  productCode: string;
  currentStock: number;
  averageDailyUsage: number;
  forecastedUsage: number[];  // Next N days
  projectedStockLevels: number[];
  estimatedStockoutDate?: Date;
  daysUntilStockout?: number;
}

// ============================================================================
// Reorder Point Checking
// ============================================================================

/**
 * Check all products against their reorder points
 *
 * @param warehouseCode - Optional: Check specific warehouse only
 * @returns Promise with array of low stock alerts
 *
 * @example
 * ```typescript
 * // Check all warehouses
 * const alerts = await checkReorderPoints();
 * console.log(`Found ${alerts.length} low stock items`);
 *
 * // Check specific warehouse
 * const warehouseAlerts = await checkReorderPoints('WH001');
 * ```
 */
async function checkReorderPoints(
  warehouseCode?: string
): Promise<LowStockAlert[]> {
  const alerts: LowStockAlert[] = [];

  // Get current stock levels
  const stockQuery = `
    SELECT
      s.product_code,
      p.name as product_name,
      s.warehouse_code,
      w.name as warehouse_name,
      s.quantity,
      p.min_quantity,
      p.reorder_quantity,
      p.preferred_supplier
    FROM stock s
    JOIN products p ON s.product_code = p.code
    JOIN warehouses w ON s.warehouse_code = w.code
    WHERE p.min_quantity > 0
      ${warehouseCode ? 'AND s.warehouse_code = ?' : ''}
    ORDER BY s.product_code, s.warehouse_code
  `;

  const params = warehouseCode ? [warehouseCode] : [];
  const results = await executeQuery(stockQuery, params);

  for (const row of results) {
    const currentQty = row.quantity;
    const minQty = row.min_quantity;

    // Check if current stock is below reorder point
    if (currentQty < minQty) {
      const shortfall = minQty - currentQty;
      const percentageBelow = ((minQty - currentQty) / minQty) * 100;

      // Determine severity based on how far below reorder point
      let severity: LowStockAlert['severity'];
      if (currentQty === 0) {
        severity = 'CRITICAL';
      } else if (percentageBelow >= 75) {
        severity = 'HIGH';
      } else if (percentageBelow >= 50) {
        severity = 'MEDIUM';
      } else {
        severity = 'LOW';
      }

      // Calculate recommended order quantity
      const recommendedQty = Math.max(
        row.reorder_quantity || minQty,
        shortfall
      );

      const alert: LowStockAlert = {
        id: generateAlertId(),
        productCode: row.product_code,
        productName: row.product_name,
        warehouseCode: row.warehouse_code,
        warehouseName: row.warehouse_name,
        currentQuantity: currentQty,
        minQuantity: minQty,
        shortfall,
        severity,
        recommendedOrderQuantity: recommendedQty,
        preferredSupplier: row.preferred_supplier,
        createdAt: new Date(),
        acknowledged: false
      };

      // Get estimated cost if available
      const costData = await getProductCostData(row.product_code);
      if (costData) {
        alert.estimatedCost = costData.unitCost * recommendedQty;
      }

      alerts.push(alert);
    }
  }

  return alerts;
}

/**
 * Calculate optimal reorder point using statistical methods
 *
 * @param params - Calculation parameters
 * @returns Calculated reorder point quantity
 *
 * @example
 * ```typescript
 * const reorderPoint = calculateReorderPoint({
 *   averageDailyUsage: 5,
 *   leadTimeDays: 7,
 *   safetyStockDays: 3,
 *   serviceLevelPercent: 95
 * });
 * console.log(`Reorder point: ${reorderPoint} units`);
 * ```
 */
function calculateReorderPoint(params: ReorderPointParams): number {
  const {
    averageDailyUsage,
    leadTimeDays,
    safetyStockDays = 0,
    serviceLevelPercent = 95
  } = params;

  // Basic formula: (Average Daily Usage × Lead Time) + Safety Stock
  const leadTimeUsage = averageDailyUsage * leadTimeDays;
  const safetyStock = averageDailyUsage * safetyStockDays;

  // Adjust for service level (simplified - would use z-score in production)
  const serviceLevelMultiplier = serviceLevelPercent >= 95 ? 1.1 : 1.0;

  const reorderPoint = Math.ceil(
    (leadTimeUsage + safetyStock) * serviceLevelMultiplier
  );

  return reorderPoint;
}

/**
 * Forecast stock levels and predict stockout dates
 *
 * @param productCode - Product to forecast
 * @param warehouseCode - Warehouse location
 * @param forecastDays - Number of days to forecast
 * @returns Promise with stock forecast
 *
 * @example
 * ```typescript
 * const forecast = await forecastStockLevels('P001', 'WH001', 30);
 * if (forecast.estimatedStockoutDate) {
 *   console.log(`Stock will run out on ${forecast.estimatedStockoutDate}`);
 * }
 * ```
 */
async function forecastStockLevels(
  productCode: string,
  warehouseCode: string,
  forecastDays: number = 30
): Promise<StockForecast> {
  // Get current stock
  const currentStock = await getCurrentStock(productCode, warehouseCode);

  // Calculate average daily usage from transaction history (last 30 days)
  const usageHistory = await getUsageHistory(productCode, warehouseCode, 30);
  const averageDailyUsage = usageHistory.reduce((sum, day) => sum + day, 0) / usageHistory.length;

  // Project future stock levels
  const projectedStockLevels: number[] = [];
  const forecastedUsage: number[] = [];
  let estimatedStockoutDate: Date | undefined;
  let daysUntilStockout: number | undefined;

  let currentLevel = currentStock;
  for (let day = 1; day <= forecastDays; day++) {
    // Use average daily usage (could be enhanced with trend analysis)
    const dailyUsage = averageDailyUsage;
    forecastedUsage.push(dailyUsage);

    currentLevel -= dailyUsage;
    projectedStockLevels.push(Math.max(0, currentLevel));

    // Check if stockout occurs
    if (currentLevel <= 0 && !estimatedStockoutDate) {
      estimatedStockoutDate = new Date();
      estimatedStockoutDate.setDate(estimatedStockoutDate.getDate() + day);
      daysUntilStockout = day;
    }
  }

  return {
    productCode,
    currentStock,
    averageDailyUsage,
    forecastedUsage,
    projectedStockLevels,
    estimatedStockoutDate,
    daysUntilStockout
  };
}

// ============================================================================
// Purchase Suggestions
// ============================================================================

/**
 * Generate automated purchase suggestions based on low stock alerts
 *
 * @param alerts - Low stock alerts to process
 * @returns Promise with purchase suggestions grouped by supplier
 *
 * @example
 * ```typescript
 * const alerts = await checkReorderPoints();
 * const suggestions = await generatePurchaseSuggestions(alerts);
 * console.log(`Generated ${suggestions.length} purchase suggestions`);
 * ```
 */
async function generatePurchaseSuggestions(
  alerts: LowStockAlert[]
): Promise<PurchaseSuggestion[]> {
  // Group alerts by preferred supplier
  const supplierMap = new Map<string, LowStockAlert[]>();

  for (const alert of alerts) {
    const supplier = alert.preferredSupplier || 'DEFAULT_SUPPLIER';

    if (!supplierMap.has(supplier)) {
      supplierMap.set(supplier, []);
    }
    supplierMap.get(supplier)!.push(alert);
  }

  // Create purchase suggestions for each supplier
  const suggestions: PurchaseSuggestion[] = [];

  for (const [supplierCode, supplierAlerts] of supplierMap) {
    const supplierInfo = await getSupplierInfo(supplierCode);

    const items: PurchaseSuggestionItem[] = [];
    let totalCost = 0;
    let maxPriority: PurchaseSuggestion['priority'] = 'LOW';

    for (const alert of supplierAlerts) {
      const costData = await getProductCostData(alert.productCode);
      const itemCost = costData ? costData.unitCost * alert.recommendedOrderQuantity : 0;

      items.push({
        productCode: alert.productCode,
        productName: alert.productName,
        currentStock: alert.currentQuantity,
        minQuantity: alert.minQuantity,
        suggestedQuantity: alert.recommendedOrderQuantity,
        unitCost: costData?.unitCost,
        totalCost: itemCost,
        reason: `Low stock: ${alert.currentQuantity} < ${alert.minQuantity} (${alert.severity})`
      });

      totalCost += itemCost;

      // Determine overall priority based on highest severity
      if (alert.severity === 'CRITICAL' && maxPriority !== 'URGENT') {
        maxPriority = 'URGENT';
      } else if (alert.severity === 'HIGH' && maxPriority === 'LOW') {
        maxPriority = 'HIGH';
      } else if (alert.severity === 'MEDIUM' && maxPriority === 'LOW') {
        maxPriority = 'MEDIUM';
      }
    }

    suggestions.push({
      id: generateSuggestionId(),
      supplierCode,
      supplierName: supplierInfo?.name || supplierCode,
      items,
      totalEstimatedCost: totalCost,
      priority: maxPriority,
      suggestedBy: 'SYSTEM',
      createdAt: new Date(),
      status: 'PENDING'
    });
  }

  // Sort by priority (URGENT first)
  suggestions.sort((a, b) => {
    const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return suggestions;
}

/**
 * Create manual purchase suggestion
 *
 * @param items - Items to include in suggestion
 * @param supplierCode - Target supplier
 * @returns Promise with created suggestion
 *
 * @example
 * ```typescript
 * const suggestion = await createManualPurchaseSuggestion(
 *   [
 *     {
 *       productCode: 'P001',
 *       suggestedQuantity: 100,
 *       reason: 'Upcoming promotion expected to increase demand'
 *     }
 *   ],
 *   'SUP001'
 * );
 * ```
 */
async function createManualPurchaseSuggestion(
  items: Array<{ productCode: string; suggestedQuantity: number; reason: string }>,
  supplierCode: string
): Promise<PurchaseSuggestion> {
  const supplierInfo = await getSupplierInfo(supplierCode);
  const suggestionItems: PurchaseSuggestionItem[] = [];
  let totalCost = 0;

  for (const item of items) {
    const product = await getProduct(item.productCode);
    const stock = await getCurrentStock(item.productCode);
    const costData = await getProductCostData(item.productCode);
    const itemCost = costData ? costData.unitCost * item.suggestedQuantity : 0;

    suggestionItems.push({
      productCode: item.productCode,
      productName: product?.name || item.productCode,
      currentStock: stock,
      minQuantity: product?.minQuantity || 0,
      suggestedQuantity: item.suggestedQuantity,
      unitCost: costData?.unitCost,
      totalCost: itemCost,
      reason: item.reason
    });

    totalCost += itemCost;
  }

  return {
    id: generateSuggestionId(),
    supplierCode,
    supplierName: supplierInfo?.name || supplierCode,
    items: suggestionItems,
    totalEstimatedCost: totalCost,
    priority: 'MEDIUM',
    suggestedBy: 'MANUAL',
    createdAt: new Date(),
    status: 'PENDING'
  };
}

// ============================================================================
// Alert Notifications
// ============================================================================

/**
 * Send alert notifications for low stock items
 *
 * @param alerts - Alerts to send notifications for
 * @param recipients - List of email addresses or phone numbers
 * @returns Promise with notification results
 *
 * @example
 * ```typescript
 * const alerts = await checkReorderPoints();
 * const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL');
 *
 * await sendAlertNotifications(criticalAlerts, [
 *   'purchasing@company.com',
 *   'warehouse@company.com'
 * ]);
 * ```
 */
async function sendAlertNotifications(
  alerts: LowStockAlert[],
  recipients: string[]
): Promise<AlertNotification[]> {
  const notifications: AlertNotification[] = [];

  // Group alerts by severity
  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL');
  const highAlerts = alerts.filter(a => a.severity === 'HIGH');
  const otherAlerts = alerts.filter(a => ['MEDIUM', 'LOW'].includes(a.severity));

  // Send critical alerts immediately
  if (criticalAlerts.length > 0) {
    const notification: AlertNotification = {
      id: generateNotificationId(),
      type: 'EMAIL',
      recipients,
      subject: `URGENT: ${criticalAlerts.length} Critical Stock Shortage(s)`,
      message: formatAlertMessage(criticalAlerts, 'CRITICAL'),
      priority: 'CRITICAL',
      relatedAlerts: criticalAlerts.map(a => a.id!),
      status: 'PENDING'
    };

    await sendNotification(notification);
    notifications.push(notification);
  }

  // Send high priority alerts
  if (highAlerts.length > 0) {
    const notification: AlertNotification = {
      id: generateNotificationId(),
      type: 'EMAIL',
      recipients,
      subject: `Alert: ${highAlerts.length} High Priority Low Stock Item(s)`,
      message: formatAlertMessage(highAlerts, 'HIGH'),
      priority: 'HIGH',
      relatedAlerts: highAlerts.map(a => a.id!),
      status: 'PENDING'
    };

    await sendNotification(notification);
    notifications.push(notification);
  }

  // Send daily digest for medium/low alerts
  if (otherAlerts.length > 0) {
    const notification: AlertNotification = {
      id: generateNotificationId(),
      type: 'EMAIL',
      recipients,
      subject: `Daily Inventory Report: ${otherAlerts.length} Low Stock Item(s)`,
      message: formatAlertMessage(otherAlerts, 'MEDIUM'),
      priority: 'MEDIUM',
      relatedAlerts: otherAlerts.map(a => a.id!),
      status: 'PENDING'
    };

    await sendNotification(notification);
    notifications.push(notification);
  }

  return notifications;
}

/**
 * Format alert message for notification
 */
function formatAlertMessage(
  alerts: LowStockAlert[],
  severity: string
): string {
  let message = `Low Stock Alert - ${severity} Priority\n\n`;
  message += `Found ${alerts.length} item(s) below reorder point:\n\n`;

  alerts.forEach(alert => {
    message += `Product: ${alert.productName} (${alert.productCode})\n`;
    message += `Warehouse: ${alert.warehouseName}\n`;
    message += `Current Stock: ${alert.currentQuantity}\n`;
    message += `Minimum Level: ${alert.minQuantity}\n`;
    message += `Shortfall: ${alert.shortfall}\n`;
    message += `Recommended Order: ${alert.recommendedOrderQuantity} units\n`;
    if (alert.estimatedCost) {
      message += `Estimated Cost: $${alert.estimatedCost.toFixed(2)}\n`;
    }
    message += '\n';
  });

  message += '\nPlease review and take appropriate action.';
  return message;
}

// ============================================================================
// Helper Functions (Mock implementations)
// ============================================================================

async function executeQuery(query: string, params: any[]): Promise<any[]> {
  // Mock implementation
  return [
    {
      product_code: 'P001',
      product_name: 'Widget A',
      warehouse_code: 'WH001',
      warehouse_name: 'Main Warehouse',
      quantity: 15,
      min_quantity: 50,
      reorder_quantity: 100,
      preferred_supplier: 'SUP001'
    }
  ];
}

async function getCurrentStock(productCode: string, warehouseCode?: string): Promise<number> {
  return 25; // Mock
}

async function getUsageHistory(productCode: string, warehouseCode: string, days: number): Promise<number[]> {
  // Mock: Return array of daily usage for past N days
  return Array(days).fill(0).map(() => Math.random() * 10 + 5);
}

async function getProduct(productCode: string): Promise<any> {
  return { code: productCode, name: 'Sample Product', minQuantity: 50 };
}

async function getSupplierInfo(supplierCode: string): Promise<any> {
  return { code: supplierCode, name: 'Sample Supplier' };
}

async function getProductCostData(productCode: string): Promise<any> {
  return { unitCost: 10.50, lastPurchaseDate: new Date() };
}

async function sendNotification(notification: AlertNotification): Promise<void> {
  console.log(`Sending notification: ${notification.subject}`);
  notification.status = 'SENT';
  notification.sentAt = new Date();
}

function generateAlertId(): string {
  return `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateSuggestionId(): string {
  return `SUGG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateNotificationId(): string {
  return `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Example Usage
// ============================================================================

async function demonstrateReorderAlerts(): Promise<void> {
  console.log('=== Reorder Alerts Demo ===\n');

  // Example 1: Check Reorder Points
  console.log('1. Checking Reorder Points:');
  const alerts = await checkReorderPoints();
  console.log(`Found ${alerts.length} low stock alert(s)`);
  alerts.forEach(alert => {
    console.log(
      `  - ${alert.productName}: ${alert.currentQuantity}/${alert.minQuantity} [${alert.severity}]`
    );
  });
  console.log();

  // Example 2: Calculate Optimal Reorder Point
  console.log('2. Calculate Optimal Reorder Point:');
  const reorderPoint = calculateReorderPoint({
    averageDailyUsage: 5,
    leadTimeDays: 7,
    safetyStockDays: 3,
    serviceLevelPercent: 95
  });
  console.log(`  Calculated reorder point: ${reorderPoint} units`);
  console.log();

  // Example 3: Forecast Stock Levels
  console.log('3. Stock Forecast (Next 30 Days):');
  const forecast = await forecastStockLevels('P001', 'WH001', 30);
  console.log(`  Current Stock: ${forecast.currentStock}`);
  console.log(`  Average Daily Usage: ${forecast.averageDailyUsage.toFixed(2)}`);
  if (forecast.estimatedStockoutDate) {
    console.log(`  Estimated Stockout: ${forecast.estimatedStockoutDate.toDateString()}`);
    console.log(`  Days Until Stockout: ${forecast.daysUntilStockout}`);
  }
  console.log();

  // Example 4: Generate Purchase Suggestions
  console.log('4. Generate Purchase Suggestions:');
  const suggestions = await generatePurchaseSuggestions(alerts);
  console.log(`Generated ${suggestions.length} purchase suggestion(s)`);
  suggestions.forEach(sugg => {
    console.log(`  Supplier: ${sugg.supplierName} [${sugg.priority}]`);
    console.log(`  Items: ${sugg.items.length}, Total: $${sugg.totalEstimatedCost.toFixed(2)}`);
  });
  console.log();

  // Example 5: Send Alert Notifications
  console.log('5. Sending Alert Notifications:');
  const notifications = await sendAlertNotifications(alerts, [
    'purchasing@company.com',
    'warehouse@company.com'
  ]);
  console.log(`Sent ${notifications.length} notification(s)`);
}

// Run demo if this file is executed directly
if (require.main === module) {
  demonstrateReorderAlerts().catch(console.error);
}

// Export functions
export {
  checkReorderPoints,
  calculateReorderPoint,
  forecastStockLevels,
  generatePurchaseSuggestions,
  createManualPurchaseSuggestion,
  sendAlertNotifications,
  type ReorderConfig,
  type LowStockAlert,
  type PurchaseSuggestion,
  type PurchaseSuggestionItem,
  type AlertNotification,
  type ReorderPointParams,
  type StockForecast
};
