import { Request, Response } from 'express';
import { attendanceService } from '../services/attendance.service';
import { attendanceAIService } from '../services/attendance-ai.service';

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

export class AttendanceController {
  async checkIn(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId, location } = req.body;
      const attendance = await attendanceService.checkIn(employeeId, location);
      res.json(attendance);
    } catch (error: unknown) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  }

  async checkOut(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId, location } = req.body;
      const attendance = await attendanceService.checkOut(employeeId, location);
      res.json(attendance);
    } catch (error: unknown) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  }

  async getRecords(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId, startDate, endDate } = req.query;
      const records = await attendanceService.getAttendanceRecords(
        employeeId as string,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json(records);
    } catch (error: unknown) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  }

  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId, month } = req.query;
      const stats = await attendanceService.getMonthlyStats(
        employeeId as string,
        month as string
      );
      res.json(stats);
    } catch (error: unknown) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  }

  async detectAnomalies(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;
      const { days = '30' } = req.query;
      const result = await attendanceAIService.detectAnomalies(
        employeeId,
        parseInt(days as string)
      );
      res.json(result);
    } catch (error: unknown) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  }

  async predictAttendance(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;
      const result = await attendanceAIService.predictAttendance(employeeId);
      res.json(result);
    } catch (error: unknown) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  }

  async analyzeTeam(req: Request, res: Response): Promise<void> {
    try {
      const { departmentId, period = '30' } = req.query;
      const result = await attendanceAIService.analyzeTeamAttendance(
        departmentId as string | undefined,
        period as string
      );
      res.json(result);
    } catch (error: unknown) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  }
}

export const attendanceController = new AttendanceController();
