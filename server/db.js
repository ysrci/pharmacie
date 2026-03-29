const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'saydaliya.db');

function initDB() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'pharmacy')),
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pharmacies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      phone TEXT,
      open_hours TEXT DEFAULT '08:00-22:00',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pharmacy_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      dosage TEXT,
      cost_price REAL DEFAULT 0,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      min_stock_level INTEGER DEFAULT 5,
      category TEXT NOT NULL DEFAULT 'otc' CHECK(category IN ('supplement', 'prescription', 'otc', 'beauty', 'equipment')),
      description TEXT,
      expiry_date DATE,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pharmacy_id INTEGER NOT NULL,
      medication_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      profit REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id) ON DELETE CASCADE,
      FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS profit_settings (
      pharmacy_id INTEGER PRIMARY KEY,
      default_margin_percentage REAL DEFAULT 20,
      FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      medication_name TEXT NOT NULL,
      is_notified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_medications_name ON medications(name);
    CREATE INDEX IF NOT EXISTS idx_medications_pharmacy ON medications(pharmacy_id);
    CREATE INDEX IF NOT EXISTS idx_medications_category ON medications(category);
    CREATE INDEX IF NOT EXISTS idx_sales_pharmacy ON sales(pharmacy_id);
    CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);
    CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);
  `);

  return db;
}

module.exports = { initDB, DB_PATH };
