import { Router } from 'express';
import { attendanceController } from '../controllers/attendance.controller';

const router = Router();

// 打卡功能
router.post('/check-in', attendanceController.checkIn.bind(attendanceController));
router.post('/check-out', attendanceController.checkOut.bind(attendanceController));

// 記錄查詢
router.get('/', attendanceController.getRecords.bind(attendanceController));
router.get('/stats', attendanceController.getStats.bind(attendanceController));

// AI 分析功能
router.get('/ai/anomalies/:employeeId', attendanceController.detectAnomalies.bind(attendanceController));
router.get('/ai/predict/:employeeId', attendanceController.predictAttendance.bind(attendanceController));
router.get('/ai/team-analysis', attendanceController.analyzeTeam.bind(attendanceController));

export default router;
