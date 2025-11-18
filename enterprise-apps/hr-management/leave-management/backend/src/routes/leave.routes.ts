import { Router } from 'express';
import { leaveController } from '../controllers/leave.controller';

const router = Router();

// 請假申請管理
router.post('/', leaveController.createRequest.bind(leaveController));
router.get('/', leaveController.getRequests.bind(leaveController));
router.put('/:id/approve', leaveController.approveRequest.bind(leaveController));
router.put('/:id/reject', leaveController.rejectRequest.bind(leaveController));
router.get('/balance', leaveController.getBalance.bind(leaveController));

// AI 分析功能
router.get('/ai/recommendation/:id', leaveController.getApprovalRecommendation.bind(leaveController));
router.get('/ai/pattern/:employeeId', leaveController.analyzePattern.bind(leaveController));
router.get('/ai/team-analysis', leaveController.analyzeTeam.bind(leaveController));

export default router;
