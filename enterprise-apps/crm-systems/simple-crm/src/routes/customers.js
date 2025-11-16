const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all customers
router.get('/', (req, res) => {
  try {
    const { status, rating, industry } = req.query;
    let query = 'SELECT * FROM customers WHERE user_id = ?';
    const params = [req.user.userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (rating) {
      query += ' AND rating = ?';
      params.push(rating);
    }
    if (industry) {
      query += ' AND industry = ?';
      params.push(industry);
    }

    query += ' ORDER BY created_at DESC';

    const customers = db.prepare(query).all(...params);
    res.json({ customers, total: customers.length });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get single customer
router.get('/:id', (req, res) => {
  try {
    const customer = db.prepare(`
      SELECT * FROM customers
      WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.userId);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get related contacts
    const contacts = db.prepare(`
      SELECT * FROM contacts WHERE customer_id = ?
    `).all(customer.id);

    // Get related opportunities
    const opportunities = db.prepare(`
      SELECT * FROM opportunities WHERE customer_id = ?
    `).all(customer.id);

    res.json({ ...customer, contacts, opportunities });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create customer
router.post('/', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').optional().isEmail().withMessage('Invalid email'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, company, email, phone, industry, status, rating, source } = req.body;

  try {
    const result = db.prepare(`
      INSERT INTO customers (name, company, email, phone, industry, status, rating, source, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, company, email, phone, industry, status || '潛在客戶', rating || 'C', source, req.user.userId);

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ message: 'Customer created successfully', customer });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update customer
router.put('/:id', (req, res) => {
  const { name, company, email, phone, industry, status, rating, source } = req.body;

  try {
    // Verify ownership
    const existing = db.prepare(`
      SELECT id FROM customers WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.userId);

    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const result = db.prepare(`
      UPDATE customers
      SET name = COALESCE(?, name),
          company = COALESCE(?, company),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          industry = COALESCE(?, industry),
          status = COALESCE(?, status),
          rating = COALESCE(?, rating),
          source = COALESCE(?, source),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, company, email, phone, industry, status, rating, source, req.params.id);

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);

    res.json({ message: 'Customer updated successfully', customer });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare(`
      DELETE FROM customers WHERE id = ? AND user_id = ?
    `).run(req.params.id, req.user.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

module.exports = router;
