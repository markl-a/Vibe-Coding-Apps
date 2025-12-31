/**
 * Leave Request Examples
 *
 * This module demonstrates leave request management with:
 * - Submitting leave requests
 * - Checking request status
 * - Cancelling requests
 * - Request validation
 */

/**
 * Leave types supported by the system
 */
export enum LeaveType {
  ANNUAL = 'ANNUAL', // Annual leave
  SICK = 'SICK', // Sick leave
  PERSONAL = 'PERSONAL', // Personal leave
  MARRIAGE = 'MARRIAGE', // Marriage leave
  MATERNITY = 'MATERNITY', // Maternity leave
  PATERNITY = 'PATERNITY', // Paternity leave
  BEREAVEMENT = 'BEREAVEMENT', // Bereavement leave
  UNPAID = 'UNPAID', // Unpaid leave
}

/**
 * Leave request status
 */
export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

/**
 * Leave request data
 */
export interface LeaveRequest {
  id?: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  attachments?: string[];
  status: LeaveStatus;
  approverId?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Leave request input for submission
 */
export interface LeaveRequestInput {
  employeeId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
  attachments?: string[];
}

/**
 * Leave request validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Calculate the number of working days between two dates
 *
 * @param startDate - Leave start date
 * @param endDate - Leave end date
 * @param excludeWeekends - Whether to exclude weekends (default: true)
 * @returns Number of working days
 * @throws Error if end date is before start date
 *
 * @example
 * ```typescript
 * const days = calculateLeaveDays(
 *   new Date('2024-01-15'),
 *   new Date('2024-01-19')
 * );
 * console.log(`Leave days: ${days}`); // 5
 * ```
 */
export function calculateLeaveDays(
  startDate: Date,
  endDate: Date,
  excludeWeekends: boolean = true
): number {
  if (endDate < startDate) {
    throw new Error('End date cannot be before start date');
  }

  let days = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (excludeWeekends) {
      const dayOfWeek = currentDate.getDay();
      // 0 = Sunday, 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days++;
      }
    } else {
      days++;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return days;
}

/**
 * Validate leave request data
 *
 * @param request - Leave request input data
 * @param availableBalance - Available leave balance for the leave type
 * @returns Validation result with errors and warnings
 *
 * @example
 * ```typescript
 * const validation = validateLeaveRequest({
 *   employeeId: 'EMP001',
 *   leaveType: LeaveType.ANNUAL,
 *   startDate: new Date('2024-01-15'),
 *   endDate: new Date('2024-01-19'),
 *   reason: 'Family vacation'
 * }, 10);
 *
 * if (!validation.valid) {
 *   console.error('Validation errors:', validation.errors);
 * }
 * ```
 */
export function validateLeaveRequest(
  request: LeaveRequestInput,
  availableBalance?: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate employee ID
  if (!request.employeeId || request.employeeId.trim() === '') {
    errors.push('Employee ID is required');
  }

  // Validate leave type
  if (!Object.values(LeaveType).includes(request.leaveType)) {
    errors.push('Invalid leave type');
  }

  // Validate dates
  if (!request.startDate) {
    errors.push('Start date is required');
  }

  if (!request.endDate) {
    errors.push('End date is required');
  }

  if (request.startDate && request.endDate) {
    if (request.endDate < request.startDate) {
      errors.push('End date cannot be before start date');
    }

    // Check if start date is in the past (warning only)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (request.startDate < today) {
      warnings.push('Start date is in the past');
    }

    // Check if request is too far in the future (warning only)
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    if (request.startDate > sixMonthsFromNow) {
      warnings.push('Leave request is more than 6 months in advance');
    }
  }

  // Validate reason
  if (!request.reason || request.reason.trim() === '') {
    errors.push('Reason is required');
  } else if (request.reason.length < 10) {
    warnings.push('Reason is very brief, consider providing more details');
  }

