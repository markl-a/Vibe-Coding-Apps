/**
 * Check-In/Out Workflow for Attendance Tracker
 *
 * This example demonstrates attendance tracking operations including:
 * - Employee check-in with timestamp
 * - Employee check-out with work hours calculation
 * - Handling late arrivals and early departures
 * - Overtime calculation
 * - Error handling for duplicate check-ins
 */

import { PrismaClient } from '@prisma/client';
import { startOfDay, differenceInHours, differenceInMinutes, setHours, setMinutes } from 'date-fns';

const prisma = new PrismaClient();

// Configuration constants
const WORK_START_HOUR = 9;
const WORK_START_MINUTE = 0;
const WORK_END_HOUR = 18;
const WORK_END_MINUTE = 0;
const LATE_THRESHOLD_MINUTES = 15;
const STANDARD_WORK_HOURS = 8;

interface Location {
  latitude: number;
  longitude: number;
}

/**
 * Employee check-in for the day
 *
 * @param employeeId - Employee ID
 * @param location - Optional GPS location
 * @returns Created or updated attendance record
 */
export async function checkIn(
  employeeId: string,
  location?: Location
) {
  try {
    const today = startOfDay(new Date());
    const now = new Date();

    // Check if employee already checked in today
    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    if (existing?.checkIn) {
      throw new Error(
        `Already checked in today at ${existing.checkIn.toLocaleTimeString()}`
      );
    }

    // Determine if employee is late
    const workStartTime = setMinutes(
      setHours(today, WORK_START_HOUR),
      WORK_START_MINUTE
    );
    const lateThreshold = new Date(
      workStartTime.getTime() + LATE_THRESHOLD_MINUTES * 60 * 1000
    );
    const isLate = now > lateThreshold;

    // Calculate minutes late
    const minutesLate = isLate
      ? Math.max(0, differenceInMinutes(now, workStartTime))
      : 0;

    let attendance;

    if (existing) {
      // Update existing record
      attendance = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkIn: now,
          checkInLocation: location as any,
          status: isLate ? 'LATE' : 'PRESENT'
        }
      });
    } else {
      // Create new attendance record
      attendance = await prisma.attendance.create({
        data: {
          employeeId,
          date: today,
          checkIn: now,
          checkInLocation: location as any,
          status: isLate ? 'LATE' : 'PRESENT'
        }
      });
    }

    console.log('Check-in successful:', {
      employeeId,
      checkInTime: now.toLocaleTimeString(),
      status: attendance.status,
      minutesLate: isLate ? minutesLate : 0
    });

    return {
      ...attendance,
      isLate,
      minutesLate,
      message: isLate
        ? `Checked in ${minutesLate} minutes late`
        : 'Checked in on time'
    };
  } catch (error) {
    console.error('Check-in error:', error);
    throw error;
  }
}

/**
 * Employee check-out for the day
 *
 * @param employeeId - Employee ID
 * @param location - Optional GPS location
 * @returns Updated attendance record with calculated hours
 */
export async function checkOut(
  employeeId: string,
  location?: Location
) {
  try {
    const today = startOfDay(new Date());
    const now = new Date();

    // Find today's attendance record
    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    if (!attendance) {
      throw new Error('No attendance record found. Please check in first.');
    }

    if (!attendance.checkIn) {
      throw new Error('Please check in before checking out.');
    }

    if (attendance.checkOut) {
      throw new Error(
        `Already checked out today at ${attendance.checkOut.toLocaleTimeString()}`
      );
    }

    // Calculate work hours
    const totalHours = differenceInHours(now, attendance.checkIn);
    const totalMinutes = differenceInMinutes(now, attendance.checkIn);
    const workHours = Math.min(totalHours, STANDARD_WORK_HOURS);
    const overtimeHours = Math.max(totalHours - STANDARD_WORK_HOURS, 0);

    // Determine if leaving early
    const workEndTime = setMinutes(
      setHours(today, WORK_END_HOUR),
      WORK_END_MINUTE
    );
    const isEarly = now < workEndTime;
    const minutesEarly = isEarly
      ? differenceInMinutes(workEndTime, now)
      : 0;

    // Update attendance record
    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: now,
        checkOutLocation: location as any,
        workHours,
        overtimeHours
      }
    });

    console.log('Check-out successful:', {
      employeeId,
      checkOutTime: now.toLocaleTimeString(),
      totalMinutes,
      workHours,
      overtimeHours,
      isEarly
    });

    return {
      ...updated,
      totalMinutes,
      isEarly,
      minutesEarly,
      message: overtimeHours > 0
        ? `Worked ${overtimeHours} hours overtime`
        : isEarly
        ? `Left ${minutesEarly} minutes early`
        : 'Completed standard work hours'
    };
  } catch (error) {
    console.error('Check-out error:', error);
    throw error;
  }
}

/**
 * Get current day's attendance status for an employee
 *
 * @param employeeId - Employee ID
 * @returns Current attendance status
 */
