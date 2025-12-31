/**
 * Department Hierarchy Operations for Employee Directory
 *
 * This example demonstrates department management including:
 * - Creating and managing departments
 * - Building department hierarchies
 * - Managing department relationships
 * - Retrieving department trees
 * - Department statistics and reporting
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create a new department
 *
 * @param data - Department creation data
 * @returns Created department object
 */
export async function createDepartment(data: {
  name: string;
  code?: string;
  description?: string;
  parentId?: string;
  managerId?: string;
}) {
  try {
    const departmentData: Prisma.DepartmentCreateInput = {
      name: data.name,
      code: data.code,
      description: data.description,
      // Connect to parent department if provided
      ...(data.parentId && {
        parent: {
          connect: { id: data.parentId }
        }
      }),
      // Connect to department manager if provided
      ...(data.managerId && {
        manager: {
          connect: { id: data.managerId }
        }
      })
    };

    const department = await prisma.department.create({
      data: departmentData,
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            email: true
          }
        },
        parent: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    console.log('Department created successfully:', {
      id: department.id,
      name: department.name,
      code: department.code,
      parent: department.parent?.name
    });

    return department;
  } catch (error) {
    console.error('Error creating department:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('Department with this name or code already exists');
      }
      if (error.code === 'P2025') {
        throw new Error('Parent department or manager not found');
      }
    }

    throw error;
  }
}

/**
 * Update department information
 *
 * @param id - Department ID
 * @param data - Fields to update
 * @returns Updated department object
 */
export async function updateDepartment(
  id: string,
  data: {
    name?: string;
    code?: string;
    description?: string;
    parentId?: string | null;
    managerId?: string | null;
  }
) {
  try {
    // Check for circular references if updating parent
    if (data.parentId) {
      const isCircular = await checkCircularDepartmentReference(id, data.parentId);
      if (isCircular) {
        throw new Error('Cannot set parent: would create circular reference');
      }
    }

    const updateData: Prisma.DepartmentUpdateInput = {
      ...(data.name && { name: data.name }),
      ...(data.code !== undefined && { code: data.code }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.parentId !== undefined && {
        parent: data.parentId ? { connect: { id: data.parentId } } : { disconnect: true }
      }),
      ...(data.managerId !== undefined && {
        manager: data.managerId ? { connect: { id: data.managerId } } : { disconnect: true }
      })
    };

    const department = await prisma.department.update({
      where: { id },
      data: updateData,
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        parent: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log('Department updated successfully:', {
      id: department.id,
      name: department.name,
      changes: Object.keys(data)
    });

    return department;
  } catch (error) {
    console.error('Error updating department:', error);
    throw error;
  }
}

/**
 * Check if setting a parent would create a circular reference
 *
 * @param departmentId - The department ID
 * @param newParentId - The proposed parent ID
 * @returns True if circular reference would be created
 */
async function checkCircularDepartmentReference(
  departmentId: string,
  newParentId: string
): Promise<boolean> {
  // If trying to set self as parent
  if (departmentId === newParentId) {
    return true;
  }

  // Check if newParent is a descendant of current department
  let currentId: string | null = newParentId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) {
      return true; // Circular reference detected
    }
    visited.add(currentId);

    if (currentId === departmentId) {
      return true; // New parent is a descendant
    }

    const parent = await prisma.department.findUnique({
      where: { id: currentId },
      select: { parentId: true }
    });

    currentId = parent?.parentId || null;
  }

  return false;
}

/**
 * Get department hierarchy as a tree structure
 *
 * @returns Department tree with nested children
 */
