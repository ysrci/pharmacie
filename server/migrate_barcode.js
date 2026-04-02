const { query } = require('./src/config/db');

async function migrate() {
    try {
        console.log('🚀 Starting migration: Adding barcode column...');

        // Check if barcode column exists (this is a bit tricky across SQLite and PG without separate logic)
        // We'll just try to add it and catch the error if it exists.

        try {
            await query('ALTER TABLE medications ADD COLUMN barcode TEXT');
            console.log('✅ Added barcode column to medications table.');
        } catch (err) {
            if (err.message.includes('duplicate column') || err.message.includes('already exists')) {
                console.log('ℹ️ Barcode column already exists.');
            } else {
                throw err;
            }
        }

        try {
            await query('CREATE UNIQUE INDEX IF NOT EXISTS idx_medications_barcode ON medications(barcode) WHERE barcode IS NOT NULL');
            console.log('✅ Created unique index on barcode.');
        } catch (err) {
            // Some versions of SQLite or PG might fail on the WHERE clause if barcode is somehow restricted
            console.log('⚠️ Could not create conditional index, attempting simple index...');
            try {
                await query('CREATE UNIQUE INDEX IF NOT EXISTS idx_medications_barcode ON medications(barcode)');
                console.log('✅ Created unique index on barcode.');
            } catch (innerErr) {
                console.error('❌ Failed to create index:', innerErr.message);
            }
        }

        console.log('✨ Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

migrate();
