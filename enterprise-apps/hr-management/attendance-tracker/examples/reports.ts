/**
 * Generate Attendance Reports
 *
 * This example demonstrates various attendance reporting capabilities:
 * - Daily attendance reports
 * - Monthly summary reports
 * - Individual employee attendance history
 * - Department-wise attendance statistics
 * - Overtime and tardiness reports
 */

import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, format, differenceInDays } from 'date-fns';

const prisma = new PrismaClient();

/**
 * Generate daily attendance report for all employees
 *
 * @param date - Date for the report
 * @returns Daily attendance summary
 */
export async function generateDailyReport(date: Date) {
  try {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: {
          gte: dayStart,
          lte: dayEnd
        }
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            position: true,
            department: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        checkIn: 'asc'
      }
    });

    // Calculate statistics
    const stats = {
      total: attendanceRecords.length,
      present: attendanceRecords.filter(a => a.status === 'PRESENT').length,
      late: attendanceRecords.filter(a => a.status === 'LATE').length,
      absent: attendanceRecords.filter(a => a.status === 'ABSENT').length,
      halfDay: attendanceRecords.filter(a => a.status === 'HALF_DAY').length,
      totalWorkHours: attendanceRecords.reduce((sum, a) => sum + a.workHours, 0),
      totalOvertimeHours: attendanceRecords.reduce((sum, a) => sum + a.overtimeHours, 0)
    };

    console.log(`Daily Report for ${format(date, 'yyyy-MM-dd')}:`);
    console.log('Statistics:', stats);

    return {
      date: format(date, 'yyyy-MM-dd'),
      records: attendanceRecords,
      statistics: stats,
      attendanceRate: stats.total > 0
        ? ((stats.present + stats.late) / stats.total * 100).toFixed(2) + '%'
        : '0%'
    };
  } catch (error) {
    console.error('Error generating daily report:', error);
    throw error;
  }
}

/**
 * Generate monthly attendance summary for an employee
 *
 * @param employeeId - Employee ID
 * @param month - Month date (any date within the month)
 * @returns Monthly attendance summary
 */
export async function generateMonthlyEmployeeReport(
  employeeId: string,
  month: Date
) {
  try {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    const [employee, attendanceRecords, summary] = await Promise.all([
      prisma.employee.findUnique({
        where: { id: employeeId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeNumber: true,
          position: true,
          department: {
            select: {
              name: true
            }
          }
        }
      }),
      prisma.attendance.findMany({
        where: {
          employeeId,
          date: {
            gte: monthStart,
            lte: monthEnd
          }
        },
        orderBy: {
          date: 'asc'
        }
      }),
      prisma.attendanceSummary.findUnique({
        where: {
          employeeId_month: {
            employeeId,
            month: format(monthStart, 'yyyy-MM')
          }
        }
      })
    ]);

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Calculate statistics from records
    const stats = {
      totalDays: attendanceRecords.length,
      presentDays: attendanceRecords.filter(a => a.status === 'PRESENT').length,
      lateDays: attendanceRecords.filter(a => a.status === 'LATE').length,
      absentDays: attendanceRecords.filter(a => a.status === 'ABSENT').length,
      halfDays: attendanceRecords.filter(a => a.status === 'HALF_DAY').length,
      totalWorkHours: attendanceRecords.reduce((sum, a) => sum + a.workHours, 0),
      totalOvertimeHours: attendanceRecords.reduce((sum, a) => sum + a.overtimeHours, 0),
      avgWorkHours: 0
    };

    stats.avgWorkHours = stats.totalDays > 0
      ? stats.totalWorkHours / stats.totalDays
      : 0;

    // Calculate attendance rate
    const workingDays = stats.totalDays;
    const attendedDays = stats.presentDays + stats.lateDays + stats.halfDays * 0.5;
    const attendanceRate = workingDays > 0
      ? (attendedDays / workingDays * 100).toFixed(2)
      : '0';

    console.log(`Monthly Report for ${employee.firstName} ${employee.lastName}:`);
    console.log('Month:', format(monthStart, 'MMMM yyyy'));
    console.log('Statistics:', stats);

    return {
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        employeeNumber: employee.employeeNumber,
        position: employee.position,
        department: employee.department?.name
      },
      month: format(monthStart, 'yyyy-MM'),
      statistics: stats,
      attendanceRate: attendanceRate + '%',
      records: attendanceRecords,
      summary
    };
  } catch (error) {
    console.error('Error generating monthly employee report:', error);
    throw error;
  }
}

/**
 * Generate monthly attendance report for entire organization
 *
 * @param month - Month date
 * @returns Organization-wide monthly report
 */
