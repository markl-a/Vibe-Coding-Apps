import { PrismaClient, LeaveType } from '@prisma/client';
import { differenceInDays } from 'date-fns';

const prisma = new PrismaClient();

export class LeaveService {
  async createLeaveRequest(data: {
    employeeId: string;
    leaveType: LeaveType;
    startDate: Date;
    endDate: Date;
    reason: string;
  }) {
    const days = differenceInDays(data.endDate, data.startDate) + 1;

    // 檢查假期餘額
    const balance = await this.getLeaveBalance(
      data.employeeId,
      new Date().getFullYear(),
      data.leaveType
    );

    if (balance && balance.available < days) {
      throw new Error('假期餘額不足');
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        ...data,
        days,
        status: 'PENDING',
      },
    });

    // 更新待審批餘額
    if (balance) {
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          pending: balance.pending + days,
          available: balance.available - days,
        },
      });
    }

    return leaveRequest;
  }

  async approveLeaveRequest(id: string, approverId: string) {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!leaveRequest) {
      throw new Error('請假申請不存在');
    }

    if (leaveRequest.status !== 'PENDING') {
      throw new Error('該請假申請已處理');
    }

    const updatedRequest = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approverId,
        approvedAt: new Date(),
      },
    });

    // 更新假期餘額
    const balance = await this.getLeaveBalance(
      leaveRequest.employeeId,
      new Date().getFullYear(),
      leaveRequest.leaveType
    );

    if (balance) {
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          used: balance.used + leaveRequest.days,
          pending: balance.pending - leaveRequest.days,
        },
      });
    }

    return updatedRequest;
  }

  async rejectLeaveRequest(
    id: string,
    approverId: string,
    rejectionReason: string
  ) {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!leaveRequest) {
      throw new Error('請假申請不存在');
    }

    const updatedRequest = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approverId,
        approvedAt: new Date(),
        rejectionReason,
      },
    });

    // 恢復假期餘額
    const balance = await this.getLeaveBalance(
      leaveRequest.employeeId,
      new Date().getFullYear(),
      leaveRequest.leaveType
    );

    if (balance) {
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          pending: balance.pending - leaveRequest.days,
          available: balance.available + leaveRequest.days,
        },
      });
    }

    return updatedRequest;
  }

  async getLeaveBalance(
    employeeId: string,
    year: number,
    leaveType: LeaveType
  ) {
    return await prisma.leaveBalance.findUnique({
      where: {
        employeeId_year_leaveType: {
          employeeId,
          year,
          leaveType,
        },
      },
    });
  }

  async getAllLeaveBalances(employeeId: string, year: number) {
    return await prisma.leaveBalance.findMany({
      where: { employeeId, year },
    });
  }

  async getLeaveRequests(employeeId?: string, status?: string) {
    return await prisma.leaveRequest.findMany({
      where: {
        ...(employeeId && { employeeId }),
        ...(status && { status: status as any }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const leaveService = new LeaveService();
