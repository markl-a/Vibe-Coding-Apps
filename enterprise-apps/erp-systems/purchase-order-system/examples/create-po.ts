/**
 * Create Purchase Order Examples
 *
 * This file demonstrates:
 * - Creating new purchase orders
 * - Adding and managing line items
 * - Submitting purchase orders for approval
 * - Validating order data
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Purchase Order Status
 */
enum OrderStatus {
  DRAFT = 'DRAFT',           // Being created/edited
  SUBMITTED = 'SUBMITTED',   // Submitted for approval
  APPROVED = 'APPROVED',     // Approved and ready to send
  REJECTED = 'REJECTED',     // Rejected by approver
  SENT = 'SENT',            // Sent to supplier
  RECEIVED = 'RECEIVED',     // Partially received
  COMPLETED = 'COMPLETED',   // Fully received
  CANCELLED = 'CANCELLED'    // Cancelled
}

/**
 * Supplier information
 */
interface Supplier {
  code: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  paymentTerms?: string;
  rating?: number; // 1-5
  createdAt?: Date;
}

/**
 * Purchase order line item
 */
interface OrderItem {
  id?: number;
  productCode: string;
  productName?: string;
  description?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  lineTotal: number;
  receivedQuantity?: number;
  notes?: string;
}

/**
 * Purchase Order
 */
