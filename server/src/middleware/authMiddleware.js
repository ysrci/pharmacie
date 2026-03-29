const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

/**
 * Authentication Middleware: Verifies JWT and attaches user/pharmacy info to request.
 */
const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'saydaliya_super_secret_dev_key_2026');
        req.user = decoded;

        // If user is a pharmacy, attach their pharmacyId for ownership checks
        if (req.user.role === 'pharmacy') {
            const result = await query('SELECT id FROM pharmacies WHERE user_id = ?', [req.user.id]);
            const pharmacy = result.rows[0];
            if (pharmacy) {
                req.user.pharmacyId = pharmacy.id;
            }
        }

        next();
    } catch (err) {
        console.error('Auth Error:', err.message);
        res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
};

/**
 * Middleware: Requires the user to be a registered pharmacy with a valid pharmacyId.
 */
const pharmacyOnly = (req, res, next) => {
    if (req.user.role !== 'pharmacy' || !req.user.pharmacyId) {
        return res.status(403).json({ error: 'Forbidden: Access restricted to registered pharmacies' });
    }
    next();
};

/**
 * RBAC Middleware: Requires a specific role (e.g., 'admin', 'owner', 'staff').
 */
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: `Forbidden: Requires one of these roles: ${roles.join(', ')}` });
        }
        next();
    };
};

/**
 * SaaS Middleware: Checks if the pharmacy has an active subscription.
 */
const checkSubscription = async (req, res, next) => {
    // For now, allow all, but stub for SaaS feature
    // In future: const sub = await query('SELECT status FROM subscriptions WHERE pharmacy_id = ?', [req.user.pharmacyId]);
    next();
};

module.exports = { authMiddleware, pharmacyOnly, requireRole, checkSubscription };
