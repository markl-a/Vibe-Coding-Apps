const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const multer = require('multer');
const path = require('path');

// Configure multer for attachments
const upload = multer({
  dest: path.join(__dirname, '../uploads/tickets'),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

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

// Get all tickets for authenticated customer
router.get('/', authenticateCustomer, async (req, res) => {
  try {
    const { status, category, priority, page = 1, limit = 20 } = req.query;

    const query = { customer: req.user._id };

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-comments.isInternal'); // Hide internal comments

    const total = await Ticket.countDocuments(query);

    res.json({
      tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Get ticket by ID
router.get('/:id', authenticateCustomer, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      customer: req.user._id
    }).select('-comments.isInternal');

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Filter out internal comments
    ticket.comments = ticket.comments.filter(comment => !comment.isInternal);

    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// Create new ticket
router.post('/', authenticateCustomer, async (req, res) => {
  try {
    const {
      subject,
      description,
      category,
      priority,
      channel,
      metadata
    } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description are required' });
    }

    const ticket = new Ticket({
      customer: req.user._id,
      subject,
      description,
      category: category || 'general',
      priority: priority || 'medium',
      channel: channel || 'web',
      metadata: metadata || {}
    });

    await ticket.save();

    res.status(201).json({
      message: 'Ticket created successfully',
      ticket
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Add comment to ticket
router.post('/:id/comments', authenticateCustomer, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      customer: req.user._id
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const author = {
      name: req.user.name,
      email: req.user.email,
      role: 'customer'
    };

    const comment = await ticket.addComment(author, content, false);

    res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Close ticket (customer request)
router.patch('/:id/close', authenticateCustomer, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      customer: req.user._id
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    await ticket.close('Closed by customer');

    res.json({
      message: 'Ticket closed successfully',
      ticket
    });
  } catch (error) {
    console.error('Error closing ticket:', error);
    res.status(500).json({ error: 'Failed to close ticket' });
  }
});

// Reopen ticket
router.patch('/:id/reopen', authenticateCustomer, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      customer: req.user._id
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    await ticket.reopen();

    res.json({
      message: 'Ticket reopened successfully',
      ticket
    });
  } catch (error) {
    console.error('Error reopening ticket:', error);
    res.status(500).json({ error: 'Failed to reopen ticket' });
  }
});

// Rate ticket (satisfaction survey)
router.post('/:id/rate', authenticateCustomer, async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      customer: req.user._id
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.status !== 'closed') {
      return res.status(400).json({ error: 'Can only rate closed tickets' });
    }

    ticket.satisfaction = {
      rating,
      feedback: feedback || '',
      ratedAt: new Date()
    };

    await ticket.save();

    res.json({
      message: 'Rating submitted successfully',
      satisfaction: ticket.satisfaction
    });
  } catch (error) {
    console.error('Error rating ticket:', error);
    res.status(500).json({ error: 'Failed to rate ticket' });
  }
});

// Get ticket statistics
router.get('/stats/summary', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.user._id;

    const totalTickets = await Ticket.countDocuments({ customer: customerId });

    // Count by status
    const statusCounts = await Ticket.aggregate([
      { $match: { customer: customerId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Average satisfaction
    const satisfactionStats = await Ticket.aggregate([
      {
        $match: {
          customer: customerId,
          'satisfaction.rating': { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$satisfaction.rating' }
        }
      }
    ]);

    // Recent tickets
    const recentTickets = await Ticket.find({ customer: customerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('ticketNumber subject status priority createdAt');

    res.json({
      totalTickets,
      statusBreakdown: statusCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      averageSatisfaction: satisfactionStats[0]?.averageRating || null,
      recentTickets
    });
  } catch (error) {
    console.error('Error fetching ticket stats:', error);
    res.status(500).json({ error: 'Failed to fetch ticket statistics' });
  }
});

module.exports = router;
