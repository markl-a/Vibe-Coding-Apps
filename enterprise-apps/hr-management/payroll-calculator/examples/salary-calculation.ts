/**
 * Salary Calculation Examples
 *
 * This module demonstrates how to calculate employee salaries with:
 * - Base salary computation
 * - Overtime pay calculation
 * - Bonus allocation
 * - Tax bracket application
 * - Payslip generation
 */

/**
 * Represents an allowance added to employee base salary
 */
export interface Allowance {
  type: string;
  amount: number;
  description?: string;
}

/**
 * Overtime calculation configuration
 */
export interface OvertimeConfig {
  regularHours: number;
  overtimeHours: number;
  hourlyRate: number;
  overtimeMultiplier: number; // e.g., 1.5 for time-and-a-half
}

/**
 * Payslip summary containing all salary components
 */
export interface PayslipSummary {
  employeeId: string;
  period: string;
  earnings: {
    baseSalary: number;
    allowances: Allowance[];
    allowanceTotal: number;
    overtimePay: number;
    bonus: number;
    totalEarnings: number;
  };
  deductions: {
    tax: number;
    socialInsurance: number;
    housingFund: number;
    totalDeductions: number;
  };
  netSalary: number;
  currency: string;
}

/**
 * Calculate overtime pay based on hours worked
 *
 * @param config - Overtime calculation configuration
 * @returns Calculated overtime pay amount
 * @throws Error if overtime hours are negative or configuration is invalid
 *
 * @example
 * ```typescript
 * const overtimePay = calculateOvertimePay({
 *   regularHours: 160,
 *   overtimeHours: 20,
 *   hourlyRate: 250,
 *   overtimeMultiplier: 1.5
 * });
 * console.log(`Overtime pay: ${overtimePay}`); // 7500
 * ```
 */
export function calculateOvertimePay(config: OvertimeConfig): number {
  const { regularHours, overtimeHours, hourlyRate, overtimeMultiplier } = config;

  if (overtimeHours < 0) {
    throw new Error('Overtime hours cannot be negative');
  }

  if (hourlyRate <= 0) {
    throw new Error('Hourly rate must be greater than zero');
  }

  if (overtimeMultiplier < 1) {
    throw new Error('Overtime multiplier must be at least 1.0');
  }

  return overtimeHours * hourlyRate * overtimeMultiplier;
}

/**
 * Calculate total earnings including base salary, allowances, overtime, and bonuses
 *
 * @param baseSalary - Employee's base monthly salary
 * @param allowances - Array of additional allowances
 * @param overtimePay - Calculated overtime payment
 * @param bonus - Performance or other bonuses
 * @returns Total earnings before deductions
 * @throws Error if base salary is negative
 *
 * @example
 * ```typescript
 * const totalEarnings = calculateTotalEarnings(
 *   50000,
 *   [
 *     { type: 'TRANSPORT', amount: 2000 },
 *     { type: 'MEAL', amount: 3000 }
 *   ],
 *   7500,
 *   10000
 * );
 * console.log(`Total earnings: ${totalEarnings}`); // 72500
 * ```
 */
export function calculateTotalEarnings(
  baseSalary: number,
  allowances: Allowance[] = [],
  overtimePay: number = 0,
  bonus: number = 0
): number {
  if (baseSalary < 0) {
    throw new Error('Base salary cannot be negative');
  }

  const allowanceTotal = allowances.reduce((sum, allowance) => {
    if (allowance.amount < 0) {
      throw new Error(`Allowance amount for ${allowance.type} cannot be negative`);
    }
    return sum + allowance.amount;
  }, 0);

  return baseSalary + allowanceTotal + overtimePay + bonus;
}

/**
 * Generate a comprehensive payslip summary
 *
 * @param employeeId - Unique employee identifier
 * @param period - Pay period (e.g., "2024-01")
 * @param baseSalary - Base monthly salary
 * @param allowances - Array of allowances
 * @param overtimePay - Overtime payment
 * @param bonus - Bonus amount
 * @param tax - Calculated tax amount
 * @param socialInsurance - Social insurance deduction
 * @param housingFund - Housing fund deduction
 * @param currency - Currency code (default: "TWD")
 * @returns Complete payslip summary
 * @throws Error if any required field is invalid
 *
 * @example
 * ```typescript
 * const payslip = generatePayslipSummary({
 *   employeeId: 'EMP001',
 *   period: '2024-01',
 *   baseSalary: 50000,
 *   allowances: [
 *     { type: 'TRANSPORT', amount: 2000, description: 'Monthly transport allowance' },
 *     { type: 'MEAL', amount: 3000, description: 'Meal vouchers' }
 *   ],
 *   overtimePay: 7500,
 *   bonus: 10000,
 *   tax: 8625,
 *   socialInsurance: 4000,
 *   housingFund: 6000,
 *   currency: 'TWD'
 * });
 *
 * console.log(`Net Salary: ${payslip.currency} ${payslip.netSalary}`);
 * ```
 */
