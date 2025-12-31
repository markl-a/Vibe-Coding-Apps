/**
 * Vendor Management Examples
 *
 * This file demonstrates:
 * - Adding and updating vendor information
 * - Vendor performance tracking and metrics
 * - Preferred vendor selection and scoring
 * - Vendor categorization and compliance
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Vendor/Supplier basic information
 */
interface Vendor {
  code: string;
  name: string;
  legalName?: string;
  taxId?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  paymentTerms?: string;
  currency?: string;
  rating?: number; // 1-5
  status: VendorStatus;
  categories?: string[];
  certifications?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Vendor status
 */
enum VendorStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  BLACKLISTED = 'BLACKLISTED'
}

/**
 * Vendor performance metrics
 */
interface VendorPerformance {
  vendorCode: string;
  vendorName: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalOrderValue: number;
  averageOrderValue: number;
  onTimeDeliveryRate: number; // Percentage
  qualityRating: number; // 1-5
  responseTime: number; // Average hours to respond
  defectRate: number; // Percentage
  returnRate: number; // Percentage
  complianceScore: number; // 1-100
  lastOrderDate?: Date;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Vendor scoring criteria
 */
interface VendorScoringCriteria {
  priceWeight: number;
  qualityWeight: number;
  deliveryWeight: number;
  serviceWeight: number;
  complianceWeight: number;
}

/**
 * Vendor score card
 */
interface VendorScoreCard {
  vendorCode: string;
  vendorName: string;
  priceScore: number; // 0-100
  qualityScore: number; // 0-100
  deliveryScore: number; // 0-100
  serviceScore: number; // 0-100
  complianceScore: number; // 0-100
  totalScore: number; // Weighted average
  rank?: number;
  category: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
  calculatedAt: Date;
}

/**
 * Vendor product catalog entry
 */
interface VendorProduct {
  id?: number;
  vendorCode: string;
  productCode: string;
  vendorSKU?: string;
  productName: string;
  description?: string;
  unitPrice: number;
  currency?: string;
  minimumOrderQuantity?: number;
  leadTimeDays?: number;
  isPreferred?: boolean;
  lastPriceUpdate?: Date;
}

/**
 * Vendor comparison for a product
 */
interface VendorComparison {
  productCode: string;
  productName: string;
  vendors: Array<{
    vendorCode: string;
    vendorName: string;
    vendorRating: number;
    unitPrice: number;
    leadTimeDays: number;
    minimumOrderQuantity: number;
    totalCost: number; // For requested quantity
    score: number; // Overall score
    isPreferred: boolean;
  }>;
  recommendedVendor: string;
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
// Vendor Management
// ============================================================================

/**
 * Add a new vendor to the system
 *
 * @param vendor - Vendor information
 * @returns Promise with created vendor
 *
 * @example
 * ```typescript
 * const vendor = await addVendor({
 *   code: 'VEN001',
 *   name: 'ABC Supplies Inc.',
 *   legalName: 'ABC Supplies Incorporated',
 *   taxId: '12-3456789',
 *   contactPerson: 'John Smith',
 *   email: 'john@abcsupplies.com',
 *   phone: '+1-555-0123',
 *   address: '123 Industrial Parkway',
 *   city: 'Chicago',
 *   state: 'IL',
 *   country: 'USA',
 *   postalCode: '60601',
 *   paymentTerms: 'Net 30',
 *   currency: 'USD',
 *   status: VendorStatus.ACTIVE,
 *   categories: ['ELECTRONICS', 'HARDWARE'],
 *   certifications: ['ISO9001', 'ISO14001']
 * });
 * ```
 */
async function addVendor(vendor: Vendor): Promise<ApiResponse<Vendor>> {
  try {
    // Validate vendor data
    const validation = validateVendorData(vendor);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Check if vendor code already exists
    const existing = await getVendor(vendor.code);
    if (existing) {
      throw new Error(`Vendor with code ${vendor.code} already exists`);
    }

    // Set timestamps
    vendor.createdAt = new Date();
    vendor.updatedAt = new Date();

    // Save to database
    const savedVendor = await saveVendor(vendor);

    return {
      success: true,
      data: savedVendor,
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

/**
 * Update existing vendor information
 *
 * @param code - Vendor code
 * @param updates - Fields to update
 * @returns Promise with updated vendor
 *
 * @example
 * ```typescript
 * const updated = await updateVendor('VEN001', {
 *   phone: '+1-555-9999',
 *   email: 'newcontact@abcsupplies.com',
 *   rating: 4
 * });
 * ```
 */
async function updateVendor(
  code: string,
  updates: Partial<Vendor>
): Promise<ApiResponse<Vendor>> {
  try {
    // Get existing vendor
    const vendor = await getVendor(code);
    if (!vendor) {
      throw new Error(`Vendor ${code} not found`);
    }

    // Merge updates
    const updatedVendor: Vendor = {
      ...vendor,
      ...updates,
      code: vendor.code, // Prevent code changes
      updatedAt: new Date()
    };

    // Validate updated data
    const validation = validateVendorData(updatedVendor);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Save to database
    const saved = await saveVendor(updatedVendor);

    return {
      success: true,
      data: saved,
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

/**
 * Validate vendor data
 */
function validateVendorData(vendor: Vendor): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!vendor.code || vendor.code.trim() === '') {
    errors.push('Vendor code is required');
  }

  if (!vendor.name || vendor.name.trim() === '') {
    errors.push('Vendor name is required');
  }

  if (vendor.email && !isValidEmail(vendor.email)) {
    errors.push('Invalid email format');
  }

  if (vendor.rating && (vendor.rating < 1 || vendor.rating > 5)) {
    errors.push('Rating must be between 1 and 5');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get all vendors with optional filtering
 *
 * @param filters - Optional filter criteria
 * @returns Promise with vendor list
 *
 * @example
 * ```typescript
 * // Get all active vendors
 * const activeVendors = await getAllVendors({ status: VendorStatus.ACTIVE });
 *
 * // Get vendors in specific category
 * const electronicsVendors = await getAllVendors({ category: 'ELECTRONICS' });
 * ```
 */
async function getAllVendors(filters?: {
  status?: VendorStatus;
  category?: string;
  minRating?: number;
}): Promise<Vendor[]> {
  let query = 'SELECT * FROM vendors WHERE 1=1';
  const params: any[] = [];

  if (filters?.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters?.category) {
    query += ' AND categories LIKE ?';
    params.push(`%${filters.category}%`);
  }

  if (filters?.minRating) {
    query += ' AND rating >= ?';
    params.push(filters.minRating);
  }

  query += ' ORDER BY name';

  const results = await executeQuery(query, params);
  return results.map(mapRowToVendor);
}

// ============================================================================
// Vendor Performance Metrics
// ============================================================================

/**
 * Calculate vendor performance metrics
 *
 * @param vendorCode - Vendor code
 * @param startDate - Period start date
 * @param endDate - Period end date
 * @returns Promise with performance metrics
 *
 * @example
 * ```typescript
 * const performance = await getVendorPerformance(
 *   'VEN001',
 *   new Date('2025-01-01'),
 *   new Date('2025-12-31')
 * );
 *
 * console.log(`On-time delivery: ${performance.onTimeDeliveryRate}%`);
 * console.log(`Quality rating: ${performance.qualityRating}/5`);
 * ```
 */
async function getVendorPerformance(
  vendorCode: string,
  startDate: Date,
  endDate: Date
): Promise<ApiResponse<VendorPerformance>> {
  try {
    const vendor = await getVendor(vendorCode);
    if (!vendor) {
      throw new Error(`Vendor ${vendorCode} not found`);
    }

    // Query order statistics
    const orderStats = await getOrderStatistics(vendorCode, startDate, endDate);

    // Calculate on-time delivery rate
    const deliveryStats = await getDeliveryStatistics(vendorCode, startDate, endDate);
    const onTimeDeliveryRate = deliveryStats.totalDeliveries > 0
      ? (deliveryStats.onTimeDeliveries / deliveryStats.totalDeliveries) * 100
      : 0;

    // Get quality metrics
    const qualityStats = await getQualityStatistics(vendorCode, startDate, endDate);

    // Calculate average response time
    const communicationStats = await getCommunicationStatistics(vendorCode, startDate, endDate);

    const performance: VendorPerformance = {
      vendorCode,
      vendorName: vendor.name,
      totalOrders: orderStats.totalOrders,
      completedOrders: orderStats.completedOrders,
      cancelledOrders: orderStats.cancelledOrders,
      totalOrderValue: orderStats.totalValue,
      averageOrderValue: orderStats.totalOrders > 0
        ? orderStats.totalValue / orderStats.totalOrders
        : 0,
      onTimeDeliveryRate,
      qualityRating: qualityStats.averageRating,
      responseTime: communicationStats.averageResponseHours,
      defectRate: qualityStats.defectRate,
      returnRate: qualityStats.returnRate,
      complianceScore: await calculateComplianceScore(vendorCode),
      lastOrderDate: orderStats.lastOrderDate,
      periodStart: startDate,
      periodEnd: endDate
    };

    return {
      success: true,
      data: performance,
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

/**
 * Generate vendor scorecard
 *
 * @param vendorCode - Vendor code
 * @param criteria - Scoring criteria (weights)
 * @returns Promise with scorecard
 *
 * @example
 * ```typescript
 * const scorecard = await generateVendorScorecard('VEN001', {
 *   priceWeight: 0.30,
 *   qualityWeight: 0.25,
 *   deliveryWeight: 0.25,
 *   serviceWeight: 0.10,
 *   complianceWeight: 0.10
 * });
 * ```
 */
async function generateVendorScorecard(
  vendorCode: string,
  criteria: VendorScoringCriteria
): Promise<ApiResponse<VendorScoreCard>> {
  try {
    const vendor = await getVendor(vendorCode);
    if (!vendor) {
      throw new Error(`Vendor ${vendorCode} not found`);
    }

    // Get performance data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12); // Last 12 months

    const performanceResult = await getVendorPerformance(vendorCode, startDate, endDate);
    if (!performanceResult.success || !performanceResult.data) {
      throw new Error('Failed to get performance data');
    }

    const performance = performanceResult.data;

    // Calculate individual scores (0-100)
    const priceScore = await calculatePriceCompetitiveness(vendorCode);
    const qualityScore = (performance.qualityRating / 5) * 100;
    const deliveryScore = performance.onTimeDeliveryRate;
    const serviceScore = calculateServiceScore(performance.responseTime);
    const complianceScore = performance.complianceScore;

    // Calculate weighted total score
    const totalScore =
      (priceScore * criteria.priceWeight) +
      (qualityScore * criteria.qualityWeight) +
      (deliveryScore * criteria.deliveryWeight) +
      (serviceScore * criteria.serviceWeight) +
      (complianceScore * criteria.complianceWeight);

    // Determine category
    let category: VendorScoreCard['category'];
    if (totalScore >= 90) category = 'EXCELLENT';
    else if (totalScore >= 75) category = 'GOOD';
    else if (totalScore >= 60) category = 'AVERAGE';
    else category = 'POOR';

    const scorecard: VendorScoreCard = {
      vendorCode,
      vendorName: vendor.name,
      priceScore,
      qualityScore,
      deliveryScore,
      serviceScore,
      complianceScore,
      totalScore,
      category,
      calculatedAt: new Date()
    };

    return {
      success: true,
      data: scorecard,
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
// Preferred Vendor Selection
// ============================================================================

/**
 * Compare vendors for a specific product
 *
 * @param productCode - Product code to compare
 * @param quantity - Quantity needed
 * @returns Promise with vendor comparison
 *
 * @example
 * ```typescript
 * const comparison = await compareVendorsForProduct('P001', 100);
 * console.log(`Recommended vendor: ${comparison.recommendedVendor}`);
 * comparison.vendors.forEach(v => {
 *   console.log(`${v.vendorName}: $${v.unitPrice} (score: ${v.score})`);
 * });
 * ```
 */
async function compareVendorsForProduct(
  productCode: string,
  quantity: number
): Promise<ApiResponse<VendorComparison>> {
  try {
    // Get all vendors who supply this product
    const vendorProducts = await getVendorProductCatalog(productCode);

    if (vendorProducts.length === 0) {
      throw new Error(`No vendors found for product ${productCode}`);
    }

    const comparison: VendorComparison = {
      productCode,
      productName: vendorProducts[0].productName,
      vendors: [],
      recommendedVendor: ''
    };

    // Default scoring criteria
    const criteria: VendorScoringCriteria = {
      priceWeight: 0.40,
      qualityWeight: 0.20,
      deliveryWeight: 0.20,
      serviceWeight: 0.10,
      complianceWeight: 0.10
    };

    let bestScore = 0;
    let bestVendor = '';

    for (const vp of vendorProducts) {
      const vendor = await getVendor(vp.vendorCode);
      if (!vendor || vendor.status !== VendorStatus.ACTIVE) {
        continue;
      }

      // Get vendor scorecard
      const scorecardResult = await generateVendorScorecard(vp.vendorCode, criteria);
      const scorecard = scorecardResult.data;

      if (!scorecard) continue;

      // Calculate total cost for quantity
      const totalCost = vp.unitPrice * Math.max(quantity, vp.minimumOrderQuantity || 0);

      const vendorInfo = {
        vendorCode: vp.vendorCode,
        vendorName: vendor.name,
        vendorRating: vendor.rating || 0,
        unitPrice: vp.unitPrice,
        leadTimeDays: vp.leadTimeDays || 0,
        minimumOrderQuantity: vp.minimumOrderQuantity || 0,
        totalCost,
        score: scorecard.totalScore,
        isPreferred: vp.isPreferred || false
      };

      comparison.vendors.push(vendorInfo);

      // Track best vendor
      if (scorecard.totalScore > bestScore) {
        bestScore = scorecard.totalScore;
        bestVendor = vp.vendorCode;
      }
    }

    // Sort by score (descending)
    comparison.vendors.sort((a, b) => b.score - a.score);
    comparison.recommendedVendor = bestVendor;

    return {
      success: true,
      data: comparison,
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

/**
 * Set preferred vendor for a product
 *
 * @param productCode - Product code
 * @param vendorCode - Vendor code
 * @returns Promise with result
 *
 * @example
 * ```typescript
 * await setPreferredVendor('P001', 'VEN001');
 * ```
 */
async function setPreferredVendor(
  productCode: string,
  vendorCode: string
): Promise<ApiResponse<void>> {
  try {
    // Clear existing preferred vendors for this product
    await clearPreferredVendors(productCode);

    // Set new preferred vendor
    await updateVendorProduct(vendorCode, productCode, { isPreferred: true });

    return {
      success: true,
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

async function getVendor(code: string): Promise<Vendor | null> {
  // Mock implementation
  return {
    code,
    name: 'Sample Vendor Inc.',
    contactPerson: 'John Doe',
    email: 'john@vendor.com',
    phone: '+1-555-0123',
    status: VendorStatus.ACTIVE,
    rating: 4,
    paymentTerms: 'Net 30'
  };
}

async function saveVendor(vendor: Vendor): Promise<Vendor> {
  // Mock implementation
  return vendor;
}

async function executeQuery(query: string, params: any[]): Promise<any[]> {
  // Mock implementation
  return [];
}

function mapRowToVendor(row: any): Vendor {
  return {
    code: row.code,
    name: row.name,
    status: row.status as VendorStatus,
    rating: row.rating
  };
}

async function getOrderStatistics(vendorCode: string, startDate: Date, endDate: Date): Promise<any> {
  return {
    totalOrders: 50,
    completedOrders: 45,
    cancelledOrders: 5,
    totalValue: 125000,
    lastOrderDate: new Date()
  };
}

async function getDeliveryStatistics(vendorCode: string, startDate: Date, endDate: Date): Promise<any> {
  return {
    totalDeliveries: 45,
    onTimeDeliveries: 40
  };
}

async function getQualityStatistics(vendorCode: string, startDate: Date, endDate: Date): Promise<any> {
  return {
    averageRating: 4.2,
    defectRate: 2.5,
    returnRate: 1.2
  };
}

async function getCommunicationStatistics(vendorCode: string, startDate: Date, endDate: Date): Promise<any> {
  return {
    averageResponseHours: 4.5
  };
}

async function calculateComplianceScore(vendorCode: string): Promise<number> {
  return 85;
}

async function calculatePriceCompetitiveness(vendorCode: string): Promise<number> {
  return 78;
}

function calculateServiceScore(responseTime: number): number {
  // Better (lower) response time = higher score
  if (responseTime <= 2) return 100;
  if (responseTime <= 4) return 90;
  if (responseTime <= 8) return 75;
  if (responseTime <= 24) return 60;
  return 40;
}

async function getVendorProductCatalog(productCode: string): Promise<VendorProduct[]> {
  return [
    {
      vendorCode: 'VEN001',
      productCode,
      productName: 'Sample Product',
      unitPrice: 10.50,
      leadTimeDays: 7,
      minimumOrderQuantity: 50,
      isPreferred: true
    }
  ];
}

async function clearPreferredVendors(productCode: string): Promise<void> {
  console.log(`Clearing preferred vendors for ${productCode}`);
}

async function updateVendorProduct(vendorCode: string, productCode: string, updates: any): Promise<void> {
  console.log(`Updating vendor product: ${vendorCode} - ${productCode}`);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================================================
// Example Usage
// ============================================================================

async function demonstrateVendorManagement(): Promise<void> {
  console.log('=== Vendor Management Demo ===\n');

  // Example 1: Add new vendor
  console.log('1. Add New Vendor:');
  const addResult = await addVendor({
    code: 'VEN001',
    name: 'ABC Supplies Inc.',
    contactPerson: 'John Smith',
    email: 'john@abcsupplies.com',
    phone: '+1-555-0123',
    status: VendorStatus.ACTIVE,
    paymentTerms: 'Net 30',
    rating: 4,
    categories: ['ELECTRONICS', 'HARDWARE']
  });
  console.log(addResult.success ? 'Vendor added successfully' : 'Failed to add vendor');
  console.log();

  // Example 2: Get vendor performance
  console.log('2. Vendor Performance Metrics:');
  const perfResult = await getVendorPerformance(
    'VEN001',
    new Date('2025-01-01'),
    new Date('2025-12-31')
  );
  if (perfResult.success && perfResult.data) {
    const perf = perfResult.data;
    console.log(`  Total Orders: ${perf.totalOrders}`);
    console.log(`  On-Time Delivery: ${perf.onTimeDeliveryRate.toFixed(1)}%`);
    console.log(`  Quality Rating: ${perf.qualityRating.toFixed(1)}/5`);
  }
  console.log();

  // Example 3: Generate scorecard
  console.log('3. Vendor Scorecard:');
  const scorecardResult = await generateVendorScorecard('VEN001', {
    priceWeight: 0.30,
    qualityWeight: 0.25,
    deliveryWeight: 0.25,
    serviceWeight: 0.10,
    complianceWeight: 0.10
  });
  if (scorecardResult.success && scorecardResult.data) {
    const sc = scorecardResult.data;
    console.log(`  Total Score: ${sc.totalScore.toFixed(1)}/100`);
    console.log(`  Category: ${sc.category}`);
  }
  console.log();

  // Example 4: Compare vendors for product
  console.log('4. Vendor Comparison:');
  const compResult = await compareVendorsForProduct('P001', 100);
  if (compResult.success && compResult.data) {
    console.log(`  Recommended: ${compResult.data.recommendedVendor}`);
    console.log(`  Options: ${compResult.data.vendors.length} vendors available`);
  }
  console.log();

  // Example 5: Update vendor
  console.log('5. Update Vendor:');
  const updateResult = await updateVendor('VEN001', {
    rating: 5,
    phone: '+1-555-9999'
  });
  console.log(updateResult.success ? 'Vendor updated successfully' : 'Failed to update vendor');
}

// Run demo if this file is executed directly
if (require.main === module) {
  demonstrateVendorManagement().catch(console.error);
}

// Export functions
export {
  addVendor,
  updateVendor,
  getAllVendors,
  getVendorPerformance,
  generateVendorScorecard,
  compareVendorsForProduct,
  setPreferredVendor,
  VendorStatus,
  type Vendor,
  type VendorPerformance,
  type VendorScoringCriteria,
  type VendorScoreCard,
  type VendorProduct,
  type VendorComparison,
  type ApiResponse
};
