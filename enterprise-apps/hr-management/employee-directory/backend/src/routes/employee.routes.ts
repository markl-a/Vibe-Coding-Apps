import { Router } from 'express';
import { employeeController, upload } from '../controllers/employee.controller';

const router = Router();

router.get('/', employeeController.getAll.bind(employeeController));
router.get('/statistics', employeeController.getStatistics.bind(employeeController));
router.get('/export', employeeController.exportEmployees.bind(employeeController));
router.get('/template', employeeController.downloadTemplate.bind(employeeController));
router.get('/:id', employeeController.getById.bind(employeeController));
router.post('/', employeeController.create.bind(employeeController));
router.post('/import', upload.single('file'), employeeController.importEmployees.bind(employeeController));
router.put('/:id', employeeController.update.bind(employeeController));
router.delete('/:id', employeeController.delete.bind(employeeController));

export default router;
