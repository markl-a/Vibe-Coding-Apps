import { Router } from 'express';
import { leaveController } from '../controllers/leave.controller';

const router = Router();

router.post('/', leaveController.createRequest);
router.get('/', leaveController.getRequests);
router.put('/:id/approve', leaveController.approveRequest);
router.put('/:id/reject', leaveController.rejectRequest);
router.get('/balance', leaveController.getBalance);

export default router;
