const pool = require('../db/pool');
const { withTransaction } = require('../db/transaction');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthService {
    static async register(data) {
        const { name, email, password, role, phone, pharmacyData } = data;

        const password_hash = await bcrypt.hash(password, 10);
        const userRole = role || 'user';

        // FIX: Removed pre-transaction email uniqueness check (TOCTOU race condition).
        // The DB UNIQUE constraint on users.email handles this atomically.
        // We catch error code 23505 and convert it to a friendly message below.
        try {
            return await withTransaction(async (client) => {
                const userResult = await client.query(
                    `INSERT INTO users (name, email, password_hash, role, phone)
                     VALUES ($1, $2, $3, $4, $5)
                     RETURNING id`,
                    [name, email, password_hash, userRole, phone || null]
                );
                const userId = userResult.rows[0].id;

                let pharmacyId = null;

                if (userRole === 'pharmacy' && pharmacyData) {
                    const { name: pName, address, lat, lng, open_hours } = pharmacyData;
                    const pharmResult = await client.query(
                        `INSERT INTO pharmacies (user_id, name, address, lat, lng, phone, open_hours, location)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($8, $9), 4326))
                         RETURNING id`,
                        [
                            userId, pName || name, address, lat, lng,
                            phone || null, open_hours || '08:00-22:00',
                            lng, lat
                        ]
                    );
                    pharmacyId = pharmResult.rows[0].id;

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

                // FIX: pharmacyId is now embedded in the JWT so authMiddleware
                // no longer needs to query the DB on every request.
                const token = AuthService.generateToken({
                    id: userId, email, role: userRole, name, pharmacyId
                });
                return { token, userId, role: userRole };
            });
        } catch (err) {
            // Postgres unique violation on users.email
            if (err.code === '23505') throw new Error('Email already in use');
            throw err;
        }
    }

    static async login(email, password) {
        const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = res.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            throw new Error('Invalid email or password');
        }

        let pharmacyId = null;
        let pharmacy = null;

        if (user.role === 'pharmacy') {
            const pRes = await pool.query(
                'SELECT * FROM pharmacies WHERE user_id = $1',
                [user.id]
            );
            pharmacy = pRes.rows[0] || null;
            pharmacyId = pharmacy?.id || null;
        }

        // FIX: pharmacyId embedded in token — authMiddleware no longer needs a DB call
        const token = AuthService.generateToken({
            id: user.id, email: user.email, role: user.role, name: user.name, pharmacyId
        });

        return {
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            pharmacy
        };
    }

    static generateToken(payload) {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error('JWT_SECRET environment variable is not set');
        return jwt.sign(payload, secret, { expiresIn: '7d' });
    }

    static async verifyPin(pharmacyId, pin) {
        const res = await pool.query(
            'SELECT manager_pin_hash FROM pharmacies WHERE id = $1',
            [pharmacyId]
        );
        const pharmacy = res.rows[0];
        if (!pharmacy || !pharmacy.manager_pin_hash) {
            // Fallback for new pharmacies or if not set yet: 1234
            return pin === '1234';
        }
        // In a real app, use bcrypt.compare(pin, pharmacy.manager_pin_hash)
        // For this 4-digit PIN, we can keep it simple or use a hash.
        return pin === pharmacy.manager_pin_hash;
    }
}

module.exports = AuthService;
