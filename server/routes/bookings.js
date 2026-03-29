const express = require('express');
const { body, validationResult } = require('express-validator');
const { db, generateReference } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { sendBookingConfirmation, sendStatusUpdate } = require('../email');

const router = express.Router();

// POST /api/bookings — public, create a new booking
router.post(
  '/',
  [
    body('customer_name').trim().notEmpty().withMessage('Name is required'),
    body('customer_email').isEmail().withMessage('Valid email is required'),
    body('customer_phone').trim().notEmpty().withMessage('Phone is required'),
    body('vehicle_make').trim().notEmpty().withMessage('Vehicle make is required'),
    body('vehicle_model').trim().notEmpty().withMessage('Vehicle model is required'),
    body('vehicle_year').isInt({ min: 1900, max: 2030 }).withMessage('Valid vehicle year is required'),
    body('scheduled_date').notEmpty().withMessage('Date is required'),
    body('scheduled_time').notEmpty().withMessage('Time is required'),
    body('location_address').trim().notEmpty().withMessage('Service location is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      customer_name, customer_email, customer_phone,
      customer_address, customer_city, customer_province, customer_postal_code,
      vehicle_make, vehicle_model, vehicle_year, vehicle_color, vehicle_license_plate, vehicle_mileage,
      service_ids, scheduled_date, scheduled_time,
      location_address, location_city, location_province, location_postal_code,
      notes, booking_type, diagnostic_notes,
    } = req.body;

    const isDiagnostic = booking_type === 'diagnostic';

    // Validate: service booking needs at least one service, diagnostic needs notes
    if (!isDiagnostic && (!service_ids || !Array.isArray(service_ids) || service_ids.length === 0)) {
      return res.status(400).json({ error: 'At least one service is required for a service booking' });
    }
    if (isDiagnostic && !diagnostic_notes?.trim()) {
      return res.status(400).json({ error: 'Please describe the issue for a diagnostic booking' });
    }

    try {
      const result = db.transaction(() => {
        // Find or create customer
        let customer = db.prepare('SELECT * FROM customers WHERE email = ?').get(customer_email);
        if (!customer) {
          const custResult = db.prepare(
            'INSERT INTO customers (name, email, phone, address, city, province, postal_code) VALUES (?, ?, ?, ?, ?, ?, ?)'
          ).run(customer_name, customer_email, customer_phone, customer_address || location_address, customer_city || location_city, customer_province || location_province, customer_postal_code || location_postal_code);
          customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(custResult.lastInsertRowid);
        } else {
          // Update phone if changed
          db.prepare('UPDATE customers SET phone = ?, name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(customer_phone, customer_name, customer.id);
          customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer.id);
        }

        // Create vehicle
        const vehResult = db.prepare(
          'INSERT INTO vehicles (customer_id, make, model, year, color, license_plate, mileage) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(customer.id, vehicle_make, vehicle_model, parseInt(vehicle_year), vehicle_color || null, vehicle_license_plate || null, vehicle_mileage ? parseInt(vehicle_mileage) : null);
        const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehResult.lastInsertRowid);

        // Calculate estimated cost
        let services = [];
        let estimatedCost = 0;
        if (!isDiagnostic && service_ids && service_ids.length > 0) {
          const serviceIdList = service_ids.map(Number);
          const placeholders = serviceIdList.map(() => '?').join(',');
          services = db.prepare(`SELECT * FROM services WHERE id IN (${placeholders}) AND active = 1`).all(...serviceIdList);
          estimatedCost = services.reduce((sum, s) => sum + s.base_price, 0);
        } else if (isDiagnostic) {
          // Diagnostic fee
          estimatedCost = 95;
        }

        // Create booking
        const reference = generateReference();
        const bookResult = db.prepare(
          `INSERT INTO bookings (reference_number, customer_id, vehicle_id, status, scheduled_date, scheduled_time, location_address, location_city, location_province, location_postal_code, booking_type, diagnostic_notes, notes, estimated_cost)
           VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(reference, customer.id, vehicle.id, scheduled_date, scheduled_time, location_address, location_city || null, location_province || null, location_postal_code || null, isDiagnostic ? 'diagnostic' : 'service', isDiagnostic ? diagnostic_notes : null, notes || null, estimatedCost);

        const bookingId = bookResult.lastInsertRowid;

        // Link services
        if (services.length > 0) {
          const bsStmt = db.prepare('INSERT INTO booking_services (booking_id, service_id, price) VALUES (?, ?, ?)');
          for (const service of services) {
            bsStmt.run(bookingId, service.id, service.base_price);
          }
        }

        const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
        return { booking, customer, vehicle, services };
      })();

      // Send confirmation email (non-blocking)
      const bookingServices = result.services.map((s) => ({ name: s.name, price: s.base_price }));
      if (bookingServices.length > 0) {
        sendBookingConfirmation(result.booking, result.customer, result.vehicle, bookingServices).catch((err) => {
          console.error('Failed to send booking confirmation email:', err.message);
        });
      }

      // Log notification
      db.prepare(
        'INSERT INTO notifications (booking_id, customer_id, type, subject) VALUES (?, ?, ?, ?)'
      ).run(result.booking.id, result.customer.id, 'booking_confirmation', `Booking Confirmed – ${result.booking.reference_number}`);

      res.status(201).json({
        booking: result.booking,
        customer: { id: result.customer.id, name: result.customer.name, email: result.customer.email },
        vehicle: result.vehicle,
      });
    } catch (err) {
      console.error('Booking creation error:', err);
      res.status(500).json({ error: 'Failed to create booking' });
    }
  }
);

// GET /api/bookings/track?ref=ZNG-xxx&email=xxx — public, track booking
router.get('/track', (req, res) => {
  const { ref, email } = req.query;
  if (!ref || !email) {
    return res.status(400).json({ error: 'Reference number and email are required' });
  }

  const booking = db.prepare(
    `SELECT b.*, c.name as customer_name, c.email as customer_email,
            v.make as vehicle_make, v.model as vehicle_model, v.year as vehicle_year, v.color as vehicle_color
     FROM bookings b
     JOIN customers c ON c.id = b.customer_id
     JOIN vehicles v ON v.id = b.vehicle_id
     WHERE b.reference_number = ? AND c.email = ?`
  ).get(ref.toUpperCase().trim(), email.trim().toLowerCase());

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found. Please check your reference number and email.' });
  }

  const services = db.prepare(
    `SELECT s.name, s.category, bs.price
     FROM booking_services bs
     JOIN services s ON s.id = bs.service_id
     WHERE bs.booking_id = ?`
  ).all(booking.id);

  const invoice = db.prepare('SELECT * FROM invoices WHERE booking_id = ?').get(booking.id);

  res.json({
    reference_number: booking.reference_number,
    status: booking.status,
    scheduled_date: booking.scheduled_date,
    scheduled_time: booking.scheduled_time,
    location_address: booking.location_address,
    location_city: booking.location_city,
    vehicle: `${booking.vehicle_year} ${booking.vehicle_make} ${booking.vehicle_model}`,
    services,
    estimated_cost: booking.estimated_cost,
    invoice: invoice ? { invoice_number: invoice.invoice_number, total: invoice.total, status: invoice.status } : null,
    created_at: booking.created_at,
  });
});

// GET /api/bookings — admin only, list all
router.get('/', authenticateToken, (req, res) => {
  const { status, date, search, page = 1, limit = 25 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = ['1=1'];
  let params = [];

  if (status && status !== 'all') {
    where.push('b.status = ?');
    params.push(status);
  }
  if (date) {
    where.push('b.scheduled_date = ?');
    params.push(date);
  }
  if (search) {
    where.push('(b.reference_number LIKE ? OR c.name LIKE ? OR c.email LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  const whereClause = where.join(' AND ');

  const total = db.prepare(
    `SELECT COUNT(*) as c FROM bookings b JOIN customers c ON c.id = b.customer_id WHERE ${whereClause}`
  ).get(...params).c;

  const bookings = db.prepare(
    `SELECT b.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
            v.make as vehicle_make, v.model as vehicle_model, v.year as vehicle_year,
            COALESCE(GROUP_CONCAT(s.name, ', '), CASE WHEN b.booking_type = 'diagnostic' THEN 'Vehicle Diagnostic' ELSE NULL END) as service_names
     FROM bookings b
     JOIN customers c ON c.id = b.customer_id
     JOIN vehicles v ON v.id = b.vehicle_id
     LEFT JOIN booking_services bs ON bs.booking_id = b.id
     LEFT JOIN services s ON s.id = bs.service_id
     WHERE ${whereClause}
     GROUP BY b.id
     ORDER BY b.scheduled_date DESC, b.scheduled_time DESC
     LIMIT ? OFFSET ?`
  ).all(...params, parseInt(limit), offset);

  res.json({ bookings, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

// GET /api/bookings/:id — admin only
router.get('/:id', authenticateToken, (req, res) => {
  const booking = db.prepare(
    `SELECT b.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
            c.address as customer_address, c.city as customer_city, c.province as customer_province, c.postal_code as customer_postal_code,
            v.make as vehicle_make, v.model as vehicle_model, v.year as vehicle_year,
            v.color as vehicle_color, v.license_plate as vehicle_license_plate, v.mileage as vehicle_mileage, v.vin as vehicle_vin
     FROM bookings b
     JOIN customers c ON c.id = b.customer_id
     JOIN vehicles v ON v.id = b.vehicle_id
     WHERE b.id = ?`
  ).get(req.params.id);

  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const services = db.prepare(
    `SELECT s.id, s.name, s.category, bs.price, bs.notes
     FROM booking_services bs
     JOIN services s ON s.id = bs.service_id
     WHERE bs.booking_id = ?`
  ).all(booking.id);

  const invoice = db.prepare('SELECT * FROM invoices WHERE booking_id = ?').get(booking.id);
  const notifications = db.prepare('SELECT * FROM notifications WHERE booking_id = ? ORDER BY created_at DESC').all(booking.id);

  res.json({ ...booking, services, invoice, notifications });
});

// PUT /api/bookings/:id — admin only, update status and details
router.put('/:id', authenticateToken, async (req, res) => {
  const existing = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Booking not found' });

  const { status, scheduled_date, scheduled_time, admin_notes, assigned_mechanic, estimated_cost } = req.body;

  const newStatus = status || existing.status;
  let started_at = existing.started_at;
  let completed_at = existing.completed_at;

  if (newStatus === 'in-progress' && !existing.started_at) {
    started_at = new Date().toISOString();
  }
  if (newStatus === 'completed' && !existing.completed_at) {
    completed_at = new Date().toISOString();
  }

  db.prepare(
    `UPDATE bookings SET status = ?, scheduled_date = ?, scheduled_time = ?, admin_notes = ?, assigned_mechanic = ?,
     estimated_cost = ?, started_at = ?, completed_at = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(
    newStatus,
    scheduled_date ?? existing.scheduled_date,
    scheduled_time ?? existing.scheduled_time,
    admin_notes ?? existing.admin_notes,
    assigned_mechanic ?? existing.assigned_mechanic,
    estimated_cost ?? existing.estimated_cost,
    started_at,
    completed_at,
    req.params.id
  );

  // Send status notification if changed
  if (status && status !== existing.status) {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(existing.customer_id);
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);

    sendStatusUpdate(booking, customer, status).catch((err) => {
      console.error('Failed to send status update email:', err.message);
    });

    db.prepare(
      'INSERT INTO notifications (booking_id, customer_id, type, subject) VALUES (?, ?, ?, ?)'
    ).run(booking.id, customer.id, 'status_update', `Booking ${status} – ${booking.reference_number}`);
  }

  const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;
