/**
 * Data Validation Rules Examples
 *
 * Demonstrates comprehensive data validation patterns:
 * 1. Schema-based validation (structure, types, constraints)
 * 2. Business rule validation
 * 3. Cross-field validation
 * 4. Reference data validation
 * 5. Pattern and format validation
 * 6. Custom validation rules
 */

import { z } from 'zod';

// ============================================================================
// Type Definitions
// ============================================================================

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  validRecords: number;
  invalidRecords: number;
  totalRecords: number;
}

interface ValidationError {
  recordIndex: number;
  field: string;
  value: unknown;
  rule: string;
  message: string;
  severity: 'error' | 'critical';
}

interface ValidationWarning {
  recordIndex: number;
  field: string;
  value: unknown;
  rule: string;
  message: string;
}

interface ValidationRule<T = unknown> {
  name: string;
  description: string;
  validate: (record: T, index: number) => ValidationRuleResult;
  severity?: 'error' | 'warning' | 'critical';
}

interface ValidationRuleResult {
  isValid: boolean;
  errors: Array<{ field: string; value: unknown; message: string }>;
  warnings: Array<{ field: string; value: unknown; message: string }>;
}

type Record = Record<string, unknown>;

// ============================================================================
// Example 1: Schema-based Validator
// ============================================================================

class SchemaValidator<T extends z.ZodType> {
  constructor(
    private schema: T,
    private options: {
      strict?: boolean;
      coerce?: boolean;
    } = {}
  ) {}

  validate(data: unknown[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let validRecords = 0;

    console.log('='.repeat(80));
    console.log('Schema Validation');
    console.log('='.repeat(80));

    data.forEach((record, index) => {
      const result = this.schema.safeParse(record);

      if (result.success) {
        validRecords++;
      } else {
        result.error.errors.forEach(err => {
          errors.push({
            recordIndex: index,
            field: err.path.join('.'),
            value: this.getNestedValue(record as Record, err.path as string[]),
            rule: 'schema',
            message: err.message,
            severity: 'error',
          });
        });
      }
    });

    console.log(`\nValidation complete:`);
    console.log(`  Valid records: ${validRecords}/${data.length}`);
    console.log(`  Invalid records: ${data.length - validRecords}`);
    console.log(`  Errors: ${errors.length}`);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validRecords,
      invalidRecords: data.length - validRecords,
      totalRecords: data.length,
    };
  }

  private getNestedValue(obj: Record, path: string[]): unknown {
    let value: unknown = obj;
    for (const key of path) {
      if (value && typeof value === 'object') {
        value = (value as Record)[key];
      } else {
        return undefined;
      }
    }
    return value;
  }
}

// ============================================================================
// Example 2: Business Rule Validator
// ============================================================================

class BusinessRuleValidator<T> {
  private rules: ValidationRule<T>[] = [];

  addRule(rule: ValidationRule<T>): this {
    this.rules.push(rule);
    return this;
  }

  validate(data: T[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let validRecords = 0;

    console.log('='.repeat(80));
    console.log('Business Rule Validation');
    console.log(`Rules: ${this.rules.length}`);
    console.log('='.repeat(80));

    data.forEach((record, index) => {
      let recordValid = true;

      this.rules.forEach(rule => {
        const result = rule.validate(record, index);

        if (!result.isValid) {
          recordValid = false;

          result.errors.forEach(err => {
            errors.push({
              recordIndex: index,
              field: err.field,
              value: err.value,
              rule: rule.name,
              message: err.message,
              severity: rule.severity === 'critical' ? 'critical' : 'error',
            });
          });
        }

        result.warnings.forEach(warn => {
          warnings.push({
            recordIndex: index,
            field: warn.field,
            value: warn.value,
            rule: rule.name,
            message: warn.message,
          });
        });
      });

      if (recordValid) {
        validRecords++;
      }
    });

    console.log(`\nValidation complete:`);
    console.log(`  Valid records: ${validRecords}/${data.length}`);
    console.log(`  Errors: ${errors.length}`);
    console.log(`  Warnings: ${warnings.length}`);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validRecords,
      invalidRecords: data.length - validRecords,
      totalRecords: data.length,
    };
  }
}

