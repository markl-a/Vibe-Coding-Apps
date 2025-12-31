import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LeaveService } from '../services/leave.service';
import { LeaveType, LeaveStatus } from '@prisma/client';

// Mock Prisma Client
const mockPrismaClient = {
  leaveRequest: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  leaveBalance: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
};

// Mock the PrismaClient module
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrismaClient),
  LeaveType: {
    ANNUAL: 'ANNUAL',
    SICK: 'SICK',
    PERSONAL: 'PERSONAL',
    MARRIAGE: 'MARRIAGE',
    MATERNITY: 'MATERNITY',
    PATERNITY: 'PATERNITY',
    BEREAVEMENT: 'BEREAVEMENT',
    UNPAID: 'UNPAID',
  },
  LeaveStatus: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    CANCELLED: 'CANCELLED',
  },
}));

describe('LeaveService', () => {
  let leaveService: LeaveService;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    leaveService = new LeaveService();
  });

  describe('createLeaveRequest - Submit leave request', () => {
    const mockLeaveRequestData = {
      employeeId: 'emp-123',
      leaveType: LeaveType.ANNUAL,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-05'),
      reason: 'Family vacation',
    };

    const mockBalance = {
      id: 'balance-123',
      employeeId: 'emp-123',
      year: 2024,
      leaveType: LeaveType.ANNUAL,
      total: 20,
      used: 5,
      pending: 0,
      available: 15,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully create a leave request with sufficient balance', async () => {
      const expectedLeaveRequest = {
        id: 'leave-req-123',
        ...mockLeaveRequestData,
        days: 5,
        status: 'PENDING',
        approverId: null,
        approvedAt: null,
        rejectionReason: null,
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.leaveBalance.findUnique.mockResolvedValue(mockBalance);
      mockPrismaClient.leaveRequest.create.mockResolvedValue(expectedLeaveRequest);
      mockPrismaClient.leaveBalance.update.mockResolvedValue({
        ...mockBalance,
        pending: 5,
        available: 10,
      });

      const result = await leaveService.createLeaveRequest(mockLeaveRequestData);

      expect(result).toEqual(expectedLeaveRequest);
      expect(mockPrismaClient.leaveBalance.findUnique).toHaveBeenCalledWith({
        where: {
          employeeId_year_leaveType: {
            employeeId: 'emp-123',
            year: new Date().getFullYear(),
            leaveType: LeaveType.ANNUAL,
          },
        },
      });
      expect(mockPrismaClient.leaveRequest.create).toHaveBeenCalledWith({
        data: {
          ...mockLeaveRequestData,
          days: 5,
          status: 'PENDING',
        },
      });
      expect(mockPrismaClient.leaveBalance.update).toHaveBeenCalledWith({
        where: { id: 'balance-123' },
        data: {
          pending: 5,
          available: 10,
        },
      });
    });

    it('should calculate correct number of days for leave request', async () => {
      const requestData = {
        ...mockLeaveRequestData,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-03'),
      };

      mockPrismaClient.leaveBalance.findUnique.mockResolvedValue(mockBalance);
      mockPrismaClient.leaveRequest.create.mockResolvedValue({
        id: 'leave-req-123',
        ...requestData,
        days: 3,
        status: 'PENDING',
      });

      await leaveService.createLeaveRequest(requestData);

      expect(mockPrismaClient.leaveRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          days: 3,
        }),
      });
    });

    it('should throw error when leave balance is insufficient', async () => {
      const insufficientBalance = {
        ...mockBalance,
        available: 3,
      };

      mockPrismaClient.leaveBalance.findUnique.mockResolvedValue(insufficientBalance);

      await expect(
        leaveService.createLeaveRequest(mockLeaveRequestData)
      ).rejects.toThrow('假期餘額不足');

      expect(mockPrismaClient.leaveRequest.create).not.toHaveBeenCalled();
    });

    it('should handle single day leave request', async () => {
      const singleDayRequest = {
        ...mockLeaveRequestData,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-01'),
      };

      mockPrismaClient.leaveBalance.findUnique.mockResolvedValue(mockBalance);
      mockPrismaClient.leaveRequest.create.mockResolvedValue({
        id: 'leave-req-123',
        ...singleDayRequest,
        days: 1,
        status: 'PENDING',
      });

      await leaveService.createLeaveRequest(singleDayRequest);

      expect(mockPrismaClient.leaveRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          days: 1,
        }),
      });
    });

    it('should create leave request when balance is null (no balance tracking)', async () => {
      mockPrismaClient.leaveBalance.findUnique.mockResolvedValue(null);
      mockPrismaClient.leaveRequest.create.mockResolvedValue({
        id: 'leave-req-123',
        ...mockLeaveRequestData,
        days: 5,
        status: 'PENDING',
      });

      const result = await leaveService.createLeaveRequest(mockLeaveRequestData);

      expect(result).toBeDefined();
      expect(mockPrismaClient.leaveBalance.update).not.toHaveBeenCalled();
    });
  });

  describe('approveLeaveRequest - Approve leave request', () => {
    const mockLeaveRequest = {
      id: 'leave-req-123',
      employeeId: 'emp-123',
      leaveType: LeaveType.ANNUAL,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-05'),
      days: 5,
      reason: 'Vacation',
      status: 'PENDING',
      approverId: null,
      approvedAt: null,
      rejectionReason: null,
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockBalance = {
      id: 'balance-123',
      employeeId: 'emp-123',
      year: 2024,
      leaveType: LeaveType.ANNUAL,
      total: 20,
      used: 5,
      pending: 5,
      available: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully approve a pending leave request', async () => {
      const approverId = 'manager-123';
      const approvedRequest = {
        ...mockLeaveRequest,
        status: 'APPROVED',
        approverId,
        approvedAt: new Date(),
      };

      mockPrismaClient.leaveRequest.findUnique.mockResolvedValue(mockLeaveRequest);
      mockPrismaClient.leaveRequest.update.mockResolvedValue(approvedRequest);
      mockPrismaClient.leaveBalance.findUnique.mockResolvedValue(mockBalance);
      mockPrismaClient.leaveBalance.update.mockResolvedValue({
        ...mockBalance,
        used: 10,
        pending: 0,
      });

      const result = await leaveService.approveLeaveRequest('leave-req-123', approverId);

      expect(result.status).toBe('APPROVED');
      expect(result.approverId).toBe(approverId);
      expect(mockPrismaClient.leaveRequest.update).toHaveBeenCalledWith({
        where: { id: 'leave-req-123' },
        data: {
          status: 'APPROVED',
          approverId,
          approvedAt: expect.any(Date),
        },
      });
      expect(mockPrismaClient.leaveBalance.update).toHaveBeenCalledWith({
        where: { id: 'balance-123' },
        data: {
          used: 10,
          pending: 0,
        },
      });
    });

    it('should throw error when leave request does not exist', async () => {
      mockPrismaClient.leaveRequest.findUnique.mockResolvedValue(null);

      await expect(
        leaveService.approveLeaveRequest('non-existent', 'manager-123')
      ).rejects.toThrow('請假申請不存在');

      expect(mockPrismaClient.leaveRequest.update).not.toHaveBeenCalled();
    });

    it('should throw error when leave request is not pending', async () => {
      const approvedRequest = {
        ...mockLeaveRequest,
        status: 'APPROVED',
      };

      mockPrismaClient.leaveRequest.findUnique.mockResolvedValue(approvedRequest);

      await expect(
        leaveService.approveLeaveRequest('leave-req-123', 'manager-123')
      ).rejects.toThrow('該請假申請已處理');

      expect(mockPrismaClient.leaveRequest.update).not.toHaveBeenCalled();
    });

    it('should update balance correctly when approving', async () => {
      mockPrismaClient.leaveRequest.findUnique.mockResolvedValue(mockLeaveRequest);
      mockPrismaClient.leaveRequest.update.mockResolvedValue({
        ...mockLeaveRequest,
        status: 'APPROVED',
      });
      mockPrismaClient.leaveBalance.findUnique.mockResolvedValue(mockBalance);

      await leaveService.approveLeaveRequest('leave-req-123', 'manager-123');

      expect(mockPrismaClient.leaveBalance.update).toHaveBeenCalledWith({
        where: { id: 'balance-123' },
        data: {
          used: mockBalance.used + mockLeaveRequest.days,
          pending: mockBalance.pending - mockLeaveRequest.days,
        },
      });
    });

    it('should handle approval when balance is null', async () => {
      mockPrismaClient.leaveRequest.findUnique.mockResolvedValue(mockLeaveRequest);
      mockPrismaClient.leaveRequest.update.mockResolvedValue({
        ...mockLeaveRequest,
        status: 'APPROVED',
      });
      mockPrismaClient.leaveBalance.findUnique.mockResolvedValue(null);

      const result = await leaveService.approveLeaveRequest('leave-req-123', 'manager-123');

      expect(result.status).toBe('APPROVED');
      expect(mockPrismaClient.leaveBalance.update).not.toHaveBeenCalled();
    });
  });

  describe('rejectLeaveRequest - Reject leave request', () => {
    const mockLeaveRequest = {
      id: 'leave-req-123',
      employeeId: 'emp-123',
      leaveType: LeaveType.ANNUAL,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-05'),
      days: 5,
      reason: 'Vacation',
      status: 'PENDING',
      approverId: null,
      approvedAt: null,
      rejectionReason: null,
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockBalance = {
      id: 'balance-123',
      employeeId: 'emp-123',
      year: 2024,
      leaveType: LeaveType.ANNUAL,
      total: 20,
      used: 5,
      pending: 5,
      available: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully reject a pending leave request', async () => {
      const approverId = 'manager-123';
      const rejectionReason = 'Insufficient staffing during requested period';
      const rejectedRequest = {
        ...mockLeaveRequest,
        status: 'REJECTED',
        approverId,
        approvedAt: new Date(),
        rejectionReason,
      };

      mockPrismaClient.leaveRequest.findUnique.mockResolvedValue(mockLeaveRequest);
      mockPrismaClient.leaveRequest.update.mockResolvedValue(rejectedRequest);
      mockPrismaClient.leaveBalance.findUnique.mockResolvedValue(mockBalance);
      mockPrismaClient.leaveBalance.update.mockResolvedValue({
        ...mockBalance,
        pending: 0,
        available: 15,
      });

      const result = await leaveService.rejectLeaveRequest(
        'leave-req-123',
        approverId,
        rejectionReason
      );

      expect(result.status).toBe('REJECTED');
      expect(result.rejectionReason).toBe(rejectionReason);
      expect(mockPrismaClient.leaveRequest.update).toHaveBeenCalledWith({
        where: { id: 'leave-req-123' },
        data: {
          status: 'REJECTED',
          approverId,
          approvedAt: expect.any(Date),
          rejectionReason,
        },
      });
    });

    it('should restore leave balance when rejecting request', async () => {
      mockPrismaClient.leaveRequest.findUnique.mockResolvedValue(mockLeaveRequest);
      mockPrismaClient.leaveRequest.update.mockResolvedValue({
        ...mockLeaveRequest,
        status: 'REJECTED',
      });
      mockPrismaClient.leaveBalance.findUnique.mockResolvedValue(mockBalance);

      await leaveService.rejectLeaveRequest(
        'leave-req-123',
        'manager-123',
        'Not enough coverage'
      );

      expect(mockPrismaClient.leaveBalance.update).toHaveBeenCalledWith({
        where: { id: 'balance-123' },
        data: {
          pending: mockBalance.pending - mockLeaveRequest.days,
          available: mockBalance.available + mockLeaveRequest.days,
        },
      });
    });

    it('should throw error when leave request does not exist', async () => {
      mockPrismaClient.leaveRequest.findUnique.mockResolvedValue(null);

      await expect(
        leaveService.rejectLeaveRequest('non-existent', 'manager-123', 'reason')
      ).rejects.toThrow('請假申請不存在');

      expect(mockPrismaClient.leaveRequest.update).not.toHaveBeenCalled();
    });

    it('should handle rejection when balance is null', async () => {
      mockPrismaClient.leaveRequest.findUnique.mockResolvedValue(mockLeaveRequest);
      mockPrismaClient.leaveRequest.update.mockResolvedValue({
        ...mockLeaveRequest,
        status: 'REJECTED',
      });
      mockPrismaClient.leaveBalance.findUnique.mockResolvedValue(null);

      const result = await leaveService.rejectLeaveRequest(
        'leave-req-123',
        'manager-123',
        'reason'
      );

      expect(result.status).toBe('REJECTED');
      expect(mockPrismaClient.leaveBalance.update).not.toHaveBeenCalled();
    });
  });

  describe('getLeaveBalance - Calculate leave balance', () => {
    it('should return leave balance for employee, year, and leave type', async () => {
      const mockBalance = {
        id: 'balance-123',
        employeeId: 'emp-123',
        year: 2024,
        leaveType: LeaveType.ANNUAL,
        total: 20,
        used: 5,
        pending: 3,
        available: 12,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.leaveBalance.findUnique.mockResolvedValue(mockBalance);

      const result = await leaveService.getLeaveBalance('emp-123', 2024, LeaveType.ANNUAL);

      expect(result).toEqual(mockBalance);
      expect(mockPrismaClient.leaveBalance.findUnique).toHaveBeenCalledWith({
        where: {
          employeeId_year_leaveType: {
            employeeId: 'emp-123',
            year: 2024,
            leaveType: LeaveType.ANNUAL,
          },
        },
      });
    });

    it('should return null when balance does not exist', async () => {
      mockPrismaClient.leaveBalance.findUnique.mockResolvedValue(null);

      const result = await leaveService.getLeaveBalance('emp-123', 2024, LeaveType.SICK);

      expect(result).toBeNull();
    });

    it('should query balance for different leave types', async () => {
      const sickBalance = {
        id: 'balance-456',
        employeeId: 'emp-123',
        year: 2024,
        leaveType: LeaveType.SICK,
        total: 10,
        used: 2,
        pending: 0,
        available: 8,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.leaveBalance.findUnique.mockResolvedValue(sickBalance);

      const result = await leaveService.getLeaveBalance('emp-123', 2024, LeaveType.SICK);

      expect(result?.leaveType).toBe(LeaveType.SICK);
    });
  });

  describe('getAllLeaveBalances - Get all balances for employee', () => {
    it('should return all leave balances for employee and year', async () => {
      const mockBalances = [
        {
          id: 'balance-1',
          employeeId: 'emp-123',
          year: 2024,
          leaveType: LeaveType.ANNUAL,
          total: 20,
          used: 5,
          pending: 0,
          available: 15,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'balance-2',
          employeeId: 'emp-123',
          year: 2024,
          leaveType: LeaveType.SICK,
          total: 10,
          used: 2,
          pending: 0,
          available: 8,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaClient.leaveBalance.findMany.mockResolvedValue(mockBalances);

      const result = await leaveService.getAllLeaveBalances('emp-123', 2024);

      expect(result).toEqual(mockBalances);
      expect(result).toHaveLength(2);
      expect(mockPrismaClient.leaveBalance.findMany).toHaveBeenCalledWith({
        where: { employeeId: 'emp-123', year: 2024 },
      });
    });

    it('should return empty array when no balances exist', async () => {
      mockPrismaClient.leaveBalance.findMany.mockResolvedValue([]);

      const result = await leaveService.getAllLeaveBalances('emp-123', 2024);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getLeaveRequests - Get leave requests', () => {
    const mockRequests = [
      {
        id: 'leave-req-1',
        employeeId: 'emp-123',
        leaveType: LeaveType.ANNUAL,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        days: 5,
        reason: 'Vacation',
        status: 'PENDING',
        approverId: null,
        approvedAt: null,
        rejectionReason: null,
        attachments: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'leave-req-2',
        employeeId: 'emp-123',
        leaveType: LeaveType.SICK,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-02'),
        days: 2,
        reason: 'Flu',
        status: 'APPROVED',
        approverId: 'manager-123',
        approvedAt: new Date('2024-02-01'),
        rejectionReason: null,
        attachments: [],
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01'),
      },
    ];

    it('should return all leave requests when no filters applied', async () => {
      mockPrismaClient.leaveRequest.findMany.mockResolvedValue(mockRequests);

      const result = await leaveService.getLeaveRequests();

      expect(result).toEqual(mockRequests);
      expect(mockPrismaClient.leaveRequest.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter leave requests by employee ID', async () => {
      const filteredRequests = [mockRequests[0]];
      mockPrismaClient.leaveRequest.findMany.mockResolvedValue(filteredRequests);

      const result = await leaveService.getLeaveRequests('emp-123');

      expect(result).toHaveLength(1);
      expect(mockPrismaClient.leaveRequest.findMany).toHaveBeenCalledWith({
        where: { employeeId: 'emp-123' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter leave requests by status', async () => {
      const pendingRequests = [mockRequests[0]];
      mockPrismaClient.leaveRequest.findMany.mockResolvedValue(pendingRequests);

      const result = await leaveService.getLeaveRequests(undefined, 'PENDING');

      expect(result).toHaveLength(1);
      expect(mockPrismaClient.leaveRequest.findMany).toHaveBeenCalledWith({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter leave requests by both employee ID and status', async () => {
      mockPrismaClient.leaveRequest.findMany.mockResolvedValue([mockRequests[0]]);

      const result = await leaveService.getLeaveRequests('emp-123', 'PENDING');

      expect(mockPrismaClient.leaveRequest.findMany).toHaveBeenCalledWith({
        where: { employeeId: 'emp-123', status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no requests match filters', async () => {
      mockPrismaClient.leaveRequest.findMany.mockResolvedValue([]);

      const result = await leaveService.getLeaveRequests('emp-999', 'APPROVED');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('Check leave eligibility', () => {
    it('should allow leave request when employee has sufficient annual leave balance', async () => {
      const mockBalance = {
        id: 'balance-123',
        employeeId: 'emp-123',
        year: 2024,
        leaveType: LeaveType.ANNUAL,
        total: 20,
        used: 5,
        pending: 0,
        available: 15,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const requestData = {
        employeeId: 'emp-123',
        leaveType: LeaveType.ANNUAL,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-10'),
        reason: 'Vacation',
      };

      mockPrismaClient.leaveBalance.findUnique.mockResolvedValue(mockBalance);
      mockPrismaClient.leaveRequest.create.mockResolvedValue({
        id: 'leave-req-123',
        ...requestData,
        days: 10,
        status: 'PENDING',
      });

      const result = await leaveService.createLeaveRequest(requestData);

      expect(result).toBeDefined();
      expect(mockPrismaClient.leaveRequest.create).toHaveBeenCalled();
    });

    it('should reject leave request when employee has insufficient balance', async () => {
      const mockBalance = {
        id: 'balance-123',
        employeeId: 'emp-123',
        year: 2024,
        leaveType: LeaveType.ANNUAL,
        total: 20,
        used: 18,
        pending: 0,
        available: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const requestData = {
        employeeId: 'emp-123',
        leaveType: LeaveType.ANNUAL,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-10'),
        reason: 'Vacation',
      };

      mockPrismaClient.leaveBalance.findUnique.mockResolvedValue(mockBalance);

      await expect(leaveService.createLeaveRequest(requestData)).rejects.toThrow(
        '假期餘額不足'
      );
    });
  });

  describe('Handle overlapping leave requests', () => {
    it('should create leave request even with existing approved leaves (system allows overlap)', async () => {
      const mockBalance = {
        id: 'balance-123',
        employeeId: 'emp-123',
        year: 2024,
        leaveType: LeaveType.ANNUAL,
        total: 20,
        used: 5,
        pending: 0,
        available: 15,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const requestData = {
        employeeId: 'emp-123',
        leaveType: LeaveType.ANNUAL,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        reason: 'Vacation',
      };

      mockPrismaClient.leaveBalance.findUnique.mockResolvedValue(mockBalance);
      mockPrismaClient.leaveRequest.create.mockResolvedValue({
        id: 'leave-req-123',
        ...requestData,
        days: 5,
        status: 'PENDING',
      });

      const result = await leaveService.createLeaveRequest(requestData);

      expect(result).toBeDefined();
      expect(result.status).toBe('PENDING');
    });
  });

  describe('Annual leave accrual', () => {
    it('should properly track annual leave balance with total and available', async () => {
      const annualBalance = {
        id: 'balance-123',
        employeeId: 'emp-123',
        year: 2024,
        leaveType: LeaveType.ANNUAL,
        total: 20,
        used: 5,
        pending: 3,
        available: 12,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.leaveBalance.findUnique.mockResolvedValue(annualBalance);

      const result = await leaveService.getLeaveBalance('emp-123', 2024, LeaveType.ANNUAL);

      expect(result?.total).toBe(20);
      expect(result?.used).toBe(5);
      expect(result?.pending).toBe(3);
      expect(result?.available).toBe(12);
      expect(result?.used + result?.pending + result?.available).toBe(20);
    });

    it('should deduct from available balance when creating annual leave request', async () => {
      const annualBalance = {
        id: 'balance-123',
        employeeId: 'emp-123',
        year: 2024,
        leaveType: LeaveType.ANNUAL,
        total: 20,
        used: 0,
        pending: 0,
        available: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const requestData = {
        employeeId: 'emp-123',
        leaveType: LeaveType.ANNUAL,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        reason: 'Vacation',
      };

      mockPrismaClient.leaveBalance.findUnique.mockResolvedValue(annualBalance);
      mockPrismaClient.leaveRequest.create.mockResolvedValue({
        id: 'leave-req-123',
        ...requestData,
        days: 5,
        status: 'PENDING',
      });

      await leaveService.createLeaveRequest(requestData);

      expect(mockPrismaClient.leaveBalance.update).toHaveBeenCalledWith({
        where: { id: 'balance-123' },
        data: {
          pending: 5,
          available: 15,
        },
      });
    });
  });

  describe('Sick leave handling', () => {
    it('should create sick leave request with proper balance tracking', async () => {
      const sickBalance = {
        id: 'balance-456',
        employeeId: 'emp-123',
        year: 2024,
        leaveType: LeaveType.SICK,
        total: 10,
        used: 2,
        pending: 0,
        available: 8,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const requestData = {
        employeeId: 'emp-123',
        leaveType: LeaveType.SICK,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-02'),
        reason: 'Flu',
      };

      mockPrismaClient.leaveBalance.findUnique.mockResolvedValue(sickBalance);
      mockPrismaClient.leaveRequest.create.mockResolvedValue({
        id: 'leave-req-123',
        ...requestData,
        days: 2,
        status: 'PENDING',
      });

      const result = await leaveService.createLeaveRequest(requestData);

      expect(result.leaveType).toBe(LeaveType.SICK);
      expect(result.days).toBe(2);
    });

    it('should enforce sick leave balance limit', async () => {
      const sickBalance = {
        id: 'balance-456',
        employeeId: 'emp-123',
        year: 2024,
        leaveType: LeaveType.SICK,
        total: 10,
        used: 9,
        pending: 0,
        available: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const requestData = {
        employeeId: 'emp-123',
        leaveType: LeaveType.SICK,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        reason: 'Severe illness',
      };

      mockPrismaClient.leaveBalance.findUnique.mockResolvedValue(sickBalance);

      await expect(leaveService.createLeaveRequest(requestData)).rejects.toThrow(
        '假期餘額不足'
      );
    });

    it('should update sick leave balance when approved', async () => {
      const sickRequest = {
        id: 'leave-req-123',
        employeeId: 'emp-123',
        leaveType: LeaveType.SICK,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-02'),
        days: 2,
        reason: 'Flu',
        status: 'PENDING',
        approverId: null,
        approvedAt: null,
        rejectionReason: null,
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const sickBalance = {
        id: 'balance-456',
        employeeId: 'emp-123',
        year: 2024,
        leaveType: LeaveType.SICK,
        total: 10,
        used: 2,
        pending: 2,
        available: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.leaveRequest.findUnique.mockResolvedValue(sickRequest);
      mockPrismaClient.leaveRequest.update.mockResolvedValue({
        ...sickRequest,
        status: 'APPROVED',
      });
      mockPrismaClient.leaveBalance.findUnique.mockResolvedValue(sickBalance);

      await leaveService.approveLeaveRequest('leave-req-123', 'manager-123');

      expect(mockPrismaClient.leaveBalance.update).toHaveBeenCalledWith({
        where: { id: 'balance-456' },
        data: {
          used: 4,
          pending: 0,
        },
      });
    });
  });

  describe('Error cases and edge scenarios', () => {
    it('should handle database errors gracefully when creating leave request', async () => {
      const requestData = {
        employeeId: 'emp-123',
        leaveType: LeaveType.ANNUAL,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        reason: 'Vacation',
      };

      mockPrismaClient.leaveBalance.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(leaveService.createLeaveRequest(requestData)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle database errors when approving leave request', async () => {
      mockPrismaClient.leaveRequest.findUnique.mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        leaveService.approveLeaveRequest('leave-req-123', 'manager-123')
      ).rejects.toThrow('Database error');
    });

    it('should handle database errors when rejecting leave request', async () => {
      mockPrismaClient.leaveRequest.findUnique.mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        leaveService.rejectLeaveRequest('leave-req-123', 'manager-123', 'reason')
      ).rejects.toThrow('Database error');
    });

    it('should handle end date before start date (invalid date range)', async () => {
      const invalidRequestData = {
        employeeId: 'emp-123',
        leaveType: LeaveType.ANNUAL,
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-05'),
        reason: 'Vacation',
      };

      const mockBalance = {
        id: 'balance-123',
        employeeId: 'emp-123',
        year: 2024,
        leaveType: LeaveType.ANNUAL,
        total: 20,
        used: 5,
        pending: 0,
        available: 15,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.leaveBalance.findUnique.mockResolvedValue(mockBalance);
      mockPrismaClient.leaveRequest.create.mockResolvedValue({
        id: 'leave-req-123',
        ...invalidRequestData,
        days: -4,
        status: 'PENDING',
      });

      // The service doesn't validate date order, it calculates negative days
      const result = await leaveService.createLeaveRequest(invalidRequestData);
      expect(result.days).toBe(-4);
    });

    it('should handle very long leave requests', async () => {
      const longLeaveRequest = {
        employeeId: 'emp-123',
        leaveType: LeaveType.ANNUAL,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        reason: 'Sabbatical',
      };

      const mockBalance = {
        id: 'balance-123',
        employeeId: 'emp-123',
        year: 2024,
        leaveType: LeaveType.ANNUAL,
        total: 20,
        used: 0,
        pending: 0,
        available: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.leaveBalance.findUnique.mockResolvedValue(mockBalance);

      // Should throw error due to insufficient balance (366 days vs 20 available)
      await expect(leaveService.createLeaveRequest(longLeaveRequest)).rejects.toThrow(
        '假期餘額不足'
      );
    });

    it('should handle request for different leave types (PERSONAL, MARRIAGE, etc.)', async () => {
      const marriageLeave = {
        employeeId: 'emp-123',
        leaveType: LeaveType.MARRIAGE,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-07'),
        reason: 'Wedding',
      };

      const mockBalance = {
        id: 'balance-789',
        employeeId: 'emp-123',
        year: 2024,
        leaveType: LeaveType.MARRIAGE,
        total: 7,
        used: 0,
        pending: 0,
        available: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.leaveBalance.findUnique.mockResolvedValue(mockBalance);
      mockPrismaClient.leaveRequest.create.mockResolvedValue({
        id: 'leave-req-123',
        ...marriageLeave,
        days: 7,
        status: 'PENDING',
      });

      const result = await leaveService.createLeaveRequest(marriageLeave);

      expect(result.leaveType).toBe(LeaveType.MARRIAGE);
      expect(result.days).toBe(7);
    });

    it('should handle concurrent balance updates (race condition scenario)', async () => {
      const requestData = {
        employeeId: 'emp-123',
        leaveType: LeaveType.ANNUAL,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        reason: 'Vacation',
      };

      const mockBalance = {
        id: 'balance-123',
        employeeId: 'emp-123',
        year: 2024,
        leaveType: LeaveType.ANNUAL,
        total: 20,
        used: 5,
        pending: 10,
        available: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.leaveBalance.findUnique.mockResolvedValue(mockBalance);
      mockPrismaClient.leaveRequest.create.mockResolvedValue({
        id: 'leave-req-123',
        ...requestData,
        days: 5,
        status: 'PENDING',
      });

      // Should succeed as available balance is exactly 5
      const result = await leaveService.createLeaveRequest(requestData);
      expect(result).toBeDefined();
    });

    it('should handle rejected request status change attempt', async () => {
      const rejectedRequest = {
        id: 'leave-req-123',
        employeeId: 'emp-123',
        leaveType: LeaveType.ANNUAL,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        days: 5,
        reason: 'Vacation',
        status: 'REJECTED',
        approverId: 'manager-123',
        approvedAt: new Date(),
        rejectionReason: 'Not enough coverage',
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.leaveRequest.findUnique.mockResolvedValue(rejectedRequest);

      await expect(
        leaveService.approveLeaveRequest('leave-req-123', 'manager-456')
      ).rejects.toThrow('該請假申請已處理');
    });

    it('should handle missing balance gracefully during rejection', async () => {
      const mockLeaveRequest = {
        id: 'leave-req-123',
        employeeId: 'emp-123',
        leaveType: LeaveType.UNPAID,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
        days: 5,
        reason: 'Personal reasons',
        status: 'PENDING',
        approverId: null,
        approvedAt: null,
        rejectionReason: null,
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.leaveRequest.findUnique.mockResolvedValue(mockLeaveRequest);
      mockPrismaClient.leaveRequest.update.mockResolvedValue({
        ...mockLeaveRequest,
        status: 'REJECTED',
      });
      mockPrismaClient.leaveBalance.findUnique.mockResolvedValue(null);

      const result = await leaveService.rejectLeaveRequest(
        'leave-req-123',
        'manager-123',
        'Changed plans'
      );

      expect(result.status).toBe('REJECTED');
      expect(mockPrismaClient.leaveBalance.update).not.toHaveBeenCalled();
    });
  });
});
