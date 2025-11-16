import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const SOCIAL_INSURANCE_RATE = 0.08; // 8%
const HOUSING_FUND_RATE = 0.12; // 12%

export class PayrollService {
  async calculatePayroll(data: {
    employeeId: string;
    period: string;
    baseSalary: number;
    allowances?: Array<{ type: string; amount: number }>;
    bonus?: number;
    overtimePay?: number;
  }) {
    const {
      employeeId,
      period,
      baseSalary,
      allowances = [],
      bonus = 0,
      overtimePay = 0,
    } = data;

    // 計算總收入
    const allowanceTotal = allowances.reduce((sum, a) => sum + a.amount, 0);
    const totalEarnings = baseSalary + allowanceTotal + bonus + overtimePay;

    // 計算社保和公積金
    const socialInsurance = baseSalary * SOCIAL_INSURANCE_RATE;
    const housingFund = baseSalary * HOUSING_FUND_RATE;

    // 計算個稅（簡化版，實際需要根據稅率表）
    const taxableIncome = totalEarnings - socialInsurance - housingFund;
    const tax = this.calculateTax(taxableIncome);

    // 計算總扣除
    const totalDeductions = tax + socialInsurance + housingFund;

    // 計算實發工資
    const netSalary = totalEarnings - totalDeductions;

    // 保存或更新薪資記錄
    const payroll = await prisma.payroll.upsert({
      where: {
        employeeId_period: {
          employeeId,
          period,
        },
      },
      update: {
        baseSalary: new Prisma.Decimal(baseSalary),
        allowances: JSON.stringify(allowances),
        bonus: new Prisma.Decimal(bonus),
        overtimePay: new Prisma.Decimal(overtimePay),
        totalEarnings: new Prisma.Decimal(totalEarnings),
        tax: new Prisma.Decimal(tax),
        socialInsurance: new Prisma.Decimal(socialInsurance),
        housingFund: new Prisma.Decimal(housingFund),
        totalDeductions: new Prisma.Decimal(totalDeductions),
        netSalary: new Prisma.Decimal(netSalary),
        status: 'CALCULATED',
      },
      create: {
        employeeId,
        period,
        baseSalary: new Prisma.Decimal(baseSalary),
        allowances: JSON.stringify(allowances),
        bonus: new Prisma.Decimal(bonus),
        overtimePay: new Prisma.Decimal(overtimePay),
        commission: new Prisma.Decimal(0),
        totalEarnings: new Prisma.Decimal(totalEarnings),
        tax: new Prisma.Decimal(tax),
        socialInsurance: new Prisma.Decimal(socialInsurance),
        housingFund: new Prisma.Decimal(housingFund),
        deductions: JSON.stringify([]),
        totalDeductions: new Prisma.Decimal(totalDeductions),
        netSalary: new Prisma.Decimal(netSalary),
        status: 'CALCULATED',
      },
    });

    return payroll;
  }

  private calculateTax(income: number): number {
    // 台灣個人所得稅稅率表（簡化版，年收入）
    const monthlyIncome = income * 12;

    if (monthlyIncome <= 540000) {
      return income * 0.05;
    } else if (monthlyIncome <= 1210000) {
      return (income * 12 - 540000) * 0.12 / 12 + 540000 * 0.05 / 12;
    } else if (monthlyIncome <= 2420000) {
      return (income * 12 - 1210000) * 0.20 / 12 + 80400 / 12;
    } else if (monthlyIncome <= 4530000) {
      return (income * 12 - 2420000) * 0.30 / 12 + 322400 / 12;
    } else {
      return (income * 12 - 4530000) * 0.40 / 12 + 955400 / 12;
    }
  }

  async getPayrolls(employeeId?: string, period?: string) {
    return await prisma.payroll.findMany({
      where: {
        ...(employeeId && { employeeId }),
        ...(period && { period }),
      },
      orderBy: { period: 'desc' },
    });
  }

  async getPayrollById(id: string) {
    return await prisma.payroll.findUnique({
      where: { id },
    });
  }

  async approvePayroll(id: string) {
    return await prisma.payroll.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
  }

  async markAsPaid(id: string) {
    return await prisma.payroll.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });
  }

  async getStatistics(period: string) {
    const payrolls = await prisma.payroll.findMany({
      where: { period },
    });

    const total = payrolls.reduce(
      (sum, p) => sum + Number(p.netSalary),
      0
    );

    const avgSalary = total / (payrolls.length || 1);

    return {
      period,
      employeeCount: payrolls.length,
      totalPayroll: total,
      averageSalary: avgSalary,
      byStatus: {
        draft: payrolls.filter((p) => p.status === 'DRAFT').length,
        calculated: payrolls.filter((p) => p.status === 'CALCULATED').length,
        approved: payrolls.filter((p) => p.status === 'APPROVED').length,
        paid: payrolls.filter((p) => p.status === 'PAID').length,
      },
    };
  }
}

export const payrollService = new PayrollService();
