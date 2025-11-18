import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';

export class AIController {
  /**
   * 智能搜索員工
   */
  async intelligentSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const { query } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: 'Query parameter is required' });
      }

      const results = await aiService.intelligentSearch(query);
      res.json(results);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 根據技能推薦員工
   */
  async recommendBySkills(req: Request, res: Response, next: NextFunction) {
    try {
      const { skills } = req.body;

      if (!Array.isArray(skills) || skills.length === 0) {
        return res.status(400).json({
          message: 'Skills array is required and must not be empty',
        });
      }

      const recommendations = await aiService.recommendEmployeesBySkills(skills);
      res.json(recommendations);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 分析組織架構
   */
  async analyzeOrganization(req: Request, res: Response, next: NextFunction) {
    try {
      const analysis = await aiService.analyzeOrganizationStructure();
      res.json(analysis);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 預測員工流失風險
   */
  async predictAttrition(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId } = req.params;

      if (!employeeId) {
        return res.status(400).json({ message: 'Employee ID is required' });
      }

      const prediction = await aiService.predictAttritionRisk(employeeId);
      res.json(prediction);
    } catch (error) {
      if (error instanceof Error && error.message === 'Employee not found') {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  }

  /**
   * 分析團隊技能
   */
  async analyzeTeamSkills(req: Request, res: Response, next: NextFunction) {
    try {
      const { departmentId } = req.query;

      const analysis = await aiService.analyzeTeamSkills(
        departmentId as string | undefined
      );
      res.json(analysis);
    } catch (error) {
      next(error);
    }
  }
}

export const aiController = new AIController();