// ============================================================================
// Example 3: Cross-field Validator
// ============================================================================

class CrossFieldValidator<T extends Record> {
  private constraints: Array<{
    name: string;
    validate: (record: T) => { valid: boolean; message?: string };
  }> = [];

  addConstraint(
    name: string,
    validate: (record: T) => { valid: boolean; message?: string }
  ): this {
    this.constraints.push({ name, validate });
    return this;
  }

  validate(data: T[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let validRecords = 0;

    console.log('='.repeat(80));
    console.log('Cross-field Validation');
    console.log(`Constraints: ${this.constraints.length}`);
    console.log('='.repeat(80));

    data.forEach((record, index) => {
      let recordValid = true;

      this.constraints.forEach(constraint => {
        const result = constraint.validate(record);

        if (!result.valid) {
          recordValid = false;
          errors.push({
            recordIndex: index,
            field: 'cross-field',
            value: record,
            rule: constraint.name,
            message: result.message || `Cross-field constraint '${constraint.name}' failed`,
            severity: 'error',
          });
        }
      });

      if (recordValid) {
        validRecords++;
      }
    });

    console.log(`\nValidation complete:`);
    console.log(`  Valid records: ${validRecords}/${data.length}`);
    console.log(`  Errors: ${errors.length}`);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validRecords,
      invalidRecords: data.length - validRecords,
      totalRecords: data.length,
    };
  }
}

// ============================================================================
// Example 4: Reference Data Validator
// ============================================================================

class ReferenceDataValidator<T extends Record> {
  private referenceDataSets = new Map<string, Set<unknown>>();

  addReferenceData(name: string, validValues: unknown[]): this {
    this.referenceDataSets.set(name, new Set(validValues));
    return this;
  }

  validate(
    data: T[],
    fieldMappings: Map<string, string> // field -> reference data set name
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let validRecords = 0;

    console.log('='.repeat(80));
    console.log('Reference Data Validation');
    console.log(`Reference sets: ${this.referenceDataSets.size}`);
    console.log('='.repeat(80));

    data.forEach((record, index) => {
      let recordValid = true;

      fieldMappings.forEach((refSetName, fieldName) => {
        const value = record[fieldName];
        const refSet = this.referenceDataSets.get(refSetName);

        if (!refSet) {
          console.warn(`Reference set '${refSetName}' not found`);
          return;
        }

        if (!refSet.has(value)) {
          recordValid = false;
          errors.push({
            recordIndex: index,
            field: fieldName,
            value,
            rule: `reference-${refSetName}`,
            message: `Value '${value}' not found in reference data '${refSetName}'`,
            severity: 'error',
          });
        }
      });

      if (recordValid) {
        validRecords++;
      }
    });

    console.log(`\nValidation complete:`);
    console.log(`  Valid records: ${validRecords}/${data.length}`);
    console.log(`  Invalid references: ${errors.length}`);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validRecords,
      invalidRecords: data.length - validRecords,
      totalRecords: data.length,
    };
  }
}

// ============================================================================
// Example 5: Pattern and Format Validator
// ============================================================================

class PatternValidator<T extends Record> {
  private patterns = new Map<string, RegExp>();
  private formatters = new Map<
    string,
    { validate: (value: unknown) => boolean; message: string }
  >();

  addPattern(field: string, pattern: RegExp): this {
    this.patterns.set(field, pattern);
    return this;
  }

  addFormatter(
    field: string,
    validate: (value: unknown) => boolean,
    message: string
  ): this {
    this.formatters.set(field, { validate, message });
    return this;
  }

