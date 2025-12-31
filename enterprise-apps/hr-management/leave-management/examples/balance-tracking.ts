/**
 * Leave Balance Tracking Examples
 *
 * This module demonstrates leave balance management with:
 * - Checking leave balances
 * - Tracking usage by type
 * - Calculating accruals
 * - Balance history and projections
 */

import { LeaveType } from './leave-request';

/**
 * Leave balance information for a specific leave type
 */
export interface LeaveBalance {
  id?: string;
  employeeId: string;
  year: number;
  leaveType: LeaveType;
  total: number; // Total allocated days
  used: number; // Days already used
  pending: number; // Days in pending requests
  available: number; // Days available for use
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Leave accrual configuration
 */
export interface AccrualConfig {
  leaveType: LeaveType;
  accrualRate: number; // Days per month
  maxAccrual: number; // Maximum days that can accrue
  carryoverLimit: number; // Maximum days that can carry over to next year
  carryoverExpiry?: Date; // Expiry date for carried over days
}

/**
 * Leave usage summary
 */
export interface LeaveUsageSummary {
  employeeId: string;
  year: number;
  byType: Map<LeaveType, {
    total: number;
    used: number;
    pending: number;
    available: number;
    usagePercentage: number;
  }>;
  totalAvailable: number;
  totalUsed: number;
  totalPending: number;
}

/**
 * Balance projection for future periods
 */
export interface BalanceProjection {
  month: number;
  year: number;
  projectedBalance: number;
  scheduledUsage: number;
  projectedAvailable: number;
}

/**
 * Default accrual configurations for different leave types
 */
export const DEFAULT_ACCRUAL_CONFIGS: Record<LeaveType, AccrualConfig> = {
  [LeaveType.ANNUAL]: {
    leaveType: LeaveType.ANNUAL,
    accrualRate: 1.25, // 15 days per year (1.25 per month)
    maxAccrual: 30,
    carryoverLimit: 10,
  },
  [LeaveType.SICK]: {
    leaveType: LeaveType.SICK,
    accrualRate: 1.0, // 12 days per year
    maxAccrual: 60,
    carryoverLimit: 0, // Sick leave typically doesn't carry over
  },
  [LeaveType.PERSONAL]: {
    leaveType: LeaveType.PERSONAL,
    accrualRate: 0.5, // 6 days per year
    maxAccrual: 12,
    carryoverLimit: 0,
  },
  [LeaveType.MARRIAGE]: {
    leaveType: LeaveType.MARRIAGE,
    accrualRate: 0, // One-time allocation
    maxAccrual: 8,
    carryoverLimit: 0,
  },
  [LeaveType.MATERNITY]: {
    leaveType: LeaveType.MATERNITY,
    accrualRate: 0,
    maxAccrual: 98, // 14 weeks
    carryoverLimit: 0,
  },
  [LeaveType.PATERNITY]: {
    leaveType: LeaveType.PATERNITY,
    accrualRate: 0,
    maxAccrual: 7,
    carryoverLimit: 0,
  },
  [LeaveType.BEREAVEMENT]: {
    leaveType: LeaveType.BEREAVEMENT,
    accrualRate: 0,
    maxAccrual: 5,
    carryoverLimit: 0,
  },
  [LeaveType.UNPAID]: {
    leaveType: LeaveType.UNPAID,
    accrualRate: 0,
    maxAccrual: 365, // Unlimited for practical purposes
    carryoverLimit: 0,
  },
};

/**
 * Get leave balance for a specific leave type
 *
 * @param employeeId - Employee ID
 * @param year - Year for the balance
 * @param leaveType - Type of leave
 * @returns Leave balance information
 * @throws Error if employee ID or year is invalid
 *
 * @example
 * ```typescript
 * const balance = await getLeaveBalance('EMP001', 2024, LeaveType.ANNUAL);
 * console.log(`Available: ${balance.available} days`);
 * console.log(`Used: ${balance.used} days`);
 * console.log(`Pending: ${balance.pending} days`);
 * ```
 */
export async function getLeaveBalance(
  employeeId: string,
  year: number,
  leaveType: LeaveType
): Promise<LeaveBalance> {
  if (!employeeId) {
    throw new Error('Employee ID is required');
  }

  if (year < 2000 || year > 2100) {
    throw new Error('Invalid year');
  }

  // In a real application, this would fetch from a database
  // For this example, we're returning mock data
  const mockBalance: LeaveBalance = {
    id: `BAL-${employeeId}-${year}-${leaveType}`,
    employeeId,
    year,
    leaveType,
    total: 15,
    used: 5,
    pending: 2,
    available: 8,
    createdAt: new Date(`${year}-01-01`),
    updatedAt: new Date(),
  };

  return mockBalance;
}

/**
 * Get all leave balances for an employee in a given year
 *
 * @param employeeId - Employee ID
 * @param year - Year for the balances
 * @returns Array of leave balances for all leave types
 *
 * @example
 * ```typescript
 * const balances = await getAllLeaveBalances('EMP001', 2024);
 * balances.forEach(balance => {
 *   console.log(`${balance.leaveType}: ${balance.available}/${balance.total} days`);
 * });
 * ```
 */
export async function getAllLeaveBalances(
  employeeId: string,
  year: number
): Promise<LeaveBalance[]> {
  if (!employeeId) {
    throw new Error('Employee ID is required');
  }

  const balances: LeaveBalance[] = [];

  // Get balance for each leave type
  for (const leaveType of Object.values(LeaveType)) {
    try {
      const balance = await getLeaveBalance(employeeId, year, leaveType);
      balances.push(balance);
    } catch (error) {
      console.warn(`Failed to get balance for ${leaveType}:`, error);
    }
  }

  return balances;
}

/**
 * Calculate accrued leave days based on employment duration
 *
 * @param config - Accrual configuration
 * @param employmentStartDate - Employee's start date
 * @param currentDate - Current date (defaults to today)
 * @returns Number of accrued days
 * @throws Error if dates are invalid
 *
 * @example
 * ```typescript
 * const accrued = calculateAccruedLeave(
 *   DEFAULT_ACCRUAL_CONFIGS[LeaveType.ANNUAL],
 *   new Date('2023-01-01'),
 *   new Date('2024-06-30')
 * );
 * console.log(`Accrued annual leave: ${accrued} days`);
 * ```
 */
export function calculateAccruedLeave(
  config: AccrualConfig,
  employmentStartDate: Date,
  currentDate: Date = new Date()
): number {
  if (currentDate < employmentStartDate) {
    throw new Error('Current date cannot be before employment start date');
  }

  // Calculate months of employment
  const yearsDiff = currentDate.getFullYear() - employmentStartDate.getFullYear();
  const monthsDiff = currentDate.getMonth() - employmentStartDate.getMonth();
  const totalMonths = yearsDiff * 12 + monthsDiff;

  // Calculate accrued days
  const accruedDays = Math.min(
    totalMonths * config.accrualRate,
    config.maxAccrual
  );

  return Math.floor(accruedDays * 10) / 10; // Round to 1 decimal place
}

/**
 * Update leave balance after a request is approved
 *
 * @param balance - Current leave balance
 * @param daysUsed - Number of days to deduct
 * @returns Updated leave balance
 * @throws Error if insufficient balance
 *
 * @example
 * ```typescript
 * const updatedBalance = updateBalanceAfterApproval(currentBalance, 5);
 * console.log(`New available balance: ${updatedBalance.available} days`);
 * ```
 */
export function updateBalanceAfterApproval(
  balance: LeaveBalance,
  daysUsed: number
): LeaveBalance {
  if (daysUsed < 0) {
    throw new Error('Days used cannot be negative');
  }

  if (daysUsed > balance.pending) {
    throw new Error('Days used exceeds pending amount');
  }

  return {
    ...balance,
    used: balance.used + daysUsed,
    pending: balance.pending - daysUsed,
    updatedAt: new Date(),
  };
}

/**
 * Update leave balance after a request is submitted
 *
 * @param balance - Current leave balance
 * @param daysRequested - Number of days requested
 * @returns Updated leave balance
 * @throws Error if insufficient available balance
 *
 * @example
 * ```typescript
 * const updatedBalance = updateBalanceAfterRequest(currentBalance, 3);
 * console.log(`Pending: ${updatedBalance.pending} days`);
 * console.log(`Available: ${updatedBalance.available} days`);
 * ```
 */
export function updateBalanceAfterRequest(
  balance: LeaveBalance,
  daysRequested: number
): LeaveBalance {
  if (daysRequested < 0) {
    throw new Error('Days requested cannot be negative');
  }

  if (daysRequested > balance.available) {
    throw new Error(
      `Insufficient leave balance. Requested: ${daysRequested}, Available: ${balance.available}`
    );
  }

  return {
    ...balance,
    pending: balance.pending + daysRequested,
    available: balance.available - daysRequested,
    updatedAt: new Date(),
  };
}

/**
 * Restore leave balance after a request is cancelled or rejected
 *
 * @param balance - Current leave balance
 * @param daysToRestore - Number of days to restore
 * @returns Updated leave balance
 *
 * @example
 * ```typescript
 * const updatedBalance = restoreBalance(currentBalance, 5);
 * console.log(`Restored balance: ${updatedBalance.available} days`);
 * ```
 */
export function restoreBalance(
  balance: LeaveBalance,
  daysToRestore: number
): LeaveBalance {
  if (daysToRestore < 0) {
    throw new Error('Days to restore cannot be negative');
  }

  return {
    ...balance,
    pending: Math.max(0, balance.pending - daysToRestore),
    available: balance.available + daysToRestore,
    updatedAt: new Date(),
  };
}

/**
 * Generate leave usage summary for an employee
 *
 * @param employeeId - Employee ID
 * @param year - Year for the summary
 * @returns Leave usage summary with statistics
 *
 * @example
 * ```typescript
 * const summary = await generateLeaveUsageSummary('EMP001', 2024);
 * console.log(`Total available: ${summary.totalAvailable} days`);
 * console.log(`Total used: ${summary.totalUsed} days`);
 *
 * summary.byType.forEach((stats, leaveType) => {
 *   console.log(`${leaveType}:`);
 *   console.log(`  Used: ${stats.used}/${stats.total} (${stats.usagePercentage}%)`);
 *   console.log(`  Available: ${stats.available} days`);
 * });
 * ```
 */
export async function generateLeaveUsageSummary(
  employeeId: string,
  year: number
): Promise<LeaveUsageSummary> {
  const balances = await getAllLeaveBalances(employeeId, year);

  const byType = new Map<LeaveType, {
    total: number;
    used: number;
    pending: number;
    available: number;
    usagePercentage: number;
  }>();

  let totalAvailable = 0;
  let totalUsed = 0;
  let totalPending = 0;

  balances.forEach((balance) => {
    const usagePercentage = balance.total > 0
      ? (balance.used / balance.total) * 100
      : 0;

    byType.set(balance.leaveType, {
      total: balance.total,
      used: balance.used,
      pending: balance.pending,
      available: balance.available,
      usagePercentage: Math.round(usagePercentage * 10) / 10,
    });

    totalAvailable += balance.available;
    totalUsed += balance.used;
    totalPending += balance.pending;
  });

  return {
    employeeId,
    year,
    byType,
    totalAvailable,
    totalUsed,
    totalPending,
  };
}

/**
 * Project future leave balances
 *
 * @param balance - Current leave balance
 * @param config - Accrual configuration
 * @param scheduledLeave - Array of scheduled leave days per month
 * @param months - Number of months to project
 * @returns Array of balance projections
 *
 * @example
 * ```typescript
 * const projections = projectFutureBalance(
 *   currentBalance,
 *   DEFAULT_ACCRUAL_CONFIGS[LeaveType.ANNUAL],
 *   [0, 5, 0, 10, 0, 0], // Scheduled leave for next 6 months
 *   6
 * );
 *
 * projections.forEach(proj => {
 *   console.log(`${proj.year}-${proj.month}: ${proj.projectedAvailable} days available`);
 * });
 * ```
 */
export function projectFutureBalance(
  balance: LeaveBalance,
  config: AccrualConfig,
  scheduledLeave: number[] = [],
  months: number = 12
): BalanceProjection[] {
  const projections: BalanceProjection[] = [];
  const currentDate = new Date();
  let currentBalance = balance.available;

  for (let i = 0; i < months; i++) {
    const projectionDate = new Date(currentDate);
    projectionDate.setMonth(projectionDate.getMonth() + i + 1);

    const scheduledUsage = scheduledLeave[i] || 0;
    const monthlyAccrual = config.accrualRate;

    currentBalance = Math.min(
      currentBalance + monthlyAccrual - scheduledUsage,
      config.maxAccrual
    );

    projections.push({
      month: projectionDate.getMonth() + 1,
      year: projectionDate.getFullYear(),
      projectedBalance: currentBalance + monthlyAccrual,
      scheduledUsage,
      projectedAvailable: Math.max(0, currentBalance),
    });
  }

  return projections;
}

/**
 * Calculate carryover balance for next year
 *
 * @param balance - Current year's leave balance
 * @param config - Accrual configuration
 * @returns Number of days that can be carried over
 *
 * @example
 * ```typescript
 * const carryover = calculateCarryover(currentBalance, annualLeaveConfig);
 * console.log(`Days carrying over to next year: ${carryover}`);
 * ```
 */
export function calculateCarryover(
  balance: LeaveBalance,
  config: AccrualConfig
): number {
  const unusedDays = balance.available;
  return Math.min(unusedDays, config.carryoverLimit);
}

/**
 * Complete balance tracking example
 *
 * @example
 * ```typescript
 * // Example: Track and manage leave balances
 * async function balanceTrackingWorkflow() {
 *   const employeeId = 'EMP001';
 *   const year = 2024;
 *
 *   // Get current balance
 *   const annualBalance = await getLeaveBalance(employeeId, year, LeaveType.ANNUAL);
 *   console.log('Current Annual Leave Balance:');
 *   console.log(`  Total: ${annualBalance.total} days`);
 *   console.log(`  Used: ${annualBalance.used} days`);
 *   console.log(`  Pending: ${annualBalance.pending} days`);
 *   console.log(`  Available: ${annualBalance.available} days`);
 *
 *   // Calculate accrued leave
 *   const accrued = calculateAccruedLeave(
 *     DEFAULT_ACCRUAL_CONFIGS[LeaveType.ANNUAL],
 *     new Date('2020-01-01')
 *   );
 *   console.log(`\nTotal accrued since hire: ${accrued} days`);
 *
 *   // Get all balances
 *   const allBalances = await getAllLeaveBalances(employeeId, year);
 *   console.log('\nAll Leave Types:');
 *   allBalances.forEach(bal => {
 *     console.log(`  ${bal.leaveType}: ${bal.available}/${bal.total} days`);
 *   });
 *
 *   // Generate usage summary
 *   const summary = await generateLeaveUsageSummary(employeeId, year);
 *   console.log('\nUsage Summary:');
 *   console.log(`  Total Available: ${summary.totalAvailable} days`);
 *   console.log(`  Total Used: ${summary.totalUsed} days`);
 *   console.log(`  Total Pending: ${summary.totalPending} days`);
 *
 *   // Project future balance
 *   const projections = projectFutureBalance(
 *     annualBalance,
 *     DEFAULT_ACCRUAL_CONFIGS[LeaveType.ANNUAL],
 *     [0, 5, 0, 3, 0, 0], // Scheduled leave
 *     6 // Project 6 months
 *   );
 *
 *   console.log('\nBalance Projections:');
 *   projections.forEach(proj => {
 *     console.log(`  ${proj.year}-${String(proj.month).padStart(2, '0')}: ${proj.projectedAvailable.toFixed(1)} days`);
 *   });
 *
 *   // Calculate carryover
 *   const carryover = calculateCarryover(
 *     annualBalance,
 *     DEFAULT_ACCRUAL_CONFIGS[LeaveType.ANNUAL]
 *   );
 *   console.log(`\nDays eligible for carryover to next year: ${carryover}`);
 * }
 * ```
 */
