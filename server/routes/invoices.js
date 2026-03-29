const express = require('express');
const { db, generateInvoiceNumber } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { sendInvoiceEmail } = require('../email');

const router = express.Router();

// GET /api/invoices — admin only
router.get('/', authenticateToken, (req, res) => {
  const { status, search, page = 1, limit = 25 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = ['1=1'];
  let params = [];

  if (status && status !== 'all') {
    where.push('i.status = ?');
    params.push(status);
  }
  if (search) {
    where.push('(i.invoice_number LIKE ? OR c.name LIKE ? OR b.reference_number LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  const whereClause = where.join(' AND ');

  const total = db.prepare(
    `SELECT COUNT(*) as c FROM invoices i
     JOIN customers c ON c.id = i.customer_id
     JOIN bookings b ON b.id = i.booking_id
     WHERE ${whereClause}`
  ).get(...params).c;

  const invoices = db.prepare(
    `SELECT i.*, c.name as customer_name, c.email as customer_email, b.reference_number, b.status as booking_status
     FROM invoices i
     JOIN customers c ON c.id = i.customer_id
     JOIN bookings b ON b.id = i.booking_id
     WHERE ${whereClause}
     ORDER BY i.created_at DESC
     LIMIT ? OFFSET ?`
  ).all(...params, parseInt(limit), offset);

  res.json({ invoices, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

// POST /api/invoices — admin only, create invoice for a booking
router.post('/', authenticateToken, async (req, res) => {
  const { booking_id, tax_rate = 0.13, notes, due_date } = req.body;

  if (!booking_id) {
    return res.status(400).json({ error: 'booking_id is required' });
  }

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking_id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const existingInvoice = db.prepare('SELECT * FROM invoices WHERE booking_id = ?').get(booking_id);
  if (existingInvoice) {
    return res.status(400).json({ error: 'Invoice already exists for this booking', invoice: existingInvoice });
  }

  const services = db.prepare(
    'SELECT s.name, bs.price FROM booking_services bs JOIN services s ON s.id = bs.service_id WHERE bs.booking_id = ?'
  ).all(booking_id);

  let subtotal = services.reduce((sum, s) => sum + s.price, 0);

  // If diagnostic with no services, use the estimated cost (diagnostic fee)
  if (subtotal === 0 && booking.booking_type === 'diagnostic') {
    subtotal = booking.estimated_cost || 95;
    services.push({ name: 'Vehicle Diagnostic', price: subtotal });
  }

  const taxAmount = Math.round(subtotal * tax_rate * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  const invoiceNumber = generateInvoiceNumber();
  const dueDateVal = due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const result = db.prepare(
    `INSERT INTO invoices (invoice_number, booking_id, customer_id, subtotal, tax_rate, tax_amount, total, status, notes, due_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'unpaid', ?, ?)`
  ).run(invoiceNumber, booking_id, booking.customer_id, subtotal, tax_rate, taxAmount, total, notes || null, dueDateVal);

  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(result.lastInsertRowid);
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(booking.customer_id);

  // Send invoice email
  sendInvoiceEmail(invoice, booking, customer, services.map((s) => ({ name: s.name, price: s.price }))).catch((err) => {
    console.error('Failed to send invoice email:', err.message);
  });

  db.prepare(
    'INSERT INTO notifications (booking_id, customer_id, type, subject) VALUES (?, ?, ?, ?)'
  ).run(booking.id, customer.id, 'invoice', `Invoice ${invoiceNumber} – MobiMech`);

  res.status(201).json(invoice);
});

// GET /api/invoices/:id — admin only, full invoice detail
router.get('/:id', authenticateToken, (req, res) => {
  const invoice = db.prepare(
    `SELECT i.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
            c.address as customer_address, c.city as customer_city, c.province as customer_province, c.postal_code as customer_postal_code,
            b.reference_number, b.status as booking_status, b.booking_type, b.diagnostic_notes,
            b.scheduled_date, b.scheduled_time, b.started_at, b.completed_at, b.assigned_mechanic,
            b.location_address, b.location_city, b.location_province, b.location_postal_code,
            v.make as vehicle_make, v.model as vehicle_model, v.year as vehicle_year,
            v.color as vehicle_color, v.license_plate as vehicle_license_plate, v.mileage as vehicle_mileage
     FROM invoices i
     JOIN customers c ON c.id = i.customer_id
     JOIN bookings b ON b.id = i.booking_id
     JOIN vehicles v ON v.id = b.vehicle_id
     WHERE i.id = ?`
  ).get(req.params.id);

  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  const services = db.prepare(
    `SELECT s.name, s.category, bs.price FROM booking_services bs JOIN services s ON s.id = bs.service_id WHERE bs.booking_id = ?`
  ).all(invoice.booking_id);

  // Parse extra_charges JSON
  let extra_charges = [];
  if (invoice.extra_charges) {
    try { extra_charges = JSON.parse(invoice.extra_charges); } catch {}
  }

  // Calculate time taken
  let time_taken = null;
  if (invoice.started_at && invoice.completed_at) {
    const diff = new Date(invoice.completed_at) - new Date(invoice.started_at);
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.round((diff % 3600000) / 60000);
    time_taken = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  res.json({ ...invoice, services, extra_charges, time_taken });
});

// PUT /api/invoices/:id — admin only, update invoice
router.put('/:id', authenticateToken, (req, res) => {
  const existing = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Invoice not found' });

  const { status, notes, paid_date, extra_charges, due_date } = req.body;

  // If extra_charges provided, recalculate totals
  let subtotal = existing.subtotal;
  let taxAmount = existing.tax_amount;
  let total = existing.total;
  let extraChargesJson = existing.extra_charges;

  if (extra_charges !== undefined) {
    extraChargesJson = JSON.stringify(extra_charges);
    // Get original service subtotal from booking
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(existing.booking_id);
    const services = db.prepare(
      'SELECT bs.price FROM booking_services bs WHERE bs.booking_id = ?'
    ).all(existing.booking_id);
    let serviceSubtotal = services.reduce((sum, s) => sum + s.price, 0);
    if (serviceSubtotal === 0 && booking && booking.booking_type === 'diagnostic') {
      serviceSubtotal = booking.estimated_cost || 95;
    }
    const extraTotal = extra_charges.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    subtotal = Math.round((serviceSubtotal + extraTotal) * 100) / 100;
    taxAmount = Math.round(subtotal * existing.tax_rate * 100) / 100;
    total = Math.round((subtotal + taxAmount) * 100) / 100;
  }

  db.prepare(
    `UPDATE invoices SET status = ?, notes = ?, paid_date = ?, extra_charges = ?,
     subtotal = ?, tax_amount = ?, total = ?, due_date = ?
     WHERE id = ?`
  ).run(
    status ?? existing.status,
    notes ?? existing.notes,
    status === 'paid' ? (paid_date || new Date().toISOString().slice(0, 10)) : existing.paid_date,
    extraChargesJson,
    subtotal,
    taxAmount,
    total,
    due_date ?? existing.due_date,
    req.params.id
  );

  // When invoice is marked as paid, set the booking to completed
  if (status === 'paid' && existing.booking_id) {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(existing.booking_id);
    if (booking && booking.status !== 'completed') {
      db.prepare(
        'UPDATE bookings SET status = ?, completed_at = COALESCE(completed_at, ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run('completed', new Date().toISOString(), existing.booking_id);
    }
  }

  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  res.json(invoice);
});

module.exports = router;
