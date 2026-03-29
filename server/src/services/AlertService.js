const { query, isPostgres } = require('../config/db');

class AlertService {
    static async checkExpiringMedications() {
        const thirtyDaysOut = new Date();
        thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);
        const dateStr = thirtyDaysOut.toISOString().split('T')[0];

        // Find batches expiring within 30 days that haven't been notified
        const sql = isPostgres()
            ? `SELECT mb.*, m.name as medication_name, m.pharmacy_id, u.id as user_id
               FROM medication_batches mb
               JOIN medications m ON m.id = mb.medication_id
               JOIN pharmacies p ON p.id = m.pharmacy_id
               JOIN users u ON u.id = p.user_id
               WHERE mb.expiry_date <= $1::date AND mb.quantity > 0`
            : `SELECT mb.*, m.name as medication_name, m.pharmacy_id, u.id as user_id
               FROM medication_batches mb
               JOIN medications m ON m.id = mb.medication_id
               JOIN pharmacies p ON p.id = m.pharmacy_id
               JOIN users u ON u.id = p.user_id
               WHERE mb.expiry_date <= ? AND mb.quantity > 0`;

        const res = await query(sql, [dateStr]);

        const expiringBatches = res.rows;

        for (const batch of expiringBatches) {
            // Check if already notified
            const existingRes = await query('SELECT id FROM alerts WHERE user_id = ? AND message = ? AND is_notified = 1', [batch.user_id, `Medicine ${batch.medication_name} (Batch: ${batch.batch_number}) is expiring on ${batch.expiry_date}`]);

            if (existingRes.rows.length === 0) {
                await query('INSERT INTO alerts (user_id, message) VALUES (?, ?)', [batch.user_id, `Medicine ${batch.medication_name} (Batch: ${batch.batch_number}) is expiring on ${batch.expiry_date}`]);
            }
        }

        return expiringBatches.length;
    }

    static async getMyAlerts(userId) {
        const res = await query('SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC LIMIT 10', [userId]);
        return res.rows;
    }

    static async markAsRead(userId, alertId) {
        await query('UPDATE alerts SET is_notified = 1 WHERE id = ? AND user_id = ?', [alertId, userId]);
    }
}

module.exports = AlertService;
