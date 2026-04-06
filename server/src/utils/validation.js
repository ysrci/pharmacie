// server/src/utils/validation.js
const Joi = require('joi'); // npm install joi

// ✅ مخطط التحقق من البحث
const searchQuerySchema = Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
    radius: Joi.number().min(1).max(50000).default(5000),
    medicationName: Joi.string().max(100).pattern(/^[a-zA-Z0-9\s\-]+$/).optional(),
    category: Joi.string().max(50).optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional()
});

// ✅ مخطط التحقق من تسجيل الدخول
const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(100).required()
});

// ✅ مخطط التحقق من التسجيل
const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(100).required(),
    name: Joi.string().min(2).max(100).required(),
    phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional(),
    pharmacyName: Joi.string().min(2).max(200).required(),
    pharmacyAddress: Joi.string().min(5).max(500).required()
});

// ✅ مخطط التحقق من إضافة دواء
const medicationSchema = Joi.object({
    name: Joi.string().min(2).max(200).required(),
    genericName: Joi.string().min(2).max(200).optional(),
    category: Joi.string().max(50).required(),
    description: Joi.string().max(1000).optional(),
    batchNumber: Joi.string().max(50).required(),
    expiryDate: Joi.date().greater('now').required(),
    quantity: Joi.number().integer().min(1).max(10000).required(),
    price: Joi.number().min(0).max(100000).required()
});

// ✅ وظيفة التحقق من صحة المدخلات
const validate = (schema, data) => {
    const { error, value } = schema.validate(data, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return { valid: false, errors };
    }
    return { valid: true, value };
};

// ✅ Middleware للتحقق من صحة الطلبات
const validateRequest = (schema, property = 'body') => {
    return (req, res, next) => {
        const { valid, errors, value } = validate(schema, req[property]);
        if (!valid) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors
            });
        }
        req[property] = value; // استبدال البيانات بالبيانات المنقاة
        next();
    };
};

module.exports = {
    searchQuerySchema,
    loginSchema,
    registerSchema,
    medicationSchema,
    validate,
    validateRequest
};
