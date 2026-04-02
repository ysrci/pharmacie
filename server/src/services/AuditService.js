const pool = require('../db/pool');

/**
 * Audit Service — Records critical actions for security and compliance.
 * Fire-and-forget: errors are logged but never rethrown.
 */
class AuditService {
    /**
     * @param {number} userId
     * @param {number} pharmacyId
     * @param {string} action  e.g. 'SALE_COMPLETED', 'MED_UPDATED'
     * @param {string|null} entityType  e.g. 'medication', 'sale'
     * @param {number|null} entityId
     * @param {object|null} details  Stored as JSONB
     */
    static async log(userId, pharmacyId, action, entityType = null, entityId = null, details = null) {
        try {
            await pool.query(
                `INSERT INTO audit_logs (user_id, pharmacy_id, action, entity_type, entity_id, details)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [userId, pharmacyId, action, entityType, entityId, details ? JSON.stringify(details) : null]
            );
        } catch (e) {
            console.error('Audit Log Error:', e.message);
        }
    }

    static async getLogs(pharmacyId, limit = 50, offset = 0) {
        const res = await pool.query(
            `SELECT a.*, u.name AS user_name
             FROM audit_logs a
             JOIN users u ON u.id = a.user_id
             WHERE a.pharmacy_id = $1
             ORDER BY a.created_at DESC
             LIMIT $2 OFFSET $3`,
            [pharmacyId, limit, offset]
        );
        return res.rows;
    }
}

module.exports = AuditService;
