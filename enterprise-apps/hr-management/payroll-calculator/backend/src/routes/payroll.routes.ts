import { Router } from 'express';
import { payrollController } from '../controllers/payroll.controller';

const router = Router();

router.post('/calculate', payrollController.calculate);
router.get('/', payrollController.getAll);
router.get('/stats', payrollController.getStats);
router.get('/:id', payrollController.getById);
router.put('/:id/approve', payrollController.approve);
router.put('/:id/paid', payrollController.markAsPaid);

export default router;
