/**
 * Tax Calculation Examples
 *
 * This module demonstrates progressive tax calculation with:
 * - Multiple tax brackets
 * - Various deductions (insurance, pension, etc.)
 * - Net salary computation
 * - Tax optimization strategies
 */

/**
 * Tax bracket definition for progressive taxation
 */
export interface TaxBracket {
  minIncome: number;
  maxIncome: number | null; // null for top bracket
  rate: number; // Tax rate as decimal (e.g., 0.12 for 12%)
  deduction: number; // Fixed deduction amount for this bracket
}

/**
 * Deduction item that reduces taxable income
 */
export interface Deduction {
  type: string;
  amount: number;
  description?: string;
  taxDeductible: boolean; // Whether this deduction reduces taxable income
}

/**
 * Complete tax calculation result
 */
export interface TaxCalculationResult {
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  taxBreakdown: {
    bracket: number;
    amount: number;
    rate: number;
  }[];
  totalTax: number;
  netIncome: number;
  effectiveTaxRate: number;
}

/**
 * Taiwan tax brackets for 2024 (annual income)
 * Based on Taiwan's progressive income tax system
 */
export const TAIWAN_TAX_BRACKETS_2024: TaxBracket[] = [
  { minIncome: 0, maxIncome: 560000, rate: 0.05, deduction: 0 },
  { minIncome: 560001, maxIncome: 1260000, rate: 0.12, deduction: 39200 },
  { minIncome: 1260001, maxIncome: 2520000, rate: 0.20, deduction: 140000 },
  { minIncome: 2520001, maxIncome: 4720000, rate: 0.30, deduction: 392000 },
  { minIncome: 4720001, maxIncome: null, rate: 0.40, deduction: 864000 },
];

/**
 * Standard deduction rates
 */
export const STANDARD_DEDUCTION_RATES = {
  SOCIAL_INSURANCE: 0.08, // 8%
  HOUSING_FUND: 0.12, // 12%
  PENSION: 0.06, // 6%
  HEALTH_INSURANCE: 0.02, // 2%
};

/**
 * Calculate progressive income tax based on tax brackets
 *
 * @param annualIncome - Total annual taxable income
 * @param taxBrackets - Array of tax brackets (defaults to Taiwan 2024 brackets)
 * @returns Calculated tax amount with breakdown
 * @throws Error if annual income is negative
 *
 * @example
 * ```typescript
 * const taxResult = calculateProgressiveTax(1500000);
 * console.log(`Total tax: ${taxResult.totalTax}`);
 * console.log(`Effective rate: ${(taxResult.effectiveTaxRate * 100).toFixed(2)}%`);
 * ```
 */
export function calculateProgressiveTax(
  annualIncome: number,
  taxBrackets: TaxBracket[] = TAIWAN_TAX_BRACKETS_2024
): { totalTax: number; effectiveTaxRate: number; breakdown: { bracket: number; amount: number; rate: number }[] } {
  if (annualIncome < 0) {
    throw new Error('Annual income cannot be negative');
  }

  if (annualIncome === 0) {
    return { totalTax: 0, effectiveTaxRate: 0, breakdown: [] };
  }

  let totalTax = 0;
  const breakdown: { bracket: number; amount: number; rate: number }[] = [];

  // Find the applicable bracket
  for (let i = 0; i < taxBrackets.length; i++) {
    const bracket = taxBrackets[i];

    if (annualIncome >= bracket.minIncome) {
      if (bracket.maxIncome === null || annualIncome <= bracket.maxIncome) {
        // Income falls in this bracket
        totalTax = annualIncome * bracket.rate - bracket.deduction;
        breakdown.push({
          bracket: i + 1,
          amount: totalTax,
          rate: bracket.rate,
        });
        break;
      }
    }
  }

  const effectiveTaxRate = annualIncome > 0 ? totalTax / annualIncome : 0;

  return {
    totalTax: Math.max(0, totalTax),
    effectiveTaxRate,
    breakdown,
  };
}

/**
 * Calculate total deductions from gross income
 *
 * @param grossIncome - Total gross income before deductions
 * @param deductions - Array of deduction items
 * @returns Total deductible amount and breakdown
 * @throws Error if gross income is negative
 *
 * @example
 * ```typescript
 * const deductions: Deduction[] = [
 *   { type: 'SOCIAL_INSURANCE', amount: 4800, taxDeductible: true },
 *   { type: 'HOUSING_FUND', amount: 7200, taxDeductible: true },
 *   { type: 'PENSION', amount: 3600, taxDeductible: true }
 * ];
 * const result = calculateDeductions(60000, deductions);
 * console.log(`Total deductions: ${result.totalDeductions}`);
 * ```
 */
