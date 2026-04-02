const pool = require('../db/pool');
const { withTransaction } = require('../db/transaction');
const AuditService = require('./AuditService');

class MedicationService {
    /**
     * Get all medications for a pharmacy with their batches.
     * Batches fetched in a single query to avoid N+1.
     */
    static async getAllByPharmacy(pharmacyId, limit = 20, offset = 0, search = '') {
        const searchPattern = `%${search}%`;

        const [dataRes, countRes, batchesRes] = await Promise.all([
            pool.query(
                `SELECT m.*,
                        (SELECT COUNT(*) FROM sales WHERE medication_id = m.id) AS sales_count
                 FROM medications m
                 WHERE m.pharmacy_id = $1
                   AND (m.name ILIKE $2 OR m.category ILIKE $2 OR m.barcode = $3)
                 ORDER BY m.name
                 LIMIT $4 OFFSET $5`,
                [pharmacyId, searchPattern, search, limit, offset]
            ),
            pool.query(
                `SELECT COUNT(*) AS count FROM medications
                 WHERE pharmacy_id = $1 AND (name ILIKE $2 OR category ILIKE $2 OR barcode = $3)`,
                [pharmacyId, searchPattern, search]
            ),
            pool.query(
                `SELECT * FROM medication_batches
                 WHERE medication_id IN (
                     SELECT id FROM medications WHERE pharmacy_id = $1
                 )
                 ORDER BY expiry_date ASC NULLS LAST`,
                [pharmacyId]
            )
        ]);

        // Map batches onto medications in JS (no N+1)
        const batchMap = {};
        for (const batch of batchesRes.rows) {
            if (!batchMap[batch.medication_id]) batchMap[batch.medication_id] = [];
            batchMap[batch.medication_id].push(batch);
        }

        const rows = dataRes.rows.map((med) => {
            const batches = batchMap[med.id] || [];
            const batchTotal = batches.reduce((sum, b) => sum + b.quantity, 0);
            return {
                ...med,
                batches,
                sync_warning: batchTotal !== med.quantity
            };
        });

        return { rows, total: parseInt(countRes.rows[0].count, 10) };
    }

