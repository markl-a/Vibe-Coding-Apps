const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Get all contacts for a customer
router.get('/customer/:customerId', (req, res) => {
  try {
    // Verify customer ownership
    const customer = db.prepare(`
      SELECT id FROM customers WHERE id = ? AND user_id = ?
    `).get(req.params.customerId, req.user.userId);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const contacts = db.prepare(`
      SELECT * FROM contacts WHERE customer_id = ? ORDER BY is_primary DESC, created_at DESC
    `).all(req.params.customerId);

    res.json({ contacts });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Create contact
router.post('/', [
  body('customerId').isInt().withMessage('Customer ID is required'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { customerId, firstName, lastName, email, phone, title, isPrimary } = req.body;

  try {
    // Verify customer ownership
    const customer = db.prepare(`
      SELECT id FROM customers WHERE id = ? AND user_id = ?
    `).get(customerId, req.user.userId);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // If setting as primary, unset other primary contacts
    if (isPrimary) {
      db.prepare(`
        UPDATE contacts SET is_primary = 0 WHERE customer_id = ?
      `).run(customerId);
    }

    const result = db.prepare(`
      INSERT INTO contacts (customer_id, first_name, last_name, email, phone, title, is_primary)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(customerId, firstName, lastName, email, phone, title, isPrimary ? 1 : 0);

    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ message: 'Contact created successfully', contact });
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// Update contact
router.put('/:id', (req, res) => {
  const { firstName, lastName, email, phone, title, isPrimary } = req.body;

  try {
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Verify customer ownership
    const customer = db.prepare(`
      SELECT id FROM customers WHERE id = ? AND user_id = ?
    `).get(contact.customer_id, req.user.userId);

    if (!customer) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // If setting as primary, unset other primary contacts
    if (isPrimary) {
      db.prepare(`
        UPDATE contacts SET is_primary = 0 WHERE customer_id = ? AND id != ?
      `).run(contact.customer_id, req.params.id);
    }

    db.prepare(`
      UPDATE contacts
      SET first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          title = COALESCE(?, title),
          is_primary = COALESCE(?, is_primary)
      WHERE id = ?
    `).run(firstName, lastName, email, phone, title, isPrimary ? 1 : 0, req.params.id);

    const updatedContact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);

    res.json({ message: 'Contact updated successfully', contact: updatedContact });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// Delete contact
router.delete('/:id', (req, res) => {
  try {
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Verify customer ownership
    const customer = db.prepare(`
      SELECT id FROM customers WHERE id = ? AND user_id = ?
    `).get(contact.customer_id, req.user.userId);

    if (!customer) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

module.exports = router;
