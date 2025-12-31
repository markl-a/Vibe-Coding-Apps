/**
 * Advanced Search and Filter Operations for Employee Directory
 *
 * This example demonstrates advanced querying capabilities including:
 * - Full-text search across multiple fields
 * - Filtering by department, status, and employee type
 * - Complex filtering with multiple conditions
 * - Sorting and ordering results
 * - Aggregations and statistics
 */

import { PrismaClient, Prisma, EmploymentStatus, EmployeeType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Search employees with full-text search across multiple fields
 *
 * @param searchTerm - Search term to match against name, email, or employee number
 * @param options - Additional search options
 * @returns Matching employees
 */
export async function searchEmployees(
  searchTerm: string,
  options: {
    page?: number;
    limit?: number;
    caseInsensitive?: boolean;
  } = {}
) {
  try {
    const { page = 1, limit = 20, caseInsensitive = true } = options;
    const skip = (page - 1) * limit;

    // Build search conditions for multiple fields
    const searchConditions: Prisma.EmployeeWhereInput = {
      OR: [
        {
          firstName: {
            contains: searchTerm,
            mode: caseInsensitive ? 'insensitive' : 'default'
          }
        },
        {
          lastName: {
            contains: searchTerm,
            mode: caseInsensitive ? 'insensitive' : 'default'
          }
        },
        {
          email: {
            contains: searchTerm,
            mode: caseInsensitive ? 'insensitive' : 'default'
          }
        },
        {
          employeeNumber: {
            contains: searchTerm,
            mode: caseInsensitive ? 'insensitive' : 'default'
          }
        },
        {
          position: {
            contains: searchTerm,
            mode: caseInsensitive ? 'insensitive' : 'default'
          }
        }
      ]
    };

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where: searchConditions,
        skip,
        take: limit,
        include: {
          department: true,
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              position: true
            }
          }
        },
        orderBy: { lastName: 'asc' }
      }),
      prisma.employee.count({ where: searchConditions })
    ]);

    console.log(`Found ${total} employees matching "${searchTerm}"`);

    return {
      data: employees,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Error searching employees:', error);
    throw error;
  }
}

/**
 * Filter employees by multiple criteria
 *
 * @param filters - Filter criteria
 * @returns Filtered employees
 */
export async function filterEmployees(filters: {
  departmentId?: string;
  status?: EmploymentStatus;
  employeeType?: EmployeeType;
  hiredAfter?: Date;
  hiredBefore?: Date;
  managerId?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const { page = 1, limit = 20, ...filterCriteria } = filters;
    const skip = (page - 1) * limit;

    // Build where clause dynamically based on provided filters
    const where: Prisma.EmployeeWhereInput = {};

    if (filterCriteria.departmentId) {
      where.departmentId = filterCriteria.departmentId;
    }

    if (filterCriteria.status) {
      where.employmentStatus = filterCriteria.status;
    }

    if (filterCriteria.employeeType) {
      where.employeeType = filterCriteria.employeeType;
    }

    if (filterCriteria.managerId) {
      where.managerId = filterCriteria.managerId;
    }

    // Date range filtering
    if (filterCriteria.hiredAfter || filterCriteria.hiredBefore) {
      where.hireDate = {};
      if (filterCriteria.hiredAfter) {
        where.hireDate.gte = filterCriteria.hiredAfter;
      }
      if (filterCriteria.hiredBefore) {
        where.hireDate.lte = filterCriteria.hiredBefore;
      }
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: true,
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { hireDate: 'desc' }
      }),
      prisma.employee.count({ where })
    ]);

    console.log(`Found ${total} employees matching filters:`, filterCriteria);

    return {
      data: employees,
      total,
      filters: filterCriteria,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error filtering employees:', error);
    throw error;
  }
}

/**
 * Find employees by department with hierarchical search
 *
 * @param departmentId - Department ID
 * @param includeSubdepartments - Whether to include employees from subdepartments
 * @returns Employees in the department
 */
