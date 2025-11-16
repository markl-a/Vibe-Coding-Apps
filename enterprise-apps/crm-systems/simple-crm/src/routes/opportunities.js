const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Get all opportunities
router.get('/', (req, res) => {
  try {
    const { stage, customerId } = req.query;
    let query = `
      SELECT o.*, c.name as customer_name, c.company as customer_company
      FROM opportunities o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.user_id = ?
    `;
    const params = [req.user.userId];

    if (stage) {
      query += ' AND o.stage = ?';
      params.push(stage);
    }
    if (customerId) {
      query += ' AND o.customer_id = ?';
      params.push(customerId);
    }

    query += ' ORDER BY o.created_at DESC';

    const opportunities = db.prepare(query).all(...params);
    res.json({ opportunities, total: opportunities.length });
  } catch (error) {
    console.error('Get opportunities error:', error);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
});

// Get single opportunity
router.get('/:id', (req, res) => {
  try {
    const opportunity = db.prepare(`
      SELECT o.*, c.name as customer_name, c.company as customer_company
      FROM opportunities o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ? AND o.user_id = ?
    `).get(req.params.id, req.user.userId);

    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    res.json(opportunity);
  } catch (error) {
    console.error('Get opportunity error:', error);
    res.status(500).json({ error: 'Failed to fetch opportunity' });
  }
});

// Create opportunity
router.post('/', [
  body('customerId').isInt().withMessage('Customer ID is required'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('probability').optional().isInt({ min: 0, max: 100 }).withMessage('Probability must be between 0 and 100'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { customerId, name, stage, amount, probability, expectedCloseDate, nextSteps } = req.body;

  try {
    // Verify customer ownership
    const customer = db.prepare(`
      SELECT id FROM customers WHERE id = ? AND user_id = ?
    `).get(customerId, req.user.userId);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const result = db.prepare(`
      INSERT INTO opportunities (customer_id, name, stage, amount, probability, expected_close_date, next_steps, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(customerId, name, stage || '探索', amount || 0, probability || 0, expectedCloseDate, nextSteps, req.user.userId);

    const opportunity = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ message: 'Opportunity created successfully', opportunity });
  } catch (error) {
    console.error('Create opportunity error:', error);
    res.status(500).json({ error: 'Failed to create opportunity' });
  }
});

// Update opportunity
router.put('/:id', (req, res) => {
  const { name, stage, amount, probability, expectedCloseDate, nextSteps } = req.body;

  try {
    // Verify ownership
    const existing = db.prepare(`
      SELECT id FROM opportunities WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.userId);

    if (!existing) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    db.prepare(`
      UPDATE opportunities
      SET name = COALESCE(?, name),
          stage = COALESCE(?, stage),
          amount = COALESCE(?, amount),
          probability = COALESCE(?, probability),
          expected_close_date = COALESCE(?, expected_close_date),
          next_steps = COALESCE(?, next_steps),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, stage, amount, probability, expectedCloseDate, nextSteps, req.params.id);

    const opportunity = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(req.params.id);

    res.json({ message: 'Opportunity updated successfully', opportunity });
  } catch (error) {
    console.error('Update opportunity error:', error);
    res.status(500).json({ error: 'Failed to update opportunity' });
  }
});

// Update opportunity stage
router.patch('/:id/stage', [
  body('stage').notEmpty().withMessage('Stage is required'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { stage, probability } = req.body;

  try {
    // Verify ownership
    const existing = db.prepare(`
      SELECT id FROM opportunities WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.userId);

    if (!existing) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    db.prepare(`
      UPDATE opportunities
      SET stage = ?,
          probability = COALESCE(?, probability),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(stage, probability, req.params.id);

    const opportunity = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(req.params.id);

    res.json({ message: 'Opportunity stage updated successfully', opportunity });
  } catch (error) {
    console.error('Update opportunity stage error:', error);
    res.status(500).json({ error: 'Failed to update opportunity stage' });
  }
});

// Delete opportunity
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare(`
      DELETE FROM opportunities WHERE id = ? AND user_id = ?
    `).run(req.params.id, req.user.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    res.json({ message: 'Opportunity deleted successfully' });
  } catch (error) {
    console.error('Delete opportunity error:', error);
    res.status(500).json({ error: 'Failed to delete opportunity' });
  }
});

// Get sales forecast
router.get('/forecast/summary', (req, res) => {
  try {
    const forecast = db.prepare(`
      SELECT
        stage,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        SUM(amount * probability / 100) as weighted_amount
      FROM opportunities
      WHERE user_id = ?
      GROUP BY stage
    `).all(req.user.userId);

    res.json({ forecast });
  } catch (error) {
    console.error('Get forecast error:', error);
    res.status(500).json({ error: 'Failed to get forecast' });
  }
});

module.exports = router;
