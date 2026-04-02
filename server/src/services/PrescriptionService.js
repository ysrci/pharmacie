const pool = require('../db/pool');

class PrescriptionService {
    static async getByCustomer(customerId) {
        const res = await pool.query(
            'SELECT * FROM prescriptions WHERE customer_id = $1 ORDER BY created_at DESC',
            [customerId]
        );
        return res.rows;
    }

    static async create(pharmacyId, customerId, data) {
        const { medications, notes } = data;
        const result = await pool.query(
            `INSERT INTO prescriptions (pharmacy_id, customer_id, medications, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [pharmacyId, customerId, JSON.stringify(medications || []), notes || '']
        );
        return result.rows[0];
    }

    static async delete(customerId, id) {
        const result = await pool.query(
            'DELETE FROM prescriptions WHERE id = $1 AND customer_id = $2 RETURNING id',
            [id, customerId]
        );
        if (result.rowCount === 0) throw new Error('Prescription not found');
        return { success: true };
    }
}

module.exports = PrescriptionService;
