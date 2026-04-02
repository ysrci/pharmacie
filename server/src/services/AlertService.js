const pool = require('../db/pool');

class AlertService {
    /**
     * Check for batches expiring within the next 30 days and insert an alert
     * if one has not already been created for that batch.
     */
    static async checkExpiringMedications() {
        const res = await pool.query(
            `SELECT mb.*, m.name AS medication_name, m.pharmacy_id
             FROM medication_batches mb
             JOIN medications m ON m.id = mb.medication_id
             JOIN pharmacies p ON p.id = m.pharmacy_id
             WHERE mb.expiry_date <= (NOW() + INTERVAL '30 days')::date
               AND mb.quantity > 0`
        );

        const expiringBatches = res.rows;

        for (const batch of expiringBatches) {
            const message = `Medicine ${batch.medication_name} (Batch: ${batch.batch_number}) is expiring on ${batch.expiry_date}`;

            // Insert only if this exact message hasn't been created yet (unread or read)
            await pool.query(
                `INSERT INTO alerts (pharmacy_id, message, type)
                 SELECT $1, $2, 'expiry'
                 WHERE NOT EXISTS (
                     SELECT 1 FROM alerts
                     WHERE pharmacy_id = $1 AND message = $2
                 )`,
                [batch.pharmacy_id, message]
            );
        }

        return expiringBatches.length;
    }

    static async checkLowStock() {
        const res = await pool.query(
            `SELECT m.id, m.pharmacy_id, m.name, m.quantity, m.min_stock_level
             FROM medications m
             WHERE m.quantity <= m.min_stock_level AND m.quantity >= 0`
        );

        for (const med of res.rows) {
            const message = `Low stock: ${med.name} has only ${med.quantity} units (minimum: ${med.min_stock_level})`;
            await pool.query(
                `INSERT INTO alerts (pharmacy_id, message, type)
                 SELECT $1, $2, 'low_stock'
                 WHERE NOT EXISTS (
                     SELECT 1 FROM alerts
                     WHERE pharmacy_id = $1 AND message = $2 AND is_read = false
                 )`,
                [med.pharmacy_id, message]
            );
        }

        return res.rows.length;
    }

    static async getMyAlerts(pharmacyId) {
        const res = await pool.query(
            `SELECT * FROM alerts
             WHERE pharmacy_id = $1
             ORDER BY created_at DESC
             LIMIT 50`,
            [pharmacyId]
        );
        return res.rows;
    }

    static async markAsRead(pharmacyId, alertId) {
        const res = await pool.query(
            `UPDATE alerts SET is_read = true
             WHERE id = $1 AND pharmacy_id = $2
             RETURNING *`,
            [alertId, pharmacyId]
        );
        if (res.rowCount === 0) throw new Error('Alert not found');
        return res.rows[0];
    }

    static async markAllAsRead(pharmacyId) {
        await pool.query(
            'UPDATE alerts SET is_read = true WHERE pharmacy_id = $1 AND is_read = false',
            [pharmacyId]
        );
        return { success: true };
    }
}

module.exports = AlertService;
