const Alert = require('../models/Alert');
const Device = require('../models/Device');

// @desc    取得所有告警
// @route   GET /api/alerts
// @access  Private
exports.getAlerts = async (req, res, next) => {
  try {
    const { severity, type, status, deviceId, page, limit } = req.query;

    // 建立查詢條件
    const query = { userId: req.user._id };

    if (severity) query.severity = severity;
    if (type) query.type = type;
    if (status) query.status = status;
    if (deviceId) query.deviceId = deviceId;

    // 分頁
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    // 執行查詢
    const alerts = await Alert.find(query)
      .populate('deviceId', 'name deviceId type')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // 取得總數
    const total = await Alert.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        alerts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    取得單一告警
// @route   GET /api/alerts/:id
// @access  Private
exports.getAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('deviceId', 'name deviceId type')
      .populate('acknowledgedBy', 'username email')
      .populate('resolvedBy', 'username email');

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ALERT_NOT_FOUND',
          message: 'Alert not found'
        }
      });
    }

    // 確認告警屬於當前用戶
    if (alert.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized to access this alert'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: { alert }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    創建新告警
// @route   POST /api/alerts
// @access  Private
exports.createAlert = async (req, res, next) => {
  try {
    const { deviceId, severity, type, message, value, threshold } = req.body;

    if (!deviceId || !type || !message) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Please provide deviceId, type, and message'
        }
      });
    }

    // 驗證設備存在且屬於當前用戶
    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DEVICE_NOT_FOUND',
          message: 'Device not found'
        }
      });
    }

    if (device.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized to create alert for this device'
        }
      });
    }

    const alert = await Alert.create({
      deviceId,
      severity,
      type,
      message,
      value,
      threshold,
      userId: req.user._id
    });

    const populatedAlert = await Alert.findById(alert._id).populate('deviceId', 'name deviceId type');

    res.status(201).json({
      success: true,
      message: 'Alert created successfully',
      data: { alert: populatedAlert }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    確認告警
// @route   PATCH /api/alerts/:id/acknowledge
// @access  Private
exports.acknowledgeAlert = async (req, res, next) => {
  try {
    const { notes } = req.body;

    let alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ALERT_NOT_FOUND',
          message: 'Alert not found'
        }
      });
    }

    // 確認告警屬於當前用戶
    if (alert.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized to acknowledge this alert'
        }
      });
    }

    if (alert.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ALERT_STATUS',
          message: 'Only active alerts can be acknowledged'
        }
      });
    }

    alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        status: 'acknowledged',
        acknowledgedBy: req.user._id,
        acknowledgedAt: Date.now(),
        notes,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    ).populate('deviceId', 'name deviceId type');

    res.status(200).json({
      success: true,
      message: 'Alert acknowledged successfully',
      data: { alert }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    解決告警
// @route   PATCH /api/alerts/:id/resolve
// @access  Private
exports.resolveAlert = async (req, res, next) => {
  try {
    const { notes } = req.body;

    let alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ALERT_NOT_FOUND',
          message: 'Alert not found'
        }
      });
    }

    // 確認告警屬於當前用戶
    if (alert.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized to resolve this alert'
        }
      });
    }

    if (alert.status === 'resolved') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_RESOLVED',
          message: 'Alert is already resolved'
        }
      });
    }

    alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        resolvedBy: req.user._id,
        resolvedAt: Date.now(),
        notes: notes || alert.notes,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    ).populate('deviceId', 'name deviceId type');

    res.status(200).json({
      success: true,
      message: 'Alert resolved successfully',
      data: { alert }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    刪除告警
// @route   DELETE /api/alerts/:id
// @access  Private
exports.deleteAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ALERT_NOT_FOUND',
          message: 'Alert not found'
        }
      });
    }

    // 確認告警屬於當前用戶
    if (alert.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized to delete this alert'
        }
      });
    }

    await Alert.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Alert deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    取得告警統計
// @route   GET /api/alerts/stats
// @access  Private
exports.getAlertStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const stats = await Alert.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          acknowledged: {
            $sum: { $cond: [{ $eq: ['$status', 'acknowledged'] }, 1, 0] }
          },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          critical: {
            $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
          },
          warning: {
            $sum: { $cond: [{ $eq: ['$severity', 'warning'] }, 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || { total: 0, active: 0, acknowledged: 0, resolved: 0, critical: 0, warning: 0 }
    });
  } catch (error) {
    next(error);
  }
};
