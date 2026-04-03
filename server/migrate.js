require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL');

        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await client.query(schema);
        console.log('Schema applied successfully');

        // Specifically ensure the new column exists if it didn't in the original schema
        await client.query('ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS manager_pin_hash TEXT');
        console.log('Migrations (ALTER) applied');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

migrate();