export async function getDepartmentTree() {
  try {
    // Fetch all departments with related data
    const departments = await prisma.department.findMany({
      include: {
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
            employees: true,
            children: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Build tree structure
    type DepartmentNode = typeof departments[0] & { children: DepartmentNode[] };

    const departmentMap = new Map<string, DepartmentNode>();
    departments.forEach(dept => {
      departmentMap.set(dept.id, { ...dept, children: [] });
    });

    const tree: DepartmentNode[] = [];

    departments.forEach(dept => {
      const node = departmentMap.get(dept.id);
      if (node) {
        if (dept.parentId) {
          const parent = departmentMap.get(dept.parentId);
          if (parent) {
            parent.children.push(node);
          }
        } else {
          tree.push(node);
        }
      }
    });

    console.log(`Built department tree with ${tree.length} root departments`);

    return tree;
  } catch (error) {
    console.error('Error building department tree:', error);
    throw error;
  }
}

/**
 * Get department with all details including employees
 *
 * @param id - Department ID
 * @returns Department with employees and subdepartments
 */
export async function getDepartmentDetails(id: string) {
  try {
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            email: true,
            phone: true
          }
        },
        parent: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            code: true,
            _count: {
              select: {
                employees: true
              }
            }
          }
        },
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            position: true,
            email: true,
            employmentStatus: true,
            employeeType: true
          },
          orderBy: { lastName: 'asc' }
        }
      }
    });

    if (!department) {
      console.log(`Department with ID ${id} not found`);
      return null;
    }

    console.log('Department details retrieved:', {
      name: department.name,
      employeeCount: department.employees.length,
      subdepartmentCount: department.children.length
    });

    return department;
  } catch (error) {
    console.error('Error getting department details:', error);
    throw error;
  }
}

/**
 * Get all ancestors (parent chain) of a department
 *
 * @param departmentId - Department ID
 * @returns Array of ancestor departments from root to immediate parent
 */
export async function getDepartmentAncestors(departmentId: string) {
  try {
    const ancestors: Array<{
      id: string;
      name: string;
      code: string | null;
      parentId: string | null;
    }> = [];

    let currentId: string | null = departmentId;

    while (currentId) {
      const department = await prisma.department.findUnique({
        where: { id: currentId },
        select: {
          id: true,
          name: true,
          code: true,
          parentId: true
        }
      });

      if (!department) break;

      // Don't include the starting department itself
      if (department.id !== departmentId) {
        ancestors.unshift(department); // Add to beginning to maintain order
      }

      currentId = department.parentId;
    }

    console.log(`Found ${ancestors.length} ancestors for department`);

    return ancestors;
  } catch (error) {
    console.error('Error getting department ancestors:', error);
    throw error;
  }
}

/**
 * Get all descendants (children recursively) of a department
 *
 * @param departmentId - Department ID
 * @returns Array of all descendant departments
 */
export async function getDepartmentDescendants(departmentId: string) {
  try {
    const descendants: Array<{
      id: string;
      name: string;
      code: string | null;
      parentId: string | null;
      level: number;
    }> = [];

    async function collectDescendants(parentId: string, level: number) {
      const children = await prisma.department.findMany({
        where: { parentId },
        select: {
          id: true,
          name: true,
          code: true,
          parentId: true
        }
      });

      for (const child of children) {
        descendants.push({ ...child, level });
        await collectDescendants(child.id, level + 1);
      }
    }

    await collectDescendants(departmentId, 1);

    console.log(`Found ${descendants.length} descendants for department`);

    return descendants;
  } catch (error) {
    console.error('Error getting department descendants:', error);
    throw error;
  }
}

/**
 * Move a department to a new parent
 *
 * @param departmentId - Department ID to move
 * @param newParentId - New parent department ID (null for root level)
 * @returns Updated department
 */
