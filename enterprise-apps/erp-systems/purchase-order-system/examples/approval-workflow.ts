/**
 * Approval Workflow Examples
 *
 * This file demonstrates:
 * - Single and multi-level approval routing
 * - Parallel and sequential approval flows
 * - Approval and rejection handling
 * - Delegation and escalation
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Approval status
 */
enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DELEGATED = 'DELEGATED',
  ESCALATED = 'ESCALATED'
}

/**
 * Order status
 */
enum OrderStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  IN_APPROVAL = 'IN_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SENT = 'SENT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

/**
 * Approval level configuration
 */
interface ApprovalLevel {
  level: number;
  name: string;
  approvers: string[];  // User IDs or roles
  minApprovals: number; // Minimum approvals needed at this level
  requiresAll?: boolean; // If true, all approvers must approve
  thresholdAmount?: number; // Only required if order amount exceeds this
  autoApproveBelow?: number; // Auto-approve if amount is below this
  escalationDays?: number; // Escalate if not approved within N days
}

/**
 * Approval workflow configuration
 */
interface ApprovalWorkflow {
  id: string;
  name: string;
  description?: string;
  levels: ApprovalLevel[];
  isActive: boolean;
  createdAt: Date;
}

/**
 * Individual approval record
 */
interface ApprovalRecord {
  id?: number;
  orderId: number;
  orderNo: string;
  level: number;
  levelName: string;
  approver: string;
  status: ApprovalStatus;
  comments?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  delegatedTo?: string;
  delegatedAt?: Date;
  escalatedAt?: Date;
  createdAt: Date;
}

/**
 * Approval history entry
 */
