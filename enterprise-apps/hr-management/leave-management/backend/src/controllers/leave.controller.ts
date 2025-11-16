import { Request, Response } from 'express';
import { leaveService } from '../services/leave.service';

export class LeaveController {
  async createRequest(req: Request, res: Response) {
    try {
      const request = await leaveService.createLeaveRequest(req.body);
      res.status(201).json(request);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getRequests(req: Request, res: Response) {
    try {
      const { employeeId, status } = req.query;
      const requests = await leaveService.getLeaveRequests(
        employeeId as string,
        status as string
      );
      res.json(requests);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async approveRequest(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { approverId } = req.body;
      const request = await leaveService.approveLeaveRequest(id, approverId);
      res.json(request);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async rejectRequest(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { approverId, rejectionReason } = req.body;
      const request = await leaveService.rejectLeaveRequest(
        id,
        approverId,
        rejectionReason
      );
      res.json(request);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getBalance(req: Request, res: Response) {
    try {
      const { employeeId, year } = req.query;
      const balances = await leaveService.getAllLeaveBalances(
        employeeId as string,
        parseInt(year as string) || new Date().getFullYear()
      );
      res.json(balances);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const leaveController = new LeaveController();
