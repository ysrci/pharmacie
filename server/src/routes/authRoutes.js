// server/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { authenticate } = require('../middleware/authMiddleware');
const { validateRequest, loginSchema, registerSchema } = require('../utils/validation');

// ✅ المسارات العامة
router.post('/register', validateRequest(registerSchema), AuthController.register);
router.post('/login', validateRequest(loginSchema), AuthController.login);

// ✅ المسارات المحمية (تتطلب مصادقة)
router.get('/me', authenticate, AuthController.getMe);
router.post('/change-password', authenticate, AuthController.changePassword);

module.exports = router;
