const AuditService = require('../services/AuditService');

class AuditController {
    static async getLogs(req, res) {
        try {
            const { limit = 50, offset = 0 } = req.query;
            const pharmacyId = req.user.pharmacyId;
            const logs = await AuditService.getLogs(pharmacyId, parseInt(limit), parseInt(offset));
            res.json(logs);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = AuditController;
