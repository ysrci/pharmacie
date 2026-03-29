const { query } = require('../config/db');

class PrescriptionService {
    static async getByCustomer(customerId) {
        const res = await query('SELECT * FROM prescriptions WHERE customer_id = ? ORDER BY created_at DESC', [customerId]);
        return res.rows;
    }

    static async create(customerId, data) {
        const { file_path, type, notes } = data;
        const result = await query(`
            INSERT INTO prescriptions (customer_id, file_path, type, notes)
            VALUES (?, ?, ?, ?) RETURNING id
        `, [customerId, file_path || '', type || 'prescription', notes || '']);

        const id = result.lastInsertId;
        const res = await query('SELECT * FROM prescriptions WHERE id = ?', [id]);
        return res.rows[0];
    }

    static async delete(customerId, id) {
        const result = await query('DELETE FROM prescriptions WHERE id = ? AND customer_id = ?', [id, customerId]);
        if (result.changes === 0) throw new Error('Prescription not found');
        return { success: true };
    }
}

module.exports = PrescriptionService;
