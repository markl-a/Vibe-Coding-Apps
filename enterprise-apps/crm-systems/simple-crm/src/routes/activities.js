const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Get all activities
router.get('/', (req, res) => {
  try {
    const { customerId, opportunityId, status, type } = req.query;
    let query = `
      SELECT a.*, c.name as customer_name
      FROM activities a
      JOIN customers c ON a.customer_id = c.id
      WHERE a.user_id = ?
    `;
    const params = [req.user.userId];

    if (customerId) {
      query += ' AND a.customer_id = ?';
      params.push(customerId);
    }
    if (opportunityId) {
      query += ' AND a.opportunity_id = ?';
      params.push(opportunityId);
    }
    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }
    if (type) {
      query += ' AND a.type = ?';
      params.push(type);
    }

    query += ' ORDER BY a.due_date DESC, a.created_at DESC';

    const activities = db.prepare(query).all(...params);
    res.json({ activities, total: activities.length });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Get single activity
router.get('/:id', (req, res) => {
  try {
    const activity = db.prepare(`
      SELECT a.*, c.name as customer_name
      FROM activities a
      JOIN customers c ON a.customer_id = c.id
      WHERE a.id = ? AND a.user_id = ?
    `).get(req.params.id, req.user.userId);

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json(activity);
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// Create activity
router.post('/', [
  body('customerId').isInt().withMessage('Customer ID is required'),
  body('type').notEmpty().withMessage('Type is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { customerId, opportunityId, type, subject, description, status, dueDate } = req.body;

  try {
    // Verify customer ownership
    const customer = db.prepare(`
      SELECT id FROM customers WHERE id = ? AND user_id = ?
    `).get(customerId, req.user.userId);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Verify opportunity ownership if provided
    if (opportunityId) {
      const opportunity = db.prepare(`
        SELECT id FROM opportunities WHERE id = ? AND user_id = ?
      `).get(opportunityId, req.user.userId);

      if (!opportunity) {
        return res.status(404).json({ error: 'Opportunity not found' });
      }
    }

    const result = db.prepare(`
      INSERT INTO activities (customer_id, opportunity_id, type, subject, description, status, due_date, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(customerId, opportunityId, type, subject, description, status || '計劃', dueDate, req.user.userId);

    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ message: 'Activity created successfully', activity });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

// Update activity
router.put('/:id', (req, res) => {
  const { type, subject, description, status, dueDate } = req.body;

  try {
    // Verify ownership
    const existing = db.prepare(`
      SELECT id FROM activities WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.userId);

    if (!existing) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    db.prepare(`
      UPDATE activities
      SET type = COALESCE(?, type),
          subject = COALESCE(?, subject),
          description = COALESCE(?, description),
          status = COALESCE(?, status),
          due_date = COALESCE(?, due_date)
      WHERE id = ?
    `).run(type, subject, description, status, dueDate, req.params.id);

    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);

    res.json({ message: 'Activity updated successfully', activity });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

// Mark activity as completed
router.patch('/:id/complete', (req, res) => {
  try {
    // Verify ownership
    const existing = db.prepare(`
      SELECT id FROM activities WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.userId);

    if (!existing) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    db.prepare(`
      UPDATE activities
      SET status = '完成',
          completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id);

    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);

    res.json({ message: 'Activity marked as completed', activity });
  } catch (error) {
    console.error('Complete activity error:', error);
    res.status(500).json({ error: 'Failed to complete activity' });
  }
});

// Delete activity
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare(`
      DELETE FROM activities WHERE id = ? AND user_id = ?
    `).run(req.params.id, req.user.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

module.exports = router;
