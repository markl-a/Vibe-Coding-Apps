import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface FindAllParams {
  page: number;
  limit: number;
  search?: string;
  department?: string;
  status?: string;
}

export class EmployeeService {
  async findAll(params: FindAllParams) {
    const { page, limit, search, department, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.EmployeeWhereInput = {};

    // 搜索條件
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 部門篩選
    if (department) {
      where.departmentId = department;
    }

    // 狀態篩選
    if (status) {
      where.employmentStatus = status as any;
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
              position: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.employee.count({ where }),
    ]);

    return {
      data: employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    return await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            email: true,
          },
        },
        subordinates: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            email: true,
          },
        },
      },
    });
  }

  async create(data: Prisma.EmployeeCreateInput) {
    // 生成員工編號
    const employeeNumber = await this.generateEmployeeNumber();

    return await prisma.employee.create({
      data: {
        ...data,
        employeeNumber,
      },
      include: {
        department: true,
        manager: true,
      },
    });
  }

  async update(id: string, data: Prisma.EmployeeUpdateInput) {
    return await prisma.employee.update({
      where: { id },
      data,
      include: {
        department: true,
        manager: true,
      },
    });
  }

  async delete(id: string) {
    return await prisma.employee.delete({
      where: { id },
    });
  }

  async getStatistics() {
    const [total, byStatus, byDepartment, byType] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.groupBy({
        by: ['employmentStatus'],
        _count: true,
      }),
      prisma.employee.groupBy({
        by: ['departmentId'],
        _count: true,
      }),
      prisma.employee.groupBy({
        by: ['employeeType'],
        _count: true,
      }),
    ]);

    return {
      total,
      byStatus,
      byDepartment,
      byType,
    };
  }

  private async generateEmployeeNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.employee.count();
    return `EMP${year}${String(count + 1).padStart(4, '0')}`;
  }
}

export const employeeService = new EmployeeService();
