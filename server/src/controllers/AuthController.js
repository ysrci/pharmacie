const AuthService = require('../services/AuthService');
const { registerSchema, loginSchema } = require('../utils/validation');

class AuthController {
    static async register(req, res, next) {
        try {
            const validatedData = registerSchema.parse(req.body);
            const result = await AuthService.register(validatedData);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = loginSchema.parse(req.body);
            const result = await AuthService.login(email, password);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    static async me(req, res, next) {
        try {
            const { id, pharmacyId } = req.user;
            const userRes = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [id]);
            const user = userRes.rows[0];

            if (!user) {
                const error = new Error('User not found');
                error.status = 404;
                error.code = 'USER_NOT_FOUND';
                throw error;
            }

            let pharmacy = null;
            if (pharmacyId) {
                const pharmRes = await pool.query('SELECT * FROM pharmacies WHERE id = $1', [pharmacyId]);
                pharmacy = pharmRes.rows[0] || null;
            }

            res.json({ user, pharmacy });
        } catch (err) {
            next(err);
        }
    }

    static async verifyPin(req, res, next) {
        try {
            const { pin } = req.body;
            const pharmacyId = req.user.pharmacyId;
            if (!pharmacyId) {
                const error = new Error('Pharmacy identity required');
                error.status = 403;
                throw error;
            }

            const isValid = await AuthService.verifyPin(pharmacyId, pin);
            if (isValid) {
                res.json({ success: true });
            } else {
                const error = new Error('Invalid PIN');
                error.status = 401;
                throw error;
            }
        } catch (err) {
            next(err);
        }
    }
}

module.exports = AuthController;
