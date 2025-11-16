import { Router } from 'express';
import { employeeController } from '../controllers/employee.controller';

const router = Router();

router.get('/', employeeController.getAll);
router.get('/statistics', employeeController.getStatistics);
router.get('/:id', employeeController.getById);
router.post('/', employeeController.create);
router.put('/:id', employeeController.update);
router.delete('/:id', employeeController.delete);

export default router;
