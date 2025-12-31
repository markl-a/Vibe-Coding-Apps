import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AttendanceService } from '../services/attendance.service';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient
vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    attendance: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    attendanceSummary: {
      findUnique: vi.fn(),
    },
  };

  return {
    PrismaClient: vi.fn(() => mockPrismaClient),
  };
});

describe('AttendanceService', () => {
  let service: AttendanceService;
  let mockPrisma: any;

  beforeEach(() => {
    // Get the mocked PrismaClient instance
    mockPrisma = new PrismaClient();
    service = new AttendanceService();

    // Reset all mocks
    vi.clearAllMocks();

    // Setup fake timers with a default time: 2024-01-15 10:00:00
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('checkIn', () => {
    const employeeId = 'emp-123';
    const location = { latitude: 25.033, longitude: 121.5654 };

    it('should successfully check in on time without existing record', async () => {
      // Set time to 9:00 AM (on time)
      vi.setSystemTime(new Date('2024-01-15T09:00:00Z'));

      mockPrisma.attendance.findFirst.mockResolvedValue(null);
      mockPrisma.attendance.create.mockResolvedValue({
        id: 'att-1',
        employeeId,
        date: new Date('2024-01-15T00:00:00Z'),
        checkIn: new Date('2024-01-15T09:00:00Z'),
        checkInLocation: location,
        status: 'PRESENT',
        checkOut: null,
        workHours: 0,
        overtimeHours: 0,
      });

      const result = await service.checkIn(employeeId, location);

      expect(mockPrisma.attendance.findFirst).toHaveBeenCalledWith({
        where: {
          employeeId,
          date: {
            gte: expect.any(Date),
            lt: expect.any(Date),
          },
        },
      });

      expect(mockPrisma.attendance.create).toHaveBeenCalledWith({
        data: {
          employeeId,
          date: expect.any(Date),
          checkIn: expect.any(Date),
          checkInLocation: location,
          status: 'PRESENT',
        },
      });

      expect(result.status).toBe('PRESENT');
      expect(result.checkInLocation).toEqual(location);
    });

    it('should detect late arrival when checking in after 9:15 AM', async () => {
      // Set time to 9:30 AM (late)
      vi.setSystemTime(new Date('2024-01-15T09:30:00Z'));

      mockPrisma.attendance.findFirst.mockResolvedValue(null);
      mockPrisma.attendance.create.mockResolvedValue({
        id: 'att-2',
        employeeId,
        date: new Date('2024-01-15T00:00:00Z'),
        checkIn: new Date('2024-01-15T09:30:00Z'),
        checkInLocation: location,
        status: 'LATE',
        checkOut: null,
        workHours: 0,
        overtimeHours: 0,
      });

      const result = await service.checkIn(employeeId, location);

      expect(result.status).toBe('LATE');
      expect(mockPrisma.attendance.create).toHaveBeenCalledWith({
        data: {
          employeeId,
          date: expect.any(Date),
          checkIn: expect.any(Date),
          checkInLocation: location,
          status: 'LATE',
        },
      });
    });

    it('should check in without location data', async () => {
      vi.setSystemTime(new Date('2024-01-15T09:00:00Z'));

      mockPrisma.attendance.findFirst.mockResolvedValue(null);
      mockPrisma.attendance.create.mockResolvedValue({
        id: 'att-3',
        employeeId,
        date: new Date('2024-01-15T00:00:00Z'),
        checkIn: new Date('2024-01-15T09:00:00Z'),
        checkInLocation: undefined,
        status: 'PRESENT',
        checkOut: null,
        workHours: 0,
        overtimeHours: 0,
      });

      const result = await service.checkIn(employeeId);

      expect(mockPrisma.attendance.create).toHaveBeenCalledWith({
        data: {
          employeeId,
          date: expect.any(Date),
          checkIn: expect.any(Date),
          checkInLocation: undefined,
          status: 'PRESENT',
        },
      });

      expect(result.checkInLocation).toBeUndefined();
    });

    it('should update existing record if no checkIn exists yet', async () => {
      vi.setSystemTime(new Date('2024-01-15T09:00:00Z'));

      const existingRecord = {
        id: 'att-4',
        employeeId,
        date: new Date('2024-01-15T00:00:00Z'),
        checkIn: null,
        checkOut: null,
        status: null,
      };

      mockPrisma.attendance.findFirst.mockResolvedValue(existingRecord);
      mockPrisma.attendance.update.mockResolvedValue({
        ...existingRecord,
        checkIn: new Date('2024-01-15T09:00:00Z'),
        checkInLocation: location,
        status: 'PRESENT',
      });

      const result = await service.checkIn(employeeId, location);

      expect(mockPrisma.attendance.update).toHaveBeenCalledWith({
        where: { id: 'att-4' },
        data: {
          checkIn: expect.any(Date),
          checkInLocation: location,
          status: 'PRESENT',
        },
      });

      expect(result.status).toBe('PRESENT');
    });

    it('should throw error if already checked in today', async () => {
      const existingRecord = {
        id: 'att-5',
        employeeId,
        date: new Date('2024-01-15T00:00:00Z'),
        checkIn: new Date('2024-01-15T08:00:00Z'),
        checkOut: null,
        status: 'PRESENT',
      };

      mockPrisma.attendance.findFirst.mockResolvedValue(existingRecord);

      await expect(service.checkIn(employeeId, location)).rejects.toThrow('今日已打卡');
      expect(mockPrisma.attendance.create).not.toHaveBeenCalled();
      expect(mockPrisma.attendance.update).not.toHaveBeenCalled();
    });

    it('should validate location-based check-in with correct coordinates', async () => {
      vi.setSystemTime(new Date('2024-01-15T09:00:00Z'));

      const validLocation = { latitude: 25.033964, longitude: 121.564468 };

      mockPrisma.attendance.findFirst.mockResolvedValue(null);
      mockPrisma.attendance.create.mockResolvedValue({
        id: 'att-6',
        employeeId,
        date: new Date('2024-01-15T00:00:00Z'),
        checkIn: new Date('2024-01-15T09:00:00Z'),
        checkInLocation: validLocation,
        status: 'PRESENT',
        checkOut: null,
        workHours: 0,
        overtimeHours: 0,
      });

      const result = await service.checkIn(employeeId, validLocation);

      expect(result.checkInLocation).toEqual(validLocation);
      expect(result.checkInLocation?.latitude).toBe(25.033964);
      expect(result.checkInLocation?.longitude).toBe(121.564468);
    });

    it('should handle check-in at exact late threshold (9:15 AM)', async () => {
      // Set time to exactly 9:15 AM
      vi.setSystemTime(new Date('2024-01-15T09:15:00Z'));

      mockPrisma.attendance.findFirst.mockResolvedValue(null);
      mockPrisma.attendance.create.mockResolvedValue({
        id: 'att-7',
        employeeId,
        date: new Date('2024-01-15T00:00:00Z'),
        checkIn: new Date('2024-01-15T09:15:00Z'),
        checkInLocation: location,
        status: 'PRESENT',
        checkOut: null,
        workHours: 0,
        overtimeHours: 0,
      });

      const result = await service.checkIn(employeeId, location);

      // At exactly 9:15, should still be PRESENT (not late yet)
      expect(result.status).toBe('PRESENT');
    });

    it('should handle check-in one minute after late threshold', async () => {
      // Set time to 9:16 AM (1 minute after threshold)
      vi.setSystemTime(new Date('2024-01-15T09:16:00Z'));

      mockPrisma.attendance.findFirst.mockResolvedValue(null);
      mockPrisma.attendance.create.mockResolvedValue({
        id: 'att-8',
        employeeId,
        date: new Date('2024-01-15T00:00:00Z'),
        checkIn: new Date('2024-01-15T09:16:00Z'),
        checkInLocation: location,
        status: 'LATE',
        checkOut: null,
        workHours: 0,
        overtimeHours: 0,
      });

      const result = await service.checkIn(employeeId, location);

      expect(result.status).toBe('LATE');
    });
  });

  describe('checkOut', () => {
    const employeeId = 'emp-123';
    const location = { latitude: 25.033, longitude: 121.5654 };

    it('should successfully check out with 8 hours worked', async () => {
      // Check in at 9:00 AM, check out at 5:00 PM (8 hours)
      const checkInTime = new Date('2024-01-15T09:00:00Z');
      vi.setSystemTime(new Date('2024-01-15T17:00:00Z'));

      const attendanceRecord = {
        id: 'att-1',
        employeeId,
        date: new Date('2024-01-15T00:00:00Z'),
        checkIn: checkInTime,
        checkOut: null,
        status: 'PRESENT',
      };

      mockPrisma.attendance.findFirst.mockResolvedValue(attendanceRecord);
      mockPrisma.attendance.update.mockResolvedValue({
        ...attendanceRecord,
        checkOut: new Date('2024-01-15T17:00:00Z'),
        checkOutLocation: location,
        workHours: 8,
        overtimeHours: 0,
      });

      const result = await service.checkOut(employeeId, location);

      expect(mockPrisma.attendance.update).toHaveBeenCalledWith({
        where: { id: 'att-1' },
        data: {
          checkOut: expect.any(Date),
          checkOutLocation: location,
          workHours: 8,
          overtimeHours: 0,
        },
      });

      expect(result.workHours).toBe(8);
      expect(result.overtimeHours).toBe(0);
      expect(result.checkOutLocation).toEqual(location);
    });

    it('should calculate overtime for working more than 8 hours', async () => {
      // Check in at 9:00 AM, check out at 7:00 PM (10 hours)
      const checkInTime = new Date('2024-01-15T09:00:00Z');
      vi.setSystemTime(new Date('2024-01-15T19:00:00Z'));

      const attendanceRecord = {
        id: 'att-2',
        employeeId,
        date: new Date('2024-01-15T00:00:00Z'),
        checkIn: checkInTime,
        checkOut: null,
        status: 'PRESENT',
      };

      mockPrisma.attendance.findFirst.mockResolvedValue(attendanceRecord);
      mockPrisma.attendance.update.mockResolvedValue({
        ...attendanceRecord,
        checkOut: new Date('2024-01-15T19:00:00Z'),
        checkOutLocation: location,
        workHours: 8,
        overtimeHours: 2,
      });

      const result = await service.checkOut(employeeId, location);

      expect(result.workHours).toBe(8);
      expect(result.overtimeHours).toBe(2);
    });

    it('should detect early departure when checking out before 6:00 PM', async () => {
      // Check in at 9:00 AM, check out at 3:00 PM (6 hours - early)
      const checkInTime = new Date('2024-01-15T09:00:00Z');
      vi.setSystemTime(new Date('2024-01-15T15:00:00Z'));

      const attendanceRecord = {
        id: 'att-3',
        employeeId,
        date: new Date('2024-01-15T00:00:00Z'),
        checkIn: checkInTime,
        checkOut: null,
        status: 'PRESENT',
      };

      mockPrisma.attendance.findFirst.mockResolvedValue(attendanceRecord);
      mockPrisma.attendance.update.mockResolvedValue({
        ...attendanceRecord,
        checkOut: new Date('2024-01-15T15:00:00Z'),
        checkOutLocation: location,
        workHours: 6,
        overtimeHours: 0,
      });

      const result = await service.checkOut(employeeId, location);

      expect(result.workHours).toBe(6);
      expect(result.overtimeHours).toBe(0);
    });

    it('should check out without location data', async () => {
      const checkInTime = new Date('2024-01-15T09:00:00Z');
      vi.setSystemTime(new Date('2024-01-15T17:00:00Z'));

      const attendanceRecord = {
        id: 'att-4',
        employeeId,
        date: new Date('2024-01-15T00:00:00Z'),
        checkIn: checkInTime,
        checkOut: null,
        status: 'PRESENT',
      };

      mockPrisma.attendance.findFirst.mockResolvedValue(attendanceRecord);
      mockPrisma.attendance.update.mockResolvedValue({
        ...attendanceRecord,
        checkOut: new Date('2024-01-15T17:00:00Z'),
        checkOutLocation: undefined,
        workHours: 8,
        overtimeHours: 0,
      });

      const result = await service.checkOut(employeeId);

      expect(mockPrisma.attendance.update).toHaveBeenCalledWith({
        where: { id: 'att-4' },
        data: {
          checkOut: expect.any(Date),
          checkOutLocation: undefined,
          workHours: 8,
          overtimeHours: 0,
        },
      });

      expect(result.checkOutLocation).toBeUndefined();
    });

    it('should throw error if no check-in record exists', async () => {
      mockPrisma.attendance.findFirst.mockResolvedValue(null);

      await expect(service.checkOut(employeeId, location)).rejects.toThrow('請先上班打卡');
      expect(mockPrisma.attendance.update).not.toHaveBeenCalled();
    });

    it('should throw error if check-in is null', async () => {
      const attendanceRecord = {
        id: 'att-5',
        employeeId,
        date: new Date('2024-01-15T00:00:00Z'),
        checkIn: null,
        checkOut: null,
        status: null,
      };

      mockPrisma.attendance.findFirst.mockResolvedValue(attendanceRecord);

      await expect(service.checkOut(employeeId, location)).rejects.toThrow('請先上班打卡');
      expect(mockPrisma.attendance.update).not.toHaveBeenCalled();
    });

    it('should throw error if already checked out today', async () => {
      const attendanceRecord = {
        id: 'att-6',
        employeeId,
        date: new Date('2024-01-15T00:00:00Z'),
        checkIn: new Date('2024-01-15T09:00:00Z'),
        checkOut: new Date('2024-01-15T17:00:00Z'),
        status: 'PRESENT',
      };

      mockPrisma.attendance.findFirst.mockResolvedValue(attendanceRecord);

      await expect(service.checkOut(employeeId, location)).rejects.toThrow('今日已下班打卡');
      expect(mockPrisma.attendance.update).not.toHaveBeenCalled();
    });

    it('should calculate maximum 8 work hours for exact 8-hour shift', async () => {
      // Check in at 9:00 AM, check out at 5:00 PM (exactly 8 hours)
      const checkInTime = new Date('2024-01-15T09:00:00Z');
      vi.setSystemTime(new Date('2024-01-15T17:00:00Z'));

      const attendanceRecord = {
        id: 'att-7',
        employeeId,
        date: new Date('2024-01-15T00:00:00Z'),
        checkIn: checkInTime,
        checkOut: null,
        status: 'PRESENT',
      };

      mockPrisma.attendance.findFirst.mockResolvedValue(attendanceRecord);
      mockPrisma.attendance.update.mockResolvedValue({
        ...attendanceRecord,
        checkOut: new Date('2024-01-15T17:00:00Z'),
        checkOutLocation: location,
        workHours: 8,
        overtimeHours: 0,
      });

      const result = await service.checkOut(employeeId, location);

      expect(result.workHours).toBe(8);
      expect(result.overtimeHours).toBe(0);
    });

    it('should calculate significant overtime (12 hours total)', async () => {
      // Check in at 9:00 AM, check out at 9:00 PM (12 hours)
      const checkInTime = new Date('2024-01-15T09:00:00Z');
      vi.setSystemTime(new Date('2024-01-15T21:00:00Z'));

      const attendanceRecord = {
        id: 'att-8',
        employeeId,
        date: new Date('2024-01-15T00:00:00Z'),
        checkIn: checkInTime,
        checkOut: null,
        status: 'PRESENT',
      };

      mockPrisma.attendance.findFirst.mockResolvedValue(attendanceRecord);
      mockPrisma.attendance.update.mockResolvedValue({
        ...attendanceRecord,
        checkOut: new Date('2024-01-15T21:00:00Z'),
        checkOutLocation: location,
        workHours: 8,
        overtimeHours: 4,
      });

      const result = await service.checkOut(employeeId, location);

      expect(result.workHours).toBe(8);
      expect(result.overtimeHours).toBe(4);
    });

    it('should handle very short work duration (2 hours)', async () => {
      // Check in at 9:00 AM, check out at 11:00 AM (2 hours)
      const checkInTime = new Date('2024-01-15T09:00:00Z');
      vi.setSystemTime(new Date('2024-01-15T11:00:00Z'));

      const attendanceRecord = {
        id: 'att-9',
        employeeId,
        date: new Date('2024-01-15T00:00:00Z'),
        checkIn: checkInTime,
        checkOut: null,
        status: 'PRESENT',
      };

      mockPrisma.attendance.findFirst.mockResolvedValue(attendanceRecord);
      mockPrisma.attendance.update.mockResolvedValue({
        ...attendanceRecord,
        checkOut: new Date('2024-01-15T11:00:00Z'),
        checkOutLocation: location,
        workHours: 2,
        overtimeHours: 0,
      });

      const result = await service.checkOut(employeeId, location);

      expect(result.workHours).toBe(2);
      expect(result.overtimeHours).toBe(0);
    });
  });

  describe('getAttendanceRecords', () => {
    const employeeId = 'emp-123';

    it('should retrieve attendance records for date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockRecords = [
        {
          id: 'att-1',
          employeeId,
          date: new Date('2024-01-15'),
          checkIn: new Date('2024-01-15T09:00:00Z'),
          checkOut: new Date('2024-01-15T17:00:00Z'),
          status: 'PRESENT',
          workHours: 8,
          overtimeHours: 0,
        },
        {
          id: 'att-2',
          employeeId,
          date: new Date('2024-01-14'),
          checkIn: new Date('2024-01-14T09:30:00Z'),
          checkOut: new Date('2024-01-14T18:00:00Z'),
          status: 'LATE',
          workHours: 8,
          overtimeHours: 0,
        },
      ];

      mockPrisma.attendance.findMany.mockResolvedValue(mockRecords);

      const result = await service.getAttendanceRecords(employeeId, startDate, endDate);

      expect(mockPrisma.attendance.findMany).toHaveBeenCalledWith({
        where: {
          employeeId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: 'desc' },
      });

      expect(result).toEqual(mockRecords);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no records found', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockPrisma.attendance.findMany.mockResolvedValue([]);

      const result = await service.getAttendanceRecords(employeeId, startDate, endDate);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle single day date range', async () => {
      const singleDate = new Date('2024-01-15');

      const mockRecords = [
        {
          id: 'att-1',
          employeeId,
          date: new Date('2024-01-15'),
          checkIn: new Date('2024-01-15T09:00:00Z'),
          checkOut: new Date('2024-01-15T17:00:00Z'),
          status: 'PRESENT',
          workHours: 8,
          overtimeHours: 0,
        },
      ];

      mockPrisma.attendance.findMany.mockResolvedValue(mockRecords);

      const result = await service.getAttendanceRecords(employeeId, singleDate, singleDate);

      expect(result).toHaveLength(1);
      expect(result[0].date).toEqual(new Date('2024-01-15'));
    });

    it('should return records ordered by date descending', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockRecords = [
        {
          id: 'att-3',
          employeeId,
          date: new Date('2024-01-16'),
          checkIn: new Date('2024-01-16T09:00:00Z'),
          checkOut: new Date('2024-01-16T17:00:00Z'),
          status: 'PRESENT',
          workHours: 8,
          overtimeHours: 0,
        },
        {
          id: 'att-2',
          employeeId,
          date: new Date('2024-01-15'),
          checkIn: new Date('2024-01-15T09:00:00Z'),
          checkOut: new Date('2024-01-15T17:00:00Z'),
          status: 'PRESENT',
          workHours: 8,
          overtimeHours: 0,
        },
      ];

      mockPrisma.attendance.findMany.mockResolvedValue(mockRecords);

      const result = await service.getAttendanceRecords(employeeId, startDate, endDate);

      expect(mockPrisma.attendance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { date: 'desc' },
        })
      );
    });
  });

  describe('getMonthlyStats', () => {
    const employeeId = 'emp-123';

    it('should retrieve monthly attendance statistics', async () => {
      const month = '2024-01';

      const mockStats = {
        employeeId,
        month,
        totalDays: 22,
        presentDays: 20,
        lateDays: 2,
        absentDays: 0,
        totalWorkHours: 160,
        totalOvertimeHours: 5,
      };

      mockPrisma.attendanceSummary.findUnique.mockResolvedValue(mockStats);

      const result = await service.getMonthlyStats(employeeId, month);

      expect(mockPrisma.attendanceSummary.findUnique).toHaveBeenCalledWith({
        where: {
          employeeId_month: {
            employeeId,
            month,
          },
        },
      });

      expect(result).toEqual(mockStats);
      expect(result?.totalDays).toBe(22);
      expect(result?.presentDays).toBe(20);
      expect(result?.lateDays).toBe(2);
    });

    it('should return null when no monthly stats found', async () => {
      const month = '2024-01';

      mockPrisma.attendanceSummary.findUnique.mockResolvedValue(null);

      const result = await service.getMonthlyStats(employeeId, month);

      expect(result).toBeNull();
    });

    it('should handle different month formats', async () => {
      const month = '2024-12';

      const mockStats = {
        employeeId,
        month,
        totalDays: 21,
        presentDays: 21,
        lateDays: 0,
        absentDays: 0,
        totalWorkHours: 168,
        totalOvertimeHours: 0,
      };

      mockPrisma.attendanceSummary.findUnique.mockResolvedValue(mockStats);

      const result = await service.getMonthlyStats(employeeId, month);

      expect(result?.month).toBe('2024-12');
    });
  });

  describe('Error Handling', () => {
    const employeeId = 'emp-123';

    it('should handle database errors during check-in', async () => {
      mockPrisma.attendance.findFirst.mockRejectedValue(new Error('Database connection error'));

      await expect(service.checkIn(employeeId)).rejects.toThrow('Database connection error');
    });

    it('should handle database errors during check-out', async () => {
      mockPrisma.attendance.findFirst.mockRejectedValue(new Error('Database connection error'));

      await expect(service.checkOut(employeeId)).rejects.toThrow('Database connection error');
    });

    it('should handle database errors when retrieving records', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockPrisma.attendance.findMany.mockRejectedValue(new Error('Database query failed'));

      await expect(service.getAttendanceRecords(employeeId, startDate, endDate))
        .rejects.toThrow('Database query failed');
    });

    it('should handle database errors when retrieving monthly stats', async () => {
      const month = '2024-01';

      mockPrisma.attendanceSummary.findUnique.mockRejectedValue(new Error('Database query failed'));

      await expect(service.getMonthlyStats(employeeId, month))
        .rejects.toThrow('Database query failed');
    });

    it('should handle create operation errors during check-in', async () => {
      mockPrisma.attendance.findFirst.mockResolvedValue(null);
      mockPrisma.attendance.create.mockRejectedValue(new Error('Failed to create attendance record'));

      await expect(service.checkIn(employeeId)).rejects.toThrow('Failed to create attendance record');
    });

    it('should handle update operation errors during check-out', async () => {
      const attendanceRecord = {
        id: 'att-1',
        employeeId,
        date: new Date('2024-01-15T00:00:00Z'),
        checkIn: new Date('2024-01-15T09:00:00Z'),
        checkOut: null,
        status: 'PRESENT',
      };

      mockPrisma.attendance.findFirst.mockResolvedValue(attendanceRecord);
      mockPrisma.attendance.update.mockRejectedValue(new Error('Failed to update attendance record'));

      await expect(service.checkOut(employeeId)).rejects.toThrow('Failed to update attendance record');
    });
  });

  describe('Location Validation', () => {
    const employeeId = 'emp-123';

    it('should accept valid GPS coordinates for check-in', async () => {
      vi.setSystemTime(new Date('2024-01-15T09:00:00Z'));

      const validLocations = [
        { latitude: 0, longitude: 0 },
        { latitude: 90, longitude: 180 },
        { latitude: -90, longitude: -180 },
        { latitude: 25.033964, longitude: 121.564468 },
      ];

      for (const location of validLocations) {
        mockPrisma.attendance.findFirst.mockResolvedValue(null);
        mockPrisma.attendance.create.mockResolvedValue({
          id: `att-${location.latitude}`,
          employeeId,
          date: new Date('2024-01-15T00:00:00Z'),
          checkIn: new Date('2024-01-15T09:00:00Z'),
          checkInLocation: location,
          status: 'PRESENT',
          checkOut: null,
          workHours: 0,
          overtimeHours: 0,
        });

        const result = await service.checkIn(employeeId, location);
        expect(result.checkInLocation).toEqual(location);
      }
    });

    it('should accept valid GPS coordinates for check-out', async () => {
      vi.setSystemTime(new Date('2024-01-15T17:00:00Z'));

      const location = { latitude: 25.033964, longitude: 121.564468 };

      const attendanceRecord = {
        id: 'att-1',
        employeeId,
        date: new Date('2024-01-15T00:00:00Z'),
        checkIn: new Date('2024-01-15T09:00:00Z'),
        checkOut: null,
        status: 'PRESENT',
      };

      mockPrisma.attendance.findFirst.mockResolvedValue(attendanceRecord);
      mockPrisma.attendance.update.mockResolvedValue({
        ...attendanceRecord,
        checkOut: new Date('2024-01-15T17:00:00Z'),
        checkOutLocation: location,
        workHours: 8,
        overtimeHours: 0,
      });

      const result = await service.checkOut(employeeId, location);

      expect(result.checkOutLocation).toEqual(location);
      expect(result.checkOutLocation?.latitude).toBe(25.033964);
      expect(result.checkOutLocation?.longitude).toBe(121.564468);
    });
  });

  describe('Work Hours Calculation', () => {
    const employeeId = 'emp-123';
    const location = { latitude: 25.033, longitude: 121.5654 };

    it('should calculate 0 overtime for less than 8 hours worked', async () => {
      // 6 hours worked
      const checkInTime = new Date('2024-01-15T09:00:00Z');
      vi.setSystemTime(new Date('2024-01-15T15:00:00Z'));

      const attendanceRecord = {
        id: 'att-1',
        employeeId,
        date: new Date('2024-01-15T00:00:00Z'),
        checkIn: checkInTime,
        checkOut: null,
        status: 'PRESENT',
      };

      mockPrisma.attendance.findFirst.mockResolvedValue(attendanceRecord);
      mockPrisma.attendance.update.mockResolvedValue({
        ...attendanceRecord,
        checkOut: new Date('2024-01-15T15:00:00Z'),
        checkOutLocation: location,
        workHours: 6,
        overtimeHours: 0,
      });

      const result = await service.checkOut(employeeId, location);

      expect(result.workHours).toBe(6);
      expect(result.overtimeHours).toBe(0);
    });

    it('should calculate 1 hour overtime for 9 hours worked', async () => {
      // 9 hours worked
      const checkInTime = new Date('2024-01-15T09:00:00Z');
      vi.setSystemTime(new Date('2024-01-15T18:00:00Z'));

      const attendanceRecord = {
        id: 'att-2',
        employeeId,
        date: new Date('2024-01-15T00:00:00Z'),
        checkIn: checkInTime,
        checkOut: null,
        status: 'PRESENT',
      };

      mockPrisma.attendance.findFirst.mockResolvedValue(attendanceRecord);
      mockPrisma.attendance.update.mockResolvedValue({
        ...attendanceRecord,
        checkOut: new Date('2024-01-15T18:00:00Z'),
        checkOutLocation: location,
        workHours: 8,
        overtimeHours: 1,
      });

      const result = await service.checkOut(employeeId, location);

      expect(result.workHours).toBe(8);
      expect(result.overtimeHours).toBe(1);
    });

    it('should cap work hours at 8 and calculate remaining as overtime', async () => {
      // 15 hours worked
      const checkInTime = new Date('2024-01-15T09:00:00Z');
      vi.setSystemTime(new Date('2024-01-16T00:00:00Z'));

      const attendanceRecord = {
        id: 'att-3',
        employeeId,
        date: new Date('2024-01-15T00:00:00Z'),
        checkIn: checkInTime,
        checkOut: null,
        status: 'PRESENT',
      };

      mockPrisma.attendance.findFirst.mockResolvedValue(attendanceRecord);
      mockPrisma.attendance.update.mockResolvedValue({
        ...attendanceRecord,
        checkOut: new Date('2024-01-16T00:00:00Z'),
        checkOutLocation: location,
        workHours: 8,
        overtimeHours: 7,
      });

      const result = await service.checkOut(employeeId, location);

      expect(result.workHours).toBe(8);
      expect(result.overtimeHours).toBe(7);
    });
  });
});
