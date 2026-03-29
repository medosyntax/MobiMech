const express = require('express');
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/services — public, list active services
router.get('/', (req, res) => {
  const { category } = req.query;
  let services;
  if (category) {
    services = db.prepare('SELECT * FROM services WHERE active = 1 AND category = ? ORDER BY category, name').all(category);
  } else {
    services = db.prepare('SELECT * FROM services WHERE active = 1 ORDER BY category, name').all();
  }
  res.json(services);
});

// GET /api/services/categories — list unique categories
router.get('/categories', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT category FROM services WHERE active = 1 ORDER BY category').all();
  res.json(rows.map((r) => r.category));
});

// GET /api/services/all — admin only, include inactive
router.get('/all', authenticateToken, (req, res) => {
  const services = db.prepare('SELECT * FROM services ORDER BY category, name').all();
  res.json(services);
});

// GET /api/services/:id
router.get('/:id', (req, res) => {
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  if (!service) return res.status(404).json({ error: 'Service not found' });
  res.json(service);
});

// POST /api/services — admin only
router.post('/', authenticateToken, (req, res) => {
  const { name, description, category, base_price, duration_minutes } = req.body;
  if (!name || !category || base_price == null) {
    return res.status(400).json({ error: 'Name, category, and base_price are required' });
  }
  const result = db.prepare(
    'INSERT INTO services (name, description, category, base_price, duration_minutes) VALUES (?, ?, ?, ?, ?)'
  ).run(name, description || '', category, base_price, duration_minutes || 60);
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(service);
});

// PUT /api/services/:id — admin only
router.put('/:id', authenticateToken, (req, res) => {
  const existing = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Service not found' });

  const { name, description, category, base_price, duration_minutes, active } = req.body;
  db.prepare(
    'UPDATE services SET name = ?, description = ?, category = ?, base_price = ?, duration_minutes = ?, active = ? WHERE id = ?'
  ).run(
    name ?? existing.name,
    description ?? existing.description,
    category ?? existing.category,
    base_price ?? existing.base_price,
    duration_minutes ?? existing.duration_minutes,
    active ?? existing.active,
    req.params.id
  );
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  res.json(service);
});

// DELETE /api/services/:id — admin only (soft delete)
router.delete('/:id', authenticateToken, (req, res) => {
  const existing = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Service not found' });
  db.prepare('UPDATE services SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Service deactivated' });
});

module.exports = router;