export function generatePayslipSummary(params: {
  employeeId: string;
  period: string;
  baseSalary: number;
  allowances?: Allowance[];
  overtimePay?: number;
  bonus?: number;
  tax: number;
  socialInsurance: number;
  housingFund: number;
  currency?: string;
}): PayslipSummary {
  const {
    employeeId,
    period,
    baseSalary,
    allowances = [],
    overtimePay = 0,
    bonus = 0,
    tax,
    socialInsurance,
    housingFund,
    currency = 'TWD',
  } = params;

  if (!employeeId) {
    throw new Error('Employee ID is required');
  }

  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    throw new Error('Period must be in format YYYY-MM');
  }

  const allowanceTotal = allowances.reduce((sum, a) => sum + a.amount, 0);
  const totalEarnings = calculateTotalEarnings(baseSalary, allowances, overtimePay, bonus);
  const totalDeductions = tax + socialInsurance + housingFund;
  const netSalary = totalEarnings - totalDeductions;

  return {
    employeeId,
    period,
    earnings: {
      baseSalary,
      allowances,
      allowanceTotal,
      overtimePay,
      bonus,
      totalEarnings,
    },
    deductions: {
      tax,
      socialInsurance,
      housingFund,
      totalDeductions,
    },
    netSalary,
    currency,
  };
}

/**
 * Calculate base salary for different pay periods
 *
 * @param annualSalary - Annual salary amount
 * @param payPeriod - Pay period type ('monthly', 'biweekly', 'weekly')
 * @returns Salary for the specified pay period
 * @throws Error if annual salary is negative or pay period is invalid
 *
 * @example
 * ```typescript
 * const monthlySalary = calculateBaseSalary(600000, 'monthly');
 * console.log(`Monthly salary: ${monthlySalary}`); // 50000
 *
 * const biweeklySalary = calculateBaseSalary(600000, 'biweekly');
 * console.log(`Biweekly salary: ${biweeklySalary}`); // 23076.92
 * ```
 */
export function calculateBaseSalary(
  annualSalary: number,
  payPeriod: 'monthly' | 'biweekly' | 'weekly'
): number {
  if (annualSalary < 0) {
    throw new Error('Annual salary cannot be negative');
  }

  switch (payPeriod) {
    case 'monthly':
      return annualSalary / 12;
    case 'biweekly':
      return annualSalary / 26;
    case 'weekly':
      return annualSalary / 52;
    default:
      throw new Error(`Invalid pay period: ${payPeriod}`);
  }
}

/**
 * Complete salary calculation example
 *
 * @example
 * ```typescript
 * // Example: Calculate complete salary for an employee
 * const employeeSalary = {
 *   employeeId: 'EMP001',
 *   annualSalary: 600000,
 *   period: '2024-01',
 * };
 *
 * // Calculate base monthly salary
 * const baseSalary = calculateBaseSalary(employeeSalary.annualSalary, 'monthly');
 *
 * // Calculate overtime pay
 * const overtimePay = calculateOvertimePay({
 *   regularHours: 160,
 *   overtimeHours: 20,
 *   hourlyRate: baseSalary / 160,
 *   overtimeMultiplier: 1.5
 * });
 *
 * // Define allowances
 * const allowances: Allowance[] = [
 *   { type: 'TRANSPORT', amount: 2000, description: 'Monthly transport' },
 *   { type: 'MEAL', amount: 3000, description: 'Meal vouchers' },
 *   { type: 'HOUSING', amount: 5000, description: 'Housing allowance' }
 * ];
 *
 * // Performance bonus
 * const bonus = 10000;
 *
 * // Calculate deductions (simplified)
 * const socialInsurance = baseSalary * 0.08;
 * const housingFund = baseSalary * 0.12;
 * const totalEarnings = calculateTotalEarnings(baseSalary, allowances, overtimePay, bonus);
 * const taxableIncome = totalEarnings - socialInsurance - housingFund;
 * const tax = taxableIncome * 0.12; // Simplified tax calculation
 *
 * // Generate payslip
 * const payslip = generatePayslipSummary({
 *   employeeId: employeeSalary.employeeId,
 *   period: employeeSalary.period,
 *   baseSalary,
 *   allowances,
 *   overtimePay,
 *   bonus,
 *   tax,
 *   socialInsurance,
 *   housingFund,
 * });
 *
 * console.log('Payslip Summary:');
 * console.log(`Employee: ${payslip.employeeId}`);
 * console.log(`Period: ${payslip.period}`);
 * console.log(`Total Earnings: ${payslip.currency} ${payslip.earnings.totalEarnings}`);
 * console.log(`Total Deductions: ${payslip.currency} ${payslip.deductions.totalDeductions}`);
 * console.log(`Net Salary: ${payslip.currency} ${payslip.netSalary}`);
 * ```
 */
