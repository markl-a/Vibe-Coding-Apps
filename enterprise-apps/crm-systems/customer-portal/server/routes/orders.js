const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Customer = require('../models/Customer');

// Middleware to verify customer authentication
const authenticateCustomer = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication' });
  }
};

// Get all orders for the authenticated customer
router.get('/', authenticateCustomer, async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;

    // Build query
    const query = { customer: req.user._id };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch orders
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('customer', 'name email company');

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get order by ID
router.get('/:id', authenticateCustomer, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user._id
    }).populate('customer', 'name email company phone');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create new order
router.post('/', authenticateCustomer, async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      notes
    } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // Calculate item subtotals
    const processedItems = items.map(item => ({
      ...item,
      subtotal: item.quantity * item.unitPrice
    }));

    // Calculate totals
    const subtotal = processedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = subtotal * 0.1;  // 10% tax
    const shipping = subtotal > 1000 ? 0 : 50;  // Free shipping over 1000
    const total = subtotal + tax + shipping;

    // Create order
    const order = new Order({
      customer: req.user._id,
      items: processedItems,
      subtotal,
      tax,
      shipping,
      total,
      shippingAddress: shippingAddress || req.user.address,
      billingAddress: billingAddress || req.user.address,
      paymentMethod,
      notes
    });

    await order.save();

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order status (customer can only cancel)
router.patch('/:id/status', authenticateCustomer, async (req, res) => {
  try {
    const { status, cancelReason } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user._id
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Only allow customer to cancel pending or processing orders
    if (status === 'cancelled') {
      if (!['pending', 'processing'].includes(order.status)) {
        return res.status(400).json({
          error: 'Only pending or processing orders can be cancelled'
        });
      }

      order.status = 'cancelled';
      order.cancelledAt = new Date();
      order.cancelReason = cancelReason;

      await order.save();

      res.json({
        message: 'Order cancelled successfully',
        order
      });
    } else {
      res.status(403).json({
        error: 'Customers can only cancel orders'
      });
    }
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Get order statistics
router.get('/stats/summary', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.user._id;

    // Get total orders and amount
    const totalOrders = await Order.countDocuments({ customer: customerId });

    const orderStats = await Order.aggregate([
      { $match: { customer: customerId } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$total' },
          averageAmount: { $avg: '$total' }
        }
      }
    ]);

    // Count by status
    const statusCounts = await Order.aggregate([
      { $match: { customer: customerId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent orders
    const recentOrders = await Order.find({ customer: customerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber total status createdAt');

    res.json({
      totalOrders,
      totalAmount: orderStats[0]?.totalAmount || 0,
      averageAmount: orderStats[0]?.averageAmount || 0,
      statusBreakdown: statusCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentOrders
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ error: 'Failed to fetch order statistics' });
  }
});

// Track order
router.get('/:id/track', authenticateCustomer, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user._id
    }).select('orderNumber status trackingNumber estimatedDelivery deliveredAt shippingAddress');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const trackingInfo = {
      orderNumber: order.orderNumber,
      status: order.status,
      trackingNumber: order.trackingNumber,
      estimatedDelivery: order.estimatedDelivery,
      deliveredAt: order.deliveredAt,
      destination: order.shippingAddress,
      timeline: [
        {
          status: 'pending',
          timestamp: order.createdAt,
          completed: true
        },
        {
          status: 'processing',
          timestamp: order.status !== 'pending' ? order.updatedAt : null,
          completed: ['processing', 'shipped', 'delivered'].includes(order.status)
        },
        {
          status: 'shipped',
          timestamp: order.status === 'shipped' || order.status === 'delivered' ? order.updatedAt : null,
          completed: ['shipped', 'delivered'].includes(order.status)
        },
        {
          status: 'delivered',
          timestamp: order.deliveredAt,
          completed: order.status === 'delivered'
        }
      ]
    };

    res.json(trackingInfo);
  } catch (error) {
    console.error('Error tracking order:', error);
    res.status(500).json({ error: 'Failed to track order' });
  }
});

module.exports = router;