  validate(data: T[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let validRecords = 0;

    console.log('='.repeat(80));
    console.log('Pattern and Format Validation');
    console.log(`Patterns: ${this.patterns.size}, Formatters: ${this.formatters.size}`);
    console.log('='.repeat(80));

    data.forEach((record, index) => {
      let recordValid = true;

      // Validate patterns
      this.patterns.forEach((pattern, field) => {
        const value = record[field];

        if (value !== null && value !== undefined) {
          const strValue = String(value);

          if (!pattern.test(strValue)) {
            recordValid = false;
            errors.push({
              recordIndex: index,
              field,
              value,
              rule: `pattern-${field}`,
              message: `Value '${value}' does not match required pattern ${pattern}`,
              severity: 'error',
            });
          }
        }
      });

      // Validate formats
      this.formatters.forEach((formatter, field) => {
        const value = record[field];

        if (value !== null && value !== undefined) {
          if (!formatter.validate(value)) {
            recordValid = false;
            errors.push({
              recordIndex: index,
              field,
              value,
              rule: `format-${field}`,
              message: formatter.message,
              severity: 'error',
            });
          }
        }
      });

      if (recordValid) {
        validRecords++;
      }
    });

    console.log(`\nValidation complete:`);
    console.log(`  Valid records: ${validRecords}/${data.length}`);
    console.log(`  Format errors: ${errors.length}`);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validRecords,
      invalidRecords: data.length - validRecords,
      totalRecords: data.length,
    };
  }
}

// ============================================================================
// Example 6: Composite Validator (combines multiple validators)
// ============================================================================

class CompositeValidator<T extends Record> {
  private validators: Array<{
    name: string;
    validator: { validate(data: T[]): ValidationResult };
    stopOnFailure?: boolean;
  }> = [];

  addValidator(
    name: string,
    validator: { validate(data: T[]): ValidationResult },
    stopOnFailure = false
  ): this {
    this.validators.push({ name, validator, stopOnFailure });
    return this;
  }

  validate(data: T[]): ValidationResult {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationWarning[] = [];
    let finalValidRecords = 0;

    console.log('='.repeat(80));
    console.log('Composite Validation');
    console.log(`Validators: ${this.validators.length}`);
    console.log('='.repeat(80));

    for (const { name, validator, stopOnFailure } of this.validators) {
      console.log(`\nRunning validator: ${name}`);

      const result = validator.validate(data);

      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
      finalValidRecords = result.validRecords;

      if (!result.isValid && stopOnFailure) {
        console.log(`❌ Validation stopped due to failures in '${name}'`);
        break;
      }
    }

    const isValid = allErrors.length === 0;

    console.log('\n' + '='.repeat(80));
    console.log('Composite Validation Complete');
    console.log(`Result: ${isValid ? 'PASSED' : 'FAILED'}`);
    console.log(`Total errors: ${allErrors.length}`);
    console.log(`Total warnings: ${allWarnings.length}`);
    console.log('='.repeat(80));

    return {
      isValid,
      errors: allErrors,
      warnings: allWarnings,
      validRecords: finalValidRecords,
      invalidRecords: data.length - finalValidRecords,
      totalRecords: data.length,
    };
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

async function demonstrateValidation() {
  console.log('DATA VALIDATION EXAMPLES\n');

  // Sample data
  interface Customer {
    id: number;
    name: string;
    email: string;
    age: number;
    country: string;
    accountBalance: number;
    creditLimit: number;
    status: string;
    registeredAt: string;
  }

  const sampleData: Customer[] = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
      country: 'USA',
      accountBalance: 1000,
      creditLimit: 5000,
      status: 'active',
      registeredAt: '2024-01-15',
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'invalid-email',
      age: 17, // Below minimum age
      country: 'UK',
      accountBalance: 500,
      creditLimit: 2000,
      status: 'pending',
      registeredAt: '2024-02-20',
    },
    {
      id: 3,
      name: 'Bob Johnson',
      email: 'bob@example.com',
      age: 45,
      country: 'INVALID', // Invalid country code
      accountBalance: -100, // Negative balance with no credit
      creditLimit: 0,
      status: 'active',
      registeredAt: '2024-03-10',
    },
  ];

  // Example 1: Schema Validation
  console.log('\n1. Schema-based Validation:');
  console.log('-'.repeat(80));

  const customerSchema = z.object({
    id: z.number().positive(),
    name: z.string().min(2),
    email: z.string().email(),
    age: z.number().min(18).max(120),
    country: z.string().length(3),
    accountBalance: z.number(),
    creditLimit: z.number().min(0),
    status: z.enum(['active', 'pending', 'suspended', 'closed']),
    registeredAt: z.string(),
  });

