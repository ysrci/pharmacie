const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'saydaliya.db');
const db = new Database(dbPath);

console.log('🚀 Initializing SQLite database at:', dbPath);

try {
    db.transaction(() => {
        // 1. Create Users Table
        console.log('Creating tables...');
        db.prepare(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                phone TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `).run();

        // 2. Create Pharmacies Table
        db.prepare(`
            CREATE TABLE IF NOT EXISTS pharmacies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                address TEXT NOT NULL,
                lat REAL NOT NULL,
                lng REAL NOT NULL,
                phone TEXT,
                open_hours TEXT DEFAULT '08:00-22:00',
                is_active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id)
            );
        `).run();

        // 3. Create Medications Table
        db.prepare(`
            CREATE TABLE IF NOT EXISTS medications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                dosage TEXT,
                barcode TEXT UNIQUE,
                cost_price REAL DEFAULT 0,
                price REAL NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 0,
                min_stock_level INTEGER DEFAULT 5,
                category TEXT NOT NULL DEFAULT 'otc',
                description TEXT,
                expiry_date TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `).run();

        // 4. Create Medication Batches Table
        db.prepare(`
            CREATE TABLE IF NOT EXISTS medication_batches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                medication_id INTEGER NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
                batch_number TEXT NOT NULL,
                expiry_date TEXT NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 0,
                supplier_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `).run();

        // 5. Create Suppliers Table
        db.prepare(`
            CREATE TABLE IF NOT EXISTS suppliers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                contact_name TEXT,
                email TEXT,
                phone TEXT,
                address TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `).run();

        // 6. Create Customers Table
        db.prepare(`
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                phone TEXT,
                email TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `).run();

        // 7. Create Sales Table
        db.prepare(`
            CREATE TABLE IF NOT EXISTS sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
                medication_id INTEGER REFERENCES medications(id) ON DELETE SET NULL,
                batch_id INTEGER REFERENCES medication_batches(id) ON DELETE SET NULL,
                customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
                quantity INTEGER NOT NULL,
                unit_price REAL NOT NULL,
                total_price REAL NOT NULL,
                profit REAL NOT NULL,
                tax_amount REAL DEFAULT 0,
                net_profit REAL NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `).run();

        // 8. Create Profit Settings Table
        db.prepare(`
            CREATE TABLE IF NOT EXISTS profit_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
                default_margin_percentage REAL DEFAULT 25,
                UNIQUE(pharmacy_id)
            );
        `).run();

        // 9. Create Alerts Table
        db.prepare(`
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
                type TEXT NOT NULL,
                message TEXT NOT NULL,
                is_read INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `).run();

        // 10. Create Prescriptions Table
        db.prepare(`
            CREATE TABLE IF NOT EXISTS prescriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
                customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
                medication_id INTEGER REFERENCES medications(id) ON DELETE SET NULL,
                image_url TEXT,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `).run();

        // 11. Create Purchase Orders Table
        db.prepare(`
            CREATE TABLE IF NOT EXISTS purchase_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
                supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
                status TEXT DEFAULT 'pending',
                total_amount REAL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `).run();

        // 12. Create Audit Logs Table
        db.prepare(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
                action TEXT NOT NULL,
                entity_type TEXT,
                entity_id INTEGER,
                details TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `).run();

        // 13. Create Subscriptions Table
        db.prepare(`
            CREATE TABLE IF NOT EXISTS subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
                tier TEXT NOT NULL DEFAULT 'basic',
                status TEXT NOT NULL DEFAULT 'active',
                starts_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                ends_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `).run();
    })();

    console.log('✅ Database initialized successfully!');
} catch (err) {
    console.error('❌ Failed to initialize database:', err);
} finally {
    db.close();
}