interface PurchaseOrder {
  id?: number;
  orderNo?: string;
  supplierCode: string;
  supplierName?: string;
  orderDate?: Date;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  totalAmount: number;
  requester?: string;
  approver?: string;
  approvedAt?: Date;
  deliveryDate?: string;
  deliveryAddress?: string;
  paymentTerms?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Create purchase order request
 */
interface CreatePORequest {
  supplierCode: string;
  items: Array<{
    productCode: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    discount?: number;
    notes?: string;
  }>;
  requester?: string;
  deliveryDate?: string;
  deliveryAddress?: string;
  paymentTerms?: string;
  notes?: string;
}

/**
 * Add item request
 */
interface AddItemRequest {
  orderId: number;
  productCode: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  discount?: number;
  notes?: string;
}

/**
 * Update item request
 */
interface UpdateItemRequest {
  itemId: number;
  quantity?: number;
  unitPrice?: number;
  taxRate?: number;
  discount?: number;
  notes?: string;
}

/**
 * Validation result
 */
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
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
// Create Purchase Order
// ============================================================================

/**
 * Create a new purchase order
 *
 * @param request - Purchase order details
 * @returns Promise with created purchase order
 *
 * @example
 * ```typescript
 * const po = await createPurchaseOrder({
 *   supplierCode: 'SUP001',
 *   items: [
 *     {
 *       productCode: 'P001',
 *       quantity: 100,
 *       unitPrice: 10.50,
 *       taxRate: 0.10
 *     },
 *     {
 *       productCode: 'P002',
 *       quantity: 50,
 *       unitPrice: 25.00,
 *       taxRate: 0.10
 *     }
 *   ],
 *   requester: 'john.doe',
 *   deliveryDate: '2025-02-15',
 *   notes: 'Urgent order for Q1 inventory'
 * });
 * ```
 */
async function createPurchaseOrder(
  request: CreatePORequest
): Promise<ApiResponse<PurchaseOrder>> {
  try {
    // Validate request
    const validation = await validatePORequest(request);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Verify supplier exists
    const supplier = await getSupplier(request.supplierCode);
    if (!supplier) {
      throw new Error(`Supplier ${request.supplierCode} does not exist`);
    }

    // Generate unique order number
    const orderNo = await generateOrderNumber();

    // Process items and calculate totals
    const items: OrderItem[] = [];
    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    for (const itemRequest of request.items) {
      // Get product details
      const product = await getProduct(itemRequest.productCode);
      if (!product) {
        throw new Error(`Product ${itemRequest.productCode} does not exist`);
      }

      // Calculate line item amounts
      const lineSubtotal = itemRequest.quantity * itemRequest.unitPrice;
      const lineDiscount = itemRequest.discount || 0;
      const discountedAmount = lineSubtotal - lineDiscount;
      const lineTax = discountedAmount * (itemRequest.taxRate || 0);
      const lineTotal = discountedAmount + lineTax;

      const item: OrderItem = {
        productCode: itemRequest.productCode,
        productName: product.name,
        description: product.description,
        quantity: itemRequest.quantity,
        unit: product.unit,
        unitPrice: itemRequest.unitPrice,
        taxRate: itemRequest.taxRate || 0,
        taxAmount: lineTax,
        discount: lineDiscount,
        lineTotal: lineTotal,
        receivedQuantity: 0,
        notes: itemRequest.notes
      };

      items.push(item);
      subtotal += lineSubtotal;
      taxTotal += lineTax;
      discountTotal += lineDiscount;
    }

    const totalAmount = subtotal - discountTotal + taxTotal;

    // Create purchase order object
    const purchaseOrder: PurchaseOrder = {
      orderNo,
      supplierCode: request.supplierCode,
      supplierName: supplier.name,
      orderDate: new Date(),
      status: OrderStatus.DRAFT,
      items,
      subtotal,
      taxTotal,
      discountTotal,
      totalAmount,
      requester: request.requester,
      deliveryDate: request.deliveryDate,
      deliveryAddress: request.deliveryAddress,
      paymentTerms: request.paymentTerms || supplier.paymentTerms,
      notes: request.notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to database
    const savedPO = await savePurchaseOrder(purchaseOrder);

    return {
      success: true,
      data: savedPO,
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
 * Validate purchase order request
 */
async function validatePORequest(
  request: CreatePORequest
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check supplier code
  if (!request.supplierCode || request.supplierCode.trim() === '') {
    errors.push('Supplier code is required');
  }

  // Check items
  if (!request.items || request.items.length === 0) {
    errors.push('At least one item is required');
  } else {
    // Validate each item
    request.items.forEach((item, index) => {
      if (!item.productCode) {
        errors.push(`Item ${index + 1}: Product code is required`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }
      if (!item.unitPrice || item.unitPrice <= 0) {
        errors.push(`Item ${index + 1}: Unit price must be greater than 0`);
      }
      if (item.taxRate && (item.taxRate < 0 || item.taxRate > 1)) {
        errors.push(`Item ${index + 1}: Tax rate must be between 0 and 1`);
      }
    });
  }

  // Check delivery date (warning if not provided)
  if (!request.deliveryDate) {
    warnings.push('Delivery date not specified');
  } else {
    const deliveryDate = new Date(request.deliveryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (deliveryDate < today) {
      errors.push('Delivery date cannot be in the past');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// Manage Line Items
// ============================================================================

/**
 * Add item to existing purchase order
 *
 * @param request - Item details to add
 * @returns Promise with updated purchase order
 *
 * @example
 * ```typescript
 * const result = await addItemToPO({
 *   orderId: 123,
 *   productCode: 'P003',
 *   quantity: 75,
 *   unitPrice: 15.00,
 *   taxRate: 0.10
 * });
 * ```
 */
async function addItemToPO(
  request: AddItemRequest
): Promise<ApiResponse<PurchaseOrder>> {
  try {
    // Get existing purchase order
    const po = await getPurchaseOrder(request.orderId);
    if (!po) {
      throw new Error(`Purchase order ${request.orderId} not found`);
    }

    // Check if order can be modified
    if (po.status !== OrderStatus.DRAFT) {
      throw new Error(`Cannot modify order with status ${po.status}`);
    }

    // Get product details
    const product = await getProduct(request.productCode);
    if (!product) {
      throw new Error(`Product ${request.productCode} does not exist`);
    }

    // Calculate line item amounts
    const lineSubtotal = request.quantity * request.unitPrice;
    const lineDiscount = request.discount || 0;
    const discountedAmount = lineSubtotal - lineDiscount;
    const lineTax = discountedAmount * (request.taxRate || 0);
    const lineTotal = discountedAmount + lineTax;

    // Create new item
    const newItem: OrderItem = {
      productCode: request.productCode,
      productName: product.name,
      description: product.description,
      quantity: request.quantity,
      unit: product.unit,
      unitPrice: request.unitPrice,
      taxRate: request.taxRate || 0,
      taxAmount: lineTax,
      discount: lineDiscount,
      lineTotal: lineTotal,
      receivedQuantity: 0,
      notes: request.notes
    };

    // Add item to order
    po.items.push(newItem);

    // Recalculate totals
    recalculateTotals(po);

    // Update timestamp
    po.updatedAt = new Date();

    // Save updated order
    const updatedPO = await updatePurchaseOrder(po);

    return {
      success: true,
      data: updatedPO,
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
 * Update existing line item
 *
 * @param request - Update details
 * @returns Promise with updated purchase order
 *
 * @example
 * ```typescript
 * const result = await updatePOItem({
 *   itemId: 456,
 *   quantity: 150,
 *   unitPrice: 9.99
 * });
 * ```
 */
async function updatePOItem(
  request: UpdateItemRequest
): Promise<ApiResponse<PurchaseOrder>> {
  try {
    // Find the purchase order containing this item
    const po = await findPOByItemId(request.itemId);
    if (!po) {
      throw new Error(`Item ${request.itemId} not found`);
    }

    // Check if order can be modified
    if (po.status !== OrderStatus.DRAFT) {
      throw new Error(`Cannot modify order with status ${po.status}`);
    }

    // Find and update the item
    const item = po.items.find(i => i.id === request.itemId);
    if (!item) {
      throw new Error(`Item ${request.itemId} not found in order`);
    }

    // Update fields
    if (request.quantity !== undefined) item.quantity = request.quantity;
    if (request.unitPrice !== undefined) item.unitPrice = request.unitPrice;
    if (request.taxRate !== undefined) item.taxRate = request.taxRate;
    if (request.discount !== undefined) item.discount = request.discount;
    if (request.notes !== undefined) item.notes = request.notes;

    // Recalculate line item amounts
    const lineSubtotal = item.quantity * item.unitPrice;
    const lineDiscount = item.discount || 0;
    const discountedAmount = lineSubtotal - lineDiscount;
    const lineTax = discountedAmount * item.taxRate;
    item.taxAmount = lineTax;
    item.lineTotal = discountedAmount + lineTax;

    // Recalculate order totals
    recalculateTotals(po);

    // Update timestamp
    po.updatedAt = new Date();

    // Save updated order
    const updatedPO = await updatePurchaseOrder(po);

    return {
      success: true,
      data: updatedPO,
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
 * Remove item from purchase order
 *
 * @param itemId - ID of item to remove
 * @returns Promise with updated purchase order
 *
 * @example
 * ```typescript
 * const result = await removeItemFromPO(456);
 * ```
 */
async function removeItemFromPO(
  itemId: number
): Promise<ApiResponse<PurchaseOrder>> {
  try {
    // Find the purchase order containing this item
    const po = await findPOByItemId(itemId);
    if (!po) {
      throw new Error(`Item ${itemId} not found`);
    }

    // Check if order can be modified
    if (po.status !== OrderStatus.DRAFT) {
      throw new Error(`Cannot modify order with status ${po.status}`);
    }

    // Remove the item
    const itemIndex = po.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) {
      throw new Error(`Item ${itemId} not found in order`);
    }

    po.items.splice(itemIndex, 1);

    // Check if order still has items
    if (po.items.length === 0) {
      throw new Error('Cannot remove last item from order');
    }

    // Recalculate totals
    recalculateTotals(po);

    // Update timestamp
    po.updatedAt = new Date();

    // Save updated order
    const updatedPO = await updatePurchaseOrder(po);

    return {
      success: true,
      data: updatedPO,
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
 * Recalculate purchase order totals
 */
function recalculateTotals(po: PurchaseOrder): void {
  let subtotal = 0;
  let taxTotal = 0;
  let discountTotal = 0;

  po.items.forEach(item => {
    const lineSubtotal = item.quantity * item.unitPrice;
    subtotal += lineSubtotal;
    taxTotal += item.taxAmount || 0;
    discountTotal += item.discount || 0;
  });

  po.subtotal = subtotal;
  po.taxTotal = taxTotal;
  po.discountTotal = discountTotal;
  po.totalAmount = subtotal - discountTotal + taxTotal;
}

// ============================================================================
// Submit for Approval
// ============================================================================

/**
 * Submit purchase order for approval
 *
 * @param orderId - Purchase order ID
 * @param submitter - User submitting the order
 * @returns Promise with updated purchase order
 *
 * @example
 * ```typescript
 * const result = await submitPOForApproval(123, 'john.doe');
 * if (result.success) {
 *   console.log(`Order ${result.data.orderNo} submitted for approval`);
 * }
 * ```
 */
async function submitPOForApproval(
  orderId: number,
  submitter: string
): Promise<ApiResponse<PurchaseOrder>> {
  try {
    // Get purchase order
    const po = await getPurchaseOrder(orderId);
    if (!po) {
      throw new Error(`Purchase order ${orderId} not found`);
    }

    // Validate current status
    if (po.status !== OrderStatus.DRAFT) {
      throw new Error(`Cannot submit order with status ${po.status}`);
    }

    // Validate order has items
    if (!po.items || po.items.length === 0) {
      throw new Error('Cannot submit order with no items');
    }

    // Perform final validation
    const validation = await validatePOForSubmission(po);
    if (!validation.valid) {
      throw new Error(`Cannot submit order: ${validation.errors.join(', ')}`);
    }

    // Update status
    po.status = OrderStatus.SUBMITTED;
    po.requester = submitter;
    po.updatedAt = new Date();

    // Save updated order
    const updatedPO = await updatePurchaseOrder(po);

    // Send notification to approvers
    await notifyApprovers(updatedPO);

    return {
      success: true,
      data: updatedPO,
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
 * Validate purchase order before submission
 */
async function validatePOForSubmission(
  po: PurchaseOrder
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check items
  if (!po.items || po.items.length === 0) {
    errors.push('Order must have at least one item');
  }

  // Check total amount
  if (po.totalAmount <= 0) {
    errors.push('Total amount must be greater than 0');
  }

  // Check delivery date
  if (!po.deliveryDate) {
    warnings.push('Delivery date not specified');
  }

  // Check requester
  if (!po.requester) {
    warnings.push('Requester not specified');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// Helper Functions (Mock implementations)
// ============================================================================

async function getSupplier(code: string): Promise<Supplier | null> {
  // Mock implementation
  return {
    code,
    name: 'Sample Supplier Inc.',
    contactPerson: 'Jane Smith',
    email: 'jane@supplier.com',
    paymentTerms: 'Net 30',
    rating: 4
  };
}

async function getProduct(code: string): Promise<any> {
  // Mock implementation
  return {
    code,
    name: `Product ${code}`,
    description: `Description for ${code}`,
    unit: 'PCS'
  };
}

async function generateOrderNumber(): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '');
  return `PO${timestamp.substring(0, 14)}`;
}

async function savePurchaseOrder(po: PurchaseOrder): Promise<PurchaseOrder> {
  // Mock implementation - would save to database
  return {
    ...po,
    id: Math.floor(Math.random() * 10000)
  };
}

async function getPurchaseOrder(id: number): Promise<PurchaseOrder | null> {
  // Mock implementation
  return null;
}

async function updatePurchaseOrder(po: PurchaseOrder): Promise<PurchaseOrder> {
  // Mock implementation
  return po;
}

async function findPOByItemId(itemId: number): Promise<PurchaseOrder | null> {
  // Mock implementation
  return null;
}

async function notifyApprovers(po: PurchaseOrder): Promise<void> {
  console.log(`Sending approval notification for PO ${po.orderNo}`);
}

// ============================================================================
// Example Usage
// ============================================================================

async function demonstrateCreatePO(): Promise<void> {
  console.log('=== Create Purchase Order Demo ===\n');

  // Example 1: Create new purchase order
  console.log('1. Creating Purchase Order:');
  const createResult = await createPurchaseOrder({
    supplierCode: 'SUP001',
    items: [
      {
        productCode: 'P001',
        quantity: 100,
        unitPrice: 10.50,
        taxRate: 0.10
      },
      {
        productCode: 'P002',
        quantity: 50,
        unitPrice: 25.00,
        taxRate: 0.10,
        discount: 50.00
      }
    ],
    requester: 'john.doe',
    deliveryDate: '2025-02-15',
    deliveryAddress: '123 Main St, City, State 12345',
    notes: 'Urgent order for Q1 inventory'
  });

  if (createResult.success && createResult.data) {
    console.log(`Created PO: ${createResult.data.orderNo}`);
    console.log(`Total Amount: $${createResult.data.totalAmount.toFixed(2)}`);
    console.log(`Items: ${createResult.data.items.length}`);
    console.log();

    // Example 2: Add item to order
    console.log('2. Adding Item to Purchase Order:');
    const addResult = await addItemToPO({
      orderId: createResult.data.id!,
      productCode: 'P003',
      quantity: 75,
      unitPrice: 15.00,
      taxRate: 0.10
    });
    console.log(addResult.success ? 'Item added successfully' : 'Failed to add item');
    console.log();

    // Example 3: Submit for approval
    console.log('3. Submitting for Approval:');
    const submitResult = await submitPOForApproval(
      createResult.data.id!,
      'john.doe'
    );
    console.log(submitResult.success ? 'Submitted successfully' : 'Failed to submit');
  }
}

// Run demo if this file is executed directly
if (require.main === module) {
  demonstrateCreatePO().catch(console.error);
}

// Export functions
export {
  createPurchaseOrder,
  addItemToPO,
  updatePOItem,
  removeItemFromPO,
  submitPOForApproval,
  validatePORequest,
  OrderStatus,
  type Supplier,
  type OrderItem,
  type PurchaseOrder,
  type CreatePORequest,
  type AddItemRequest,
  type UpdateItemRequest,
  type ValidationResult,
  type ApiResponse
};
