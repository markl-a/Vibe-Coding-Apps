import { Request, Response, NextFunction } from 'express';
import { employeeService } from '../services/employee.service';
import { z } from 'zod';

const createEmployeeSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  position: z.string().min(1),
  jobTitle: z.string().min(1),
  employeeType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']).default('FULL_TIME'),
  hireDate: z.string().datetime(),
  baseSalary: z.number().positive().optional(),
  managerId: z.string().uuid().optional(),
});

export class EmployeeController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = '1', limit = '10', search, department, status } = req.query;

      const result = await employeeService.findAll({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        department: department as string,
        status: status as string,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const employee = await employeeService.findById(id);

      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      res.json(employee);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createEmployeeSchema.parse(req.body);
      const employee = await employeeService.create(validatedData);

      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const employee = await employeeService.update(id, req.body);

      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      res.json(employee);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await employeeService.delete(id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await employeeService.getStatistics();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}

export const employeeController = new EmployeeController();
