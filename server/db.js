const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'zongedo.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    city TEXT,
    province TEXT,
    postal_code TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    vin TEXT,
    license_plate TEXT,
    color TEXT,
    mileage INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    base_price REAL NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reference_number TEXT UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    vehicle_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    scheduled_date TEXT NOT NULL,
    scheduled_time TEXT NOT NULL,
    location_address TEXT NOT NULL,
    location_city TEXT,
    location_province TEXT,
    location_postal_code TEXT,
    booking_type TEXT DEFAULT 'service',
    diagnostic_notes TEXT,
    notes TEXT,
    admin_notes TEXT,
    estimated_cost REAL,
    assigned_mechanic TEXT,
    started_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  );

  CREATE TABLE IF NOT EXISTS booking_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    price REAL NOT NULL,
    notes TEXT,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id)
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE NOT NULL,
    booking_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    subtotal REAL NOT NULL,
    tax_rate REAL DEFAULT 0.13,
    tax_amount REAL NOT NULL,
    total REAL NOT NULL,
    status TEXT DEFAULT 'unpaid',
    notes TEXT,
    extra_charges TEXT,
    due_date TEXT,
    paid_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER,
    customer_id INTEGER,
    type TEXT NOT NULL,
    subject TEXT,
    body TEXT,
    status TEXT DEFAULT 'sent',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );

  CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(reference_number);
  CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
  CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(scheduled_date);
  CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
  CREATE INDEX IF NOT EXISTS idx_vehicles_customer ON vehicles(customer_id);
  CREATE INDEX IF NOT EXISTS idx_invoices_booking ON invoices(booking_id);
  CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_booking ON notifications(booking_id);
`);

// Helper to generate booking reference numbers
function generateReference() {
  const date = new Date();
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
  const count = db.prepare(
    "SELECT COUNT(*) as c FROM bookings WHERE scheduled_date = date('now')"
  ).get().c;
  const seq = String(count + 1).padStart(3, '0');
  return `ZNG-${datePart}-${seq}`;
}

// Migrate: add extra_charges column if missing
try {
  db.prepare("SELECT extra_charges FROM invoices LIMIT 1").get();
} catch {
  db.exec("ALTER TABLE invoices ADD COLUMN extra_charges TEXT");
}

// Helper to generate invoice numbers
function generateInvoiceNumber() {
  const count = db.prepare('SELECT COUNT(*) as c FROM invoices').get().c;
  const seq = String(count + 1).padStart(5, '0');
  return `INV-${seq}`;
}

module.exports = { db, generateReference, generateInvoiceNumber };
