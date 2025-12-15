const express = require('express');
const router = express.Router();
const {
  getAlerts,
  getAlert,
  createAlert,
  acknowledgeAlert,
  resolveAlert,
  deleteAlert,
  getAlertStats
} = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');

// 所有路由都需要認證
router.use(protect);

router.get('/stats', getAlertStats);
router.route('/')
  .get(getAlerts)
  .post(createAlert);

router.route('/:id')
  .get(getAlert)
  .delete(deleteAlert);

router.patch('/:id/acknowledge', acknowledgeAlert);
router.patch('/:id/resolve', resolveAlert);

module.exports = router;
