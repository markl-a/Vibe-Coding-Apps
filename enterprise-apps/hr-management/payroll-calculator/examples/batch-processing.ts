/**
 * Batch Payroll Processing Examples
 *
 * This module demonstrates batch processing of employee payrolls with:
 * - Processing multiple employees simultaneously
 * - Bulk payroll generation
 * - Error handling and retry mechanisms
 * - Progress tracking and reporting
 * - Transaction management
 */

import type { Allowance } from './salary-calculation';
import type { Deduction, TaxCalculationResult } from './tax-calculation';
import { calculateNetSalary } from './tax-calculation';
import { generatePayslipSummary, type PayslipSummary } from './salary-calculation';

/**
 * Employee payroll input data
 */
export interface EmployeePayrollInput {
  employeeId: string;
  employeeName: string;
  baseSalary: number;
  allowances?: Allowance[];
  overtimePay?: number;
  bonus?: number;
  deductions?: Deduction[];
}

/**
 * Payroll processing result for a single employee
 */
export interface PayrollProcessingResult {
  employeeId: string;
  employeeName: string;
  success: boolean;
  payslip?: PayslipSummary;
  taxCalculation?: TaxCalculationResult;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  processingTime: number; // milliseconds
}

/**
 * Batch processing summary
 */
export interface BatchProcessingSummary {
  totalEmployees: number;
  successful: number;
  failed: number;
  skipped: number;
  totalProcessingTime: number;
  results: PayrollProcessingResult[];
  errors: Array<{
    employeeId: string;
    error: string;
  }>;
  statistics: {
    totalPayroll: number;
    averageSalary: number;
    minSalary: number;
    maxSalary: number;
    totalTax: number;
  };
}

/**
 * Batch processing options
 */
export interface BatchProcessingOptions {
  period: string;
  currency?: string;
  concurrency?: number; // Number of concurrent operations
  retryAttempts?: number;
  retryDelay?: number; // milliseconds
  stopOnError?: boolean;
  validateOnly?: boolean; // Dry run mode
}

/**
 * Process payroll for a single employee
 *
 * @param employee - Employee payroll input data
 * @param period - Pay period (e.g., "2024-01")
 * @param currency - Currency code (default: "TWD")
 * @returns Processing result for the employee
 *
 * @example
 * ```typescript
 * const employee = {
 *   employeeId: 'EMP001',
 *   employeeName: 'John Doe',
 *   baseSalary: 60000,
 *   allowances: [{ type: 'TRANSPORT', amount: 2000 }],
 *   bonus: 5000
 * };
 *
 * const result = await processSinglePayroll(employee, '2024-01');
 * if (result.success) {
 *   console.log(`Processed: ${result.employeeName} - Net: ${result.payslip?.netSalary}`);
 * }
 * ```
 */
