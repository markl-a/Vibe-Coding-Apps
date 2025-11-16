import { Router } from 'express';
import { attendanceController } from '../controllers/attendance.controller';

const router = Router();

router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);
router.get('/', attendanceController.getRecords);
router.get('/stats', attendanceController.getStats);

export default router;
