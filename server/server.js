const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { initDB } = require('./db');

const app = express();
const db = initDB();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'saydaliya_secret_key_2024';

app.use(cors());
app.use(express.json());

// ─── Auth Middleware ──────────────────────────────────────────
function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'غير مصرح' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'رمز غير صالح' });
    }
}

function pharmacyOnly(req, res, next) {
    if (req.user.role !== 'pharmacy') return res.status(403).json({ error: 'متاح فقط للصيدليات' });
    next();
}

// ─── AUTH ROUTES ──────────────────────────────────────────────
app.post('/api/auth/register', (req, res) => {
    try {
        const { name, email, password, role, phone, pharmacyData } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'يرجى ملء جميع الحقول المطلوبة' });
        }

        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) return res.status(400).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });

        const password_hash = bcrypt.hashSync(password, 10);
        const userRole = role || 'user';

        const result = db.prepare('INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)')
            .run(name, email, password_hash, userRole, phone || null);

        const userId = result.lastInsertRowid;

        // If registering as pharmacy, create pharmacy record
        if (userRole === 'pharmacy' && pharmacyData) {
            db.prepare('INSERT INTO pharmacies (user_id, name, address, lat, lng, phone, open_hours) VALUES (?, ?, ?, ?, ?, ?, ?)')
                .run(userId, pharmacyData.name || name, pharmacyData.address, pharmacyData.lat, pharmacyData.lng, phone || null, pharmacyData.open_hours || '08:00-22:00');
        }

        const token = jwt.sign({ id: userId, email, role: userRole, name }, JWT_SECRET, { expiresIn: '7d' });

        let pharmacy = null;
        if (userRole === 'pharmacy') {
            pharmacy = db.prepare('SELECT * FROM pharmacies WHERE user_id = ?').get(userId);
        }

        res.json({ token, user: { id: userId, name, email, role: userRole, phone }, pharmacy });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user || !bcrypt.compareSync(password, user.password_hash)) {
            return res.status(401).json({ error: 'بريد إلكتروني أو كلمة مرور خاطئة' });
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

        let pharmacy = null;
        if (user.role === 'pharmacy') {
            pharmacy = db.prepare('SELECT * FROM pharmacies WHERE user_id = ?').get(user.id);
        }

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone }, pharmacy });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
    const user = db.prepare('SELECT id, name, email, role, phone FROM users WHERE id = ?').get(req.user.id);
    let pharmacy = null;
    if (user?.role === 'pharmacy') {
        pharmacy = db.prepare('SELECT * FROM pharmacies WHERE user_id = ?').get(user.id);
    }
    res.json({ user, pharmacy });
});

