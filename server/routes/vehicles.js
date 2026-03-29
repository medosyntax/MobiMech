const express = require('express');
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/vehicles?customer_id=X — admin only
router.get('/', authenticateToken, (req, res) => {
  const { customer_id } = req.query;
  if (customer_id) {
    const vehicles = db.prepare('SELECT * FROM vehicles WHERE customer_id = ?').all(customer_id);
    return res.json(vehicles);
  }
  const vehicles = db.prepare(
    `SELECT v.*, c.name as customer_name FROM vehicles v
     JOIN customers c ON c.id = v.customer_id
     ORDER BY v.created_at DESC`
  ).all();
  res.json(vehicles);
});

// POST /api/vehicles — admin or during booking
router.post('/', (req, res) => {
  const { customer_id, make, model, year, vin, license_plate, color, mileage, notes } = req.body;
  if (!customer_id || !make || !model || !year) {
    return res.status(400).json({ error: 'customer_id, make, model, and year are required' });
  }
  const result = db.prepare(
    'INSERT INTO vehicles (customer_id, make, model, year, vin, license_plate, color, mileage, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(customer_id, make, model, parseInt(year), vin || null, license_plate || null, color || null, mileage ? parseInt(mileage) : null, notes || null);
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(vehicle);
});

// PUT /api/vehicles/:id — admin only
router.put('/:id', authenticateToken, (req, res) => {
  const existing = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Vehicle not found' });

  const { make, model, year, vin, license_plate, color, mileage, notes } = req.body;
  db.prepare(
    'UPDATE vehicles SET make = ?, model = ?, year = ?, vin = ?, license_plate = ?, color = ?, mileage = ?, notes = ? WHERE id = ?'
  ).run(
    make ?? existing.make,
    model ?? existing.model,
    year ?? existing.year,
    vin ?? existing.vin,
    license_plate ?? existing.license_plate,
    color ?? existing.color,
    mileage ?? existing.mileage,
    notes ?? existing.notes,
    req.params.id
  );
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  res.json(vehicle);
});

module.exports = router;