export function calculateDeductions(
  grossIncome: number,
  deductions: Deduction[]
): {
  totalDeductions: number;
  taxDeductibleAmount: number;
  nonDeductibleAmount: number;
} {
  if (grossIncome < 0) {
    throw new Error('Gross income cannot be negative');
  }

  let taxDeductibleAmount = 0;
  let nonDeductibleAmount = 0;

  for (const deduction of deductions) {
    if (deduction.amount < 0) {
      throw new Error(`Deduction amount for ${deduction.type} cannot be negative`);
    }

    if (deduction.taxDeductible) {
      taxDeductibleAmount += deduction.amount;
    } else {
      nonDeductibleAmount += deduction.amount;
    }
  }

  return {
    totalDeductions: taxDeductibleAmount + nonDeductibleAmount,
    taxDeductibleAmount,
    nonDeductibleAmount,
  };
}

/**
 * Calculate standard deductions based on base salary
 *
 * @param baseSalary - Employee's base monthly salary
 * @param includeTypes - Types of deductions to include
 * @returns Array of calculated deductions
 *
 * @example
 * ```typescript
 * const deductions = calculateStandardDeductions(60000, [
 *   'SOCIAL_INSURANCE',
 *   'HOUSING_FUND',
 *   'PENSION'
 * ]);
 * ```
 */
export function calculateStandardDeductions(
  baseSalary: number,
  includeTypes: Array<keyof typeof STANDARD_DEDUCTION_RATES> = [
    'SOCIAL_INSURANCE',
    'HOUSING_FUND',
  ]
): Deduction[] {
  if (baseSalary < 0) {
    throw new Error('Base salary cannot be negative');
  }

  const deductions: Deduction[] = [];

  for (const type of includeTypes) {
    const rate = STANDARD_DEDUCTION_RATES[type];
    if (rate) {
      deductions.push({
        type,
        amount: baseSalary * rate,
        description: `${type.replace('_', ' ').toLowerCase()} (${(rate * 100).toFixed(0)}%)`,
        taxDeductible: true,
      });
    }
  }

  return deductions;
}

/**
 * Perform complete tax calculation with deductions
 *
 * @param monthlyGrossIncome - Monthly gross income
 * @param customDeductions - Additional custom deductions
 * @param standardDeductionTypes - Standard deduction types to apply
 * @returns Complete tax calculation result
 * @throws Error if monthly gross income is negative
 *
 * @example
 * ```typescript
 * const result = calculateNetSalary(60000, [
 *   { type: 'UNION_DUES', amount: 500, taxDeductible: false }
 * ]);
 *
 * console.log(`Gross Income: ${result.grossIncome}`);
 * console.log(`Taxable Income: ${result.taxableIncome}`);
 * console.log(`Total Tax: ${result.totalTax}`);
 * console.log(`Net Income: ${result.netIncome}`);
 * console.log(`Effective Tax Rate: ${(result.effectiveTaxRate * 100).toFixed(2)}%`);
 * ```
 */
export function calculateNetSalary(
  monthlyGrossIncome: number,
  customDeductions: Deduction[] = [],
  standardDeductionTypes: Array<keyof typeof STANDARD_DEDUCTION_RATES> = [
    'SOCIAL_INSURANCE',
    'HOUSING_FUND',
  ]
): TaxCalculationResult {
  if (monthlyGrossIncome < 0) {
    throw new Error('Monthly gross income cannot be negative');
  }

  // Convert monthly to annual income for tax calculation
  const annualGrossIncome = monthlyGrossIncome * 12;

  // Calculate standard deductions
  const standardDeductions = calculateStandardDeductions(
    monthlyGrossIncome,
    standardDeductionTypes
  );

  // Combine all deductions
  const allDeductions = [...standardDeductions, ...customDeductions];

  // Calculate total deductions
  const deductionSummary = calculateDeductions(monthlyGrossIncome, allDeductions);

  // Calculate annual taxable income
  const annualTaxableIncome = Math.max(
    0,
    annualGrossIncome - deductionSummary.taxDeductibleAmount * 12
  );

  // Calculate tax
  const taxResult = calculateProgressiveTax(annualTaxableIncome);

  // Convert back to monthly amounts
  const monthlyTax = taxResult.totalTax / 12;
  const monthlyNetIncome =
    monthlyGrossIncome - deductionSummary.totalDeductions - monthlyTax;

  return {
    grossIncome: monthlyGrossIncome,
    totalDeductions: deductionSummary.totalDeductions,
    taxableIncome: annualTaxableIncome / 12,
    taxBreakdown: taxResult.breakdown,
    totalTax: monthlyTax,
    netIncome: monthlyNetIncome,
    effectiveTaxRate: taxResult.effectiveTaxRate,
  };
}

