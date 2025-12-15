const StatusReport = require('../models/StatusReport');
const Device = require('../models/Device');
const Alert = require('../models/Alert');

// @desc    取得狀態報告
// @route   GET /api/status-reports
// @access  Private
exports.getStatusReports = async (req, res, next) => {
  try {
    const { deviceId, startDate, endDate, page, limit } = req.query;

    // 建立查詢條件
    const query = { userId: req.user._id };

    if (deviceId) query.deviceId = deviceId;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // 分頁
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const skip = (pageNum - 1) * limitNum;

    // 執行查詢
    const reports = await StatusReport.find(query)
      .populate('deviceId', 'name deviceId type')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum);

    // 取得總數
    const total = await StatusReport.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        reports,
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

// @desc    取得單一狀態報告
// @route   GET /api/status-reports/:id
// @access  Private
exports.getStatusReport = async (req, res, next) => {
  try {
    const report = await StatusReport.findById(req.params.id)
      .populate('deviceId', 'name deviceId type');

    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REPORT_NOT_FOUND',
          message: 'Status report not found'
        }
      });
    }

    // 確認報告屬於當前用戶
    if (report.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized to access this report'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: { report }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    創建狀態報告
// @route   POST /api/status-reports
// @access  Private
exports.createStatusReport = async (req, res, next) => {
  try {
    const {
      deviceId,
      cpuUsage,
      memoryUsage,
      temperature,
      uptime,
      networkStatus,
      batteryLevel,
      firmwareVersion,
      errorCount,
      warningCount,
      customMetrics
    } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_DEVICE_ID',
          message: 'Please provide a device ID'
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
          message: 'Not authorized to create report for this device'
        }
      });
    }

    const report = await StatusReport.create({
      deviceId,
      cpuUsage,
      memoryUsage,
      temperature,
      uptime,
      networkStatus,
      batteryLevel,
      firmwareVersion,
      errorCount,
      warningCount,
      customMetrics,
      userId: req.user._id
    });

    // 更新設備的最後在線時間
    await Device.findByIdAndUpdate(deviceId, { lastSeen: Date.now() });

    // 檢查是否需要創建告警
    await checkAndCreateAlerts(report, device, req.user._id);

    const populatedReport = await StatusReport.findById(report._id)
      .populate('deviceId', 'name deviceId type');

    res.status(201).json({
      success: true,
      message: 'Status report created successfully',
      data: { report: populatedReport }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    取得設備最新狀態
// @route   GET /api/status-reports/device/:deviceId/latest
// @access  Private
exports.getLatestDeviceStatus = async (req, res, next) => {
  try {
    const { deviceId } = req.params;

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
          message: 'Not authorized to access this device'
        }
      });
    }

    const report = await StatusReport.findOne({ deviceId })
      .sort({ timestamp: -1 })
      .populate('deviceId', 'name deviceId type status');

    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NO_REPORTS',
          message: 'No status reports found for this device'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: { report }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    取得設備狀態歷史統計
// @route   GET /api/status-reports/device/:deviceId/stats
// @access  Private
exports.getDeviceStatusStats = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const { hours = 24 } = req.query;

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
          message: 'Not authorized to access this device'
        }
      });
    }

    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const stats = await StatusReport.aggregate([
      {
        $match: {
          deviceId: device._id,
          timestamp: { $gte: startTime }
        }
      },
      {
        $group: {
          _id: null,
          avgCpuUsage: { $avg: '$cpuUsage' },
          maxCpuUsage: { $max: '$cpuUsage' },
          avgMemoryUsage: { $avg: '$memoryUsage' },
          maxMemoryUsage: { $max: '$memoryUsage' },
          avgTemperature: { $avg: '$temperature' },
          maxTemperature: { $max: '$temperature' },
          totalErrors: { $sum: '$errorCount' },
          totalWarnings: { $sum: '$warningCount' },
          reportCount: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        timeRange: { hours: parseInt(hours), startTime, endTime: new Date() },
        stats: stats[0] || {}
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to check and create alerts
async function checkAndCreateAlerts(report, device, userId) {
  const alerts = [];

  // CPU 使用率告警
  const cpuThreshold = parseInt(process.env.ALERT_THRESHOLD_CPU) || 80;
  if (report.cpuUsage > cpuThreshold) {
    alerts.push({
      deviceId: device._id,
      severity: report.cpuUsage > 90 ? 'critical' : 'warning',
      type: 'cpu',
      message: `CPU usage is ${report.cpuUsage}%, exceeding threshold of ${cpuThreshold}%`,
      value: report.cpuUsage,
      threshold: cpuThreshold,
      userId
    });
  }

  // 記憶體使用率告警
  const memoryThreshold = parseInt(process.env.ALERT_THRESHOLD_MEMORY) || 85;
  if (report.memoryUsage > memoryThreshold) {
    alerts.push({
      deviceId: device._id,
      severity: report.memoryUsage > 95 ? 'critical' : 'warning',
      type: 'memory',
      message: `Memory usage is ${report.memoryUsage}%, exceeding threshold of ${memoryThreshold}%`,
      value: report.memoryUsage,
      threshold: memoryThreshold,
      userId
    });
  }

  // 溫度告警
  const tempThreshold = parseInt(process.env.ALERT_THRESHOLD_TEMPERATURE) || 75;
  if (report.temperature && report.temperature > tempThreshold) {
    alerts.push({
      deviceId: device._id,
      severity: report.temperature > 85 ? 'critical' : 'warning',
      type: 'temperature',
      message: `Temperature is ${report.temperature}°C, exceeding threshold of ${tempThreshold}°C`,
      value: report.temperature,
      threshold: tempThreshold,
      userId
    });
  }

  // 批量創建告警
  if (alerts.length > 0) {
    await Alert.insertMany(alerts);
  }
}

module.exports = exports;
