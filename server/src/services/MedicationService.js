const { query } = require('../config/db');

class MedicationService {
    static async getAllByPharmacy(pharmacyId, limit = 20, offset = 0, search = '') {
        const queryStr = `
            SELECT m.*, (SELECT COUNT(*) FROM sales WHERE medication_id = m.id) as sales_count 
            FROM medications m
            WHERE m.pharmacy_id = ? AND (m.name LIKE ? OR m.category LIKE ?)
            ORDER BY m.name
            LIMIT ? OFFSET ?
        `;
        const searchPattern = `%${search}%`;
        const res = await query(queryStr, [pharmacyId, searchPattern, searchPattern, limit, offset]);

        // Enhance with batch info
        for (let med of res.rows) {
            const batches = await query('SELECT * FROM medication_batches WHERE medication_id = ? ORDER BY expiry_date ASC', [med.id]);
            med.batches = batches.rows;
            // Verify sync: sum of batch quantities should match med.quantity
            const batchTotal = med.batches.reduce((sum, b) => sum + b.quantity, 0);
            if (batchTotal !== med.quantity) {
                med.sync_warning = true;
            }
        }

        const countQuery = 'SELECT COUNT(*) as count FROM medications WHERE pharmacy_id = ? AND (name LIKE ? OR category LIKE ?)';
        const countRes = await query(countQuery, [pharmacyId, searchPattern, searchPattern]);
        const total = parseInt(countRes.rows[0].count);

        return { rows: res.rows, total };
    }

    static async getSalesHistory(pharmacyId, limit = 50, offset = 0) {
        const queryStr = `
            SELECT s.*, m.name as medication_name, c.name as customer_name
            FROM sales s
            JOIN medications m ON m.id = s.medication_id
            LEFT JOIN customers c ON c.id = s.customer_id
            WHERE s.pharmacy_id = ?
            ORDER BY s.created_at DESC
            LIMIT ? OFFSET ?
        `;
        const res = await query(queryStr, [pharmacyId, limit, offset]);

        const countRes = await query('SELECT COUNT(*) FROM sales WHERE pharmacy_id = ?', [pharmacyId]);
        const total = parseInt(countRes.rows[0].count);

        return { rows: res.rows, total };
    }

    static async addBatch(userId, pharmacyId, medId, data) {
        // Ownership check
        const medRes = await query('SELECT id FROM medications WHERE id = ? AND pharmacy_id = ?', [medId, pharmacyId]);
        if (medRes.rows.length === 0) throw new Error('Medication not found or unauthorized');

        const { batch_number, expiry_date, quantity } = data;

        // In PostgreSQL, we don't have the same sync transactions as better-sqlite3 for now, 
        // but we can use our query helper. (In true PG we'd use BEGIN/COMMIT)
        await query('BEGIN');
        try {
            await query(`
                INSERT INTO medication_batches (medication_id, batch_number, expiry_date, quantity)
                VALUES (?, ?, ?, ?)
            `, [medId, batch_number, expiry_date, quantity]);

            await query('UPDATE medications SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [quantity, medId]);
            await query('COMMIT');

            // Audit Log
            AuditService.log(userId, pharmacyId, 'BATCH_ADDED', 'medication', medId, { batch_number, quantity });
        } catch (e) {
            await query('ROLLBACK');
            throw e;
        }

        return { success: true };
    }

    static async addMedication(userId, pharmacyId, data) {
        const { name, dosage, cost_price, price, quantity, min_stock_level, category, description, expiry_date } = data;

        const result = await query(`
            INSERT INTO medications (
                pharmacy_id, name, dosage, cost_price, price, quantity, 
                min_stock_level, category, description, expiry_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *
        `, [
            pharmacyId, name, dosage || '', cost_price || 0, price,
            quantity || 0, min_stock_level || 5, category || 'otc',
            description || '', expiry_date || null
        ]);

        // Note: PostgreSQL needs RETURNING * to get the row back easily
        if (result.rows.length > 0) return result.rows[0];

        // Fallback for SQLite
        return (await query('SELECT * FROM medications WHERE id = ?', [result.lastInsertId])).rows[0];
    }

    static async updateMedication(pharmacyId, medId, data) {
        // Ownership check
        const medRes = await query('SELECT * FROM medications WHERE id = ? AND pharmacy_id = ?', [medId, pharmacyId]);
        const med = medRes.rows[0];
        if (!med) throw new Error('Medication not found or unauthorized');

        const { name, dosage, cost_price, price, quantity, min_stock_level, category, description, expiry_date } = data;

        await query(`
            UPDATE medications SET 
                name=?, dosage=?, cost_price=?, price=?, quantity=?, 
                min_stock_level=?, category=?, description=?, expiry_date=?, 
                updated_at=CURRENT_TIMESTAMP
            WHERE id = ? AND pharmacy_id = ?
        `, [
            name || med.name, dosage || med.dosage, cost_price ?? med.cost_price,
            price ?? med.price, quantity ?? med.quantity, min_stock_level ?? med.min_stock_level,
            category || med.category, description || med.description,
            expiry_date || med.expiry_date, medId, pharmacyId
        ]);

        return (await query('SELECT * FROM medications WHERE id = ?', [medId])).rows[0];
    }

    static async deleteMedication(pharmacyId, medId) {
        const result = await query('DELETE FROM medications WHERE id = ? AND pharmacy_id = ?', [medId, pharmacyId]);
        if (result.changes === 0) throw new Error('Medication not found or unauthorized');
        return { success: true };
    }

    static async searchMedications(queryOpts) {
        const { q, category, minPrice, maxPrice, lat, lng, radius } = queryOpts;
        let conditions = [];
        let params = [];

        if (q) {
            conditions.push('m.name LIKE ?'); // Use LIKE for SQLite/Postgres compatibility
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

        const sql = `
            SELECT m.*, p.id as pharmacy_id, p.name as pharmacy_name, p.address, 
                   p.lat, p.lng, p.phone as pharmacy_phone, p.open_hours
            FROM medications m
            JOIN pharmacies p ON p.id = m.pharmacy_id
            WHERE p.is_active = 1 AND m.quantity > 0
            ${whereClause}
            ORDER BY m.price ASC
        `;

        const res = await query(sql, params);
        let results = res.rows;

        if (lat && lng && radius) {
            // If using PostGIS and Postgres, we can optimize this later
            // For now, keep fallback Haversine
            const userLat = Number(lat);
            const userLng = Number(lng);
            const maxDist = Number(radius);

            results = results.filter(r => {
                const dist = this.haversine(userLat, userLng, r.lat, r.lng);
                r.distance = Math.round(dist * 100) / 100;
                return dist <= maxDist;
            });

            results.sort((a, b) => a.distance - b.distance);
        }

        return results;
    }

    static haversine(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}

module.exports = MedicationService;
