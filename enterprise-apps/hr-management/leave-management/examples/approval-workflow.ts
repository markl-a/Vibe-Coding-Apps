/**
 * Leave Approval Workflow Examples
 *
 * This module demonstrates leave approval workflows with:
 * - Approving and rejecting requests
 * - Multi-level approval chains
 * - Notification patterns
 * - Approval delegation
 * - Workflow automation
 */

import { LeaveType, LeaveStatus, type LeaveRequest } from './leave-request';
import { updateBalanceAfterApproval, restoreBalance, type LeaveBalance } from './balance-tracking';

/**
 * Approval level in multi-level approval chain
 */
export interface ApprovalLevel {
  level: number;
  approverRole: string;
  approverId?: string;
  approverName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
  approvedAt?: Date;
  comments?: string;
}

/**
 * Complete approval workflow configuration
 */
export interface ApprovalWorkflow {
  workflowId: string;
  leaveRequestId: string;
  currentLevel: number;
  totalLevels: number;
  levels: ApprovalLevel[];
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Notification types
 */
export enum NotificationType {
  REQUEST_SUBMITTED = 'REQUEST_SUBMITTED',
  APPROVAL_NEEDED = 'APPROVAL_NEEDED',
  REQUEST_APPROVED = 'REQUEST_APPROVED',
  REQUEST_REJECTED = 'REQUEST_REJECTED',
  REQUEST_CANCELLED = 'REQUEST_CANCELLED',
  REMINDER = 'REMINDER',
}

/**
 * Notification configuration
 */
export interface Notification {
  id?: string;
  type: NotificationType;
  recipientId: string;
  recipientEmail?: string;
  subject: string;
  message: string;
  leaveRequestId: string;
  sentAt?: Date;
  readAt?: Date;
}

/**
 * Approval decision
 */
export interface ApprovalDecision {
  approverId: string;
  approved: boolean;
  comments?: string;
  timestamp: Date;
}

/**
 * Delegation configuration
 */
export interface ApprovalDelegation {
  delegatorId: string;
  delegateId: string;
  startDate: Date;
  endDate: Date;
  active: boolean;
}

/**
 * Approve a leave request
 *
 * @param request - Leave request to approve
 * @param approverId - ID of the approver
 * @param comments - Optional approval comments
 * @returns Updated leave request
 * @throws Error if request cannot be approved
 *
 * @example
 * ```typescript
 * const approved = await approveLeaveRequest(
 *   pendingRequest,
 *   'MGR001',
 *   'Approved - enjoy your vacation!'
 * );
 * console.log(`Request approved: ${approved.id}`);
 * console.log(`Approved by: ${approved.approverId}`);
 * ```
 */
export async function approveLeaveRequest(
  request: LeaveRequest,
  approverId: string,
  comments?: string
): Promise<LeaveRequest> {
  if (!request) {
    throw new Error('Leave request is required');
  }

  if (!approverId) {
    throw new Error('Approver ID is required');
  }

  if (request.status !== LeaveStatus.PENDING) {
    throw new Error('Can only approve pending requests');
  }

  // Check if request start date has passed
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (request.startDate < today) {
    throw new Error('Cannot approve requests with start date in the past');
  }

  const updatedRequest: LeaveRequest = {
    ...request,
    status: LeaveStatus.APPROVED,
    approverId,
    approvedAt: new Date(),
    rejectionReason: comments,
    updatedAt: new Date(),
  };

  console.log(`Leave request ${request.id} approved by ${approverId}`);

  return updatedRequest;
}

/**
 * Reject a leave request
 *
 * @param request - Leave request to reject
 * @param approverId - ID of the approver
 * @param rejectionReason - Reason for rejection
 * @returns Updated leave request
 * @throws Error if request cannot be rejected or reason is missing
 *
 * @example
 * ```typescript
 * const rejected = await rejectLeaveRequest(
 *   pendingRequest,
 *   'MGR001',
 *   'Insufficient coverage during requested period'
 * );
 * console.log(`Request rejected: ${rejected.id}`);
 * console.log(`Reason: ${rejected.rejectionReason}`);
 * ```
 */
export async function rejectLeaveRequest(
  request: LeaveRequest,
  approverId: string,
  rejectionReason: string
): Promise<LeaveRequest> {
  if (!request) {
    throw new Error('Leave request is required');
  }

  if (!approverId) {
    throw new Error('Approver ID is required');
  }

  if (!rejectionReason || rejectionReason.trim() === '') {
    throw new Error('Rejection reason is required');
  }

  if (request.status !== LeaveStatus.PENDING) {
    throw new Error('Can only reject pending requests');
  }

  const updatedRequest: LeaveRequest = {
    ...request,
    status: LeaveStatus.REJECTED,
    approverId,
    approvedAt: new Date(),
    rejectionReason,
    updatedAt: new Date(),
  };

  console.log(`Leave request ${request.id} rejected by ${approverId}`);

  return updatedRequest;
}

/**
 * Create a multi-level approval workflow
 *
 * @param leaveRequest - Leave request to create workflow for
 * @param approverChain - Array of approver configurations
 * @returns Created approval workflow
 *
 * @example
 * ```typescript
 * const workflow = createApprovalWorkflow(leaveRequest, [
 *   { level: 1, approverRole: 'DIRECT_MANAGER', approverId: 'MGR001' },
 *   { level: 2, approverRole: 'DEPARTMENT_HEAD', approverId: 'HEAD001' },
 *   { level: 3, approverRole: 'HR_MANAGER', approverId: 'HR001' }
 * ]);
 * ```
 */
export function createApprovalWorkflow(
  leaveRequest: LeaveRequest,
  approverChain: Array<{ level: number; approverRole: string; approverId: string }>
): ApprovalWorkflow {
  if (!leaveRequest.id) {
    throw new Error('Leave request must have an ID');
  }

  if (approverChain.length === 0) {
    throw new Error('Approver chain cannot be empty');
  }

  const levels: ApprovalLevel[] = approverChain.map((approver) => ({
    level: approver.level,
    approverRole: approver.approverRole,
    approverId: approver.approverId,
    status: 'PENDING',
  }));

  return {
    workflowId: `WF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    leaveRequestId: leaveRequest.id,
    currentLevel: 1,
    totalLevels: levels.length,
    levels,
    status: 'IN_PROGRESS',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Process approval at a specific level in the workflow
 *
 * @param workflow - Current approval workflow
 * @param level - Level to process
 * @param decision - Approval decision
 * @returns Updated workflow
 * @throws Error if level is invalid or already processed
 *
 * @example
 * ```typescript
 * const updatedWorkflow = processApprovalLevel(workflow, 1, {
 *   approverId: 'MGR001',
 *   approved: true,
 *   comments: 'Approved',
 *   timestamp: new Date()
 * });
 * ```
 */
export function processApprovalLevel(
  workflow: ApprovalWorkflow,
  level: number,
  decision: ApprovalDecision
): ApprovalWorkflow {
  if (level < 1 || level > workflow.totalLevels) {
    throw new Error(`Invalid approval level: ${level}`);
  }

  if (level !== workflow.currentLevel) {
    throw new Error(`Cannot process level ${level}. Current level is ${workflow.currentLevel}`);
  }

  const levelIndex = level - 1;
  const currentLevelData = workflow.levels[levelIndex];

  if (currentLevelData.status !== 'PENDING') {
    throw new Error(`Level ${level} has already been processed`);
  }

  // Update the current level
  workflow.levels[levelIndex] = {
    ...currentLevelData,
    status: decision.approved ? 'APPROVED' : 'REJECTED',
    approvedAt: decision.timestamp,
    comments: decision.comments,
  };

  // Determine next state
  if (!decision.approved) {
    // Rejection stops the workflow
    return {
      ...workflow,
      status: 'COMPLETED',
      updatedAt: new Date(),
    };
  }

  // Move to next level or complete
  if (level < workflow.totalLevels) {
    return {
      ...workflow,
      currentLevel: level + 1,
      updatedAt: new Date(),
    };
  } else {
    return {
      ...workflow,
      status: 'COMPLETED',
      updatedAt: new Date(),
    };
  }
}

/**
 * Check if approval workflow is complete
 *
 * @param workflow - Approval workflow to check
 * @returns True if all levels are approved
 *
 * @example
 * ```typescript
 * if (isWorkflowApproved(workflow)) {
 *   console.log('All approval levels completed!');
 * }
 * ```
 */
export function isWorkflowApproved(workflow: ApprovalWorkflow): boolean {
  return (
    workflow.status === 'COMPLETED' &&
    workflow.levels.every((level) => level.status === 'APPROVED')
  );
}

/**
 * Send notification for leave request event
 *
 * @param type - Notification type
 * @param recipientId - Recipient's employee ID
 * @param leaveRequest - Related leave request
 * @param additionalInfo - Additional information for the notification
 * @returns Created notification
 *
 * @example
 * ```typescript
 * const notification = await sendNotification(
 *   NotificationType.APPROVAL_NEEDED,
 *   'MGR001',
 *   leaveRequest,
 *   { employeeName: 'John Doe' }
 * );
 * ```
 */
export async function sendNotification(
  type: NotificationType,
  recipientId: string,
  leaveRequest: LeaveRequest,
  additionalInfo?: Record<string, unknown>
): Promise<Notification> {
  const notificationTemplates: Record<NotificationType, { subject: string; message: string }> = {
    [NotificationType.REQUEST_SUBMITTED]: {
      subject: 'Leave Request Submitted',
      message: `Your leave request for ${leaveRequest.days} days has been submitted and is pending approval.`,
    },
    [NotificationType.APPROVAL_NEEDED]: {
      subject: 'Leave Approval Required',
      message: `A leave request requires your approval. Employee: ${additionalInfo?.employeeName}, Type: ${leaveRequest.leaveType}, Days: ${leaveRequest.days}`,
    },
    [NotificationType.REQUEST_APPROVED]: {
      subject: 'Leave Request Approved',
      message: `Your leave request for ${leaveRequest.days} days (${leaveRequest.startDate.toLocaleDateString()} - ${leaveRequest.endDate.toLocaleDateString()}) has been approved.`,
    },
    [NotificationType.REQUEST_REJECTED]: {
      subject: 'Leave Request Rejected',
      message: `Your leave request has been rejected. Reason: ${leaveRequest.rejectionReason || 'Not specified'}`,
    },
    [NotificationType.REQUEST_CANCELLED]: {
      subject: 'Leave Request Cancelled',
      message: `Leave request for ${leaveRequest.days} days has been cancelled.`,
    },
    [NotificationType.REMINDER]: {
      subject: 'Pending Leave Approval Reminder',
      message: `You have pending leave approvals that require action.`,
    },
  };

  const template = notificationTemplates[type];

  const notification: Notification = {
    id: `NOT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    recipientId,
    subject: template.subject,
    message: template.message,
    leaveRequestId: leaveRequest.id!,
    sentAt: new Date(),
  };

  console.log(`Notification sent to ${recipientId}: ${template.subject}`);

  return notification;
}

/**
 * Create approval delegation
 *
 * @param delegatorId - ID of person delegating authority
 * @param delegateId - ID of person receiving authority
 * @param startDate - Delegation start date
 * @param endDate - Delegation end date
 * @returns Created delegation
 *
 * @example
 * ```typescript
 * const delegation = createApprovalDelegation(
 *   'MGR001',
 *   'MGR002',
 *   new Date('2024-07-01'),
 *   new Date('2024-07-15')
 * );
 * console.log('Approval authority delegated during vacation period');
 * ```
 */
export function createApprovalDelegation(
  delegatorId: string,
  delegateId: string,
  startDate: Date,
  endDate: Date
): ApprovalDelegation {
  if (!delegatorId || !delegateId) {
    throw new Error('Delegator and delegate IDs are required');
  }

  if (delegatorId === delegateId) {
    throw new Error('Cannot delegate to yourself');
  }

  if (endDate < startDate) {
    throw new Error('End date cannot be before start date');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    delegatorId,
    delegateId,
    startDate,
    endDate,
    active: startDate <= today && endDate >= today,
  };
}

/**
 * Get pending approvals for an approver
 *
 * @param approverId - Approver's employee ID
 * @returns Array of pending leave requests
 *
 * @example
 * ```typescript
 * const pending = await getPendingApprovals('MGR001');
 * console.log(`You have ${pending.length} pending approvals`);
 *
 * pending.forEach(request => {
 *   console.log(`  [${request.id}] ${request.leaveType} - ${request.days} days`);
 * });
 * ```
 */
export async function getPendingApprovals(approverId: string): Promise<LeaveRequest[]> {
  if (!approverId) {
    throw new Error('Approver ID is required');
  }

  // In a real application, this would query the database
  // For this example, we're returning mock data
  const mockRequests: LeaveRequest[] = [
    {
      id: 'LR-001',
      employeeId: 'EMP001',
      leaveType: LeaveType.ANNUAL,
      startDate: new Date('2024-06-15'),
      endDate: new Date('2024-06-19'),
      days: 5,
      reason: 'Summer vacation',
      status: LeaveStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'LR-002',
      employeeId: 'EMP002',
      leaveType: LeaveType.SICK,
      startDate: new Date('2024-06-10'),
      endDate: new Date('2024-06-11'),
      days: 2,
      reason: 'Medical appointment',
      status: LeaveStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  return mockRequests;
}

/**
 * Auto-approve leave requests based on rules
 *
 * @param request - Leave request to evaluate
 * @param rules - Auto-approval rules configuration
 * @returns True if request should be auto-approved
 *
 * @example
 * ```typescript
 * const autoApproveRules = {
 *   maxDaysForAutoApproval: 2,
 *   allowedTypes: [LeaveType.SICK, LeaveType.PERSONAL],
 *   requiresManagerApproval: false
 * };
 *
 * if (shouldAutoApprove(request, autoApproveRules)) {
 *   await approveLeaveRequest(request, 'SYSTEM', 'Auto-approved');
 * }
 * ```
 */
export function shouldAutoApprove(
  request: LeaveRequest,
  rules: {
    maxDaysForAutoApproval: number;
    allowedTypes: LeaveType[];
    requiresManagerApproval?: boolean;
  }
): boolean {
  // Check if leave type is eligible for auto-approval
  if (!rules.allowedTypes.includes(request.leaveType)) {
    return false;
  }

  // Check if duration is within limits
  if (request.days > rules.maxDaysForAutoApproval) {
    return false;
  }

  // Check if manager approval is required
  if (rules.requiresManagerApproval) {
    return false;
  }

  return true;
}

/**
 * Complete approval workflow example
 *
 * @example
 * ```typescript
 * // Example: Multi-level approval workflow
 * async function approvalWorkflowExample() {
 *   // Mock leave request
 *   const leaveRequest: LeaveRequest = {
 *     id: 'LR-001',
 *     employeeId: 'EMP001',
 *     leaveType: LeaveType.ANNUAL,
 *     startDate: new Date('2024-07-15'),
 *     endDate: new Date('2024-07-19'),
 *     days: 5,
 *     reason: 'Summer vacation',
 *     status: LeaveStatus.PENDING,
 *     createdAt: new Date(),
 *     updatedAt: new Date()
 *   };
 *
 *   // Create multi-level approval workflow
 *   let workflow = createApprovalWorkflow(leaveRequest, [
 *     { level: 1, approverRole: 'DIRECT_MANAGER', approverId: 'MGR001' },
 *     { level: 2, approverRole: 'DEPARTMENT_HEAD', approverId: 'HEAD001' }
 *   ]);
 *
 *   console.log(`Workflow created: ${workflow.workflowId}`);
 *   console.log(`Total levels: ${workflow.totalLevels}`);
 *
 *   // Send notification to first approver
 *   await sendNotification(
 *     NotificationType.APPROVAL_NEEDED,
 *     'MGR001',
 *     leaveRequest,
 *     { employeeName: 'John Doe' }
 *   );
 *
 *   // Level 1 approval
 *   workflow = processApprovalLevel(workflow, 1, {
 *     approverId: 'MGR001',
 *     approved: true,
 *     comments: 'Approved by direct manager',
 *     timestamp: new Date()
 *   });
 *
 *   console.log(`Level 1 approved. Current level: ${workflow.currentLevel}`);
 *
 *   // Send notification to second approver
 *   await sendNotification(
 *     NotificationType.APPROVAL_NEEDED,
 *     'HEAD001',
 *     leaveRequest,
 *     { employeeName: 'John Doe' }
 *   );
 *
 *   // Level 2 approval
 *   workflow = processApprovalLevel(workflow, 2, {
 *     approverId: 'HEAD001',
 *     approved: true,
 *     comments: 'Approved by department head',
 *     timestamp: new Date()
 *   });
 *
 *   // Check if workflow is complete
 *   if (isWorkflowApproved(workflow)) {
 *     console.log('All approval levels completed!');
 *
 *     // Update leave request status
 *     const approvedRequest = await approveLeaveRequest(
 *       leaveRequest,
 *       'HEAD001',
 *       'Final approval'
 *     );
 *
 *     // Send approval notification to employee
 *     await sendNotification(
 *       NotificationType.REQUEST_APPROVED,
 *       leaveRequest.employeeId,
 *       approvedRequest
 *     );
 *
 *     console.log(`Leave request ${approvedRequest.id} fully approved!`);
 *   }
 *
 *   // Example: Delegation during vacation
 *   const delegation = createApprovalDelegation(
 *     'MGR001',
 *     'MGR002',
 *     new Date('2024-08-01'),
 *     new Date('2024-08-15')
 *   );
 *   console.log(`Delegation created from ${delegation.delegatorId} to ${delegation.delegateId}`);
 *
 *   // Example: Get pending approvals
 *   const pending = await getPendingApprovals('MGR001');
 *   console.log(`Pending approvals: ${pending.length}`);
 * }
 * ```
 */
