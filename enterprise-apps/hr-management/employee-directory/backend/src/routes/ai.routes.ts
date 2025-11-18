import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';

const router = Router();

/**
 * AI 輔助功能路由
 */

// 智能搜索
router.get('/search', aiController.intelligentSearch.bind(aiController));

// 技能推薦
router.post('/recommend-by-skills', aiController.recommendBySkills.bind(aiController));

// 組織架構分析
router.get('/analyze-organization', aiController.analyzeOrganization.bind(aiController));

// 流失風險預測
router.get('/attrition-risk/:employeeId', aiController.predictAttrition.bind(aiController));

// 團隊技能分析
router.get('/team-skills', aiController.analyzeTeamSkills.bind(aiController));

export default router;
