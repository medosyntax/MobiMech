require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { db } = require('./db');

async function seed() {
  console.log('🌱 Seeding database...\n');

  // --- Admin user ---
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const hash = await bcrypt.hash(password, 12);

  const existingAdmin = db.prepare('SELECT id FROM admin_users WHERE username = ?').get(username);
  if (!existingAdmin) {
    db.prepare(
      'INSERT INTO admin_users (username, password_hash, name, email, role) VALUES (?, ?, ?, ?, ?)'
    ).run(username, hash, 'Admin', 'admin@mobimech.com', 'admin');
    console.log(`✅ Admin user created: ${username} / ${password}`);
  } else {
    console.log('ℹ️  Admin user already exists');
  }

  // --- Services ---
  const serviceCount = db.prepare('SELECT COUNT(*) as c FROM services').get().c;
  if (serviceCount === 0) {
    const services = [
      // Engine
      { name: 'Oil Change', description: 'Full synthetic oil change with filter replacement', category: 'Engine', base_price: 75, duration_minutes: 45 },
      { name: 'Engine Diagnostics', description: 'Complete computer diagnostics and error code reading', category: 'Engine', base_price: 95, duration_minutes: 60 },
      { name: 'Spark Plug Replacement', description: 'Replace all spark plugs with OEM or better parts', category: 'Engine', base_price: 120, duration_minutes: 60 },
      { name: 'Timing Belt Replacement', description: 'Inspect and replace timing belt and tensioner', category: 'Engine', base_price: 450, duration_minutes: 180 },
      { name: 'Coolant Flush', description: 'Complete coolant system flush and refill', category: 'Engine', base_price: 110, duration_minutes: 60 },

      // Brakes
      { name: 'Brake Pad Replacement', description: 'Replace front or rear brake pads with premium pads', category: 'Brakes', base_price: 180, duration_minutes: 90 },
      { name: 'Brake Rotor Replacement', description: 'Replace brake rotors and pads', category: 'Brakes', base_price: 350, duration_minutes: 120 },
      { name: 'Brake Fluid Flush', description: 'Complete brake fluid flush and bleed', category: 'Brakes', base_price: 90, duration_minutes: 45 },

      // Tires
      { name: 'Tire Rotation', description: 'Rotate all four tires for even wear', category: 'Tires', base_price: 40, duration_minutes: 30 },
      { name: 'Flat Tire Repair', description: 'Patch or plug tire puncture', category: 'Tires', base_price: 35, duration_minutes: 30 },
      { name: 'Tire Replacement', description: 'Mount and balance new tire (tire cost not included)', category: 'Tires', base_price: 45, duration_minutes: 45 },

      // Electrical
      { name: 'Battery Replacement', description: 'Test and replace vehicle battery', category: 'Electrical', base_price: 65, duration_minutes: 30 },
      { name: 'Alternator Replacement', description: 'Diagnose and replace faulty alternator', category: 'Electrical', base_price: 350, duration_minutes: 120 },
      { name: 'Starter Motor Replacement', description: 'Replace starter motor', category: 'Electrical', base_price: 300, duration_minutes: 120 },
      { name: 'Light Bulb Replacement', description: 'Replace headlight, taillight, or signal bulbs', category: 'Electrical', base_price: 30, duration_minutes: 20 },

      // Maintenance
      { name: 'Air Filter Replacement', description: 'Replace engine and cabin air filters', category: 'Maintenance', base_price: 45, duration_minutes: 20 },
      { name: 'Wiper Blade Replacement', description: 'Replace front and rear wiper blades', category: 'Maintenance', base_price: 35, duration_minutes: 15 },
      { name: 'Transmission Fluid Change', description: 'Drain and replace transmission fluid', category: 'Maintenance', base_price: 150, duration_minutes: 60 },
      { name: 'Multi-Point Inspection', description: 'Comprehensive vehicle health inspection with report', category: 'Maintenance', base_price: 60, duration_minutes: 45 },
      { name: 'Serpentine Belt Replacement', description: 'Replace serpentine/drive belt', category: 'Maintenance', base_price: 130, duration_minutes: 60 },

      // Suspension
      { name: 'Shock/Strut Replacement', description: 'Replace front or rear shocks or struts', category: 'Suspension', base_price: 400, duration_minutes: 150 },
      { name: 'Wheel Alignment Check', description: 'Check and report on wheel alignment', category: 'Suspension', base_price: 50, duration_minutes: 30 },

      // Emergency
      { name: 'Jump Start', description: 'Emergency jump start service', category: 'Emergency', base_price: 50, duration_minutes: 20 },
      { name: 'Lockout Service', description: 'Emergency vehicle lockout assistance', category: 'Emergency', base_price: 65, duration_minutes: 30 },
      { name: 'Fuel Delivery', description: 'Emergency fuel delivery service', category: 'Emergency', base_price: 55, duration_minutes: 30 },
    ];

    const stmt = db.prepare(
      'INSERT INTO services (name, description, category, base_price, duration_minutes) VALUES (?, ?, ?, ?, ?)'
    );
    const insertMany = db.transaction((items) => {
      for (const s of items) {
        stmt.run(s.name, s.description, s.category, s.base_price, s.duration_minutes);
      }
    });
    insertMany(services);
    console.log(`✅ ${services.length} services created`);
  } else {
    console.log('ℹ️  Services already exist');
  }

  // --- Sample customers + vehicles + bookings (for demo) ---
  const customerCount = db.prepare('SELECT COUNT(*) as c FROM customers').get().c;
  if (customerCount === 0) {
    const sampleCustomers = [
      { name: 'James Wilson', email: 'james.wilson@email.com', phone: '(416) 123-4567', address: '123 Queen St W', city: 'Toronto', province: 'ON', postal_code: 'M5H 2N2' },
      { name: 'Sarah Johnson', email: 'sarah.j@email.com', phone: '(416) 234-5678', address: '456 Yonge St', city: 'Toronto', province: 'ON', postal_code: 'M4Y 1X9' },
      { name: 'Michael Brown', email: 'mbrown@email.com', phone: '(905) 345-6789', address: '789 Main St E', city: 'Hamilton', province: 'ON', postal_code: 'L8N 1A8' },
      { name: 'Emily Davis', email: 'emily.d@email.com', phone: '(905) 456-7890', address: '321 Lakeshore Rd', city: 'Mississauga', province: 'ON', postal_code: 'L5E 1E3' },
      { name: 'Robert Martinez', email: 'rmartinez@email.com', phone: '(613) 567-8901', address: '654 Rideau St', city: 'Ottawa', province: 'ON', postal_code: 'K1N 5Y5' },
    ];

    const custStmt = db.prepare(
      'INSERT INTO customers (name, email, phone, address, city, province, postal_code) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const vehStmt = db.prepare(
      'INSERT INTO vehicles (customer_id, make, model, year, color, license_plate, mileage) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    const sampleVehicles = [
      { make: 'Toyota', model: 'Camry', year: 2021, color: 'Silver', license_plate: 'ABC-1234', mileage: 35000 },
      { make: 'Honda', model: 'CR-V', year: 2020, color: 'Blue', license_plate: 'DEF-5678', mileage: 42000 },
      { make: 'Ford', model: 'F-150', year: 2022, color: 'White', license_plate: 'GHI-9012', mileage: 28000 },
      { make: 'Chevrolet', model: 'Malibu', year: 2019, color: 'Black', license_plate: 'JKL-3456', mileage: 55000 },
      { make: 'BMW', model: '3 Series', year: 2023, color: 'Gray', license_plate: 'MNO-7890', mileage: 15000 },
    ];

    const insertSample = db.transaction(() => {
      sampleCustomers.forEach((c, i) => {
        const result = custStmt.run(c.name, c.email, c.phone, c.address, c.city, c.province, c.postal_code);
        const v = sampleVehicles[i];
        vehStmt.run(result.lastInsertRowid, v.make, v.model, v.year, v.color, v.license_plate, v.mileage);
      });
    });
    insertSample();
    console.log(`✅ ${sampleCustomers.length} sample customers with vehicles created`);

    // Sample bookings
    const bookingStmt = db.prepare(
      `INSERT INTO bookings (reference_number, customer_id, vehicle_id, status, scheduled_date, scheduled_time, location_address, location_city, location_province, location_postal_code, estimated_cost)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const bsStmt = db.prepare(
      'INSERT INTO booking_services (booking_id, service_id, price) VALUES (?, ?, ?)'
    );

    const statuses = ['pending', 'confirmed', 'in-progress', 'completed', 'completed'];
    const dates = ['2026-03-29', '2026-03-30', '2026-03-28', '2026-03-25', '2026-03-20'];
    const times = ['09:00', '14:00', '10:30', '11:00', '15:00'];
    const serviceIds = [1, 6, 12, 3, 19];
    const prices = [75, 180, 65, 120, 60];

    const insertBookings = db.transaction(() => {
      for (let i = 0; i < 5; i++) {
        const c = sampleCustomers[i];
        const ref = `MMC-20260${20 + i}-00${i + 1}`;
        const result = bookingStmt.run(
          ref, i + 1, i + 1, statuses[i], dates[i], times[i],
          c.address, c.city, c.province, c.postal_code, prices[i]
        );
        bsStmt.run(result.lastInsertRowid, serviceIds[i], prices[i]);
      }
    });
    insertBookings();
    console.log('✅ 5 sample bookings created');

    // Sample invoices for completed bookings
    const invStmt = db.prepare(
      `INSERT INTO invoices (invoice_number, booking_id, customer_id, subtotal, tax_rate, tax_amount, total, status, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertInvoices = db.transaction(() => {
      [3, 4].forEach((idx, i) => {
        const subtotal = prices[idx];
        const tax = Math.round(subtotal * 0.13 * 100) / 100;
        const total = subtotal + tax;
        invStmt.run(
          `INV-0000${i + 1}`, idx + 1, idx + 1, subtotal, 0.13, tax, total,
          i === 1 ? 'paid' : 'unpaid',
          '2026-04-15'
        );
      });
    });
    insertInvoices();
    console.log('✅ 2 sample invoices created');
  }

  console.log('\n🎉 Seed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
