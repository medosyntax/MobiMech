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



  console.log('\n🎉 Seed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
