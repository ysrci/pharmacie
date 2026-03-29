const { Pool } = require('pg');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createAdmin() {
    const email = 'admin@saydaliya.com';
    const password = 'admin123';
    const name = 'مدير النظام (Admin)';
    const hash = await bcrypt.hashSync(password, 10);

    try {
        const userRes = await pool.query(
            'INSERT INTO users (name, email, password_hash, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [name, email, hash, 'pharmacy', '0600000000']
        );
        const userId = userRes.rows[0].id;

        await pool.query(
            'INSERT INTO pharmacies (user_id, name, address, phone, open_hours) VALUES ($1, $2, $3, $4, $5)',
            [userId, 'صيدلية التجربة (Demo)', 'الدار البيضاء، المغرب', '0522000000', '08:00-22:00']
        );

        console.log('✅ Admin Account created successfully!');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
    } catch (err) {
        if (err.code === '23505') {
            console.log('❌ Account already exists.');
        } else {
            console.error(err);
        }
    } finally {
        await pool.end();
    }
}

createAdmin();
