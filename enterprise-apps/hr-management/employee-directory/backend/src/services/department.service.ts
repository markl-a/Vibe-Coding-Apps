import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface DepartmentTreeNode {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  parentId: string | null;
  managerId: string | null;
  createdAt: Date;
  updatedAt: Date;
  manager: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  _count: {
    employees: number;
  };
  children: DepartmentTreeNode[];
}

export class DepartmentService {
  async findAll() {
    return await prisma.department.findMany({
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return await prisma.department.findUnique({
      where: { id },
      include: {
        manager: true,
        parent: true,
        children: true,
        employees: {
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

  async create(data: Prisma.DepartmentCreateInput) {
    return await prisma.department.create({
      data,
      include: {
        manager: true,
      },
    });
  }

  async update(id: string, data: Prisma.DepartmentUpdateInput) {
    return await prisma.department.update({
      where: { id },
      data,
      include: {
        manager: true,
      },
    });
  }

  async delete(id: string) {
    return await prisma.department.delete({
      where: { id },
    });
  }

  async getDepartmentTree(): Promise<DepartmentTreeNode[]> {
    const departments = await prisma.department.findMany({
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    // 構建樹形結構
    const departmentMap = new Map<string, DepartmentTreeNode>();
    departments.forEach((dept) => {
      departmentMap.set(dept.id, { ...dept, children: [] });
    });

    const tree: DepartmentTreeNode[] = [];
    departments.forEach((dept) => {
      const node = departmentMap.get(dept.id);
      if (node && dept.parentId) {
        const parent = departmentMap.get(dept.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else if (node) {
        tree.push(node);
      }
    });

    return tree;
  }
}

export const departmentService = new DepartmentService();