export async function generateMonthlyOrganizationReport(month: Date) {
  try {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: {
          gte: monthStart,
          lte: monthEnd
        }
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Overall statistics
    const overallStats = {
      totalRecords: attendanceRecords.length,
      presentCount: attendanceRecords.filter(a => a.status === 'PRESENT').length,
      lateCount: attendanceRecords.filter(a => a.status === 'LATE').length,
      absentCount: attendanceRecords.filter(a => a.status === 'ABSENT').length,
      halfDayCount: attendanceRecords.filter(a => a.status === 'HALF_DAY').length,
      totalWorkHours: attendanceRecords.reduce((sum, a) => sum + a.workHours, 0),
      totalOvertimeHours: attendanceRecords.reduce((sum, a) => sum + a.overtimeHours, 0)
    };

    // Group by department
    const departmentStats = attendanceRecords.reduce((acc, record) => {
      const deptName = record.employee.department?.name || 'No Department';
      if (!acc[deptName]) {
        acc[deptName] = {
          totalRecords: 0,
          present: 0,
          late: 0,
          absent: 0,
          totalWorkHours: 0,
          totalOvertimeHours: 0
        };
      }

      acc[deptName].totalRecords++;
      if (record.status === 'PRESENT') acc[deptName].present++;
      if (record.status === 'LATE') acc[deptName].late++;
      if (record.status === 'ABSENT') acc[deptName].absent++;
      acc[deptName].totalWorkHours += record.workHours;
      acc[deptName].totalOvertimeHours += record.overtimeHours;

      return acc;
    }, {} as Record<string, any>);

    // Group by employee for unique employee count
    const uniqueEmployees = new Set(attendanceRecords.map(r => r.employeeId));

    console.log(`Organization Monthly Report for ${format(monthStart, 'MMMM yyyy')}:`);
    console.log('Total unique employees:', uniqueEmployees.size);
    console.log('Overall statistics:', overallStats);

    return {
      month: format(monthStart, 'yyyy-MM'),
      uniqueEmployeeCount: uniqueEmployees.size,
      overallStatistics: overallStats,
      departmentStatistics: departmentStats,
      attendanceRate: overallStats.totalRecords > 0
        ? ((overallStats.presentCount + overallStats.lateCount) / overallStats.totalRecords * 100).toFixed(2) + '%'
        : '0%'
    };
  } catch (error) {
    console.error('Error generating monthly organization report:', error);
    throw error;
  }
}

/**
 * Generate overtime report for a period
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @param departmentId - Optional department filter
 * @returns Overtime report
 */
export async function generateOvertimeReport(
  startDate: Date,
  endDate: Date,
  departmentId?: string
) {
  try {
    const where: any = {
      date: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate)
      },
      overtimeHours: {
        gt: 0
      }
    };

    if (departmentId) {
      where.employee = {
        departmentId
      };
    }

    const overtimeRecords = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            position: true,
            department: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        overtimeHours: 'desc'
      }
    });

    // Group by employee
    const employeeOvertimeMap = overtimeRecords.reduce((acc, record) => {
      const empId = record.employeeId;
      if (!acc[empId]) {
        acc[empId] = {
          employee: record.employee,
          totalOvertimeHours: 0,
          overtimeDays: 0,
          records: []
        };
      }

      acc[empId].totalOvertimeHours += record.overtimeHours;
      acc[empId].overtimeDays++;
      acc[empId].records.push(record);

      return acc;
    }, {} as Record<string, any>);

    const employeeOvertime = Object.values(employeeOvertimeMap)
      .sort((a: any, b: any) => b.totalOvertimeHours - a.totalOvertimeHours);

    const totalOvertimeHours = overtimeRecords.reduce(
      (sum, r) => sum + r.overtimeHours,
      0
    );

    console.log('Overtime Report:');
    console.log(`Period: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);
    console.log('Total overtime hours:', totalOvertimeHours);
    console.log('Employees with overtime:', employeeOvertime.length);

    return {
      period: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd')
      },
      totalOvertimeHours,
      employeeCount: employeeOvertime.length,
      employeeOvertime,
      records: overtimeRecords
    };
  } catch (error) {
    console.error('Error generating overtime report:', error);
    throw error;
  }
}

/**
 * Generate tardiness (late arrivals) report
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Tardiness report
 */
export async function generateTardinessReport(
  startDate: Date,
  endDate: Date
) {
  try {
    const lateRecords = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate)
        },
        status: 'LATE'
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            position: true,
            department: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Group by employee
    const employeeLateMap = lateRecords.reduce((acc, record) => {
      const empId = record.employeeId;
      if (!acc[empId]) {
        acc[empId] = {
          employee: record.employee,
          lateDays: 0,
          records: []
        };
      }

      acc[empId].lateDays++;
      acc[empId].records.push(record);

      return acc;
    }, {} as Record<string, any>);

    const employeeTardiness = Object.values(employeeLateMap)
      .sort((a: any, b: any) => b.lateDays - a.lateDays);

    console.log('Tardiness Report:');
    console.log(`Period: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);
    console.log('Total late instances:', lateRecords.length);
    console.log('Employees with tardiness:', employeeTardiness.length);

    return {
      period: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd')
      },
      totalLateInstances: lateRecords.length,
      employeeCount: employeeTardiness.length,
      employeeTardiness,
      records: lateRecords
    };
  } catch (error) {
    console.error('Error generating tardiness report:', error);
    throw error;
  }
}

