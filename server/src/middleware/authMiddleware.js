// server/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// التحقق من وجود JWT_SECRET في متغيرات البيئة
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    console.error('❌ FATAL ERROR: JWT_SECRET is not defined in environment variables!');
    console.error('Please create a .env file with JWT_SECRET=your_secure_key');
    // في بيئة الإنتاج، أفضل إيقاف السيرفر
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
}

/**
 * مصادقة المستخدم عبر JWT
 */
const authenticate = (req, res, next) => {
    // استخراج التوكن من Header
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    // التحقق من وجود التوكن
    if (!token) {
        return res.status(401).json({ 
            success: false,
            error: 'Access denied. No token provided.' 
        });
    }
    
    try {
        // التحقق من صحة التوكن
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
        next();
    } catch (error) {
        // معالجة أخطاء التوكن المختلفة
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false,
                error: 'Invalid token.' 
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                error: 'Token expired. Please login again.' 
            });
        }
        // أخطاء غير متوقعة
        console.error('JWT verification error:', error.message);
        return res.status(500).json({ 
            success: false,
            error: 'Authentication error.' 
        });
    }
};

/**
 * التحقق من صلاحيات المسؤول (Admin)
 * يستخدم بعد authenticate
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false,
            error: 'Authentication required first.' 
        });
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false,
            error: 'Access denied. Admin privileges required.' 
        });
    }
    next();
};

/**
 * التحقق من صلاحيات صاحب الصيدلية
 * يسمح للمسؤول ولصاحب الصيدلية
 */
const requirePharmacyOwner = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false,
            error: 'Authentication required first.' 
        });
    }
    
    const allowedRoles = ['pharmacy_owner', 'admin'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
            success: false,
            error: 'Access denied. Pharmacy owner privileges required.' 
        });
    }
    next();
};

/**
 * التحقق من صلاحيات صيدلية محددة
 * @param {string} paramName - اسم المعامل في الـ request (params أو body)
 */
const requireSpecificPharmacy = (paramName = 'pharmacyId') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                error: 'Authentication required first.' 
            });
        }
        
        // المسؤول يمكنه الوصول لكل شيء
        if (req.user.role === 'admin') {
            return next();
        }
        
        // صاحب الصيدلية يمكنه الوصول فقط لصيدليته
        const targetPharmacyId = parseInt(req.params[paramName] || req.body[paramName]);
        if (req.user.pharmacyId !== targetPharmacyId) {
            return res.status(403).json({ 
                success: false,
                error: 'Access denied. You can only access your own pharmacy.' 
            });
        }
        next();
    };
};

module.exports = { 
    authenticate, 
    requireAdmin, 
    requirePharmacyOwner,
    requireSpecificPharmacy
};
