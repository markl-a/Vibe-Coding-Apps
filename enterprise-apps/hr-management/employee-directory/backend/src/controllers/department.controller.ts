import { Request, Response, NextFunction } from 'express';
import { departmentService } from '../services/department.service';

export class DepartmentController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const departments = await departmentService.findAll();
      res.json(departments);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const department = await departmentService.findById(id);

      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }

      res.json(department);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const department = await departmentService.create(req.body);
      res.status(201).json(department);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const department = await departmentService.update(id, req.body);

      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }

      res.json(department);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await departmentService.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getTree(req: Request, res: Response, next: NextFunction) {
    try {
      const tree = await departmentService.getDepartmentTree();
      res.json(tree);
    } catch (error) {
      next(error);
    }
  }
}

export const departmentController = new DepartmentController();