/**
 * Compare tax impact across different income scenarios
 *
 * @param scenarios - Array of income scenarios to compare
 * @returns Comparison results for each scenario
 *
 * @example
 * ```typescript
 * const comparison = compareTaxScenarios([
 *   { name: 'Base Salary', monthlyIncome: 50000 },
 *   { name: 'With Bonus', monthlyIncome: 60000 },
 *   { name: 'With Overtime', monthlyIncome: 70000 }
 * ]);
 *
 * comparison.forEach(result => {
 *   console.log(`${result.name}:`);
 *   console.log(`  Net Income: ${result.calculation.netIncome.toFixed(2)}`);
 *   console.log(`  Effective Tax Rate: ${(result.calculation.effectiveTaxRate * 100).toFixed(2)}%`);
 * });
 * ```
 */
export function compareTaxScenarios(
  scenarios: Array<{ name: string; monthlyIncome: number; deductions?: Deduction[] }>
): Array<{ name: string; calculation: TaxCalculationResult }> {
  return scenarios.map((scenario) => ({
    name: scenario.name,
    calculation: calculateNetSalary(scenario.monthlyIncome, scenario.deductions),
  }));
}

/**
 * Calculate tax savings from additional deductions
 *
 * @param monthlyGrossIncome - Monthly gross income
 * @param additionalDeductions - Additional tax-deductible expenses
 * @returns Tax savings analysis
 *
 * @example
 * ```typescript
 * const savings = calculateTaxSavings(60000, [
 *   { type: 'PENSION', amount: 3600, taxDeductible: true },
 *   { type: 'HEALTH_INSURANCE', amount: 1200, taxDeductible: true }
 * ]);
 *
 * console.log(`Tax without deductions: ${savings.taxWithoutDeductions}`);
 * console.log(`Tax with deductions: ${savings.taxWithDeductions}`);
 * console.log(`Total savings: ${savings.totalSavings}`);
 * ```
 */
export function calculateTaxSavings(
  monthlyGrossIncome: number,
  additionalDeductions: Deduction[]
): {
  taxWithoutDeductions: number;
  taxWithDeductions: number;
  totalSavings: number;
  savingsPercentage: number;
} {
  const baseResult = calculateNetSalary(monthlyGrossIncome, []);
  const withDeductionsResult = calculateNetSalary(monthlyGrossIncome, additionalDeductions);

  const totalSavings = baseResult.totalTax - withDeductionsResult.totalTax;
  const savingsPercentage =
    baseResult.totalTax > 0 ? (totalSavings / baseResult.totalTax) * 100 : 0;

  return {
    taxWithoutDeductions: baseResult.totalTax,
    taxWithDeductions: withDeductionsResult.totalTax,
    totalSavings,
    savingsPercentage,
  };
}

/**
 * Complete tax calculation example
 *
 * @example
 * ```typescript
 * // Example: Calculate complete tax for an employee
 * const employeeIncome = {
 *   baseSalary: 60000,
 *   bonus: 10000,
 *   overtimePay: 5000,
 * };
 *
 * const monthlyGross = employeeIncome.baseSalary + employeeIncome.bonus + employeeIncome.overtimePay;
 *
 * // Custom deductions
 * const customDeductions: Deduction[] = [
 *   { type: 'UNION_DUES', amount: 500, taxDeductible: false, description: 'Monthly union fees' },
 *   { type: 'CHARITY', amount: 1000, taxDeductible: true, description: 'Charitable donations' },
 * ];
 *
 * // Calculate net salary with all deductions
 * const result = calculateNetSalary(monthlyGross, customDeductions, [
 *   'SOCIAL_INSURANCE',
 *   'HOUSING_FUND',
 *   'PENSION',
 * ]);
 *
 * console.log('Tax Calculation Result:');
 * console.log(`Gross Income: TWD ${result.grossIncome.toFixed(2)}`);
 * console.log(`Total Deductions: TWD ${result.totalDeductions.toFixed(2)}`);
 * console.log(`Taxable Income: TWD ${result.taxableIncome.toFixed(2)}`);
 * console.log(`Income Tax: TWD ${result.totalTax.toFixed(2)}`);
 * console.log(`Net Income: TWD ${result.netIncome.toFixed(2)}`);
 * console.log(`Effective Tax Rate: ${(result.effectiveTaxRate * 100).toFixed(2)}%`);
 * ```
 */
