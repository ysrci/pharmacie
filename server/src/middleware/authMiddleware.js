const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

/**
 * Authentication Middleware — Verifies JWT and attaches user/pharmacy info to request.
 */
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const secret = process.env.JWT_SECRET; // No fallback for security
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    } catch (err) {
        const errorMsg = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
        const errorCode = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
        return res.status(401).json({ error: errorMsg, code: errorCode });
    }
};

/**
 * Requires the user to be a registered pharmacy with a valid pharmacyId.
 */
const pharmacyOnly = (req, res, next) => {
    if (req.user?.role !== 'pharmacy' || !req.user?.pharmacyId) {
        return res.status(403).json({ error: 'Forbidden: Pharmacy account required' });
    }
    next();
};

/**
 * RBAC: Requires one of the specified roles.
 * @param {string[]} roles
 */
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: `Forbidden: Requires role(s): ${roles.join(', ')}` });
        }
        next();
    };
};

/**
 * SaaS: Checks active subscription for a given feature.
 * @param {string} feature
 */
const checkSubscription = (feature) => {
    const SubscriptionService = require('../services/SubscriptionService');
    return async (req, res, next) => {
        try {
            const hasAccess = await SubscriptionService.checkAccess(req.user.pharmacyId, feature);
            if (!hasAccess) {
                return res.status(403).json({ error: `Subscription required: ${feature}` });
            }
            next();
        } catch (err) {
            next(err);
        }
    };
};

module.exports = { authMiddleware, pharmacyOnly, requireRole, checkSubscription };
