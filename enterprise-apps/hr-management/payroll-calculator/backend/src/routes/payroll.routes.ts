import { Router } from 'express';
import { payrollController } from '../controllers/payroll.controller';

const router = Router();

// 薪資計算
router.post('/calculate', payrollController.calculate.bind(payrollController));
router.get('/', payrollController.getAll.bind(payrollController));
router.get('/stats', payrollController.getStats.bind(payrollController));
router.get('/:id', payrollController.getById.bind(payrollController));
router.put('/:id/approve', payrollController.approve.bind(payrollController));
router.put('/:id/paid', payrollController.markAsPaid.bind(payrollController));

// 薪資單生成
router.post('/:id/payslip', payrollController.generatePayslip.bind(payrollController));
router.post('/payslips/batch', payrollController.generateBatchPayslips.bind(payrollController));

// AI 分析功能
router.get('/ai/anomalies', payrollController.detectAnomalies.bind(payrollController));
router.get('/ai/trends/:employeeId', payrollController.analyzeTrends.bind(payrollController));
router.get('/ai/market-compare/:employeeId', payrollController.compareToMarket.bind(payrollController));
router.get('/ai/cost-optimization', payrollController.analyzeCostOptimization.bind(payrollController));

export default router;
