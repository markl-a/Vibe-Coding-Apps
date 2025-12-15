const express = require('express');
const router = express.Router();
const {
  getStatusReports,
  getStatusReport,
  createStatusReport,
  getLatestDeviceStatus,
  getDeviceStatusStats
} = require('../controllers/statusReportController');
const { protect } = require('../middleware/authMiddleware');

// 所有路由都需要認證
router.use(protect);

router.route('/')
  .get(getStatusReports)
  .post(createStatusReport);

router.get('/:id', getStatusReport);
router.get('/device/:deviceId/latest', getLatestDeviceStatus);
router.get('/device/:deviceId/stats', getDeviceStatusStats);

module.exports = router;