export async function moveDepartment(
  departmentId: string,
  newParentId: string | null
) {
  try {
    // Check for circular references
    if (newParentId) {
      const isCircular = await checkCircularDepartmentReference(departmentId, newParentId);
      if (isCircular) {
        throw new Error('Cannot move department: would create circular reference');
      }
    }

    const department = await prisma.department.update({
      where: { id: departmentId },
      data: {
        parent: newParentId
          ? { connect: { id: newParentId } }
          : { disconnect: true }
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log('Department moved successfully:', {
      department: department.name,
      newParent: department.parent?.name || 'Root level'
    });

    return department;
  } catch (error) {
    console.error('Error moving department:', error);
    throw error;
  }
}

/**
 * Get department statistics
 *
 * @param departmentId - Optional department ID for specific department stats
 * @returns Department statistics
 */
export async function getDepartmentStatistics(departmentId?: string) {
  try {
    if (departmentId) {
      // Statistics for a specific department and its subdepartments
      const descendants = await getDepartmentDescendants(departmentId);
      const allDepartmentIds = [departmentId, ...descendants.map(d => d.id)];

      const [employeeCount, departmentDetails] = await Promise.all([
        prisma.employee.count({
          where: {
            departmentId: {
              in: allDepartmentIds
            }
          }
        }),
        prisma.department.findUnique({
          where: { id: departmentId },
          include: {
            _count: {
              select: {
                employees: true,
                children: true
              }
            }
          }
        })
      ]);

      return {
        departmentId,
        directEmployees: departmentDetails?._count.employees || 0,
        totalEmployees: employeeCount,
        directSubdepartments: departmentDetails?._count.children || 0,
        totalSubdepartments: descendants.length
      };
    } else {
      // Overall department statistics
      const [totalDepartments, departmentCounts, rootDepartments] = await Promise.all([
        prisma.department.count(),
        prisma.department.findMany({
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                employees: true
              }
            }
          }
        }),
        prisma.department.count({
          where: { parentId: null }
        })
      ]);

      const totalEmployees = departmentCounts.reduce(
        (sum, dept) => sum + dept._count.employees,
        0
      );

      const avgEmployeesPerDepartment = totalDepartments > 0
        ? totalEmployees / totalDepartments
        : 0;

      return {
        totalDepartments,
        rootDepartments,
        totalEmployees,
        avgEmployeesPerDepartment: Math.round(avgEmployeesPerDepartment * 10) / 10,
        largestDepartment: departmentCounts.reduce((max, dept) =>
          dept._count.employees > (max?._count.employees || 0) ? dept : max
        , departmentCounts[0])
      };
    }
  } catch (error) {
    console.error('Error getting department statistics:', error);
    throw error;
  }
}

/**
 * Delete a department (only if empty)
 *
 * @param id - Department ID
 * @returns Deleted department object
 */
export async function deleteDepartment(id: string) {
  try {
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        employees: true,
        children: true
      }
    });

    if (!department) {
      throw new Error('Department not found');
    }

    if (department.employees.length > 0) {
      throw new Error(
        `Cannot delete department with ${department.employees.length} employees. ` +
        'Please reassign employees first.'
      );
    }

    if (department.children.length > 0) {
      throw new Error(
        `Cannot delete department with ${department.children.length} subdepartments. ` +
        'Please move or delete subdepartments first.'
      );
    }

    const deleted = await prisma.department.delete({
      where: { id }
    });

    console.log('Department deleted:', {
      id: deleted.id,
      name: deleted.name
    });

    return deleted;
  } catch (error) {
    console.error('Error deleting department:', error);
    throw error;
  }
}

/**
 * Example usage demonstrating department hierarchy operations
 */
export async function runDepartmentManagementExample() {
  try {
    console.log('=== Department Hierarchy Management Example ===\n');

    // 1. Create a root department
    console.log('1. Creating Engineering department...');
    const engineering = await createDepartment({
      name: 'Engineering',
      code: 'ENG',
      description: 'Engineering Department'
    });

    // 2. Create subdepartments
    console.log('\n2. Creating subdepartments...');
    const frontend = await createDepartment({
      name: 'Frontend Development',
      code: 'ENG-FE',
      description: 'Frontend Development Team',
      parentId: engineering.id
    });

    const backend = await createDepartment({
      name: 'Backend Development',
      code: 'ENG-BE',
      description: 'Backend Development Team',
      parentId: engineering.id
    });

    // 3. Get department tree
    console.log('\n3. Building department tree...');
    const tree = await getDepartmentTree();

    // 4. Get department details
    console.log('\n4. Getting engineering department details...');
    await getDepartmentDetails(engineering.id);

    // 5. Get ancestors and descendants
    console.log('\n5. Getting department hierarchy...');
    const ancestors = await getDepartmentAncestors(frontend.id);
    const descendants = await getDepartmentDescendants(engineering.id);
    console.log(`Frontend has ${ancestors.length} ancestors`);
    console.log(`Engineering has ${descendants.length} descendants`);

    // 6. Move a department
    console.log('\n6. Moving department to new parent...');
    // await moveDepartment(frontend.id, anotherDepartmentId);

    // 7. Get statistics
    console.log('\n7. Getting department statistics...');
    const overallStats = await getDepartmentStatistics();
    const deptStats = await getDepartmentStatistics(engineering.id);
    console.log('Overall stats:', overallStats);
    console.log('Engineering stats:', deptStats);

    console.log('\n=== Example completed successfully ===');
  } catch (error) {
    console.error('Example failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Uncomment to run the example
// runDepartmentManagementExample();
