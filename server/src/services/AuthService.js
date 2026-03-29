const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

class AuthService {
    static async register(data) {
        const { name, email, password, role, phone, pharmacyData } = data;

        const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.rows.length > 0) throw new Error('Email already in use');

        const password_hash = bcrypt.hashSync(password, 10);
        const userRole = role || 'user';

        const result = await query('INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?) RETURNING id', [name, email, password_hash, userRole, phone || null]);

        const userId = result.lastInsertId;

        if (userRole === 'pharmacy' && pharmacyData) {
            await query('INSERT INTO pharmacies (user_id, name, address, lat, lng, phone, open_hours, location) VALUES (?, ?, ?, ?, ?, ?, ?, ST_SetSRID(ST_MakePoint(?, ?), 4324))', [
                userId, pharmacyData.name || name, pharmacyData.address, pharmacyData.lat, pharmacyData.lng, phone || null, pharmacyData.open_hours || '08:00-22:00',
                pharmacyData.lng, pharmacyData.lat
            ]);
        }

        const token = this.generateToken({ id: userId, email, role: userRole, name });
        return { token, userId, role: userRole };
    }

    static async login(email, password) {
        const res = await query('SELECT * FROM users WHERE email = ?', [email]);
        const user = res.rows[0];

        if (!user || !bcrypt.compareSync(password, user.password_hash)) {
            throw new Error('Invalid email or password');
        }

        const token = this.generateToken({ id: user.id, email: user.email, role: user.role, name: user.name });

        let pharmacy = null;
        if (user.role === 'pharmacy') {
            const pRes = await query('SELECT * FROM pharmacies WHERE user_id = ?', [user.id]);
            pharmacy = pRes.rows[0];
        }

        return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role }, pharmacy };
    }

    static generateToken(payload) {
        return jwt.sign(payload, process.env.JWT_SECRET || 'saydaliya_secret_key_2024', { expiresIn: '7d' });
    }
}

module.exports = AuthService;
