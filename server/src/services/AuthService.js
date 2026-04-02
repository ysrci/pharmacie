const pool = require('../db/pool');
const { withTransaction } = require('../db/transaction');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthService {
    static async register(data) {
        const { name, email, password, role, phone, pharmacyData } = data;

        const existing = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );
        if (existing.rows.length > 0) throw new Error('Email already in use');

        const password_hash = await bcrypt.hash(password, 10);
        const userRole = role || 'user';

        return withTransaction(async (client) => {
            const userResult = await client.query(
                `INSERT INTO users (name, email, password_hash, role, phone)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id`,
                [name, email, password_hash, userRole, phone || null]
            );
            const userId = userResult.rows[0].id;

            if (userRole === 'pharmacy' && pharmacyData) {
                const { name: pName, address, lat, lng, open_hours } = pharmacyData;
                await client.query(
                    `INSERT INTO pharmacies (user_id, name, address, lat, lng, phone, open_hours, location)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($8, $9), 4326))`,
                    [
                        userId, pName || name, address, lat, lng,
                        phone || null, open_hours || '08:00-22:00',
                        lng, lat
                    ]
                );

                // Get created pharmacy to seed subscription and profit settings
                const pharmResult = await client.query(
                    'SELECT id FROM pharmacies WHERE user_id = $1',
                    [userId]
                );
                const pharmacyId = pharmResult.rows[0].id;

                await client.query(
                    `INSERT INTO subscriptions (pharmacy_id, tier, status)
                     VALUES ($1, 'basic', 'active')
                     ON CONFLICT DO NOTHING`,
                    [pharmacyId]
                );
                await client.query(
                    `INSERT INTO profit_settings (pharmacy_id, default_margin_percentage, default_tva_rate)
                     VALUES ($1, 25, 7)
                     ON CONFLICT DO NOTHING`,
                    [pharmacyId]
                );
            }

            const token = AuthService.generateToken({ id: userId, email, role: userRole, name });
            return { token, userId, role: userRole };
        });
    }

    static async login(email, password) {
        const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = res.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            throw new Error('Invalid email or password');
        }

        const token = AuthService.generateToken({
            id: user.id, email: user.email, role: user.role, name: user.name
        });

        let pharmacy = null;
        if (user.role === 'pharmacy') {
            const pRes = await pool.query(
                'SELECT * FROM pharmacies WHERE user_id = $1',
                [user.id]
            );
            pharmacy = pRes.rows[0] || null;
        }

        return {
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            pharmacy
        };
    }

    static generateToken(payload) {
        return jwt.sign(
            payload,
            process.env.JWT_SECRET || 'saydaliya_secret_key_2024',
            { expiresIn: '7d' }
        );
    }
}

module.exports = AuthService;
