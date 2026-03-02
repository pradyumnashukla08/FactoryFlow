const db = require("../config/db");

/**
 * Versioned migration system.
 *
 * Each migration has a unique version number and a description.
 * Already-applied migrations are tracked in the `schema_migrations` table
 * and are skipped on subsequent runs. This makes migrations safe to run
 * repeatedly (idempotent) and supports incremental schema changes.
 */

// ── Migration definitions ──────────────────────────────
// Add new migrations to the END of this array. Never remove or reorder existing entries.
const migrations = [
  {
    version: 1,
    description: "Create users table",
    sql: `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      phone VARCHAR(15),
      password_hash VARCHAR(255) NOT NULL,
      factory_name VARCHAR(200),
      city VARCHAR(100),
      role VARCHAR(20) DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'staff')),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  },
  {
    version: 2,
    description: "Create customers table",
    sql: `CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(150) NOT NULL,
      company_name VARCHAR(200),
      email VARCHAR(150),
      phone VARCHAR(15) NOT NULL,
      gstin VARCHAR(20),
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(100) DEFAULT 'Maharashtra',
      pincode VARCHAR(10),
      outstanding_balance DECIMAL(12,2) DEFAULT 0.00,
      notes TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  },
  {
    version: 3,
    description: "Create orders table",
    sql: `CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      order_number VARCHAR(50) UNIQUE NOT NULL,
      order_date DATE DEFAULT CURRENT_DATE,
      delivery_date DATE,
      status VARCHAR(30) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'confirmed', 'in_production', 'quality_check', 'ready', 'dispatched', 'delivered', 'cancelled')),
      priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
      items JSONB DEFAULT '[]',
      total_quantity INTEGER DEFAULT 0,
      total_amount DECIMAL(12,2) DEFAULT 0.00,
      tax_amount DECIMAL(12,2) DEFAULT 0.00,
      discount_amount DECIMAL(12,2) DEFAULT 0.00,
      grand_total DECIMAL(12,2) DEFAULT 0.00,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  },
  {
    version: 4,
    description: "Create production_logs table",
    sql: `CREATE TABLE IF NOT EXISTS production_logs (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      log_date DATE DEFAULT CURRENT_DATE,
      units_produced INTEGER DEFAULT 0,
      units_defective INTEGER DEFAULT 0,
      worker_name VARCHAR(100),
      shift VARCHAR(20) DEFAULT 'day' CHECK (shift IN ('day', 'night', 'general')),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  },
  {
    version: 5,
    description: "Create invoices table",
    sql: `CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      invoice_number VARCHAR(50) UNIQUE NOT NULL,
      invoice_date DATE DEFAULT CURRENT_DATE,
      due_date DATE,
      subtotal DECIMAL(12,2) DEFAULT 0.00,
      cgst_rate DECIMAL(5,2) DEFAULT 9.00,
      sgst_rate DECIMAL(5,2) DEFAULT 9.00,
      igst_rate DECIMAL(5,2) DEFAULT 0.00,
      cgst_amount DECIMAL(12,2) DEFAULT 0.00,
      sgst_amount DECIMAL(12,2) DEFAULT 0.00,
      igst_amount DECIMAL(12,2) DEFAULT 0.00,
      total_tax DECIMAL(12,2) DEFAULT 0.00,
      grand_total DECIMAL(12,2) DEFAULT 0.00,
      status VARCHAR(20) DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid', 'overdue', 'cancelled')),
      items JSONB DEFAULT '[]',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  },
  {
    version: 6,
    description: "Create payments table",
    sql: `CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      amount DECIMAL(12,2) NOT NULL,
      payment_date DATE DEFAULT CURRENT_DATE,
      payment_mode VARCHAR(30) DEFAULT 'cash' 
        CHECK (payment_mode IN ('cash', 'upi', 'bank_transfer', 'cheque', 'neft', 'rtgs', 'other')),
      reference_number VARCHAR(100),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  },
  {
    version: 7,
    description: "Create reminders table",
    sql: `CREATE TABLE IF NOT EXISTS reminders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
      invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
      type VARCHAR(30) DEFAULT 'payment_due' 
        CHECK (type IN ('payment_due', 'order_status', 'delivery_reminder', 'custom')),
      message TEXT,
      channel VARCHAR(20) DEFAULT 'email' CHECK (channel IN ('email', 'whatsapp', 'sms')),
      scheduled_at TIMESTAMP,
      sent_at TIMESTAMP,
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  },
  {
    version: 8,
    description: "Create demo_requests table",
    sql: `CREATE TABLE IF NOT EXISTS demo_requests (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      factory_name VARCHAR(200),
      phone VARCHAR(15) NOT NULL,
      email VARCHAR(150) NOT NULL,
      city VARCHAR(100),
      billing_range VARCHAR(50),
      message TEXT,
      status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'demo_scheduled', 'converted', 'closed')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  },
  {
    version: 9,
    description: "Create performance indexes",
    sql: [
      `CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id)`,
      `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`,
      `CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)`,
      `CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date)`,
      `CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id)`,
      `CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id)`,
      `CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status)`,
      `CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_at ON reminders(scheduled_at)`,
      `CREATE INDEX IF NOT EXISTS idx_production_logs_order_id ON production_logs(order_id)`,
      `CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id)`,
    ],
  },
  // ────────────────────────────────────────────────────
  // ADD NEW MIGRATIONS BELOW THIS LINE
  // ────────────────────────────────────────────────────
];

// ── Migration runner ──────────────────────────────
async function runMigrations() {
  console.log("🔄 Running database migrations...\n");

  // 1. Ensure the schema_migrations tracking table exists
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      description VARCHAR(255),
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Get already-applied versions
  const applied = await db.query("SELECT version FROM schema_migrations ORDER BY version");
  const appliedVersions = new Set(applied.rows.map((r) => r.version));

  // 3. Run pending migrations in order
  let pendingCount = 0;
  for (const migration of migrations) {
    if (appliedVersions.has(migration.version)) {
      continue; // Already applied
    }

    try {
      // Support single SQL string or array of SQL strings
      const statements = Array.isArray(migration.sql) ? migration.sql : [migration.sql];

      for (const sql of statements) {
        await db.query(sql);
      }

      // Record as applied
      await db.query("INSERT INTO schema_migrations (version, description) VALUES ($1, $2)", [
        migration.version,
        migration.description,
      ]);

      console.log(`  ✅ v${migration.version}: ${migration.description}`);
      pendingCount++;
    } catch (err) {
      console.error(`  ❌ v${migration.version} (${migration.description}):`, err.message);
      throw err; // Stop on failure — don't skip broken migrations
    }
  }

  if (pendingCount === 0) {
    console.log("  ℹ️  Database is up to date (no pending migrations).");
  }

  console.log(
    `\n✅ Migrations complete! (${appliedVersions.size + pendingCount} total, ${pendingCount} new)\n`,
  );
}

module.exports = runMigrations;

// Run directly if called from CLI
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