// ─── PHARMACY ROUTES ─────────────────────────────────────────
app.get('/api/pharmacies', (req, res) => {
    try {
        const pharmacies = db.prepare(`
      SELECT p.*, u.email,
        (SELECT COUNT(*) FROM medications m WHERE m.pharmacy_id = p.id AND m.quantity > 0) as med_count
      FROM pharmacies p
      JOIN users u ON u.id = p.user_id
      WHERE p.is_active = 1
    `).all();
        res.json(pharmacies);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.get('/api/pharmacies/:id', (req, res) => {
    try {
        const pharmacy = db.prepare(`
      SELECT p.*, u.email
      FROM pharmacies p
      JOIN users u ON u.id = p.user_id
      WHERE p.id = ?
    `).get(req.params.id);

        if (!pharmacy) return res.status(404).json({ error: 'الصيدلية غير موجودة' });

        const medications = db.prepare('SELECT * FROM medications WHERE pharmacy_id = ? ORDER BY name').all(req.params.id);
        res.json({ ...pharmacy, medications });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// ─── MEDICATION ROUTES ────────────────────────────────────────
app.get('/api/medications/search', (req, res) => {
    try {
        const { q, category, minPrice, maxPrice, lat, lng, radius } = req.query;
        let conditions = [];
        let params = [];

        if (q) {
            conditions.push('m.name LIKE ?');
            params.push(`%${q}%`);
        }
        if (category && category !== 'all') {
            conditions.push('m.category = ?');
            params.push(category);
        }
        if (minPrice) {
            conditions.push('m.price >= ?');
            params.push(Number(minPrice));
        }
        if (maxPrice) {
            conditions.push('m.price <= ?');
            params.push(Number(maxPrice));
        }

        const whereClause = conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : '';

        let query = `
      SELECT m.*, p.id as pharmacy_id, p.name as pharmacy_name, p.address, p.lat, p.lng, p.phone as pharmacy_phone, p.open_hours
      FROM medications m
      JOIN pharmacies p ON p.id = m.pharmacy_id
      WHERE p.is_active = 1 AND m.quantity > 0
      ${whereClause}
      ORDER BY m.price ASC
    `;

        let results = db.prepare(query).all(...params);

        // Filter by distance if user location provided
        if (lat && lng && radius) {
            const userLat = Number(lat);
            const userLng = Number(lng);
            const maxDist = Number(radius); // in km

            results = results.filter(r => {
                const dist = haversine(userLat, userLng, r.lat, r.lng);
                r.distance = Math.round(dist * 100) / 100;
                return dist <= maxDist;
            });

            results.sort((a, b) => a.distance - b.distance);
        }

        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// Pharmacy: manage their own medications
app.get('/api/pharmacy/medications', authMiddleware, pharmacyOnly, (req, res) => {
    try {
        const pharmacy = db.prepare('SELECT id FROM pharmacies WHERE user_id = ?').get(req.user.id);
        if (!pharmacy) return res.status(404).json({ error: 'لم يتم العثور على الصيدلية' });

        const meds = db.prepare('SELECT *, (SELECT COUNT(*) FROM sales WHERE medication_id = medications.id) as sales_count FROM medications WHERE pharmacy_id = ? ORDER BY name').all(pharmacy.id);
        res.json(meds);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.post('/api/pharmacy/medications', authMiddleware, pharmacyOnly, (req, res) => {
    try {
        const pharmacy = db.prepare('SELECT id FROM pharmacies WHERE user_id = ?').get(req.user.id);
        if (!pharmacy) return res.status(404).json({ error: 'لم يتم العثور على الصيدلية' });

        const { name, dosage, cost_price, price, quantity, min_stock_level, category, description, expiry_date } = req.body;
        if (!name || price === undefined) {
            return res.status(400).json({ error: 'يرجى ملء الحقول المطلوبة' });
        }

        const result = db.prepare(
            'INSERT INTO medications (pharmacy_id, name, dosage, cost_price, price, quantity, min_stock_level, category, description, expiry_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(pharmacy.id, name, dosage || '', cost_price || 0, price, quantity || 0, min_stock_level || 5, category || 'otc', description || '', expiry_date || null);

        const med = db.prepare('SELECT * FROM medications WHERE id = ?').get(result.lastInsertRowid);
        res.json(med);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.put('/api/pharmacy/medications/:id', authMiddleware, pharmacyOnly, (req, res) => {
    try {
        const pharmacy = db.prepare('SELECT id FROM pharmacies WHERE user_id = ?').get(req.user.id);
        if (!pharmacy) return res.status(404).json({ error: 'لم يتم العثور على الصيدلية' });

        const med = db.prepare('SELECT * FROM medications WHERE id = ? AND pharmacy_id = ?').get(req.params.id, pharmacy.id);
        if (!med) return res.status(404).json({ error: 'الدواء غير موجود' });

        const { name, dosage, cost_price, price, quantity, min_stock_level, category, description, expiry_date } = req.body;
        db.prepare(`
      UPDATE medications SET name=?, dosage=?, cost_price=?, price=?, quantity=?, min_stock_level=?, category=?, description=?, expiry_date=?, updated_at=CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
            name || med.name,
            dosage || med.dosage,
            cost_price ?? med.cost_price,
            price ?? med.price,
            quantity ?? med.quantity,
            min_stock_level ?? med.min_stock_level,
            category || med.category,
            description || med.description,
            expiry_date || med.expiry_date,
            req.params.id
        );

        const updated = db.prepare('SELECT * FROM medications WHERE id = ?').get(req.params.id);
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.delete('/api/pharmacy/medications/:id', authMiddleware, pharmacyOnly, (req, res) => {
    try {
        const pharmacy = db.prepare('SELECT id FROM pharmacies WHERE user_id = ?').get(req.user.id);
        if (!pharmacy) return res.status(404).json({ error: 'لم يتم العثور على الصيدلية' });

        const med = db.prepare('SELECT * FROM medications WHERE id = ? AND pharmacy_id = ?').get(req.params.id, pharmacy.id);
        if (!med) return res.status(404).json({ error: 'الدواء غير موجود' });

        db.prepare('DELETE FROM medications WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});
// ─── PMS SALES & STATS ROUTES ──────────────────────────────────
app.post('/api/pharmacy/sales', authMiddleware, pharmacyOnly, (req, res) => {
    try {
        const pharmacy = db.prepare('SELECT id FROM pharmacies WHERE user_id = ?').get(req.user.id);
        const { medication_id, quantity } = req.body;

        const med = db.prepare('SELECT * FROM medications WHERE id = ? AND pharmacy_id = ?').get(medication_id, pharmacy.id);
        if (!med || med.quantity < quantity) {
            return res.status(400).json({ error: 'المخزون غير كافٍ' });
        }

        const totalPrice = med.price * quantity;
        const totalCost = med.cost_price * quantity;
        const profit = totalPrice - totalCost;

        const transaction = db.transaction(() => {
            db.prepare('INSERT INTO sales (pharmacy_id, medication_id, quantity, unit_price, total_price, profit) VALUES (?, ?, ?, ?, ?, ?)')
                .run(pharmacy.id, medication_id, quantity, med.price, totalPrice, profit);

            db.prepare('UPDATE medications SET quantity = quantity - ? WHERE id = ?')
                .run(quantity, medication_id);
        });

        transaction();
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.get('/api/pharmacy/sales', authMiddleware, pharmacyOnly, (req, res) => {
    try {
        const pharmacy = db.prepare('SELECT id FROM pharmacies WHERE user_id = ?').get(req.user.id);
        const sales = db.prepare(`
            SELECT s.*, m.name as medication_name 
            FROM sales s 
            JOIN medications m ON m.id = s.medication_id 
            WHERE s.pharmacy_id = ? 
            ORDER BY s.created_at DESC
        `).all(pharmacy.id);
        res.json(sales);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.get('/api/pharmacy/stats', authMiddleware, pharmacyOnly, (req, res) => {
    try {
        const pharmacy = db.prepare('SELECT id FROM pharmacies WHERE user_id = ?').get(req.user.id);

        const overall = db.prepare(`
            SELECT 
                SUM(total_price) as total_sales,
                SUM(profit) as total_profit,
                COUNT(*) as transactions_count
            FROM sales WHERE pharmacy_id = ?
        `).get(pharmacy.id);

        const daily = db.prepare(`
            SELECT date(created_at) as date, SUM(total_price) as sales, SUM(profit) as profit
            FROM sales 
            WHERE pharmacy_id = ? AND created_at >= date('now', '-30 days')
            GROUP BY date(created_at)
            ORDER BY date
        `).all(pharmacy.id);

        const topProducts = db.prepare(`
            SELECT m.name, SUM(s.quantity) as sold
            FROM sales s
            JOIN medications m ON m.id = s.medication_id
            WHERE s.pharmacy_id = ?
            GROUP BY s.medication_id
            ORDER BY sold DESC LIMIT 5
        `).all(pharmacy.id);

        const lowStock = db.prepare(`
            SELECT name, quantity, min_stock_level 
            FROM medications 
            WHERE pharmacy_id = ? AND quantity <= min_stock_level
        `).all(pharmacy.id);

        res.json({ overall, daily, topProducts, lowStock });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.get('/api/pharmacy/profit-settings', authMiddleware, pharmacyOnly, (req, res) => {
    try {
        const pharmacy = db.prepare('SELECT id FROM pharmacies WHERE user_id = ?').get(req.user.id);
        let settings = db.prepare('SELECT * FROM profit_settings WHERE pharmacy_id = ?').get(pharmacy.id);
        if (!settings) {
            db.prepare('INSERT INTO profit_settings (pharmacy_id, default_margin_percentage) VALUES (?, ?)').run(pharmacy.id, 25);
            settings = { pharmacy_id: pharmacy.id, default_margin_percentage: 25 };
        }
        res.json(settings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.put('/api/pharmacy/profit-settings', authMiddleware, pharmacyOnly, (req, res) => {
    try {
        const pharmacy = db.prepare('SELECT id FROM pharmacies WHERE user_id = ?').get(req.user.id);
        const { default_margin_percentage } = req.body;
        db.prepare('UPDATE profit_settings SET default_margin_percentage = ? WHERE pharmacy_id = ?')
            .run(default_margin_percentage, pharmacy.id);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});
// ─── ALERTS ROUTES ────────────────────────────────────────────
app.get('/api/alerts', authMiddleware, (req, res) => {
    try {
        const alerts = db.prepare('SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
        res.json(alerts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.post('/api/alerts', authMiddleware, (req, res) => {
    try {
        const { medication_name } = req.body;
        if (!medication_name) return res.status(400).json({ error: 'يرجى تحديد اسم الدواء' });

        // Check if already exists
        const existing = db.prepare('SELECT * FROM alerts WHERE user_id = ? AND medication_name = ? AND is_notified = 0').get(req.user.id, medication_name);
        if (existing) return res.status(400).json({ error: 'تم إنشاء تنبيه لهذا الدواء مسبقاً' });

        // Check if the medication is actually available now
        const available = db.prepare('SELECT COUNT(*) as count FROM medications WHERE name LIKE ? AND quantity > 0').get(`%${medication_name}%`);
        if (available.count > 0) {
            return res.json({ already_available: true, message: 'هذا الدواء متوفر حالياً في بعض الصيدليات' });
        }

        const result = db.prepare('INSERT INTO alerts (user_id, medication_name) VALUES (?, ?)').run(req.user.id, medication_name);
        const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(result.lastInsertRowid);
        res.json(alert);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.delete('/api/alerts/:id', authMiddleware, (req, res) => {
    try {
        db.prepare('DELETE FROM alerts WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

app.get('/api/alerts/check', authMiddleware, (req, res) => {
    try {
        const alerts = db.prepare('SELECT * FROM alerts WHERE user_id = ? AND is_notified = 1').all(req.user.id);
        res.json(alerts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// ─── HAVERSINE FORMULA ────────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── START SERVER ─────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🏥 Saydaliya API running on http://localhost:${PORT}`);
});
