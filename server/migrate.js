require('dotenv').config();
const { Pool } = require('pg');
const Database = require('better-sqlite3');
const path = require('path');

const sqlitePath = path.join(__dirname, '..', 'saydaliya.db');
const pgUrl = process.env.DATABASE_URL;

if (!pgUrl) {
    console.error('❌ DATABASE_URL missing in .env');
    process.exit(1);
}

const sqlite = new Database(sqlitePath);
const pg = new Pool({ connectionString: pgUrl });

async function migrate() {
    try {
        console.log('🚀 Starting migration...');

        // 1. Enable PostGIS
        await pg.query('CREATE EXTENSION IF NOT EXISTS postgis;');

        // 2. Create Tables
        console.log('📅 Creating tables...');
        await pg.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                phone TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS pharmacies (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                address TEXT NOT NULL,
                location GEOGRAPHY(POINT, 4324), -- PostGIS point
                lat DOUBLE PRECISION NOT NULL,
                lng DOUBLE PRECISION NOT NULL,
                phone TEXT,
                open_hours TEXT DEFAULT '08:00-22:00',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id)
            );

            CREATE TABLE IF NOT EXISTS medications (
                id SERIAL PRIMARY KEY,
                pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                dosage TEXT,
                cost_price DOUBLE PRECISION DEFAULT 0,
                price DOUBLE PRECISION NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 0,
                min_stock_level INTEGER DEFAULT 5,
                category TEXT NOT NULL DEFAULT 'otc',
                description TEXT,
                expiry_date DATE,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS medication_batches (
                id SERIAL PRIMARY KEY,
                medication_id INTEGER NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
                batch_number TEXT NOT NULL,
                expiry_date DATE NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 0,
                supplier_id INTEGER, -- Will reference suppliers table later
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS suppliers (
                id SERIAL PRIMARY KEY,
                pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                contact_name TEXT,
                email TEXT,
                phone TEXT,
                address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS customers (
                id SERIAL PRIMARY KEY,
                pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                phone TEXT,
                email TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS sales (
                id SERIAL PRIMARY KEY,
                pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
                medication_id INTEGER REFERENCES medications(id) ON DELETE SET NULL,
                batch_id INTEGER REFERENCES medication_batches(id) ON DELETE SET NULL,
                customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
                quantity INTEGER NOT NULL,
                unit_price DOUBLE PRECISION NOT NULL,
                total_price DOUBLE PRECISION NOT NULL,
                profit DOUBLE PRECISION NOT NULL,
                tax_amount DOUBLE PRECISION DEFAULT 0,
                net_profit DOUBLE PRECISION NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
                action TEXT NOT NULL,
                entity_type TEXT,
                entity_id INTEGER,
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS subscriptions (
                id SERIAL PRIMARY KEY,
                pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
                tier TEXT NOT NULL DEFAULT 'basic', -- 'basic', 'pro', 'enterprise'
                status TEXT NOT NULL DEFAULT 'active', -- 'active', 'past_due', 'canceled'
                starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ends_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 3. Migrate Data (Simplified example for main tables)
        const tables = ['users', 'pharmacies', 'medications', 'suppliers', 'customers'];

        for (const table of tables) {
            console.log(`📦 Migrating table: ${table}...`);
            const rows = sqlite.prepare(`SELECT * FROM ${table}`).all();
            if (rows.length === 0) continue;

            const columns = Object.keys(rows[0]);
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

            for (const row of rows) {
                const values = Object.values(row);

                // Special handling for PostGIS location in pharmacies
                if (table === 'pharmacies') {
                    const query = `
                        INSERT INTO pharmacies (user_id, name, address, lat, lng, phone, open_hours, is_active, created_at, location)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, ST_SetSRID(ST_MakePoint($5, $4), 4324))
                        ON CONFLICT DO NOTHING
                    `;
                    const pValues = [row.user_id, row.name, row.address, row.lat, row.lng, row.phone, row.open_hours, row.is_active === 1, row.created_at];
                    await pg.query(query, pValues);
                } else {
                    const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
                    await pg.query(query, values);
                }
            }
        }

        console.log('✅ Migration finished successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await pg.end();
        sqlite.close();
    }
}

migrate();
居住