export async function processSinglePayroll(
  employee: EmployeePayrollInput,
  period: string,
  currency: string = 'TWD'
): Promise<PayrollProcessingResult> {
  const startTime = Date.now();

  try {
    // Validate employee data
    if (!employee.employeeId) {
      throw new Error('Employee ID is required');
    }

    if (!employee.employeeName) {
      throw new Error('Employee name is required');
    }

    if (employee.baseSalary < 0) {
      throw new Error('Base salary cannot be negative');
    }

    // Calculate tax and net salary
    const taxCalculation = calculateNetSalary(
      employee.baseSalary,
      employee.deductions || []
    );

    // Generate payslip
    const payslip = generatePayslipSummary({
      employeeId: employee.employeeId,
      period,
      baseSalary: employee.baseSalary,
      allowances: employee.allowances,
      overtimePay: employee.overtimePay,
      bonus: employee.bonus,
      tax: taxCalculation.totalTax,
      socialInsurance: taxCalculation.totalDeductions * 0.4, // Approximate split
      housingFund: taxCalculation.totalDeductions * 0.6,
      currency,
    });

    return {
      employeeId: employee.employeeId,
      employeeName: employee.employeeName,
      success: true,
      payslip,
      taxCalculation,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      employeeId: employee.employeeId,
      employeeName: employee.employeeName,
      success: false,
      error: {
        code: 'PROCESSING_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error,
      },
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Process payroll for multiple employees in batch
 *
 * @param employees - Array of employee payroll inputs
 * @param options - Batch processing options
 * @returns Batch processing summary with all results
 * @throws Error if critical validation fails
 *
 * @example
 * ```typescript
 * const employees = [
 *   { employeeId: 'EMP001', employeeName: 'John Doe', baseSalary: 60000 },
 *   { employeeId: 'EMP002', employeeName: 'Jane Smith', baseSalary: 75000 },
 *   { employeeId: 'EMP003', employeeName: 'Bob Johnson', baseSalary: 50000 },
 * ];
 *
 * const summary = await processBatchPayroll(employees, {
 *   period: '2024-01',
 *   currency: 'TWD',
 *   concurrency: 5,
 *   retryAttempts: 3
 * });
 *
 * console.log(`Processed: ${summary.successful}/${summary.totalEmployees}`);
 * console.log(`Total payroll: ${summary.statistics.totalPayroll}`);
 * ```
 */
export async function processBatchPayroll(
  employees: EmployeePayrollInput[],
  options: BatchProcessingOptions
): Promise<BatchProcessingSummary> {
  const {
    period,
    currency = 'TWD',
    concurrency = 10,
    retryAttempts = 3,
    retryDelay = 1000,
    stopOnError = false,
    validateOnly = false,
  } = options;

  const startTime = Date.now();
  const results: PayrollProcessingResult[] = [];
  const errors: Array<{ employeeId: string; error: string }> = [];

  // Validate period format
  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    throw new Error('Period must be in format YYYY-MM');
  }

  // Validate employees array
  if (!Array.isArray(employees) || employees.length === 0) {
    throw new Error('Employees array cannot be empty');
  }

  // Process employees in batches based on concurrency
  for (let i = 0; i < employees.length; i += concurrency) {
    const batch = employees.slice(i, i + concurrency);

    // Process current batch
    const batchPromises = batch.map(async (employee) => {
      let lastError: Error | null = null;
      let attempts = 0;

      // Retry logic
      while (attempts < retryAttempts) {
        try {
          if (validateOnly) {
            // Validation mode - just check data without processing
            return {
              employeeId: employee.employeeId,
              employeeName: employee.employeeName,
              success: true,
              processingTime: 0,
            } as PayrollProcessingResult;
          }

          const result = await processSinglePayroll(employee, period, currency);

          if (result.success) {
            return result;
          } else {
            lastError = new Error(result.error?.message || 'Processing failed');
          }
        } catch (error) {
          lastError = error as Error;
          attempts++;

          if (attempts < retryAttempts) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
        }
      }

      // All retry attempts failed
      return {
        employeeId: employee.employeeId,
        employeeName: employee.employeeName,
        success: false,
        error: {
          code: 'MAX_RETRIES_EXCEEDED',
          message: lastError?.message || 'Processing failed after all retries',
        },
        processingTime: 0,
      } as PayrollProcessingResult;
    });

    // Wait for current batch to complete
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Check for errors and stop if needed
    const batchErrors = batchResults.filter((r) => !r.success);
    if (batchErrors.length > 0 && stopOnError) {
      errors.push(
        ...batchErrors.map((r) => ({
          employeeId: r.employeeId,
          error: r.error?.message || 'Unknown error',
        }))
      );
      break;
    }
  }

  // Calculate statistics
  const successfulResults = results.filter((r) => r.success && r.payslip);
  const netSalaries = successfulResults.map((r) => r.payslip!.netSalary);
  const totalPayroll = netSalaries.reduce((sum, salary) => sum + salary, 0);
  const totalTax = successfulResults.reduce(
    (sum, r) => sum + (r.taxCalculation?.totalTax || 0),
    0
  );

  const statistics = {
    totalPayroll,
    averageSalary: netSalaries.length > 0 ? totalPayroll / netSalaries.length : 0,
    minSalary: netSalaries.length > 0 ? Math.min(...netSalaries) : 0,
    maxSalary: netSalaries.length > 0 ? Math.max(...netSalaries) : 0,
    totalTax,
  };

  // Collect all errors
  results.forEach((result) => {
    if (!result.success && result.error) {
      errors.push({
        employeeId: result.employeeId,
        error: result.error.message,
      });
    }
  });

  return {
    totalEmployees: employees.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    skipped: employees.length - results.length,
    totalProcessingTime: Date.now() - startTime,
    results,
    errors,
    statistics,
  };
}

/**
 * Validate batch payroll data before processing
 *
 * @param employees - Array of employee payroll inputs
 * @returns Validation results
 *
 * @example
 * ```typescript
 * const validation = validateBatchData(employees);
 * if (!validation.valid) {
 *   console.error('Validation errors:', validation.errors);
 * }
 * ```
 */
export function validateBatchData(employees: EmployeePayrollInput[]): {
  valid: boolean;
  errors: Array<{
    employeeId: string;
    field: string;
    message: string;
  }>;
} {
  const errors: Array<{ employeeId: string; field: string; message: string }> = [];

  employees.forEach((employee) => {
    if (!employee.employeeId) {
      errors.push({
        employeeId: employee.employeeId || 'UNKNOWN',
        field: 'employeeId',
        message: 'Employee ID is required',
      });
    }

    if (!employee.employeeName) {
      errors.push({
        employeeId: employee.employeeId,
        field: 'employeeName',
        message: 'Employee name is required',
      });
    }

    if (employee.baseSalary === undefined || employee.baseSalary < 0) {
      errors.push({
        employeeId: employee.employeeId,
        field: 'baseSalary',
        message: 'Base salary must be a non-negative number',
      });
    }

    if (employee.overtimePay && employee.overtimePay < 0) {
      errors.push({
        employeeId: employee.employeeId,
        field: 'overtimePay',
        message: 'Overtime pay cannot be negative',
      });
    }

    if (employee.bonus && employee.bonus < 0) {
      errors.push({
        employeeId: employee.employeeId,
        field: 'bonus',
        message: 'Bonus cannot be negative',
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate batch processing report
 *
 * @param summary - Batch processing summary
 * @returns Formatted report string
 *
 * @example
 * ```typescript
 * const report = generateBatchReport(summary);
 * console.log(report);
 * ```
 */
export function generateBatchReport(summary: BatchProcessingSummary): string {
  const lines: string[] = [];

  lines.push('='.repeat(60));
  lines.push('BATCH PAYROLL PROCESSING REPORT');
  lines.push('='.repeat(60));
  lines.push('');

  lines.push('SUMMARY:');
  lines.push(`  Total Employees: ${summary.totalEmployees}`);
  lines.push(`  Successful: ${summary.successful}`);
  lines.push(`  Failed: ${summary.failed}`);
  lines.push(`  Skipped: ${summary.skipped}`);
  lines.push(`  Processing Time: ${(summary.totalProcessingTime / 1000).toFixed(2)}s`);
  lines.push('');

  lines.push('STATISTICS:');
  lines.push(`  Total Payroll: ${summary.statistics.totalPayroll.toFixed(2)}`);
  lines.push(`  Average Salary: ${summary.statistics.averageSalary.toFixed(2)}`);
  lines.push(`  Min Salary: ${summary.statistics.minSalary.toFixed(2)}`);
  lines.push(`  Max Salary: ${summary.statistics.maxSalary.toFixed(2)}`);
  lines.push(`  Total Tax: ${summary.statistics.totalTax.toFixed(2)}`);
  lines.push('');

  if (summary.errors.length > 0) {
    lines.push('ERRORS:');
    summary.errors.forEach((error) => {
      lines.push(`  [${error.employeeId}] ${error.error}`);
    });
    lines.push('');
  }

  lines.push('='.repeat(60));

  return lines.join('\n');
}

/**
 * Complete batch processing example
 *
 * @example
 * ```typescript
 * // Example: Process payroll for a department
 * const departmentEmployees: EmployeePayrollInput[] = [
 *   {
 *     employeeId: 'EMP001',
 *     employeeName: 'John Doe',
 *     baseSalary: 60000,
 *     allowances: [
 *       { type: 'TRANSPORT', amount: 2000 },
 *       { type: 'MEAL', amount: 3000 }
 *     ],
 *     bonus: 10000,
 *     overtimePay: 5000
 *   },
 *   {
 *     employeeId: 'EMP002',
 *     employeeName: 'Jane Smith',
 *     baseSalary: 75000,
 *     allowances: [
 *       { type: 'TRANSPORT', amount: 2000 }
 *     ],
 *     bonus: 15000
 *   },
 *   {
 *     employeeId: 'EMP003',
 *     employeeName: 'Bob Johnson',
 *     baseSalary: 50000,
 *     overtimePay: 3000
 *   }
 * ];
 *
 * // Validate data first
 * const validation = validateBatchData(departmentEmployees);
 * if (!validation.valid) {
 *   console.error('Validation failed:', validation.errors);
 *   process.exit(1);
 * }
 *
 * // Process payroll
 * const summary = await processBatchPayroll(departmentEmployees, {
 *   period: '2024-01',
 *   currency: 'TWD',
 *   concurrency: 5,
 *   retryAttempts: 3,
 *   retryDelay: 1000,
 *   stopOnError: false
 * });
 *
 * // Generate and print report
 * const report = generateBatchReport(summary);
 * console.log(report);
 *
 * // Handle failures
 * if (summary.failed > 0) {
 *   console.error('\nFailed employees:');
 *   summary.results
 *     .filter(r => !r.success)
 *     .forEach(r => {
 *       console.error(`  ${r.employeeName}: ${r.error?.message}`);
 *     });
 * }
 * ```
 */