export async function getTodayAttendance(employeeId: string) {
  try {
    const today = startOfDay(new Date());

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    if (!attendance) {
      return {
        hasCheckedIn: false,
        hasCheckedOut: false,
        status: 'NOT_CHECKED_IN',
        message: 'Not checked in yet'
      };
    }

    const now = new Date();
    const hasCheckedIn = !!attendance.checkIn;
    const hasCheckedOut = !!attendance.checkOut;

    let currentWorkMinutes = 0;
    if (hasCheckedIn && !hasCheckedOut) {
      currentWorkMinutes = differenceInMinutes(now, attendance.checkIn);
    } else if (hasCheckedIn && hasCheckedOut) {
      currentWorkMinutes = differenceInMinutes(attendance.checkOut, attendance.checkIn);
    }

    return {
      attendance,
      hasCheckedIn,
      hasCheckedOut,
      status: hasCheckedOut ? 'CHECKED_OUT' : hasCheckedIn ? 'WORKING' : 'NOT_CHECKED_IN',
      currentWorkMinutes,
      currentWorkHours: Math.floor(currentWorkMinutes / 60),
      message: hasCheckedOut
        ? 'Shift completed'
        : hasCheckedIn
        ? `Currently working for ${Math.floor(currentWorkMinutes / 60)}h ${currentWorkMinutes % 60}m`
        : 'Not checked in yet'
    };
  } catch (error) {
    console.error('Error getting today attendance:', error);
    throw error;
  }
}

/**
 * Manual attendance correction (for administrators)
 *
 * @param attendanceId - Attendance record ID
 * @param corrections - Fields to correct
 * @returns Updated attendance record
 */
export async function correctAttendance(
  attendanceId: string,
  corrections: {
    checkIn?: Date;
    checkOut?: Date;
    status?: 'PRESENT' | 'LATE' | 'ABSENT' | 'HALF_DAY';
    notes?: string;
  }
) {
  try {
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId }
    });

    if (!attendance) {
      throw new Error('Attendance record not found');
    }

    // Recalculate work hours if times are corrected
    let workHours = attendance.workHours;
    let overtimeHours = attendance.overtimeHours;

    if (corrections.checkIn || corrections.checkOut) {
      const checkInTime = corrections.checkIn || attendance.checkIn;
      const checkOutTime = corrections.checkOut || attendance.checkOut;

      if (checkInTime && checkOutTime) {
        const totalHours = differenceInHours(checkOutTime, checkInTime);
        workHours = Math.min(totalHours, STANDARD_WORK_HOURS);
        overtimeHours = Math.max(totalHours - STANDARD_WORK_HOURS, 0);
      }
    }

    const updated = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        ...(corrections.checkIn && { checkIn: corrections.checkIn }),
        ...(corrections.checkOut && { checkOut: corrections.checkOut }),
        ...(corrections.status && { status: corrections.status }),
        ...(corrections.notes && { notes: corrections.notes }),
        workHours,
        overtimeHours
      }
    });

    console.log('Attendance corrected:', {
      id: attendanceId,
      corrections: Object.keys(corrections)
    });

    return updated;
  } catch (error) {
    console.error('Error correcting attendance:', error);
    throw error;
  }
}

/**
 * Mark employee as absent for a specific date
 *
 * @param employeeId - Employee ID
 * @param date - Date to mark as absent
 * @param reason - Reason for absence
 * @returns Created absence record
 */
export async function markAbsent(
  employeeId: string,
  date: Date,
  reason?: string
) {
  try {
    const dayStart = startOfDay(date);

    // Check if attendance record already exists
    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: dayStart,
          lt: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    if (existing) {
      // Update existing record
      const updated = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          status: 'ABSENT',
          notes: reason,
          workHours: 0,
          overtimeHours: 0
        }
      });

      console.log('Marked as absent:', { employeeId, date: dayStart });
      return updated;
    } else {
      // Create new absence record
      const absence = await prisma.attendance.create({
        data: {
          employeeId,
          date: dayStart,
          status: 'ABSENT',
          notes: reason,
          workHours: 0,
          overtimeHours: 0
        }
      });

      console.log('Created absence record:', { employeeId, date: dayStart });
      return absence;
    }
  } catch (error) {
    console.error('Error marking absent:', error);
    throw error;
  }
}

/**
 * Example usage demonstrating check-in/out workflow
 */
export async function runCheckInOutExample() {
  try {
    console.log('=== Attendance Check-In/Out Workflow Example ===\n');

    const employeeId = 'emp-123'; // Replace with actual employee ID

    // 1. Check today's attendance status
    console.log('1. Checking current attendance status...');
    const statusBefore = await getTodayAttendance(employeeId);
    console.log('Status:', statusBefore);

    // 2. Employee checks in
    console.log('\n2. Employee checking in...');
    const checkInResult = await checkIn(employeeId, {
      latitude: 37.7749,
      longitude: -122.4194
    });
    console.log('Check-in result:', checkInResult.message);

    // 3. Check status after check-in
    console.log('\n3. Checking status after check-in...');
    const statusDuring = await getTodayAttendance(employeeId);
    console.log('Current work time:', statusDuring.message);

    // 4. Simulate work time (in real scenario, wait for actual work hours)
    console.log('\n4. Simulating work day...');
    console.log('Employee is working...');

    // 5. Employee checks out
    console.log('\n5. Employee checking out...');
    const checkOutResult = await checkOut(employeeId, {
      latitude: 37.7749,
      longitude: -122.4194
    });
    console.log('Check-out result:', checkOutResult.message);
    console.log('Work hours:', checkOutResult.workHours);
    console.log('Overtime hours:', checkOutResult.overtimeHours);

    // 6. Final status
    console.log('\n6. Final attendance status...');
    const statusAfter = await getTodayAttendance(employeeId);
    console.log('Final status:', statusAfter.status);

    console.log('\n=== Example completed successfully ===');
  } catch (error) {
    console.error('Example failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Uncomment to run the example
// runCheckInOutExample();