export async function findEmployeesByDepartment(
  departmentId: string,
  includeSubdepartments: boolean = false
) {
  try {
    let departmentIds = [departmentId];

    // If including subdepartments, fetch all child departments
    if (includeSubdepartments) {
      const subdepartments = await prisma.department.findMany({
        where: { parentId: departmentId },
        select: { id: true }
      });
      departmentIds = [...departmentIds, ...subdepartments.map(d => d.id)];
    }

    const employees = await prisma.employee.findMany({
      where: {
        departmentId: {
          in: departmentIds
        }
      },
      include: {
        department: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true
          }
        }
      },
      orderBy: [
        { departmentId: 'asc' },
        { lastName: 'asc' }
      ]
    });

    console.log(`Found ${employees.length} employees in department hierarchy`);

    // Group by department
    const groupedByDepartment = employees.reduce((acc, emp) => {
      const deptName = emp.department?.name || 'Unknown';
      if (!acc[deptName]) {
        acc[deptName] = [];
      }
      acc[deptName].push(emp);
      return acc;
    }, {} as Record<string, typeof employees>);

    return {
      employees,
      groupedByDepartment,
      totalCount: employees.length
    };
  } catch (error) {
    console.error('Error finding employees by department:', error);
    throw error;
  }
}

/**
 * Advanced search combining multiple criteria
 *
 * @param criteria - Complex search criteria
 * @returns Matching employees
 */
export async function advancedSearch(criteria: {
  searchTerm?: string;
  departmentIds?: string[];
  statuses?: EmploymentStatus[];
  employeeTypes?: EmployeeType[];
  hiredAfter?: Date;
  hiredBefore?: Date;
  hasManager?: boolean;
  hasSubordinates?: boolean;
  sortBy?: 'name' | 'hireDate' | 'position';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}) {
  try {
    const {
      searchTerm,
      departmentIds,
      statuses,
      employeeTypes,
      hiredAfter,
      hiredBefore,
      hasManager,
      hasSubordinates,
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      limit = 20
    } = criteria;

    const skip = (page - 1) * limit;
    const where: Prisma.EmployeeWhereInput = { AND: [] };

    // Text search
    if (searchTerm && where.AND) {
      where.AND.push({
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { position: { contains: searchTerm, mode: 'insensitive' } }
        ]
      });
    }

    // Department filter
    if (departmentIds && departmentIds.length > 0 && where.AND) {
      where.AND.push({ departmentId: { in: departmentIds } });
    }

    // Status filter
    if (statuses && statuses.length > 0 && where.AND) {
      where.AND.push({ employmentStatus: { in: statuses } });
    }

    // Employee type filter
    if (employeeTypes && employeeTypes.length > 0 && where.AND) {
      where.AND.push({ employeeType: { in: employeeTypes } });
    }

    // Date range filter
    if ((hiredAfter || hiredBefore) && where.AND) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (hiredAfter) dateFilter.gte = hiredAfter;
      if (hiredBefore) dateFilter.lte = hiredBefore;
      where.AND.push({ hireDate: dateFilter });
    }

    // Manager filter
    if (hasManager !== undefined && where.AND) {
      where.AND.push({
        managerId: hasManager ? { not: null } : null
      });
    }

    // Subordinates filter
    if (hasSubordinates !== undefined && where.AND) {
      where.AND.push({
        subordinates: hasSubordinates ? { some: {} } : { none: {} }
      });
    }

    // Determine sort field
    let orderBy: Prisma.EmployeeOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'name':
        orderBy = { lastName: sortOrder };
        break;
      case 'hireDate':
        orderBy = { hireDate: sortOrder };
        break;
      case 'position':
        orderBy = { position: sortOrder };
        break;
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: true,
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              position: true
            }
          },
          _count: {
            select: {
              subordinates: true
            }
          }
        },
        orderBy
      }),
      prisma.employee.count({ where })
    ]);

    console.log(`Advanced search returned ${total} results`);

    return {
      data: employees,
      total,
      criteria,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error in advanced search:', error);
    throw error;
  }
}

/**
 * Get employee statistics and aggregations
 *
 * @returns Various employee statistics
 */
