const { query } = require('../config/db');

/**
 * Audit Service: Records critical actions for security and compliance.
 */
class AuditService {
    /**
     * Log an action to the audit_logs table.
     * @param {number} userId - The user performing the action.
     * @param {number} pharmacyId - The pharmacy context.
     * @param {string} action - Description of the action (e.g., 'SALE_CREATED', 'MED_UPDATED').
     * @param {string} entityType - e.g., 'sale', 'medication', 'batch'.
     * @param {number} entityId - The ID of the affected entity.
     * @param {object} details - Additional JSON details.
     */
    static async log(userId, pharmacyId, action, entityType = null, entityId = null, details = null) {
        try {
            const detailsStr = details ? JSON.stringify(details) : null;
            await query(`
                INSERT INTO audit_logs (user_id, pharmacy_id, action, entity_type, entity_id, details)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [userId, pharmacyId, action, entityType, entityId, detailsStr]);
        } catch (e) {
            console.error('Audit Log Error:', e);
        }
    }

    static async getLogs(pharmacyId, limit = 50, offset = 0) {
        const res = await query(`
            SELECT a.*, u.username as user_name
            FROM audit_logs a
            JOIN users u ON u.id = a.user_id
            WHERE a.pharmacy_id = ?
            ORDER BY a.created_at DESC
            LIMIT ?
        `, [pharmacyId, limit]);
        return res.rows;
    }
}

module.exports = AuditService;
