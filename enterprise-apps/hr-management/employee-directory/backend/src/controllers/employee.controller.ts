import { Request, Response, NextFunction } from 'express';
import { employeeService } from '../services/employee.service';
import { importExportService } from '../services/import-export.service';
import { z } from 'zod';
import multer from 'multer';

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

  async importEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const fileType = req.file.originalname.endsWith('.csv') ? 'csv' : 'xlsx';
      const result = await importExportService.importEmployees(req.file.buffer, fileType);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async exportEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const { departmentId, status } = req.query;

      const buffer = await importExportService.exportEmployees({
        departmentId: departmentId as string | undefined,
        status: status as string | undefined,
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=employees.xlsx');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  async downloadTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const buffer = importExportService.generateTemplate();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=employee_import_template.xlsx');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

// 配置 multer 用於文件上傳
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel and CSV files are allowed.'));
    }
  },
});

export const employeeController = new EmployeeController();
