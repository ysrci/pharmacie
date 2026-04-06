// server/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // أضف هذا: npm install helmet
const rateLimit = require('express-rate-limit'); // أضف هذا: npm install express-rate-limit

// ✅ التحقق من وجود JWT_SECRET عند بدء التشغيل
if (!process.env.JWT_SECRET) {
    console.error('❌ FATAL ERROR: JWT_SECRET is not defined.');
    console.error('Please create a .env file with JWT_SECRET=your_secure_key');
    console.error('You can generate a secure key using: openssl rand -hex 64');
    process.exit(1); // يوقف السيرفر إذا كان المفتاح مفقوداً
}

if (process.env.JWT_SECRET === 'your_secure_jwt_secret_here_min_64_characters_replace_with_your_generated_key') {
    console.warn('⚠️ WARNING: You are using the example JWT_SECRET. Please change it!');
}

console.log('✅ JWT_SECRET is properly configured.');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ إضافة Helmet.js لحماية HTTP headers
app.use(helmet());

// ✅ تكوين CORS بشكل آمن
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// ✅ Rate Limiting لمنع هجمات DDoS و Brute Force
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 100, // كل IP يقدر يرسل 100 طلب كحد أقصى
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again after 15 minutes.'
    },
    standardHeaders: true, // إرجاع معلومات الـ Rate Limit في headers
    legacyHeaders: false,
});
app.use('/api/', limiter);

// ✅ Rate Limiting أشد لمسارات المصادقة (تسجيل الدخول)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // فقط 5 محاولات تسجيل دخول كل 15 دقيقة
    skipSuccessfulRequests: true, // لا تحسب المحاولات الناجحة
    message: {
        success: false,
        error: 'Too many login attempts, please try again after 15 minutes.'
    }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// معالجة البيانات بصيغة JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// تسجيل الطلبات في بيئة التطوير
if (process.env.NODE_ENV === 'development') {
    const morgan = require('morgan'); // npm install morgan
    app.use(morgan('dev'));
}

// ========== المسارات (Routes) ==========
const apiRoutes = require('./src/routes/index');
app.use('/api', apiRoutes);

// مسار صحي للتحقق من أن السيرفر يعمل
app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ========== معالجة الأخطاء العامة ==========
// 404 - مسار غير موجود
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Cannot ${req.method} ${req.url} - Route not found`
    });
});

// معالج الأخطاء العام (500)
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    
    // لا ترسل تفاصيل الخطأ في بيئة الإنتاج
    const errorMessage = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;
    
    res.status(500).json({
        success: false,
        error: errorMessage
    });
});

// تشغيل السيرفر
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});