  const schemaValidator = new SchemaValidator(customerSchema);
  const result1 = schemaValidator.validate(sampleData);

  if (!result1.isValid) {
    console.log('\nErrors found:');
    result1.errors.slice(0, 5).forEach(err => {
      console.log(`  Record ${err.recordIndex}, Field '${err.field}': ${err.message}`);
    });
  }

  // Example 2: Business Rule Validation
  console.log('\n\n2. Business Rule Validation:');
  console.log('-'.repeat(80));

  const businessValidator = new BusinessRuleValidator<Customer>()
    .addRule({
      name: 'minimum-age',
      description: 'Customer must be at least 18 years old',
      validate: (record) => {
        const isValid = record.age >= 18;
        return {
          isValid,
          errors: isValid ? [] : [{
            field: 'age',
            value: record.age,
            message: `Age ${record.age} is below minimum 18`
          }],
          warnings: [],
        };
      },
      severity: 'critical',
    })
    .addRule({
      name: 'balance-limit-check',
      description: 'Account balance should not exceed credit limit',
      validate: (record) => {
        const deficit = Math.abs(Math.min(0, record.accountBalance));
        const isValid = deficit <= record.creditLimit;
        return {
          isValid,
          errors: isValid ? [] : [{
            field: 'accountBalance',
            value: record.accountBalance,
            message: `Deficit ${deficit} exceeds credit limit ${record.creditLimit}`,
          }],
          warnings: [],
        };
      },
    });

  const result2 = businessValidator.validate(sampleData);

  // Example 3: Cross-field Validation
  console.log('\n\n3. Cross-field Validation:');
  console.log('-'.repeat(80));

  const crossFieldValidator = new CrossFieldValidator<Customer>()
    .addConstraint('balance-credit-relationship', (record) => {
      if (record.accountBalance < 0 && record.creditLimit === 0) {
        return {
          valid: false,
          message: 'Negative balance requires a credit limit',
        };
      }
      return { valid: true };
    })
    .addConstraint('status-age-consistency', (record) => {
      if (record.age < 18 && record.status === 'active') {
        return {
          valid: false,
          message: 'Active status not allowed for minors',
        };
      }
      return { valid: true };
    });

  const result3 = crossFieldValidator.validate(sampleData);

  // Example 4: Reference Data Validation
  console.log('\n\n4. Reference Data Validation:');
  console.log('-'.repeat(80));

  const refValidator = new ReferenceDataValidator<Customer>()
    .addReferenceData('validCountries', ['USA', 'CAN', 'MEX', 'GBR', 'FRA', 'DEU'])
    .addReferenceData('validStatuses', ['active', 'pending', 'suspended', 'closed']);

  const fieldMappings = new Map([
    ['country', 'validCountries'],
    ['status', 'validStatuses'],
  ]);

  const result4 = refValidator.validate(sampleData, fieldMappings);

  // Example 5: Pattern Validation
  console.log('\n\n5. Pattern and Format Validation:');
  console.log('-'.repeat(80));

  const patternValidator = new PatternValidator<Customer>()
    .addPattern('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    .addFormatter(
      'registeredAt',
      (value) => !isNaN(Date.parse(String(value))),
      'Invalid date format'
    );

  const result5 = patternValidator.validate(sampleData);

  // Example 6: Composite Validation
  console.log('\n\n6. Composite Validation (All Rules):');
  console.log('-'.repeat(80));

  const compositeValidator = new CompositeValidator<Customer>()
    .addValidator('schema', schemaValidator)
    .addValidator('business-rules', businessValidator)
    .addValidator('cross-field', crossFieldValidator)
    .addValidator('reference-data', refValidator)
    .addValidator('patterns', patternValidator);

  const finalResult = compositeValidator.validate(sampleData);

  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION COMPLETE');
  console.log('='.repeat(80));
}

// Run examples
if (require.main === module) {
  demonstrateValidation().catch(console.error);
}

export {
  SchemaValidator,
  BusinessRuleValidator,
  CrossFieldValidator,
  ReferenceDataValidator,
  PatternValidator,
  CompositeValidator,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
  type ValidationRule,
  type ValidationRuleResult,
};
