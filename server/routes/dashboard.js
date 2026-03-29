const express = require('express');
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/stats — admin only
router.get('/stats', authenticateToken, (req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  const totalBookings = db.prepare('SELECT COUNT(*) as c FROM bookings').get().c;
  const pendingBookings = db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status = 'pending'").get().c;
  const confirmedBookings = db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status = 'confirmed'").get().c;
  const inProgressBookings = db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status = 'in-progress'").get().c;
  const completedBookings = db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status = 'completed'").get().c;
  const cancelledBookings = db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status = 'cancelled'").get().c;

  const todayBookings = db.prepare('SELECT COUNT(*) as c FROM bookings WHERE scheduled_date = ?').get(today).c;
  const upcomingBookings = db.prepare(
    "SELECT COUNT(*) as c FROM bookings WHERE scheduled_date >= ? AND status IN ('pending', 'confirmed')"
  ).get(today).c;

  const totalCustomers = db.prepare('SELECT COUNT(*) as c FROM customers').get().c;
  const totalVehicles = db.prepare('SELECT COUNT(*) as c FROM vehicles').get().c;

  const totalRevenue = db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM invoices WHERE status = 'paid'").get().total;
  const unpaidInvoices = db.prepare("SELECT COUNT(*) as c FROM invoices WHERE status = 'unpaid'").get().c;
  const unpaidAmount = db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM invoices WHERE status = 'unpaid'").get().total;

  // Recent bookings
  const recentBookings = db.prepare(
    `SELECT b.id, b.reference_number, b.status, b.scheduled_date, b.scheduled_time, b.estimated_cost,
            c.name as customer_name, v.year as vehicle_year, v.make as vehicle_make, v.model as vehicle_model
     FROM bookings b
     JOIN customers c ON c.id = b.customer_id
     JOIN vehicles v ON v.id = b.vehicle_id
     ORDER BY b.created_at DESC LIMIT 10`
  ).all();

  // Bookings by status for chart
  const statusBreakdown = [
    { status: 'pending', count: pendingBookings },
    { status: 'confirmed', count: confirmedBookings },
    { status: 'in-progress', count: inProgressBookings },
    { status: 'completed', count: completedBookings },
    { status: 'cancelled', count: cancelledBookings },
  ];

  // Revenue last 7 days
  const revenueByDay = db.prepare(
    `SELECT date(created_at) as date, SUM(total) as revenue
     FROM invoices WHERE status = 'paid' AND created_at >= date('now', '-7 days')
     GROUP BY date(created_at) ORDER BY date`
  ).all();

  // Popular services
  const popularServices = db.prepare(
    `SELECT s.name, s.category, COUNT(bs.id) as booking_count, SUM(bs.price) as total_revenue
     FROM booking_services bs
     JOIN services s ON s.id = bs.service_id
     GROUP BY s.id
     ORDER BY booking_count DESC
     LIMIT 10`
  ).all();

  res.json({
    overview: {
      totalBookings,
      todayBookings,
      upcomingBookings,
      totalCustomers,
      totalVehicles,
      totalRevenue,
      unpaidInvoices,
      unpaidAmount,
    },
    statusBreakdown,
    recentBookings,
    revenueByDay,
    popularServices,
  });
});

module.exports = router;
