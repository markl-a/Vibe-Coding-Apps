import { Request, Response } from 'express';
import { attendanceService } from '../services/attendance.service';

export class AttendanceController {
  async checkIn(req: Request, res: Response) {
    try {
      const { employeeId, location } = req.body;
      const attendance = await attendanceService.checkIn(employeeId, location);
      res.json(attendance);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async checkOut(req: Request, res: Response) {
    try {
      const { employeeId, location } = req.body;
      const attendance = await attendanceService.checkOut(employeeId, location);
      res.json(attendance);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getRecords(req: Request, res: Response) {
    try {
      const { employeeId, startDate, endDate } = req.query;
      const records = await attendanceService.getAttendanceRecords(
        employeeId as string,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json(records);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const { employeeId, month } = req.query;
      const stats = await attendanceService.getMonthlyStats(
        employeeId as string,
        month as string
      );
      res.json(stats);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const attendanceController = new AttendanceController();
