const AuthService = require('../services/AuthService');
const { registerSchema, loginSchema } = require('../utils/validation');

class AuthController {
    static async register(req, res) {
        try {
            const validatedData = registerSchema.parse(req.body);
            const result = await AuthService.register(validatedData);
            res.json(result);
        } catch (err) {
            res.status(400).json({ error: err.errors ? err.errors : err.message });
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = loginSchema.parse(req.body);
            const result = await AuthService.login(email, password);
            res.json(result);
        } catch (err) {
            res.status(401).json({ error: err.errors ? err.errors : err.message });
        }
    }

    static async me(req, res) {
        // req.user is attached by authMiddleware
        res.json({ user: req.user });
    }

    static async verifyPin(req, res) {
        try {
            const { pin } = req.body;
            const pharmacyId = req.user.pharmacyId;
            if (!pharmacyId) return res.status(403).json({ error: 'Pharmacy identity required' });

            const isValid = await AuthService.verifyPin(pharmacyId, pin);
            if (isValid) {
                res.json({ success: true });
            } else {
                res.status(401).json({ error: 'Invalid PIN' });
            }
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = AuthController;
