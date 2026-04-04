const AlertService = require('../services/AlertService');

class AlertController {
    static async getMyAlerts(req, res, next) {
        try {
            const pharmacyId = req.user.pharmacyId;
            const alerts = await AlertService.getMyAlerts(pharmacyId);
            res.json(alerts);
        } catch (error) {
            next(error);
        }
    }

    static async markAsRead(req, res, next) {
        try {
            const pharmacyId = req.user.pharmacyId;
            const { id } = req.params;
            await AlertService.markAsRead(pharmacyId, id);
            res.json({ success: true });
        } catch (error) {
            next(error);
        }
    }

    static async triggerCheck(req, res, next) {
        try {
            const count = await AlertService.checkExpiringMedications();
            res.json({ checked: true, found: count });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AlertController;