export async function getEmployeeStatistics() {
  try {
    const [
      total,
      byStatus,
      byDepartment,
      byType,
      avgTenure
    ] = await Promise.all([
      // Total count
      prisma.employee.count(),

      // Count by employment status
      prisma.employee.groupBy({
        by: ['employmentStatus'],
        _count: true
      }),

      // Count by department
      prisma.employee.groupBy({
        by: ['departmentId'],
        _count: true
      }),

      // Count by employee type
      prisma.employee.groupBy({
        by: ['employeeType'],
        _count: true
      }),

      // Calculate average tenure (in months)
      prisma.employee.findMany({
        select: { hireDate: true }
      })
    ]);

    // Calculate average tenure
    const now = new Date();
    const tenures = avgTenure.map(emp => {
      const months = (now.getTime() - emp.hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      return months;
    });
    const averageTenureMonths = tenures.length > 0
      ? tenures.reduce((a, b) => a + b, 0) / tenures.length
      : 0;

    const statistics = {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.employmentStatus] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byDepartment: byDepartment.map(item => ({
        departmentId: item.departmentId,
        count: item._count
      })),
      byType: byType.reduce((acc, item) => {
        acc[item.employeeType] = item._count;
        return acc;
      }, {} as Record<string, number>),
      averageTenureMonths: Math.round(averageTenureMonths * 10) / 10
    };

    console.log('Employee statistics:', statistics);

    return statistics;
  } catch (error) {
    console.error('Error getting employee statistics:', error);
    throw error;
  }
}

/**
 * Find employees hired within a specific period
 *
 * @param period - Time period ('month', 'quarter', 'year')
 * @param year - Year
 * @param period - Period number (month 1-12, quarter 1-4)
 * @returns Employees hired in the period
 */
export async function findNewHires(
  periodType: 'month' | 'quarter' | 'year',
  year: number,
  periodNum?: number
) {
  try {
    let startDate: Date;
    let endDate: Date;

    if (periodType === 'year') {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59);
    } else if (periodType === 'quarter' && periodNum) {
      const quarterStartMonth = (periodNum - 1) * 3;
      startDate = new Date(year, quarterStartMonth, 1);
      endDate = new Date(year, quarterStartMonth + 3, 0, 23, 59, 59);
    } else if (periodType === 'month' && periodNum) {
      startDate = new Date(year, periodNum - 1, 1);
      endDate = new Date(year, periodNum, 0, 23, 59, 59);
    } else {
      throw new Error('Invalid period specification');
    }

    const newHires = await prisma.employee.findMany({
      where: {
        hireDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        department: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { hireDate: 'asc' }
    });

    console.log(
      `Found ${newHires.length} new hires in ${periodType} ` +
      `${periodNum || ''} of ${year}`
    );

    return {
      newHires,
      count: newHires.length,
      period: { type: periodType, year, period: periodNum },
      dateRange: { start: startDate, end: endDate }
    };
  } catch (error) {
    console.error('Error finding new hires:', error);
    throw error;
  }
}

/**
 * Example usage demonstrating advanced search capabilities
 */
export async function runAdvancedSearchExample() {
  try {
    console.log('=== Employee Directory Advanced Search Example ===\n');

    // 1. Simple text search
    console.log('1. Searching employees by name...');
    await searchEmployees('john', { page: 1, limit: 10 });

    // 2. Filter by department and status
    console.log('\n2. Filtering active full-time employees...');
    await filterEmployees({
      status: 'ACTIVE',
      employeeType: 'FULL_TIME',
      page: 1,
      limit: 10
    });

    // 3. Find employees hired in the last year
    console.log('\n3. Finding employees hired in the last year...');
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    await filterEmployees({
      hiredAfter: oneYearAgo
    });

    // 4. Advanced search with multiple criteria
    console.log('\n4. Running advanced search...');
    await advancedSearch({
      searchTerm: 'engineer',
      statuses: ['ACTIVE'],
      employeeTypes: ['FULL_TIME', 'CONTRACT'],
      hasManager: true,
      sortBy: 'hireDate',
      sortOrder: 'desc',
      page: 1,
      limit: 10
    });

    // 5. Get statistics
    console.log('\n5. Getting employee statistics...');
    await getEmployeeStatistics();

    // 6. Find new hires for current quarter
    console.log('\n6. Finding new hires for current quarter...');
    const currentYear = new Date().getFullYear();
    const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
    await findNewHires('quarter', currentYear, currentQuarter);

    console.log('\n=== Example completed successfully ===');
  } catch (error) {
    console.error('Example failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Uncomment to run the example
// runAdvancedSearchExample();
