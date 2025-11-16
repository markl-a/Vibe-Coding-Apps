import { PrismaClient } from '@prisma/client';
import { startOfDay, differenceInHours, setHours, setMinutes } from 'date-fns';

const prisma = new PrismaClient();

const WORK_START_HOUR = 9;
const WORK_START_MINUTE = 0;
const WORK_END_HOUR = 18;
const WORK_END_MINUTE = 0;
const LATE_THRESHOLD_MINUTES = 15;

export class AttendanceService {
  async checkIn(employeeId: string, location?: any) {
    const today = startOfDay(new Date());

    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (existing?.checkIn) {
      throw new Error('今日已打卡');
    }

    const now = new Date();
    const workStartTime = setMinutes(setHours(today, WORK_START_HOUR), WORK_START_MINUTE);
    const lateThreshold = new Date(workStartTime.getTime() + LATE_THRESHOLD_MINUTES * 60 * 1000);
    const isLate = now > lateThreshold;

    if (existing) {
      return await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkIn: now,
          checkInLocation: location,
          status: isLate ? 'LATE' : 'PRESENT',
        },
      });
    }

    return await prisma.attendance.create({
      data: {
        employeeId,
        date: today,
        checkIn: now,
        checkInLocation: location,
        status: isLate ? 'LATE' : 'PRESENT',
      },
    });
  }

  async checkOut(employeeId: string, location?: any) {
    const today = startOfDay(new Date());

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (!attendance || !attendance.checkIn) {
      throw new Error('請先上班打卡');
    }

    if (attendance.checkOut) {
      throw new Error('今日已下班打卡');
    }

    const now = new Date();
    const hours = differenceInHours(now, attendance.checkIn);
    const workHours = Math.min(hours, 8);
    const overtimeHours = Math.max(hours - 8, 0);

    return await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: now,
        checkOutLocation: location,
        workHours,
        overtimeHours,
      },
    });
  }

  async getAttendanceRecords(employeeId: string, startDate: Date, endDate: Date) {
    return await prisma.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getMonthlyStats(employeeId: string, month: string) {
    return await prisma.attendanceSummary.findUnique({
      where: {
        employeeId_month: {
          employeeId,
          month,
        },
      },
    });
  }
}

export const attendanceService = new AttendanceService();
