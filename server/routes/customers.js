const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/customers — admin only, create customer
router.post(
  '/',
  authenticateToken,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, address, city, province, postal_code, notes } = req.body;

    const existing = db.prepare('SELECT id FROM customers WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'A customer with this email already exists' });
    }

    const result = db.prepare(
      'INSERT INTO customers (name, email, phone, address, city, province, postal_code, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(name, email, phone, address || null, city || null, province || null, postal_code || null, notes || null);

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(customer);
  }
);

// GET /api/customers — admin only
router.get('/', authenticateToken, (req, res) => {
  const { search, page = 1, limit = 25 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let customers, total;
  if (search) {
    const like = `%${search}%`;
    total = db.prepare(
      'SELECT COUNT(*) as c FROM customers WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?'
    ).get(like, like, like).c;
    customers = db.prepare(
      'SELECT * FROM customers WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).all(like, like, like, parseInt(limit), offset);
  } else {
    total = db.prepare('SELECT COUNT(*) as c FROM customers').get().c;
    customers = db.prepare(
      'SELECT * FROM customers ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).all(parseInt(limit), offset);
  }

  res.json({ customers, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

// GET /api/customers/:id — admin only
router.get('/:id', authenticateToken, (req, res) => {
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const vehicles = db.prepare('SELECT * FROM vehicles WHERE customer_id = ?').all(customer.id);
  const bookings = db.prepare(
    `SELECT b.*, GROUP_CONCAT(s.name, ', ') as service_names
     FROM bookings b
     LEFT JOIN booking_services bs ON bs.booking_id = b.id
     LEFT JOIN services s ON s.id = bs.service_id
     WHERE b.customer_id = ?
     GROUP BY b.id
     ORDER BY b.scheduled_date DESC`
  ).all(customer.id);
  const invoices = db.prepare('SELECT * FROM invoices WHERE customer_id = ? ORDER BY created_at DESC').all(customer.id);

  res.json({ ...customer, vehicles, bookings, invoices });
});

// PUT /api/customers/:id — admin only
router.put('/:id', authenticateToken, (req, res) => {
  const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Customer not found' });

  const { name, email, phone, address, city, province, postal_code, notes } = req.body;
  db.prepare(
    `UPDATE customers SET name = ?, email = ?, phone = ?, address = ?, city = ?, province = ?, postal_code = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(
    name ?? existing.name,
    email ?? existing.email,
    phone ?? existing.phone,
    address ?? existing.address,
    city ?? existing.city,
    province ?? existing.province,
    postal_code ?? existing.postal_code,
    notes ?? existing.notes,
    req.params.id
  );
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  res.json(customer);
});

module.exports = router;