  // Check balance if provided
  if (availableBalance !== undefined && request.startDate && request.endDate) {
    const requestedDays = calculateLeaveDays(request.startDate, request.endDate);
    if (requestedDays > availableBalance) {
      errors.push(
        `Insufficient leave balance. Requested: ${requestedDays} days, Available: ${availableBalance} days`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Submit a new leave request
 *
 * @param requestData - Leave request input data
 * @param availableBalance - Current available balance for the leave type
 * @returns Created leave request
 * @throws Error if validation fails or insufficient balance
 *
 * @example
 * ```typescript
 * const leaveRequest = await submitLeaveRequest({
 *   employeeId: 'EMP001',
 *   leaveType: LeaveType.ANNUAL,
 *   startDate: new Date('2024-01-15'),
 *   endDate: new Date('2024-01-19'),
 *   reason: 'Family vacation',
 *   attachments: []
 * }, 15);
 *
 * console.log(`Request submitted: ${leaveRequest.id}`);
 * console.log(`Status: ${leaveRequest.status}`);
 * console.log(`Days requested: ${leaveRequest.days}`);
 * ```
 */
export async function submitLeaveRequest(
  requestData: LeaveRequestInput,
  availableBalance?: number
): Promise<LeaveRequest> {
  // Validate request
  const validation = validateLeaveRequest(requestData, availableBalance);

  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  // Calculate leave days
  const days = calculateLeaveDays(requestData.startDate, requestData.endDate);

  // Create leave request
  const leaveRequest: LeaveRequest = {
    id: `LR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    employeeId: requestData.employeeId,
    leaveType: requestData.leaveType,
    startDate: requestData.startDate,
    endDate: requestData.endDate,
    days,
    reason: requestData.reason,
    attachments: requestData.attachments || [],
    status: LeaveStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // In a real application, this would be saved to a database
  // For this example, we're just returning the created object
  console.log(`Leave request created: ${leaveRequest.id}`);

  return leaveRequest;
}

/**
 * Get leave request status
 *
 * @param requestId - Leave request ID
 * @returns Leave request with current status
 * @throws Error if request not found
 *
 * @example
 * ```typescript
 * const request = await getLeaveRequestStatus('LR-12345');
 * console.log(`Status: ${request.status}`);
 *
 * if (request.status === LeaveStatus.APPROVED) {
 *   console.log(`Approved by: ${request.approverId}`);
 *   console.log(`Approved at: ${request.approvedAt}`);
 * } else if (request.status === LeaveStatus.REJECTED) {
 *   console.log(`Rejection reason: ${request.rejectionReason}`);
 * }
 * ```
 */
export async function getLeaveRequestStatus(requestId: string): Promise<LeaveRequest> {
  if (!requestId) {
    throw new Error('Request ID is required');
  }

  // In a real application, this would fetch from a database
  // For this example, we're returning a mock request
  const mockRequest: LeaveRequest = {
    id: requestId,
    employeeId: 'EMP001',
    leaveType: LeaveType.ANNUAL,
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-01-19'),
    days: 5,
    reason: 'Family vacation',
    status: LeaveStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return mockRequest;
}

/**
 * Cancel a pending leave request
 *
 * @param requestId - Leave request ID to cancel
 * @param employeeId - Employee ID making the cancellation
 * @param cancellationReason - Reason for cancellation
 * @returns Updated leave request
 * @throws Error if request cannot be cancelled
 *
 * @example
 * ```typescript
 * const cancelled = await cancelLeaveRequest(
 *   'LR-12345',
 *   'EMP001',
 *   'Plans changed, no longer needed'
 * );
 *
 * console.log(`Request cancelled: ${cancelled.id}`);
 * console.log(`Status: ${cancelled.status}`);
 * ```
 */
export async function cancelLeaveRequest(
  requestId: string,
  employeeId: string,
  cancellationReason?: string
): Promise<LeaveRequest> {
  if (!requestId) {
    throw new Error('Request ID is required');
  }

  if (!employeeId) {
    throw new Error('Employee ID is required');
  }

  // Get current request status
  const request = await getLeaveRequestStatus(requestId);

  // Verify employee owns this request
  if (request.employeeId !== employeeId) {
    throw new Error('You can only cancel your own leave requests');
  }

  // Check if request can be cancelled
  if (request.status === LeaveStatus.CANCELLED) {
    throw new Error('Request is already cancelled');
  }

  if (request.status === LeaveStatus.APPROVED) {
    // Check if start date has passed
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (request.startDate < today) {
      throw new Error('Cannot cancel approved leave that has already started');
    }
  }

  if (request.status === LeaveStatus.REJECTED) {
    throw new Error('Cannot cancel a rejected request');
  }

  // Cancel the request
  const updatedRequest: LeaveRequest = {
    ...request,
    status: LeaveStatus.CANCELLED,
    rejectionReason: cancellationReason,
    updatedAt: new Date(),
  };

  // In a real application, this would update the database
  console.log(`Leave request cancelled: ${requestId}`);

  return updatedRequest;
}

/**
 * Get all leave requests for an employee
 *
 * @param employeeId - Employee ID
 * @param status - Optional status filter
 * @param startDate - Optional start date filter
 * @param endDate - Optional end date filter
 * @returns Array of leave requests
 *
 * @example
 * ```typescript
 * // Get all requests
 * const allRequests = await getEmployeeLeaveRequests('EMP001');
 *
 * // Get pending requests only
 * const pendingRequests = await getEmployeeLeaveRequests(
 *   'EMP001',
 *   LeaveStatus.PENDING
 * );
 *
 * // Get requests for a specific period
 * const periodRequests = await getEmployeeLeaveRequests(
 *   'EMP001',
 *   undefined,
 *   new Date('2024-01-01'),
 *   new Date('2024-12-31')
 * );
 * ```
 */
export async function getEmployeeLeaveRequests(
  employeeId: string,
  status?: LeaveStatus,
  startDate?: Date,
  endDate?: Date
): Promise<LeaveRequest[]> {
  if (!employeeId) {
    throw new Error('Employee ID is required');
  }

  // In a real application, this would query the database with filters
  // For this example, we're returning mock data
  const mockRequests: LeaveRequest[] = [
    {
      id: 'LR-001',
      employeeId,
      leaveType: LeaveType.ANNUAL,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-19'),
      days: 5,
      reason: 'Family vacation',
      status: LeaveStatus.APPROVED,
      approverId: 'MGR001',
      approvedAt: new Date('2024-01-10'),
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-10'),
    },
    {
      id: 'LR-002',
      employeeId,
      leaveType: LeaveType.SICK,
      startDate: new Date('2024-02-20'),
      endDate: new Date('2024-02-21'),
      days: 2,
      reason: 'Medical appointment',
      status: LeaveStatus.PENDING,
      createdAt: new Date('2024-02-15'),
      updatedAt: new Date('2024-02-15'),
    },
  ];

  // Apply filters
  let filteredRequests = mockRequests;

  if (status) {
    filteredRequests = filteredRequests.filter((req) => req.status === status);
  }

  if (startDate) {
    filteredRequests = filteredRequests.filter((req) => req.startDate >= startDate);
  }

  if (endDate) {
    filteredRequests = filteredRequests.filter((req) => req.endDate <= endDate);
  }

  return filteredRequests;
}

/**
 * Complete leave request workflow example
 *
 * @example
 * ```typescript
 * // Example: Submit and manage a leave request
 * async function leaveRequestWorkflow() {
 *   try {
 *     // Step 1: Prepare leave request
 *     const requestData: LeaveRequestInput = {
 *       employeeId: 'EMP001',
 *       leaveType: LeaveType.ANNUAL,
 *       startDate: new Date('2024-06-15'),
 *       endDate: new Date('2024-06-19'),
 *       reason: 'Summer vacation with family',
 *       attachments: []
 *     };
 *
 *     // Step 2: Validate before submission
 *     const validation = validateLeaveRequest(requestData, 15);
 *     if (!validation.valid) {
 *       console.error('Validation failed:', validation.errors);
 *       return;
 *     }
 *
 *     if (validation.warnings.length > 0) {
 *       console.warn('Warnings:', validation.warnings);
 *     }
 *
 *     // Step 3: Submit request
 *     const request = await submitLeaveRequest(requestData, 15);
 *     console.log(`Request submitted successfully: ${request.id}`);
 *     console.log(`Status: ${request.status}`);
 *     console.log(`Days: ${request.days}`);
 *
 *     // Step 4: Check status later
 *     const status = await getLeaveRequestStatus(request.id!);
 *     console.log(`Current status: ${status.status}`);
 *
 *     // Step 5: Cancel if needed
 *     if (status.status === LeaveStatus.PENDING) {
 *       const cancelled = await cancelLeaveRequest(
 *         request.id!,
 *         'EMP001',
 *         'Plans changed'
 *       );
 *       console.log(`Request cancelled: ${cancelled.status}`);
 *     }
 *
 *     // Step 6: View all requests
 *     const allRequests = await getEmployeeLeaveRequests('EMP001');
 *     console.log(`Total requests: ${allRequests.length}`);
 *
 *     allRequests.forEach(req => {
 *       console.log(`  [${req.id}] ${req.leaveType} - ${req.status}`);
 *     });
 *   } catch (error) {
 *     console.error('Error in leave request workflow:', error);
 *   }
 * }
 * ```
 */
