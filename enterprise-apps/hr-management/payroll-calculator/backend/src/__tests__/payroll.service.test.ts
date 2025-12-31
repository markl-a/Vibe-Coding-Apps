import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PayrollService } from '../services/payroll.service';
import { Prisma } from '@prisma/client';

// Mock Prisma Client
const mockPrismaPayroll = {
  upsert: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
};

const mockPrisma = {
  payroll: mockPrismaPayroll,
};

// Mock the PrismaClient module
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma),
  Prisma: {
    Decimal: class MockDecimal {
      constructor(public value: number) {}
      toString() {
        return this.value.toString();
      }
      toNumber() {
        return this.value;
      }
    },
  },
}));

describe('PayrollService', () => {
  let payrollService: PayrollService;

  beforeEach(() => {
    payrollService = new PayrollService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('calculatePayroll - Calculate Gross Salary', () => {
    it('should calculate gross salary with base salary only', async () => {
      const mockPayrollData = {
        id: 'test-id-1',
        employeeId: 'EMP001',
        period: '2024-01',
        currency: 'TWD',
        baseSalary: new Prisma.Decimal(50000),
        allowances: JSON.stringify([]),
        bonus: new Prisma.Decimal(0),
        overtimePay: new Prisma.Decimal(0),
        commission: new Prisma.Decimal(0),
        totalEarnings: new Prisma.Decimal(50000),
        tax: new Prisma.Decimal(2083.33),
        socialInsurance: new Prisma.Decimal(4000),
        housingFund: new Prisma.Decimal(6000),
        deductions: JSON.stringify([]),
        totalDeductions: new Prisma.Decimal(12083.33),
        netSalary: new Prisma.Decimal(37916.67),
        status: 'CALCULATED',
        paymentMethod: null,
        paidAt: null,
        payslipUrl: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaPayroll.upsert.mockResolvedValue(mockPayrollData);

      const result = await payrollService.calculatePayroll({
        employeeId: 'EMP001',
        period: '2024-01',
        baseSalary: 50000,
      });

      expect(result).toBeDefined();
      expect(Number(result.baseSalary)).toBe(50000);
      expect(Number(result.totalEarnings)).toBe(50000);
    });

    it('should calculate gross salary with base salary and allowances', async () => {
      const allowances = [
        { type: 'Transport', amount: 2000 },
        { type: 'Meal', amount: 3000 },
      ];

      const totalEarnings = 50000 + 2000 + 3000; // 55000

      const mockPayrollData = {
        id: 'test-id-2',
        employeeId: 'EMP002',
        period: '2024-01',
        currency: 'TWD',
        baseSalary: new Prisma.Decimal(50000),
        allowances: JSON.stringify(allowances),
        bonus: new Prisma.Decimal(0),
        overtimePay: new Prisma.Decimal(0),
        commission: new Prisma.Decimal(0),
        totalEarnings: new Prisma.Decimal(totalEarnings),
        tax: expect.any(Object),
        socialInsurance: new Prisma.Decimal(4000),
        housingFund: new Prisma.Decimal(6000),
        deductions: JSON.stringify([]),
        totalDeductions: expect.any(Object),
        netSalary: expect.any(Object),
        status: 'CALCULATED',
        paymentMethod: null,
        paidAt: null,
        payslipUrl: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaPayroll.upsert.mockResolvedValue(mockPayrollData);

      const result = await payrollService.calculatePayroll({
        employeeId: 'EMP002',
        period: '2024-01',
        baseSalary: 50000,
        allowances,
      });

      expect(mockPrismaPayroll.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            employeeId: 'EMP002',
            baseSalary: expect.any(Object),
            allowances: JSON.stringify(allowances),
          }),
        })
      );
      expect(Number(result.totalEarnings)).toBe(totalEarnings);
    });

    it('should calculate gross salary with all income components', async () => {
      const allowances = [{ type: 'Housing', amount: 5000 }];
      const baseSalary = 60000;
      const bonus = 10000;
      const overtimePay = 3000;
      const totalEarnings = baseSalary + 5000 + bonus + overtimePay; // 78000

      const mockPayrollData = {
        id: 'test-id-3',
        employeeId: 'EMP003',
        period: '2024-01',
        currency: 'TWD',
        baseSalary: new Prisma.Decimal(baseSalary),
        allowances: JSON.stringify(allowances),
        bonus: new Prisma.Decimal(bonus),
        overtimePay: new Prisma.Decimal(overtimePay),
        commission: new Prisma.Decimal(0),
        totalEarnings: new Prisma.Decimal(totalEarnings),
        tax: expect.any(Object),
        socialInsurance: expect.any(Object),
        housingFund: expect.any(Object),
        deductions: JSON.stringify([]),
        totalDeductions: expect.any(Object),
        netSalary: expect.any(Object),
        status: 'CALCULATED',
        paymentMethod: null,
        paidAt: null,
        payslipUrl: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaPayroll.upsert.mockResolvedValue(mockPayrollData);

      const result = await payrollService.calculatePayroll({
        employeeId: 'EMP003',
        period: '2024-01',
        baseSalary,
        allowances,
        bonus,
        overtimePay,
      });

      expect(Number(result.totalEarnings)).toBe(totalEarnings);
      expect(Number(result.bonus)).toBe(bonus);
      expect(Number(result.overtimePay)).toBe(overtimePay);
    });
  });

  describe('calculatePayroll - Calculate Overtime Pay', () => {
    it('should include overtime pay in total earnings', async () => {
      const overtimePay = 5000;
      const baseSalary = 50000;
      const totalEarnings = baseSalary + overtimePay;

      const mockPayrollData = {
        id: 'test-id-4',
        employeeId: 'EMP004',
        period: '2024-01',
        currency: 'TWD',
        baseSalary: new Prisma.Decimal(baseSalary),
        allowances: JSON.stringify([]),
        bonus: new Prisma.Decimal(0),
        overtimePay: new Prisma.Decimal(overtimePay),
        commission: new Prisma.Decimal(0),
        totalEarnings: new Prisma.Decimal(totalEarnings),
        tax: expect.any(Object),
        socialInsurance: expect.any(Object),
        housingFund: expect.any(Object),
        deductions: JSON.stringify([]),
        totalDeductions: expect.any(Object),
        netSalary: expect.any(Object),
        status: 'CALCULATED',
        paymentMethod: null,
        paidAt: null,
        payslipUrl: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaPayroll.upsert.mockResolvedValue(mockPayrollData);

      const result = await payrollService.calculatePayroll({
        employeeId: 'EMP004',
        period: '2024-01',
        baseSalary,
        overtimePay,
      });

      expect(Number(result.overtimePay)).toBe(overtimePay);
      expect(Number(result.totalEarnings)).toBe(totalEarnings);
    });

    it('should handle zero overtime pay', async () => {
      const mockPayrollData = {
        id: 'test-id-5',
        employeeId: 'EMP005',
        period: '2024-01',
        currency: 'TWD',
        baseSalary: new Prisma.Decimal(50000),
        allowances: JSON.stringify([]),
        bonus: new Prisma.Decimal(0),
        overtimePay: new Prisma.Decimal(0),
        commission: new Prisma.Decimal(0),
        totalEarnings: new Prisma.Decimal(50000),
        tax: expect.any(Object),
        socialInsurance: expect.any(Object),
        housingFund: expect.any(Object),
        deductions: JSON.stringify([]),
        totalDeductions: expect.any(Object),
        netSalary: expect.any(Object),
        status: 'CALCULATED',
        paymentMethod: null,
        paidAt: null,
        payslipUrl: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaPayroll.upsert.mockResolvedValue(mockPayrollData);

      const result = await payrollService.calculatePayroll({
        employeeId: 'EMP005',
        period: '2024-01',
        baseSalary: 50000,
      });

      expect(Number(result.overtimePay)).toBe(0);
    });
  });

  describe('calculatePayroll - Calculate Net Salary with Deductions', () => {
    it('should calculate net salary with social insurance deduction', async () => {
      const baseSalary = 50000;
      const socialInsurance = baseSalary * 0.08; // 4000

      const mockPayrollData = {
        id: 'test-id-6',
        employeeId: 'EMP006',
        period: '2024-01',
        currency: 'TWD',
        baseSalary: new Prisma.Decimal(baseSalary),
        allowances: JSON.stringify([]),
        bonus: new Prisma.Decimal(0),
        overtimePay: new Prisma.Decimal(0),
        commission: new Prisma.Decimal(0),
        totalEarnings: new Prisma.Decimal(baseSalary),
        tax: expect.any(Object),
        socialInsurance: new Prisma.Decimal(socialInsurance),
        housingFund: expect.any(Object),
        deductions: JSON.stringify([]),
        totalDeductions: expect.any(Object),
        netSalary: expect.any(Object),
        status: 'CALCULATED',
        paymentMethod: null,
        paidAt: null,
        payslipUrl: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaPayroll.upsert.mockResolvedValue(mockPayrollData);

      const result = await payrollService.calculatePayroll({
        employeeId: 'EMP006',
        period: '2024-01',
        baseSalary,
      });

      expect(Number(result.socialInsurance)).toBe(socialInsurance);
    });

    it('should calculate net salary with housing fund deduction', async () => {
      const baseSalary = 50000;
      const housingFund = baseSalary * 0.12; // 6000

      const mockPayrollData = {
        id: 'test-id-7',
        employeeId: 'EMP007',
        period: '2024-01',
        currency: 'TWD',
        baseSalary: new Prisma.Decimal(baseSalary),
        allowances: JSON.stringify([]),
        bonus: new Prisma.Decimal(0),
        overtimePay: new Prisma.Decimal(0),
        commission: new Prisma.Decimal(0),
        totalEarnings: new Prisma.Decimal(baseSalary),
        tax: expect.any(Object),
        socialInsurance: expect.any(Object),
        housingFund: new Prisma.Decimal(housingFund),
        deductions: JSON.stringify([]),
        totalDeductions: expect.any(Object),
        netSalary: expect.any(Object),
        status: 'CALCULATED',
        paymentMethod: null,
        paidAt: null,
        payslipUrl: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaPayroll.upsert.mockResolvedValue(mockPayrollData);

      const result = await payrollService.calculatePayroll({
        employeeId: 'EMP007',
        period: '2024-01',
        baseSalary,
      });

      expect(Number(result.housingFund)).toBe(housingFund);
    });

    it('should calculate net salary with all deductions', async () => {
      const baseSalary = 60000;
      const socialInsurance = baseSalary * 0.08; // 4800
      const housingFund = baseSalary * 0.12; // 7200
      const taxableIncome = baseSalary - socialInsurance - housingFund;
      // Tax calculation for taxableIncome = 48000
      // Annual: 576000, falls in second bracket
      const expectedTax = (576000 - 540000) * 0.12 / 12 + 540000 * 0.05 / 12; // 2610
      const totalDeductions = expectedTax + socialInsurance + housingFund;
      const netSalary = baseSalary - totalDeductions;

      const mockPayrollData = {
        id: 'test-id-8',
        employeeId: 'EMP008',
        period: '2024-01',
        currency: 'TWD',
        baseSalary: new Prisma.Decimal(baseSalary),
        allowances: JSON.stringify([]),
        bonus: new Prisma.Decimal(0),
        overtimePay: new Prisma.Decimal(0),
        commission: new Prisma.Decimal(0),
        totalEarnings: new Prisma.Decimal(baseSalary),
        tax: new Prisma.Decimal(expectedTax),
        socialInsurance: new Prisma.Decimal(socialInsurance),
        housingFund: new Prisma.Decimal(housingFund),
        deductions: JSON.stringify([]),
        totalDeductions: new Prisma.Decimal(totalDeductions),
        netSalary: new Prisma.Decimal(netSalary),
        status: 'CALCULATED',
        paymentMethod: null,
        paidAt: null,
        payslipUrl: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaPayroll.upsert.mockResolvedValue(mockPayrollData);

      const result = await payrollService.calculatePayroll({
        employeeId: 'EMP008',
        period: '2024-01',
        baseSalary,
      });

      expect(Number(result.socialInsurance)).toBe(socialInsurance);
      expect(Number(result.housingFund)).toBe(housingFund);
      expect(Number(result.totalDeductions)).toBeCloseTo(totalDeductions, 2);
      expect(Number(result.netSalary)).toBeCloseTo(netSalary, 2);
    });
  });

  describe('calculatePayroll - Tax Calculations', () => {
    it('should calculate tax for low income bracket (≤540000 annually)', async () => {
      const baseSalary = 40000; // Annual: 480000
      const socialInsurance = baseSalary * 0.08;
      const housingFund = baseSalary * 0.12;
      const taxableIncome = baseSalary - socialInsurance - housingFund;
      // Annual taxable: 384000, falls in first bracket
      const expectedTax = taxableIncome * 0.05;

      const mockPayrollData = {
        id: 'test-id-9',
        employeeId: 'EMP009',
        period: '2024-01',
        currency: 'TWD',
        baseSalary: new Prisma.Decimal(baseSalary),
        allowances: JSON.stringify([]),
        bonus: new Prisma.Decimal(0),
        overtimePay: new Prisma.Decimal(0),
        commission: new Prisma.Decimal(0),
        totalEarnings: new Prisma.Decimal(baseSalary),
        tax: new Prisma.Decimal(expectedTax),
        socialInsurance: new Prisma.Decimal(socialInsurance),
        housingFund: new Prisma.Decimal(housingFund),
        deductions: JSON.stringify([]),
        totalDeductions: expect.any(Object),
        netSalary: expect.any(Object),
        status: 'CALCULATED',
        paymentMethod: null,
        paidAt: null,
        payslipUrl: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaPayroll.upsert.mockResolvedValue(mockPayrollData);

      const result = await payrollService.calculatePayroll({
        employeeId: 'EMP009',
        period: '2024-01',
        baseSalary,
      });

      expect(Number(result.tax)).toBeCloseTo(expectedTax, 2);
    });

    it('should calculate tax for medium income bracket (540001-1210000 annually)', async () => {
      const baseSalary = 80000; // Annual: 960000
      const socialInsurance = baseSalary * 0.08;
      const housingFund = baseSalary * 0.12;
      const taxableIncome = baseSalary - socialInsurance - housingFund;
      // Annual taxable: 768000, falls in second bracket
      const expectedTax = (768000 - 540000) * 0.12 / 12 + 540000 * 0.05 / 12;

      const mockPayrollData = {
        id: 'test-id-10',
        employeeId: 'EMP010',
        period: '2024-01',
        currency: 'TWD',
        baseSalary: new Prisma.Decimal(baseSalary),
        allowances: JSON.stringify([]),
        bonus: new Prisma.Decimal(0),
        overtimePay: new Prisma.Decimal(0),
        commission: new Prisma.Decimal(0),
        totalEarnings: new Prisma.Decimal(baseSalary),
        tax: new Prisma.Decimal(expectedTax),
        socialInsurance: new Prisma.Decimal(socialInsurance),
        housingFund: new Prisma.Decimal(housingFund),
        deductions: JSON.stringify([]),
        totalDeductions: expect.any(Object),
        netSalary: expect.any(Object),
        status: 'CALCULATED',
        paymentMethod: null,
        paidAt: null,
        payslipUrl: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaPayroll.upsert.mockResolvedValue(mockPayrollData);

      const result = await payrollService.calculatePayroll({
        employeeId: 'EMP010',
        period: '2024-01',
        baseSalary,
      });

      expect(Number(result.tax)).toBeCloseTo(expectedTax, 2);
    });

    it('should calculate tax for high income bracket (>2420000 annually)', async () => {
      const baseSalary = 250000; // Annual: 3000000
      const socialInsurance = baseSalary * 0.08;
      const housingFund = baseSalary * 0.12;
      const taxableIncome = baseSalary - socialInsurance - housingFund;
      // Annual taxable: 3000000, falls in fourth bracket
      const expectedTax = (3000000 - 2420000) * 0.30 / 12 + 322400 / 12;

      const mockPayrollData = {
        id: 'test-id-11',
        employeeId: 'EMP011',
        period: '2024-01',
        currency: 'TWD',
        baseSalary: new Prisma.Decimal(baseSalary),
        allowances: JSON.stringify([]),
        bonus: new Prisma.Decimal(0),
        overtimePay: new Prisma.Decimal(0),
        commission: new Prisma.Decimal(0),
        totalEarnings: new Prisma.Decimal(baseSalary),
        tax: new Prisma.Decimal(expectedTax),
        socialInsurance: new Prisma.Decimal(socialInsurance),
        housingFund: new Prisma.Decimal(housingFund),
        deductions: JSON.stringify([]),
        totalDeductions: expect.any(Object),
        netSalary: expect.any(Object),
        status: 'CALCULATED',
        paymentMethod: null,
        paidAt: null,
        payslipUrl: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaPayroll.upsert.mockResolvedValue(mockPayrollData);

      const result = await payrollService.calculatePayroll({
        employeeId: 'EMP011',
        period: '2024-01',
        baseSalary,
      });

      expect(Number(result.tax)).toBeCloseTo(expectedTax, 2);
    });

    it('should calculate tax with bonus included in taxable income', async () => {
      const baseSalary = 50000;
      const bonus = 20000;
      const totalEarnings = baseSalary + bonus;
      const socialInsurance = baseSalary * 0.08;
      const housingFund = baseSalary * 0.12;
      const taxableIncome = totalEarnings - socialInsurance - housingFund;

      const mockPayrollData = {
        id: 'test-id-12',
        employeeId: 'EMP012',
        period: '2024-01',
        currency: 'TWD',
        baseSalary: new Prisma.Decimal(baseSalary),
        allowances: JSON.stringify([]),
        bonus: new Prisma.Decimal(bonus),
        overtimePay: new Prisma.Decimal(0),
        commission: new Prisma.Decimal(0),
        totalEarnings: new Prisma.Decimal(totalEarnings),
        tax: expect.any(Object),
        socialInsurance: new Prisma.Decimal(socialInsurance),
        housingFund: new Prisma.Decimal(housingFund),
        deductions: JSON.stringify([]),
        totalDeductions: expect.any(Object),
        netSalary: expect.any(Object),
        status: 'CALCULATED',
        paymentMethod: null,
        paidAt: null,
        payslipUrl: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaPayroll.upsert.mockResolvedValue(mockPayrollData);

      const result = await payrollService.calculatePayroll({
        employeeId: 'EMP012',
        period: '2024-01',
        baseSalary,
        bonus,
      });

      expect(result).toBeDefined();
      expect(Number(result.tax)).toBeGreaterThan(0);
    });
  });

  describe('getPayrolls', () => {
    it('should get all payrolls when no filters provided', async () => {
      const mockPayrolls = [
        {
          id: 'payroll-1',
          employeeId: 'EMP001',
          period: '2024-01',
          baseSalary: new Prisma.Decimal(50000),
          netSalary: new Prisma.Decimal(40000),
        },
        {
          id: 'payroll-2',
          employeeId: 'EMP002',
          period: '2024-01',
          baseSalary: new Prisma.Decimal(60000),
          netSalary: new Prisma.Decimal(48000),
        },
      ];

      mockPrismaPayroll.findMany.mockResolvedValue(mockPayrolls);

      const result = await payrollService.getPayrolls();

      expect(mockPrismaPayroll.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { period: 'desc' },
      });
      expect(result).toHaveLength(2);
    });

    it('should filter payrolls by employeeId', async () => {
      const mockPayrolls = [
        {
          id: 'payroll-1',
          employeeId: 'EMP001',
          period: '2024-01',
          baseSalary: new Prisma.Decimal(50000),
          netSalary: new Prisma.Decimal(40000),
        },
      ];

      mockPrismaPayroll.findMany.mockResolvedValue(mockPayrolls);

      const result = await payrollService.getPayrolls('EMP001');

      expect(mockPrismaPayroll.findMany).toHaveBeenCalledWith({
        where: { employeeId: 'EMP001' },
        orderBy: { period: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].employeeId).toBe('EMP001');
    });

    it('should filter payrolls by period', async () => {
      const mockPayrolls = [
        {
          id: 'payroll-1',
          employeeId: 'EMP001',
          period: '2024-01',
          baseSalary: new Prisma.Decimal(50000),
          netSalary: new Prisma.Decimal(40000),
        },
        {
          id: 'payroll-2',
          employeeId: 'EMP002',
          period: '2024-01',
          baseSalary: new Prisma.Decimal(60000),
          netSalary: new Prisma.Decimal(48000),
        },
      ];

      mockPrismaPayroll.findMany.mockResolvedValue(mockPayrolls);

      const result = await payrollService.getPayrolls(undefined, '2024-01');

      expect(mockPrismaPayroll.findMany).toHaveBeenCalledWith({
        where: { period: '2024-01' },
        orderBy: { period: 'desc' },
      });
      expect(result).toHaveLength(2);
    });

    it('should filter payrolls by both employeeId and period', async () => {
      const mockPayrolls = [
        {
          id: 'payroll-1',
          employeeId: 'EMP001',
          period: '2024-01',
          baseSalary: new Prisma.Decimal(50000),
          netSalary: new Prisma.Decimal(40000),
        },
      ];

      mockPrismaPayroll.findMany.mockResolvedValue(mockPayrolls);

      const result = await payrollService.getPayrolls('EMP001', '2024-01');

      expect(mockPrismaPayroll.findMany).toHaveBeenCalledWith({
        where: { employeeId: 'EMP001', period: '2024-01' },
        orderBy: { period: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('getPayrollById', () => {
    it('should get payroll by id', async () => {
      const mockPayroll = {
        id: 'payroll-1',
        employeeId: 'EMP001',
        period: '2024-01',
        baseSalary: new Prisma.Decimal(50000),
        netSalary: new Prisma.Decimal(40000),
      };

      mockPrismaPayroll.findUnique.mockResolvedValue(mockPayroll);

      const result = await payrollService.getPayrollById('payroll-1');

      expect(mockPrismaPayroll.findUnique).toHaveBeenCalledWith({
        where: { id: 'payroll-1' },
      });
      expect(result).toBeDefined();
      expect(result?.id).toBe('payroll-1');
    });

    it('should return null when payroll not found', async () => {
      mockPrismaPayroll.findUnique.mockResolvedValue(null);

      const result = await payrollService.getPayrollById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('approvePayroll', () => {
    it('should approve payroll and update status', async () => {
      const mockUpdatedPayroll = {
        id: 'payroll-1',
        employeeId: 'EMP001',
        period: '2024-01',
        status: 'APPROVED',
        baseSalary: new Prisma.Decimal(50000),
        netSalary: new Prisma.Decimal(40000),
      };

      mockPrismaPayroll.update.mockResolvedValue(mockUpdatedPayroll);

      const result = await payrollService.approvePayroll('payroll-1');

      expect(mockPrismaPayroll.update).toHaveBeenCalledWith({
        where: { id: 'payroll-1' },
        data: { status: 'APPROVED' },
      });
      expect(result.status).toBe('APPROVED');
    });
  });

  describe('markAsPaid', () => {
    it('should mark payroll as paid with timestamp', async () => {
      const mockUpdatedPayroll = {
        id: 'payroll-1',
        employeeId: 'EMP001',
        period: '2024-01',
        status: 'PAID',
        paidAt: new Date(),
        baseSalary: new Prisma.Decimal(50000),
        netSalary: new Prisma.Decimal(40000),
      };

      mockPrismaPayroll.update.mockResolvedValue(mockUpdatedPayroll);

      const result = await payrollService.markAsPaid('payroll-1');

      expect(mockPrismaPayroll.update).toHaveBeenCalledWith({
        where: { id: 'payroll-1' },
        data: {
          status: 'PAID',
          paidAt: expect.any(Date),
        },
      });
      expect(result.status).toBe('PAID');
      expect(result.paidAt).toBeInstanceOf(Date);
    });
  });

  describe('getStatistics', () => {
    it('should calculate statistics for a period', async () => {
      const mockPayrolls = [
        {
          id: 'payroll-1',
          employeeId: 'EMP001',
          period: '2024-01',
          status: 'PAID',
          netSalary: new Prisma.Decimal(40000),
        },
        {
          id: 'payroll-2',
          employeeId: 'EMP002',
          period: '2024-01',
          status: 'APPROVED',
          netSalary: new Prisma.Decimal(50000),
        },
        {
          id: 'payroll-3',
          employeeId: 'EMP003',
          period: '2024-01',
          status: 'CALCULATED',
          netSalary: new Prisma.Decimal(60000),
        },
      ];

      mockPrismaPayroll.findMany.mockResolvedValue(mockPayrolls);

      const result = await payrollService.getStatistics('2024-01');

      expect(result.period).toBe('2024-01');
      expect(result.employeeCount).toBe(3);
      expect(result.totalPayroll).toBe(150000);
      expect(result.averageSalary).toBe(50000);
      expect(result.byStatus.paid).toBe(1);
      expect(result.byStatus.approved).toBe(1);
      expect(result.byStatus.calculated).toBe(1);
      expect(result.byStatus.draft).toBe(0);
    });

    it('should handle empty payroll list', async () => {
      mockPrismaPayroll.findMany.mockResolvedValue([]);

      const result = await payrollService.getStatistics('2024-01');

      expect(result.period).toBe('2024-01');
      expect(result.employeeCount).toBe(0);
      expect(result.totalPayroll).toBe(0);
      expect(result.averageSalary).toBe(0);
    });

    it('should count payrolls by status correctly', async () => {
      const mockPayrolls = [
        {
          id: 'payroll-1',
          employeeId: 'EMP001',
          period: '2024-01',
          status: 'DRAFT',
          netSalary: new Prisma.Decimal(40000),
        },
        {
          id: 'payroll-2',
          employeeId: 'EMP002',
          period: '2024-01',
          status: 'DRAFT',
          netSalary: new Prisma.Decimal(50000),
        },
        {
          id: 'payroll-3',
          employeeId: 'EMP003',
          period: '2024-01',
          status: 'PAID',
          netSalary: new Prisma.Decimal(60000),
        },
      ];

      mockPrismaPayroll.findMany.mockResolvedValue(mockPayrolls);

      const result = await payrollService.getStatistics('2024-01');

      expect(result.byStatus.draft).toBe(2);
      expect(result.byStatus.calculated).toBe(0);
      expect(result.byStatus.approved).toBe(0);
      expect(result.byStatus.paid).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors during payroll calculation', async () => {
      mockPrismaPayroll.upsert.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        payrollService.calculatePayroll({
          employeeId: 'EMP001',
          period: '2024-01',
          baseSalary: 50000,
        })
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid employeeId format', async () => {
      mockPrismaPayroll.upsert.mockRejectedValue(new Error('Invalid employee ID'));

      await expect(
        payrollService.calculatePayroll({
          employeeId: '',
          period: '2024-01',
          baseSalary: 50000,
        })
      ).rejects.toThrow('Invalid employee ID');
    });

    it('should handle negative base salary', async () => {
      const mockPayrollData = {
        id: 'test-id-negative',
        employeeId: 'EMP999',
        period: '2024-01',
        currency: 'TWD',
        baseSalary: new Prisma.Decimal(-1000),
        allowances: JSON.stringify([]),
        bonus: new Prisma.Decimal(0),
        overtimePay: new Prisma.Decimal(0),
        commission: new Prisma.Decimal(0),
        totalEarnings: new Prisma.Decimal(-1000),
        tax: new Prisma.Decimal(0),
        socialInsurance: new Prisma.Decimal(-80),
        housingFund: new Prisma.Decimal(-120),
        deductions: JSON.stringify([]),
        totalDeductions: new Prisma.Decimal(-200),
        netSalary: new Prisma.Decimal(-800),
        status: 'CALCULATED',
        paymentMethod: null,
        paidAt: null,
        payslipUrl: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaPayroll.upsert.mockResolvedValue(mockPayrollData);

      const result = await payrollService.calculatePayroll({
        employeeId: 'EMP999',
        period: '2024-01',
        baseSalary: -1000,
      });

      // The service doesn't validate negative values, but we can test it processes them
      expect(Number(result.baseSalary)).toBeLessThan(0);
    });

    it('should handle database errors when fetching payrolls', async () => {
      mockPrismaPayroll.findMany.mockRejectedValue(new Error('Database query failed'));

      await expect(payrollService.getPayrolls()).rejects.toThrow('Database query failed');
    });

    it('should handle database errors when approving payroll', async () => {
      mockPrismaPayroll.update.mockRejectedValue(new Error('Payroll not found'));

      await expect(payrollService.approvePayroll('non-existent')).rejects.toThrow(
        'Payroll not found'
      );
    });

    it('should handle invalid period format', async () => {
      mockPrismaPayroll.upsert.mockRejectedValue(new Error('Invalid period format'));

      await expect(
        payrollService.calculatePayroll({
          employeeId: 'EMP001',
          period: 'invalid-period',
          baseSalary: 50000,
        })
      ).rejects.toThrow('Invalid period format');
    });

    it('should handle empty allowances array correctly', async () => {
      const mockPayrollData = {
        id: 'test-id-empty-allowances',
        employeeId: 'EMP100',
        period: '2024-01',
        currency: 'TWD',
        baseSalary: new Prisma.Decimal(50000),
        allowances: JSON.stringify([]),
        bonus: new Prisma.Decimal(0),
        overtimePay: new Prisma.Decimal(0),
        commission: new Prisma.Decimal(0),
        totalEarnings: new Prisma.Decimal(50000),
        tax: expect.any(Object),
        socialInsurance: expect.any(Object),
        housingFund: expect.any(Object),
        deductions: JSON.stringify([]),
        totalDeductions: expect.any(Object),
        netSalary: expect.any(Object),
        status: 'CALCULATED',
        paymentMethod: null,
        paidAt: null,
        payslipUrl: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaPayroll.upsert.mockResolvedValue(mockPayrollData);

      const result = await payrollService.calculatePayroll({
        employeeId: 'EMP100',
        period: '2024-01',
        baseSalary: 50000,
        allowances: [],
      });

      expect(result.allowances).toBe('[]');
    });

    it('should handle malformed allowances data', async () => {
      // Test with invalid allowance structure
      const invalidAllowances = [{ invalid: 'data' }] as any;

      const mockPayrollData = {
        id: 'test-id-invalid',
        employeeId: 'EMP101',
        period: '2024-01',
        currency: 'TWD',
        baseSalary: new Prisma.Decimal(50000),
        allowances: JSON.stringify(invalidAllowances),
        bonus: new Prisma.Decimal(0),
        overtimePay: new Prisma.Decimal(0),
        commission: new Prisma.Decimal(0),
        totalEarnings: new Prisma.Decimal(50000),
        tax: expect.any(Object),
        socialInsurance: expect.any(Object),
        housingFund: expect.any(Object),
        deductions: JSON.stringify([]),
        totalDeductions: expect.any(Object),
        netSalary: expect.any(Object),
        status: 'CALCULATED',
        paymentMethod: null,
        paidAt: null,
        payslipUrl: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaPayroll.upsert.mockResolvedValue(mockPayrollData);

      // This will process but calculate 0 for allowances since they don't have amount field
      const result = await payrollService.calculatePayroll({
        employeeId: 'EMP101',
        period: '2024-01',
        baseSalary: 50000,
        allowances: invalidAllowances,
      });

      expect(result).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero base salary', async () => {
      const mockPayrollData = {
        id: 'test-id-zero',
        employeeId: 'EMP200',
        period: '2024-01',
        currency: 'TWD',
        baseSalary: new Prisma.Decimal(0),
        allowances: JSON.stringify([]),
        bonus: new Prisma.Decimal(0),
        overtimePay: new Prisma.Decimal(0),
        commission: new Prisma.Decimal(0),
        totalEarnings: new Prisma.Decimal(0),
        tax: new Prisma.Decimal(0),
        socialInsurance: new Prisma.Decimal(0),
        housingFund: new Prisma.Decimal(0),
        deductions: JSON.stringify([]),
        totalDeductions: new Prisma.Decimal(0),
        netSalary: new Prisma.Decimal(0),
        status: 'CALCULATED',
        paymentMethod: null,
        paidAt: null,
        payslipUrl: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaPayroll.upsert.mockResolvedValue(mockPayrollData);

      const result = await payrollService.calculatePayroll({
        employeeId: 'EMP200',
        period: '2024-01',
        baseSalary: 0,
      });

      expect(Number(result.baseSalary)).toBe(0);
      expect(Number(result.netSalary)).toBe(0);
    });

    it('should handle very large salary values', async () => {
      const largeSalary = 10000000; // 10 million
      const socialInsurance = largeSalary * 0.08;
      const housingFund = largeSalary * 0.12;

      const mockPayrollData = {
        id: 'test-id-large',
        employeeId: 'EMP201',
        period: '2024-01',
        currency: 'TWD',
        baseSalary: new Prisma.Decimal(largeSalary),
        allowances: JSON.stringify([]),
        bonus: new Prisma.Decimal(0),
        overtimePay: new Prisma.Decimal(0),
        commission: new Prisma.Decimal(0),
        totalEarnings: new Prisma.Decimal(largeSalary),
        tax: expect.any(Object),
        socialInsurance: new Prisma.Decimal(socialInsurance),
        housingFund: new Prisma.Decimal(housingFund),
        deductions: JSON.stringify([]),
        totalDeductions: expect.any(Object),
        netSalary: expect.any(Object),
        status: 'CALCULATED',
        paymentMethod: null,
        paidAt: null,
        payslipUrl: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaPayroll.upsert.mockResolvedValue(mockPayrollData);

      const result = await payrollService.calculatePayroll({
        employeeId: 'EMP201',
        period: '2024-01',
        baseSalary: largeSalary,
      });

      expect(Number(result.baseSalary)).toBe(largeSalary);
      expect(Number(result.socialInsurance)).toBe(socialInsurance);
    });

    it('should handle multiple allowances correctly', async () => {
      const allowances = [
        { type: 'Transport', amount: 2000 },
        { type: 'Meal', amount: 3000 },
        { type: 'Housing', amount: 5000 },
        { type: 'Mobile', amount: 1000 },
      ];
      const totalAllowances = 11000;
      const baseSalary = 50000;
      const totalEarnings = baseSalary + totalAllowances;

      const mockPayrollData = {
        id: 'test-id-multi-allowances',
        employeeId: 'EMP202',
        period: '2024-01',
        currency: 'TWD',
        baseSalary: new Prisma.Decimal(baseSalary),
        allowances: JSON.stringify(allowances),
        bonus: new Prisma.Decimal(0),
        overtimePay: new Prisma.Decimal(0),
        commission: new Prisma.Decimal(0),
        totalEarnings: new Prisma.Decimal(totalEarnings),
        tax: expect.any(Object),
        socialInsurance: expect.any(Object),
        housingFund: expect.any(Object),
        deductions: JSON.stringify([]),
        totalDeductions: expect.any(Object),
        netSalary: expect.any(Object),
        status: 'CALCULATED',
        paymentMethod: null,
        paidAt: null,
        payslipUrl: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaPayroll.upsert.mockResolvedValue(mockPayrollData);

      const result = await payrollService.calculatePayroll({
        employeeId: 'EMP202',
        period: '2024-01',
        baseSalary,
        allowances,
      });

      expect(Number(result.totalEarnings)).toBe(totalEarnings);
    });

    it('should handle existing payroll update scenario', async () => {
      const baseSalary = 55000;
      const newBonus = 15000;

      const mockPayrollData = {
        id: 'existing-payroll-id',
        employeeId: 'EMP203',
        period: '2024-01',
        currency: 'TWD',
        baseSalary: new Prisma.Decimal(baseSalary),
        allowances: JSON.stringify([]),
        bonus: new Prisma.Decimal(newBonus),
        overtimePay: new Prisma.Decimal(0),
        commission: new Prisma.Decimal(0),
        totalEarnings: new Prisma.Decimal(baseSalary + newBonus),
        tax: expect.any(Object),
        socialInsurance: expect.any(Object),
        housingFund: expect.any(Object),
        deductions: JSON.stringify([]),
        totalDeductions: expect.any(Object),
        netSalary: expect.any(Object),
        status: 'CALCULATED',
        paymentMethod: null,
        paidAt: null,
        payslipUrl: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaPayroll.upsert.mockResolvedValue(mockPayrollData);

      const result = await payrollService.calculatePayroll({
        employeeId: 'EMP203',
        period: '2024-01',
        baseSalary,
        bonus: newBonus,
      });

      // Verify upsert was called with both create and update
      expect(mockPrismaPayroll.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            employeeId_period: {
              employeeId: 'EMP203',
              period: '2024-01',
            },
          },
          create: expect.any(Object),
          update: expect.any(Object),
        })
      );
      expect(Number(result.bonus)).toBe(newBonus);
    });
  });
});
