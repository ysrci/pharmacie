const AuditService = require('../services/AuditService');

class AuditController {
    static async getLogs(req, res, next) {
        try {
            const { limit = 50, offset = 0 } = req.query;
            const pharmacyId = req.user.pharmacyId;
            const logs = await AuditService.getLogs(pharmacyId, parseInt(limit), parseInt(offset));
            res.json(logs);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = AuditController;
