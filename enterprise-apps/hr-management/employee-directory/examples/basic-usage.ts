/**
 * Basic CRUD Operations for Employee Directory
 *
 * This example demonstrates fundamental employee management operations including:
 * - Creating new employees
 * - Reading employee details
 * - Updating employee information
 * - Deleting employees
 * - Listing employees with pagination
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create a new employee with basic information
 *
 * @param data - Employee creation data
 * @returns Created employee object
 */
export async function createEmployee(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  departmentId: string;
  hireDate: Date;
  employeeType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  managerId?: string;
}) {
  try {
    // Prepare employee data for creation
    const employeeData: Prisma.EmployeeCreateInput = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      position: data.position,
      hireDate: data.hireDate,
      employeeType: data.employeeType,
      employmentStatus: 'ACTIVE', // New employees start as active
      department: {
        connect: { id: data.departmentId }
      },
      // Connect to manager if provided
      ...(data.managerId && {
        manager: {
          connect: { id: data.managerId }
        }
      })
    };

    // Create employee in database
    const employee = await prisma.employee.create({
      data: employeeData,
      include: {
        department: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            email: true
          }
        }
      }
    });

    console.log('Employee created successfully:', {
      id: employee.id,
      name: `${employee.firstName} ${employee.lastName}`,
      employeeNumber: employee.employeeNumber,
      position: employee.position
    });

    return employee;
  } catch (error) {
    console.error('Error creating employee:', error);

    // Handle specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('Employee with this email already exists');
      }
      if (error.code === 'P2025') {
        throw new Error('Department or manager not found');
      }
    }

    throw error;
  }
}

/**
 * Retrieve an employee by ID with full details
 *
 * @param id - Employee ID
 * @returns Employee object or null if not found
 */
export async function getEmployeeById(id: string) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            email: true
          }
        },
        subordinates: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            email: true,
            employeeNumber: true
          }
        }
      }
    });

    if (!employee) {
      console.log(`Employee with ID ${id} not found`);
      return null;
    }

    console.log('Employee retrieved:', {
      name: `${employee.firstName} ${employee.lastName}`,
      position: employee.position,
      department: employee.department?.name,
      subordinatesCount: employee.subordinates.length
    });

    return employee;
  } catch (error) {
    console.error('Error retrieving employee:', error);
    throw error;
  }
}

/**
 * Update employee information
 *
 * @param id - Employee ID
 * @param data - Fields to update
 * @returns Updated employee object
 */
export async function updateEmployee(
  id: string,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    position?: string;
    departmentId?: string;
    managerId?: string;
    employmentStatus?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  }
) {
  try {
    // Prepare update data
    const updateData: Prisma.EmployeeUpdateInput = {
      ...(data.firstName && { firstName: data.firstName }),
      ...(data.lastName && { lastName: data.lastName }),
      ...(data.email && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.position && { position: data.position }),
      ...(data.employmentStatus && { employmentStatus: data.employmentStatus }),
      ...(data.departmentId && {
        department: {
          connect: { id: data.departmentId }
        }
      }),
      ...(data.managerId && {
        manager: {
          connect: { id: data.managerId }
        }
      })
    };

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    console.log('Employee updated successfully:', {
      id: employee.id,
      name: `${employee.firstName} ${employee.lastName}`,
      changes: Object.keys(data)
    });

    return employee;
  } catch (error) {
    console.error('Error updating employee:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new Error('Employee not found');
      }
      if (error.code === 'P2002') {
        throw new Error('Email already in use by another employee');
      }
    }

    throw error;
  }
}

/**
 * Delete an employee from the system
 *
 * @param id - Employee ID
 * @returns Deleted employee object
 */
export async function deleteEmployee(id: string) {
  try {
    // Check if employee has subordinates
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        subordinates: true
      }
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    if (employee.subordinates.length > 0) {
      throw new Error(
        `Cannot delete employee with ${employee.subordinates.length} subordinates. ` +
        'Please reassign subordinates first.'
      );
    }

    const deleted = await prisma.employee.delete({
      where: { id }
    });

    console.log('Employee deleted:', {
      id: deleted.id,
      name: `${deleted.firstName} ${deleted.lastName}`
    });

    return deleted;
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error;
  }
}

/**
 * List employees with pagination
 *
 * @param page - Page number (starts from 1)
 * @param limit - Number of records per page
 * @returns Paginated employee list
 */
export async function listEmployees(page: number = 1, limit: number = 10) {
  try {
    const skip = (page - 1) * limit;

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        skip,
        take: limit,
        include: {
          department: {
            select: {
              id: true,
              name: true
            }
          },
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.employee.count()
    ]);

    const totalPages = Math.ceil(total / limit);

    console.log(`Retrieved ${employees.length} employees (Page ${page}/${totalPages})`);

    return {
      data: employees,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1
      }
    };
  } catch (error) {
    console.error('Error listing employees:', error);
    throw error;
  }
}

/**
 * Example usage demonstrating all CRUD operations
 */
export async function runBasicUsageExample() {
  try {
    console.log('=== Employee Directory Basic Usage Example ===\n');

    // 1. Create a new employee
    console.log('1. Creating new employee...');
    const newEmployee = await createEmployee({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-0100',
      position: 'Software Engineer',
      departmentId: 'dept-123', // Replace with actual department ID
      hireDate: new Date('2024-01-15'),
      employeeType: 'FULL_TIME'
    });

    // 2. Retrieve employee details
    console.log('\n2. Retrieving employee details...');
    const employee = await getEmployeeById(newEmployee.id);

    // 3. Update employee information
    console.log('\n3. Updating employee information...');
    await updateEmployee(newEmployee.id, {
      position: 'Senior Software Engineer',
      phone: '+1-555-0101'
    });

    // 4. List all employees
    console.log('\n4. Listing employees...');
    const employeeList = await listEmployees(1, 10);

    // 5. Delete employee (commented out for safety)
    // console.log('\n5. Deleting employee...');
    // await deleteEmployee(newEmployee.id);

    console.log('\n=== Example completed successfully ===');
  } catch (error) {
    console.error('Example failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Uncomment to run the example
// runBasicUsageExample();
