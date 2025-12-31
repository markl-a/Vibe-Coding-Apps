import { Request, Response } from 'express';
import { payrollService } from '../services/payroll.service';
import { payslipService } from '../services/payslip.service';
import { payrollAIService } from '../services/payroll-ai.service';

/** 從錯誤對象中安全地提取錯誤訊息 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '發生未知錯誤';
}

export class PayrollController {
  async calculate(req: Request, res: Response): Promise<void> {
    try {
      const payroll = await payrollService.calculatePayroll(req.body);
      res.json(payroll);
    } catch (error: unknown) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId, period } = req.query;
      const payrolls = await payrollService.getPayrolls(
        employeeId as string,
        period as string
      );
      res.json(payrolls);
    } catch (error: unknown) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  }

  async getById(req: Request, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;
      const payroll = await payrollService.getPayrollById(id);
      if (!payroll) {
        return res.status(404).json({ error: '薪資記錄不存在' });
      }
      res.json(payroll);
    } catch (error: unknown) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  }

  async approve(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const payroll = await payrollService.approvePayroll(id);
      res.json(payroll);
    } catch (error: unknown) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  }

  async markAsPaid(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const payroll = await payrollService.markAsPaid(id);
      res.json(payroll);
    } catch (error: unknown) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  }

  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const { period } = req.query;
      const stats = await payrollService.getStatistics(period as string);
      res.json(stats);
    } catch (error: unknown) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  }

  async generatePayslip(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const url = await payslipService.generatePayslip(id);
      res.json({ url, message: '薪資單生成成功' });
    } catch (error: unknown) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  }

  async generateBatchPayslips(req: Request, res: Response): Promise<void> {
    try {
      const { period } = req.body;
      const result = await payslipService.generateBatchPayslips(period);
      res.json(result);
    } catch (error: unknown) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  }

  async detectAnomalies(req: Request, res: Response): Promise<void> {
    try {
      const { period } = req.query;
      const result = await payrollAIService.detectSalaryAnomalies(period as string);
      res.json(result);
    } catch (error: unknown) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  }

  async analyzeTrends(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;
      const result = await payrollAIService.analyzeSalaryTrends(employeeId);
      res.json(result);
    } catch (error: unknown) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  }

  async compareToMarket(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;
      const { position, industry } = req.query;
      const result = await payrollAIService.compareSalaryToMarket(
        employeeId,
        position as string,
        industry as string
      );
      res.json(result);
    } catch (error: unknown) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  }

  async analyzeCostOptimization(req: Request, res: Response): Promise<void> {
    try {
      const { period } = req.query;
      const result = await payrollAIService.analyzeCostOptimization(period as string);
      res.json(result);
    } catch (error: unknown) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  }
}

export const payrollController = new PayrollController();
