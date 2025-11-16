import { Request, Response } from 'express';
import { payrollService } from '../services/payroll.service';

export class PayrollController {
  async calculate(req: Request, res: Response) {
    try {
      const payroll = await payrollService.calculatePayroll(req.body);
      res.json(payroll);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const { employeeId, period } = req.query;
      const payrolls = await payrollService.getPayrolls(
        employeeId as string,
        period as string
      );
      res.json(payrolls);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const payroll = await payrollService.getPayrollById(id);
      if (!payroll) {
        return res.status(404).json({ error: '薪資記錄不存在' });
      }
      res.json(payroll);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async approve(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const payroll = await payrollService.approvePayroll(id);
      res.json(payroll);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async markAsPaid(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const payroll = await payrollService.markAsPaid(id);
      res.json(payroll);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const { period } = req.query;
      const stats = await payrollService.getStatistics(period as string);
      res.json(stats);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const payrollController = new PayrollController();
