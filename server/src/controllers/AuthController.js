// server/src/controllers/AuthController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/pool');
const { validate, loginSchema, registerSchema } = require('../utils/validation');

class AuthController {
    /**
     * تسجيل الدخول
     * POST /api/auth/login
     */
    async login(req, res) {
        try {
            // ✅ التحقق من صحة المدخلات
            const { valid, errors, value } = validate(loginSchema, req.body);
            if (!valid) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors
                });
            }
            
            const { email, password } = value;
            
            // البحث عن المستخدم مع ربطه بالصيدلية إذا كان صاحب صيدلية
            const query = `
                SELECT 
                    u.id,
                    u.email,
                    u.password,
                    u.role,
                    u.name,
                    u.phone,
                    p.id as pharmacy_id,
                    p.name as pharmacy_name,
                    p.address as pharmacy_address
                FROM users u
                LEFT JOIN pharmacies p ON u.id = p.owner_id
                WHERE u.email = $1
            `;
            
            const result = await db.query(query, [email]);
            
            if (result.rows.length === 0) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid email or password'
                });
            }
            
            const user = result.rows[0];
            
            // التحقق من كلمة المرور
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid email or password'
                });
            }
            
            // ✅ إنشاء التوكن مع إضافة pharmacy_id إذا وجد
            const tokenPayload = {
                id: user.id,
                email: user.email,
                role: user.role
            };
            
            // إضافة pharmacy_id فقط إذا كان المستخدم صاحب صيدلية
            if (user.pharmacy_id) {
                tokenPayload.pharmacyId = user.pharmacy_id;
            }
            
            const jwtSecret = process.env.JWT_SECRET;
            const token = jwt.sign(
                tokenPayload,
                jwtSecret,
                { expiresIn: '7d' }
            );
            
            // ✅ لا نرسل كلمة المرور أبداً في الرد
            const userResponse = {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
                phone: user.phone
            };
            
            // إضافة بيانات الصيدلية إذا وجدت
            if (user.pharmacy_id) {
                userResponse.pharmacy = {
                    id: user.pharmacy_id,
                    name: user.pharmacy_name,
                    address: user.pharmacy_address
                };
            }
            
            res.json({
                success: true,
                token,
                user: userResponse
            });
            
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                error: 'Login failed. Please try again.'
            });
        }
    }
    
    /**
     * الحصول على بيانات المستخدم الحالي
     * GET /api/auth/me
     */
    async getMe(req, res) {
        try {
            // req.user يتم ملؤه بواسطة middleware authenticate
            const userId = req.user.id;
            
            const query = `
                SELECT 
                    u.id,
                    u.email,
                    u.role,
                    u.name,
                    u.phone,
                    u.created_at,
                    p.id as pharmacy_id,
                    p.name as pharmacy_name,
                    p.address as pharmacy_address,
                    p.phone as pharmacy_phone,
                    p.license_number
                FROM users u
                LEFT JOIN pharmacies p ON u.id = p.owner_id
                WHERE u.id = $1
            `;
            
            const result = await db.query(query, [userId]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }
            
            const user = result.rows[0];
            
            const userResponse = {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
                phone: user.phone,
                createdAt: user.created_at
            };
            
            // ✅ إضافة بيانات الصيدلية إذا كان المستخدم صاحب صيدلية
            if (user.pharmacy_id) {
                userResponse.pharmacy = {
                    id: user.pharmacy_id,
                    name: user.pharmacy_name,
                    address: user.pharmacy_address,
                    phone: user.pharmacy_phone,
                    licenseNumber: user.license_number
                };
            }
            
            res.json({
                success: true,
                data: userResponse
            });
            
        } catch (error) {
            console.error('GetMe error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch user data'
            });
        }
    }
    
    /**
     * تسجيل مستخدم جديد (صاحب صيدلية)
     * POST /api/auth/register
     */
    async register(req, res) {
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');
            
            // ✅ التحقق من صحة المدخلات
            const { valid, errors, value } = validate(registerSchema, req.body);
            if (!valid) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors
                });
            }
            
            const { email, password, name, phone, pharmacyName, pharmacyAddress } = value;
            
            // التحقق من عدم وجود المستخدم مسبقاً
            const existingUser = await client.query(
                'SELECT id FROM users WHERE email = $1',
                [email]
            );
            
            if (existingUser.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(409).json({
                    success: false,
                    error: 'User already exists with this email'
                });
            }
            
            // تشفير كلمة المرور (12 rounds)
            const hashedPassword = await bcrypt.hash(password, 12);
            
            // إنشاء المستخدم
            const userResult = await client.query(
                `INSERT INTO users (email, password, role, name, phone)
                 VALUES ($1, $2, 'pharmacy_owner', $3, $4)
                 RETURNING id, email, role, name, phone`,
                [email, hashedPassword, name, phone]
            );
            
            const user = userResult.rows[0];
            
            // إنشاء الصيدلية
            const pharmacyResult = await client.query(
                `INSERT INTO pharmacies (owner_id, name, address)
                 VALUES ($1, $2, $3)
                 RETURNING id, name, address`,
                [user.id, pharmacyName, pharmacyAddress]
            );
            
            const pharmacy = pharmacyResult.rows[0];
            
            await client.query('COMMIT');
            
            // إنشاء التوكن
            const tokenPayload = {
                id: user.id,
                email: user.email,
                role: user.role,
                pharmacyId: pharmacy.id
            };
            
            const jwtSecret = process.env.JWT_SECRET;
            const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '7d' });
            
            res.status(201).json({
                success: true,
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    name: user.name,
                    phone: user.phone,
                    pharmacy: {
                        id: pharmacy.id,
                        name: pharmacy.name,
                        address: pharmacy.address
                    }
                }
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                error: 'Registration failed. Please try again.'
            });
        } finally {
            client.release();
        }
    }
    
    /**
     * تغيير كلمة المرور
     * POST /api/auth/change-password
     */
    async changePassword(req, res) {
        try {
            const userId = req.user.id;
            const { oldPassword, newPassword } = req.body;
            
            if (!oldPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Old password and new password are required'
                });
            }
            
            if (newPassword.length < 8) {
                return res.status(400).json({
                    success: false,
                    error: 'New password must be at least 8 characters'
                });
            }
            
            // الحصول على كلمة المرور الحالية
            const result = await db.query(
                'SELECT password FROM users WHERE id = $1',
                [userId]
            );
            
            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }
            
            // التحقق من كلمة المرور القديمة
            const isValid = await bcrypt.compare(oldPassword, result.rows[0].password);
            if (!isValid) {
                return res.status(401).json({
                    success: false,
                    error: 'Current password is incorrect'
                });
            }
            
            // تشفير كلمة المرور الجديدة
            const hashedPassword = await bcrypt.hash(newPassword, 12);
            
            // تحديث كلمة المرور
            await db.query(
                'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [hashedPassword, userId]
            );
            
            res.json({
                success: true,
                message: 'Password changed successfully'
            });
            
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to change password'
            });
        }
    }
}

module.exports = new AuthController();
