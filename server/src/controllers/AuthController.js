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
}

module.exports = AuthController;