    static async addMedication(userId, pharmacyId, data) {
        const {
            name, dosage, barcode, cost_price, price,
            quantity, min_stock_level, category, description, expiry_date
        } = data;

        const result = await pool.query(
            `INSERT INTO medications (
                pharmacy_id, name, dosage, barcode, cost_price, price,
                quantity, min_stock_level, category, description, expiry_date
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [
                pharmacyId, name, dosage || '', barcode || null,
                cost_price || 0, price,
                quantity || 0, min_stock_level || 5, category || 'otc',
                description || '', expiry_date || null
            ]
        );

        AuditService.log(userId, pharmacyId, 'MED_ADDED', 'medication', result.rows[0].id, { name });
        return result.rows[0];
    }

    static async updateMedication(userId, pharmacyId, medId, data) {
        const medRes = await pool.query(
            'SELECT * FROM medications WHERE id = $1 AND pharmacy_id = $2',
            [medId, pharmacyId]
        );
        const med = medRes.rows[0];
        if (!med) throw new Error('Medication not found or unauthorized');

        const {
            name, dosage, barcode, cost_price, price,
            quantity, min_stock_level, category, description, expiry_date
        } = data;

        const result = await pool.query(
            `UPDATE medications SET
                name            = $1,
                dosage          = $2,
                barcode         = $3,
                cost_price      = $4,
                price           = $5,
                quantity        = $6,
                min_stock_level = $7,
                category        = $8,
                description     = $9,
                expiry_date     = $10,
                updated_at      = NOW()
             WHERE id = $11 AND pharmacy_id = $12
             RETURNING *`,
            [
                name ?? med.name,
                dosage ?? med.dosage,
                barcode !== undefined ? barcode : med.barcode,
                cost_price ?? med.cost_price,
                price ?? med.price,
                quantity ?? med.quantity,
                min_stock_level ?? med.min_stock_level,
                category ?? med.category,
                description ?? med.description,
                expiry_date !== undefined ? (expiry_date || null) : med.expiry_date,
                medId, pharmacyId
            ]
        );

        AuditService.log(userId, pharmacyId, 'MED_UPDATED', 'medication', medId, { name });
        return result.rows[0];
    }

    static async deleteMedication(userId, pharmacyId, medId) {
        const result = await pool.query(
            'DELETE FROM medications WHERE id = $1 AND pharmacy_id = $2 RETURNING id',
            [medId, pharmacyId]
        );
        if (result.rowCount === 0) throw new Error('Medication not found or unauthorized');
        AuditService.log(userId, pharmacyId, 'MED_DELETED', 'medication', medId);
        return { success: true };
    }

    static async addBatch(userId, pharmacyId, medId, data) {
        const { batch_number, expiry_date, quantity } = data;

        // Verify ownership
        const medRes = await pool.query(
            'SELECT id FROM medications WHERE id = $1 AND pharmacy_id = $2',
            [medId, pharmacyId]
        );
        if (medRes.rows.length === 0) throw new Error('Medication not found or unauthorized');

        return withTransaction(async (client) => {
            const batchResult = await client.query(
                `INSERT INTO medication_batches (medication_id, batch_number, expiry_date, quantity)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [medId, batch_number, expiry_date || null, quantity]
            );

            await client.query(
                `UPDATE medications SET quantity = quantity + $1, updated_at = NOW() WHERE id = $2`,
                [quantity, medId]
            );

            AuditService.log(userId, pharmacyId, 'BATCH_ADDED', 'medication', medId, { batch_number, quantity });
            return batchResult.rows[0];
        });
    }

    /**
     * Public medication search with PostGIS-powered distance filtering.
     */
    static async searchMedications(queryOpts) {
        const { q, category, minPrice, maxPrice, lat, lng, radius } = queryOpts;

        let conditions = ["p.is_active = true", "m.quantity > 0"];
        let params = [];
        let paramIndex = 1;

        if (q) {
            conditions.push(`m.name ILIKE $${paramIndex++}`);
            params.push(`%${q}%`);
        }
        if (category && category !== 'all') {
            conditions.push(`m.category = $${paramIndex++}`);
            params.push(category);
        }
        if (minPrice) {
            conditions.push(`m.price >= $${paramIndex++}`);
            params.push(Number(minPrice));
        }
        if (maxPrice) {
            conditions.push(`m.price <= $${paramIndex++}`);
            params.push(Number(maxPrice));
        }

        // PostGIS spatial filter — use ST_DWithin if lat/lng/radius provided
        let distanceSelect = '';
        if (lat && lng && radius) {
            const userLat = Number(lat);
            const userLng = Number(lng);
            const radiusMeters = Number(radius) * 1000; // km → meters

            conditions.push(
                `ST_DWithin(
                    p.location,
                    ST_SetSRID(ST_MakePoint($${paramIndex++}, $${paramIndex++}), 4326)::geography,
                    $${paramIndex++}
                )`
            );
            params.push(userLng, userLat, radiusMeters);

            distanceSelect = `,
                ST_Distance(
                    p.location::geography,
                    ST_SetSRID(ST_MakePoint(${userLng}, ${userLat}), 4326)::geography
                ) / 1000 AS distance_km`;
        }

        const sql = `
            SELECT m.*, p.id AS pharmacy_id, p.name AS pharmacy_name,
                   p.address, p.lat, p.lng, p.phone AS pharmacy_phone, p.open_hours
                   ${distanceSelect}
            FROM medications m
            JOIN pharmacies p ON p.id = m.pharmacy_id
            WHERE ${conditions.join(' AND ')}
            ORDER BY ${lat && lng ? 'distance_km ASC, ' : ''}m.price ASC
        `;

        const res = await pool.query(sql, params);
        return res.rows;
    }
}

module.exports = MedicationService;
