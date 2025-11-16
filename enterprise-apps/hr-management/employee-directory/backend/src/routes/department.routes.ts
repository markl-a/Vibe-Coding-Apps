import { Router } from 'express';
import { departmentController } from '../controllers/department.controller';

const router = Router();

router.get('/', departmentController.getAll);
router.get('/tree', departmentController.getTree);
router.get('/:id', departmentController.getById);
router.post('/', departmentController.create);
router.put('/:id', departmentController.update);
router.delete('/:id', departmentController.delete);

export default router;