/**
 * Generate absence report
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Absence report
 */
export async function generateAbsenceReport(
  startDate: Date,
  endDate: Date
) {
  try {
    const absenceRecords = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate)
        },
        status: 'ABSENT'
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            position: true,
            department: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Group by employee
    const employeeAbsenceMap = absenceRecords.reduce((acc, record) => {
      const empId = record.employeeId;
      if (!acc[empId]) {
        acc[empId] = {
          employee: record.employee,
          absentDays: 0,
          records: []
        };
      }

      acc[empId].absentDays++;
      acc[empId].records.push(record);

      return acc;
    }, {} as Record<string, any>);

    const employeeAbsences = Object.values(employeeAbsenceMap)
      .sort((a: any, b: any) => b.absentDays - a.absentDays);

    console.log('Absence Report:');
    console.log(`Period: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);
    console.log('Total absences:', absenceRecords.length);
    console.log('Employees with absences:', employeeAbsences.length);

    return {
      period: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd')
      },
      totalAbsences: absenceRecords.length,
      employeeCount: employeeAbsences.length,
      employeeAbsences,
      records: absenceRecords
    };
  } catch (error) {
    console.error('Error generating absence report:', error);
    throw error;
  }
}

/**
 * Generate attendance history for an employee
 *
 * @param employeeId - Employee ID
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Employee attendance history
 */
export async function getEmployeeAttendanceHistory(
  employeeId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const [employee, records] = await Promise.all([
      prisma.employee.findUnique({
        where: { id: employeeId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeNumber: true,
          position: true,
          department: {
            select: {
              name: true
            }
          }
        }
      }),
      prisma.attendance.findMany({
        where: {
          employeeId,
          date: {
            gte: startOfDay(startDate),
            lte: endOfDay(endDate)
          }
        },
        orderBy: {
          date: 'desc'
        }
      })
    ]);

    if (!employee) {
      throw new Error('Employee not found');
    }

    const totalDays = differenceInDays(endDate, startDate) + 1;
    const stats = {
      totalRecords: records.length,
      presentDays: records.filter(r => r.status === 'PRESENT').length,
      lateDays: records.filter(r => r.status === 'LATE').length,
      absentDays: records.filter(r => r.status === 'ABSENT').length,
      totalWorkHours: records.reduce((sum, r) => sum + r.workHours, 0),
      totalOvertimeHours: records.reduce((sum, r) => sum + r.overtimeHours, 0)
    };

    console.log(`Attendance history for ${employee.firstName} ${employee.lastName}:`);
    console.log('Period:', format(startDate, 'yyyy-MM-dd'), 'to', format(endDate, 'yyyy-MM-dd'));
    console.log('Statistics:', stats);

    return {
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        employeeNumber: employee.employeeNumber,
        position: employee.position,
        department: employee.department?.name
      },
      period: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd'),
        totalDays
      },
      statistics: stats,
      records
    };
  } catch (error) {
    console.error('Error getting employee attendance history:', error);
    throw error;
  }
}

/**
 * Example usage demonstrating various reports
 */
export async function runReportsExample() {
  try {
    console.log('=== Attendance Reports Example ===\n');

    const today = new Date();
    const thisMonth = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // 1. Daily report
    console.log('1. Generating daily report...');
    await generateDailyReport(today);

    // 2. Monthly employee report
    console.log('\n2. Generating monthly employee report...');
    const employeeId = 'emp-123'; // Replace with actual employee ID
    await generateMonthlyEmployeeReport(employeeId, thisMonth);

    // 3. Monthly organization report
    console.log('\n3. Generating monthly organization report...');
    await generateMonthlyOrganizationReport(thisMonth);

    // 4. Overtime report
    console.log('\n4. Generating overtime report...');
    const monthStart = startOfMonth(thisMonth);
    const monthEnd = endOfMonth(thisMonth);
    await generateOvertimeReport(monthStart, monthEnd);

    // 5. Tardiness report
    console.log('\n5. Generating tardiness report...');
    await generateTardinessReport(monthStart, monthEnd);

    // 6. Absence report
    console.log('\n6. Generating absence report...');
    await generateAbsenceReport(monthStart, monthEnd);

    console.log('\n=== Example completed successfully ===');
  } catch (error) {
    console.error('Example failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Uncomment to run the example
// runReportsExample();