interface ApprovalHistory {
  orderId: number;
  orderNo: string;
  currentLevel: number;
  totalLevels: number;
  approvals: ApprovalRecord[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: Date;
  completedAt?: Date;
}

/**
 * Approve request
 */
interface ApproveRequest {
  orderId: number;
  approver: string;
  comments?: string;
}

/**
 * Reject request
 */
interface RejectRequest {
  orderId: number;
  approver: string;
  reason: string;
  comments?: string;
}

/**
 * Delegate request
 */
interface DelegateRequest {
  approvalId: number;
  delegateFrom: string;
  delegateTo: string;
  reason: string;
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
// Default Approval Workflows
// ============================================================================

/**
 * Standard 3-level approval workflow
 */
const STANDARD_WORKFLOW: ApprovalWorkflow = {
  id: 'STANDARD_3LEVEL',
  name: 'Standard 3-Level Approval',
  description: 'Standard approval workflow with department, manager, and executive levels',
  levels: [
    {
      level: 1,
      name: 'Department Approval',
      approvers: ['dept.manager', 'dept.supervisor'],
      minApprovals: 1,
      autoApproveBelow: 1000,
      escalationDays: 2
    },
    {
      level: 2,
      name: 'Management Approval',
      approvers: ['general.manager', 'operations.manager'],
      minApprovals: 1,
      thresholdAmount: 5000,
      escalationDays: 3
    },
    {
      level: 3,
      name: 'Executive Approval',
      approvers: ['cfo', 'ceo'],
      minApprovals: 1,
      thresholdAmount: 25000,
      requiresAll: true,
      escalationDays: 5
    }
  ],
  isActive: true,
  createdAt: new Date()
};

/**
 * Fast-track approval workflow for urgent orders
 */
const FASTTRACK_WORKFLOW: ApprovalWorkflow = {
  id: 'FASTTRACK',
  name: 'Fast-Track Approval',
  description: 'Expedited approval for urgent orders',
  levels: [
    {
      level: 1,
      name: 'Manager Approval',
      approvers: ['general.manager', 'operations.manager'],
      minApprovals: 1,
      escalationDays: 1
    }
  ],
  isActive: true,
  createdAt: new Date()
};

// ============================================================================
// Approval Routing
// ============================================================================

/**
 * Initialize approval workflow for a purchase order
 *
 * @param orderId - Purchase order ID
 * @param workflowId - Workflow configuration ID
 * @returns Promise with initialized approval records
 *
 * @example
 * ```typescript
 * const approvals = await initializeApprovalWorkflow(123, 'STANDARD_3LEVEL');
 * console.log(`Created ${approvals.length} approval levels`);
 * ```
 */
async function initializeApprovalWorkflow(
  orderId: number,
  workflowId: string = 'STANDARD_3LEVEL'
): Promise<ApiResponse<ApprovalRecord[]>> {
  try {
    // Get purchase order
    const po = await getPurchaseOrder(orderId);
    if (!po) {
      throw new Error(`Purchase order ${orderId} not found`);
    }

    // Get workflow configuration
    const workflow = await getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // Determine which approval levels are required based on order amount
    const requiredLevels = workflow.levels.filter(level => {
      // Skip level if order amount is below auto-approve threshold
      if (level.autoApproveBelow && po.totalAmount < level.autoApproveBelow) {
        return false;
      }
      // Skip level if order amount is below required threshold
      if (level.thresholdAmount && po.totalAmount < level.thresholdAmount) {
        return false;
      }
      return true;
    });

    if (requiredLevels.length === 0) {
      // Order is auto-approved
      await updateOrderStatus(orderId, OrderStatus.APPROVED);
      return {
        success: true,
        data: [],
        timestamp: new Date()
      };
    }

    // Create approval records for each required level
    const approvalRecords: ApprovalRecord[] = [];

    for (const level of requiredLevels) {
      for (const approver of level.approvers) {
        const record: ApprovalRecord = {
          orderId,
          orderNo: po.orderNo,
          level: level.level,
          levelName: level.name,
          approver,
          status: ApprovalStatus.PENDING,
          createdAt: new Date()
        };

        const saved = await saveApprovalRecord(record);
        approvalRecords.push(saved);
      }
    }

    // Update order status
    await updateOrderStatus(orderId, OrderStatus.IN_APPROVAL);

    // Send notifications to first level approvers
    const firstLevel = requiredLevels[0];
    await notifyApprovers(po, firstLevel.approvers);

    return {
      success: true,
      data: approvalRecords,
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
 * Get pending approvals for a user
 *
 * @param approver - User ID
 * @returns Promise with pending approval records
 *
 * @example
 * ```typescript
 * const pending = await getPendingApprovals('john.doe');
 * console.log(`You have ${pending.length} pending approvals`);
 * ```
 */
async function getPendingApprovals(approver: string): Promise<ApprovalRecord[]> {
  const query = `
    SELECT * FROM approval_records
    WHERE approver = ? AND status = 'PENDING'
    ORDER BY created_at ASC
  `;

  const results = await executeQuery(query, [approver]);
  return results.map(row => ({
    id: row.id,
    orderId: row.order_id,
    orderNo: row.order_no,
    level: row.level,
    levelName: row.level_name,
    approver: row.approver,
    status: row.status as ApprovalStatus,
    comments: row.comments,
    createdAt: new Date(row.created_at)
  }));
}

// ============================================================================
// Approval Processing
// ============================================================================

/**
 * Approve a purchase order
 *
 * @param request - Approval request details
 * @returns Promise with approval result
 *
 * @example
 * ```typescript
 * const result = await approvePurchaseOrder({
 *   orderId: 123,
 *   approver: 'john.doe',
 *   comments: 'Approved - budget available'
 * });
 * ```
 */
async function approvePurchaseOrder(
  request: ApproveRequest
): Promise<ApiResponse<ApprovalHistory>> {
  try {
    // Get purchase order
    const po = await getPurchaseOrder(request.orderId);
    if (!po) {
      throw new Error(`Purchase order ${request.orderId} not found`);
    }

    // Verify order is in approval status
    if (po.status !== OrderStatus.IN_APPROVAL && po.status !== OrderStatus.SUBMITTED) {
      throw new Error(`Order cannot be approved in status ${po.status}`);
    }

    // Find pending approval record for this approver
    const approvalRecords = await getApprovalRecords(request.orderId);
    const pendingApproval = approvalRecords.find(
      r => r.approver === request.approver && r.status === ApprovalStatus.PENDING
    );

    if (!pendingApproval) {
      throw new Error(`No pending approval found for ${request.approver}`);
    }

    // Update approval record
    pendingApproval.status = ApprovalStatus.APPROVED;
    pendingApproval.approvedAt = new Date();
    pendingApproval.comments = request.comments;
    await updateApprovalRecord(pendingApproval);

    // Check if current level is complete
    const currentLevel = pendingApproval.level;
    const workflow = await getWorkflowForOrder(request.orderId);
    const levelConfig = workflow.levels.find(l => l.level === currentLevel);

    if (!levelConfig) {
      throw new Error('Invalid workflow configuration');
    }

    const levelApprovals = approvalRecords.filter(r => r.level === currentLevel);
    const approvedCount = levelApprovals.filter(
      r => r.status === ApprovalStatus.APPROVED
    ).length;

    let levelComplete = false;
    if (levelConfig.requiresAll) {
      // All approvers must approve
      levelComplete = approvedCount === levelApprovals.length;
    } else {
      // Minimum number of approvals required
      levelComplete = approvedCount >= levelConfig.minApprovals;
    }

    if (levelComplete) {
      // Check if there are more levels
      const nextLevel = workflow.levels.find(l => l.level > currentLevel);

      if (nextLevel) {
        // Move to next approval level
        const nextLevelApprovers = approvalRecords
          .filter(r => r.level === nextLevel.level)
          .map(r => r.approver);

        await notifyApprovers(po, nextLevelApprovers);
      } else {
        // All levels complete - approve the order
        await updateOrderStatus(request.orderId, OrderStatus.APPROVED);
        await notifyRequester(po, 'APPROVED');
      }
    }

    // Get updated approval history
    const history = await getApprovalHistory(request.orderId);

    return {
      success: true,
      data: history,
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
 * Reject a purchase order
 *
 * @param request - Rejection request details
 * @returns Promise with rejection result
 *
 * @example
 * ```typescript
 * const result = await rejectPurchaseOrder({
 *   orderId: 123,
 *   approver: 'jane.smith',
 *   reason: 'Budget not approved',
 *   comments: 'Please resubmit next quarter'
 * });
 * ```
 */
async function rejectPurchaseOrder(
  request: RejectRequest
): Promise<ApiResponse<ApprovalHistory>> {
  try {
    // Get purchase order
    const po = await getPurchaseOrder(request.orderId);
    if (!po) {
      throw new Error(`Purchase order ${request.orderId} not found`);
    }

    // Verify order is in approval status
    if (po.status !== OrderStatus.IN_APPROVAL && po.status !== OrderStatus.SUBMITTED) {
      throw new Error(`Order cannot be rejected in status ${po.status}`);
    }

    // Find pending approval record for this approver
    const approvalRecords = await getApprovalRecords(request.orderId);
    const pendingApproval = approvalRecords.find(
      r => r.approver === request.approver && r.status === ApprovalStatus.PENDING
    );

    if (!pendingApproval) {
      throw new Error(`No pending approval found for ${request.approver}`);
    }

    // Update approval record
    pendingApproval.status = ApprovalStatus.REJECTED;
    pendingApproval.rejectedAt = new Date();
    pendingApproval.comments = `${request.reason}${request.comments ? ' | ' + request.comments : ''}`;
    await updateApprovalRecord(pendingApproval);

    // Reject the entire order (single rejection fails the order)
    await updateOrderStatus(request.orderId, OrderStatus.REJECTED);

    // Cancel all other pending approvals
    for (const record of approvalRecords) {
      if (record.status === ApprovalStatus.PENDING) {
        record.status = ApprovalStatus.REJECTED;
        record.comments = 'Cancelled due to rejection';
        await updateApprovalRecord(record);
      }
    }

    // Notify requester
    await notifyRequester(po, 'REJECTED', request.reason);

    // Get updated approval history
    const history = await getApprovalHistory(request.orderId);

    return {
      success: true,
      data: history,
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
// Delegation and Escalation
// ============================================================================

/**
 * Delegate approval to another user
 *
 * @param request - Delegation request details
 * @returns Promise with delegation result
 *
 * @example
 * ```typescript
 * const result = await delegateApproval({
 *   approvalId: 456,
 *   delegateFrom: 'john.doe',
 *   delegateTo: 'jane.smith',
 *   reason: 'Out of office - on vacation'
 * });
 * ```
 */
async function delegateApproval(
  request: DelegateRequest
): Promise<ApiResponse<ApprovalRecord>> {
  try {
    // Get approval record
    const approval = await getApprovalRecordById(request.approvalId);
    if (!approval) {
      throw new Error(`Approval record ${request.approvalId} not found`);
    }

    // Verify delegator is the assigned approver
    if (approval.approver !== request.delegateFrom) {
      throw new Error('Only the assigned approver can delegate this approval');
    }

    // Verify status is pending
    if (approval.status !== ApprovalStatus.PENDING) {
      throw new Error(`Cannot delegate approval with status ${approval.status}`);
    }

    // Update approval record
    approval.approver = request.delegateTo;
    approval.status = ApprovalStatus.DELEGATED;
    approval.delegatedTo = request.delegateTo;
    approval.delegatedAt = new Date();
    approval.comments = `Delegated by ${request.delegateFrom}: ${request.reason}`;

    // Create new approval record for delegate
    const delegatedApproval: ApprovalRecord = {
      ...approval,
      id: undefined,
      approver: request.delegateTo,
      status: ApprovalStatus.PENDING,
      delegatedTo: undefined,
      delegatedAt: undefined,
      comments: `Delegated from ${request.delegateFrom}: ${request.reason}`,
      createdAt: new Date()
    };

    await updateApprovalRecord(approval);
    const savedDelegation = await saveApprovalRecord(delegatedApproval);

    // Notify delegate
    const po = await getPurchaseOrder(approval.orderId);
    if (po) {
      await notifyApprovers(po, [request.delegateTo]);
    }

    return {
      success: true,
      data: savedDelegation,
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
 * Escalate overdue approvals
 *
 * @returns Promise with escalated approvals
 *
 * @example
 * ```typescript
 * // Run this periodically (e.g., daily cron job)
 * const escalated = await escalateOverdueApprovals();
 * console.log(`Escalated ${escalated.length} overdue approvals`);
 * ```
 */
async function escalateOverdueApprovals(): Promise<ApprovalRecord[]> {
  const escalated: ApprovalRecord[] = [];

  // Get all pending approvals
  const pendingApprovals = await getAllPendingApprovals();

  for (const approval of pendingApprovals) {
    // Get workflow configuration
    const workflow = await getWorkflowForOrder(approval.orderId);
    const levelConfig = workflow.levels.find(l => l.level === approval.level);

    if (!levelConfig || !levelConfig.escalationDays) {
      continue;
    }

    // Check if approval is overdue
    const daysSinceCreated = Math.floor(
      (Date.now() - approval.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceCreated >= levelConfig.escalationDays) {
      // Escalate to next level or notify management
      approval.status = ApprovalStatus.ESCALATED;
      approval.escalatedAt = new Date();
      approval.comments = `Escalated after ${daysSinceCreated} days without response`;

      await updateApprovalRecord(approval);
      await notifyEscalation(approval);

      escalated.push(approval);
    }
  }

  return escalated;
}

// ============================================================================
// Helper Functions (Mock implementations)
// ============================================================================

async function getPurchaseOrder(id: number): Promise<any> {
  return {
    id,
    orderNo: `PO${id}`,
    totalAmount: 15000,
    status: OrderStatus.IN_APPROVAL
  };
}

async function getWorkflow(id: string): Promise<ApprovalWorkflow> {
  return id === 'FASTTRACK' ? FASTTRACK_WORKFLOW : STANDARD_WORKFLOW;
}

async function getWorkflowForOrder(orderId: number): Promise<ApprovalWorkflow> {
  return STANDARD_WORKFLOW;
}

async function saveApprovalRecord(record: ApprovalRecord): Promise<ApprovalRecord> {
  return { ...record, id: Math.floor(Math.random() * 10000) };
}

async function updateApprovalRecord(record: ApprovalRecord): Promise<void> {
  console.log('Updating approval record:', record.id);
}

async function getApprovalRecords(orderId: number): Promise<ApprovalRecord[]> {
  return [];
}

async function getApprovalRecordById(id: number): Promise<ApprovalRecord | null> {
  return null;
}

async function getAllPendingApprovals(): Promise<ApprovalRecord[]> {
  return [];
}

async function getApprovalHistory(orderId: number): Promise<ApprovalHistory> {
  return {
    orderId,
    orderNo: `PO${orderId}`,
    currentLevel: 1,
    totalLevels: 3,
    approvals: [],
    status: 'PENDING',
    submittedAt: new Date()
  };
}

async function updateOrderStatus(orderId: number, status: OrderStatus): Promise<void> {
  console.log(`Updating order ${orderId} to status ${status}`);
}

async function notifyApprovers(po: any, approvers: string[]): Promise<void> {
  console.log(`Notifying approvers for PO ${po.orderNo}:`, approvers);
}

async function notifyRequester(po: any, result: string, reason?: string): Promise<void> {
  console.log(`Notifying requester: PO ${po.orderNo} - ${result}`);
}

async function notifyEscalation(approval: ApprovalRecord): Promise<void> {
  console.log(`Escalation notification for approval ${approval.id}`);
}

async function executeQuery(query: string, params: any[]): Promise<any[]> {
  return [];
}

// ============================================================================
// Example Usage
// ============================================================================

async function demonstrateApprovalWorkflow(): Promise<void> {
  console.log('=== Approval Workflow Demo ===\n');

  // Example 1: Initialize workflow
  console.log('1. Initialize Approval Workflow:');
  const initResult = await initializeApprovalWorkflow(123, 'STANDARD_3LEVEL');
  if (initResult.success && initResult.data) {
    console.log(`Created ${initResult.data.length} approval records`);
  }
  console.log();

  // Example 2: Get pending approvals
  console.log('2. Get Pending Approvals:');
  const pending = await getPendingApprovals('john.doe');
  console.log(`Found ${pending.length} pending approvals`);
  console.log();

  // Example 3: Approve order
  console.log('3. Approve Purchase Order:');
  const approveResult = await approvePurchaseOrder({
    orderId: 123,
    approver: 'john.doe',
    comments: 'Approved - budget verified'
  });
  console.log(approveResult.success ? 'Approved successfully' : 'Approval failed');
  console.log();

  // Example 4: Delegate approval
  console.log('4. Delegate Approval:');
  const delegateResult = await delegateApproval({
    approvalId: 456,
    delegateFrom: 'john.doe',
    delegateTo: 'jane.smith',
    reason: 'Out of office until next week'
  });
  console.log(delegateResult.success ? 'Delegated successfully' : 'Delegation failed');
  console.log();

  // Example 5: Reject order
  console.log('5. Reject Purchase Order:');
  const rejectResult = await rejectPurchaseOrder({
    orderId: 124,
    approver: 'jane.smith',
    reason: 'Budget not available',
    comments: 'Please resubmit next quarter'
  });
  console.log(rejectResult.success ? 'Rejected successfully' : 'Rejection failed');
}

// Run demo if this file is executed directly
if (require.main === module) {
  demonstrateApprovalWorkflow().catch(console.error);
}

// Export functions
export {
  initializeApprovalWorkflow,
  getPendingApprovals,
  approvePurchaseOrder,
  rejectPurchaseOrder,
  delegateApproval,
  escalateOverdueApprovals,
  STANDARD_WORKFLOW,
  FASTTRACK_WORKFLOW,
  ApprovalStatus,
  OrderStatus,
  type ApprovalLevel,
  type ApprovalWorkflow,
  type ApprovalRecord,
  type ApprovalHistory,
  type ApproveRequest,
  type RejectRequest,
  type DelegateRequest,
  type ApiResponse
};
