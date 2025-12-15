const Device = require('../models/Device');

// @desc    取得所有設備
// @route   GET /api/devices
// @access  Private
exports.getDevices = async (req, res, next) => {
  try {
    const { status, type, search, sortBy, order, page, limit } = req.query;

    // 建立查詢條件
    const query = { userId: req.user._id };

    if (status) query.status = status;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { deviceId: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    // 排序
    const sortField = sortBy || 'createdAt';
    const sortOrder = order === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    // 分頁
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // 執行查詢
    const devices = await Device.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // 取得總數
    const total = await Device.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        devices,
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

// @desc    取得單一設備
// @route   GET /api/devices/:id
// @access  Private
exports.getDevice = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DEVICE_NOT_FOUND',
          message: 'Device not found'
        }
      });
    }

    // 確認設備屬於當前用戶
    if (device.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized to access this device'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: { device }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    創建新設備
// @route   POST /api/devices
// @access  Private
exports.createDevice = async (req, res, next) => {
  try {
    const { deviceId, name, type, firmwareVersion, location, ipAddress, macAddress, manufacturer, model, metadata } = req.body;

    if (!deviceId || !name || !firmwareVersion) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Please provide deviceId, name, and firmwareVersion'
        }
      });
    }

    // 檢查設備 ID 是否已存在
    const existingDevice = await Device.findOne({ deviceId });
    if (existingDevice) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DEVICE_ALREADY_EXISTS',
          message: 'Device with this ID already exists'
        }
      });
    }

    const device = await Device.create({
      deviceId,
      name,
      type,
      firmwareVersion,
      location,
      ipAddress,
      macAddress,
      manufacturer,
      model,
      metadata,
      userId: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Device created successfully',
      data: { device }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    更新設備
// @route   PUT /api/devices/:id
// @access  Private
exports.updateDevice = async (req, res, next) => {
  try {
    let device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DEVICE_NOT_FOUND',
          message: 'Device not found'
        }
      });
    }

    // 確認設備屬於當前用戶
    if (device.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized to update this device'
        }
      });
    }

    const { name, type, firmwareVersion, status, location, ipAddress, macAddress, manufacturer, model, metadata } = req.body;

    device = await Device.findByIdAndUpdate(
      req.params.id,
      { name, type, firmwareVersion, status, location, ipAddress, macAddress, manufacturer, model, metadata, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Device updated successfully',
      data: { device }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    更新設備狀態
// @route   PATCH /api/devices/:id/status
// @access  Private
exports.updateDeviceStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status || !['online', 'offline', 'maintenance', 'error'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Status must be one of: online, offline, maintenance, error'
        }
      });
    }

    let device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DEVICE_NOT_FOUND',
          message: 'Device not found'
        }
      });
    }

    // 確認設備屬於當前用戶
    if (device.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized to update this device'
        }
      });
    }

    device = await Device.findByIdAndUpdate(
      req.params.id,
      { status, lastSeen: Date.now(), updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Device status updated successfully',
      data: { device }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    刪除設備
// @route   DELETE /api/devices/:id
// @access  Private
exports.deleteDevice = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DEVICE_NOT_FOUND',
          message: 'Device not found'
        }
      });
    }

    // 確認設備屬於當前用戶
    if (device.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized to delete this device'
        }
      });
    }

    await Device.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Device deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    取得設備統計
// @route   GET /api/devices/stats
// @access  Private
exports.getDeviceStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const stats = await Device.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          online: {
            $sum: { $cond: [{ $eq: ['$status', 'online'] }, 1, 0] }
          },
          offline: {
            $sum: { $cond: [{ $eq: ['$status', 'offline'] }, 1, 0] }
          },
          maintenance: {
            $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] }
          },
          error: {
            $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] }
          }
        }
      }
    ]);

    const typeStats = await Device.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: stats[0] || { total: 0, online: 0, offline: 0, maintenance: 0, error: 0 },
        byType: typeStats
      }
    });
  } catch (error) {
    next(error);
  }
};
