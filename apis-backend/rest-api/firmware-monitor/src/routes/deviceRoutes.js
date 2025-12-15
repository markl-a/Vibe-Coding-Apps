const express = require('express');
const router = express.Router();
const {
  getDevices,
  getDevice,
  createDevice,
  updateDevice,
  updateDeviceStatus,
  deleteDevice,
  getDeviceStats
} = require('../controllers/deviceController');
const { protect } = require('../middleware/authMiddleware');

// 所有路由都需要認證
router.use(protect);

router.get('/stats', getDeviceStats);
router.route('/')
  .get(getDevices)
  .post(createDevice);

router.route('/:id')
  .get(getDevice)
  .put(updateDevice)
  .delete(deleteDevice);

router.patch('/:id/status', updateDeviceStatus);

module.exports = router;
